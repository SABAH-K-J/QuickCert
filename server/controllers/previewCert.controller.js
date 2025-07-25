import fs from "fs";
import path from "path";
import archiver from "archiver";
import { cleanupFiles,cleanupFolder } from "../services/cleanup.service.js";
import { generatedData,generateCertificate } from "../services/pdfGen.service.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const loadpreviewCert = (req, res) => {
  const userId = req.session.userId;
  const userOutputDir = path.join(
    __dirname,
    "..",
    "output",
    "userfile",
    userId
  ); // Adjusted path

  // Ensure the directory exists
  if (!fs.existsSync(userOutputDir)) {
    console.warn(`[WARN] No directory found for user ${userId}`);
    return res.render("preview-certificates", { certificates: [] }); // Render an empty list
  }

  // Read the contents of the user's output directory
  fs.readdir(userOutputDir, (err, files) => {
    if (err) {
      console.error(
        `[ERROR] Reading output directory for user ${userId}: ${err.message}`
      );
      return res.status(500).send("Error fetching certificates.");
    }

    // Filter and map PDFs to their public URLs
    const certificates = files
      .filter((file) => file.endsWith(".pdf"))
      .map((file) => ({
        name: file,
        url: `/server/output/userfile/${userId}/${file}`, // Adjusted public URL
      }));

    console.log(
      `[DEBUG] Found ${certificates.length} certificates for user ${userId}`
    );
    res.render("preview-certificates", { certificates });
  });
}


export const downloadZip = async (req, res) => {
  const userId = req.session.userId;
  const userOutputDir = path.join(
    __dirname,
    "..",
    "output",
    "userfile",
    userId
  );

  try {
    if (!fs.existsSync(userOutputDir)) {
      console.warn(`[WARN] No output directory found for user ${userId}`);
      return res.status(404).send("No certificates available for download.");
    }

    const files = await fs.promises.readdir(userOutputDir);
    const pdfFiles = files.filter((file) => file.endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      console.warn(`[WARN] No PDF files found for user ${userId}`);
      return res.status(404).send("No certificates available for download.");
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    res.attachment("certificates.zip");
    archive.pipe(res);
    pdfFiles.forEach((file) => {
      const filePath = path.join(userOutputDir, file);
      archive.file(filePath, { name: file });
    });

    archive
      .finalize()
      .then(async () => {
        const templatePath = path.join(__dirname, "..", "..", "output", userId);
        await cleanupFolder(userOutputDir);
        await cleanupFolder(templatePath);
      })
      .catch((err) => {
        console.error(
          `[ERROR] Finalizing archive for user ${userId}: ${err.message}`
        );
        res.status(500).send("Error creating ZIP file.");
      });
  } catch (err) {
    console.error(`[ERROR] Creating ZIP for user ${userId}: ${err.message}`);
    res.status(500).send("Error creating ZIP file.");
  }
}


export const loadupdateCert =  (req, res) => {
  const userId = req.session.userId;
  const file = req.query.file.replace(".pdf", "");

  console.log(`[INFO] User ${userId} requested to fix: ${file}`);

  res.render("edit-certificate", { certificateName: file });
}


export const updateCert = async (req, res) => {
  const userId = req.session.userId;
  const { oldName, newName } = req.body;
  const userOutputDir = path.join(
    __dirname,
    "..",
    "output",
    "userfile",
    userId
  );
  const certificateData = generatedData[userId].find(
    (data) => data.name === oldName
  ); // Find the certificate data by old name

  if (!certificateData) {
    return res.status(404).send("Certificate data not found."); // Send error response if certificate data is not found
  }

  const updatedData = {
    ...certificateData,
    name: newName, // Update the name in the data
  };
  try {
    // Delete the old file
    const oldFilePath = path.join(userOutputDir, `${oldName}.pdf`);
    if (fs.existsSync(oldFilePath)) {
      await cleanupFiles(oldFilePath);
    }

    // Generate and save the new certificate
    await generateCertificate(updatedData);

    // Redirect to preview page after a short delay
    setTimeout(() => {
      res.redirect("/preview-certificates");
    }, 5000);
  } catch (err) {
    console.error(
      `[ERROR] Failed to update certificate for ${oldName}: ${err.message}`
    );
    res.status(500).send("Failed to update certificate.");
  }
}
