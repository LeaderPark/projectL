const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLatestMatched } = require("../../scripts/Utils/Query");
const {
    championKorList,
} = require("../../scripts/Utils/championNameConverter");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("전적")
        .setDescription("최근 3개 게임을 볼 수 있어요.")
        .addUserOption((option) =>
            option
                .setName("검색할소환사")
                .setDescription("검색할 소환사를 멘션해주세요")
        ),
    async execute(interaction) {
        const interactionUser = await interaction.guild.members.fetch(
            interaction.user.id
        );
        const user = interaction.options.getUser("검색할소환사") || interactionUser;

        if (user.bot) {
            return await interaction.reply("봇 말고 소환사를 넣으라고");
        }

        await interaction.deferReply({ content: "...searching" });
        const result = await getLatestMatched(user.id);
        if (!result.success) {
            return await interaction.reply("오류가 발생했습니다.");
        }

        let match_data = [];
        for (let i = 0; i < result.data.length; i++) {
            const data = result.data[i];
            const time = new Date(Number(data.game_length));
            const timeStr = `${time.getMinutes().toString().padStart(2, "0")}:${time
                .getSeconds()
                .toString()
                .padStart(2, "0")}`;
            const purple_team = JSON.parse(data.purple_team);
            const blue_team = JSON.parse(data.blue_team);
            let purple_players = [];
            let blue_players = [];
            for (let j = 0; j < purple_team.players.length; j++) {
                const purple_player = purple_team.players[j];
                const blue_player = blue_team.players[j];
                purple_players.push({
                    name: purple_player.playerName,
                    champion: purple_player.championName,
                    level: purple_player.level,
                    minionScore: purple_player.minionScore,
                    lane: purple_player.lane,
                    kda: purple_player.kda,
                    mmr: purple_player.mmr
                });
                blue_players.push({
                    name: blue_player.playerName,
                    champion: blue_player.championName,
                    level: blue_player.level,
                    minionScore: blue_player.minionScore,
                    lane: blue_player.lane,
                    kda: blue_player.kda,
                    mmr: blue_player.mmr
                });
            }
            match_data.push({
                gameLength: timeStr,
                purple_team: purple_players,
                blue_team: blue_players,
                win_team: blue_team.result === 1 ? 200 : 100,
                index: data.id
            });
        }
        const embeds = []
        for (let i = 0; i < match_data.length; i++) {
            const data = match_data[i]
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`${user.nickname || user.username}님의 최근 3판 전적`)
                .setDescription(`${data.index}번째 게임`)
                .addFields(
                    {
                        name: `**Blue Team**`,
                        value: `${data.win_team === 200 ? "승리" : "패배"}`,
                        inline: true,
                    },
                    {
                        name: `\u200b`,
                        value: "\u200b",
                        inline: true,
                    },
                    {
                        name: `**Purple Team**`,
                        value: `${data.win_team === 100 ? "승리" : "패배"}`,
                        inline: true,
                    },
                )
                .setTimestamp()
                .setFooter({
                    text: "만든놈 - 환주, 진우",
                });
            const purple_best = data.purple_team.sort((a, b) =>
                b.mmr - a.mmr
            )[0]
            const blue_best = data.blue_team.sort((a, b) =>
                b.mmr - a.mmr
            )[0]
            for (let j = 0; j < match_data[i].blue_team.length; j++) {
                const blue_player = match_data[i].blue_team[j];
                const purple_player = match_data[i].purple_team[j];
                embed.addFields(
                    {
                        name: `**${blue_player.name} - ${championKorList[blue_player.champion]} ${blue_best.name === blue_player.name ? (data.win_team === 200 ? "( MVP )" : "( ACE )") : ""}**`,
                        value: `**LV** : ${blue_player.level} \n
                    **CS** : ${blue_player.minionScore} \n
                    **K/D/A** : ${blue_player.kda.kills} / ${blue_player.kda.deaths} / ${blue_player.kda.assist}`,
                        inline: true,
                    },
                    {
                        name: `\u200b`,
                        value: "\u200b",
                        inline: true,
                    },
                    {
                        name: `**${purple_player.name} - ${championKorList[purple_player.champion]} ${purple_best.name === purple_player.name ? (data.win_team === 100 ? "( MVP )" : "( ACE )") : ""}**`,
                        value: `**LV** : ${purple_player.level} \n
                    **CS** : ${purple_player.minionScore} \n
                    **K/D/A** : ${purple_player.kda.kills} / ${purple_player.kda.deaths} / ${purple_player.kda.assist}`,
                        inline: true,
                    }
                )
            }
            embed.addFields({
                name: `\u200b`,
                value: "\u200b",
                inline: true,
            },)

            embeds.push(embed)
        }
        interaction.editReply({ embeds: embeds });
    },
};