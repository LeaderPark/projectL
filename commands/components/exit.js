const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("나가기")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("팀나가기");
  },
};
