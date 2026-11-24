const EMPLOYER_BOARDS = [
  { slug: "ziina", company: "Ziina" },
  { slug: "algodriven", company: "AlgoDriven" },
  { slug: "LeanTech", company: "Lean Technologies" },
  { slug: "asula", company: "Asula Labs" },
  { slug: "infinitefield", company: "Field Technologies" },
  { slug: "mexdigital", company: "MultiBank Group" },
  { slug: "aleroy", company: "Aleroy" },
  { slug: "sardine", company: "Sardine" }
];

const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 9000;
let cachedJobs = [];
let cachedProviders = [];
let cachedAt = 0;
let refreshPromise = null;

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function mapJob(raw, board) {
  const title = String(raw?.title || "").trim();
  const jobUrl = safeHttpsUrl(raw?.jobUrl);
  const applyUrl = safeHttpsUrl(raw?.applyUrl) || jobUrl;
  if (!title || !jobUrl || raw?.isListed === false) return null;

  const postal = raw?.address?.postalAddress || {};
  const secondary = Array.isArray(raw?.secondaryLocations)
    ? raw.secondaryLocations.map((item) => item?.location).filter(Boolean)
    : [];
  const location = [
    raw?.location,
    ...secondary
  ].filter(Boolean).join(" · ") ||
    [postal.addressLocality, postal.addressRegion, postal.addressCountry].filter(Boolean).join(", ") ||
    (raw?.isRemote ? "Remote (location not specified)" : "Location not specified");

  const description = String(raw?.descriptionPlain || stripHtml(raw?.descriptionHtml || "")).trim();

  return {
    id: board.slug + ":" + (raw.id || jobUrl),
    company: board.company,
    title,
    location,
    workplaceType: String(raw.workplaceType || (raw.isRemote ? "Remote" : "Not specified")),
    employmentType: String(raw.employmentType || "Not specified"),
    isRemote: Boolean(raw.isRemote || raw.workplaceType === "Remote"),
    department: String(raw.department || ""),
    team: String(raw.team || ""),
    description: description.slice(0, 18000),
    publishedAt: raw.publishedAt || null,
    jobUrl,
    applyUrl,
    sourceUrl: "https://jobs.ashbyhq.com/" + board.slug,
    compensation: String(
      raw.compensation?.scrapeableCompensationSalarySummary ||
      raw.compensation?.compensationTierSummary ||
      ""
    )
  };
}

async function refreshJobs(fetchImpl = fetch, boards = EMPLOYER_BOARDS) {
  const settled = await Promise.allSettled(boards.map(async (board) => {
    const url = "https://api.ashbyhq.com/posting-api/job-board/" +
      encodeURIComponent(board.slug) + "?includeCompensation=true";
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const payload = await response.json();
    return (Array.isArray(payload.jobs) ? payload.jobs : [])
      .filter((job) => job.isListed !== false)
      .map((job) => mapJob(job, board))
      .filter(Boolean);
  }));

  const jobs = [];
  const providers = [];
  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    const board = boards[index];
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
      providers.push({ company: board.company, slug: board.slug, status: "ok", count: result.value.length });
    } else {
      providers.push({ company: board.company, slug: board.slug, status: "unavailable", count: 0 });
    }
  }

  cachedJobs = jobs;
  cachedProviders = providers;
  cachedAt = Date.now();
  return { jobs, providers, fetchedAt: new Date(cachedAt).toISOString() };
}

async function getJobs(fetchImpl = fetch, boards = EMPLOYER_BOARDS) {
  if (cachedAt && Date.now() - cachedAt < CACHE_TTL_MS) {
    return {
      jobs: cachedJobs,
      providers: cachedProviders,
      fetchedAt: new Date(cachedAt).toISOString()
    };
  }

  if (!refreshPromise) {
    refreshPromise = refreshJobs(fetchImpl, boards)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function tokens(value) {
  return String(value || "").toLowerCase().match(/[a-z0-9+#.]+/g) || [];
}

function matchesLocation(job, location) {
  if (!location || /^(any|anywhere|all)$/i.test(location.trim())) return true;
  const terms = tokens(location).filter((term) => !["united", "arab", "emirates", "the"].includes(term));
  const haystack = tokens(job.location + " " + job.description.slice(0, 1500));
  const aliases = new Set(haystack);
  const hasDubai = terms.includes("dubai");
  const hasUae = terms.includes("uae") || terms.includes("emirates");
  if (hasDubai && aliases.has("dubai")) return true;
  if (hasUae && (aliases.has("uae") || aliases.has("emirates") || aliases.has("united"))) return true;
  return terms.some((term) => aliases.has(term));
}

function rankJob(job, query) {
  const queryTokens = [...new Set(tokens(query))];
  if (!queryTokens.length) return 0;
  const titleTokens = new Set(tokens(job.title));
  const descriptionTokens = new Set(tokens(job.description));
  const companyTokens = new Set(tokens(job.company));
  let score = 0;

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 4;
    else if (descriptionTokens.has(token)) score += 1;
    else if (companyTokens.has(token)) score += 0.5;
  }

  if (job.title.toLowerCase().includes(query.toLowerCase())) score += 5;
  return score;
}

export async function searchEmployerJobs({
  query = "",
  location = "Dubai, UAE",
  fetchImpl = fetch,
  boards = EMPLOYER_BOARDS,
  limit = 40
} = {}) {
  const data = await getJobs(fetchImpl, boards);
  const ranked = data.jobs
    .filter((job) => matchesLocation(job, location))
    .map((job) => ({ ...job, relevance: rankJob(job, query) }))
    .filter((job) => !tokens(query).length || job.relevance > 0)
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0);
    })
    .slice(0, Math.max(1, Math.min(60, Number(limit) || 40)))
    .map(({ relevance, ...job }) => job);

  return {
    jobs: ranked,
    total: ranked.length,
    fetchedAt: data.fetchedAt,
    providers: data.providers,
    source: "Public employer career boards via Ashby"
  };
}

export function resetJobSearchCache() {
  cachedJobs = [];
  cachedProviders = [];
  cachedAt = 0;
  refreshPromise = null;
}

export const employerBoards = EMPLOYER_BOARDS;
