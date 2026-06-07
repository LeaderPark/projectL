const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { deleteRiotAccount } = require("../../scripts/Utils/Query");

function canManageGuild(interaction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
  );
}

function buildDeletionSuccessMessage(result, options = {}) {
  const data = result?.data ?? {};
  const { targetMention } = options;
  const deletedName = data.deletedAccountDisplayName;
  const lines = [];

  if (targetMention) {
    lines.push(
      deletedName
        ? `${targetMention} 님의 등록을 삭제했습니다: ${deletedName}`
        : `${targetMention} 님의 등록을 삭제했습니다.`
    );
  } else {
    lines.push(
      deletedName ? `등록을 삭제했습니다: ${deletedName}` : "등록을 삭제했습니다."
    );
  }

  if (Number(data.remainingCount) > 0) {
    if (data.primaryAccountDisplayName) {
      lines.push(`현재 대표 아이디: ${data.primaryAccountDisplayName}`);
    }
    lines.push(`남은 등록 아이디: ${data.remainingCount}개`);
  } else {
    lines.push(
      targetMention
        ? "이제 해당 유저에게 등록된 롤 아이디가 없습니다."
        : "이제 등록된 롤 아이디가 없습니다."
    );
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
    )
    .addUserOption((option) =>
      option
        .setName("대상유저")
        .setDescription(
          "(서버 관리자 전용) 다른 사람의 등록 아이디를 삭제할 때 지정하세요"
        )
    ),
  async execute(interaction) {
    const riotGameName = interaction.options.getString("소환사이름");
    const riotTagLine = interaction.options.getString("소환사태그");
    const targetUser = interaction.options.getUser("대상유저");

    await interaction.deferReply({ ephemeral: true });

    const isOtherUser =
      Boolean(targetUser) && targetUser.id !== interaction.user.id;

    if (isOtherUser && !canManageGuild(interaction)) {
      await interaction.editReply(
        "다른 사람의 등록 아이디는 서버 관리자만 삭제할 수 있어요."
      );
      return;
    }

    const targetDiscordId = isOtherUser ? targetUser.id : interaction.user.id;

    const result = await deleteRiotAccount(
      interaction.guildId,
      targetDiscordId,
      riotGameName,
      riotTagLine
    );

    if (!result.success) {
      await interaction.editReply(result.msg || "롤 계정을 삭제하지 못했습니다.");
      return;
    }

    await interaction.editReply(
      buildDeletionSuccessMessage(result, {
        targetMention: isOtherUser ? `<@${targetUser.id}>` : undefined,
      })
    );
  },
  buildDeletionSuccessMessage,
  canManageGuild,
};
