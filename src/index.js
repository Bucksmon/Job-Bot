import "dotenv/config";
import cron from "node-cron";
import { startDiscordBot } from "./discord/discordBot.js";
import { runSearch } from "./jobs/searchService.js";

const schedule = process.env.AUTO_SEARCH_CRON || "0 */6 * * *";

async function main() {
  const bot = await startDiscordBot();

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid AUTO_SEARCH_CRON expression: ${schedule}`);
  }

  const scheduledSearch = cron.schedule(schedule, async () => {
    console.log("Scheduled job search started.");

    try {
      const result = await runSearch();
      console.log("Scheduled job search finished:", result);
    } catch (error) {
      console.error("Scheduled job search failed:", error.message);
    }
  }, {
    timezone: "Asia/Dubai",
    noOverlap: true
  });

  console.log(`Job-Bot is online. Automatic search schedule: ${schedule} (Asia/Dubai)`);

  const shutdown = (signal) => {
    console.log(`${signal} received; shutting down gracefully.`);
    scheduledSearch.stop();
    bot.destroy();
    process.exit(0);
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("Job-Bot failed to start:", error);
  process.exit(1);
});
