const { SlashCommandBuilder } = require("discord.js");
const { getSummonerData } = require("../../scripts/Riot/DataReceiver");
const { registerRiotAccount } = require("../../scripts/Utils/Query");

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
    const insertRes = await registerRiotAccount(interaction.guildId, user.id, {
      riotGameName: result.account.gameName || userName,
      riotTagLine: result.account.tagLine || userTag,
      puuid: result.account.puuid,
      summonerId: result.summoner.id,
    });

    if (!insertRes.success) {
      return await interaction.editReply(
        insertRes.msg || "에러가 발생하였습니다."
      );
    }

    await interaction.editReply("등록을 완료했습니다.");
  },
};
