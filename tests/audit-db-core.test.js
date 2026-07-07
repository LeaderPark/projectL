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

function loadFreshDbModule() {
  primeRuntimeEnv();
  delete require.cache[require.resolve("../scripts/Utils/DB")];
  return require("../scripts/Utils/DB");
}

function buildSamplePlayer(overrides = {}) {
  return {
    puuid: "puuid-1",
    playerName: "Player1",
    championName: "Ahri",
    lane: "MID",
    team: "blue",
    result: true,
    pentaKill: 0,
    quadraKill: 0,
    performanceScore: 0,
    kda: { kills: 1, deaths: 1, assist: 1 },
    ...overrides,
  };
}

function buildSampleMatch() {
  return {
    matchId: "KR_1",
    gameLength: 1500,
    playedAtKst: null,
    blueTeam: {
      side: "blue",
      totalKill: 5,
      result: 1,
      players: [
        buildSamplePlayer({
          puuid: "puuid-blue",
          playerName: "Blue1",
          team: "blue",
          result: true,
        }),
      ],
    },
    purpleTeam: {
      side: "purple",
      totalKill: 3,
      result: 0,
      players: [
        buildSamplePlayer({
          puuid: "puuid-purple",
          playerName: "Purple1",
          team: "purple",
          result: false,
        }),
      ],
    },
  };
}

function buildUserRow(discordId, puuid, overrides = {}) {
  return {
    discord_id: discordId,
    puuid,
    linked_puuid: puuid,
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
    ...overrides,
  };
}

// D1: the accumulated-stats read/write path must lock the rows it is about to
// overwrite (FOR UPDATE) so two concurrent match saves can't both read the same
// snapshot and have the last writer silently clobber the other's contribution.
test("persistMatchResult locks the user rows it updates with a FOR UPDATE fetch", async () => {
  const queries = [];
  const updateParams = [];
  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {},
          async query(statement, params) {
            queries.push(statement);

            if (/SELECT \* FROM matches WHERE game_id/i.test(statement)) {
              return [[]];
            }

            if (/FROM user u[\s\S]*JOIN riot_accounts/i.test(statement)) {
              return [[
                buildUserRow("discord-blue", "puuid-blue"),
                buildUserRow("discord-purple", "puuid-purple"),
              ]];
            }

            // Base-table re-fetch used to lock the rows updateUserDataWithExecutor
            // is about to overwrite (see lockUserRowsByDiscordIdsWithExecutor) —
            // a single, non-UNION SELECT filtered by discord_id, so FOR UPDATE
            // unambiguously targets base `user` rows instead of a
            // UNION/derived-table result set.
            if (/WHERE u\.discord_id IN/i.test(statement)) {
              return [[
                buildUserRow("discord-blue", "puuid-blue"),
                buildUserRow("discord-purple", "puuid-purple"),
              ]];
            }

            if (/INSERT INTO matches/i.test(statement)) {
              return [{ insertId: 501 }];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              return [{ affectedRows: 2 }];
            }

            if (/UPDATE user SET mmr/i.test(statement)) {
              updateParams.push(params);
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

  const result = await persistMatchResult("guild-1", buildSampleMatch(), "KR_1");

  assert.equal(result.success, true);
  assert.equal(updateParams.length, 2);
  const lockingQueries = queries.filter((sql) => /FOR UPDATE/i.test(sql));
  assert.ok(
    lockingQueries.length >= 1,
    "expected updateUserDataWithExecutor's user fetch to use FOR UPDATE"
  );
  const lockingQueriesAreUnambiguous = lockingQueries.every(
    (sql) => !/UNION/i.test(sql) && /WHERE u\.discord_id IN/i.test(sql)
  );
  assert.ok(
    lockingQueriesAreUnambiguous,
    "expected the FOR UPDATE lock to target a plain base-table SELECT, not a UNION/derived-table query"
  );
});

// D2: registerRiotAccount must run its dependent writes on a single acquired
// connection inside a real transaction (like setPrimaryRiotAccount/deleteRiotAccount
// already do), not as unrelated statements directly on the shared pool.
test("registerRiotAccount runs its writes on an acquired connection with begin/commit/release", async () => {
  const lifecycle = [];
  const { registerRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {
            lifecycle.push("begin");
          },
          async query(statement) {
            if (/FROM riot_accounts/i.test(statement)) {
              return [[]];
            }

            if (/SELECT \* FROM user/i.test(statement)) {
              return [[]];
            }

            if (/INSERT INTO user/i.test(statement)) {
              return [{ affectedRows: 1 }];
            }

            if (/INSERT INTO riot_accounts/i.test(statement)) {
              return [{ affectedRows: 1, insertId: 1 }];
            }

            throw new Error(`Unexpected SQL: ${statement}`);
          },
          async commit() {
            lifecycle.push("commit");
          },
          async rollback() {
            lifecycle.push("rollback");
          },
          release() {
            lifecycle.push("release");
          },
        };
      },
    }),
  });

  const result = await registerRiotAccount("guild-1", "discord-1", {
    riotGameName: "eggcat",
    riotTagLine: "KR1",
    puuid: "puuid-1",
    summonerId: "summoner-1",
  });

  assert.equal(result.success, true);
  assert.deepEqual(lifecycle, ["begin", "commit", "release"]);
});

test("replaceActiveTournamentSession runs its writes on an acquired connection with begin/commit/release", async () => {
  const lifecycle = [];
  const { replaceActiveTournamentSession } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {
            lifecycle.push("begin");
          },
          async query(statement) {
            if (/UPDATE active_tournament_sessions/i.test(statement)) {
              return [{ affectedRows: 0 }];
            }

            return [{ insertId: 42 }];
          },
          async commit() {
            lifecycle.push("commit");
          },
          async rollback() {
            lifecycle.push("rollback");
          },
          release() {
            lifecycle.push("release");
          },
        };
      },
    }),
  });

  const result = await replaceActiveTournamentSession("guild-1", {
    tournamentCode: "KR-CODE-1",
    sourceChannelId: "voice-1",
    team1ChannelId: "blue-1",
    team2ChannelId: "purple-1",
  });

  assert.equal(result.success, true);
  assert.deepEqual(lifecycle, ["begin", "commit", "release"]);
});

// D3: a single malformed champions/lanes/friends value must degrade to {}
// for that user instead of throwing and aborting the whole save/recompute.
test("persistMatchResult tolerates a malformed stored champions value without throwing", async () => {
  const updateParams = [];
  const { persistMatchResult } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async getConnection() {
        return {
          async beginTransaction() {},
          async query(statement, params) {
            if (/SELECT \* FROM matches WHERE game_id/i.test(statement)) {
              return [[]];
            }

            if (/FROM user u[\s\S]*JOIN riot_accounts/i.test(statement)) {
              return [[
                buildUserRow("discord-blue", "puuid-blue", {
                  champions: "{not-valid-json",
                }),
                buildUserRow("discord-purple", "puuid-purple"),
              ]];
            }

            // Base-table re-fetch used to lock the rows updateUserDataWithExecutor
            // is about to overwrite (see lockUserRowsByDiscordIdsWithExecutor).
            if (/WHERE u\.discord_id IN/i.test(statement)) {
              return [[
                buildUserRow("discord-blue", "puuid-blue", {
                  champions: "{not-valid-json",
                }),
                buildUserRow("discord-purple", "puuid-purple"),
              ]];
            }

            if (/INSERT INTO matches/i.test(statement)) {
              return [{ insertId: 501 }];
            }

            if (/INSERT INTO match_in_users/i.test(statement)) {
              return [{ affectedRows: 2 }];
            }

            if (/UPDATE user SET mmr/i.test(statement)) {
              updateParams.push(params);
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

  const result = await persistMatchResult("guild-1", buildSampleMatch(), "KR_1");

  assert.equal(result.success, true);
  const blueUpdate = updateParams.find(
    (params) => params[params.length - 1] === "discord-blue"
  );
  assert.ok(blueUpdate, "expected an UPDATE for discord-blue despite malformed JSON");
  const champions = JSON.parse(blueUpdate[5]);
  assert.deepEqual(Object.keys(champions), ["Ahri"]);
});

// D7: guild_settings should be memoized for a short TTL, and settings-writing
// paths must invalidate the cache so changes take effect promptly.
test("getGuildSettings memoizes within TTL and updateGuildUnityVoiceChannel invalidates it", async () => {
  const db = loadFreshDbModule();

  let selectCount = 0;
  db.adminPromisePool.query = async () => [[]];
  db.controlPromisePool.query = async (statement, params) => {
    if (/SHOW COLUMNS/i.test(statement)) {
      return [[{ Field: "unity_voice_channel_id", Null: "YES", Default: null }]];
    }

    if (/CREATE TABLE/i.test(statement)) {
      return [[]];
    }

    if (/SELECT guild_id, guild_name, database_name/i.test(statement)) {
      selectCount += 1;
      return [[
        {
          guild_id: params[0],
          guild_name: "Test Guild",
          database_name: "bot_guild_1",
          unity_voice_channel_id: null,
          created_at: null,
          updated_at: null,
        },
      ]];
    }

    if (/SELECT guild_id FROM guild_settings/i.test(statement)) {
      return [[{ guild_id: params[0] }]];
    }

    if (/UPDATE guild_settings/i.test(statement)) {
      return [{ affectedRows: 1 }];
    }

    return [[]];
  };

  const first = await db.getGuildSettings("guild-1");
  const second = await db.getGuildSettings("guild-1");

  assert.equal(selectCount, 1, "second call within TTL should not re-query");
  assert.deepEqual(first, second);

  await db.updateGuildUnityVoiceChannel("guild-1", "channel-99");
  const afterInvalidate = await db.getGuildSettings("guild-1");

  assert.equal(selectCount, 2, "cache should be invalidated after a settings write");
  assert.ok(afterInvalidate);
});

// D5: a permanently-failing COMPLETED session must eventually drop out of the
// pending set instead of hammering the Riot Match API on every poll forever.
test("listPendingTournamentSessions bounds completed-result ingestion by result_attempts", async () => {
  const calls = [];
  const { listPendingTournamentSessions, MAX_RESULT_ATTEMPTS } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        calls.push({ statement, params });
        return [[]];
      },
    }),
  });

  await listPendingTournamentSessions("guild-1");

  assert.equal(calls.length, 1);
  assert.match(calls[0].statement, /result_attempts < \?/);
  assert.match(
    calls[0].statement,
    /status IN \('LOBBY', 'CHAMP_SELECT_STARTED', 'MOVE_FAILED', 'COMPLETED_PENDING_GATHER', 'GATHER_FAILED', 'COMPLETED'\)/
  );
  assert.match(calls[0].statement, /result_status IN \('PENDING', 'FAILED'\)/);
  assert.deepEqual(calls[0].params, [MAX_RESULT_ATTEMPTS]);
});
