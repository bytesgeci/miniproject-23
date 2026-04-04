import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid data URL");
  }

  return {
    contentType: matches[1],
    base64Data: matches[2],
  };
}

/**
 * Creates a folder for the course code if it doesn't exist
 * and saves the file to that folder
 */
export async function saveCoursefile(
  courseCode: string,
  file: File,
): Promise<string> {
  try {
    // Sanitize course code to ensure valid folder name
    const sanitizedCourseCode = courseCode.replace(/[^a-zA-Z0-9-_]/g, "_");

    if (!sanitizedCourseCode) {
      throw new Error("Invalid course code");
    }

    // Define the base upload directory
    const baseUploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "course-files",
    );

    // Create the course code folder path
    const courseFolder = join(baseUploadDir, sanitizedCourseCode);

    // Create the base directory if it doesn't exist
    if (!existsSync(baseUploadDir)) {
      await mkdir(baseUploadDir, { recursive: true });
    }

    // Create the course code folder if it doesn't exist
    if (!existsSync(courseFolder)) {
      await mkdir(courseFolder, { recursive: true });
    }

    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = join(courseFolder, fileName);

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Return the public URL path
    return `/uploads/course-files/${sanitizedCourseCode}/${fileName}`;
  } catch (error) {
    console.error("Error saving course file:", error);
    throw new Error("Failed to save course file");
  }
}

/**
 * Validates a data URL and returns it for MongoDB-backed storage.
 * In this project, `courseFiles.json` is persisted in MongoDB by `jsonDb`.
 */
export async function saveDataUrlAsFile(
  _courseCode: string,
  _fileName: string,
  dataUrl: string,
): Promise<string> {
  try {
    parseDataUrl(dataUrl);
    return dataUrl;
  } catch (error) {
    console.error("Error validating data URL:", error);
    throw new Error("Failed to process file data");
  }
}
