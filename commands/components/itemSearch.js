const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("아이템검색")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("/아이템검색 (이름)");
  },
};
