const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { deleteMatchById } = require("../../scripts/Utils/Query");

function canManageGuild(interaction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
  );
}

function buildDeleteMatchSuccessMessage(result) {
  const data = result?.data ?? {};
  const label = data.deletedGameId
    ? `${data.deletedGameId} (ID ${data.deletedMatchId})`
    : `ID ${data.deletedMatchId}`;

  return [
    `매치를 삭제했습니다: ${label}`,
    "관련된 누적 전적(킬/데스/어시스트, 챔피언·라인 기록, 승패, MMR 등)을 남은 경기 기준으로 다시 계산했습니다.",
    `남은 경기 수: ${Number(data.remainingMatchCount ?? 0)}개`,
  ].join("\n");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("매치삭제")
    .setDescription(
      "(서버 관리자 전용) 매치 ID로 경기 기록과 관련 누적 전적을 삭제합니다."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((option) =>
      option
        .setName("매치아이디")
        .setDescription("삭제할 매치의 ID (경기 목록/전적 페이지에서 확인할 수 있어요)")
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction) {
    if (!canManageGuild(interaction)) {
      await interaction.reply({
        content: "이 명령어는 서버 관리자만 사용할 수 있어요.",
        ephemeral: true,
      });
      return;
    }

    const matchId = interaction.options.getInteger("매치아이디");

    await interaction.deferReply({ ephemeral: true });

    const result = await deleteMatchById(interaction.guildId, matchId);

    if (!result.success) {
      await interaction.editReply(result.msg || "매치를 삭제하지 못했습니다.");
      return;
    }

    await interaction.editReply(buildDeleteMatchSuccessMessage(result));
  },
  buildDeleteMatchSuccessMessage,
  canManageGuild,
};
