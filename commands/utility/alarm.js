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
    const notiString = interaction.options.getString("내용");
    const role = interaction.options.getRole("역할");

    const membersWithRole = role.members;
    let failedCount = 0;

    await Promise.all(
      membersWithRole.map(async (member) => {
        // 봇이 아닌 사용자에게만 메시지 보내기
        if (!member.user.bot) {
          try {
            await member.send(notiString);
          } catch (error) {
            console.error(`메시지 전송 실패: ${member.user.id}`, error);
            failedCount++;
          }
        }
      })
    );

    // 모든 메시지가 전송되었음을 알림
    await interaction.reply(
      `메시지가 성공적으로 전송되었습니다. ${
        membersWithRole.size - failedCount
      }명의 사용자에게 메시지를 보냈습니다. 실패: ${failedCount}명`
    );
  },
};
