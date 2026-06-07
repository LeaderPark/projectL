const { SlashCommandBuilder } = require("discord.js");
const { deleteRiotAccount } = require("../../scripts/Utils/Query");

function buildDeletionSuccessMessage(result) {
  const data = result?.data ?? {};
  const lines = [];

  if (data.deletedAccountDisplayName) {
    lines.push(`등록을 삭제했습니다: ${data.deletedAccountDisplayName}`);
  } else {
    lines.push("등록을 삭제했습니다.");
  }

  if (Number(data.remainingCount) > 0) {
    if (data.primaryAccountDisplayName) {
      lines.push(`현재 대표 아이디: ${data.primaryAccountDisplayName}`);
    }
    lines.push(`남은 등록 아이디: ${data.remainingCount}개`);
  } else {
    lines.push("이제 등록된 롤 아이디가 없습니다.");
  }

  return lines.join("\n");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("아이디삭제")
    .setDescription("등록한 롤 계정을 삭제합니다.")
    .addStringOption((option) =>
      option
        .setName("소환사이름")
        .setDescription("삭제할 소환사 이름을 적어주세요")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("소환사태그")
        .setDescription("삭제할 소환사 태그를 적어주세요")
        .setRequired(true)
    ),
  async execute(interaction) {
    const riotGameName = interaction.options.getString("소환사이름");
    const riotTagLine = interaction.options.getString("소환사태그");

    await interaction.deferReply({ ephemeral: true });

    const result = await deleteRiotAccount(
      interaction.guildId,
      interaction.user.id,
      riotGameName,
      riotTagLine
    );

    if (!result.success) {
      await interaction.editReply(result.msg || "롤 계정을 삭제하지 못했습니다.");
      return;
    }

    await interaction.editReply(buildDeletionSuccessMessage(result));
  },
  buildDeletionSuccessMessage,
};
