import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";

function addHeading(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 120 }
  });
}

function addBullet(text) {
  return new Paragraph({
    text,
    bullet: { indent: 360 },
    spacing: { after: 100 }
  });
}

function looksLikeHeading(line) {
  const clean = line.trim();
  if (!clean || clean.length > 55) return false;

  return /^(professional summary|summary|profile|objective|skills|technical skills|experience|work experience|employment history|projects|education|certifications?|training|courses|languages|achievements|publications)$/i.test(clean);
}

export async function createTailoredResumeDocx(data) {
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: "TAILORED RESUME DRAFT",
          bold: true,
          size: 34
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Target role: ${data.targetRole}`,
          bold: true,
          size: 23
        })
      ],
      spacing: { after: 180 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Review this draft before applying. It reorganises and highlights information from your source resume; it does not verify qualifications or add new experience.",
          italics: true,
          color: "666666"
        })
      ],
      spacing: { after: 220 }
    }),
    addHeading("Professional Summary"),
    new Paragraph({
      text: data.summaryDraft,
      spacing: { after: 160 }
    }),
    addHeading("Relevant Skills")
  ];

  children.push(new Paragraph({
    text: data.matchedKeywords.length
      ? data.matchedKeywords.join("  •  ")
      : "No recognised matching skills were found in the source resume."
  }));

  children.push(addHeading("Relevant Resume Evidence"));

  if (data.evidence.length) {
    for (const line of data.evidence) children.push(addBullet(line));
  } else {
    children.push(new Paragraph({
      text: "No resume statements matched the recognised keywords. Review your experience and projects manually."
    }));
  }

  children.push(addHeading("Original Resume Content"));

  const lines = data.resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (looksLikeHeading(line)) {
      children.push(addHeading(line));
    } else {
      children.push(new Paragraph({
        text: line,
        spacing: { after: 70 }
      }));
    }
  }

  children.push(addHeading("Keywords to Review"));
  children.push(new Paragraph({
    text: data.missingKeywords.length
      ? data.missingKeywords.join(", ")
      : "No missing recognised keywords were identified."
  }));

  for (const note of data.notes) children.push(addBullet(note));

  const document = new Document({
    creator: "ATS Resume Matcher",
    title: `Tailored Resume Draft - ${data.targetRole}`,
    description: "Editable resume draft based on the supplied resume and job description.",
    sections: [{ properties: {}, children }]
  });

  return Packer.toBuffer(document);
}
