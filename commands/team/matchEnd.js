const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("내전종료")
        .setDescription("내전인원을 하나로 모아요"),
    async execute(interaction) {
        const team1 = interaction.guild.channels.cache.find(
            (x) => x.name === "TEAM BLUE"
        );
        const team2 = interaction.guild.channels.cache.find(
            (x) => x.name === "TEAM PURPLE"
        );
        const unityRoom = interaction.guild.channels.cache.find(
            (x) => x.name === "칼칼경혁"
        );
        const team1Members = Array.from(team1.members.values());
        const team2Members = Array.from(team2.members.values());

        for (let i = 0; i < team1Members.length; i++) {
            await team1Members[i].voice.setChannel(unityRoom);
        }
        for (let i = 0; i < team2Members.length; i++) {
            await team2Members[i].voice.setChannel(unityRoom);
        }

        await interaction.reply(`${team1Members.length + team2Members.length}명을 ${unityRoom.name}으로 이동시켰습니다.`);
    },
};
