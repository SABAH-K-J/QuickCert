import path from "path";
import fs from "fs";
import { generateCertificate } from "../services/pdfGen.service.js";
import { templateConfig } from "../Config/templateConfig.js";
import { cleanupFolder } from "../services/cleanup.service.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const loadsingleCert =(req, res) => {
  try {
    res.render("singleCertificate");
    console.log("[INFO] Certificate page rendered successfully.");
  } catch (error) {
    console.error(
      `[ERROR] Failed to render certificate page: ${error.message}`
    );
    res
      .status(500)
      .send("An error occurred while loading the certificate page.");
  }
}


export const generateSingleCert = async (req, res) => {
  console.log("[INFO] Certificate generation request received.");
  console.log("[DEBUG] Request Body:", req.body);

  try {
    const userId = req.session.userId; // Retrieve user ID from session
    const templateName = req.session.userData[userId]?.selectedTemplate;
    const templatePath = path.join(
      __dirname,
      `../../output/${userId}/output1.png`
    ); // Template stored here
    const { participantName, eventDetails } = req.body;

    if (!participantName || !eventDetails || !templateName) {
      console.warn("[WARN] Missing participant name or event details.");
      return res
        .status(400)
        .json({ error: "Participant name and event details are required." });
    }

    console.log(`[INFO] User: ${userId}`);
    console.log(`[INFO] Template Path: ${templatePath}`);
    console.log(`[INFO] Participant: ${participantName}`);
    console.log(`[INFO] Event details: ${eventDetails}`);

    // ** Validate Template Existence **
    if (!fs.existsSync(templatePath)) {
      console.error("[ERROR] Template not found for user.");
      return res.status(400).json({ error: "No template found for the user." });
    }

    // ** Fetch template coordinates from config **
    const templateNumberMatch = templateName.match(/\/templates\/(\d+)\.png/);
    if (!templateNumberMatch) {
      console.error("[ERROR] Invalid template format.");
      return res.status(400).send("Invalid template selected.");
    }

    const templateNumber = templateNumberMatch[1]; // Assuming template config is standard for all users
    const coordinates = templateConfig[templateNumber];

    if (!coordinates) {
      console.error("[ERROR] No coordinates found for selected template.");
      return res.status(400).json({ error: "Invalid template selected." });
    }

    const {
      name,
      details,
      namefont,
      descrpfont,
      namefontSize,
      descrpfontSize,
      color,
    } = coordinates;

    // ** Define User-Specific Output Directory **
    const userOutputDir = path.join(
      __dirname,
      "..",
      "output",
      "userfile",
      userId
    );
    if (!fs.existsSync(userOutputDir)) {
      fs.mkdirSync(userOutputDir, { recursive: true });
    }

    // ** Generate Unique Certificate Filename **
    const certificateFileName = `${participantName}_${Date.now()}.pdf`;
    const certificatePath = path.join(userOutputDir, certificateFileName);

    // ** Prepare Data for Certificate Generation **
    const data = {
      name: participantName,
      templatePath: templatePath,
      nameX: name.x,
      nameY: name.y,
      detailsX: details.x,
      detailsY: details.y,
      eventDetails: eventDetails,
      color: color,
      nameFont: namefont,
      detailsFont: descrpfont,
      nameFontSize: namefontSize,
      detailsFontSize: descrpfontSize,
      userId: userId, // Ensure user-specific storage
    };

    console.log("[INFO] Initiating certificate generation...");
    const generatedPath = await generateCertificate(data);

    if (!fs.existsSync(generatedPath)) {
      console.error("[ERROR] Certificate generation failed.");
      return res.status(500).json({ error: "Certificate generation failed." });
    }

    console.log("[INFO] Certificate generated successfully at:", generatedPath);

    // ** Send File to User **
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${participantName}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(generatedPath, (err) => {
      if (err) {
        console.error("[ERROR] Error sending file:", err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error downloading file." });
        }
      } else {
        console.log("[INFO] Certificate sent successfully.");
        cleanupFolder(userOutputDir);
      }
    });
  } catch (error) {
    console.error(`[ERROR] Certificate generation failed: ${error.message}`);
    res
      .status(500)
      .json({ error: "An error occurred while generating the certificate." });
  }
}