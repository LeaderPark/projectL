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
        console.log(
          `멤버의 역할: ${user.roles.cache.map((role) => role.name).join(", ")}`
        );
      } catch (error) {
        console.log(`서버에 없는 사람 : ${result.data[i].discord_id}`);
      }
    }
  },
};
