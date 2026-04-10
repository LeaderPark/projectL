const { SlashCommandBuilder } = require("discord.js");
const { setPrimaryRiotAccount } = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("대표아이디설정")
    .setDescription("등록된 롤 계정 중 대표 아이디를 설정합니다.")
    .addStringOption((option) =>
      option
        .setName("소환사이름")
        .setDescription("대표로 설정할 소환사 이름을 적어주세요")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("소환사태그")
        .setDescription("대표로 설정할 소환사 태그를 적어주세요")
        .setRequired(true)
    ),
  async execute(interaction) {
    const riotGameName = interaction.options.getString("소환사이름");
    const riotTagLine = interaction.options.getString("소환사태그");

    await interaction.deferReply({ ephemeral: true });

    const result = await setPrimaryRiotAccount(
      interaction.guildId,
      interaction.user.id,
      riotGameName,
      riotTagLine
    );

    if (!result.success) {
      await interaction.editReply(result.msg || "대표 아이디를 설정하지 못했습니다.");
      return;
    }

    await interaction.editReply(
      `대표 아이디를 ${result.data.primaryAccountDisplayName} 로 설정했습니다.`
    );
  },
};
