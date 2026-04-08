const axios = require("axios");

function buildTournamentApiBaseUrl({ useStub, platform }) {
  const family = useStub ? "tournament-stub" : "tournament";
  return `https://${platform}.api.riotgames.com/lol/${family}/v5`;
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
  };
}

module.exports = {
  buildTournamentApiBaseUrl,
  createTournamentApi,
  normalizeLobbyEvents,
};
