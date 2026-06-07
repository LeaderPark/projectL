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

// SQL matchers (the production query text is the source of truth).
const isMatchLookup = (sql) => /SELECT id, game_id FROM matches WHERE id = \?/i.test(sql);
const isDelete = (sql) => /DELETE FROM matches WHERE id = \?/i.test(sql);
const isReset = (sql) => /UPDATE user[\s\S]*mmr = 1000/i.test(sql);
const isRemainingSelect = (sql) =>
  /SELECT id, purple_team, blue_team FROM matches ORDER BY id ASC/i.test(sql);
const isPuuidResolve = (sql) => /u\.puuid AS linked_puuid/i.test(sql);
const isNameResolve = (sql) => /linked_name/i.test(sql);
const isPerPlayerUpdate = (sql) => /UPDATE user SET mmr = \?/i.test(sql);
const isAutoIncrementSelect = (sql) => /COALESCE\(MAX\(id\), 0\) \+ 1/i.test(sql);
const isAutoIncrementAlter = (sql) => /ALTER TABLE matches AUTO_INCREMENT/i.test(sql);

function userRow(discordId, puuid) {
  return {
    discord_id: discordId,
    puuid,
    name: `${discordId}-name`,
    mmr: 1000,
    win: 0,
    lose: 0,
    penta: 0,
    quadra: 0,
    champions: "",
    lanes: "",
    friends: "",
    t_kill: 0,
    t_death: 0,
    t_assist: 0,
    t_kill_rate: 0,
    linked_puuid: puuid,
  };
}

function singleMatchTeams({ withResolvablePuuids }) {
  const bluePuuid = withResolvablePuuids ? "p1" : "x1";
  const purplePuuid = withResolvablePuuids ? "p2" : "x2";
  return {
    blue_team: JSON.stringify({
      side: 100,
      totalKill: 10,
      result: 1,
      players: [
        {
          puuid: bluePuuid,
          playerName: "A",
          championName: "Ahri",
          lane: "MID",
          kda: { kills: 5, deaths: 2, assist: 3 },
          result: 1,
          pentaKill: 0,
          quadraKill: 0,
          team: 100,
          win: true,
        },
      ],
    }),
    purple_team: JSON.stringify({
      side: 200,
      totalKill: 8,
      result: 0,
      players: [
        {
          puuid: purplePuuid,
          playerName: "B",
          championName: "Zed",
          lane: "MID",
          kda: { kills: 2, deaths: 5, assist: 1 },
          result: 0,
          pentaKill: 0,
          quadraKill: 0,
          team: 200,
          win: false,
        },
      ],
    }),
  };
}

test("deleteMatchById rejects an invalid match id before touching the database", async () => {
  let poolRequested = false;
  const { deleteMatchById } = loadQueryModule({
    getGuildPromisePool: async () => {
      poolRequested = true;
      return { async query() { return [[]]; } };
    },
  });

  const result = await deleteMatchById("guild-1", 0);

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_INPUT");
  assert.equal(poolRequested, false);
});

test("deleteMatchById returns MATCH_NOT_FOUND without deleting when the match is missing", async () => {
  const calls = [];
  const { deleteMatchById } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql) {
        calls.push(sql);
        if (isMatchLookup(sql)) return [[]];
        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteMatchById("guild-1", 999);

  assert.equal(result.success, false);
  assert.equal(result.code, "MATCH_NOT_FOUND");
  assert.equal(calls.some(isDelete), false);
});

test("deleteMatchById deletes the match, resets stats, and compacts match numbering", async () => {
  const calls = [];
  const { deleteMatchById } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql, params) {
        calls.push({ sql, params });
        if (isMatchLookup(sql)) return [[{ id: 5, game_id: "KR-5" }]];
        if (isDelete(sql)) return [{ affectedRows: 1 }];
        if (isReset(sql)) return [{ affectedRows: 14 }];
        if (isRemainingSelect(sql)) return [[]];
        if (isAutoIncrementSelect(sql)) return [[{ next_id: 1 }]];
        if (isAutoIncrementAlter(sql)) return [{}];
        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteMatchById("guild-1", 5);

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    deletedMatchId: 5,
    deletedGameId: "KR-5",
    remainingMatchCount: 0,
  });
  assert.deepEqual(calls.find((c) => isDelete(c.sql)).params, [5]);
  assert.equal(calls.some((c) => isReset(c.sql)), true);
  // After the delete, AUTO_INCREMENT is reset so the next match reuses id 1.
  assert.equal(calls.some((c) => isAutoIncrementAlter(c.sql)), true);
});

test("deleteMatchById replays remaining matches and recomputes resolvable players' stats", async () => {
  const perPlayerUpdates = [];
  const teams = singleMatchTeams({ withResolvablePuuids: true });
  const { deleteMatchById } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql, params) {
        if (isMatchLookup(sql)) return [[{ id: 5, game_id: "KR-5" }]];
        if (isDelete(sql)) return [{ affectedRows: 1 }];
        if (isReset(sql)) return [{ affectedRows: 14 }];
        if (isRemainingSelect(sql)) {
          return [[{ id: 6, purple_team: teams.purple_team, blue_team: teams.blue_team }]];
        }
        if (isPuuidResolve(sql)) {
          return [[userRow("d1", "p1"), userRow("d2", "p2")]];
        }
        if (isPerPlayerUpdate(sql)) {
          perPlayerUpdates.push(params);
          return [{ affectedRows: 1 }];
        }
        if (isAutoIncrementSelect(sql)) return [[{ next_id: 7 }]];
        if (isAutoIncrementAlter(sql)) return [{}];
        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteMatchById("guild-1", 5);

  assert.equal(result.success, true);
  assert.equal(result.data.remainingMatchCount, 1);
  // Both resolvable players had their stats rewritten during the replay.
  assert.equal(perPlayerUpdates.length, 2);
  const updatedDiscordIds = perPlayerUpdates.map((p) => p[p.length - 1]).sort();
  assert.deepEqual(updatedDiscordIds, ["d1", "d2"]);
});

test("deleteMatchById skips replayed matches whose participants are no longer registered", async () => {
  const perPlayerUpdates = [];
  const teams = singleMatchTeams({ withResolvablePuuids: false });
  const { deleteMatchById } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql, params) {
        if (isMatchLookup(sql)) return [[{ id: 5, game_id: "KR-5" }]];
        if (isDelete(sql)) return [{ affectedRows: 1 }];
        if (isReset(sql)) return [{ affectedRows: 14 }];
        if (isRemainingSelect(sql)) {
          return [[{ id: 6, purple_team: teams.purple_team, blue_team: teams.blue_team }]];
        }
        if (isPuuidResolve(sql)) return [[]];
        if (isNameResolve(sql)) return [[]];
        if (isPerPlayerUpdate(sql)) {
          perPlayerUpdates.push(params);
          return [{ affectedRows: 1 }];
        }
        if (isAutoIncrementSelect(sql)) return [[{ next_id: 7 }]];
        if (isAutoIncrementAlter(sql)) return [{}];
        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteMatchById("guild-1", 5);

  assert.equal(result.success, true);
  assert.equal(result.data.remainingMatchCount, 1);
  // No registered participants resolved, so no user rows were updated.
  assert.equal(perPlayerUpdates.length, 0);
});
