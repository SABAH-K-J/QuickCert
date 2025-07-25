import path from "path";
import fs from "fs";
import { generateCertificates,generatedData } from "../services/pdfGen.service.js";
import { cleanupFiles, cleanupAllFiles } from "../services/cleanup.service.js";
import { templateConfig } from "../Config/templateConfig.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const loadmultipleCert = (req, res) => {
  try {
    res.render("multipleCertificate", { userId: req.session.userId }); // Pass userId to template
    console.log(
      `[INFO]: Certificate page loaded for User: ${req.session.userId}`
    );
  } catch (error) {
    console.error(
      `[ERROR]: Failed to load certificate page - ${error.message}`
    );
    res
      .status(500)
      .send("An error occurred while loading the certificate page.");
  }
}

export const generateMultipleCert = async (req, res) => {
  console.log("[INFO] Received request to generate certificates.");

  const userId = req.session.userId; // Retrieve user session ID
  const userOutputDir = path.join(
    __dirname,
    "..",
    "output",
    "userfile",
    userId
  ); // User-specific output directory
  if (generatedData[userId]) {
    generatedData[userId].length = 0;
    console.log(`[INFO]: GeneratedData Array for ${userId} Has been Cleared`);
  }
  // Ensure user-specific directory exists
  if (!fs.existsSync(userOutputDir)) {
    fs.mkdirSync(userOutputDir, { recursive: true });
  }

  await cleanupAllFiles(userOutputDir); // Remove old files before generating new ones

  try {
    const templateName = req.session.userData[userId]?.selectedTemplate; // Retrieve selected template from userData
    const { eventDetails } = req.body;

    if (!templateName || !eventDetails) {
      console.warn("[WARN] Missing template name or event details.");
      return res
        .status(400)
        .send("Template name and event details are required.");
    }

    console.log(`[INFO] Using template: ${templateName}`);
    console.log(`[INFO] Event details: ${eventDetails}`);

    // Extract template number from file path
    const templateNumberMatch = templateName.match(/\/templates\/(\d+)\.png/);
    if (!templateNumberMatch) {
      console.error("[ERROR] Invalid template format.");
      return res.status(400).send("Invalid template selected.");
    }

    const templateNumber = templateNumberMatch[1];
    const coordinates = templateConfig[templateNumber];

    if (!coordinates) {
      console.error("[ERROR] No coordinates found for the selected template.");
      return res.status(400).send("Invalid template selected.");
    }

    // Extract coordinate settings from templateConfig
    const {
      name,
      details,
      namefont,
      descrpfont,
      namefontSize,
      descrpfontSize,
      color,
    } = coordinates;
    const csvFilePath = req.file.path;

    // Ensure user-specific template exists
    const userDir = path.join(__dirname, `../../output/${userId}`);
    const templatePath = path.join(userDir, "output1.png");
    if (!fs.existsSync(templatePath)) {
      console.error("[ERROR] User-specific template not found.");
      return res
        .status(400)
        .send("Template not found. Please upload a template first.");
    }

    console.log("[INFO] Initiating certificate generation...");

    // ** Pass `userId` to ensure user-specific storage **
    const generatedFiles = await generateCertificates(
      csvFilePath,
      templatePath,
      name.x,
      name.y,
      details.x,
      details.y,
      eventDetails,
      color,
      namefont,
      descrpfont,
      namefontSize,
      descrpfontSize,
      userId // Pass userId to store files separately
    );

    console.log(
      `[INFO] Certificates generated successfully for User: ${userId}`
    );
    res.send({
      message: "Certificates created successfully!",
      files: generatedFiles,
    });

    // Clean up uploaded CSV file after processing
    const cleanupResult = await cleanupFiles(csvFilePath);
    if (!cleanupResult) {
      console.warn("[WARN] Failed to remove temporary CSV file.");
    }
  } catch (error) {
    if (req.file && req.file.path) {
      await cleanupFiles(req.file.path);
    }
    console.error(`[ERROR] Certificate generation failed: ${error.message}`);
    res.status(500).send("An error occurred while generating certificates.");
  }
}