import { SlashCommandBuilder } from "@discordjs/builders";
import fs from "fs";
import { PermissionsBitField } from "discord.js";

const blacklistCommands = [
  new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Add a word to the blacklist.")
    .addStringOption((option) =>
      option.setName("word").setDescription("The word to add to the blacklist").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Remove a word from the blacklist.")
    .addStringOption((option) =>
      option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true),
    ),
].map((command) => command.toJSON());

async function handleBlacklistCommand(interaction) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const word = interaction.options.getString("word").toLowerCase();

  try {
    let blacklist = fs.existsSync("blacklist.json")
      ? JSON.parse(fs.readFileSync("blacklist.json", "utf8"))
      : [];

    if (!blacklist.includes(word)) {
      blacklist.push(word);
      fs.writeFileSync("blacklist.json", JSON.stringify(blacklist, null, 2));
      await interaction.reply({
        content: `✅ The word "${word}" has been added to the blacklist.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ The word "${word}" is already in the blacklist.`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Error updating blacklist:", error);
    await interaction.reply({
      content: "❌ An error occurred while updating the blacklist.",
      ephemeral: true,
    });
  }
}

async function handleWhitelistCommand(interaction) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const word = interaction.options.getString("word").toLowerCase();

  try {
    let blacklist = fs.existsSync("blacklist.json")
      ? JSON.parse(fs.readFileSync("blacklist.json", "utf8"))
      : [];

    if (blacklist.includes(word)) {
      blacklist = blacklist.filter((w) => w !== word);
      fs.writeFileSync("blacklist.json", JSON.stringify(blacklist, null, 2));
      await interaction.reply({
        content: `✅ The word "${word}" has been removed from the blacklist.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ The word "${word}" is not in the blacklist.`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Error updating blacklist:", error);
    await interaction.reply({
      content: "❌ An error occurred while updating the blacklist.",
      ephemeral: true,
    });
  }
}

export { blacklistCommands, handleBlacklistCommand, handleWhitelistCommand };
