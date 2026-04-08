const {
  formatHomeSummary,
  formatLeaderboardEntry,
  formatMatchCard,
  formatPlayerProfileSummary,
} = require("./formatters/PublicSiteFormatter");
const { renderHomePage } = require("./views/HomePage");
const { renderMatchesPage } = require("./views/MatchesPage");
const { renderPlayerPage } = require("./views/PlayerPage");

function buildEmptyHomeModel() {
  return {
    summary: {
      totalMatchesText: "0",
      totalPlayersText: "0",
      topMmrText: "0",
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

function buildSetupNotice() {
  return {
    title: "공개 길드 설정이 필요합니다",
    description:
      "WEB_PUBLIC_GUILD_ID 또는 DISCORD_GUILD_ID를 설정한 뒤 서버를 다시 시작해 주세요.",
  };
}

async function resolvePublicGuildId(preferredGuildId) {
  return preferredGuildId ?? null;
}

function createPublicSiteHandlers({
  preferredGuildId,
  getPublicSiteSummary: getPublicSiteSummaryImpl,
  getPublicLeaderboard: getPublicLeaderboardImpl,
  getPublicMatchHistory: getPublicMatchHistoryImpl,
  getPublicPlayerProfile: getPublicPlayerProfileImpl,
  getLatestMatched: getLatestMatchedImpl,
  searchPublicPlayers: searchPublicPlayersImpl,
} = {}) {
  const {
    getLatestMatched: defaultGetLatestMatched,
    getPublicLeaderboard: defaultGetPublicLeaderboard,
    getPublicMatchHistory: defaultGetPublicMatchHistory,
    getPublicPlayerProfile: defaultGetPublicPlayerProfile,
    getPublicSiteSummary: defaultGetPublicSiteSummary,
    searchPublicPlayers: defaultSearchPublicPlayers,
  } =
    getPublicSiteSummaryImpl === undefined ||
    getPublicLeaderboardImpl === undefined ||
    getPublicMatchHistoryImpl === undefined ||
    getPublicPlayerProfileImpl === undefined ||
    getLatestMatchedImpl === undefined ||
    searchPublicPlayersImpl === undefined
      ? require("../Utils/Query")
      : {
          getLatestMatched: undefined,
          getPublicLeaderboard: undefined,
          getPublicMatchHistory: undefined,
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
  const resolvedGetPublicPlayerProfile =
    getPublicPlayerProfileImpl ?? defaultGetPublicPlayerProfile;
  const resolvedGetLatestMatched = getLatestMatchedImpl ?? defaultGetLatestMatched;
  const resolvedSearchPublicPlayers =
    searchPublicPlayersImpl ?? defaultSearchPublicPlayers;

  async function getGuildId() {
    return resolvePublicGuildId(preferredGuildId);
  }

  return {
    async renderHomePage() {
      const guildId = await getGuildId();
      if (!guildId) {
        return renderHomePage({
          ...buildEmptyHomeModel(),
          notice: buildSetupNotice(),
        });
      }

      const [summaryResult, leaderboardResult, matchesResult] = await Promise.all([
        resolvedGetPublicSiteSummary(guildId),
        resolvedGetPublicLeaderboard(guildId, 20),
        resolvedGetPublicMatchHistory(guildId, 6),
      ]);

      return renderHomePage({
        summary: summaryResult.success
          ? formatHomeSummary(summaryResult.data)
          : buildEmptyHomeModel().summary,
        ranking: leaderboardResult.success
          ? leaderboardResult.data.map(formatLeaderboardEntry)
          : [],
        recentMatches: matchesResult.success
          ? matchesResult.data.map(formatMatchCard)
          : [],
      });
    },

    async renderMatchesPage() {
      const guildId = await getGuildId();
      if (!guildId) {
        return renderMatchesPage({
          ...buildEmptyMatchesModel(),
          notice: buildSetupNotice(),
        });
      }

      const matchesResult = await resolvedGetPublicMatchHistory(guildId);
      return renderMatchesPage({
        cards: matchesResult.success ? matchesResult.data.map(formatMatchCard) : [],
      });
    },

    async renderPlayerPage(discordId) {
      const guildId = await getGuildId();
      if (!guildId) {
        return null;
      }

      const profileResult = await resolvedGetPublicPlayerProfile(guildId, discordId);
      if (!profileResult.success) {
        return null;
      }

      const recentMatchesResult = await resolvedGetLatestMatched(guildId, discordId);

      return renderPlayerPage({
        profile: formatPlayerProfileSummary(profileResult.data),
        recentMatches: recentMatchesResult.success
          ? recentMatchesResult.data.map(formatMatchCard)
          : [],
      });
    },

    async searchPlayers(query) {
      const guildId = await getGuildId();
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
