const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("랭킹")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("랭킹시스템");
  },
};
