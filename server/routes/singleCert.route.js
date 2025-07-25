import express from "express";
import { loadsingleCert, generateSingleCert } from "../controllers/singleCert.controller.js";

const router = express.Router();

// ** Middleware to check if user session exists **
router.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4(); // Assign a new user-specific ID
    req.session.userData = {}; // Store user-specific data here
    req.session.save(); // Explicitly save the session
    console.log(req.session.userId);
  }
  next();
});

// ** Route: Render the certificate page **
router.get("/", loadsingleCert);

// ** Route: Generate and Download Certificate **
router.post("/generate", generateSingleCert);

export default router;
