import { promises as fs } from 'fs'; // Promise-based file system operations
import path from "path"; // Module for handling and transforming file paths
import { fileURLToPath } from "url";

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deletes the specified file from the file system.
 *
 * @param {string} filePath - The path to the file to be deleted.
 * @returns {Promise<boolean>} - Resolves to true if the file was deleted successfully, otherwise false.
 */
export const cleanupFiles = async (filePath) => {
  try {
    await fs.unlink(filePath); // Attempt to delete the file
    console.log(`[INFO]: Successfully deleted file - Path: ${filePath}`);
    return true; // Return true if deletion is successful
  } catch (error) {
    console.error(
      `[ERROR]: Failed to delete file - Path: ${filePath}, Error: ${error.message}`
    );
    return false; // Return false if an error occurs
  }
};

/**
 * Deletes all files in the specified directory.
 *
 * @param {string} directoryPath - The path to the directory whose files are to be deleted.
 * @returns {Promise<void>} - Resolves when all files in the directory are deleted.
 */
export const cleanupAllFiles = async (directoryPath) => {
  try {
    const files = await fs.readdir(directoryPath); // Read the directory to get the list of files
    const deletePromises = files.map((file) =>
      fs.unlink(path.join(directoryPath, file))
    ); // Create an array of promises to delete each file
    await Promise.all(deletePromises); // Wait for all file deletions to complete
    console.log(
      `[INFO]: Successfully deleted all files in directory - Path: ${directoryPath}`
    );
  } catch (error) {
    console.error(
      `[ERROR]: Failed to delete files in directory - Path: ${directoryPath}, Error: ${error.message}`
    );
    throw error; // Re-throw the error to be handled by the caller
  }
};

/**
 * Deletes the specified folder and all its contents.
 *
 * @param {string} folderPath - The path to the folder to be deleted.
 * @returns {Promise<void>} - Resolves when the folder and its contents are deleted.
 */
export const cleanupFolder = async (folderPath) => {
  try {
    await fs.rm(folderPath, { recursive: true, force: true }); 
    console.log(`[INFO]: Successfully deleted folder - Path: ${folderPath}`);
  } catch (error) {
    console.error(
      `[ERROR]: Failed to delete folder - Path: ${folderPath}, Error: ${error.message}`
    );
    throw error; // Re-throw the error to be handled by the caller
  }
};
// Export the functions for use in other modules
