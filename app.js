// Import required modules
import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import exphbs from "express-handlebars";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import { cleanupFolder } from "./server/services/cleanup.service.js";

// Import route handlers
import indexRouter from "./server/routes/index.route.js";
import certificateRouter from "./server/routes/multipleCert.route.js";
import editorRouter from "./server/routes/templateEditor.route.js";
import previewRouter from "./server/routes/previewCert.route.js";
import singleCertificateRouter from "./server/routes/singleCert.route.js";


const app = express();

import { fileURLToPath } from "url";

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure necessary folders exist (e.g., for file uploads and outputs)
const requiredDirs = ["uploads", "output", "server/templates"];
requiredDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created missing directory: ${fullPath}`);
  }
});

// Middleware setup
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/output", express.static(path.join(__dirname, "output")));
app.use(
  "/server/output",
  express.static(path.join(__dirname, "server/output"))
);
app.use("/fonts", express.static(path.join(__dirname, "public/fonts")));

// Configure session management
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false, // Set to false to avoid unnecessary sessions
    cookie: { maxAge: 46 * 60 * 1000 }, // Session expires in 30 minutes
  })
);

// Middleware to assign and persist a unique user ID per session
app.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4(); // Generate unique ID for the session
    req.session.userData = {}; // Initialize userData object
    req.session.save(); // Explicitly save the session
    // Set a timeout to clean up user-specific files after the session expires
    setTimeout(async () => {
      const userOutputDir = path.join(
        __dirname,
        "server",
        "output",
        "userfile",
        req.session.userId
      );
      const outputDir = path.join(__dirname, "output", req.session.userId);
      if (fs.existsSync(userOutputDir)) {
        await cleanupFolder(userOutputDir);
      }
      if (fs.existsSync(outputDir)) {
        await cleanupFolder(outputDir);
      }
      console.log(`Cleaned up files for session: ${req.session.userId}`);
    }, 45 * 60 * 1000); // 45 minutes
  }

  if (!req.session.userData[req.session.userId]) {
    req.session.userData[req.session.userId] = {}; // Ensure user-specific data storage
  }

  next();
});

// Set up the view engine (Handlebars)
app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: path.join(__dirname, "views/layouts"),
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// Define routes
app.use("/", indexRouter);
app.use("/multiple-certificate", certificateRouter);
app.use("/template-editor", editorRouter);
app.use("/preview-certificates", previewRouter);
app.use("/single-certificate", singleCertificateRouter);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404);
  res.render("error", { status: 404, error: "Page not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("error", { status: err.status || 500, error: err.message });
});

export default app;
