const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("팀")
    .setDescription("음성채팅방에 참여한 인원으로 팀을 구성해요"),
  async execute(interaction) {
    const interactionUser = await interaction.guild.members.fetch(
      interaction.user.id
    );

    // Object.values(interaction.guild.members).forEach((x) => console.log(x));
    console.log(interaction.guild.members.cache);
    await interaction.reply(`소환사님을 팀 목록에 추가하였습니다.`);
  },
};
