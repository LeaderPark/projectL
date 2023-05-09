const { SlashCommandBuilder } = require("discord.js");
const { getChampionData } = require("../../scripts/Riot/DataReceiver");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("챔피언검색")
    .setDescription("Replies with Pong!")
    .addStringOption((option) =>
      option.setName("챔피언").setDescription("챔피언 이름을 입력해주세요")
    ),
  async execute(interaction) {
    const name = interaction.options.getString("챔피언");
    getChampionData(name);
    await interaction.reply(name);
  },
};
