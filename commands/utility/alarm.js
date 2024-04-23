const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("알림")
    .setDescription("Provides information about the user.")
    .addStringOption((option) =>
      option.setName("내용").setDescription("보낼 내용을 작성해주세요.")
    ),
  async execute(interaction) {
    const notiString = interaction.options.getString("내용");
    const interactionUser = await interaction.guild.members.fetch(
      interaction.user.id
    );
    interactionUser
      .send(notiString)
      .then(() => console.log("메시지가 성공적으로 전송되었습니다."))
      .catch(console.error); // 오류 처리
  },
};
