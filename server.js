import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { extractResumeDocument, buildResumeAudit } from "./lib/resumeParser.js";
import { analyzeResume } from "./lib/analyzer.js";
import { searchEmployerJobs } from "./lib/jobSearch.js";

const app = express();
// Render sits behind one trusted reverse proxy; this enables correct client IP rate limiting.
app.set("trust proxy", 1);
const port = Number(process.env.PORT || 10000);
const maxUploadMb = Math.max(1, Number(process.env.MAX_UPLOAD_MB || 8));

const allowedOrigins = (process.env.FRONTEND_ORIGINS ||
  "https://bucksmon.github.io,http://localhost:5500,http://127.0.0.1:5500")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("This website origin is not allowed to use the API."));
  }
}));
app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a few minutes and try again." }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadMb * 1024 * 1024,
    files: 1
  },
  fileFilter(_request, file, callback) {
    const extensionAllowed = /\.(pdf|docx|doc)$/i.test(file.originalname || "");
    callback(extensionAllowed ? null : new Error("Only PDF, DOCX, and DOC resumes are supported."), extensionAllowed);
  }
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "ats-resume-matcher" });
});

app.get("/api/jobs", apiLimiter, async (request, response, next) => {
  try {
    const query = String(request.query.q || "").trim().slice(0, 100);
    const location = String(request.query.location || "Dubai, UAE").trim().slice(0, 100);
    const result = await searchEmployerJobs({ query, location, limit: 40 });
    response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/analyze", apiLimiter, upload.single("resume"), async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: "Upload your resume first." });
    }

    const jobDescription = String(request.body.jobDescription || "").trim();
    const jobTitle = String(request.body.jobTitle || "").trim();

    if (jobDescription.length < 100) {
      return response.status(400).json({
        error: "Paste a job description containing at least 100 characters."
      });
    }

    if (jobDescription.length > 30000) {
      return response.status(400).json({
        error: "The job description must be shorter than 30,000 characters."
      });
    }

    const resumeDocument = await extractResumeDocument(request.file);
    const resumeText = resumeDocument.text;
    const analysis = analyzeResume({ resumeText, jobDescription, jobTitle });

    return response.json({
      analysis,
      resumeAudit: buildResumeAudit(resumeDocument)
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return response.status(413).json({
      error: `Resume exceeds the ${maxUploadMb} MB upload limit.`
    });
  }

  const status = error.message?.includes("origin is not allowed") ? 403 : 400;
  response.status(status).json({
    error: error.message || "Something went wrong while processing the request."
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ATS Resume Matcher API listening on port ${port}`);
});
