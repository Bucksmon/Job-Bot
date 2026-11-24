import path from "node:path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractResumeText(file) {
  if (!file?.buffer || !file.originalname) {
    throw new Error("Upload a PDF or DOCX resume.");
  }

  const extension = path.extname(file.originalname).toLowerCase();
  let text = "";

  if (extension === ".pdf") {
    const parsed = await pdfParse(file.buffer);
    text = parsed.text || "";
  } else if (extension === ".docx") {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    text = parsed.value || "";
  } else {
    throw new Error("Unsupported file type. Upload a PDF or DOCX resume.");
  }

  const cleanedText = text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (cleanedText.length < 80) {
    throw new Error("The resume appears empty or image-only. Upload a text-based PDF or DOCX.");
  }

  return cleanedText;
}
