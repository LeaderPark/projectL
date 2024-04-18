const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const line = ["탑", "정글", "미드", "원딜", "서폿"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("일겜")
    .setDescription("사용자 이름을 랜덤하게 섞어서 반환합니다.")
    .addStringOption((option) =>
      option
        .setName("이름들")
        .setDescription(
          "사람 최대 5명의 이름을 입력하세요. 이름은 쉼표로 구분합니다."
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const namesString = interaction.options.getString("이름들");
    const namesArray = namesString.split(",").map((name) => name.trim());
    const shuffledArray = namesArray.sort(() => Math.random() - 0.5);
    const embed = new EmbedBuilder();
    embed.setColor(0x0099ff).setTitle("일반게임 라인");
    for (let i = 0; i < shuffledArray.length; i++) {
      embed.addFields({
        name: `${line[i]}`,
        value: `${shuffledArray[i]}`,
        inline: false,
      });
    }
    embed.setColor(0x0099ff).setTimestamp().setFooter({
      text: "만든놈 - 환주, 진우",
    });
    await interaction.reply({embeds: [embed]});
  },
};
