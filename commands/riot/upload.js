const { SlashCommandBuilder } = require("discord.js");
const { getMatchData } = require("../../scripts/Utils/Parser");
const { persistMatchResult } = require("../../scripts/Utils/Query");

function getReplayBaseName(fileName) {
  return fileName.slice(0, -".rofl".length);
}

function formatUnregisteredUsers(users) {
  return users.join(", ");
}

function getDisplayableUnregisteredUsers(users) {
  if (!Array.isArray(users)) {
    return [];
  }

  return users.map((user) => String(user ?? "").trim()).filter(Boolean);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("업로드")
    .setDescription("리플레이 파일을 업로드해 정보를 등록하세요!")
    .addAttachmentOption((option) =>
      option
        .setName("replay")
        .setDescription("upload .rofl file")
        .setRequired(true)
    ),

  async execute(interaction) {
    const file = interaction.options.getAttachment("replay");

    if (!file.name.endsWith(".rofl")) {
      await interaction.reply(`${file.name} is not .rofl file`);
      return;
    }

    await interaction.deferReply("uploading...");

    const replay = await getMatchData(file.url, file.name);
    if (typeof replay !== "object" || replay === null) {
      await interaction.editReply(replay);
      return;
    }

    const result = await persistMatchResult(
      interaction.guildId,
      replay,
      getReplayBaseName(file.name)
    );

    if (!result.success) {
      await interaction.editReply(
        result.msg || "경기 결과를 저장하는 중 예기치 못한 오류가 발생하였습니다."
      );
      return;
    }

    const unregisteredUsers = getDisplayableUnregisteredUsers(result.user);
    if (unregisteredUsers.length > 0) {
      await interaction.editReply(
        `업로드가 완료되었습니다. 등록 되지 않은 소환사 : ${formatUnregisteredUsers(
          unregisteredUsers
        )}`
      );
      return;
    }

    await interaction.editReply("업로드가 완료되었습니다.");
  },
};
