const { SlashCommandBuilder } = require("discord.js");
const { getLatestMatched } = require("../../scripts/Utils/Query");
const { buildPublicPlayerUrl } = require("../../scripts/Utils/PublicSiteLinks");

function resolveSelectedUser(interaction, member) {
  return interaction.options.getUser("검색할소환사") || member?.user || member;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("전적")
    .setDescription("최근 3개 게임을 볼 수 있어요.")
    .addUserOption((option) =>
      option
        .setName("검색할소환사")
        .setDescription("검색할 소환사를 멘션해주세요")
    ),
  async execute(interaction) {
    const interactionMember = await interaction.guild.members.fetch(
      interaction.user.id
    );
    const user = resolveSelectedUser(interaction, interactionMember);

    if (user.bot) {
      return await interaction.reply("봇 말고 소환사를 넣으라고");
    }

    await interaction.deferReply({ content: "...searching" });
    const result = await getLatestMatched(interaction.guildId, user.id);
    if (!result.success) {
      return await interaction.editReply(result.msg || "오류가 발생했습니다.");
    }

    if (result.data.length <= 0) {
      return await interaction.editReply("최근 전적이 없습니다.");
    }

    const playerUrl = buildPublicPlayerUrl(interaction.guildId, user.id);
    if (!playerUrl) {
      return await interaction.editReply("공개 사이트 주소가 설정되지 않았습니다.");
    }

    return await interaction.editReply(
      `최근 전적은 아래 링크에서 확인해 주세요.\n${playerUrl}`
    );
  },
};
