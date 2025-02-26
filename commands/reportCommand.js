import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";

const reportCommand = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Report a user to the support team.")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to report").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("The reason for the report").setRequired(true),
  )
  .toJSON();

async function handleReportCommand(interaction) {
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
}

export { reportCommand, handleReportCommand };
