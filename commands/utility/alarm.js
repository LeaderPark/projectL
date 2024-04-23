const { SlashCommandBuilder } = require("discord.js");
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

    await interaction.guild.members.fetch();
    members.forEach(async (member) => {
      const updatedMember = await guild.members.fetch(member.id);
      if (updatedMember.roles.cache.has(roleId)) {
        console.log(`${updatedMember.user.tag} has the role!`);
      } else {
        console.log(`${updatedMember.user.tag} does not have the role.`);
      }
    });
  },
};
