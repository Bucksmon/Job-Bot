// A small keyword dictionary is enough for the first version.
// Add or remove skills here as the resume parser is tested.
const skillAliases = {
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  React: ["react", "react.js"],
  "React Native": ["react native"],
  "Node.js": ["node.js", "nodejs", "node"],
  "Express.js": ["express.js", "express"],
  MongoDB: ["mongodb"],
  Python: ["python"],
  Java: ["java"],
  "C++": ["c++"],
  HTML: ["html"],
  CSS: ["css"],
  SQL: ["sql", "mysql", "postgresql", "postgres"],
  Firebase: ["firebase"],
  Git: ["git", "github"],
  Docker: ["docker"],
  AWS: ["aws", "amazon web services"],
  "REST APIs": ["rest api", "restful api", "rest apis"],
  Expo: ["expo"],
  "Tailwind CSS": ["tailwind", "tailwind css"],
  "Next.js": ["next.js", "nextjs"]
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function containsTerm(text, term) {
  const escaped = escapeRegExp(term.toLowerCase());

  // Treat punctuation (like a period at the end of a sentence) as a word boundary.
  const expression = new RegExp(`(^|[^a-z0-9+#])${escaped}($|[^a-z0-9+#])`, "i");
  return expression.test(text);
}

export function extractProfile(resumeText, preferences) {
  const normalizedText = resumeText.toLowerCase();

  const skills = Object.entries(skillAliases)
    .filter(([, aliases]) => aliases.some((alias) => containsTerm(normalizedText, alias)))
    .map(([skill]) => skill);

  return {
    skills,
    preferredTitles: preferences.jobTitles,
    location: preferences.location,
    minimumMatchScore: preferences.minimumMatchScore,
    maximumRequiredYears: preferences.maximumRequiredYears
  };
}
