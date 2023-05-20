const { SlashCommandBuilder, EmbedBuilder, Faces } = require("discord.js");
const { getUserData } = require("../../scripts/Utils/Query");

const linesConvert = {
  TOP: "탑",
  JUNGLE: "정글",
  MID: "미드",
  BOT: "원딜",
  SUPPORT: "서폿",
  NON: "NO DATA"
};

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

    if (user.bot) {
      return await interaction.reply("봇 말고 소환사를 넣으라고");
    }

    const result = await getUserData(user.id);
    if (!result.success) {
      return await interaction.reply("오류가 발생했습니다.");
    }

    const userData = result.data[0];
    if (Number(userData.win) + Number(userData.lose) <= 0) {
      return await interaction.reply("등록된 정보가 없습니다.");
    }

    const [totalPlay, winRate] = getData(userData.win, userData.lose)
    const [totalKill, totalDeath, totalAssist, deathtoKillAssist] = getKDA(userData.t_kill, userData.t_death, userData.t_assist, totalPlay)
    const totalKillRate = (userData.t_kill_rate / totalPlay).toFixed(1);

    const sortedLanes = Object.entries(JSON.parse(userData.lanes)).sort(
      ([, a], [, b]) => {
        const sumA = a.win + a.lose;
        const sumB = b.win + b.lose;
        return sumB - sumA;
      }
    );
    const [mostLine, subLine] = sortedLanes;
    const [mostLineTotal, mostLineRate] = getData(
      mostLine[1].win,
      mostLine[1].lose
    );
    let subLineTotal = 0, subLineRate = 0
    if (subLine) {
      [subLineTotal, subLineRate] = getData(
        subLine[1].win,
        subLine[1].lose
      );
    }
    const sortedFriends = Object.entries(JSON.parse(userData.friends)).sort(
      ([, a], [, b]) => {
        const sumA = (a.win / (a.win + a.lose)) * a.win;
        const sumB = (b.win / (b.win + b.lose)) * b.win;
        return sumB - sumA;
      }
    );
    const friends = Object.fromEntries(sortedFriends);
    const friendsKey = Object.keys(friends);
    const [bestFriendTotal, bestFriendRate] = getData(
      friends[friendsKey[0]].win,
      friends[friendsKey[0]].lose
    );
    const [worstFriendTotal, worstFriendRate] = getData(
      friends[friendsKey[friendsKey.length - 1]].win,
      friends[friendsKey[friendsKey.length - 1]].lose
    );

    const sortedChampions = Object.entries(
      JSON.parse(userData.champions)
    ).sort(([, a], [, b]) => {
      const sumA = a.win + a.lose;
      const sumB = b.win + b.lose;
      return sumB - sumA;
    });
    const champions = Object.fromEntries(sortedChampions);
    const championsKey = Object.keys(champions);
    const champ1 = champions[championsKey[0]];
    const champ2 = champions[championsKey[1]];
    const champ3 = champions[championsKey[2]];
    const [champ1Total, champ1TotalRate] = getData(
      champ1.win,
      champ1.lose
    );
    const [champ1K, champ1D, champ1A, champ1KTA] = getKDA(champ1.kills, champ1.deaths, champ1.assist, champ1Total);

    let champ2Total = 0, champ2TotalRate = 0;
    let champ2K = 0, champ2D = 0, champ2A = 0, champ2KTA = 0;
    if (champ2) {
      [champ2Total, champ2TotalRate] = getData(
        champ2.win,
        champ2.lose
      );
      [champ2K, champ2D, champ2A, champ2KTA] = getKDA(champ2.kills, champ2.deaths, champ2.assist, champ2Total);
    }

    let champ3Total = 0, champ3TotalRate = 0;
    let champ3K = 0, champ3D = 0, champ3A = 0, champ3KTA = 0;
    if (champ3) {
      [champ3Total, champ3TotalRate] = getData(
        champ3.win,
        champ3.lose
      );
      [champ3K, champ3D, champ3A, champ3KTA] = getKDA(champ3.kills, champ3.deaths, champ3.assist, champ3Total);
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`${userData.name}님의 데이터`)
      .setDescription(`**TOTAL - ${totalPlay} Play**`)
      .addFields(
        {
          name: `승률`,
          value: `**${winRate}%**`,
          inline: false,
        },
        {
          name: "K / D / A",
          value: `**${totalKill}** / **${totalDeath}** / **${totalAssist}** || **${deathtoKillAssist}:1**`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
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
          value: `**${linesConvert[subLine === undefined ? "NON" : subLine[0]]}** || **${subLineRate}%**`,
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
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: `Worst Friend - ${worstFriendTotal} Play`,
          value: `**${friendsKey[friendsKey.length - 1]
            }** || **${worstFriendRate}%**`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: false,
        },
        {
          name: `Most Champion`,
          value: "\u200b",
          inline: false,
        },
        {
          name: `${championsKey[0]} - ${champ1Total} Play`,
          value: "\u200b",
          inline: true,
        },
        {
          name: `${champ1KTA}:1 평점`,
          value: `${champ1K} / ${champ1D} / ${champ1A}`,
          inline: true,
        },
        {
          name: `${champ1TotalRate}%`,
          value: `${champ1Total} 게임`,
          inline: true,
        },
        {
          name: `${championsKey[1] || "NO DATA"} - ${champ2Total} Play`,
          value: "\u200b",
          inline: true,
        },
        {
          name: `${champ2KTA}:1 평점`,
          value: `${champ2K} / ${champ2D} / ${champ2A}`,
          inline: true,
        },
        {
          name: `${champ2TotalRate}%`,
          value: `${champ2Total} 게임`,
          inline: true,
        },
        {
          name: `${championsKey[2] || "NO DATA"} - ${champ3Total} Play`,
          value: "\u200b",
          inline: true,
        },
        {
          name: `${champ3KTA}:1 평점`,
          value: `${champ3K} / ${champ3D} / ${champ3A}`,
          inline: true,
        },
        {
          name: `${champ3TotalRate}%`,
          value: `${champ3Total} 게임`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
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

const getData = (win, lose) => {
  const total = win + lose;
  return [total, Math.floor((win / total) * 100)];
};

const getKDA = (k, d, a, total) => {
  const kill = k / total;
  const death = d / total;
  const assist = a / total;
  const deathtoKillAssist = (kill + death) / assist;
  return [kill.toFixed(1), death.toFixed(1), assist.toFixed(1), deathtoKillAssist.toFixed(2)]

}
