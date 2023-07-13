const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("내전종료")
        .setDescription("내전인원을 하나로 모아요"),

    async execute(interaction) {
        const team1 = interaction.guild.channels.cache.find((ch) => ch.name === "TEAM BLUE");
        const team2 = interaction.guild.channels.cache.find((ch) => ch.name === "TEAM PURPLE");
        const unityRoom = interaction.guild.channels.cache.find((ch) => ch.name === "칼칼경혁");

        if (!team1 || !team2 || !unityRoom) {
            return await interaction.reply("채널을 찾을 수 없습니다.");
        }

        const team1Members = Array.from(team1.members.values());
        const team2Members = Array.from(team2.members.values());
        const membersCount = team1Members.length + team2Members.length;

        for (let i = 0; i < team1Members.length; i++) {
            await team1Members[i].voice.setChannel(unityRoom);
        }
        for (let i = 0; i < team2Members.length; i++) {
            await team2Members[i].voice.setChannel(unityRoom);
        }

        await interaction.reply(`${membersCount}명을 ${unityRoom.name}으로 이동시켰습니다.`);
    },
};
