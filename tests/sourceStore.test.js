import test from "node:test";
import assert from "node:assert/strict";
import { validateSourceUrl } from "../src/discovery/sourceStore.js";

test("accepts an HTTPS employer career page", () => {
  assert.equal(
    validateSourceUrl("https://careers.example.com/jobs#openings"),
    "https://careers.example.com/jobs"
  );
});

test("rejects LinkedIn domains", () => {
  assert.throws(
    () => validateSourceUrl("https://www.linkedin.com/jobs/"),
    /LinkedIn and Indeed/
  );
});

test("rejects regional Indeed domains", () => {
  assert.throws(
    () => validateSourceUrl("https://ae.indeed.com/jobs"),
    /LinkedIn and Indeed/
  );
});

test("rejects insecure HTTP sources", () => {
  assert.throws(
    () => validateSourceUrl("http://careers.example.com/jobs"),
    /HTTPS/
  );
});
