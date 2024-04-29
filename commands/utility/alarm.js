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

// let participants = {};
// let sentMessages = {};

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (!interaction.isButton()) return;
//   if (interaction.customId === "join") {
//     participants[interaction.user.id] = interaction.user.username;
//     for (const [userId, messageId] of Object.entries(sentMessages)) {
//       const user = await interaction.client.users.fetch(userId);
//       const message = await user.dmChannel.messages.fetch(messageId);
//       const embed = new EmbedBuilder(message.embeds[0].data);
//       embed.setDescription(
//         `현재 참가자: ${Object.values(participants).join(", ")}`
//       );
//       await message.edit({ embeds: [embed] });
//     }
//   }
// });

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
    )
    .addStringOption((option) =>
      option
        .setName("내용")
        .setDescription("알림 내용을 지정해주세요.")
        .setRequired(true)
    ),
  async execute(interaction) {
    // participants = {};
    // sentMessages = {};
    const addOption = interaction.options.getString("옵션");
    const description = interaction.options.getString("내용");
    let titleText = "";
    let roleId = "";
    if (addOption === "LOL") {
      roleId = LOLRoleId;
      titleText = "롤 내전 알림";
    } else {
      roleId = R6RoleId;
      titleText = "레식 내전 알림";
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(titleText)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: "만든놈 - 환주, 진우" });

    // const row = new ActionRowBuilder().addComponents(
    //   new ButtonBuilder()
    //     .setCustomId("join")
    //     .setLabel("참가")
    //     .setStyle(ButtonStyle.Success),
    //   new ButtonBuilder()
    //     .setCustomId("decline")
    //     .setLabel("불참")
    //     .setStyle(ButtonStyle.Danger)
    // );
    const members = await interaction.guild.members.fetch();
    members.forEach(async (member) => {
      if (member.roles.cache.has(roleId)) {
        try {
          const res = await member.send({
            content: `<@${member.id}>`,
            embeds: [embed],
            // components: [row]
          });
          console.log(`${member.user.tag}에게 DM을 보냈습니다.`);

          //   sentMessages[member.id] = res.id;
        } catch (error) {
          console.error(`${member.user.tag}에게 DM 보내는 걸 실패했습니다.`, error);
        }
      }
    });
    await interaction.reply("성공적으로 알림을 전송했습니다.");
  },
};
