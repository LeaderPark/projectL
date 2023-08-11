const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getRankData } = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("랭킹")
    .setDescription("내전 랭킹을 보여줍니다."),
  async execute(interaction) {
    const embed = new EmbedBuilder();
    const embed1 = new EmbedBuilder();
    await interaction.deferReply({ content: "...searching" });

    const result = await getRankData();
    if (!result.success) {
      return await interaction.editReply(result.msg);
    }
    embed
      .setColor(0x0099ff)
      .setTitle("랭킹")
      .addFields({
        name: "\u200b",
        value: "\u200b",
        inline: false,
      });
    embed1
      .setColor(0x0099ff)
      .setTimestamp()
      .setFooter({
        text: "만든놈 - 환주, 진우",
      });

    let rankCounter = 1;
    for (let i = 0; i < result.data.length; i++) {
      try {
        const user = await interaction.guild.members.fetch(result.data[i].discord_id);
        if (rankCounter <= 20) {
          embed.addFields({
            name: `#${rankCounter}`,
            value: `${result.data[i].name} - ${user}`,
            inline: false,
          });
        } else {
          embed1.addFields({
            name: `#${rankCounter}`,
            value: `${result.data[i].name} - ${user}`,
            inline: false,
          });
        }
        rankCounter++;
      } catch (error) {
        console.log(`서버에 없는 사람 : ${result.data[i].discord_id}`);
      }
    }
    embed.setDescription(`등록되어 있는 소환사 ${rankCounter - 1}명의 랭킹을 볼 수 있어요`)
    embed1.addFields({
      name: "\u200b",
      value: "\u200b",
      inline: false,
    });
    embed1.addFields({
      name: `등록되어 있는 소환사 ${rankCounter - 1}명의 랭킹을 볼 수 있어요`,
      value: "\u200b",
      inline: false,
    });
    interaction.editReply({ embeds: [embed, embed1] })
  },
};
