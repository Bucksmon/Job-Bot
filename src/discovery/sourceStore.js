import fs from "node:fs/promises";
import path from "node:path";

function isBlockedHost(hostname) {
  // Covers regional domains such as indeed.ae and LinkedIn country domains.
  return /(^|\.)(linkedin|indeed)\.[a-z.]+$/i.test(hostname);
}

export function validateSourceUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid source URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS career-page URLs are supported.");
  }

  if (isBlockedHost(url.hostname)) {
    throw new Error("LinkedIn and Indeed are not supported for automated crawling. Add a public employer career page that permits automated access instead.");
  }

  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".local") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)
  ) {
    throw new Error("Local and raw-IP source URLs are not supported.");
  }

  url.hash = "";
  return url.toString();
}

async function readStore(filePath) {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
    return Array.isArray(parsed.sources) ? parsed : { sources: [] };
  } catch (error) {
    if (error.code === "ENOENT") return { sources: [] };
    throw new Error(`Could not read source list: ${error.message}`);
  }
}

export async function listSources(
  filePath = process.env.JOB_SOURCES_PATH || "./data/sources.json"
) {
  const store = await readStore(filePath);
  return store.sources;
}

export async function addSource(
  value,
  termsConfirmed,
  filePath = process.env.JOB_SOURCES_PATH || "./data/sources.json"
) {
  if (termsConfirmed !== true) {
    throw new Error("Confirm that the site permits automated access before adding it.");
  }

  const url = validateSourceUrl(value);
  const store = await readStore(filePath);

  if (store.sources.some((source) => source.url === url)) {
    return { added: false, source: url };
  }

  store.sources.push({
    url,
    termsConfirmed: true,
    addedAt: new Date().toISOString()
  });

  const absolutePath = path.resolve(filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  const temporaryPath = `${absolutePath}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(temporaryPath, absolutePath);

  return { added: true, source: url };
}
