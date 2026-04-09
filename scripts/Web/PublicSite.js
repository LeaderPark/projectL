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
  searchPublicPlayers: searchPublicPlayersImpl,
} = {}) {
  const {
    getLatestMatched: defaultGetLatestMatched,
    getPublicLeaderboard: defaultGetPublicLeaderboard,
    getPublicMatchById: defaultGetPublicMatchById,
    getPublicMatchHistory: defaultGetPublicMatchHistory,
    getPublicPlayerProfile: defaultGetPublicPlayerProfile,
    getPublicSiteSummary: defaultGetPublicSiteSummary,
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
  const resolvedGetChampionNameMap =
    getChampionNameMapImpl ??
    championNameService.getChampionNameMap.bind(championNameService);
  const resolvedGetRiotAssetManifest =
    getRiotAssetManifestImpl ??
    riotAssetService.getAssetManifest.bind(riotAssetService);

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

      return renderHomePage({
        guildId,
        summary: summaryResult.success
          ? formatHomeSummary(summaryResult.data)
          : buildEmptyHomeModel().summary,
        ranking: leaderboardResult.success
          ? leaderboardResult.data.map(formatLeaderboardEntry)
          : [],
        recentMatches: matchesResult.success
          ? matchesResult.data.map((matchRow) =>
              formatMatchCard(matchRow, formatterOptions)
            )
          : [],
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
      return renderMatchesPage({
        guildId,
        cards: matchesResult.success
          ? matchesResult.data.map((matchRow) =>
              formatMatchCard(matchRow, formatterOptions)
            )
          : [],
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
      return renderRankingPageView({
        guildId,
        ranking: leaderboardResult.success
          ? leaderboardResult.data.map(formatLeaderboardEntry)
          : [],
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

      return renderMatchDetailView({
        guildId,
        match: formatMatchDetail(matchResult.data, formatterOptions),
      });
    },

    async renderPlayerPage(routeGuildId, discordId) {
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

      return renderPlayerPage({
        guildId,
        profile: formatPlayerProfileSummary(profileResult.data, formatterOptions),
        recentMatches: recentMatchesResult.success
          ? recentMatchesResult.data.map((matchRow) =>
              formatMatchCard(matchRow, formatterOptions)
            )
          : [],
      });
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
