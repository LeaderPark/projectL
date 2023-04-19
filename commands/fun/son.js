const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("손환주")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("개패기");
  },
};
