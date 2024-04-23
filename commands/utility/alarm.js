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
    const role = interaction.options.getRole("역할");
    try {
      await guild.members.fetch(); // 서버의 모든 멤버를 캐시에 로드
      console.log(`Successfully fetched all members in ${guild.name}.`);

      guild.members.cache.forEach((member) => {
        console.log(`${member.user.tag} (${member.id})`); // 멤버 정보 로깅
      });
    } catch (error) {
      console.error("Error fetching guild members:", error);
    }
  },
};
