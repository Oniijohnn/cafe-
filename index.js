// Load environment variables
import express from "express";
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, PermissionsBitField, Collection } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import { SlashCommandBuilder } from "@discordjs/builders";
import { afkCommands, handleAfkCommand, handleAfkRemoveCommand, handleConfigAfkCommand } from "./commands/afkCommands.js";
import { welcomeCommands, handleTestCommand, handleSetWelcomeCommand } from "./commands/welcomeCommands.js";
import { moderationCommands, handleBanCommand, handleTimeoutCommand, handleKickCommand, handleWarnCommand } from "./commands/moderationCommands.js";
import { blacklistCommands, handleBlacklistCommand, handleWhitelistCommand } from "./commands/blacklistCommands.js";
import { reportCommand, handleReportCommand } from "./commands/reportCommand.js";
import formatCommands from "./formatCommands.js";

dotenv.config(); // Load environment variables

// ✅ Add these logs to check if commands are being imported properly:
console.log("AFK Commands:", afkCommands);
console.log("Welcome Commands:", welcomeCommands);
console.log("Moderation Commands:", moderationCommands);
console.log("Blacklist Commands:", blacklistCommands);
console.log("Report Command:", reportCommand);

// Load bot token from .env file
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = "1318911111969374229";
const GUILD_ID = "995574131191984169";

// Create bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// AFK configuration
let afkConfig = {
  allowedRoles: [],
  ignoredChannels: [],
  ignoredRoles: [],
};

// Load AFK configuration from file if it exists
const AFK_CONFIG_FILE = "afk_config.json";
if (fs.existsSync(AFK_CONFIG_FILE)) {
  afkConfig = JSON.parse(fs.readFileSync(AFK_CONFIG_FILE, "utf8"));
}

// Utility function to format time difference
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 60;
  if (interval > 1) {
    return `${Math.floor(interval)} minutes ago`;
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return `${Math.floor(interval)} hours ago`;
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return `${Math.floor(interval)} days ago`;
  }
  return `${Math.floor(seconds)} seconds ago`;
}

// ✅ Listen for message commands
client.on("messageCreate", async (message) => {
  // Ignore messages from bots (to prevent infinite loops)
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Load blacklist
  let blacklist = fs.existsSync("blacklist.json")
    ? JSON.parse(fs.readFileSync("blacklist.json", "utf8"))
    : [];

  // Check if the message contains any banned words
  const bannedWord = blacklist.find((word) => content.includes(word));
  if (bannedWord) {
    await message.delete(); // Delete the message

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Warning")
      .setDescription(`That word is not allowed here, ${message.author}.`);

    await message.channel.send({ embeds: [embed] });
    return;
  }

  // Check if the author is AFK
  if (client.afkUsers && client.afkUsers[message.author.id]) {
    const afkData = client.afkUsers[message.author.id];

    // Check if the message is in an ignored channel
    if (!afkConfig.ignoredChannels.includes(message.channel.id)) {
      delete client.afkUsers[message.author.id]; // Remove AFK status

      // Restore original nickname
      const member = message.guild.members.cache.get(message.author.id);
      await member.setNickname(afkData.originalNickname);

      await message.reply(`Welcome back, ${message.author}! I removed your AFK`);
    }
  }

  // Check if the message mentions an AFK user
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(async (user) => {
      if (client.afkUsers && client.afkUsers[user.id]) {
        const afkData = client.afkUsers[user.id];
        const afkTime = timeSince(afkData.timestamp);

        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(`${user.username} is AFK`)
          .setDescription(`**Reason:** ${afkData.message}\n**Since:** ${afkTime}`)
          .setFooter({ text: `Server: ${message.guild.name}` });

        await message.reply({ embeds: [embed] });
      }
    });
  }

  // Check if the message contains "pogi" anywhere
  if (content.includes("pogi")) {
    await message.reply("Oo naman, napaka-pogi mo! 😎");
  }

  // Check for "hi"
  if (content === "hi") {
    await message.reply("Hello! 👋");
  }

  // Check for "ping"
  if (content === "ping") {
    await message.reply("Pong! 🏓");
  }
});

// Load or create the welcome config file
const WELCOME_CONFIG_FILE = "welcome_config.json";
let welcomeConfig = fs.existsSync(WELCOME_CONFIG_FILE)
  ? JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE, "utf8"))
  : {
      channelId: "996579657648455720",
      title: "Welcome to {server}!",
      description:
        "Hey {user}, we're glad you joined! Make yourself at home and enjoy!",
      thumbnail: "",
      footer: "We now have {member_count} members!",
      color: 0x00ff00,
    };

// ✅ Listen for new members joining
client.on("guildMemberAdd", async (member) => {
  try {
    const guild = member.guild;
    const welcomeChannel = guild.channels.cache.get(welcomeConfig.channelId);

    if (!welcomeChannel) {
      console.error("⚠️ Welcome channel not found!");
      return;
    }

    // Replace variables in welcome message
    const embed = new EmbedBuilder()
      .setTitle(welcomeConfig.title.replace("{server}", guild.name))
      .setDescription(
        welcomeConfig.description
          .replace("{user}", `<@${member.id}>`)
          .replace("{user_tag}", member.user.tag),
      )
      .setColor(welcomeConfig.color || 0xd2b3b3) // Default color
      .setFooter({
        text: welcomeConfig.footer.replace(
          "{member_count}",
          guild.memberCount.toString(),
        ),
      });

    // ✅ Set user avatar as thumbnail if no custom thumbnail is set
    const userAvatar = member.user.displayAvatarURL({
      format: "png",
      dynamic: true,
      size: 512,
    });
    const finalThumbnail = welcomeConfig.thumbnail
      ? welcomeConfig.thumbnail
      : userAvatar;
    embed.setThumbnail(finalThumbnail);

    await welcomeChannel.send({ embeds: [embed] });
    console.log(`✅ Welcome message sent to ${member.user.tag}`);
  } catch (error) {
    console.error("❌ Error sending welcome embed:", error);
  }
});

// Register slash commands
const commands = [
  ...afkCommands,
  ...welcomeCommands,
  ...moderationCommands,
  ...blacklistCommands,
  reportCommand,
];

// Log the full structure of commands
console.dir(commands, { depth: null });

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  try {
    const formattedCommands = formatCommands(commands);

    // Log the formatted commands
    console.log(JSON.stringify(formattedCommands, null, 2));

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: formattedCommands },
    );

    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

(async () => {
  try {
    console.log("Refreshing slash commands...");
    // Clear existing commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    // Register new commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: formatCommands(commands), 
    });
    console.log("Slash commands registered!");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
})();

// ✅ Handle /test command (Fix Applied Here)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "afk") {
    await handleAfkCommand(interaction, client);
  } else if (interaction.commandName === "afk-remove") {
    await handleAfkRemoveCommand(interaction, client);
  } else if (interaction.commandName === "config-afk") {
    await handleConfigAfkCommand(interaction);
  } else if (interaction.commandName === "test") {
    // Check for Admin permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ You need Administrator permissions to use this command.",
        ephemeral: true,
      });
    }

    try {
      const guild = interaction.guild;
      const welcomeChannel = guild.channels.cache.get(welcomeConfig.channelId);

      if (!welcomeChannel) {
        return interaction.reply({
          content: "❌ Welcome channel not found!",
          ephemeral: true,
        });
      }

      // Simulate welcome message for the user running /test
      const member = interaction.member;

      const embed = new EmbedBuilder()
        .setTitle(welcomeConfig.title.replace("{server}", guild.name))
        .setDescription(
          welcomeConfig.description
            .replace("{user}", `<@${member.id}>`)
            .replace("{user_tag}", member.user.tag),
        )
        .setColor(welcomeConfig.color || 0xd2b3b3) // Default color
        .setFooter({
          text: welcomeConfig.footer.replace(
            "{member_count}",
            guild.memberCount.toString(),
          ),
        });

      // ✅ Set user's avatar as thumbnail if no custom thumbnail is set
      const userAvatar = member.user.displayAvatarURL({
        format: "png",
        dynamic: true,
        size: 512,
      });
      const finalThumbnail = welcomeConfig.thumbnail
        ? welcomeConfig.thumbnail
        : userAvatar;
      embed.setThumbnail(finalThumbnail);

      await welcomeChannel.send({ embeds: [embed] });

      await interaction.reply({
        content: "✅ Welcome message tested successfully!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("❌ Error testing welcome embed:", error);
      await interaction.reply({
        content: "❌ An error occurred while testing the welcome message.",
        ephemeral: true,
      });
    }
  } else if (interaction.commandName === "post") {
    // ✅ Check for Admin permissions
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator,
      )
    ) {
      return interaction.reply({
        content: "❌ You need Administrator permissions to use this command.",
        ephemeral: true,
      });
    }

    // ✅ Get command options
    const channelOption = interaction.options.getChannel("channel");
    const messageType = interaction.options.getString("type");
    const messageContent = interaction.options.getString("message");
    const title = interaction.options.getString("title") || null;
    const description = interaction.options.getString("description") || null;
    const color = interaction.options.getString("color") || "#FFFFFF";
    const footer = interaction.options.getString("footer") || null;
    const imageUrl = interaction.options.getString("image") || null;
    const thumbnailUrl = interaction.options.getString("thumbnail") || null;

    // ✅ Validate the selected channel
    if (!channelOption || !channelOption.isTextBased()) {
      return interaction.reply({
        content: "❌ Please provide a valid text channel.",
        ephemeral: true,
      });
    }

    // ✅ Acknowledge interaction immediately
    await interaction.deferReply({ ephemeral: true });

    try {
      if (messageType === "text") {
        if (!messageContent) {
          return interaction.editReply({
            content: "❌ Message content is required for text type.",
            ephemeral: true,
          });
        }
        await channelOption.send(messageContent);
      } else if (messageType === "embed") {
        const embed = new EmbedBuilder();

        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter({ text: footer });

        // ✅ Fix Discord Image Links
        function fixDiscordImageUrl(url) {
          if (!url) return null;
          return (
            url
              .replace("media.discordapp.net", "cdn.discordapp.com")
              .split("?")[0] + "?format=png"
          );
        }

        const fixedImageUrl = fixDiscordImageUrl(imageUrl);
        const fixedThumbnailUrl = fixDiscordImageUrl(thumbnailUrl);

        if (fixedThumbnailUrl) embed.setThumbnail(fixedThumbnailUrl);
        if (fixedImageUrl) embed.setImage(fixedImageUrl);

        // ✅ Validate color input
        const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
        if (!hexRegex.test(color)) {
          return interaction.editReply({
            content:
              "❌ Invalid color format. Use a valid hex code (e.g., #FF5733).",
            ephemeral: true,
          });
        }
        embed.setColor(parseInt(color.replace("#", ""), 16) || 0xd2b3b3); // Default color

        // ✅ Ensure at least one field is provided
        if (
          !title &&
          !description &&
          !footer &&
          !fixedImageUrl &&
          !fixedThumbnailUrl
        ) {
          return interaction.editReply({
            content:
              "❌ You must provide at least a title, description, footer, or image.",
            ephemeral: true,
          });
        }

        // ✅ Send embed
        await channelOption.send({ embeds: [embed] });
      }

      // ✅ Confirm success
      await interaction.editReply({
        content: "✅ Post sent successfully!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("❌ Error in /post command:", error);
      await interaction.editReply({
        content: "❌ An error occurred while sending the post.",
        ephemeral: true,
      });
    }
  } else if (interaction.commandName === "setwelcome") {
    // ✅ Check for Admin permissions
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return interaction.reply({
        content: "❌ You need Administrator permissions to use this command.",
        ephemeral: true,
      });
    }

    // ✅ Get command options
    const title = interaction.options.getString("title") || null;
    const description = interaction.options.getString("description") || null;
    const footer = interaction.options.getString("footer") || null;
    const color = interaction.options.getString("color") || null;

    // ✅ Update welcome config
    if (title) welcomeConfig.title = title;
    if (description) welcomeConfig.description = description;
    if (footer) welcomeConfig.footer = footer;
    if (color) welcomeConfig.color = parseInt(color.replace("#", ""), 16);

    // ✅ Save changes to file
    fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(welcomeConfig, null, 2));

    await interaction.reply({
      content: "✅ Welcome embed updated successfully!",
      ephemeral: true,
    });
  } else if (interaction.commandName === "ban") {
    // ✅ Check for Admin permissions
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
  } else if (interaction.commandName === "timeout") {
    // ✅ Check for Admin permissions
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
  } else if (interaction.commandName === "kick") {
    // ✅ Check for Admin permissions
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
  } else if (interaction.commandName === "warn") {
    // ✅ Check for Admin permissions
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
  } else if (interaction.commandName === "blacklist") {
    // ✅ Check for Admin permissions
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
  } else if (interaction.commandName === "whitelist") {
    // ✅ Check for Admin permissions
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
  } else if (interaction.commandName === "help") {
    const guild = interaction.guild;
    const serverName = guild.name;
    const serverIcon = guild.iconURL({ format: "png", dynamic: true, size: 512 });

    const embed = new EmbedBuilder()
      .setColor(0xd2b3b3)
      .setTitle("Bot Commands and Features")
      .setDescription("Here are all the commands and features of the bot:")
      .addFields(
        { name: "/test 🛡️", value: "Manually triggers the welcome message." },
        { name: "/setwelcome 🛡️", value: "Configure the welcome embed." },
        { name: "/post 🛡️", value: "Post a message in a selected channel." },
        { name: "/ban 🛡️", value: "Ban a user from the server and optionally delete their messages from the last 7 days." },
        { name: "/timeout 🛡️", value: "Timeout a user from the server for a specified duration." },
        { name: "/kick 🛡️", value: "Kick a user from the server." },
        { name: "/warn 🛡️", value: "Warn a user." },
        { name: "/afk-remove 🛡️", value: "Remove AFK status from a user." },
        { name: "/afk", value: "Set your status to AFK." },
        { name: "/report", value: "Report a user to the support team." }
      )
      .setFooter({ text: serverName, iconURL: serverIcon });

    await interaction.reply({ embeds: [embed], ephemeral: false });
  } else if (interaction.commandName === "report") {
    const reportedUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const supportRoleId = "SUPPORT_ROLE_ID"; // Replace with your support role ID

    try {
      // Send report to support team
      const supportRole = interaction.guild.roles.cache.get(supportRoleId);
      const supportChannelId = "1237737011603836958"; // Report channel ID
      const supportChannel = interaction.guild.channels.cache.get(supportChannelId);

      if (supportChannel) {
        const reportEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("New User Report")
          .setDescription(`**Reported User:** <@${reportedUser.id}>\n**Reason:** ${reason}\n**Reported By:** <@${interaction.user.id}>`)
          .setTimestamp();

        await supportChannel.send({ content: `<@&${supportRoleId}>`, embeds: [reportEmbed] });
      }

      // Send DM to reported user
      const appealMessage = "You have been reported for violating the server rules. If you believe this is a mistake, please contact the support team to appeal.";
      await reportedUser.send(appealMessage);

      // Send confirmation to reporter
      await interaction.reply({
        content: `✅ Your report against <@${reportedUser.id}> has been submitted.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("❌ Error handling report:", error);
      await interaction.reply({
        content: "❌ An error occurred while submitting your report.",
        ephemeral: true,
      });
    }
  } else if (interaction.commandName === "afk-remove") {
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
});

// Express keep-alive server
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));

const PORT = process.env.PORT || 10000; // Use Render's assigned port
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Keep-alive web server running on port ${PORT}!`);
});

client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);

  client.user.setPresence({
    activities: [{ name: "/help", type: 2 }], // "Listening to lofi beats"
    status: "online", // Options: "online", "idle", "dnd", "invisible"
  });

  console.log("Bot status set!");

  // Log memory usage at regular intervals
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log(`Memory Usage: RSS = ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap Total = ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB, Heap Used = ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB, External = ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
  }, 3600000); // Log every 1 hour
});

// Check what port Render assigns
console.log(`Bot is running on port: ${PORT}`);

// Log in the bot
client.login(TOKEN);
