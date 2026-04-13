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

function buildRiotApiError(error, { scope, action, useStub }) {
  const statusCode = Number(error?.response?.status);
  const responseMessage = String(
    error?.response?.data?.status?.message ?? error?.message ?? "Unknown error"
  ).trim();
  const safeResponseMessage = responseMessage || "Unknown error";

  if (scope === "tournament" && statusCode === 403) {
    return new Error(
      `Riot Tournament API 호출이 403으로 거부되었습니다 (${action}). 현재 API 키에 Tournament API 권한이 없거나 키가 만료되었을 수 있습니다. 일반 LoL API가 동작해도 Tournament API는 별도 권한이 필요하고, RIOT_TOURNAMENT_USE_STUB=true여도 이 권한은 필요합니다. Riot Developer Portal에서 토너먼트 API 승인 상태를 확인하고 RIOT_API_TOKEN을 갱신한 뒤 봇을 다시 시작해주세요.`
    );
  }

  if (statusCode > 0) {
    return new Error(
      `Riot ${scope === "match" ? "Match" : "Tournament"} API 요청이 실패했습니다 (${action}, ${statusCode}: ${safeResponseMessage}).`
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(safeResponseMessage);
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
      try {
        const response = await api.post("/providers", {
          region: config.region,
          url: config.callbackUrl,
        });

        return response.data;
      } catch (error) {
        throw buildRiotApiError(error, {
          scope: "tournament",
          action: "provider 생성",
          useStub: config.useStub,
        });
      }
    },

    async createTournament(providerId, name) {
      try {
        const response = await api.post("/tournaments", {
          name,
          providerId,
        });

        return response.data;
      } catch (error) {
        throw buildRiotApiError(error, {
          scope: "tournament",
          action: "tournament 생성",
          useStub: config.useStub,
        });
      }
    },

    async createTournamentCode(tournamentId, options = {}) {
      try {
        const response = await api.post(
          `/codes?count=1&tournamentId=${tournamentId}`,
          {
            mapType: options.mapType ?? "SUMMONERS_RIFT",
            pickType: options.pickType ?? "TOURNAMENT_DRAFT",
            spectatorType: options.spectatorType ?? "NONE",
            teamSize: options.teamSize ?? 5,
            metaData: options.metaData ?? "",
            allowedSummonerIds: options.allowedSummonerIds ?? [],
          }
        );

        return Array.isArray(response.data) ? response.data[0] : response.data;
      } catch (error) {
        throw buildRiotApiError(error, {
          scope: "tournament",
          action: "tournament code 생성",
          useStub: config.useStub,
        });
      }
    },

    async getLobbyEventsByCode(tournamentCode) {
      try {
        const response = await api.get(
          `/lobby-events/by-code/${encodeURIComponent(tournamentCode)}`
        );

        return normalizeLobbyEvents(response.data);
      } catch (error) {
        throw buildRiotApiError(error, {
          scope: "tournament",
          action: "lobby event 조회",
          useStub: config.useStub,
        });
      }
    },

    async getMatchById(matchId) {
      try {
        const normalizedMatchId = normalizeMatchId(matchId, config.platform);
        const response = await matchApi.get(
          `/matches/${encodeURIComponent(normalizedMatchId)}`
        );

        return response.data;
      } catch (error) {
        throw buildRiotApiError(error, {
          scope: "match",
          action: "match 조회",
          useStub: config.useStub,
        });
      }
    },
  };
}

module.exports = {
  buildRiotApiError,
  buildMatchApiBaseUrl,
  buildTournamentApiBaseUrl,
  createTournamentApi,
  normalizeLobbyEvents,
};
