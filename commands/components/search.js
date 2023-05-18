const { SlashCommandBuilder, EmbedBuilder, inlineCode } = require("discord.js");
const { getUserData } = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("검색")
    .setDescription("원하는 소환사의 정보를 검색할 수 있어요.")
    .addUserOption((option) =>
      option
        .setName("검색할소환사")
        .setDescription("검색할 소환사를 멘션해주세요")
    ),
  async execute(interaction) {
    const interactionUser = await interaction.guild.members.fetch(
      interaction.user.id
    );

    const user = interaction.options.getUser("검색할소환사") || interactionUser;
    if (user.bot) return await interaction.reply(`봇 말고 소환사를 넣으라고`);
    const result = await getUserData(user.id);
    if (!result.success) return await interaction.reply(`오류가 발생했습니다.`);
    const userData = result.data[0];
    console.log(userData);
    const totalPlay = (userData.win + userData.lose)
    const winRate = Math.floor((userData.win / totalPlay) * 100);
    const totalKill = (userData.t_kill / totalPlay).toFixed(1);
    const totalDeath = (userData.t_death / totalPlay).toFixed(1);
    const totalAssist = (userData.t_assist / totalPlay).toFixed(1);
    const deathtoKillAssist = ((Number(totalKill) + Number(totalAssist)) / Number(totalDeath)).toFixed(2);
    const totalKillRate = (userData.t_kill_rate / totalPlay).toFixed(1);


    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`${userData.name}님의 데이터`)
      .setDescription(`**TOTAL - ${totalPlay} Play**`)
      .addFields(
        {
          name: `승률`,
          value: `**${winRate}%**`,
          inline: true,
        },
        {
          name: "K / D / A",
          value: `**${totalKill}** / **${totalDeath}** / **${totalAssist}** || **${deathtoKillAssist}:1**`,
          inline: true,
        },
        {
          name: "킬관여",
          value: `**${totalKillRate}%**`,
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({
        text: "만든놈 - 환주, 진우",
      });

    await interaction.reply({ embeds: [embed] });
  },
};
