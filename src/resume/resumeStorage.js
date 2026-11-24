import fs from "node:fs/promises";
import path from "node:path";

export async function saveResumeBuffer(buffer, originalName) {
  const extension = path.extname(originalName || "").toLowerCase();

  if (![".pdf", ".docx"].includes(extension)) {
    throw new Error("Upload a PDF or DOCX resume.");
  }

  const directory = process.env.RESUME_DIRECTORY ||
    path.dirname(path.resolve(process.env.RESUME_PATH || "./data/resume.pdf"));
  const destination = path.join(directory, `resume${extension}`);
  const metadataPath = process.env.RESUME_METADATA_PATH ||
    path.join(directory, "resume-meta.json");

  await fs.mkdir(directory, { recursive: true });

  const temporaryPath = `${destination}.tmp`;
  await fs.writeFile(temporaryPath, buffer);
  await fs.rename(temporaryPath, destination);

  // Remove the other format so the stored profile cannot accidentally use an old CV.
  const otherExtension = extension === ".pdf" ? ".docx" : ".pdf";
  await fs.rm(path.join(directory, `resume${otherExtension}`), { force: true });

  await fs.writeFile(
    metadataPath,
    JSON.stringify({
      path: destination,
      originalName,
      updatedAt: new Date().toISOString()
    }, null, 2),
    "utf8"
  );

  process.env.RESUME_PATH = destination;
  return destination;
}

export async function getResumePath() {
  const metadataPath = process.env.RESUME_METADATA_PATH ||
    path.join(
      process.env.RESUME_DIRECTORY || path.dirname(path.resolve(process.env.RESUME_PATH || "./data/resume.pdf")),
      "resume-meta.json"
    );

  try {
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
    if (metadata.path) return metadata.path;
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error(`Could not read resume metadata: ${error.message}`);
    }
  }

  return process.env.RESUME_PATH || "./data/resume.pdf";
}
