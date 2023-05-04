const { SlashCommandBuilder } = require("discord.js");
const { exitTeam } = require("../../scripts/TeamData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("나가기")
    .setDescription("선택한 소환사를 팀 목록에서 제외합니다.")
    .addUserOption((option) =>
      option.setName("소환사").setDescription("소환사를 맨션해주세요")
    ),
  async execute(interaction) {
    const interactionUser = await interaction.guild.members.fetch(
      interaction.user.id
    );
    const user = interaction.options.getUser("소환사") || interactionUser;
    if (user.bot) return await interaction.reply(`봇 말고 소환사를 넣으라고`);

    // 팀 제외 로직
    if (!exitTeam(user))
      return await interaction.reply(`참가하지 않은 소환사입니다.`);

    await interaction.reply(`소환사 ${user}님을 팀 목록에서 제외하였습니다.`);
  },
};
