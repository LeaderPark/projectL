const axios = require("axios");

function buildTournamentApiBaseUrl({ useStub, platform }) {
  const family = useStub ? "tournament-stub" : "tournament";
  return `https://${platform}.api.riotgames.com/lol/${family}/v5`;
}

function resolveRegionalRoute({ regionalRoute, platform }) {
  if (regionalRoute) {
    return regionalRoute;
  }

  const normalizedPlatform = String(platform ?? "").toLowerCase();
  if (["kr", "jp1"].includes(normalizedPlatform)) {
    return "asia";
  }

  if (["na1", "br1", "la1", "la2", "oc1"].includes(normalizedPlatform)) {
    return "americas";
  }

  if (["eun1", "euw1", "tr1", "ru"].includes(normalizedPlatform)) {
    return "europe";
  }

  throw new Error(
    `Unable to determine the Riot regional route for platform "${platform}". Provide regionalRoute explicitly.`
  );
}

function buildMatchApiBaseUrl(config) {
  return `https://${resolveRegionalRoute(config)}.api.riotgames.com/lol/match/v5`;
}

function normalizeMatchId(matchId, platform) {
  const normalizedMatchId = String(matchId ?? "").trim();
  if (!normalizedMatchId) {
    return normalizedMatchId;
  }

  if (normalizedMatchId.includes("_")) {
    return normalizedMatchId;
  }

  return `${String(platform ?? "").toUpperCase()}_${normalizedMatchId}`;
}

function normalizeLobbyEvents(payload) {
  if (!payload || !Array.isArray(payload.eventList)) {
    return [];
  }

  return payload.eventList;
}

function createTournamentApi(config) {
  const api = axios.create({
    baseURL: buildTournamentApiBaseUrl(config),
    headers: {
      "X-Riot-Token": config.token,
      "Content-Type": "application/json",
    },
  });
  const matchApi = axios.create({
    baseURL: buildMatchApiBaseUrl(config),
    headers: {
      "X-Riot-Token": config.token,
      "Content-Type": "application/json",
    },
  });

  return {
    async createProvider() {
      const response = await api.post("/providers", {
        region: config.region,
        url: config.callbackUrl,
      });

      return response.data;
    },

    async createTournament(providerId, name) {
      const response = await api.post("/tournaments", {
        name,
        providerId,
      });

      return response.data;
    },

    async createTournamentCode(tournamentId, options = {}) {
      const response = await api.post(`/codes?count=1&tournamentId=${tournamentId}`, {
        mapType: options.mapType ?? "SUMMONERS_RIFT",
        pickType: options.pickType ?? "TOURNAMENT_DRAFT",
        spectatorType: options.spectatorType ?? "NONE",
        teamSize: options.teamSize ?? 5,
        metaData: options.metaData ?? "",
        allowedSummonerIds: options.allowedSummonerIds ?? [],
      });

      return Array.isArray(response.data) ? response.data[0] : response.data;
    },

    async getLobbyEventsByCode(tournamentCode) {
      const response = await api.get(
        `/lobby-events/by-code/${encodeURIComponent(tournamentCode)}`
      );

      return normalizeLobbyEvents(response.data);
    },

    async getMatchById(matchId) {
      const normalizedMatchId = normalizeMatchId(matchId, config.platform);
      const response = await matchApi.get(
        `/matches/${encodeURIComponent(normalizedMatchId)}`
      );

      return response.data;
    },
  };
}

module.exports = {
  buildMatchApiBaseUrl,
  buildTournamentApiBaseUrl,
  createTournamentApi,
  normalizeLobbyEvents,
};
