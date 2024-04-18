const { SlashCommandBuilder } = require("discord.js");
const { getSummonerData } = require("../../scripts/Riot/DataReceiver");
const { promisePool } = require("../../scripts/Utils/DB");
const { registraion } = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("등록")
    .setDescription("소환사를 데이터베이스에 등록합니다.")
    .addStringOption((option) =>
      option
        .setName("소환사이름")
        .setDescription("소환사의 이름을 적어주세요")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("소환사태그")
        .setDescription("소환사의 태그을 적어주세요")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("등록할소환사")
        .setDescription("등록할 소환사를 멘션해주세요")
    ),
  async execute(interaction) {
    const interactionUser = await interaction.guild.members.fetch(
      interaction.user.id
    );

    const user = interaction.options.getUser("등록할소환사") || interactionUser;
    if (user.bot) return await interaction.reply(`봇 말고 소환사를 넣으라고`);

    const userName = interaction.options.getString("소환사이름");
    const userTag = interaction.options.getString("소환사태그");

    //search
    await interaction.deferReply("searching...");

    // const result = await getSummonerData(userName);
    const result = await getSummonerData(userName, userTag);

    if (!result)
      return await interaction.editReply("존재하지 않는 소환사 입니다.");

    //db insert
    const insertRes = await registraion(
      user.id,
      userName + "#" + userTag,
      result.data.puuid
    );

    if (!insertRes)
      return await interaction.editReply("에러가 발생하였습니다.");
    if (insertRes === -1)
      return await interaction.editReply("이미 등록된 소환사입니다.");

    await interaction.editReply("등록을 완료했습니다.");
  },
};
