const { transformMatchPayload: defaultTransformMatchPayload } = require("../Riot/MatchTransformer");
const {
  persistMatchResult: defaultPersistMatchResult,
  updateTournamentSessionFearlessState: defaultUpdateTournamentSessionFearlessState,
} = require("../Utils/Query");

function collectChampionNames(match) {
  const seen = new Set();
  const championNames = [];
  const players = [
    ...(match?.blueTeam?.players ?? []),
    ...(match?.purpleTeam?.players ?? []),
  ];

  players.forEach((player) => {
    const championName = String(player?.championName ?? "").trim();
    if (!championName) {
      return;
    }

    const normalized = championName.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    championNames.push(championName);
  });

  return championNames;
}

function mergeFearlessChampionHistory(existingChampions, match) {
  const merged = [];
  const seen = new Set();

  [...(existingChampions ?? []), ...collectChampionNames(match)].forEach((value) => {
    const championName = String(value ?? "").trim();
    if (!championName) {
      return;
    }

    const normalized = championName.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    merged.push(championName);
  });

  return merged;
}

function createTournamentResultService({
  riotApi,
  transformMatchPayload = defaultTransformMatchPayload,
  persistMatchResult = defaultPersistMatchResult,
  updateTournamentSessionFearlessState = defaultUpdateTournamentSessionFearlessState,
}) {
  return {
    async ingestSessionResult(session) {
      if (!session?.resultGameId) {
        return {
          success: false,
          msg: "callback payload에 gameId가 없어 경기 결과를 조회할 수 없습니다.",
        };
      }

      const payload = await riotApi.getMatchById(session.resultGameId);
      const match = transformMatchPayload(payload);
      const persistResult = await persistMatchResult(
        session.guildId,
        match,
        session.resultGameId
      );

      if (!persistResult.success) {
        return persistResult;
      }

      if (session.seriesMode === "HARD_FEARLESS") {
        const updateResult = await updateTournamentSessionFearlessState(
          session.guildId,
          session.id,
          {
            fearlessUsedChampions: mergeFearlessChampionHistory(
              session.fearlessUsedChampions,
              match
            ),
          }
        );

        if (!updateResult.success) {
          return updateResult;
        }
      }

      return persistResult;
    },
  };
}

module.exports = {
  collectChampionNames,
  createTournamentResultService,
  mergeFearlessChampionHistory,
};
