const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("정보")
    .setDescription("머글봇의 정보를 볼 수 있어요."),
  async execute(interaction) {
    await interaction.reply(`머글들의 피난처 내전 봇 V2 2024.04.18 패치`);
  },
};
