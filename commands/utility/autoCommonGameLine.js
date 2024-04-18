const { SlashCommandBuilder } = require("discord.js");

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
    console.log(shuffledArray);
    // await interaction.reply(shuffledArray.join(", "));
  },
};
