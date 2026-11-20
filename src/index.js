import "dotenv/config";

console.log("Job Filter is starting...");

const requiredSettings = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_CHANNEL_ID"
];

const missingSettings = requiredSettings.filter((key) => !process.env[key]);

if (missingSettings.length > 0) {
  console.log("\nMissing configuration:");
  missingSettings.forEach((key) => console.log(`- ${key}`));
  console.log("\nCopy .env.example to .env and fill in the required values.");
  process.exit(1);
}

console.log("Configuration loaded.");
console.log("The application foundation is ready for the first development milestone.");
