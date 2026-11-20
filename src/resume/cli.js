import "dotenv/config";
import { extractResumeText } from "./resumeParser.js";
import { extractProfile } from "./profileExtractor.js";
import { preferences } from "../config/preferences.js";

async function main() {
  const resumePath = process.env.RESUME_PATH || "./data/resume.pdf";
  const resumeText = await extractResumeText(resumePath);
  const profile = extractProfile(resumeText, preferences);

  console.log("\nResume profile extracted successfully.\n");
  console.log(JSON.stringify(profile, null, 2));
}

main().catch((error) => {
  console.error(`Resume parsing failed: ${error.message}`);
  process.exitCode = 1;
});
