const { SlashCommandBuilder } = require("discord.js");
const { teamData } = require("../../scripts/TeamData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("팀목록")
    .setDescription("참가중인 소환사를 볼 수 있어요"),
  async execute(interaction) {
    // await interaction.reply();
  },
};
