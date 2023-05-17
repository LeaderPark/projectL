const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getRankData } = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("랭킹")
    .setDescription("내전 랭킹을 보여줍니다."),
  async execute(interaction) {
    await interaction.deferReply("searching...");

    const result = await getRankData();
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("랭킹")
      .setDescription(
        `등록되어 있는 소환사 ${result.data.length}명의 랭킹을 볼 수 있어요`
      )
      .setTimestamp()
      .setFooter({
        text: "만든놈 - 환주, 진우",
      });
    if (!result.success) {
      return await interaction.editReply(result.msg);
    }

    for (let i = 0; i < result.data.length; i++) {
      embed.addFields({
        name: `#${i}`,
        value: `${result.data[i].name}`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
