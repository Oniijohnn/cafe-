import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionsBitField, EmbedBuilder } from "discord.js";
import fs from "fs";

const WELCOME_CONFIG_FILE = "welcome_config.json";
let welcomeConfig = fs.existsSync(WELCOME_CONFIG_FILE)
  ? JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE, "utf8"))
  : {
      channelId: "996579657648455720",
      title: "Welcome to {server}!",
      description: "Hey {user}, we're glad you joined! Make yourself at home and enjoy!",
      thumbnail: "",
      footer: "We now have {member_count} members!",
      color: 0x00ff00,
    };

const welcomeCommands = [
  new SlashCommandBuilder()
    .setName("test")
    .setDescription("Manually triggers the welcome message."),
  new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("Configure the welcome embed.")
    .addStringOption((option) =>
      option.setName("title").setDescription("Set the title").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("description").setDescription("Set the description").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("footer").setDescription("Set the footer text").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("color").setDescription("Set the embed color (hex)").setRequired(false),
    ),
].map((command) => command.toJSON());

async function handleTestCommand(interaction) {
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
        text: welcomeConfig.footer.replace("{member_count}", guild.memberCount.toString()),
      });

    // Set user's avatar as thumbnail if no custom thumbnail is set
    const userAvatar = member.user.displayAvatarURL({
      format: "png",
      dynamic: true,
      size: 512,
    });
    const finalThumbnail = welcomeConfig.thumbnail ? welcomeConfig.thumbnail : userAvatar;
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
}

async function handleSetWelcomeCommand(interaction) {
  // Check for Admin permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ You need Administrator permissions to use this command.",
      ephemeral: true,
    });
  }

  // Get command options
  const title = interaction.options.getString("title") || null;
  const description = interaction.options.getString("description") || null;
  const footer = interaction.options.getString("footer") || null;
  const color = interaction.options.getString("color") || null;

  // Update welcome config
  if (title) welcomeConfig.title = title;
  if (description) welcomeConfig.description = description;
  if (footer) welcomeConfig.footer = footer;
  if (color) welcomeConfig.color = parseInt(color.replace("#", ""), 16);

  // Save changes to file
  fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(welcomeConfig, null, 2));

  await interaction.reply({
    content: "✅ Welcome embed updated successfully!",
    ephemeral: true,
  });
}

export { welcomeCommands, handleTestCommand, handleSetWelcomeCommand };
