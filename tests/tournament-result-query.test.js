const test = require("node:test");
const assert = require("node:assert/strict");

function primeRuntimeEnv() {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID =
    process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";
}

function loadQueryModule(dbOverrides = {}) {
  primeRuntimeEnv();

  const dbPath = require.resolve("../scripts/Utils/DB");
  const queryPath = require.resolve("../scripts/Utils/Query");
  const originalDbModule = require.cache[dbPath];

  delete require.cache[queryPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      getGuildPromisePool: async () => {
        throw new Error("getGuildPromisePool mock missing");
      },
      ...dbOverrides,
    },
  };

  const queryModule = require(queryPath);

  if (originalDbModule) {
    require.cache[dbPath] = originalDbModule;
  } else {
    delete require.cache[dbPath];
  }

  return queryModule;
}

test("markTournamentSessionResultPending stores callback payload and game id for retries", async () => {
  const calls = [];
  const { markTournamentSessionResultPending } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        calls.push({ statement, params });
        return [{ affectedRows: 1 }];
      },
    }),
  });

  const payload = {
    shortCode: "KR-CODE-1",
    gameId: 12345,
    region: "KR",
  };

  const result = await markTournamentSessionResultPending(
    "guild-1",
    "KR-CODE-1",
    payload
  );

  assert.equal(result.success, true);
  assert.equal(calls.length, 1);
  assert.match(calls[0].statement, /result_status = 'PENDING'/);
  assert.deepEqual(calls[0].params, [
    "12345",
    JSON.stringify(payload),
    "KR-CODE-1",
  ]);
});

test("markTournamentSessionResultPending reports failure when no active session matches the tournament code", async () => {
  const { markTournamentSessionResultPending } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        return [{ affectedRows: 0 }];
      },
    }),
  });

  const result = await markTournamentSessionResultPending("guild-1", "KR-MISSING", {
    gameId: 12345,
  });

  assert.equal(result.success, false);
  assert.match(result.msg, /활성 토너먼트 세션/);
});

test("updateTournamentSessionResult updates status, attempts, and error details", async () => {
  const calls = [];
  const { updateTournamentSessionResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        calls.push({ statement, params });
        return [{ affectedRows: 1 }];
      },
    }),
  });

  const result = await updateTournamentSessionResult("guild-1", 77, {
    status: "FAILED",
    attempts: 3,
    error: "rate limited",
  });

  assert.equal(result.success, true);
  assert.equal(calls.length, 1);
  assert.match(calls[0].statement, /SET result_status = \?, result_attempts = \?, result_error = \?/);
  assert.deepEqual(calls[0].params, ["FAILED", 3, "rate limited", 77]);
});

test("listPendingTournamentSessions exposes result ingestion fields for the poller", async () => {
  const { listPendingTournamentSessions } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        return [[
          {
            id: 21,
            tournament_code: "KR-CODE-21",
            provider_id: "provider-1",
            tournament_id: "tournament-1",
            source_channel_id: "voice-1",
            team1_channel_id: "blue-1",
            team2_channel_id: "purple-1",
            unity_voice_channel_id: "unity-1",
            team1_discord_ids: "[\"1\"]",
            team2_discord_ids: "[\"2\"]",
            status: "COMPLETED_PENDING_GATHER",
            last_event_at: "123",
            result_status: "PENDING",
            result_game_id: "KR_555",
            result_payload: "{\"gameId\":555}",
            result_attempts: 2,
            result_error: "rate limited",
          },
        ]];
      },
    }),
  });

  const result = await listPendingTournamentSessions("guild-1");

  assert.equal(result.success, true);
  assert.deepEqual(result.data[0], {
    id: 21,
    guildId: "guild-1",
    tournamentCode: "KR-CODE-21",
    providerId: "provider-1",
    tournamentId: "tournament-1",
    sourceChannelId: "voice-1",
    team1ChannelId: "blue-1",
    team2ChannelId: "purple-1",
    unityVoiceChannelId: "unity-1",
    team1DiscordIds: ["1"],
    team2DiscordIds: ["2"],
    status: "COMPLETED_PENDING_GATHER",
    lastEventAt: "123",
    resultStatus: "PENDING",
    resultGameId: "KR_555",
    resultPayload: "{\"gameId\":555}",
    resultAttempts: 2,
    resultError: "rate limited",
  });
});

test("listPendingTournamentSessions keeps completed sessions visible while result ingestion is pending", async () => {
  const calls = [];
  const { listPendingTournamentSessions } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement) {
        calls.push(statement);
        return [[]];
      },
    }),
  });

  await listPendingTournamentSessions("guild-1");

  assert.equal(calls.length, 1);
  assert.match(calls[0], /status IN \('LOBBY', 'CHAMP_SELECT_STARTED', 'MOVE_FAILED', 'COMPLETED_PENDING_GATHER', 'GATHER_FAILED', 'COMPLETED'\)/);
  assert.match(calls[0], /result_status IN \('PENDING', 'FAILED'\)/);
});
