import { chromium } from "playwright";
import { isAllowedByRobots } from "./robotsPolicy.js";
import { validateSourceUrl } from "./sourceStore.js";

const MAX_JOBS_PER_SOURCE = 12;
const NAVIGATION_TIMEOUT_MS = 20000;
const BLOCK_PAGE_PATTERN = /captcha|verify you are human|access denied|unusual traffic|automated requests/i;
const JOB_PATH_PATTERN = /job|career|position|opening|vacanc/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectJobPostingSchema(value, found = []) {
  if (!value) return found;

  if (Array.isArray(value)) {
    for (const item of value) collectJobPostingSchema(item, found);
    return found;
  }

  if (typeof value !== "object") return found;

  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  if (types.includes("JobPosting")) found.push(value);

  if (value["@graph"]) collectJobPostingSchema(value["@graph"], found);
  return found;
}

function locationFromSchema(job) {
  const locations = Array.isArray(job.jobLocation)
    ? job.jobLocation
    : job.jobLocation ? [job.jobLocation] : [];

  return locations.map((item) => {
    const address = item.address || {};
    return [
      address.addressLocality,
      address.addressRegion,
      address.addressCountry?.name || address.addressCountry
    ].filter(Boolean).join(", ");
  }).filter(Boolean).join(" / ");
}

async function readJobDetails(page, url, fallbackTitle, companyHint) {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT_MS
  });

  const status = page.url();
  const finalUrl = new URL(status);

  if (finalUrl.hostname !== new URL(url).hostname) {
    throw new Error("Job page redirected to a different host; skipping it.");
  }

  const data = await page.evaluate(() => {
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const structuredData = [];

    for (const script of scripts) {
      try {
        structuredData.push(JSON.parse(script.textContent));
      } catch {
        // Ignore invalid JSON-LD blocks and use visible page content instead.
      }
    }

    const main = document.querySelector("main") || document.body;
    return {
      title: document.querySelector("h1")?.innerText?.trim() || document.title,
      description: main.innerText?.slice(0, 6000) || "",
      siteName: document.querySelector('meta[property="og:site_name"]')?.content || "",
      structuredData
    };
  });

  const posting = data.structuredData
    .flatMap((item) => collectJobPostingSchema(item))[0];

  const description = posting?.description
    ? posting.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : data.description;

  return {
    title: posting?.title || data.title || fallbackTitle,
    company: posting?.hiringOrganization?.name || data.siteName || companyHint || finalUrl.hostname,
    location: locationFromSchema(posting || {}),
    description,
    url: finalUrl.toString(),
    postedAt: posting?.datePosted || null,
    source: finalUrl.hostname
  };
}

export async function crawlCareerSource(source) {
  if (!source?.termsConfirmed) {
    throw new Error("Source has not been marked as permitted for automated access.");
  }

  const sourceUrl = validateSourceUrl(source.url);

  if (!(await isAllowedByRobots(sourceUrl))) {
    throw new Error(`robots.txt disallows crawling ${sourceUrl}`);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage({
      userAgent: "JobFilterBot/1.0"
    });

    const response = await page.goto(sourceUrl, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS
    });

    if (!response || [401, 403, 429].includes(response.status())) {
      throw new Error(`Source returned HTTP ${response?.status() ?? "unknown"}; stopping without retries or bypass attempts.`);
    }

    const finalSource = new URL(page.url());
    if (finalSource.hostname !== new URL(sourceUrl).hostname) {
      throw new Error("Source redirected to a different host; skipping it.");
    }

    const pageText = await page.locator("body").innerText().catch(() => "");
    if (BLOCK_PAGE_PATTERN.test(pageText)) {
      throw new Error("The source appears to require human verification or is blocking automated access. Skipping it.");
    }

    const links = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((anchor) => ({
        title: (anchor.innerText || anchor.getAttribute("aria-label") || "").trim(),
        href: anchor.href
      }))
    );

    const uniqueLinks = new Map();

    for (const link of links) {
      if (link.title.length < 5 || link.title.length > 120) continue;

      try {
        const target = new URL(link.href);
        if (target.hostname !== finalSource.hostname) continue;
        if (!JOB_PATH_PATTERN.test(target.pathname)) continue;
        target.hash = "";
        uniqueLinks.set(target.toString(), link.title);
      } catch {
        // Ignore malformed links.
      }
    }

    const jobs = [];
    for (const [url, title] of [...uniqueLinks.entries()].slice(0, MAX_JOBS_PER_SOURCE)) {
      if (!(await isAllowedByRobots(url))) continue;

      try {
        const job = await readJobDetails(page, url, title, source.company);
        if (job.title && job.url) jobs.push(job);
      } catch (error) {
        console.warn(`Skipped job page ${url}: ${error.message}`);
      }

      await sleep(2000);
    }

    return jobs;
  } finally {
    await browser.close();
  }
}
