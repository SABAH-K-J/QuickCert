// Import necessary modules
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Configure storage for uploaded files
const storage = multer.diskStorage({
  // Set the destination for uploaded files
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads")); // Save files to the 'uploads' directory
  },
  // Set the filename for uploaded files
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Use a timestamp to ensure unique filenames
  },
});

// Configure the upload middleware
export const upload = multer({
  storage, // Use the configured storage
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
  fileFilter: (req, file, cb) => {
    // Allow only CSV files
    if (file.mimetype !== "text/csv") {
      console.warn(`[WARN] Unsupported file type: ${file.mimetype}`);
      cb(new Error("Only CSV files are allowed!"), false); // Reject non-CSV files
    } else {
      console.log(`[INFO] File accepted: ${file.originalname}`);
      cb(null, true); // Accept valid files
    }
  },
});

// Error handling middleware for upload issues
export const handleError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    console.error(`[ERROR] Multer error: ${err.message}`);
    res.status(400).send(`Upload error: ${err.message}`);
  } else if (err) {
    // Handle other errors
    console.error(`[ERROR] General upload error: ${err.message}`);
    res.status(400).send(`Error: ${err.message}`);
  } else {
    next(); // Pass control to the next middleware
  }
};

