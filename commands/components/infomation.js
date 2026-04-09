const { SlashCommandBuilder } = require("discord.js");
const {
  readDeploymentInfo,
  formatDeploymentInfoMessage,
} = require("../../scripts/Utils/DeploymentInfo");

function createInformationCommand(deps = {}) {
  const readInfo = deps.readDeploymentInfo ?? readDeploymentInfo;
  const formatMessage = deps.formatDeploymentInfoMessage ?? formatDeploymentInfoMessage;

  return {
    data: new SlashCommandBuilder()
      .setName("정보")
      .setDescription("머글봇의 정보를 볼 수 있어요."),
    async execute(interaction) {
      await interaction.reply(formatMessage(readInfo()));
    },
  };
}

const informationCommand = createInformationCommand();

module.exports = {
  ...informationCommand,
  createInformationCommand,
};
