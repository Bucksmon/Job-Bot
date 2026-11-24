import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import { addSource, listSources } from "../discovery/sourceStore.js";
import { runSearch } from "../jobs/searchService.js";
import { markJobApplied } from "../jobs/jobStore.js";
import { saveResumeBuffer } from "../resume/resumeStorage.js";

const commands = [
  new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search configured career pages for jobs matching your resume."),
  new SlashCommandBuilder()
    .setName("set-resume")
    .setDescription("Upload your PDF or DOCX resume to Job-Bot.")
    .addAttachmentOption((option) =>
      option.setName("file").setDescription("Your resume file").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("add-source")
    .setDescription("Add a public employer career page that permits automated access.")
    .addStringOption((option) =>
      option.setName("url").setDescription("HTTPS career-page URL").setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName("terms-confirmed")
        .setDescription("Confirm that the site permits automated access.")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("sources")
    .setDescription("Show configured career-page sources."),
  new SlashCommandBuilder()
    .setName("mark-applied")
    .setDescription("Mark a job sent by Job-Bot as applied.")
    .addStringOption((option) =>
      option.setName("url").setDescription("Original job posting URL").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show Job-Bot commands.")
];

function isOwner(interaction) {
  const ownerId = process.env.ALLOWED_DISCORD_USER_ID;
  return Boolean(ownerId && interaction.user.id === ownerId);
}

async function saveResume(attachment) {
  if (attachment.size > 8 * 1024 * 1024) {
    throw new Error("Resume must be smaller than 8 MB.");
  }

  const response = await fetch(attachment.url);
  if (!response.ok) {
    throw new Error("Could not download the attached resume from Discord.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return saveResumeBuffer(buffer, attachment.name);
}

export async function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !guildId || !channelId || !process.env.ALLOWED_DISCORD_USER_ID) {
    throw new Error("Set DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_CHANNEL_ID and ALLOWED_DISCORD_USER_ID.");
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", async () => {
    try {
      const rest = new REST({ version: "10" }).setToken(token);

      await rest.put(
        Routes.applicationGuildCommands(client.application.id, guildId),
        { body: commands.map((command) => command.toJSON()) }
      );

      console.log(`Discord bot ready as ${client.user.tag}`);
    } catch (error) {
      console.error("Could not register Discord commands:", error);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (!isOwner(interaction)) {
      await interaction.reply({
        content: "This bot is private and only its owner can use it.",
        ephemeral: true
      });
      return;
    }

    try {
      if (interaction.commandName === "help") {
        await interaction.reply({
          content: [
            "**Job-Bot commands**",
            "`/set-resume` — upload your PDF or DOCX resume",
            "`/add-source` — add an employer career page that permits automated access",
            "`/sources` — list configured sources",
            "`/search` — search configured sources and post new matches",
            "`/mark-applied` — track a job you applied to"
          ].join("\n"),
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "set-resume") {
        await interaction.deferReply({ ephemeral: true });
        const attachment = interaction.options.getAttachment("file");
        const destination = await saveResume(attachment);
        await interaction.editReply(`Resume saved successfully (${destination}).`);
        return;
      }

      if (interaction.commandName === "add-source") {
        const url = interaction.options.getString("url");
        const confirmed = interaction.options.getBoolean("terms-confirmed");
        const result = await addSource(url, confirmed);

        await interaction.reply({
          content: result.added
            ? `Added career source: ${result.source}`
            : `That source is already configured: ${result.source}`,
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "sources") {
        const sources = await listSources();
        const message = sources.length
          ? sources.map((source, index) => `${index + 1}. ${source.url}`).join("\n")
          : "No sources have been added yet.";

        await interaction.reply({ content: message, ephemeral: true });
        return;
      }

      if (interaction.commandName === "mark-applied") {
        const url = interaction.options.getString("url");
        const job = await markJobApplied(url);
        await interaction.reply({
          content: `Marked **${job.title || "Job"}** at **${job.company || "the company"}** as applied.`,
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "search") {
        await interaction.deferReply({ ephemeral: true });
        const result = await runSearch();

        await interaction.editReply(
          result.skipped
            ? result.reason
            : `Search complete. Checked ${result.sourcesChecked} sources, discovered ${result.discovered} listings, found ${result.relevant} relevant jobs, and sent ${result.newMatches} new matches to Discord.`
        );
      }
    } catch (error) {
      console.error(error);
      const message = `Job-Bot error: ${error.message}`;

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => {});
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
      }
    }
  });

  await client.login(token);
  return client;
}
