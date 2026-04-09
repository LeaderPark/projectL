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

function buildSampleMatch() {
  return {
    gameLength: 1800000,
    blueTeam: {
      side: 200,
      totalKill: 10,
      players: [
        {
          puuid: "puuid-blue",
          playerName: "Blue#KR1",
          championName: "Garen",
          lane: "TOP",
          result: 1,
          win: "Win",
          pentaKill: 0,
          quadraKill: 0,
          mmr: 20,
          team: 200,
          kda: { kills: 10, deaths: 2, assist: 5 },
        },
      ],
    },
    purpleTeam: {
      side: 100,
      totalKill: 2,
      players: [
        {
          puuid: "puuid-purple",
          playerName: "Purple#KR1",
          championName: "Leona",
          lane: "SUPPORT",
          result: 0,
          win: "Fail",
          pentaKill: 0,
          quadraKill: 0,
          mmr: -10,
          team: 100,
          kda: { kills: 1, deaths: 7, assist: 9 },
        },
      ],
    },
  };
}

test("persistMatchResult treats duplicate game ids as idempotent success", async () => {
  const calls = [];
  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {
            calls.push("begin");
          },
          async query(statement, params) {
            calls.push({ statement, params });
            return [[{ id: 77, game_id: "KR_12345" }]];
          },
          async commit() {
            calls.push("commit");
          },
          async rollback() {
            calls.push("rollback");
          },
          release() {
            calls.push("release");
          },
        };
      },
    }),
  });

  const result = await persistMatchResult("guild-1", buildSampleMatch(), "KR_12345");

  assert.equal(result.success, true);
  assert.equal(result.alreadyProcessed, true);
  assert.equal(
    calls.filter((entry) => typeof entry === "object").length,
    1
  );
  assert.deepEqual(calls.at(-1), "release");
});

test("persistMatchResult rolls back when user stat updates fail after match insert", async () => {
  let rolledBack = false;
  let committed = false;
  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {},
          async query(statement, params) {
            if (/SELECT \* FROM matches/i.test(statement)) {
              return [[]];
            }

            if (/INSERT INTO matches/i.test(statement)) {
              return [{ insertId: 123 }];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[
                {
                  discord_id: "discord-1",
                  linked_puuid: "puuid-blue",
                  mmr: 1000,
                  win: 0,
                  lose: 0,
                  penta: 0,
                  quadra: 0,
                  champions: "{}",
                  lanes: "{}",
                  friends: "{}",
                  t_kill: 0,
                  t_death: 0,
                  t_assist: 0,
                  t_kill_rate: 0,
                },
              ]];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              return [{ affectedRows: 1 }];
            }

            if (/UPDATE user SET mmr/i.test(statement)) {
              throw new Error("user update failed");
            }

            throw new Error(`Unexpected SQL: ${statement}`);
          },
          async commit() {
            committed = true;
          },
          async rollback() {
            rolledBack = true;
          },
          release() {},
        };
      },
    }),
  });

  const result = await persistMatchResult("guild-1", buildSampleMatch(), "KR_12346");

  assert.equal(result.success, false);
  assert.match(result.msg, /user update failed/);
  assert.equal(rolledBack, true);
  assert.equal(committed, false);
});

test("persistMatchResult prefers the transformed canonical match id over a raw callback id", async () => {
  const insertedGameIds = [];
  const match = buildSampleMatch();
  match.matchId = "KR_12347";

  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {},
          async query(statement, params) {
            if (/SELECT \* FROM matches/i.test(statement)) {
              return [[]];
            }

            if (/INSERT INTO matches/i.test(statement)) {
              insertedGameIds.push(params[0]);
              return [{ insertId: 124 }];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[]];
            }

            throw new Error(`Unexpected SQL: ${statement}`);
          },
          async commit() {},
          async rollback() {},
          release() {},
        };
      },
    }),
  });

  const result = await persistMatchResult("guild-1", match, "12347");

  assert.equal(result.success, true);
  assert.deepEqual(insertedGameIds, ["KR_12347"]);
});
