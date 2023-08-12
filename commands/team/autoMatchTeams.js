const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const { getUsersData } = require("../../scripts/Utils/Query");
const { TeamDataSaver, CheckTeamMember, ConvertTeam } = require("../../scripts/Utils/SaveTeamData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("내전")
    .setDescription(
      "음성채팅방에 있는 유저들을 2개의 팀으로 나누어 이동시킵니다."
    )
    .addStringOption((option) =>
      option
        .setName("옵션")
        .setDescription("추가 옵션을 지정해주세요.")
        .setRequired(true)
        .addChoices(
          { name: "MMR", value: "MMR" },
          { name: "무작위", value: "RANDOM" }
        )
    ),
  async execute(interaction) {
    const channel = interaction.member.voice.channel;
    const team1 = interaction.guild.channels.cache.find(
      (x) => x.name === "TEAM BLUE"
    );
    const team2 = interaction.guild.channels.cache.find(
      (x) => x.name === "TEAM PURPLE"
    );
    const addOption = interaction.options.getString("옵션");

    if (!channel) {
      return await interaction.reply({
        content: "음성채팅방에 참가해주세요!",
        ephemeral: true,
      });
    }

    const members = Array.from(channel.members.values());

    if (members.length < 10) {
      return await interaction.reply({
        content: "음성채팅방에 10명의 유저가 필요합니다!",
      });
    } else if (members.length > 10) {
      return await interaction.reply({
        content: "음성채팅방에 유저가 10명보다 많습니다.",
      });
    }

    let team1Members = [];
    let team2Members = [];
    let team1MMR = 0;
    let team2MMR = 0;
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("내전 팀 분배")
      .setAuthor({
        name: `${addOption}팀 분배 결과`,
      })
      .setDescription(
        `${channel.name}에 있는 유저들을 ${team1.name}, ${team2.name}로 이동시켰습니다!`
      )
      .addFields(
        {
          name: `블루팀 - ${team1.name}`,
          value: "왼쪽",
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: `퍼플팀 - ${team2.name}`,
          value: "오른쪽",
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: "만든놈 - 환주, 진우",
      });

    switch (addOption) {
      case "RANDOM":
        const shuffled = members.sort(() => 0.5 - Math.random());
        const midIndex = Math.ceil(shuffled.length / 2);
        team1Members = shuffled.slice(0, midIndex);
        team2Members = shuffled.slice(midIndex);
        for (let i = 0; i < team1Members.length; i++) {
          embed.addFields(
            {
              name: `소환사${2 * i + 1}`,
              value: `${team1Members[i].user} `,
              inline: true,
            },
            {
              name: "\u200b",
              value: "\u200b",
              inline: true,
            },
            {
              name: `소환사${2 * i + 2}`,
              value: `${team2Members[i].user}`,
              inline: true,
            }
          );
        }
        return await interaction.editReply({ embeds: [embed] });
      case "MMR":
        const userIds = members.map((member) => member.user.id);
        const users = await getUsersData(userIds);

        if (users.data.length < 10) {
          return await interaction.reply({
            content: "등록되지 않은 소환사가 있습니다.",
          });
        }

        for (let i = 0; i < users.data.length; i++) {
          const user = users.data[i];
          const member = members.find((x) => x.user.id === user.discord_id);
          if (team1MMR > team2MMR || team1Members.length >= 5) {
            team2MMR += user.mmr;
            team2Members.push({ member: member, user: user });
          } else {
            team1MMR += user.mmr;
            team1Members.push({ member: member, user: user });
          }
        }
        const result = CheckTeamMember(team1Members, team2Members);
        console.log(result);
        if (result) {
          const [team1, team2] = ConvertTeam(team1Members, team2Members)
          team1Members = team1;
          team2Members = team2;
          team1MMR = 0;
          team2MMR = 0;
          for (let i = 0; i < team1.length; i++) {
            team1MMR += team1[i].user.mmr
            team2MMR += team2[i].user.mmr
          }
        }
        TeamDataSaver(team1Members, team2Members)
        break;
      default:
        return await interaction.reply({
          content: "해당하는 옵션이 없습니다.",
          ephemeral: true,
        });
    }
    await interaction.deferReply("moving...");

    let arr = [0, 1, 2, 3, 4];

    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    for (let i = 0; i < team1Members.length; i++) {
      const team1Member = team1Members[arr[i]];
      const team2Member = team2Members[arr[i]];
      embed.addFields({
        name: `소환사${2 * i + 1}`,
        value: `${team1Member.user.name} - ${team1Member.member}`,
        inline: true,
      });
      embed.addFields({
        name: "\u200b",
        value: "\u200b",
        inline: true,
      });
      embed.addFields({
        name: `소환사${2 * i + 2}`,
        value: `${team2Member.user.name} - ${team2Member.member}`,
        inline: true,
      });
      await team1Member.member.voice.setChannel(team1);
      await team2Member.member.voice.setChannel(team2);
    }
    embed.addFields(
      {
        name: `팀 평균 MMR`,
        value: `${team1MMR / team1Members.length}`,
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: `팀 평균 MMR`,
        value: `${team2MMR / team2Members.length}`,
        inline: true,
      }
    );

    await interaction.editReply({ embeds: [embed] });
  },
};
