const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("명령어")
    .setDescription("머글봇의 사용법을 확인할 수 있어요"),
  async execute(interaction) {
    await interaction.reply("명령어 보여줌");
  },
};
