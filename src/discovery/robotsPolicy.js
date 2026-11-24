import robotsParser from "robots-parser";

const USER_AGENT = "JobFilterBot/1.0";
const MINIMUM_DELAY_MS = 2000;
const robotsCache = new Map();

export async function getRobotsPolicy(targetUrl) {
  const target = new URL(targetUrl);
  const origin = target.origin;

  if (robotsCache.has(origin)) {
    const cached = robotsCache.get(origin);
    const parser = cached.parser;

    return {
      allowed: parser ? parser.isAllowed(targetUrl, USER_AGENT) !== false : true,
      delayMs: cached.delayMs
    };
  }

  const robotsUrl = new URL("/robots.txt", origin);
  let response;

  try {
    response = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
      redirect: "error"
    });
  } catch (error) {
    throw new Error(`Could not check robots.txt for ${target.hostname}: ${error.message}`);
  }

  // No robots file means no robots-specific exclusion rules.
  if (response.status === 404) {
    robotsCache.set(origin, { parser: null, delayMs: MINIMUM_DELAY_MS });
    return { allowed: true, delayMs: MINIMUM_DELAY_MS };
  }

  if (!response.ok) {
    throw new Error(`robots.txt check failed for ${target.hostname} (HTTP ${response.status}).`);
  }

  const body = await response.text();
  const parser = robotsParser(robotsUrl.toString(), body);
  const crawlDelaySeconds = parser.getCrawlDelay(USER_AGENT) || 0;
  const delayMs = Math.max(MINIMUM_DELAY_MS, crawlDelaySeconds * 1000);

  robotsCache.set(origin, { parser, delayMs });

  return {
    allowed: parser.isAllowed(targetUrl, USER_AGENT) !== false,
    delayMs
  };
}

export async function isAllowedByRobots(targetUrl) {
  const policy = await getRobotsPolicy(targetUrl);
  return policy.allowed;
}

export { USER_AGENT };
