const {
  buildPublicSiteFormatterOptions,
  formatHomeSummary,
  formatLeaderboardEntry,
  formatMatchCard,
  formatMatchDetail,
  formatPlayerProfileSummary,
} = require("./formatters/PublicSiteFormatter");
const { championNameService } = require("../Riot/ChampionNameService");
const { riotAssetService } = require("../Riot/RiotAssetService");
const { renderHomePage } = require("./views/HomePage");
const { renderLandingPage: renderLandingPageView } = require("./views/LandingPage");
const { renderMatchDetailPage: renderMatchDetailView } = require("./views/MatchDetailPage");
const { renderMatchesPage } = require("./views/MatchesPage");
const { renderPlayerPage } = require("./views/PlayerPage");
const { renderRankingPage: renderRankingPageView } = require("./views/RankingPage");
const {
  createPlayerRiotIdentityRefreshService,
} = require("./PlayerRiotIdentityRefresh");

function buildEmptyHomeModel() {
  return {
    summary: {
      totalMatchesText: "0",
      totalPlayersText: "0",
      topWinRateText: "0%",
    },
    ranking: [],
    recentMatches: [],
  };
}

function buildEmptyMatchesModel() {
  return {
    cards: [],
  };
}

function buildEmptyRankingModel() {
  return {
    ranking: [],
  };
}

function buildSetupNotice() {
  return {
    title: "공개 길드 설정이 필요합니다",
    description:
      "WEB_PUBLIC_GUILD_ID 또는 DISCORD_GUILD_ID를 설정한 뒤 서버를 다시 시작해 주세요.",
  };
}

async function resolvePublicGuildId(routeGuildId, preferredGuildId) {
  return routeGuildId || preferredGuildId || null;
}

function getPlayerDiscordId(player) {
  const discordId = player?.discord_id ?? player?.discordId;
  return String(discordId ?? "").trim();
}

function parseStoredMatchJson(value, fallback) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function buildPlayerRefreshLocation(guildId, discordId, refreshStatus) {
  const encodedGuildId = encodeURIComponent(guildId);
  const encodedDiscordId = encodeURIComponent(discordId);
  const basePath = `/${encodedGuildId}/players/${encodedDiscordId}`;

  if (!refreshStatus) {
    return basePath;
  }

  return `${basePath}?refresh=${encodeURIComponent(refreshStatus)}`;
}

function createPublicSiteHandlers({
  preferredGuildId,
  getPublicSiteSummary: getPublicSiteSummaryImpl,
  getPublicLeaderboard: getPublicLeaderboardImpl,
  getPublicMatchById: getPublicMatchByIdImpl,
  getPublicMatchHistory: getPublicMatchHistoryImpl,
  getPublicPlayerProfile: getPublicPlayerProfileImpl,
  getLatestMatched: getLatestMatchedImpl,
  getChampionNameMap: getChampionNameMapImpl,
  getRiotAssetManifest: getRiotAssetManifestImpl,
  refreshPlayerRiotIdentity: refreshPlayerRiotIdentityImpl,
  resolveUsersByPuuids: resolveUsersByPuuidsImpl,
  searchPublicPlayers: searchPublicPlayersImpl,
} = {}) {
  const {
    getLatestMatched: defaultGetLatestMatched,
    getPublicLeaderboard: defaultGetPublicLeaderboard,
    getPublicMatchById: defaultGetPublicMatchById,
    getPublicMatchHistory: defaultGetPublicMatchHistory,
    getPublicPlayerProfile: defaultGetPublicPlayerProfile,
    getPublicSiteSummary: defaultGetPublicSiteSummary,
    resolveUsersByPuuids: defaultResolveUsersByPuuids,
    searchPublicPlayers: defaultSearchPublicPlayers,
  } =
    getPublicSiteSummaryImpl === undefined ||
    getPublicLeaderboardImpl === undefined ||
    getPublicMatchHistoryImpl === undefined ||
    getPublicMatchByIdImpl === undefined ||
    getPublicPlayerProfileImpl === undefined ||
    getLatestMatchedImpl === undefined ||
    searchPublicPlayersImpl === undefined
      ? require("../Utils/Query")
      : {
          getLatestMatched: undefined,
          getPublicLeaderboard: undefined,
          getPublicMatchHistory: undefined,
          getPublicMatchById: undefined,
          getPublicPlayerProfile: undefined,
          getPublicSiteSummary: undefined,
          resolveUsersByPuuids: async () => ({ success: true, data: [] }),
          searchPublicPlayers: undefined,
        };

  const resolvedGetPublicSiteSummary =
    getPublicSiteSummaryImpl ?? defaultGetPublicSiteSummary;
  const resolvedGetPublicLeaderboard =
    getPublicLeaderboardImpl ?? defaultGetPublicLeaderboard;
  const resolvedGetPublicMatchHistory =
    getPublicMatchHistoryImpl ?? defaultGetPublicMatchHistory;
  const resolvedGetPublicMatchById =
    getPublicMatchByIdImpl ?? defaultGetPublicMatchById;
  const resolvedGetPublicPlayerProfile =
    getPublicPlayerProfileImpl ?? defaultGetPublicPlayerProfile;
  const resolvedGetLatestMatched = getLatestMatchedImpl ?? defaultGetLatestMatched;
  const resolvedSearchPublicPlayers =
    searchPublicPlayersImpl ?? defaultSearchPublicPlayers;
  const resolvedResolveUsersByPuuids =
    resolveUsersByPuuidsImpl ?? defaultResolveUsersByPuuids;
  const resolvedGetChampionNameMap =
    getChampionNameMapImpl ??
    championNameService.getChampionNameMap.bind(championNameService);
  const resolvedGetRiotAssetManifest =
    getRiotAssetManifestImpl ??
    riotAssetService.getAssetManifest.bind(riotAssetService);
  let refreshService = null;
  const resolvedRefreshPlayerRiotIdentity =
    refreshPlayerRiotIdentityImpl ??
    ((guildId, discordId) => {
      if (!refreshService) {
        refreshService = createPlayerRiotIdentityRefreshService();
      }

      return refreshService.refreshPlayerRiotIdentity(guildId, discordId);
    });

  async function getGuildId(routeGuildId) {
    return resolvePublicGuildId(routeGuildId, preferredGuildId);
  }

  async function getFormatterOptions() {
    try {
      const [championNameMap, assetManifest] = await Promise.all([
        resolvedGetChampionNameMap(),
        resolvedGetRiotAssetManifest(),
      ]);
      return buildPublicSiteFormatterOptions({
        championNameMap,
        ...assetManifest,
      });
    } catch (error) {
      return buildPublicSiteFormatterOptions();
    }
  }

  async function applyRepresentativeRiotNamesToMatches(guildId, matchRows) {
    if (!Array.isArray(matchRows) || !matchRows.length) {
      return [];
    }

    const puuids = [
      ...new Set(
        matchRows.flatMap((matchRow) => {
          const blueTeam = parseStoredMatchJson(matchRow?.blue_team, { players: [] });
          const purpleTeam = parseStoredMatchJson(matchRow?.purple_team, { players: [] });
          return [...(blueTeam.players ?? []), ...(purpleTeam.players ?? [])]
            .map((player) => String(player?.puuid ?? "").trim())
            .filter(Boolean);
        })
      ),
    ];

    if (!puuids.length) {
      return matchRows;
    }

    let linkedUsers = [];
    try {
      const result = await resolvedResolveUsersByPuuids(guildId, puuids);
      linkedUsers = result?.success ? result.data ?? [] : [];
    } catch (error) {
      linkedUsers = [];
    }

    if (!linkedUsers.length) {
      return matchRows;
    }

    const nameByPuuid = new Map(
      linkedUsers
        .map((user) => [
          String(user?.linked_puuid ?? "").trim(),
          String(user?.name ?? "").trim(),
        ])
        .filter(([linkedPuuid, name]) => linkedPuuid && name)
    );

    return matchRows.map((matchRow) => {
      const blueTeam = parseStoredMatchJson(matchRow?.blue_team, { players: [] });
      const purpleTeam = parseStoredMatchJson(matchRow?.purple_team, { players: [] });

      const rewritePlayers = (players = []) =>
        players.map((player) => {
          const liveName = nameByPuuid.get(String(player?.puuid ?? "").trim());
          return liveName
            ? {
                ...player,
                playerName: liveName,
              }
            : player;
        });

      return {
        ...matchRow,
        blue_team: JSON.stringify({
          ...blueTeam,
          players: rewritePlayers(blueTeam.players),
        }),
        purple_team: JSON.stringify({
          ...purpleTeam,
          players: rewritePlayers(purpleTeam.players),
        }),
      };
    });
  }

  return {
    async renderLandingPage() {
      return renderLandingPageView();
    },

    async renderHomePage(routeGuildId) {
      const guildId = await getGuildId(routeGuildId);
      if (!guildId) {
        return renderHomePage({
          guildId: "",
          ...buildEmptyHomeModel(),
          notice: buildSetupNotice(),
        });
      }

      const formatterOptions = await getFormatterOptions();
      const [summaryResult, leaderboardResult, matchesResult] = await Promise.all([
        resolvedGetPublicSiteSummary(guildId),
        resolvedGetPublicLeaderboard(guildId, 20),
        resolvedGetPublicMatchHistory(guildId, 6),
      ]);
      const rankingRows = leaderboardResult.success
        ? leaderboardResult.data
        : [];
      const recentMatchRows = matchesResult.success
        ? await applyRepresentativeRiotNamesToMatches(guildId, matchesResult.data)
        : [];

      return renderHomePage({
        guildId,
        summary: summaryResult.success
          ? formatHomeSummary(summaryResult.data)
          : buildEmptyHomeModel().summary,
        ranking: rankingRows.map(formatLeaderboardEntry),
        recentMatches: recentMatchRows.map((matchRow) =>
          formatMatchCard(matchRow, formatterOptions)
        ),
      });
    },

    async renderMatchesPage(routeGuildId) {
      const guildId = await getGuildId(routeGuildId);
      if (!guildId) {
        return renderMatchesPage({
          guildId: "",
          ...buildEmptyMatchesModel(),
          notice: buildSetupNotice(),
        });
      }

      const formatterOptions = await getFormatterOptions();
      const matchesResult = await resolvedGetPublicMatchHistory(guildId);
      const matchRows = matchesResult.success
        ? await applyRepresentativeRiotNamesToMatches(guildId, matchesResult.data)
        : [];
      return renderMatchesPage({
        guildId,
        cards: matchRows.map((matchRow) =>
          formatMatchCard(matchRow, formatterOptions)
        ),
      });
    },

    async renderRankingPage(routeGuildId) {
      const guildId = await getGuildId(routeGuildId);
      if (!guildId) {
        return renderRankingPageView({
          guildId: "",
          ...buildEmptyRankingModel(),
          notice: buildSetupNotice(),
        });
      }

      const leaderboardResult = await resolvedGetPublicLeaderboard(guildId);
      const rankingRows = leaderboardResult.success
        ? leaderboardResult.data
        : [];
      return renderRankingPageView({
        guildId,
        ranking: rankingRows.map(formatLeaderboardEntry),
      });
    },

    async renderMatchDetailPage(routeGuildId, matchId) {
      const guildId = await getGuildId(routeGuildId);
      if (!guildId) {
        return null;
      }

      const formatterOptions = await getFormatterOptions();
      const matchResult = await resolvedGetPublicMatchById(guildId, matchId);
      if (!matchResult.success) {
        return null;
      }
      const [matchRow] = await applyRepresentativeRiotNamesToMatches(guildId, [
        matchResult.data,
      ]);

      return renderMatchDetailView({
        guildId,
        match: formatMatchDetail(matchRow, formatterOptions),
      });
    },

    async renderPlayerPage(routeGuildId, discordId, refreshStatus) {
      const guildId = await getGuildId(routeGuildId);
      if (!guildId) {
        return null;
      }

      const profileResult = await resolvedGetPublicPlayerProfile(guildId, discordId);
      if (!profileResult.success) {
        return null;
      }

      const formatterOptions = await getFormatterOptions();
      const recentMatchesResult = await resolvedGetLatestMatched(guildId, discordId);
      const recentMatchRows = recentMatchesResult.success
        ? await applyRepresentativeRiotNamesToMatches(guildId, recentMatchesResult.data)
        : [];

      return renderPlayerPage({
        guildId,
        refreshStatus,
        profile: formatPlayerProfileSummary(profileResult.data, formatterOptions),
        recentMatches: recentMatchRows.map((matchRow) =>
          formatMatchCard(matchRow, formatterOptions)
        ),
      });
    },

    async handlePlayerRiotIdentityRefresh(routeGuildId, discordId) {
      const guildId = await getGuildId(routeGuildId);
      if (!guildId) {
        return {
          statusCode: 303,
          location: buildPlayerRefreshLocation(routeGuildId, discordId, "failed"),
        };
      }

      const result = await resolvedRefreshPlayerRiotIdentity(guildId, discordId);

      return {
        statusCode: 303,
        location: buildPlayerRefreshLocation(
          guildId,
          discordId,
          result?.status ?? "failed"
        ),
      };
    },

    async searchPlayers(routeGuildId, query) {
      const guildId = await getGuildId(routeGuildId);
      if (!guildId || !query) {
        return [];
      }

      const result = await resolvedSearchPublicPlayers(guildId, query);
      if (!result.success) {
        return [];
      }

      return result.data.map((row) => ({
        discordId: row.discord_id,
        name: row.name,
      }));
    },
  };
}

module.exports = {
  createPublicSiteHandlers,
  resolvePublicGuildId,
};
