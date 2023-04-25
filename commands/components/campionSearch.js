const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("챔피언검색")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("/챔피언검색 (이름)");
  },
};
