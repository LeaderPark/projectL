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

test("registerRiotAccount marks the first linked Riot account as primary for a newly linked Discord user", async () => {
  const userInsertCalls = [];
  const riotAccountInsertCalls = [];
  const { registerRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        if (/FROM riot_accounts/i.test(statement)) {
          return [[]];
        }

        if (/SELECT \* FROM user/i.test(statement)) {
          return [[]];
        }

        if (/INSERT INTO user/i.test(statement)) {
          userInsertCalls.push(params);
          return [{ affectedRows: 1 }];
        }

        if (/INSERT INTO riot_accounts/i.test(statement)) {
          riotAccountInsertCalls.push(params);
          return [{ affectedRows: 1 }];
        }

        throw new Error(`Unexpected SQL: ${statement}`);
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
  assert.deepEqual(userInsertCalls, [
    ["discord-1", "puuid-1", "eggcat#KR1", "{}", "{}", "{}"],
  ]);
  assert.deepEqual(riotAccountInsertCalls, [
    ["discord-1", "eggcat", "KR1", "puuid-1", "summoner-1", 1],
  ]);
  assert.deepEqual(result.data, {
    discordId: "discord-1",
    registeredAccountDisplayName: "eggcat#KR1",
    primaryAccountDisplayName: "eggcat#KR1",
    accountCount: 1,
    requiresPrimarySelection: false,
    insertedAccountIsPrimary: true,
  });
});

test("registerRiotAccount rejects missing required riot identifiers before querying the database", async () => {
  let queryCount = 0;
  const { registerRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        queryCount += 1;
        return [[]];
      },
    }),
  });

  const result = await registerRiotAccount("guild-1", "discord-1", {
    riotGameName: "eggcat",
    riotTagLine: "KR1",
    puuid: "puuid-1",
    summonerId: undefined,
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_INPUT");
  assert.match(result.msg, /소환사 ID/);
  assert.equal(queryCount, 0);
});

test("registerRiotAccount keeps the first linked Riot account as the default primary when adding another account", async () => {
  const riotAccountInsertCalls = [];
  const userNameUpdates = [];
  const { registerRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        if (/FROM riot_accounts/i.test(statement) && /WHERE puuid = \?/i.test(statement)) {
          return [[]];
        }

        if (/SELECT \* FROM user/i.test(statement)) {
          return [[{ discord_id: "discord-1", puuid: "puuid-main", name: "main#KR1" }]];
        }

        if (
          /SELECT id, riot_game_name, riot_tag_line, is_primary/i.test(statement) &&
          /FROM riot_accounts/i.test(statement) &&
          /WHERE discord_id = \?/i.test(statement)
        ) {
          return [[
            {
              id: 1,
              riot_game_name: "main",
              riot_tag_line: "KR1",
              is_primary: 1,
            },
          ]];
        }

        if (/INSERT INTO riot_accounts/i.test(statement)) {
          riotAccountInsertCalls.push(params);
          return [{ affectedRows: 1, insertId: 2 }];
        }

        if (
          /SELECT riot_game_name, riot_tag_line/i.test(statement) &&
          /FROM riot_accounts/i.test(statement) &&
          /ORDER BY is_primary DESC/i.test(statement)
        ) {
          return [[
            {
              riot_game_name: "main",
              riot_tag_line: "KR1",
            },
          ]];
        }

        if (/UPDATE user SET name = \?/i.test(statement)) {
          userNameUpdates.push(params);
          return [{ affectedRows: 1 }];
        }

        throw new Error(`Unexpected SQL: ${statement}`);
      },
    }),
  });

  const result = await registerRiotAccount("guild-1", "discord-1", {
    riotGameName: "smurf",
    riotTagLine: "JP1",
    puuid: "puuid-smurf",
    summonerId: "summoner-smurf",
  });

  assert.equal(result.success, true);
  assert.deepEqual(riotAccountInsertCalls, [
    ["discord-1", "smurf", "JP1", "puuid-smurf", "summoner-smurf", 0],
  ]);
  assert.deepEqual(userNameUpdates, [["main#KR1", "discord-1"]]);
  assert.deepEqual(result.data, {
    discordId: "discord-1",
    registeredAccountDisplayName: "smurf#JP1",
    primaryAccountDisplayName: "main#KR1",
    accountCount: 2,
    requiresPrimarySelection: true,
    insertedAccountIsPrimary: false,
  });
});

test("setPrimaryRiotAccount updates the representative Riot name for the linked Discord user", async () => {
  const updates = [];
  const { setPrimaryRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(statement, params) {
        if (
          /SELECT id, riot_game_name, riot_tag_line/i.test(statement) &&
          /FROM riot_accounts/i.test(statement) &&
          /WHERE discord_id = \?/i.test(statement) &&
          /riot_game_name = \?/i.test(statement)
        ) {
          return [[
            {
              id: 9,
              riot_game_name: "smurf",
              riot_tag_line: "JP1",
            },
          ]];
        }

        if (/UPDATE riot_accounts SET is_primary = 0 WHERE discord_id = \?/i.test(statement)) {
          updates.push({ statement, params });
          return [{ affectedRows: 2 }];
        }

        if (/UPDATE riot_accounts SET is_primary = 1 WHERE id = \?/i.test(statement)) {
          updates.push({ statement, params });
          return [{ affectedRows: 1 }];
        }

        if (
          /SELECT riot_game_name, riot_tag_line/i.test(statement) &&
          /FROM riot_accounts/i.test(statement) &&
          /ORDER BY is_primary DESC/i.test(statement)
        ) {
          return [[
            {
              riot_game_name: "smurf",
              riot_tag_line: "JP1",
            },
          ]];
        }

        if (/UPDATE user SET name = \?/i.test(statement)) {
          updates.push({ statement, params });
          return [{ affectedRows: 1 }];
        }

        throw new Error(`Unexpected SQL: ${statement}`);
      },
    }),
  });

  const result = await setPrimaryRiotAccount(
    "guild-1",
    "discord-1",
    "smurf",
    "JP1"
  );

  assert.equal(result.success, true);
  assert.equal(result.data.primaryAccountDisplayName, "smurf#JP1");
  assert.deepEqual(
    updates.map((entry) => entry.params),
    [["discord-1"], [9], ["smurf#JP1", "discord-1"]]
  );
});
