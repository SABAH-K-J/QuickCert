import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid"; // For unique filenames
import {loadTemplateEditor, saveCert, getFontList } from "../controllers/templateEditor.controller.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Middleware for parsing JSON payloads with a size limit
router.use(bodyParser.json({ limit: "50mb" }));

// Serve templates and fonts folder as static directories
router.use(
  "/templates",
  express.static(path.join(__dirname, "../server/templates"))
);


router.use(
  "/get-fonts",
  express.static(path.join(__dirname, "../../public/fonts"))
);

// Allow Cross-Origin Resource Sharing (CORS)
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Middleware to ensure userId is available in every request
router.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4(); // Generate a user-specific ID if not present
    req.session.userData = {}; // Store user-specific data here
    req.session.save(); // Explicitly save the session
  }
  next();
});

// Route: Render the template editor page
router.get("/", loadTemplateEditor);

// Route: Save uploaded PNG file and set template name in session
router.post("/save-png", upload.single("image"), saveCert);

// Route: Fetch font files from the public/fonts directory
router.get("/get-fonts", getFontList);

export default router;
