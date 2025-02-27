import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";

const helpCommand = new SlashCommandBuilder()
  .setName("help")
  .setDescription("List all available commands.");

async function handleHelpCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("Available Commands")
    .setDescription("Here are all the commands you can use:")
    .addFields(
      { name: "/test", value: "Manually triggers the welcome message." },
      { name: "/setwelcome", value: "Configure the welcome embed." },
      { name: "/post", value: "Post a message in a selected channel." },
      { name: "/ban", value: "Ban a user from the server." },
      { name: "/timeout", value: "Timeout a user from the server." },
      { name: "/kick", value: "Kick a user from the server." },
      { name: "/warn", value: "Warn a user." }, // Updated description
      { name: "/afk", value: "Set your status to AFK." },
      { name: "/afk-remove", value: "Remove AFK status from a user." },
      { name: "/blacklist", value: "Add a word to the blacklist." },
      { name: "/whitelist", value: "Remove a word from the blacklist." },
      { name: "/report", value: "Report a user to the support team." }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export { helpCommand, handleHelpCommand };
