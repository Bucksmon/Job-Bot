import { EmbedBuilder, REST, Routes } from "discord.js";

function createJobEmbed(job) {
  const embed = new EmbedBuilder()
    .setTitle((job.title || "Untitled role").slice(0, 256))
    .setDescription((job.description || "No description provided.").slice(0, 1200))
    .addFields(
      { name: "Company", value: job.company || "Not provided", inline: true },
      { name: "Location", value: job.location || "Not provided", inline: true },
      { name: "Match", value: `${job.matchScore ?? 0}%`, inline: true }
    )
    .setFooter({ text: "Job Filter · Resume match" });

  // Discord only accepts a valid URL for the embed link.
  if (job.url && /^https?:\/\//i.test(job.url)) {
    embed.setURL(job.url);
  }

  if (Array.isArray(job.matchedSkills) && job.matchedSkills.length > 0) {
    embed.addFields({
      name: "Matching skills",
      value: job.matchedSkills.slice(0, 10).join(", ").slice(0, 1024),
      inline: false
    });
  }

  if (job.postedAt && !Number.isNaN(Date.parse(job.postedAt))) {
    embed.setTimestamp(new Date(job.postedAt));
  }

  return embed;
}

export async function sendJobsToDiscord(jobs, options = {}) {
  const token = options.token || process.env.DISCORD_BOT_TOKEN;
  const channelId = options.channelId || process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    throw new Error("Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID in your .env file.");
  }

  const rest = new REST({ version: "10" }).setToken(token);

  if (jobs.length === 0) {
    await rest.post(Routes.channelMessages(channelId), {
      body: { content: "Search completed. No new matching jobs were found." }
    });
    return;
  }

  // Discord accepts up to 10 embeds in one message.
  for (let index = 0; index < jobs.length; index += 10) {
    const batch = jobs.slice(index, index + 10);
    const embeds = batch.map(createJobEmbed);

    await rest.post(Routes.channelMessages(channelId), {
      body: { embeds }
    });
  }
}
