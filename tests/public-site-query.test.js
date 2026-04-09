const test = require("node:test");
const assert = require("node:assert/strict");

function primeRuntimeEnv() {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
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

test("buildPublicSummarySql returns aggregate counts and leader fields", () => {
  const { buildPublicSummarySql } = loadQueryModule();
  const sql = buildPublicSummarySql();

  assert.match(sql, /COUNT\(\*\)\s+AS\s+total_matches/i);
  assert.match(sql, /COUNT\(\*\)\s+AS\s+total_players/i);
  assert.match(sql, /top_mmr/i);
  assert.match(sql, /top_win_rate/i);
  assert.match(sql, /FROM matches/i);
});

test("buildPublicPlayerSearchSql limits public search results", () => {
  const { buildPublicPlayerSearchSql } = loadQueryModule();
  const sql = buildPublicPlayerSearchSql();

  assert.match(sql, /WHERE name LIKE \?/i);
  assert.match(sql, /ORDER BY mmr DESC, name ASC/i);
  assert.match(sql, /LIMIT 10/i);
});

test("getPublicSiteSummary returns the first summary row", async () => {
  const seenStatements = [];
  const { getPublicSiteSummary } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement) {
        seenStatements.push(statement);
        return [[{ total_matches: 12, total_players: 8, top_mmr: 1700 }]];
      },
    }),
  });

  const result = await getPublicSiteSummary("guild-1");

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    total_matches: 12,
    total_players: 8,
    top_mmr: 1700,
  });
  assert.match(seenStatements[0], /COUNT\(\*\)\s+AS\s+total_matches/i);
});

test("getPublicPlayerProfile returns a missing result when the player does not exist", async () => {
  const { getPublicPlayerProfile } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        return [[]];
      },
    }),
  });

  const result = await getPublicPlayerProfile("guild-1", "missing");

  assert.equal(result.success, false);
  assert.equal(result.code, "PLAYER_NOT_FOUND");
});

test("getPublicLeaderboard returns players ordered for the public ranking table", async () => {
  const statements = [];
  const paramsSeen = [];
  const { getPublicLeaderboard } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        statements.push(statement);
        paramsSeen.push(params);
        return [[{ discord_id: "1", name: "Alpha", mmr: 1700, win: 7, lose: 3 }]];
      },
    }),
  });

  const result = await getPublicLeaderboard("guild-1", 25);

  assert.equal(result.success, true);
  assert.equal(result.data.length, 1);
  assert.match(statements[0], /ORDER BY mmr DESC, name ASC/i);
  assert.deepEqual(paramsSeen[0], [25]);
});

test("getPublicLeaderboard can fetch the full public ranking without a limit", async () => {
  const statements = [];
  const paramsSeen = [];
  const { getPublicLeaderboard } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        statements.push(statement);
        paramsSeen.push(params);
        return [[{ discord_id: "1", name: "Alpha", mmr: 1700, win: 7, lose: 3 }]];
      },
    }),
  });

  const result = await getPublicLeaderboard("guild-1");

  assert.equal(result.success, true);
  assert.equal(result.data.length, 1);
  assert.match(statements[0], /ORDER BY mmr DESC, name ASC/i);
  assert.doesNotMatch(statements[0], /LIMIT \?/i);
  assert.deepEqual(paramsSeen[0], []);
});

test("getPublicMatchHistory returns the newest matches first", async () => {
  const statements = [];
  const paramsSeen = [];
  const { getPublicMatchHistory } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        statements.push(statement);
        paramsSeen.push(params);
        return [[{ id: 44, game_id: "KR-1" }]];
      },
    }),
  });

  const result = await getPublicMatchHistory("guild-1", 15);

  assert.equal(result.success, true);
  assert.equal(result.data[0].id, 44);
  assert.match(statements[0], /ORDER BY id DESC/i);
  assert.deepEqual(paramsSeen[0], [15]);
});

test("getPublicMatchById returns the requested match row", async () => {
  const statements = [];
  const paramsSeen = [];
  const { getPublicMatchById } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        statements.push(statement);
        paramsSeen.push(params);
        return [[{ id: 9, game_id: "KR-9" }]];
      },
    }),
  });

  const result = await getPublicMatchById("guild-1", 9);

  assert.equal(result.success, true);
  assert.equal(result.data.id, 9);
  assert.match(statements[0], /WHERE id = \?/i);
  assert.deepEqual(paramsSeen[0], [9]);
});

test("getPublicMatchById returns a missing result when the match does not exist", async () => {
  const { getPublicMatchById } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        return [[]];
      },
    }),
  });

  const result = await getPublicMatchById("guild-1", 404);

  assert.equal(result.success, false);
  assert.equal(result.code, "MATCH_NOT_FOUND");
});

test("searchPublicPlayers wraps the search term for public name matching", async () => {
  const paramsSeen = [];
  const { searchPublicPlayers } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(_statement, params) {
        paramsSeen.push(params);
        return [[{ discord_id: "1", name: "eggcat", mmr: 1200, win: 3, lose: 2 }]];
      },
    }),
  });

  const result = await searchPublicPlayers("guild-1", "egg");

  assert.equal(result.success, true);
  assert.equal(result.data[0].name, "eggcat");
  assert.deepEqual(paramsSeen[0], ["%egg%"]);
});
