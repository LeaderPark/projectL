const { SlashCommandBuilder } = require("discord.js");
const { attendTeam } = require("../../scripts/TeamData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("참가")
    .setDescription("선택한 소환사를 팀 목록에 넣습니다.")
    .addUserOption(option => option.setName('소환사').setDescription('소환사를 맨션해주세요')),
  async execute(interaction) {
    const user = interaction.options.getUser('소환사');
    if(user === null) return await interaction.reply(`소환사를 추가해주세요`); 
    else if(user.bot) return await interaction.reply(`봇 말고 소환사를 넣으라고`);
    
    // 팀 추가 로직
    attendTeam(user);

    await interaction.reply(`소환사 ${user}님을 팀 목록에 추가하였습니다.`);
  },
};
