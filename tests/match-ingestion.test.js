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
    playedAtKst: "2024-04-09 21:15:00",
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
          performanceScore: 20,
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
          performanceScore: -10,
          team: 100,
          kda: { kills: 1, deaths: 7, assist: 9 },
        },
      ],
    },
  };
}

test("persistMatchResult overwrites duplicate match data without updating user stats", async () => {
  const updatedMatches = [];
  const deletedMatchLinks = [];
  const insertedLinks = [];
  const userStatUpdates = [];
  let committed = false;
  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {},
          async query(statement, params) {
            if (/SELECT \* FROM matches/i.test(statement)) {
              return [[{ id: 77, game_id: "KR_12345" }]];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[
                {
                  discord_id: "discord-blue",
                  linked_puuid: "puuid-blue",
                },
                {
                  discord_id: "discord-purple",
                  linked_puuid: "puuid-purple",
                },
              ]];
            }

            if (/UPDATE matches SET/i.test(statement)) {
              updatedMatches.push(params);
              return [{ affectedRows: 1 }];
            }

            if (/DELETE FROM match_in_users/i.test(statement)) {
              deletedMatchLinks.push(params);
              return [{ affectedRows: 2 }];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              insertedLinks.push(params);
              return [{ affectedRows: 2 }];
            }

            if (/UPDATE user SET mmr/i.test(statement)) {
              userStatUpdates.push(params);
              return [{ affectedRows: 1 }];
            }

            throw new Error(`Unexpected SQL: ${statement}`);
          },
          async commit() {
            committed = true;
          },
          async rollback() {},
          release() {},
        };
      },
    }),
  });
  const match = buildSampleMatch();
  match.gameLength = 1900000;
  match.playedAtKst = "2024-04-10 22:30:00";
  match.blueTeam.totalKill = 12;

  const result = await persistMatchResult("guild-1", match, "KR_12345");

  assert.equal(result.success, true);
  assert.equal(result.overwritten, true);
  assert.deepEqual(updatedMatches, [
    [
      1900000,
      "2024-04-10 22:30:00",
      JSON.stringify(match.purpleTeam),
      JSON.stringify(match.blueTeam),
      77,
    ],
  ]);
  assert.deepEqual(deletedMatchLinks, [[77]]);
  assert.deepEqual(insertedLinks, [[77, "discord-blue", 77, "discord-purple"]]);
  assert.deepEqual(userStatUpdates, []);
  assert.equal(committed, true);
});

test("persistMatchResult relinks duplicate match rows without updating user stats", async () => {
  const updatedMatchIds = [];
  const deletedMatchLinks = [];
  const linkedParams = [];
  const updatedUsers = [];
  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {},
          async query(statement, params) {
            if (/SELECT \* FROM matches/i.test(statement)) {
              return [[{ id: 77, game_id: "KR_12345" }]];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[
                {
                  discord_id: "discord-blue",
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

            if (/AS linked_name/i.test(statement)) {
              return [[]];
            }

            if (/UPDATE matches SET/i.test(statement)) {
              updatedMatchIds.push(params[4]);
              return [{ affectedRows: 1 }];
            }

            if (/DELETE FROM match_in_users/i.test(statement)) {
              deletedMatchLinks.push(params);
              return [{ affectedRows: 0 }];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              linkedParams.push(params);
              return [{ affectedRows: 1 }];
            }

            if (/UPDATE user SET mmr/i.test(statement)) {
              updatedUsers.push(params[12]);
              return [{ affectedRows: 1 }];
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

  const result = await persistMatchResult("guild-1", buildSampleMatch(), "KR_12345");

  assert.equal(result.success, true);
  assert.equal(result.overwritten, true);
  assert.deepEqual(updatedMatchIds, [77]);
  assert.deepEqual(deletedMatchLinks, [[77]]);
  assert.deepEqual(linkedParams, [[77, "discord-blue"]]);
  assert.deepEqual(updatedUsers, []);
  assert.deepEqual(result.user, ["Purple#KR1"]);
});

test("persistMatchResult rolls back when user stat updates fail after match insert", async () => {
  const insertedRows = [];
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
              insertedRows.push(params);
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

            if (/AS linked_name/i.test(statement)) {
              return [[]];
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
  assert.deepEqual(insertedRows[0], [
    "KR_12346",
    1800000,
    "2024-04-09 21:15:00",
    JSON.stringify(buildSampleMatch().purpleTeam),
    JSON.stringify(buildSampleMatch().blueTeam),
  ]);
  assert.equal(rolledBack, true);
  assert.equal(committed, false);
});

test("persistMatchResult prefers the transformed canonical match id over a raw callback id", async () => {
  const insertedGameIds = [];
  const insertedPlayedAtKst = [];
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
              insertedPlayedAtKst.push(params[2]);
              return [{ insertId: 124 }];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[
                {
                  discord_id: "discord-blue",
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

            if (/AS linked_name/i.test(statement)) {
              return [[]];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              return [{ affectedRows: 1 }];
            }

            if (/UPDATE user SET mmr/i.test(statement)) {
              return [{ affectedRows: 1 }];
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
  assert.deepEqual(insertedPlayedAtKst, ["2024-04-09 21:15:00"]);
});

test("persistMatchResult rejects uploads that cannot be linked to any registered player", async () => {
  const calls = [];
  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {
            calls.push("begin");
          },
          async query(statement) {
            calls.push(statement);

            if (/SELECT \* FROM matches/i.test(statement)) {
              return [[]];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[]];
            }

            if (/AS linked_name/i.test(statement)) {
              return [[]];
            }

            if (/INSERT INTO matches/i.test(statement)) {
              throw new Error("orphan match should not be inserted");
            }

            throw new Error(`Unexpected SQL: ${statement}`);
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

  const result = await persistMatchResult("guild-1", buildSampleMatch(), "KR_12349");

  assert.equal(result.success, false);
  assert.equal(result.code, "NO_REGISTERED_PARTICIPANTS");
  assert.match(result.msg, /등록된 참가자를 찾을 수 없어/);
  assert.equal(calls.includes("commit"), false);
  assert.equal(calls.includes("rollback"), true);
});

test("persistMatchResult can link replay participants by registered Riot display name", async () => {
  const insertedLinks = [];
  const updatedDiscordIds = [];
  const match = buildSampleMatch();
  match.blueTeam.players[0].puuid = "replay-only-blue-id";
  match.blueTeam.players[0].playerName = "Blue#KR1";

  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {},
          async query(statement, params) {
            if (/SELECT \* FROM matches/i.test(statement)) {
              return [[]];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[]];
            }

            if (/CONCAT\(ra\.riot_game_name, '#', ra\.riot_tag_line\) AS linked_name/i.test(statement)) {
              assert.deepEqual(params, ["blue#kr1", "purple#kr1"]);
              return [[
                {
                  discord_id: "discord-blue",
                  name: "Blue#KR1",
                  linked_name: "Blue#KR1",
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

            if (/INSERT INTO matches/i.test(statement)) {
              return [{ insertId: 126 }];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              insertedLinks.push(params);
              return [{ affectedRows: 1 }];
            }

            if (/UPDATE user SET mmr/i.test(statement)) {
              updatedDiscordIds.push(params[12]);
              return [{ affectedRows: 1 }];
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

  const result = await persistMatchResult("guild-1", match, "KR_12350");

  assert.equal(result.success, true);
  assert.deepEqual(insertedLinks, [[126, "discord-blue"]]);
  assert.deepEqual(updatedDiscordIds, ["discord-blue"]);
  assert.deepEqual(result.user, ["Purple#KR1"]);
});

test("persistMatchResult updates rating from match result expectations instead of replay stat deltas", async () => {
  const appliedRatings = new Map();
  const match = buildSampleMatch();
  match.blueTeam.players[0].performanceScore = -99;
  match.purpleTeam.players[0].performanceScore = 99;

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
              return [{ insertId: 125 }];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              return [{ affectedRows: 2 }];
            }

            if (/SELECT u\.\*, u\.puuid AS linked_puuid/i.test(statement)) {
              return [[
                {
                  discord_id: "discord-blue",
                  linked_puuid: "puuid-blue",
                  mmr: 1400,
                  win: 20,
                  lose: 20,
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
                {
                  discord_id: "discord-purple",
                  linked_puuid: "puuid-purple",
                  mmr: 1000,
                  win: 20,
                  lose: 20,
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

            if (/UPDATE user SET mmr/i.test(statement)) {
              appliedRatings.set(params[12], params[0]);
              return [{ affectedRows: 1 }];
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

  const result = await persistMatchResult("guild-1", match, "KR_12348");

  assert.equal(result.success, true);
  assert.equal(appliedRatings.get("discord-blue"), 1402);
  assert.equal(appliedRatings.get("discord-purple"), 998);
});
