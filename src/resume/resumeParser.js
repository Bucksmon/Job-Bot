import fs from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Read the resume locally. The file is never uploaded by this module.
export async function extractResumeText(filePath) {
  if (!filePath) {
    throw new Error("Resume path is missing. Set RESUME_PATH in your .env file.");
  }

  const absolutePath = path.resolve(filePath);
  const fileBuffer = await fs.readFile(absolutePath);
  const extension = path.extname(absolutePath).toLowerCase();

  let text;

  if (extension === ".pdf") {
    const result = await pdfParse(fileBuffer);
    text = result.text;
  } else if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    text = result.value;
  } else {
    throw new Error("Unsupported resume format. Please use PDF or DOCX.");
  }

  const cleanedText = text.replace(/\s+/g, " ").trim();

  if (!cleanedText) {
    throw new Error("No readable text was found in the resume.");
  }

  return cleanedText;
}
