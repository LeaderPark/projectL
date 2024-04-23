const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("알림")
    .setDescription("알림이 설정된 사람에게 알림을 보내요")
    .addStringOption((option) =>
      option
        .setName("내용")
        .setDescription("보낼 내용을 작성해주세요.")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("역할")
        .setDescription("메시지를 보낼 역할을 선택해주세요.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const messageContent = interaction.options.getString("내용");
    const roleId = interaction.options.getRole("역할").id;
    const role = interaction.guild.roles.cache.get(roleId);

    const membersWithRole = role.members;
    try {
      const messagePromises = membersWithRole.map((member) =>
        member
          .send(messageContent)
          .catch((err) =>
            console.error(`Failed to send DM to ${member.user.tag}.`)
          )
      );

      await Promise.all(messagePromises);
      await interaction.reply(`역할을 가진 모든 멤버에게 메시지를 보냈습니다.`);
    } catch (error) {
      console.error("Error sending messages: ", error);
      await interaction.reply("메시지를 보내는 동안 오류가 발생했습니다.");
    }
  },
};
