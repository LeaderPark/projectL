const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("참가")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("팀참가");
  },
};
