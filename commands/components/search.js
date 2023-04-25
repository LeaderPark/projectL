const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("검색")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("/검색 (닉네임)");
  },
};
