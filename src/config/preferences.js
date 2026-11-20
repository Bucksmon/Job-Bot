// These are search preferences, not a second resume.
export const preferences = {
  location: process.env.JOB_LOCATION || "Dubai, United Arab Emirates",
  minimumMatchScore: Number(process.env.MIN_MATCH_SCORE || 70),
  maximumRequiredYears: Number(process.env.MAX_REQUIRED_YEARS || 3),
  jobTitles: (process.env.PREFERRED_JOB_TITLES || [
    "Full Stack Developer",
    "Backend Developer",
    "Junior Software Engineer",
    "JavaScript Developer",
    "Node.js Developer",
    "React Developer"
  ].join(","))
    .split(",")
    .map((title) => title.trim())
    .filter(Boolean)
};
