const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("머글봇의 속도를 테스트해요"),
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
