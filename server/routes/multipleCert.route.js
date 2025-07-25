import express from "express";
import { upload, handleError } from "../middleware/upload.middleware.js";
import { loadmultipleCert, generateMultipleCert } from "../controllers/multipleCert.controller.js";

const router = express.Router();

// Middleware to assign a unique user ID for each session
router.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4(); // Assign a new user-specific ID
    req.session.userData = {}; // Store user-specific data here
    req.session.save(); // Explicitly save the session
    console.log(req.session.userId);
  }
  next();
});

// Route: Render the certificate page
router.get("/", loadmultipleCert);

// Route: Handle certificate generation
router.post("/generate", upload.single("csvFile"), generateMultipleCert);

// Apply error handling middleware
router.use(handleError);

export default router;
