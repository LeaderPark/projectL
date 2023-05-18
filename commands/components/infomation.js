const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("정보")
    .setDescription("머글봇을 관음할 수 있어요."),
  async execute(interaction) {
    const user = await interaction.guild.members.fetch(
      "709953013908766842"
    );
    await interaction.reply(`머글들의 피난처 내전 봇 V1 \n작명 도움 - ${user.nickname}`);
  },
};
