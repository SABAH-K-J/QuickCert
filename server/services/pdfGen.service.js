import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import csv from "fast-csv";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import os from "os";
import { fileURLToPath } from "url";

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let generatedData = {}; // Stores generated certificates' details
let templateCache = {}; // Cache for template images

/**
 * Generates certificates for participants from a CSV file with optimizations.
 * Includes verification to ensure all certificates are generated.
 */
export const generateCertificates = async (
  csvFilePath,
  templatePath,
  nameX,
  nameY,
  detailsX,
  detailsY,
  eventDetails,
  color,
  nameFont,
  detailsFont,
  nameFontSize,
  detailsFontSize,
  userId
) => {
  console.log(`[INFO] Reading CSV file for user: ${userId}`);
  console.time(`[TIMER] Certificate generation for user: ${userId}`);

  // Pre-load and cache the template image
  if (!templateCache[templatePath]) {
    templateCache[templatePath] = fs.readFileSync(templatePath);
    console.log(`[INFO] Template cached: ${templatePath}`);
  }


  // Pre-load and cache fonts
  const nameFontPath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "fonts",
    `${nameFont}.ttf`
  );
  const detailsFontPath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "fonts",
    `${detailsFont}.ttf`
  );

  if (!templateCache[nameFontPath]) {
    templateCache[nameFontPath] = fs.readFileSync(nameFontPath);
    console.log(`[INFO] Name font cached: ${nameFont}`);
  }

  if (!templateCache[detailsFontPath]) {
    templateCache[detailsFontPath] = fs.readFileSync(detailsFontPath);
    console.log(`[INFO] Details font cached: ${detailsFont}`);
  }
  templateCache = {};
  // Create output directory up front
  const userOutputDir = path.join(
    __dirname,
    "..",
    "output",
    "userfile",
    userId
  );
  if (!fs.existsSync(userOutputDir)) {
    fs.mkdirSync(userOutputDir, { recursive: true });
    console.log(`[INFO] Created output directory: ${userOutputDir}`);
  }

  // Parse CSV in a streaming fashion and collect all participants
  return new Promise((resolve, reject) => {
    const participants = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => {
        const nameColumn = Object.keys(row).find(
          (key) => key.toLowerCase() === "name"
        );
        const descriptionColumn = Object.keys(row).find(
          (key) => key.toLowerCase() === "description"
        );

        if (nameColumn && row[nameColumn]) {
          participants.push({
            name: row[nameColumn],
            description:
              descriptionColumn && row[descriptionColumn]
                ? row[descriptionColumn]
                : eventDetails,
          });
        } else {
          console.warn(
            `[WARN] Row missing name column: ${JSON.stringify(row)}`
          );
        }
      })
      .on("end", async () => {
        console.log(
          `[INFO] Found ${participants.length} participants for user: ${userId}`
        );

        if (participants.length === 0) {
          reject(new Error("No participants found in CSV."));
          return;
        }

        try {
          if (!generatedData[userId]) {
            generatedData[userId] = [];
          }

          // Track all participants for verification
          const allParticipantNames = new Set(participants.map((p) => p.name));
          console.log(
            `[INFO] Total unique participant names: ${allParticipantNames.size}`
          );

          // Use fewer workers for better stability (max 4 cores or half available cores)
          const numCPUs = os.cpus().length;
          const workerCount = Math.max(
            1,
            Math.min(participants.length, Math.min(4, Math.floor(numCPUs / 2)))
          );
          const batchSize = Math.ceil(participants.length / workerCount);

          console.log(
            `[INFO] Using ${workerCount} worker threads with batch size ${batchSize}`
          );

          const batches = [];
          for (let i = 0; i < participants.length; i += batchSize) {
            batches.push(participants.slice(i, i + batchSize));
          }

          // Record which participants were assigned to which worker
          const workerAssignments = {};
          batches.forEach((batch, index) => {
            workerAssignments[index] = batch.map((p) => p.name);
          });

          const workerPromises = batches.map((batch, index) => {
            return new Promise((resolveWorker, rejectWorker) => {
              const worker = new Worker(__filename, {
                workerData: {
                  batch,
                  templatePath,
                  nameX,
                  nameY,
                  detailsX,
                  detailsY,
                  eventDetails,
                  color,
                  nameFont,
                  detailsFont,
                  nameFontSize,
                  detailsFontSize,
                  userId,
                  userOutputDir,
                  workerId: index,
                },
              });

              worker.on("message", (data) => {
                console.log(
                  `[INFO] Worker ${index} completed with ${data.length}/${batch.length} certificates`
                );
                generatedData[userId] = [...generatedData[userId], ...data];
                resolveWorker();
              });

              worker.on("error", (err) => {
                console.error(
                  `[ERROR] Worker ${index} encountered an error: ${err.message}`
                );
                rejectWorker(err);
              });

              worker.on("exit", (code) => {
                if (code !== 0) {
                  const error = new Error(
                    `Worker ${index} stopped with exit code ${code}`
                  );
                  console.error(`[ERROR] ${error.message}`);
                  rejectWorker(error);
                }
              });
            });
          });

          await Promise.all(workerPromises).catch(async (err) => {
            console.error(`[ERROR] Some workers failed: ${err.message}`);
            // Don't reject yet, we'll check what was missed
          });

          // Verify all certificates were generated
          const generatedNames = new Set(
            generatedData[userId].map((item) => item.name)
          );
          console.log(
            `[INFO] Generated certificates: ${generatedNames.size}/${allParticipantNames.size}`
          );

          // Find missing certificates
          const missingNames = [...allParticipantNames].filter(
            (name) => !generatedNames.has(name)
          );

          if (missingNames.length > 0) {
            console.warn(
              `[WARN] Missing ${missingNames.length} certificates. Generating them sequentially.`
            );

            // Generate missing certificates sequentially as fallback
            for (const name of missingNames) {
              try {
                const participant = participants.find((p) => p.name === name);
                if (participant) {
                  console.log(`[RECOVERY] Generating certificate for: ${name}`);
                  await generateSingleCertificate({
                    name: participant.name,
                    templatePath,
                    nameX,
                    nameY,
                    detailsX,
                    detailsY,
                    eventDetails: participant.description,
                    color,
                    nameFont,
                    detailsFont,
                    nameFontSize,
                    detailsFontSize,
                    userId,
                    outputDir: userOutputDir,
                  });

                  generatedData[userId].push({
                    name: participant.name,
                    templatePath,
                    nameX,
                    nameY,
                    detailsX,
                    detailsY,
                    eventDetails: participant.description,
                    color,
                    nameFont,
                    detailsFont,
                    nameFontSize,
                    detailsFontSize,
                    userId,
                  });
                }
              } catch (err) {
                console.error(
                  `[ERROR] Recovery generation failed for ${name}: ${err.message}`
                );
              }
            }
            // Final verification
            const finalGeneratedNames = new Set(
              generatedData[userId].map((item) => item.name)
            );
            const finalMissingNames = [...allParticipantNames].filter(
              (name) => !finalGeneratedNames.has(name)
            );

            if (finalMissingNames.length > 0) {
              console.error(
                `[ERROR] Still missing ${
                  finalMissingNames.length
                } certificates: ${finalMissingNames.join(", ")}`
              );
            } else {
              console.log(
                `[SUCCESS] All certificates recovered and generated successfully!`
              );
            }
          }

          console.timeEnd(`[TIMER] Certificate generation for user: ${userId}`);
          resolve(generatedData[userId]);
        } catch (err) {
          console.error(
            `[ERROR] Certificate generation failed: ${err.message}`
          );
          reject(err);
        }
      })
      .on("error", (err) => {
        console.error(`[ERROR] Failed to read CSV file: ${err.message}`);
        reject(new Error("Error processing the CSV file."));
      });
  });
};

/**
 * Helper function to generate a single certificate, used for recovery
 */
export const generateSingleCertificate = async (data) => {
  return new Promise((resolve, reject) => {
    const {
      name,
      templatePath,
      nameX,
      nameY,
      detailsX,
      detailsY,
      eventDetails,
      color,
      nameFont,
      detailsFont,
      nameFontSize,
      detailsFontSize,
      userId,
      outputDir,
    } = data;

    try {
      // Use cached template
      const templateBuffer =
        templateCache[templatePath] || fs.readFileSync(templatePath);

      // Use cached fonts or read from disk
      const nameFontPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "fonts",
        `${nameFont}.ttf`
      );
      const detailsFontPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "fonts",
        `${detailsFont}.ttf`
      );

      const outputPath = path.join(outputDir, `${name}.pdf`);

      const doc = new PDFDocument({
        layout: "landscape",
        size: "A4",
        bufferPages: true,
      });

      const stream = fs.createWriteStream(outputPath, {
        highWaterMark: 1024 * 1024,
      });

      doc.pipe(stream);
      doc.image(templateBuffer, 0, 0, { width: 845 });

      doc
        .fontSize(nameFontSize || 40)
        .font(nameFontPath)
        .fillColor(color)
        .text(name, nameX, nameY, { align: "center" });

      doc
        .fontSize(detailsFontSize || 15)
        .font(detailsFontPath)
        .fillColor(color)
        .text(eventDetails, detailsX, detailsY, {
          align: "center",
          width: 600,
        });

      doc.end();

      stream.on("finish", () => {
        console.log(
          `[RECOVERY] Certificate successfully generated for: ${name}`
        );
        resolve(outputPath);
      });

      stream.on("error", (err) => {
        console.error(`[ERROR] Recovery file writing error: ${err.message}`);
        reject(err);
      });
    } catch (err) {
      console.error(
        `[ERROR] Recovery certificate generation failed: ${err.message}`
      );
      reject(err);
    }
  });
};

/**
 * Worker thread function to generate certificates in parallel
 */
if (!isMainThread) {
  const {
    batch,
    templatePath,
    nameX,
    nameY,
    detailsX,
    detailsY,
    eventDetails,
    color,
    nameFont,
    detailsFont,
    nameFontSize,
    detailsFontSize,
    userId,
    userOutputDir,
    workerId,
  } = workerData;

  const generateBatch = async () => {
    console.log(
      `[WORKER ${workerId}] Starting batch processing of ${batch.length} certificates`
    );

    const results = [];
    const successfulNames = [];
    const failedNames = [];

    try {
      const templateBuffer = fs.readFileSync(templatePath);
      const nameFontPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "fonts",
        `${nameFont}.ttf`
      );
      const detailsFontPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "fonts",
        `${detailsFont}.ttf`
      );

      for (const participant of batch) {
        try {
          const outputPath = path.join(
            userOutputDir,
            `${participant.name}.pdf`
          );

          const doc = new PDFDocument({
            layout: "landscape",
            size: "A4",
            bufferPages: true,
          });

          const stream = fs.createWriteStream(outputPath, {
            highWaterMark: 1024 * 1024,
          });

          doc.pipe(stream);
          doc.image(templateBuffer, 0, 0, { width: 845 });

          doc
            .fontSize(nameFontSize || 40)
            .font(nameFontPath)
            .fillColor(color)
            .text(participant.name, nameX, nameY, { align: "center" });

          doc
            .fontSize(detailsFontSize || 15)
            .font(detailsFontPath)
            .fillColor(color)
            .text(participant.description || eventDetails, detailsX, detailsY, {
              align: "center",
              width: 600,
            });

          doc.end();

          await new Promise((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
          });

          results.push({
            name: participant.name,
            templatePath,
            nameX,
            nameY,
            detailsX,
            detailsY,
            eventDetails: participant.description,
            color,
            nameFont,
            detailsFont,
            nameFontSize,
            detailsFontSize,
            userId,
          });

          successfulNames.push(participant.name);
          console.log(
            `[WORKER ${workerId}] Certificate generated for: ${participant.name}`
          );
        } catch (err) {
          failedNames.push(participant.name);
          console.error(
            `[WORKER ${workerId}] Error generating certificate for ${participant.name}: ${err.message}`
          );
        }
      }
    } catch (err) {
      console.error(
        `[WORKER ${workerId}] Critical error in batch processing: ${err.message}`
      );
    }

    console.log(
      `[WORKER ${workerId}] Completed ${successfulNames.length}/${batch.length} certificates. Failed: ${failedNames.length}`
    );
    parentPort.postMessage(results);
  };

  generateBatch().catch((err) => {
    console.error(
      `[WORKER ${workerId}] Batch processing failed: ${err.message}`
    );
    // Send empty results instead of crashing
    parentPort.postMessage([]);
  });
}

/**
 * Legacy function for backward compatibility
 */
export const generateCertificate = async (data) => {
  return generateSingleCertificate({
    ...data,
    outputDir: path.join(__dirname, "..", "output", "userfile", data.userId),
  });
};


