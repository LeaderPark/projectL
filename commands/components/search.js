const { SlashCommandBuilder } = require("discord.js");
const { getUserData } = require("../../scripts/Utils/Query");

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
    if (user.bot) return await interaction.reply(`봇 말고 소환사를 넣으라고`);
    const userData = await getUserData(user.id);
    console.log(userData);
    await interaction.reply("/검색 (닉네임)");
  },
};
