const { SlashCommandBuilder } = require("discord.js");
const { getRankData } = require("../../scripts/Utils/Query");
const { buildPublicRankingUrl } = require("../../scripts/Utils/PublicSiteLinks");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("랭킹")
    .setDescription("내전 랭킹을 보여줍니다."),
  async execute(interaction) {
    await interaction.deferReply({ content: "...searching" });

    const result = await getRankData(interaction.guildId);
    if (!result.success) {
      return await interaction.editReply(result.msg);
    }

    const rankingUrl = buildPublicRankingUrl(interaction.guildId);
    if (!rankingUrl) {
      return await interaction.editReply("공개 사이트 주소가 설정되지 않았습니다.");
    }

    return await interaction.editReply(
      `공개 랭킹은 아래 링크에서 확인해 주세요.\n${rankingUrl}`
    );
  },
};
