const { SlashCommandBuilder } = require("discord.js");
const { getRankData } = require("../../scripts/Utils/Query");
const LOLRoleId = "1232156030847156350";
const R6RoleId = "1232196158747578409";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("알림")
    .setDescription("알림이 설정된 사람에게 알림을 보내요")
    .addStringOption((option) =>
      option
        .setName("옵션")
        .setDescription("알림 옵션을 지정해주세요.")
        .setRequired(true)
        .addChoices(
          { name: "리그오브레전드", value: "LOL" },
          { name: "레인보우식스시즈", value: "R6" }
        )
      ),
  async execute(interaction) {
    const addOption = interaction.options.getString("옵션");
    let roleId = "";
    if(addOption === "LOL"){
      roleId = LOLRoleId;
    }else{
      roleId = R6RoleId;
    }
    
    await interaction.deferReply({ content: "...searching" });

    const result = await getRankData();
    if (!result.success) {
      return await interaction.editReply(result.msg);
    }
    for (let i = 0; i < result.data.length; i++) {
      try {
        const user = await interaction.guild.members.fetch(
          result.data[i].discord_id
        );
        const hasRole = user.roles.cache.some(role => role.id === roleId)
        if(hasRole){
          user
          .send(messageContent)
          .then(() => console.log(user.user.username , "에게 메세지를 보냈습니다."))
        }
      } catch (error) {
        console.log(`서버에 없는 사람 : ${result.data[i].discord_id}`);
      }
    }
  },
};
