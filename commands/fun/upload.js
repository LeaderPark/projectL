const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("upload")
    .setDescription("upload replay file!")
    .addAttachmentOption((option) =>
      option
        .setName("input")
        .setDescription("upload .rofl file")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.reply("Pong!");
  },
};
