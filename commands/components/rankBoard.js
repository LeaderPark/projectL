const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { getRankData } = require("../../scripts/Utils/Query");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("랭킹")
    .setDescription("내전 랭킹을 보여줍니다."),
  async execute(interaction) {
    const embed = new EmbedBuilder()

    const embed1 = new EmbedBuilder()
    const embedLists = [embed, embed1]
    let index = 0;
    const buttons = [
      {
        customId: "back",
        label: "<<",
        style: "Secondary",
        async action(interaction) {
          if (index <= 0) {
            return await interaction.reply({
              content: "첫 페이지에요",
              ephemeral: true,
            });
          }
          await interaction.update({
            embeds: [embedLists[--index]],
            components: [row],
            ephemeral: true,
          });
        },
      },
      {
        customId: "next",
        label: ">>",
        style: "Secondary",
        async action(interaction) {
          if (index >= embedLists.length - 1) {
            return await interaction.reply({
              content: "마지막 페이지에요",
              ephemeral: true,
            });
          }
          await interaction.update({
            embeds: [embedLists[++index]],
            components: [row],
            ephemeral: true,
          });
        },
      },
    ];

    const row = new ActionRowBuilder().addComponents(
      buttons.map((button) => {
        return new ButtonBuilder()
          .setCustomId(button.customId)
          .setLabel(button.label)
          .setStyle(button.style);
      })
    );

    await interaction.deferReply({ ephemeral: true });

    const result = await getRankData();
    if (!result.success) {
      return await interaction.editReply(result.msg);
    }
    embed.setColor(0x0099ff)
      .setTitle("랭킹")
      .setDescription(
        `등록되어 있는 소환사 ${result.data.length}명의 랭킹을 볼 수 있어요`
      )
      .addFields({
        name: "\u200b",
        value: "\u200b",
        inline: true,
      })
      .setTimestamp()
      .setFooter({
        text: "만든놈 - 환주, 진우",
      });
    embed1.setColor(0x0099ff)
      .setTitle("랭킹")
      .setDescription(
        `등록되어 있는 소환사 ${result.data.length}명의 랭킹을 볼 수 있어요`
      )
      .addFields({
        name: "\u200b",
        value: "\u200b",
        inline: true,
      })
      .setTimestamp()
      .setFooter({
        text: "만든놈 - 환주, 진우",
      });

    for (let i = 0; i < result.data.length; i++) {
      const user = await interaction.guild.members.fetch(
        result.data[i].discord_id
      );
      if (i < 20) {
        embed.addFields({
          name: `#${i + 1}`,
          value: `${result.data[i].name} - ${user}`,
          inline: false,
        });
      } else {
        embed1.addFields({
          name: `#${i + 1}`,
          value: `${result.data[i].name} - ${user}`,
          inline: false,
        });
      }

    }
    embed.addFields({
      name: "\u200b",
      value: "\u200b",
      inline: true,
    });
    embed1.addFields({
      name: "\u200b",
      value: "\u200b",
      inline: true,
    });
    await interaction.editReply({ embeds: [embedLists[index]], components: [row], ephemeral: true, });

    const filter = (interaction) => {
      return buttons.filter(
        (button) => button.customId === interaction.customId
      );
    };

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      // time: 60 * 1000,
    });

    collector.on("collect", async (interaction) => {
      const button = buttons.find(
        (button) => button.customId === interaction.customId
      );
      await button.action(interaction);
    });

    collector.on("end", async (collect) => {
      console.log("버튼 시간초과");
    });
  },
};
