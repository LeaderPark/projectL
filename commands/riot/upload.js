const { SlashCommandBuilder } = require("discord.js");
const { getMatchData } = require("../../scripts/Utils/Parser");
const { insertMatchData } = require("../../scripts/Utils/Query");
const Match = require("../../scripts/VO/match");

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

    // console.log(file.name);
    // console.log(file.url);
    // console.log(file.proxyURL);
    // if (!file) {
    //   await interaction.reply("file is undefined");
    //   return;
    // }
    await interaction.editReply("Upload Complete!");
  },
};
