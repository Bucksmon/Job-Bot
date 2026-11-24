import { extractKeywords } from "./analyzer.js";

const SECTION_ALIASES = {
  summary: ["professional summary", "summary", "profile", "professional profile", "objective", "career objective"],
  skills: ["skills", "technical skills", "key skills", "core skills", "core competencies", "areas of expertise", "technologies", "technical proficiencies"],
  experience: ["experience", "work experience", "professional experience", "employment history", "career history", "work history", "internship experience"],
  projects: ["projects", "selected projects", "academic projects", "personal projects", "key projects"],
  education: ["education", "educational background", "academic background", "academic qualifications"],
  certifications: ["certifications", "certificates", "licenses", "licences", "training", "courses", "professional development"],
  achievements: ["achievements", "awards", "honours", "honors", "accomplishments"],
  languages: ["languages", "language skills"],
  volunteer: ["volunteer experience", "volunteering", "community involvement"],
  publications: ["publications", "research", "research publications"],
  additional: ["additional information", "additional details", "interests", "activities", "other information"],
  references: ["references", "professional references"]
};

const TITLES = {
  summary: "Professional Summary",
  skills: "Skills & Tools",
  experience: "Professional Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications & Training",
  achievements: "Achievements",
  languages: "Languages",
  volunteer: "Volunteer Experience",
  publications: "Publications",
  additional: "Additional Information",
  references: "References"
};

function normalise(value) {
  return String(value || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

const HEADING_MAP = new Map(
  Object.entries(SECTION_ALIASES).flatMap(([key, values]) => values.map((value) => [normalise(value), key]))
);

export function parseResumeSections(resumeText = "") {
  const headerLines = [];
  const sections = [];
  let current = null;

  for (const rawLine of String(resumeText).split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, " ").trim();
    if (!line) continue;

    const heading = normalise(line.replace(/^#+\s*/, "").replace(/[:：]\s*$/, ""));
    const key = HEADING_MAP.get(heading);

    if (key) {
      current = { key, title: TITLES[key], lines: [] };
      sections.push(current);
    } else if (current) {
      const previous = current.lines[current.lines.length - 1];
      const continuation = previous &&
        /^[-•●▪◦*]\s+/.test(previous) &&
        !/^[-•●▪◦*]\s+/.test(line) &&
        !/\b(?:19|20)\d{2}\b/.test(line) &&
        !/^(?:professional )?(summary|profile|experience|education|skills|projects|certifications|achievements|languages)$/i.test(line);

      if (continuation) {
        current.lines[current.lines.length - 1] += " " + line;
      } else {
        current.lines.push(line);
      }
    } else {
      headerLines.push(line);
    }
  }

  return { headerLines, sections };
}

function isContact(line) {
  return /@|https?:\/\/|www\.|linkedin\.com|github\.com/i.test(line) ||
    /(?:\+?\d[\d\s().-]{6,}\d)/.test(line);
}

function isBullet(line) {
  return /^(?:[-*•●▪◦]|\d+[.)])\s+/.test(line.trim());
}

export function cleanResumeBullet(line) {
  return String(line || "").trim().replace(/^(?:[-*•●▪◦]|\d+[.)])\s+/, "").trim();
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

const SECTION_ORDER = {
  experience: 2,
  projects: 3,
  education: 4,
  certifications: 5,
  achievements: 6,
  languages: 7,
  volunteer: 8,
  publications: 9,
  additional: 10,
  references: 11
};

export function buildResumeModel(data) {
  const { headerLines, sections: sourceSections } = parseResumeSections(data.resumeText);
  const name = headerLines.find((line) => !isContact(line) && line.length <= 75) || "Resume";
  const contact = unique(headerLines.filter(isContact));
  const introLines = headerLines.filter((line) => line !== name && !isContact(line));

  const sourceSummary = sourceSections
    .filter((section) => section.key === "summary")
    .flatMap((section) => section.lines)
    .join(" ");

  const draft = String(data.summaryDraft || "").trim();
  const isOldPlaceholder = (value) =>
    /candidate targeting .+ add a concise summary of relevant experience/i.test(value) ||
    /add one specific, verifiable achievement/i.test(value);
  const summary = draft && !isOldPlaceholder(draft)
    ? draft
    : isOldPlaceholder(sourceSummary) ? "" : sourceSummary;
  const outputSections = [];

  if (summary) outputSections.push({ key: "summary", title: TITLES.summary, summary, lines: [] });

  if (introLines.length) {
    outputSections.push({ key: "profile", title: "Profile Details", lines: introLines });
  }

  const sourceSkillsText = sourceSections
    .filter((section) => section.key === "skills")
    .flatMap((section) => section.lines)
    .join(" ");

  const explicitSkills = new Set(extractKeywords(sourceSkillsText));
  const resumeSkills = new Set(
    Array.isArray(data.resumeKeywords) ? data.resumeKeywords : extractKeywords(data.resumeText)
  );

  // Promote only matched keywords already evidenced somewhere in the resume.
  const targetedSkills = unique(Array.isArray(data.matchedKeywords) ? data.matchedKeywords : [])
    .filter((keyword) => resumeSkills.has(keyword) && !explicitSkills.has(keyword))
    .slice(0, 14);

  if (targetedSkills.length) {
    outputSections.push({
      key: "targetedSkills",
      title: "Relevant Skills",
      skills: targetedSkills,
      lines: []
    });
  }

  for (const section of sourceSections) {
    if (section.key === "summary") continue;
    outputSections.push(section);
  }

  outputSections.sort((a, b) => {
    const order = (section) => {
      if (section.key === "summary") return 0;
      if (section.key === "profile") return 0.5;
      if (section.key === "targetedSkills" || section.key === "skills") return 1;
      return SECTION_ORDER[section.key] ?? 10;
    };
    return order(a) - order(b);
  });

  return {
    name,
    contact,
    targetRole: String(data.targetRole || "").trim(),
    sections: outputSections
  };
}

export function isResumeBullet(line) {
  return isBullet(line);
}
