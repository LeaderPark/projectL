const { SlashCommandBuilder,EmbedBuilder } = require("discord.js");
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
    if (addOption === "LOL") {
      roleId = LOLRoleId;
    } else {
      roleId = R6RoleId;
    }
    const embed = new EmbedBuilder();
    embed.setColor(0x0099ff).setTitle("내전 알림");
    embed.setColor(0x0099ff).setTimestamp().setFooter({
      text: "만든놈 - 환주, 진우",
    });
    const members = await interaction.guild.members.fetch();
    members.forEach(async (member) => {
      const updatedMember = await interaction.guild.members.fetch(member.id);
      if (updatedMember.roles.cache.has(roleId)) {
        console.log(`${updatedMember.user.tag} has the role!`); // 알림 허용을 한 사람들
        updatedMember.send({embeds : [embed]})
      }
    });
  },
};
