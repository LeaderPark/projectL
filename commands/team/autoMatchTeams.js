const { SlashCommandBuilder } = require("@discordjs/builders");
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
          { name: "무작위", value: "RANDOM" },
          { name: "MMR", value: "MMR" }
        )
    ),
  async execute(interaction) {
    const channel = interaction.member.voice.channel;
    const team1 = interaction.guild.channels.cache.find(
      (x) => x.name === "Test1"
    );
    const team2 = interaction.guild.channels.cache.find(
      (x) => x.name === "Test2"
    );
    const addOption = interaction.options.getString("옵션");

    if (!channel) {
      return await interaction.reply({
        content: "음성채팅방에 참가해주세요!",
        ephemeral: true,
      });
    }

    const memberMap = channel.members;
    const members = Array.from(memberMap, function (entry) {
      return { key: entry[0], value: entry[1] };
    });

    // if (members.length < 10) {
    //   return await interaction.reply({
    //     content: "음성채팅방에 10명의 유저가 필요합니다!",
    //   });
    // }

    let team1Members = [];
    let team2Members = [];

    if (addOption === "RANDOM") {
      const shuffled = members.sort(() => 0.5 - Math.random());
      team1Members = shuffled.slice(0, Math.ceil(shuffled.length / 2));
      team2Members = shuffled.slice(
        Math.ceil(shuffled.length / 2),
        shuffled.length
      );
    } else if (addOption === "MMR") {
      //팀짜기 로직
    } else {
      return await interaction.reply({
        content: "해당하는 옵션이 없습니다.",
        ephemeral: true,
      });
    }

    for (const member of team1Members) {
      await member.value.voice.setChannel(team1);
    }

    for (const member of team2Members) {
      await member.value.voice.setChannel(team2);
    }

    const embed = {
      color: 0x0099ff,
      setTitle: "내전 팀 분배",
      author: {
        name: `${addOption}팀 분배 결과`,
      },
      description: `${channel.name}에 있는 유저들을 ${team1.name}, ${team2.name}로 이동시켰습니다!`,
      fields: [
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
        },
        {
          name: "소환사1",
          value: `소환사 이름 들어갈 자리`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "소환사2",
          value: `소환사 이름 들어갈 자리`,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "만든이 - 천재개발자환주님, 진우",
      },
    };
    await interaction.reply({ embeds: [embed] });
  },
};
