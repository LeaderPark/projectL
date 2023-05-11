const { SlashCommandBuilder } = require("discord.js");
const { teamTable } = require("../../scripts/TeamData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("팀목록")
    .setDescription("참가중인 소환사를 볼 수 있어요"),
  async execute(interaction) {
    let text = "";
    let index = 1;
    if (teamTable.length > 0) {
      await interaction.deferReply("searching...");
      for await (let v of teamTable) {
        const u = await interaction.guild.members.fetch(v);
        text += `${index++}번 소환사: ${u}\n`;
      }
    } else {
      return await interaction.reply("참가한 사람이 없습니다");
    }

    await interaction.editReply(text);
  },
};
