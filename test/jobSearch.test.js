import test from "node:test";
import assert from "node:assert/strict";
import { employerBoards, resetJobSearchCache, searchEmployerJobs } from "../lib/jobSearch.js";

function mockFetch(payloadBySlug) {
  return async (url) => {
    const slug = new URL(url).pathname.split("/").pop();
    if (!(slug in payloadBySlug)) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(payloadBySlug[slug]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };
}

test("searches listed employer jobs and returns direct application links", async () => {
  resetJobSearchCache();
  const result = await searchEmployerJobs({
    query: "Backend Engineer",
    location: "Dubai, UAE",
    boards: [{ slug: "example", company: "Example Co" }],
    fetchImpl: mockFetch({
      example: {
        jobs: [{
          id: "job-1",
          title: "Backend Engineer",
          location: "Dubai, UAE",
          workplaceType: "OnSite",
          employmentType: "FullTime",
          isListed: true,
          descriptionPlain: "Build Node.js services and REST APIs.",
          publishedAt: "2026-11-01T10:00:00Z",
          jobUrl: "https://jobs.ashbyhq.com/example/job-1",
          applyUrl: "https://jobs.ashbyhq.com/example/job-1/apply"
        }, {
          id: "job-2",
          title: "Internal Draft",
          location: "Dubai, UAE",
          isListed: false,
          descriptionPlain: "Draft only.",
          jobUrl: "https://jobs.ashbyhq.com/example/job-2"
        }]
      }
    })
  });

  assert.equal(result.total, 1);
  assert.equal(result.jobs[0].company, "Example Co");
  assert.equal(result.jobs[0].title, "Backend Engineer");
  assert.equal(result.jobs[0].applyUrl, "https://jobs.ashbyhq.com/example/job-1/apply");
});

test("filters by location and reports unavailable employer boards", async () => {
  resetJobSearchCache();
  const result = await searchEmployerJobs({
    query: "Software Engineer",
    location: "Dubai, UAE",
    boards: [
      { slug: "dubai", company: "Dubai Co" },
      { slug: "missing", company: "Missing Co" }
    ],
    fetchImpl: mockFetch({
      dubai: {
        jobs: [{
          title: "Software Engineer",
          location: "Dubai, United Arab Emirates",
          isListed: true,
          jobUrl: "https://jobs.ashbyhq.com/dubai/job"
        }, {
          title: "Software Engineer",
          location: "London, UK",
          isListed: true,
          jobUrl: "https://jobs.ashbyhq.com/dubai/london-job"
        }]
      }
    })
  });

  assert.equal(result.total, 1);
  assert.match(result.jobs[0].location, /Dubai/);
  assert.equal(result.providers.find((provider) => provider.slug === "missing").status, "unavailable");
});

test("does not return unsafe non-HTTPS employer links", async () => {
  resetJobSearchCache();
  const result = await searchEmployerJobs({
    query: "Engineer",
    location: "Any",
    boards: [{ slug: "bad", company: "Bad Co" }],
    fetchImpl: mockFetch({
      bad: {
        jobs: [{
          title: "Engineer",
          location: "Remote",
          isListed: true,
          jobUrl: "javascript:alert(1)"
        }]
      }
    })
  });

  assert.equal(result.total, 0);
  resetJobSearchCache();
});

test("provides the curated live employer board list", () => {
  assert.ok(employerBoards.length >= 5);
});
