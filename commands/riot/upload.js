const { SlashCommandBuilder } = require("discord.js");
const { getMatchData } = require("../../scripts/Utils/Parser");
const {
  insertMatchData,
  updateUserData,
} = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("upload")
    .setDescription("upload replay file!")
    .addAttachmentOption((option) =>
      option
        .setName("replay")
        .setDescription("upload .rofl file")
        .setRequired(true)
    ),
  async execute(interaction) {
    const file = interaction.options.getAttachment("replay");
    const subIndex = file.name.length - 5;
    const fileName = file.name.slice(0, subIndex);
    const extension = file.name.slice(file.name.length - 5);

    if (extension !== ".rofl") {
      await interaction.reply(`${file.name} is not .rofl file`);
      return;
    }

    await interaction.deferReply("uploading...");
    const replay = await getMatchData(file.url, file.name);
    if (typeof replay !== "object") {
      await interaction.editReply(replay);
      return;
    }

    const result = await insertMatchData(replay, fileName);

    if (!result.success) {
      return await interaction.editReply(
        result.msg || "예기치 못한 오류가 발생하였습니다."
      );
    }

    const res2 = await updateUserData(replay);

    if (!res2.success) {
      return await interaction.editReply(
        res2.msg || "예기치 못한 오류가 발생하였습니다."
      );
    }

    if (res2.notRegistUser.length > 0) {
      let text = ``;

      for (let i = 0; res2.notRegistUser.length; i++) {
        text +=
          res2.length - 1 >= i
            ? `${res2.notRegistUser[i]}`
            : `${res2.notRegistUser[i]}, `;
      }

      return await interaction.editReply(
        `업로드가 완료되었습니다. 등록 되지 않은 소환사 : ${text}`
      );
    }
    // console.log(file.name);
    // console.log(file.url);
    // console.log(file.proxyURL);
    // if (!file) {
    //   await interaction.reply("file is undefined");
    //   return;
    // }
    await interaction.editReply(`업로드가 완료되었습니다.`);
  },
};
