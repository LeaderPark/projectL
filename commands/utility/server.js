const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");
const {
  getGuildSettings,
  initializeGuildDatabase,
  updateGuildUnityVoiceChannel,
} = require("../../scripts/Utils/DB");
const { PROJECT_DISPLAY_NAME } = require("../../scripts/Utils/Branding");
const { formatGuildConfigurationError } = require("../../scripts/Utils/GuildDatabase");

function canManageGuild(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
}

async function resolveUnityVoiceChannel(guild, settings) {
  const channelId = settings?.unity_voice_channel_id;
  if (!channelId) {
    return null;
  }

  const cached = guild.channels.cache.get(channelId);
  if (cached) {
    return cached;
  }

  try {
    return await guild.channels.fetch(channelId);
  } catch (error) {
    return null;
  }
}

function formatGuildSettingsSummary(settings, unityVoiceChannel) {
  const lines = [
    `서버: ${settings.guild_name}`,
    `상태: 준비됨`,
    `DB: ${settings.database_name}`,
    `최종 갱신: ${new Date(settings.updated_at).toLocaleString("ko-KR")}`,
  ];

  if (settings.unity_voice_channel_id) {
    const channelName = unityVoiceChannel?.name ?? settings.unity_voice_channel_name;
    const channelLabel = channelName
      ? `${channelName} (${settings.unity_voice_channel_id})`
      : settings.unity_voice_channel_id;
    lines.push(`공용통화방: ${channelLabel}`);
  } else {
    lines.push("공용통화방: 미설정");
  }

  return lines.join("\n");
}

function buildServerCommandData() {
  return new SlashCommandBuilder()
    .setName("서버설정")
    .setDescription(`현재 서버의 ${PROJECT_DISPLAY_NAME} 설정을 관리합니다.`)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("보기")
        .setDescription(`현재 서버의 ${PROJECT_DISPLAY_NAME} 설정 상태를 확인합니다.`)
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("초기화")
        .setDescription("현재 서버 전용 데이터베이스를 생성하고 연결합니다.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("공용통화방")
        .setDescription("게임 종료 후 모일 음성채널을 설정합니다.")
        .addChannelOption((option) =>
          option
            .setName("채널")
            .setDescription("게임 종료 후 모일 음성채널을 선택하세요.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
    );
}

function createServerCommand(deps = {}) {
  const {
    getGuildSettings: getGuildSettingsImpl = getGuildSettings,
    initializeGuildDatabase: initializeGuildDatabaseImpl = initializeGuildDatabase,
    updateGuildUnityVoiceChannel:
      updateGuildUnityVoiceChannelImpl = updateGuildUnityVoiceChannel,
  } = deps;

  return {
    data: buildServerCommandData(),
    async execute(interaction) {
    if (!canManageGuild(interaction)) {
      await interaction.reply({
        content: "이 명령어는 서버 관리자만 사용할 수 있어요.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "보기") {
      try {
        const settings = await getGuildSettingsImpl(interaction.guildId);

        if (!settings) {
          await interaction.reply({
            content:
              "이 서버는 아직 초기화되지 않았습니다. `/서버설정 초기화`를 실행해 주세요.",
            ephemeral: true,
          });
          return;
        }

        const unityVoiceChannel = await resolveUnityVoiceChannel(
          interaction.guild,
          settings
        );

        await interaction.reply({
          content: formatGuildSettingsSummary(settings, unityVoiceChannel),
          ephemeral: true,
        });
      } catch (error) {
        await interaction.reply({
          content: formatGuildConfigurationError(error),
          ephemeral: true,
        });
      }
      return;
    }

    if (subcommand === "공용통화방") {
      try {
        const settings = await getGuildSettingsImpl(interaction.guildId);
        if (!settings) {
          await interaction.reply({
            content:
              "이 서버는 아직 초기화되지 않았습니다. `/서버설정 초기화`를 먼저 실행해 주세요.",
            ephemeral: true,
          });
          return;
        }

        const channel = interaction.options.getChannel("채널", true);
        await updateGuildUnityVoiceChannelImpl(interaction.guildId, channel.id);

        const summary = formatGuildSettingsSummary(
          {
            ...settings,
            unity_voice_channel_id: channel.id,
            unity_voice_channel_name: channel.name,
          },
          channel
        );

        await interaction.reply({
          content: summary,
          ephemeral: true,
        });
      } catch (error) {
        await interaction.reply({
          content: formatGuildConfigurationError(error),
          ephemeral: true,
        });
      }
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const settings = await initializeGuildDatabaseImpl(
        interaction.guildId,
        interaction.guild.name
      );

      await interaction.editReply(
        [
          `서버 전용 데이터베이스 준비가 완료되었습니다.`,
          `서버: ${interaction.guild.name}`,
          `DB: ${settings.databaseName}`,
        ].join("\n")
      );
    } catch (error) {
      await interaction.editReply(formatGuildConfigurationError(error));
    }
  },
  };
}

const serverCommand = createServerCommand();

module.exports = {
  ...serverCommand,
  createServerCommand,
  buildServerCommandData,
  formatGuildSettingsSummary,
  resolveUnityVoiceChannel,
};
