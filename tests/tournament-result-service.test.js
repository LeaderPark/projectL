const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
process.env.DISCORD_CLIENT_ID =
  process.env.DISCORD_CLIENT_ID || "client-id";
process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
process.env.DB_HOST = process.env.DB_HOST || "db";
process.env.DB_USER = process.env.DB_USER || "bot";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
process.env.DB_NAME = process.env.DB_NAME || "bot";

const {
  createTournamentResultService,
} = require("../scripts/Tournament/TournamentResultService");

function buildTransformedMatch() {
  return {
    matchId: "KR_12345",
    blueTeam: {
      players: [
        { championName: "Ahri" },
        { championName: "Garen" },
      ],
    },
    purpleTeam: {
      players: [
        { championName: "Leona" },
        { championName: "Ahri" },
      ],
    },
  };
}

test("hard fearless ingestion updates the stored champion pool after a successful match import", async () => {
  const updates = [];
  const service = createTournamentResultService({
    riotApi: {
      async getMatchById(matchId) {
        assert.equal(matchId, "KR_12345");
        return { raw: true };
      },
    },
    transformMatchPayload() {
      return buildTransformedMatch();
    },
    persistMatchResult: async () => ({ success: true }),
    updateTournamentSessionFearlessState: async (guildId, sessionId, nextState) => {
      updates.push({ guildId, sessionId, nextState });
      return { success: true };
    },
  });

  const result = await service.ingestSessionResult({
    id: 88,
    guildId: "guild-1",
    resultGameId: "KR_12345",
    seriesMode: "HARD_FEARLESS",
    fearlessUsedChampions: ["Ahri"],
  });

  assert.equal(result.success, true);
  assert.deepEqual(updates, [
    {
      guildId: "guild-1",
      sessionId: 88,
      nextState: {
        fearlessUsedChampions: ["Ahri", "Garen", "Leona"],
      },
    },
  ]);
});

test("standard session ingestion does not update hard fearless champion history", async () => {
  let updateCount = 0;
  const service = createTournamentResultService({
    riotApi: {
      async getMatchById() {
        return { raw: true };
      },
    },
    transformMatchPayload() {
      return buildTransformedMatch();
    },
    persistMatchResult: async () => ({ success: true }),
    updateTournamentSessionFearlessState: async () => {
      updateCount += 1;
      return { success: true };
    },
  });

  const result = await service.ingestSessionResult({
    id: 89,
    guildId: "guild-1",
    resultGameId: "KR_12345",
    seriesMode: "STANDARD",
    fearlessUsedChampions: [],
  });

  assert.equal(result.success, true);
  assert.equal(updateCount, 0);
});
