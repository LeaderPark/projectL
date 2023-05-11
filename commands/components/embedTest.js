const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("임베드")
    .setDescription("임베드 테스트"),
  async execute(interaction) {
    await interaction.reply({ embeds: [embed] });
  },
};

const embed = {
  color: 0x0099ff,
  setTitle: "내전 팀 분배",
  author: {
    name: `팀 분배 결과`,
  },
  description: `1에 있는 유저들을 2개의 팀으로 나누어 2, 3로 이동시켰습니다!`,
  fields: [
    {
      name: "블루팀",
      value: "왼쪽",
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "퍼플팀",
      value: "오른쪽",
      inline: true,
    },
    {
      name: "소환사1",
      value: `0`,
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "소환사2",
      value: `0`,
      inline: true,
    },
    {
      name: "소환사1",
      value: `0`,
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "소환사2",
      value: `0`,
      inline: true,
    },
    {
      name: "소환사1",
      value: `0`,
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "소환사2",
      value: `0`,
      inline: true,
    },
    {
      name: "소환사1",
      value: `0`,
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "소환사2",
      value: `0`,
      inline: true,
    },
    {
      name: "소환사1",
      value: `0`,
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "소환사2",
      value: `0`,
      inline: true,
    },
  ],
  timestamp: new Date().toISOString(),
  footer: {
    text: "만든이 - 천재개발자환주님, 진우",
  },
};
