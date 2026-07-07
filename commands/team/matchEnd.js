const { SlashCommandBuilder } = require("discord.js");
const { getGuildSettings } = require("../../scripts/Utils/DB");
const { gatherTeamChannelsToUnityRoom } = require("../../scripts/Discord/VoiceMoveService");

function createMatchEndCommand(deps = {}) {
    const {
        getGuildSettings: getGuildSettingsImpl = getGuildSettings,
        gatherTeamChannelsToUnityRoom: gatherTeamChannelsToUnityRoomImpl = gatherTeamChannelsToUnityRoom,
    } = deps;

    async function resolveUnityRoom(interaction) {
        let unityVoiceChannelId = null;
        try {
            const settings = await getGuildSettingsImpl(interaction.guildId);
            unityVoiceChannelId = settings?.unity_voice_channel_id ?? null;
        } catch (error) {
            unityVoiceChannelId = null;
        }

        if (unityVoiceChannelId) {
            const configuredRoom =
                interaction.guild.channels.cache.get(unityVoiceChannelId) ||
                (await interaction.guild.channels.fetch(unityVoiceChannelId).catch(() => null));

            if (configuredRoom) {
                return configuredRoom;
            }
        }

        return interaction.guild.channels.cache.find((ch) => ch.name === "칼칼경혁");
    }

    return {
        data: new SlashCommandBuilder()
            .setName("내전종료")
            .setDescription("내전인원을 하나로 모아요"),

        async execute(interaction) {
            const team1 = interaction.guild.channels.cache.find((ch) => ch.name === "TEAM BLUE");
            const team2 = interaction.guild.channels.cache.find((ch) => ch.name === "TEAM PURPLE");
            const unityRoom = await resolveUnityRoom(interaction);

            if (!team1 || !team2 || !unityRoom) {
                return await interaction.reply("채널을 찾을 수 없습니다.");
            }

            await interaction.deferReply();

            const { moved, failures } = await gatherTeamChannelsToUnityRoomImpl({
                teamChannels: [team1, team2],
                unityChannel: unityRoom,
            });

            let message = `${moved.length}명을 ${unityRoom.name}으로 이동시켰습니다.`;
            if (failures.length > 0) {
                message += ` (${failures.length}명 이동 실패)`;
            }

            await interaction.editReply(message);
        },
    };
}

const matchEndCommand = createMatchEndCommand();

module.exports = {
    ...matchEndCommand,
    createMatchEndCommand,
};
