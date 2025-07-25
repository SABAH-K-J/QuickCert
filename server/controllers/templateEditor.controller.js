import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid"; // For unique filenames
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const loadTemplateEditor = (req, res) => {
  try {
    res.render("template-editor", {
      title: "Template Editor",
      userId: req.session.userId,
    });
    console.log(
      `[INFO]: Template editor page rendered for User: ${req.session.userId}`
    );
  } catch (error) {
    console.error(
      `[ERROR]: Failed to render template editor page - ${error.message}`
    );
    res
      .status(500)
      .send("An error occurred while loading the template editor page.");
  }
}


export const saveCert = async (req, res) => {
  try {
    const userId = req.session.userId; // Get user-specific ID
    const userDir = path.join(__dirname, `../../output/${userId}`); // Create a directory per user

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true }); // Ensure user-specific directory exists
    }

    const tempPath = req.file.path; // Temporary path of the uploaded file
    const outputPath = path.join(userDir, "output1.png"); // User-specific file path
    const templateName = req.body.templateName; // Extract template name

    if (!templateName) {
      console.warn("[WARN]: No template name provided");
      return res.status(400).send("No template name provided.");
    }

    // Move the uploaded file to the user's output directory
    fs.rename(tempPath, outputPath, (err) => {
      if (err) {
        console.error(`[ERROR]: Failed to save PNG - ${err.message}`);
        return res.status(500).send("Failed to save PNG.");
      }

      // Store the selected template in user-specific session data
      req.session.userData[userId] = req.session.userData[userId] || {};
      req.session.userData[userId].selectedTemplate = templateName;

      console.log(
        `[INFO]: PNG saved successfully for User: ${userId} at ${outputPath}`
      );
      console.log(`[INFO]: Selected Template Name: ${templateName}`);
      res.send("PNG saved successfully.");
    });
  } catch (error) {
    console.error(
      `[ERROR]: An error occurred while saving PNG - ${error.message}`
    );
    res.status(500).send("An unexpected error occurred.");
  }
}


export const getFontList = (req, res) => {
  const fontsPath = path.join(__dirname, "../../public/fonts");

  fs.readdir(fontsPath, (err, files) => {
    if (err) {
      console.error(`[ERROR]: Failed to read fonts directory - ${err.message}`);
      return res.status(500).send("Failed to load fonts.");
    }

    const fonts = files
      .filter((file) => /\.(ttf|otf|woff|woff2)$/i.test(file))
      .map((file) => ({
        name: path.parse(file).name,
        url: `/fonts/${file}`,
      }));

    res.json(fonts);
  });
}