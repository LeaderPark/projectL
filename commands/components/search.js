const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserData } = require("../../scripts/Utils/Query");

const linesConvert = {
  TOP: "탑",
  JUNGLE: "정글",
  MID: "미드",
  BOT: "원딜",
  SUPPORT: "서폿",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("검색")
    .setDescription("원하는 소환사의 정보를 검색할 수 있어요.")
    .addUserOption((option) =>
      option.setName("검색할소환사").setDescription("검색할 소환사를 멘션해주세요")
    ),
  async execute(interaction) {
    const interactionUser = await interaction.guild.members.fetch(
      interaction.user.id
    );
    const user = interaction.options.getUser("검색할소환사") || interactionUser;

    if (user.bot) {
      return await interaction.reply("봇 말고 소환사를 넣으라고");
    }

    const result = await getUserData(user.id);
    if (!result.success) {
      return await interaction.reply("오류가 발생했습니다.");
    }

    const userData = result.data[0];
    const totalPlay = userData.win + userData.lose;
    const winRate = Math.floor((userData.win / totalPlay) * 100);
    const totalKill = (userData.t_kill / totalPlay).toFixed(1);
    const totalDeath = (userData.t_death / totalPlay).toFixed(1);
    const totalAssist = (userData.t_assist / totalPlay).toFixed(1);
    const deathtoKillAssist = (
      (Number(totalKill) + Number(totalAssist)) / Number(totalDeath)
    ).toFixed(2);
    const totalKillRate = (userData.t_kill_rate / totalPlay).toFixed(1);

    const sortedLanes = Object.entries(JSON.parse(userData.lanes)).sort(
      ([, a], [, b]) => {
        const sumA = a.win + a.lose;
        const sumB = b.win + b.lose;
        return sumB - sumA;
      }
    );
    const [mostLine, subLine] = sortedLanes;
    const mostLineTotal = mostLine[1].win + mostLine[1].lose;
    const subLineTotal = subLine[1].win + subLine[1].lose;
    const mostLineRate = Math.floor(
      (mostLine[1].win / mostLineTotal) * 100
    );
    const subLineRate = Math.floor((subLine[1].win / subLineTotal) * 100);

    const sortedFriends = Object.entries(JSON.parse(userData.friends)).sort(
      ([, a], [, b]) => {
        const sumA = (a.win / (a.win + a.lose)) * a.win;
        const sumB = (b.win / (b.win + b.lose)) * b.win;
        return sumB - sumA;
      });
    const friends = Object.fromEntries(sortedFriends);
    const friendsKey = Object.keys(friends);
    const bestFriendTotal = friends[friendsKey[0]].win + friends[friendsKey[0]].lose;
    const worstFriendTotal = friends[friendsKey[friendsKey.length - 1]].win + friends[friendsKey[friendsKey.length - 1]].lose;
    const bestFriendRate = Math.floor(friends[friendsKey[0]].win / (bestFriendTotal) * 100)
    const worstFriendRate = Math.floor(friends[friendsKey[friendsKey.length - 1]].win / (worstFriendTotal) * 100)

    // const sortedCampions = Object.entries(JSON.parse(userData.sortedCampions)).sort(([, a], [, b]) => {
    //   const sumA = (a.win / (a.win + a.lose)) * a.win;
    //   const sumB = (b.win / (b.win + b.lose)) * b.win;
    //   return sumB - sumA;
    // });
    // const campions = Object.fromEntries(sortedCampions);
    // const campionsKey = Object.keys(campions);
    // const campions1Total = campions[campionsKey[0]].win + campions[campionsKey[0]].lose;
    // const campions2Total = campions[campionsKey[1]].win + campions[campionsKey[1]].lose;
    // const campions3Total = campions[campionsKey[2]].win + campions[campionsKey[2]].lose;

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
        {
          name: `주라인 - ${mostLineTotal} Play`,
          value: `**${linesConvert[mostLine[0]]}** || **${mostLineRate}%**`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "펜타킬",
          value: `**${userData.penta}**`,
          inline: true,
        },
        {
          name: `부라인 - ${subLineTotal} Play`,
          value: `**${linesConvert[subLine[0]]}** || **${subLineRate}%**`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "펜타킬을 뺏긴 횟수",
          value: `**${userData.quadra}**`,
          inline: true,
        },
        {
          name: `Best Friend - ${bestFriendTotal} Play`,
          value: `**${friendsKey[0]}** || **${bestFriendRate}%**`,
          inline: true,
        },
        {
          name: `Worst Friend - ${worstFriendTotal} Play`,
          value: `**${friendsKey[friendsKey.length - 1]}** || **${worstFriendRate}%**`,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: "만든놈 - 환주, 진우",
      });

    await interaction.reply({ embeds: [embed] });
  },
};
