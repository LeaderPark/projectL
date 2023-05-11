const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("team")
    .setDescription(
      "음성채팅방에 있는 유저들을 2개의 팀으로 나누어 이동시킵니다."
    ),
  async execute(interaction) {
    const channel = interaction.member.voice.channel;
    const team1 = interaction.guild.channels.cache.find(
      (x) => x.name === "Test1"
    );
    const team2 = interaction.guild.channels.cache.find(
      (x) => x.name === "Test2"
    );

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

    if (members.length < 10) {
      return await interaction.reply({
        content: "음성채팅방에 10명의 유저가 필요합니다!",
      });
    }

    //팀짜기 로직
    const shuffled = members.sort(() => 0.5 - Math.random());
    const team1Members = shuffled.slice(0, Math.ceil(shuffled.length / 2));
    const team2Members = shuffled.slice(
      Math.ceil(shuffled.length / 2),
      shuffled.length
    );
    //여기까지

    for (const member of team1Members) {
      await member.value.voice.setChannel(team1);
    }

    for (const member of team2Members) {
      await member.value.voice.setChannel(team2);
    }

    const embed = {
      color: 0x0099ff,
      setTitle: "음성채팅방 유저 이동",
      description: `${channel.name}에 있는 유저들을 2개의 팀으로 나누어 ${team1.name}, ${team2.name}로 이동시켰습니다!`,
    };
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
