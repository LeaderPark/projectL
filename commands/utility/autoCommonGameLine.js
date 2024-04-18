const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("일겜")
    .setDescription("일반 게임 라인을 정해줘요."),
  async execute(interaction) {
    const msg = await interaction.reply({
      content: "Pong!",
      fetchReply: true,
    });

    await interaction.editReply({
      content: `Pong!\nBot Latency: ${
        msg.createdTimestamp - interaction.createdTimestamp
      }ms`,
    });
  },
};
