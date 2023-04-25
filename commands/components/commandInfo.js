const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("명령어")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("명령어 보여줌");
  },
};
