const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("아이템")
    .setDescription("Search for a League of Legends item.")
    .addStringOption((option) =>
      option
        .setName("아이템이름")
        .setDescription("Enter an item name.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const itemName = interaction.options.getString("아이템이름");
    const apiKey = "YOUR_RIOT_API_KEY_HERE";
    const region = "na1"; // Replace with your region code.

    try {
      const itemData = await axios.get(
        `http://ddragon.leagueoflegends.com/cdn/13.9.1/data/ko_KR/item.json`
      );
      const item = Object.values(itemData.data.data).find(
        (i) => i.name.toLowerCase() === itemName.toLowerCase()
      );

      if (!item) {
        return interaction.reply("Item not found.");
      }

      const itemEmbed = {
        color: "#0099ff",
        title: item.name,
        thumbnail: {
          url: `https://ddragon.leagueoflegends.com/cdn/11.20.1/img/item/${item.image.full}`,
        },
        fields: [
          {
            name: "Description",
            value: item.description,
          },
          {
            name: "Total Cost",
            value: item.gold.total,
          },
          {
            name: "Sell Price",
            value: item.gold.sell,
          },
          {
            name: "Stats",
            value: item.stats
              ? Object.entries(item.stats)
                  .map(([k, v]) => `**${k}:** ${v}`)
                  .join("\n")
              : "No stats available.",
          },
          {
            name: "Builds Into",
            value: item.into
              ? item.into
                  .map((i) => `**${i.name}:** ${i.gold.total} gold`)
                  .join("\n")
              : "This item does not build into any other items.",
          },
        ],
      };

      return interaction.reply({ embeds: [itemEmbed] });
    } catch (error) {
      console.error(error);
      return interaction.reply("Error searching for item.");
    }
  },
};
