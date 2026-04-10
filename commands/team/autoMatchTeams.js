const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getRuntimeConfig } = require("../../config/runtime");
const { createTournamentApi } = require("../../scripts/Riot/TournamentApi");
const { normalizeChampionKey } = require("../../scripts/Riot/ChampionNameService");
const { getGuildSettings } = require("../../scripts/Utils/DB");
const { championKorList } = require("../../scripts/Utils/championNameConverter");
const {
  getUsersData,
  getLatestTournamentSession,
  replaceActiveTournamentSession,
} = require("../../scripts/Utils/Query");
const { balanceTeams } = require("../../scripts/Utils/TeamBalancer");
const {
  TeamData,
  TeamDataSaver,
} = require("../../scripts/Utils/SaveTeamData");

const PICK_TYPE_CHOICES = [
  { name: "블라인드 픽", value: "BLIND_PICK" },
  { name: "드래프트 모드", value: "DRAFT_MODE" },
  { name: "전체 무작위", value: "ALL_RANDOM" },
  { name: "토너먼트 드래프트", value: "TOURNAMENT_DRAFT" },
];
const SERIES_MODE_CHOICES = [
  { name: "일반", value: "STANDARD" },
  { name: "하드 피어리스", value: "HARD_FEARLESS" },
];
const SERIES_ACTION_CHOICES = [
  { name: "자동", value: "AUTO" },
  { name: "새 시리즈", value: "NEW" },
  { name: "이어하기", value: "CONTINUE" },
];
const HARD_FEARLESS_MAX_GAMES = 5;
const CHAMPION_KOREAN_NAME_MAP = Object.freeze(
  Object.entries(championKorList).reduce((map, [rawName, localizedName]) => {
    const normalizedKey = normalizeChampionKey(rawName);
    if (normalizedKey) {
      map[normalizedKey] = localizedName;
    }

    return map;
  }, {})
);

function formatChoiceLabel(choices, value) {
  return choices.find((choice) => choice.value === value)?.name ?? value;
}

function buildRandomEntry(member) {
  return {
    member,
    user: {
      discord_id: member.user.id,
      name: member.displayName ?? member.user.username,
      mmr: 0,
    },
  };
}

function buildTournamentEmbed({
  addOption,
  channel,
  pickType,
  seriesMode,
  seriesGameNumber,
  fearlessUsedChampions,
  continuedSeries,
  team1Channel,
  team2Channel,
  team1Members,
  team2Members,
  team1MMR,
  team2MMR,
  tournamentCode,
}) {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("내전 팀 분배")
    .setAuthor({
      name: `${addOption}팀 분배 결과`,
    })
    .setDescription(
      `${channel.name} 기준으로 팀을 구성했고 토너먼트 코드를 생성했습니다.`
    )
    .addFields(
      {
        name: `블루팀 - ${team1Channel.name}`,
        value: team1Members
          .map(
            (entry) =>
              `${entry.user.name} - ${entry.member}${entry.user.mmr ? ` (${entry.user.mmr})` : ""}`
          )
          .join("\n"),
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: `퍼플팀 - ${team2Channel.name}`,
        value: team2Members
          .map(
            (entry) =>
              `${entry.user.name} - ${entry.member}${entry.user.mmr ? ` (${entry.user.mmr})` : ""}`
          )
          .join("\n"),
        inline: true,
      }
    )
    .addFields({
      name: "토너먼트 코드",
      value: `\`${tournamentCode}\``,
      inline: false,
    })
    .addFields({
      name: "픽 방식",
      value: formatPickTypeLabel(pickType),
      inline: false,
    })
    .setTimestamp()
    .setFooter({
      text: "만든놈 - 환주, 진우",
    });

  if (seriesMode === "HARD_FEARLESS") {
    embed.addFields(
      {
        name: "특수 규칙",
        value: formatSeriesModeLabel(seriesMode),
        inline: false,
      },
      {
        name: "시리즈 진행",
        value: `${seriesGameNumber}세트${continuedSeries ? " · 이어하기" : " · 새 시리즈"}`,
        inline: false,
      },
      {
        name: "사용 불가 챔피언",
        value: formatFearlessChampionList(fearlessUsedChampions),
        inline: false,
      }
    );
  }

  if (team1MMR > 0 || team2MMR > 0) {
    embed.addFields(
      {
        name: "블루팀 평균 MMR",
        value: `${(team1MMR / team1Members.length).toFixed(1)}`,
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: "퍼플팀 평균 MMR",
        value: `${(team2MMR / team2Members.length).toFixed(1)}`,
        inline: true,
      }
    );
  }

  embed.addFields({
    name: "자동 이동",
    value:
      "이 토너먼트 방에서 챔피언 선택이 시작되면, 현재 서버 음성채널 어디에 있든 팀 채널로 자동 이동합니다. 음성채널에 없으면 DM으로 팀 채널 초대 링크를 보냅니다.",
    inline: false,
  });

  return embed;
}

function formatPickTypeLabel(pickType) {
  return formatChoiceLabel(PICK_TYPE_CHOICES, pickType);
}

function formatSeriesModeLabel(seriesMode) {
  return formatChoiceLabel(SERIES_MODE_CHOICES, seriesMode);
}

function translateChampionName(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return rawValue;
  }

  return CHAMPION_KOREAN_NAME_MAP[normalizeChampionKey(rawValue)] ?? rawValue;
}

function formatFearlessChampionList(championNames = []) {
  return championNames.length > 0
    ? championNames.map((championName) => translateChampionName(championName)).join(", ")
    : "없음";
}

function normalizeDiscordIds(ids = []) {
  return ids.map((value) => String(value ?? "").trim()).filter(Boolean);
}

function buildSortedParticipantIds(memberIds = []) {
  return [...normalizeDiscordIds(memberIds)].sort();
}

function hasMatchingParticipants(members, latestSession) {
  const currentIds = buildSortedParticipantIds(
    members.map((member) => member.user.id)
  );
  const latestIds = buildSortedParticipantIds([
    ...(latestSession?.team1DiscordIds ?? []),
    ...(latestSession?.team2DiscordIds ?? []),
  ]);

  return (
    currentIds.length === latestIds.length &&
    currentIds.every((value, index) => value === latestIds[index])
  );
}

function canContinueHardFearlessSeries(latestSession) {
  return (
    latestSession?.seriesMode === "HARD_FEARLESS" &&
    latestSession?.status === "COMPLETED" &&
    latestSession?.resultStatus === "INGESTED" &&
    Number(latestSession?.seriesGameNumber ?? 1) < HARD_FEARLESS_MAX_GAMES
  );
}

async function resolveHardFearlessSeries(interaction, members, seriesAction) {
  const latestSessionResult = await getLatestTournamentSession(interaction.guildId);
  if (!latestSessionResult.success) {
    return latestSessionResult;
  }

  const latestSession = latestSessionResult.data;
  const buildNewSeries = () => ({
    success: true,
    data: {
      continuedSeries: false,
      seriesMode: "HARD_FEARLESS",
      seriesGameNumber: 1,
      fearlessUsedChampions: [],
    },
  });

  if (seriesAction === "NEW") {
    return buildNewSeries();
  }

  if (!latestSession || latestSession.seriesMode !== "HARD_FEARLESS") {
    if (seriesAction === "CONTINUE") {
      return {
        success: false,
        msg: "이어갈 하드 피어리스 시리즈가 없습니다. 새 시리즈로 시작해주세요.",
      };
    }

    return buildNewSeries();
  }

  if (
    latestSession.status !== "COMPLETED" ||
    latestSession.resultStatus !== "INGESTED"
  ) {
    return {
      success: false,
      msg: "이전 하드 피어리스 세트 결과가 아직 정리되지 않았습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  if (!hasMatchingParticipants(members, latestSession)) {
    if (seriesAction === "CONTINUE") {
      return {
        success: false,
        msg: "이어하기는 직전 하드 피어리스 세트와 동일한 10명이 모였을 때만 사용할 수 있습니다.",
      };
    }

    return buildNewSeries();
  }

  if (!canContinueHardFearlessSeries(latestSession)) {
    if (seriesAction === "CONTINUE") {
      return {
        success: false,
        msg: "하드 피어리스 시리즈는 최대 5세트까지만 이어할 수 있습니다. 새 시리즈로 시작해주세요.",
      };
    }

    return buildNewSeries();
  }

  return {
    success: true,
    data: {
      continuedSeries: true,
      seriesMode: "HARD_FEARLESS",
      seriesGameNumber: Number(latestSession.seriesGameNumber ?? 1) + 1,
      fearlessUsedChampions: latestSession.fearlessUsedChampions ?? [],
      latestSession,
    },
  };
}

async function loadOptionalUserMap(guildId, members) {
  const userIds = members.map((member) => member.user.id);
  const users = await getUsersData(guildId, userIds);
  if (!users.success || !Array.isArray(users.data)) {
    return new Map();
  }

  return new Map(
    users.data.map((user) => [String(user.discord_id), user])
  );
}

function buildMembersFromIds(ids, membersById, usersById = new Map()) {
  return normalizeDiscordIds(ids)
    .map((discordId) => {
      const member = membersById.get(discordId);
      if (!member) {
        return null;
      }

      return {
        member,
        user:
          usersById.get(discordId) ?? {
            discord_id: discordId,
            name: member.displayName ?? member.user.username,
            mmr: 0,
          },
      };
    })
    .filter(Boolean);
}

async function buildContinuedSeriesTeams(interaction, members, latestSession, addOption) {
  const membersById = new Map(
    members.map((member) => [String(member.user.id), member])
  );
  const usersById =
    addOption === "MMR"
      ? await loadOptionalUserMap(interaction.guildId, members)
      : new Map();
  const team1Members = buildMembersFromIds(
    latestSession.team1DiscordIds,
    membersById,
    usersById
  );
  const team2Members = buildMembersFromIds(
    latestSession.team2DiscordIds,
    membersById,
    usersById
  );

  if (team1Members.length !== 5 || team2Members.length !== 5) {
    return {
      success: false,
      msg: "이전 하드 피어리스 팀원을 현재 음성채널에서 모두 찾지 못했습니다.",
    };
  }

  const team1MMR = team1Members.reduce(
    (sum, entry) => sum + Number(entry.user?.mmr ?? 0),
    0
  );
  const team2MMR = team2Members.reduce(
    (sum, entry) => sum + Number(entry.user?.mmr ?? 0),
    0
  );

  return {
    success: true,
    data: {
      team1Members,
      team2Members,
      team1MMR,
      team2MMR,
    },
  };
}

async function createTournamentSession(interaction, addOption, pickType, seriesContext) {
  const runtimeConfig = getRuntimeConfig();
  const riotApi = createTournamentApi({
    token: runtimeConfig.riot.token,
    platform: runtimeConfig.riot.platform,
    region: runtimeConfig.riot.tournamentRegion,
    callbackUrl: runtimeConfig.riot.tournamentCallbackUrl,
    useStub: runtimeConfig.riot.tournamentUseStub,
  });

  const providerId = await riotApi.createProvider();
  const tournamentId = await riotApi.createTournament(
    providerId,
    `${interaction.guild.name} ${Date.now()}`
  );
  const tournamentCode = await riotApi.createTournamentCode(tournamentId, {
    mapType: "SUMMONERS_RIFT",
    pickType,
    spectatorType: "NONE",
    teamSize: 5,
    metaData: JSON.stringify({
      guildId: interaction.guildId,
      createdBy: interaction.user.id,
      option: addOption,
      pickType,
      seriesMode: seriesContext?.seriesMode ?? "STANDARD",
      seriesGameNumber: Number(seriesContext?.seriesGameNumber ?? 1),
      fearlessUsedChampions: seriesContext?.fearlessUsedChampions ?? [],
      createdAt: new Date().toISOString(),
    }),
  });

  return {
    providerId: String(providerId),
    tournamentId: String(tournamentId),
    tournamentCode,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("내전")
    .setDescription(
      "음성채팅방에 있는 유저들을 두 팀으로 나누고 토너먼트 코드를 생성합니다."
    )
    .addStringOption((option) =>
      option
        .setName("옵션")
        .setDescription("추가 옵션을 지정해주세요.")
        .setRequired(true)
        .addChoices(
          { name: "MMR", value: "MMR" },
          { name: "무작위", value: "RANDOM" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("픽방식")
        .setDescription("생성할 토너먼트 방의 픽 방식을 지정해주세요.")
        .setRequired(true)
        .addChoices(...PICK_TYPE_CHOICES)
    )
    .addStringOption((option) =>
      option
        .setName("특수규칙")
        .setDescription("추가 드래프트 규칙을 지정해주세요.")
        .setRequired(true)
        .addChoices(...SERIES_MODE_CHOICES)
    )
    .addStringOption((option) =>
      option
        .setName("시리즈동작")
        .setDescription("하드 피어리스 시리즈를 새로 시작할지 이어갈지 정해주세요.")
        .setRequired(false)
        .addChoices(...SERIES_ACTION_CHOICES)
    ),
  async execute(interaction) {
    const channel = interaction.member.voice.channel;
    const team1Channel = interaction.guild.channels.cache.find(
      (x) => x.name === "TEAM BLUE"
    );
    const team2Channel = interaction.guild.channels.cache.find(
      (x) => x.name === "TEAM PURPLE"
    );
    const addOption = interaction.options.getString("옵션");
    const pickType = interaction.options.getString("픽방식");
    const seriesMode = interaction.options.getString("특수규칙");
    const seriesAction = interaction.options.getString("시리즈동작") ?? "AUTO";

    if (!channel) {
      return await interaction.reply({
        content: "음성채팅방에 참가해주세요!",
        ephemeral: true,
      });
    }

    if (!team1Channel || !team2Channel) {
      return await interaction.reply({
        content: "TEAM BLUE 또는 TEAM PURPLE 채널을 찾지 못했습니다.",
        ephemeral: true,
      });
    }

    const members = Array.from(channel.members.values());
    if (members.length !== 10) {
      return await interaction.reply({
        content: "토너먼트 내전은 음성채팅방에 정확히 10명이 있어야 합니다.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const guildSettings = await getGuildSettings(interaction.guildId);
    if (!guildSettings?.unity_voice_channel_id) {
      return await interaction.editReply(
        "공용 통화방이 설정되지 않았습니다. 서버 관리자에게 `/서버설정 공용통화방` 설정을 요청해주세요."
      );
    }

    let seriesContext = {
      continuedSeries: false,
      seriesMode,
      seriesGameNumber: 1,
      fearlessUsedChampions: [],
    };
    if (seriesMode === "HARD_FEARLESS") {
      const seriesResult = await resolveHardFearlessSeries(
        interaction,
        members,
        seriesAction
      );
      if (!seriesResult.success) {
        return await interaction.editReply(
          seriesResult.msg || "하드 피어리스 시리즈 상태를 확인하는 중 오류가 발생했습니다."
        );
      }

      seriesContext = seriesResult.data;
    }

    let team1Members = [];
    let team2Members = [];
    let team1MMR = 0;
    let team2MMR = 0;

    if (seriesContext.continuedSeries) {
      const continuedResult = await buildContinuedSeriesTeams(
        interaction,
        members,
        seriesContext.latestSession,
        addOption
      );
      if (!continuedResult.success) {
        return await interaction.editReply(
          continuedResult.msg || "하드 피어리스 이어하기 팀 구성을 불러오는 중 오류가 발생했습니다."
        );
      }

      ({
        team1Members,
        team2Members,
        team1MMR,
        team2MMR,
      } = continuedResult.data);
    } else {
      switch (addOption) {
        case "RANDOM": {
          const shuffled = [...members].sort(() => Math.random() - 0.5);
          shuffled.forEach((member, index) => {
            if (index % 2 === 0) {
              team1Members.push(buildRandomEntry(member));
            } else {
              team2Members.push(buildRandomEntry(member));
            }
          });
          break;
        }
        case "MMR": {
          const userIds = members.map((member) => member.user.id);
          const users = await getUsersData(interaction.guildId, userIds);

          if (!users.success) {
            return await interaction.editReply(
              users.msg || "유저 정보를 불러오는 중 오류가 발생했습니다."
            );
          }

          if (users.data.length < 10) {
            return await interaction.editReply(
              "등록되지 않은 소환사가 있습니다. 모든 참여자가 최소 1개 이상의 라이엇 계정을 등록해야 합니다."
            );
          }

          const entries = users.data
            .map((user) => {
              const member = members.find((x) => x.user.id === user.discord_id);
              return member ? { member, user } : null;
            })
            .filter(Boolean);

          const balancedTeams = balanceTeams(entries, TeamData);
          team1Members = balancedTeams.team1Members;
          team2Members = balancedTeams.team2Members;
          team1MMR = balancedTeams.team1MMR;
          team2MMR = balancedTeams.team2MMR;

          TeamDataSaver(team1Members, team2Members);
          break;
        }
        default:
          return await interaction.editReply("해당하는 옵션이 없습니다.");
      }
    }

    if (team1Members.length !== 5 || team2Members.length !== 5) {
      return await interaction.editReply(
        "팀 구성이 올바르게 완료되지 않았습니다. 다시 시도해주세요."
      );
    }

    try {
      const tournament = await createTournamentSession(
        interaction,
        addOption,
        pickType,
        seriesContext
      );
      const sessionResult = await replaceActiveTournamentSession(
        interaction.guildId,
        {
          tournamentCode: tournament.tournamentCode,
          providerId: tournament.providerId,
          tournamentId: tournament.tournamentId,
          sourceChannelId: channel.id,
          team1ChannelId: team1Channel.id,
          team2ChannelId: team2Channel.id,
          unityVoiceChannelId: guildSettings.unity_voice_channel_id,
          team1DiscordIds: team1Members.map((entry) => entry.member.user.id),
          team2DiscordIds: team2Members.map((entry) => entry.member.user.id),
          status: "LOBBY",
          seriesMode: seriesContext.seriesMode ?? "STANDARD",
          seriesGameNumber: seriesContext.seriesGameNumber ?? 1,
          fearlessUsedChampions: seriesContext.fearlessUsedChampions ?? [],
        }
      );

      if (!sessionResult.success) {
        return await interaction.editReply(
          sessionResult.msg || "토너먼트 세션을 저장하는 중 오류가 발생했습니다."
        );
      }

      const embed = buildTournamentEmbed({
        addOption,
        channel,
        team1Channel,
        team2Channel,
        team1Members,
        team2Members,
        team1MMR,
        team2MMR,
        seriesMode: seriesContext.seriesMode ?? "STANDARD",
        seriesGameNumber: seriesContext.seriesGameNumber ?? 1,
        fearlessUsedChampions: seriesContext.fearlessUsedChampions ?? [],
        continuedSeries: Boolean(seriesContext.continuedSeries),
        pickType,
        tournamentCode: tournament.tournamentCode,
      });

      return await interaction.editReply({
        content:
          "팀을 확정했고 새 토너먼트 세션을 생성했습니다. 다시 `/내전`을 실행하면 이전 활성 세션은 취소되고 새 팀/코드로 교체됩니다.",
        embeds: [embed],
      });
    } catch (error) {
      return await interaction.editReply(
        `토너먼트 코드를 생성하는 중 오류가 발생했습니다: ${
          error?.message ?? "알 수 없는 오류"
        }`
      );
    }
  },
};
