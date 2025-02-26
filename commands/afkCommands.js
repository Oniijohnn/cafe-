import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionsBitField, EmbedBuilder } from "discord.js";
import fs from "fs";

const AFK_CONFIG_FILE = "afk_config.json";
let afkConfig = fs.existsSync(AFK_CONFIG_FILE)
  ? JSON.parse(fs.readFileSync(AFK_CONFIG_FILE, "utf8"))
  : {
      allowedRoles: [],
      ignoredChannels: [],
      ignoredRoles: [],
    };

const afkCommands = [
  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set your status to AFK.")
    .addStringOption((option) =>
      option.setName("message").setDescription("The AFK message").setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("afk-remove")
    .setDescription("Remove AFK status from a user.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to remove AFK status from").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("config-afk")
    .setDescription("Configure AFK settings.")
    .addRoleOption((option) =>
      option.setName("allowed_roles").setDescription("Roles allowed to use AFK command").setRequired(false),
    )
    .addChannelOption((option) =>
      option.setName("ignored_channels").setDescription("Channels where AFK status won't be removed").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("ignored_roles").setDescription("Roles ignored for AFK status").setRequired(false),
    ),
].map((command) => command.toJSON());

async function handleAfkCommand(interaction, client) {
  await interaction.deferReply({ ephemeral: true }); // Acknowledge the interaction

  const afkMessage = interaction.options.getString("message") || "AFK";
  const userId = interaction.user.id;
  const member = interaction.guild.members.cache.get(userId);

  // Change user's nickname to include [AFK]
  const originalNickname = member.nickname || interaction.user.username;
  const afkNickname = `[AFK] ${originalNickname}`;

  // Store AFK status in memory or a database
  client.afkUsers = client.afkUsers || {};
  client.afkUsers[userId] = { message: afkMessage, originalNickname, timestamp: new Date() };

  try {
    await member.setNickname(afkNickname);
  } catch (error) {
    if (error.code === 50013) {
      console.error("❌ Missing Permissions to change nickname:", error);
      await interaction.editReply({
        content: "❌ I don't have permission to change your nickname.",
        ephemeral: true,
      });
      return;
    } else {
      throw error;
    }
  }

  // Acknowledge the interaction
  await interaction.editReply({
    content: `✅ <@${interaction.user.id}> is now AFK: ${afkMessage}`,
    ephemeral: true,
  });

  // Send confirmation message to the channel
  await interaction.channel.send({
    content: `✅ <@${interaction.user.id}> is now AFK: ${afkMessage}`,
  });
}

async function handleAfkRemoveCommand(interaction, client) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");

  if (client.afkUsers && client.afkUsers[user.id]) {
    const afkData = client.afkUsers[user.id];
    delete client.afkUsers[user.id];

    const member = await interaction.guild.members.fetch(user.id);
    await member.setNickname(afkData.originalNickname);

    await interaction.reply({
      content: `✅ AFK status removed from ${user.tag}.`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: `❌ ${user.tag} is not AFK.`,
      ephemeral: true,
    });
  }
}

async function handleConfigAfkCommand(interaction) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  const allowedRoles = interaction.options.getRole("allowed_roles");
  const ignoredChannels = interaction.options.getChannel("ignored_channels");
  const ignoredRoles = interaction.options.getRole("ignored_roles");

  if (allowedRoles) afkConfig.allowedRoles = allowedRoles.map((role) => role.id);
  if (ignoredChannels) afkConfig.ignoredChannels = ignoredChannels.map((channel) => channel.id);
  if (ignoredRoles) afkConfig.ignoredRoles = ignoredRoles.map((role) => role.id);

  // Save AFK configuration to file
  fs.writeFileSync(AFK_CONFIG_FILE, JSON.stringify(afkConfig, null, 2));

  await interaction.reply({
    content: "✅ AFK configuration updated successfully!",
    ephemeral: true,
  });
}

export { afkCommands, handleAfkCommand, handleAfkRemoveCommand, handleConfigAfkCommand };
