import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionsBitField } from "discord.js";

const moderationCommands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server and optionally delete their messages from the last 7 days.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the ban").setRequired(true),
    )
    .addBooleanOption((option) =>
      option.setName("delete_messages").setDescription("Delete messages from the past 7 days").setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user from the server for a specified duration.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to timeout").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the timeout").setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName("duration").setDescription("Duration of the timeout in minutes (1 to 10080)").setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to kick").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the kick").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to warn").setRequired(true),
    ),
].map((command) => command.toJSON());

async function handleBanCommand(interaction) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  const deleteMessages = interaction.options.getBoolean("delete_messages") || false;

  try {
    const member = await interaction.guild.members.fetch(user.id);
    await member.ban({ days: deleteMessages ? 7 : 0, reason });
    await interaction.reply({
      content: `✅ ${user.tag} has been banned for: ${reason}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("❌ Error banning user:", error);
    await interaction.reply({
      content: "❌ An error occurred while banning the user.",
      ephemeral: true,
    });
  }
}

async function handleTimeoutCommand(interaction) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  const duration = interaction.options.getInteger("duration") || 1;

  if (duration < 1 || duration > 10080) {
    return interaction.reply({
      content: "❌ Duration must be between 1 minute and 7 days (10080 minutes).",
      ephemeral: true,
    });
  }

  try {
    const member = await interaction.guild.members.fetch(user.id);
    await member.timeout(duration * 60 * 1000, reason); // Convert minutes to milliseconds
    await interaction.reply({
      content: `✅ ${user.tag} has been timed out for ${duration} minutes for: ${reason}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("❌ Error timing out user:", error);
    await interaction.reply({
      content: "❌ An error occurred while timing out the user.",
      ephemeral: true,
    });
  }
}

async function handleKickCommand(interaction) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");

  try {
    const member = await interaction.guild.members.fetch(user.id);
    await member.kick(reason);
    await interaction.reply({
      content: `✅ ${user.tag} has been kicked for: ${reason}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("❌ Error kicking user:", error);
    await interaction.reply({
      content: "❌ An error occurred while kicking the user.",
      ephemeral: true,
    });
  }
}

async function handleWarnCommand(interaction, client) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");
  const member = await interaction.guild.members.fetch(user.id);

  // Initialize warnings if not already present
  client.warnings = client.warnings || {};
  client.warnings[user.id] = client.warnings[user.id] || 0;

  // Increment warning count
  client.warnings[user.id] += 1;

  // Set nickname based on warning count
  let newNickname;
  if (client.warnings[user.id] === 1) {
    newNickname = `${member.nickname || user.username} 🚩`;
  } else if (client.warnings[user.id] >= 2) {
    newNickname = `${member.nickname || user.username} 🚩🚩`;
  }

  try {
    await member.setNickname(newNickname);
    await interaction.reply({
      content: `✅ ${user.tag} has been warned. Current warnings: ${client.warnings[user.id]}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("❌ Error warning user:", error);
    await interaction.reply({
      content: "❌ An error occurred while warning the user.",
      ephemeral: true,
    });
  }
}

export { moderationCommands, handleBanCommand, handleTimeoutCommand, handleKickCommand, handleWarnCommand };
