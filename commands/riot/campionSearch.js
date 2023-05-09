const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { getChampionData } = require("../../scripts/Riot/DataReceiver");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("챔피언검색")
    .setDescription("챔피언정보에 대해 검색할 수 있어요.")
    .addStringOption((option) =>
      option.setName("챔피언").setDescription("챔피언 이름을 입력해주세요")
    ),
  async execute(interaction) {
    const name = interaction.options.getString("챔피언");
    // getChampionData(name);

    const buttons = [
      {
        customId: "back",
        label: "<<",
        style: "Secondary",
        async action(interaction) {
          await interaction.reply("test1 버튼을 클릭했다.");
        },
      },
      {
        customId: "next",
        label: ">>",
        style: "Secondary",
        async action(interaction) {
          await interaction.update({
            content: "버튼이 클릭됐어!",
            components: [],
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

    await interaction.reply({ content: "버튼", components: [row] });

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
  },
};
