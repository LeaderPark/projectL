const { SlashCommandBuilder } = require("discord.js");
const { getRankData } = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("랭킹")
    .setDescription("내전 랭킹을 보여줍니다."),
  async execute(interaction) {
    await interaction.deferReply("searching...");

    const result = await getRankData();

    if (!result.success) {
      return await interaction.editReply(result.msg);
    }

    for (let user of result.data) {
      console.log(user.discord_id, user.name);
      //`<@${user.discord_id}>`
    }

    await interaction.editReply("랭킹시스템");
  },
};
