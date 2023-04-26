const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("정보")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply(
      "멍청한 머글들을 위해 마법사인 진우님이 친히 하사하신 인공두뇌"
    );
  },
};
