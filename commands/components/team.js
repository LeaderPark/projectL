const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("팀")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("/팀 (랜덤 or 밸런스) (이름들)");
  },
};
