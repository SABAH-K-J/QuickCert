import express from "express";
import { loadpreviewCert, downloadZip, updateCert, loadupdateCert } from "../controllers/previewCert.controller.js";
const router = express.Router();

// Middleware to ensure userId is available in every request
router.use((req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(403)
      .send("User session not found. Please start a new session.");
  }
  next();
});

/**
 * Route: GET /
 * Description: Fetches the list of PDF certificates in the user's output directory and renders them for preview.
 */
router.get("/", loadpreviewCert);

/**
 * Route: GET /download-zip
 * Description: Compresses all user-specific PDF certificates into a ZIP file and sends it to the user.
 */
router.get("/download-zip", downloadZip);

// Route to render the certificate edit page
router.get("/fix", loadupdateCert);

// Route to update the certificate
router.post("/fix", updateCert);

export default router;
