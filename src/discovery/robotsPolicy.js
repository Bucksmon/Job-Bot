import robotsParser from "robots-parser";

const USER_AGENT = "JobFilterBot/1.0";

export async function isAllowedByRobots(targetUrl) {
  const target = new URL(targetUrl);
  const robotsUrl = new URL("/robots.txt", target.origin);

  let response;

  try {
    response = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    throw new Error(`Could not check robots.txt for ${target.hostname}: ${error.message}`);
  }

  // A missing robots.txt file is different from a server failure.
  if (response.status === 404) return true;

  if (!response.ok) {
    throw new Error(`robots.txt check failed for ${target.hostname} (HTTP ${response.status}).`);
  }

  const body = await response.text();
  const robots = robotsParser(robotsUrl.toString(), body);
  return robots.isAllowed(targetUrl, USER_AGENT) === true;
}

export { USER_AGENT };
