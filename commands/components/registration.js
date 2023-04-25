const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("등록")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("/등록 (자기 닉네임) / 최초 1회 or 변경시");
  },
};
