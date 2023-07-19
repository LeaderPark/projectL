const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLatestMatched } = require("../../scripts/Utils/Query");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("전적")
        .setDescription("최근 5개 게임을 볼 수 있어요.")
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

        const embed = new EmbedBuilder();
        const embed1 = new EmbedBuilder();
        const embed2 = new EmbedBuilder();
        const embeds = [embed, embed1, embed2]
        await interaction.deferReply({ content: "...searching" });
        const result = await getLatestMatched(user.id);
        if (!result.success) {
            return await interaction.reply("오류가 발생했습니다.");
        }

        let match_data = []
        for (let i = 0; i < result.data.length; i++) {
            const data = result.data[i]
            const time = new Date(Number(data.game_length));
            const timeStr = `${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`
            const purple_team = JSON.parse(data.purple_team)
            const blue_team = JSON.parse(data.blue_team)
            let purple_players = []
            let blue_players = []
            for (let j = 0; j < purple_team.players.length - 1; j++) {
                const purple_player = purple_team.players[j];
                const blue_player = blue_team.players[j];
                purple_players.push({
                    name: purple_player.playerName,
                    champion: purple_player.championName,
                    level: purple_player.level,
                    minionScore: purple_player.minionScore,
                    lane: purple_player.lane,
                    kda: purple_player.kda
                })
                blue_players.push({
                    name: blue_player.playerName,
                    champion: blue_player.championName,
                    level: blue_player.level,
                    minionScore: blue_player.minionScore,
                    lane: blue_player.lane,
                    kda: blue_player.kda
                })
            }
            match_data.push({
                gameLength: timeStr,
                purple_team: purple_players,
                blue_team: blue_players,
            })
        }

        for (let i = 2; i >= 0; i--) {
            console.log(i + "번째")
            console.log(match_data[i].gameLength)
            console.log(match_data[i].purple_team)
            console.log(match_data[i].blue_team)
            console.log("-----------------------------")
        }

    }
}
