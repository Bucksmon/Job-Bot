import { chromium } from "playwright";
import { getRobotsPolicy, USER_AGENT } from "./robotsPolicy.js";
import { validateSourceUrl } from "./sourceStore.js";

const MAX_JOBS_PER_SOURCE = 12;
const NAVIGATION_TIMEOUT_MS = 20000;
const BLOCK_PAGE_PATTERN = /captcha|verify you are human|access denied|unusual traffic|automated requests/i;
const JOB_PATH_PATTERN = /job|career|position|opening|vacanc|role|requisition|opportunit/i;

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
  if (types.some((type) => String(type).endsWith("JobPosting"))) found.push(value);

  if (value["@graph"]) collectJobPostingSchema(value["@graph"], found);
  if (value.mainEntity) collectJobPostingSchema(value.mainEntity, found);

  return found;
}

function htmlToText(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getPostingUrl(posting, baseUrl) {
  const mainEntity = posting.mainEntityOfPage;
  const candidate = posting.url ||
    (typeof mainEntity === "string" ? mainEntity : mainEntity?.["@id"]);

  if (!candidate) return null;

  try {
    const url = new URL(candidate, baseUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function locationFromSchema(job) {
  if (job.jobLocationType === "TELECOMMUTE") return "Remote";

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
  }).filter(Boolean).join(" / ") || "Not specified";
}

function normalizePosting(posting, url, fallbackCompany) {
  return {
    title: posting.title || "Untitled role",
    company: posting.hiringOrganization?.name || fallbackCompany || new URL(url).hostname,
    location: locationFromSchema(posting),
    description: htmlToText(posting.description || ""),
    url,
    postedAt: posting.datePosted || null,
    source: new URL(url).hostname
  };
}

async function readPageData(page) {
  return page.evaluate(() => {
    const structuredData = [];

    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        structuredData.push(JSON.parse(script.textContent));
      } catch {
        // Ignore malformed JSON-LD and continue with visible links and text.
      }
    }

    const main = document.querySelector("main") || document.body;

    return {
      title: document.querySelector("h1")?.innerText?.trim() || document.title,
      description: main.innerText?.slice(0, 6000) || "",
      siteName: document.querySelector('meta[property="og:site_name"]')?.content || "",
      structuredData,
      links: [...document.querySelectorAll("a[href]")].map((anchor) => ({
        title: (anchor.innerText || anchor.getAttribute("aria-label") || "").trim(),
        href: anchor.href
      }))
    };
  });
}

function isSameHost(target, source) {
  return new URL(target).hostname.toLowerCase() === new URL(source).hostname.toLowerCase();
}

async function readJobDetails(page, url, fallbackTitle, companyHint) {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT_MS
  });

  if (!response || [401, 403, 429].includes(response.status())) {
    throw new Error(`Job page returned HTTP ${response?.status() ?? "unknown"}; skipping it.`);
  }

  const finalUrl = page.url();
  if (!isSameHost(finalUrl, url)) {
    throw new Error("Job page redirected to a different host; skipping it.");
  }

  const pageData = await readPageData(page);
  const posting = pageData.structuredData
    .flatMap((item) => collectJobPostingSchema(item))[0];

  return {
    title: posting?.title || pageData.title || fallbackTitle,
    company: posting?.hiringOrganization?.name || pageData.siteName || companyHint || new URL(finalUrl).hostname,
    location: posting ? locationFromSchema(posting) : "Not specified",
    description: posting?.description
      ? htmlToText(posting.description).slice(0, 6000)
      : pageData.description,
    url: finalUrl,
    postedAt: posting?.datePosted || null,
    source: new URL(finalUrl).hostname
  };
}

export async function crawlCareerSource(source) {
  if (!source?.termsConfirmed) {
    throw new Error("Source has not been marked as permitted for automated access.");
  }

  const sourceUrl = validateSourceUrl(source.url);
  const sourcePolicy = await getRobotsPolicy(sourceUrl);

  if (!sourcePolicy.allowed) {
    throw new Error(`robots.txt disallows crawling ${sourceUrl}`);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });
    const response = await page.goto(sourceUrl, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS
    });

    if (!response || [401, 403, 429].includes(response.status())) {
      throw new Error(`Source returned HTTP ${response?.status() ?? "unknown"}; stopping without bypass attempts.`);
    }

    if (!isSameHost(page.url(), sourceUrl)) {
      throw new Error("Career page redirected to a different host; skipping it.");
    }

    const listingPage = await readPageData(page);
    if (BLOCK_PAGE_PATTERN.test(listingPage.description)) {
      throw new Error("The source appears to require human verification or is blocking automated access. Skipping it.");
    }

    const jobs = new Map();

    // Some career pages expose JobPosting records directly in their JSON-LD.
    const schemaJobs = listingPage.structuredData
      .flatMap((item) => collectJobPostingSchema(item));

    for (const posting of schemaJobs) {
      const url = getPostingUrl(posting, sourceUrl);
      if (!url || !isSameHost(url, sourceUrl)) continue;

      const policy = await getRobotsPolicy(url);
      if (!policy.allowed) continue;

      jobs.set(url, normalizePosting(posting, url, source.company));
    }

    // Other career pages list jobs as ordinary links; open a small number at a time.
    const links = new Map();

    for (const link of listingPage.links) {
      if (link.title.length < 5 || link.title.length > 120) continue;

      try {
        const target = new URL(link.href);
        if (target.protocol !== "https:" || !isSameHost(target.toString(), sourceUrl)) continue;
        if (!JOB_PATH_PATTERN.test(target.pathname)) continue;

        target.hash = "";
        links.set(target.toString(), link.title);
      } catch {
        // Ignore malformed links.
      }
    }

    let processed = 0;

    for (const [url, title] of links) {
      if (jobs.has(url)) continue;
      if (processed >= MAX_JOBS_PER_SOURCE) break;

      const policy = await getRobotsPolicy(url);
      if (!policy.allowed) continue;

      try {
        const job = await readJobDetails(page, url, title, source.company);
        if (job.title && job.url) jobs.set(job.url, job);
      } catch (error) {
        console.warn(`Skipped job page ${url}: ${error.message}`);
      }

      processed += 1;
      await sleep(policy.delayMs);
    }

    return [...jobs.values()].slice(0, MAX_JOBS_PER_SOURCE);
  } finally {
    await browser.close();
  }
}
