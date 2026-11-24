import {
  Document,
  Packer,
  Paragraph,
  TextRun
} from "docx";

const SECTION_ALIASES = {
  summary: {
    title: "Professional Summary",
    names: ["professional summary", "summary", "profile", "professional profile", "objective", "career objective"]
  },
  skills: {
    title: "Skills & Tools",
    names: ["skills", "technical skills", "key skills", "core skills", "core competencies", "areas of expertise", "technologies", "technical proficiencies"]
  },
  experience: {
    title: "Professional Experience",
    names: ["experience", "work experience", "professional experience", "employment history", "career history", "work history", "internship experience"]
  },
  projects: {
    title: "Projects",
    names: ["projects", "selected projects", "academic projects", "personal projects", "key projects"]
  },
  education: {
    title: "Education",
    names: ["education", "educational background", "academic background", "academic qualifications"]
  },
  certifications: {
    title: "Certifications & Training",
    names: ["certifications", "certificates", "licenses", "licences", "training", "courses", "professional development"]
  },
  achievements: {
    title: "Achievements",
    names: ["achievements", "awards", "honours", "honors", "accomplishments"]
  },
  languages: {
    title: "Languages",
    names: ["languages", "language skills"]
  },
  volunteer: {
    title: "Volunteer Experience",
    names: ["volunteer experience", "volunteering", "community involvement"]
  },
  publications: {
    title: "Publications",
    names: ["publications", "research", "research publications"]
  },
  interests: {
    title: "Additional Information",
    names: ["additional information", "additional details", "interests", "activities", "other information"]
  },
  references: {
    title: "References",
    names: ["references", "professional references"]
  }
};

function normaliseHeading(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SECTION_LOOKUP = new Map(
  Object.entries(SECTION_ALIASES).flatMap(([key, definition]) =>
    definition.names.map((name) => [normaliseHeading(name), { key, title: definition.title }])
  )
);

function detectSectionHeading(line) {
  const candidate = line
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/[:：]\s*$/, "");

  if (!candidate || candidate.length > 65) return null;
  return SECTION_LOOKUP.get(normaliseHeading(candidate)) || null;
}

function isContactLine(line) {
  return /@|https?:\/\/|www\.|linkedin\.com|github\.com/i.test(line) ||
    /(?:\+?\d[\d\s().-]{6,}\d)/.test(line);
}

function isBulletLine(line) {
  return /^(?:[-*•●▪◦]|\d+[.)])\s+/.test(line.trim());
}

function cleanBullet(line) {
  return line.trim().replace(/^(?:[-*•●▪◦]|\d+[.)])\s+/, "").trim();
}

export function parseResumeSections(resumeText = "") {
  const headerLines = [];
  const sections = [];
  let currentSection = null;

  for (const rawLine of String(resumeText).split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, " ").trim();
    if (!line) continue;

    const heading = detectSectionHeading(line);
    if (heading) {
      currentSection = { ...heading, lines: [] };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.lines.push(line);
    } else {
      headerLines.push(line);
    }
  }

  return { headerLines, sections };
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
  interests: 10,
  references: 11
};

export function buildResumeModel(data) {
  const { headerLines, sections: sourceSections } = parseResumeSections(data.resumeText);
  const name = headerLines.find((line) => !isContactLine(line) && line.length <= 70) || "";
  const contact = unique(headerLines.filter(isContactLine));
  const introLines = headerLines.filter((line) => line !== name && !isContactLine(line));

  const originalSummary = sourceSections
    .filter((section) => section.key === "summary")
    .flatMap((section) => section.lines);
  const summary = String(data.summaryDraft || "").trim() || originalSummary.join(" ").trim();

  const outputSections = [];
  if (summary) {
    outputSections.push({ key: "summary", title: "Professional Summary", summary, lines: [] });
  }

  if (introLines.length) {
    outputSections.push({
      key: "profile",
      title: "Profile Details",
      lines: introLines
    });
  }

  const hasSourceSkillsSection = sourceSections.some((section) => section.key === "skills");
  const relevantSkills = hasSourceSkillsSection ? [] : unique([
    ...(Array.isArray(data.matchedKeywords) ? data.matchedKeywords : []),
    ...(Array.isArray(data.resumeKeywords) ? data.resumeKeywords : [])
  ]);

  if (relevantSkills.length) {
    outputSections.push({
      key: "keySkills",
      title: "Key Skills",
      skills: relevantSkills,
      lines: []
    });
  }

  for (const section of sourceSections) {
    if (section.key === "summary") {
      // The generated summary replaces the old summary; avoid duplicating it in the CV.
      continue;
    }

    if (section.key === "skills") {
      if (section.lines.length) {
        outputSections.push({
          key: "skills",
          title: "Skills & Tools",
          lines: section.lines
        });
      }
      continue;
    }

    outputSections.push(section);
  }

  if (!outputSections.length && introLines.length === 0) {
    const remaining = headerLines.filter((line) => line !== name && !isContactLine(line));
    if (remaining.length) {
      outputSections.push({ key: "profile", title: "Resume Details", lines: remaining });
    }
  }

  outputSections.sort((a, b) => {
    const getOrder = (section) => {
      if (section.key === "summary") return 0;
      if (section.key === "profile") return 0.5;
      if (section.key === "keySkills") return 1;
      if (section.key === "skills") return 1;
      return SECTION_ORDER[section.key] ?? 10;
    };
    return getOrder(a) - getOrder(b);
  });

  return {
    name: name || "Resume",
    contact,
    targetRole: String(data.targetRole || "").trim(),
    sections: outputSections
  };
}

function addSectionHeading(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 21,
        color: "245B82",
        font: "Aptos"
      })
    ],
    spacing: { before: 250, after: 100 },
    keepNext: true,
    border: {
      bottom: {
        color: "D8E2EA",
        space: 4,
        style: "single",
        size: 4
      }
    }
  });
}

function addBodyLine(line) {
  const bullet = isBulletLine(line);
  const text = bullet ? cleanBullet(line) : line.trim();

  return new Paragraph({
    children: [new TextRun({ text, size: 21, font: "Aptos", color: "263238" })],
    ...(bullet ? { bullet: { indent: 330 } } : {}),
    spacing: { after: 75 },
    widowControl: true
  });
}

function addSkills(skills) {
  const children = [];
  const chunkSize = 7;

  for (let index = 0; index < skills.length; index += chunkSize) {
    const chunk = skills.slice(index, index + chunkSize);
    children.push(new Paragraph({
      children: [new TextRun({
        text: chunk.join("  •  "),
        size: 21,
        font: "Aptos",
        color: "263238"
      })],
      spacing: { after: 85 }
    }));
  }

  return children;
}

export async function createTailoredResumeDocx(data) {
  const model = buildResumeModel(data);
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: model.name,
          bold: true,
          size: 34,
          font: "Aptos Display",
          color: "17324D"
        })
      ],
      spacing: { after: 45 },
      keepNext: true
    })
  ];

  if (model.contact.length) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: model.contact.join("  |  "),
        size: 18,
        font: "Aptos",
        color: "526575"
      })],
      spacing: { after: 100 },
      keepNext: true
    }));
  }

  if (model.targetRole) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: "Targeting: " + model.targetRole,
        size: 19,
        italics: true,
        font: "Aptos",
        color: "526575"
      })],
      spacing: { after: 120 }
    }));
  }

  for (const section of model.sections) {
    children.push(addSectionHeading(section.title));

    if (Array.isArray(section.skills) && section.skills.length) {
      children.push(...addSkills(section.skills));
    }

    for (const line of section.lines || []) {
      children.push(addBodyLine(line));
    }

    if (section.summary) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: section.summary,
          size: 21,
          font: "Aptos",
          color: "263238"
        })],
        spacing: { after: 100 },
        widowControl: true
      }));
    }
  }

  const document = new Document({
    creator: "Resume Match",
    title: "Resume - " + (model.targetRole || model.name),
    description: "Editable resume draft organised from the supplied resume content.",
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: 21, color: "263238" },
          paragraph: { spacing: { after: 80 } }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 900, bottom: 720, left: 900 }
        }
      },
      children
    }]
  });

  return Packer.toBuffer(document);
}
