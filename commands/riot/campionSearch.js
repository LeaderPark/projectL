const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const { getChampionData } = require("../../scripts/Riot/DataReceiver");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("챔피언검색")
    .setDescription("챔피언정보에 대해 검색할 수 있어요.")
    .addStringOption((option) =>
      option
        .setName("챔피언")
        .setDescription("챔피언 이름을 입력해주세요")
        .setRequired(true)
    ),
  async execute(interaction) {
    const name = interaction.options.getString("챔피언");
    let index = 0;
    const buttons = [
      {
        customId: "back",
        label: "<<",
        style: "Secondary",
        async action(interaction) {
          if (index <= 0) {
            return await interaction.reply("끝임");
          }
          await interaction.update({
            embeds: [embedLists[--index]],
            components: [row],
            content: "끝임",
          });
        },
      },
      {
        customId: "next",
        label: ">>",
        style: "Secondary",
        async action(interaction) {
          if (index >= embedLists.length - 1) {
            return await interaction.reply("끝임");
          }
          await interaction.update({
            embeds: [embedLists[++index]],
            components: [row],
          });
        },
      },
    ];

    const row = new ActionRowBuilder().addComponents(
      buttons.map((button) => {
        return new ButtonBuilder()
          .setCustomId(button.customId)
          .setLabel(button.label)
          .setStyle(button.style);
      })
    );

    await interaction.reply({ embeds: [embedLists[index]], components: [row] });

    //버튼에 지정된 customId만 message collector가 동작할 수 있게 함
    const filter = (interaction) => {
      return buttons.filter(
        (button) => button.customId === interaction.customId
      );
    };

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      // time: 60 * 1000,
    });

    collector.on("collect", async (interaction) => {
      const button = buttons.find(
        (button) => button.customId === interaction.customId
      );
      await button.action(interaction);
    });

    collector.on("end", async (collect) => {
      console.log("버튼 시간초과");
    });
    // getChampionData(name);
    // await interaction.reply({ embeds: [exampleEmbed] });
  },
};

const exampleEmbed1 = {
  color: 0x0099ff,
  title: "Some title1",
  url: "https://discord.js.org",
  author: {
    name: "Some name",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
    url: "https://discord.js.org",
  },
  description: "Some description here",
  thumbnail: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  fields: [
    {
      name: "Regular field title",
      value: "Some value here",
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: false,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
  ],
  image: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  timestamp: new Date().toISOString(),
  footer: {
    text: "Some footer text here",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
  },
};
const exampleEmbed2 = {
  color: 0x0099ff,
  title: "Some title2",
  url: "https://discord.js.org",
  author: {
    name: "Some name",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
    url: "https://discord.js.org",
  },
  description: "Some description here",
  thumbnail: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  fields: [
    {
      name: "Regular field title",
      value: "Some value here",
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: false,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
  ],
  image: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  timestamp: new Date().toISOString(),
  footer: {
    text: "Some footer text here",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
  },
};
const exampleEmbed3 = {
  color: 0x0099ff,
  title: "Some title3",
  url: "https://discord.js.org",
  author: {
    name: "Some name",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
    url: "https://discord.js.org",
  },
  description: "Some description here",
  thumbnail: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  fields: [
    {
      name: "Regular field title",
      value: "Some value here",
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: false,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
  ],
  image: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  timestamp: new Date().toISOString(),
  footer: {
    text: "Some footer text here",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
  },
};
const exampleEmbed4 = {
  color: 0x0099ff,
  title: "Some title4",
  url: "https://discord.js.org",
  author: {
    name: "Some name",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
    url: "https://discord.js.org",
  },
  description: "Some description here",
  thumbnail: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  fields: [
    {
      name: "Regular field title",
      value: "Some value here",
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: false,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
    {
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    },
  ],
  image: {
    url: "https://i.imgur.com/AfFp7pu.png",
  },
  timestamp: new Date().toISOString(),
  footer: {
    text: "Some footer text here",
    icon_url: "https://i.imgur.com/AfFp7pu.png",
  },
};

const embedLists = [exampleEmbed1, exampleEmbed2, exampleEmbed3, exampleEmbed4];
