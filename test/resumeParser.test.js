import test from "node:test";
import assert from "node:assert/strict";
import { Document, Packer, Paragraph } from "docx";
import { extractResumeText } from "../lib/resumeParser.js";

test("extracts text from a DOCX resume", async () => {
  const document = new Document({
    sections: [{
      children: [
        new Paragraph({ text: "Bucksmon - Software Developer" }),
        new Paragraph({ text: "Experienced with JavaScript, React, Node.js and MongoDB." }),
        new Paragraph({ text: "Built several web applications and REST APIs." })
      ]
    }]
  });
  const buffer = await Packer.toBuffer(document);
  const text = await extractResumeText({
    buffer,
    originalname: "resume.docx"
  });

  assert.match(text, /Software Developer/);
  assert.match(text, /JavaScript/);
});

test("routes legacy DOC files to the Word parser", async () => {
  await assert.rejects(
    extractResumeText({
      buffer: Buffer.from("not a real Word document"),
      originalname: "legacy-resume.doc"
    }),
    (error) => !/Unsupported file type/.test(error.message)
  );
});

test("rejects unsupported document extensions clearly", async () => {
  await assert.rejects(
    extractResumeText({
      buffer: Buffer.from("resume"),
      originalname: "resume.txt"
    }),
    /PDF, DOCX, or DOC/
  );
});
