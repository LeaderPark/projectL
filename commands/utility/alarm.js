const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");
const LOLRoleId = "1232156030847156350";
const R6RoleId = "1232196158747578409";
const client = require("../../scripts/Utils/Client");

let participants = [];

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "join") {
    participants.push(interaction.user.username);
    await interaction.reply(`${interaction.user.username}님이 참가하셨습니다!`);
    console.log(participants);
  }
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("알림")
    .setDescription("알림이 설정된 사람에게 알림을 보내요")
    .addStringOption((option) =>
      option
        .setName("옵션")
        .setDescription("알림 옵션을 지정해주세요.")
        .setRequired(true)
        .addChoices(
          { name: "리그오브레전드", value: "LOL" },
          { name: "레인보우식스시즈", value: "R6" }
        )
    ),
  async execute(interaction) {
    const addOption = interaction.options.getString("옵션");
    let roleId = "";
    if (addOption === "LOL") {
      roleId = LOLRoleId;
    } else {
      roleId = R6RoleId;
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("내전 알림")
      .setTimestamp()
      .setFooter({ text: "만든놈 - 환주, 진우" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join")
        .setLabel("참가")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("decline")
        .setLabel("불참")
        .setStyle(ButtonStyle.Danger)
    );
    let joinCount = 0;
    const members = await interaction.guild.members.fetch();
    members.forEach(async (member) => {
      if (member.roles.cache.has(roleId)) {
        console.log(`${member.user.tag} has the role!`); // 알림 허용을 한 사람들
        try {
          const res = await member.send({ embeds: [embed], components: [row] });
          console.log(`Sent a DM to ${member.user.tag}`);
        } catch (error) {
          console.error(`Could not send a DM to ${member.user.tag}.`, error);
        }
      }
    });
  },
};
