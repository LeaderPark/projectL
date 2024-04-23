const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("알림")
    .setDescription("특정 역할을 가진 사용자에게 정보를 제공합니다.")
    .addRoleOption((option) =>
      option
        .setName("역할")
        .setDescription("메시지를 받을 역할을 선택해주세요.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("내용")
        .setDescription("보낼 내용을 작성해주세요.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const notiString = interaction.options.getString("내용");
    const role = interaction.options.getRole("역할");

    role.members.forEach((member) => {
      if (!member.user.bot) {
        member
          .send(notiString)
          .then(() => console.log(`Message sent to ${member.user.tag}`))
          .catch(console.error);
      }
    });

    await interaction.reply("메시지가 성공적으로 전송되었습니다.");
  },
};
