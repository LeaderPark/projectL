const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("정보")
    .setDescription("머글봇을 관음할 수 있어요."),
  async execute(interaction) {
    await interaction.reply(
      "멍청한 머글들을 위해 천재 마법사인 환주님이 친히 하사하신 물건"
    );
  },
};
