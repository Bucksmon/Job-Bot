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

function isWordCharacter(character) {
  return Boolean(character) && /[a-z0-9+#]/i.test(character);
}

function containsTerm(text, term) {
  let index = text.indexOf(term);

  while (index !== -1) {
    const before = text[index - 1] || "";
    const after = text[index + term.length] || "";

    if (!isWordCharacter(before) && !isWordCharacter(after)) {
      return true;
    }

    index = text.indexOf(term, index + 1);
  }

  return false;
}

export function extractProfile(resumeText, preferences) {
  const normalizedText = resumeText.toLowerCase();

  const skills = Object.entries(skillAliases)
    .filter(([, aliases]) =>
      aliases.some((alias) => containsTerm(normalizedText, alias.toLowerCase()))
    )
    .map(([skill]) => skill);

  return {
    skills,
    preferredTitles: preferences.jobTitles,
    location: preferences.location,
    minimumMatchScore: preferences.minimumMatchScore,
    maximumRequiredYears: preferences.maximumRequiredYears
  };
}
