// Load environment variables
import express from "express";
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, PermissionsBitField, Collection } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import { SlashCommandBuilder } from "@discordjs/builders";

dotenv.config(); // Load environment variables

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
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays all commands and features of the bot."),
  new SlashCommandBuilder()
    .setName("test")
    .setDescription("Manually triggers the welcome message."),
  new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("Configure the welcome embed.")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Set the title")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Set the description")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("footer")
        .setDescription("Set the footer text")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Set the embed color (hex)")
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("post")
    .setDescription("Post a message in a selected channel.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Select the channel to post in")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Choose between 'text' or 'embed'")
        .setRequired(true)
        .addChoices(
          { name: "Text", value: "text" },
          { name: "Embed", value: "embed" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message content (required for text type)")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("title").setDescription("Embed title").setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Embed description (required for embed type)")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("thumbnail")
        .setDescription("Embed thumbnail URL")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription("Embed image URL")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Embed color (hex)")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("footer")
        .setDescription("Embed footer text")
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server and delete their messages from the last 7 days.")
    .addUserOption(option => 
      option
        .setName("user")
        .setDescription("The user to ban")
        .setRequired(true)
    )
    .addStringOption(option => 
      option
        .setName("reason")
        .setDescription("The reason for the ban")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user from the server for 60 seconds.")
    .addUserOption(option => 
      option
        .setName("user")
        .setDescription("The user to timeout")
        .setRequired(true)
    )
    .addStringOption(option => 
      option
        .setName("reason")
        .setDescription("The reason for the timeout")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server.")
    .addUserOption(option => 
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .addStringOption(option => 
      option
        .setName("reason")
        .setDescription("The reason for the kick")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Add a word to the blacklist.")
    .addStringOption(option => 
      option
        .setName("word")
        .setDescription("The word to add to the blacklist")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Remove a word from the blacklist.")
    .addStringOption(option => 
      option
        .setName("word")
        .setDescription("The word to remove from the blacklist")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set your status to AFK.")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("The AFK message")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user to the support team.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to report")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("The reason for the report")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("config-afk")
    .setDescription("Configure AFK settings.")
    .addRoleOption(option =>
      option
        .setName("allowed_roles")
        .setDescription("Roles allowed to use AFK command")
        .setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName("ignored_channels")
        .setDescription("Channels where AFK status won't be removed")
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName("ignored_roles")
        .setDescription("Roles ignored for AFK status")
        .setRequired(false)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Refreshing slash commands...");
    // Clear existing commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    // Register new commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands, 
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
    const afkMessage = interaction.options.getString("message") || "AFK";
    const userId = interaction.user.id;
    const member = interaction.guild.members.cache.get(userId);

    // Change user's nickname to include [AFK]
    const originalNickname = member.nickname || interaction.user.username;
    const afkNickname = `[AFK] ${originalNickname}`;

    // Store AFK status in memory or a database
    client.afkUsers = client.afkUsers || {};
    client.afkUsers[userId] = { message: afkMessage, originalNickname };

    try {
      await member.setNickname(afkNickname);
    } catch (error) {
      if (error.code === 50013) {
        console.error("❌ Missing Permissions to change nickname:", error);
        await interaction.reply({
          content: "❌ I don't have permission to change your nickname.",
          ephemeral: true,
        });
        return;
      } else {
        throw error;
      }
    }

    // Delete the user's command message
    await interaction.deleteReply();

    // Send confirmation message to the channel
    await interaction.channel.send({
      content: `✅ ${interaction.user.username} is now AFK: ${afkMessage}`,
    });
  } else if (interaction.commandName === "config-afk") {
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

    if (allowedRoles) afkConfig.allowedRoles = allowedRoles.map(role => role.id);
    if (ignoredChannels) afkConfig.ignoredChannels = ignoredChannels.map(channel => channel.id);
    if (ignoredRoles) afkConfig.ignoredRoles = ignoredRoles.map(role => role.id);

    // Save AFK configuration to file
    fs.writeFileSync(AFK_CONFIG_FILE, JSON.stringify(afkConfig, null, 2));

    await interaction.reply({
      content: "✅ AFK configuration updated successfully!",
      ephemeral: true,
    });
  } else if (interaction.commandName === "test") {
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
    try {
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
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return interaction.reply({
        content: "❌ You need Administrator permissions to use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.ban({ days: 7, reason });
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
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return interaction.reply({
        content: "❌ You need Administrator permissions to use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.timeout(60 * 1000, reason); // 60 seconds timeout
      await interaction.reply({
        content: `✅ ${user.tag} has been timed out for 60 seconds for: ${reason}`,
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
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
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
    const embed = new EmbedBuilder()
      .setColor(0xd2b3b3) // Default color
      .setTitle("Bot Commands and Features")
      .setDescription("Here are all the commands and features of the bot:")
      .addFields(
        { name: "/test", value: "Manually triggers the welcome message." },
        { name: "/setwelcome", value: "Configure the welcome embed." },
        { name: "/post", value: "Post a message in a selected channel." },
        { name: "/ban", value: "Ban a user from the server and delete their messages from the last 7 days." },
        { name: "/timeout", value: "Timeout a user from the server for 60 seconds." },
        { name: "/kick", value: "Kick a user from the server." },
        { name: "/blacklist", value: "Add or remove words from the blacklist." },
        { name: "/whitelist", value: "Add or remove words from the whitelist." },
        { name: "/help", value: "Displays all commands and features of the bot." },
        { name: "/afk", value: "Set your status to AFK." },
        { name: "/report", value: "Report a user to the support team." }
      );

    await interaction.reply({ embeds: [embed], ephemeral: false });
  } else if (interaction.commandName === "report") {
    const reportedUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const supportRoleId = "SUPPORT_ROLE_ID"; // Replace with your support role ID

    try {
      // Send report to support team
      const supportRole = interaction.guild.roles.cache.get(supportRoleId);
      const supportChannel = interaction.guild.channels.cache.find(channel => channel.name === "support"); // Replace with your support channel name

      if (supportRole && supportChannel) {
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
  }, 60000); // Log every 60 seconds
});

// Check what port Render assigns
console.log(`Bot is running on port: ${PORT}`);

// Log memory usage at regular intervals
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`Memory Usage: RSS = ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap Total = ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB, Heap Used = ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB, External = ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
}, 60000); // Log every 60 seconds

// Log in the bot
client.login(TOKEN);
