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

test("insertMatchData rejects replay payloads that are missing required match fields", async () => {
  let queryCount = 0;
  const { insertMatchData } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        queryCount += 1;
        return [[]];
      },
    }),
  });

  const result = await insertMatchData(
    "guild-1",
    {
      purpleTeam: { players: [] },
      blueTeam: { players: [] },
    },
    "match-1"
  );

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_INPUT");
  assert.match(result.msg, /게임 길이/);
  assert.equal(queryCount, 0);
});

test("replaceActiveTournamentSession rejects missing required session identifiers before querying", async () => {
  let queryCount = 0;
  const { replaceActiveTournamentSession } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        queryCount += 1;
        return [[]];
      },
    }),
  });

  const result = await replaceActiveTournamentSession("guild-1", {
    sourceChannelId: "voice-1",
    team1ChannelId: "blue-1",
    team2ChannelId: "purple-1",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_INPUT");
  assert.match(result.msg, /토너먼트 코드/);
  assert.equal(queryCount, 0);
});
