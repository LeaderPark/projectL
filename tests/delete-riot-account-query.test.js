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

const isInitialLookup = (sql) =>
  /SELECT id, riot_game_name, riot_tag_line, is_primary/i.test(sql) &&
  /riot_game_name = \?/i.test(sql) &&
  /LIMIT 1/i.test(sql);

const isListLinked = (sql) =>
  /SELECT id, riot_game_name, riot_tag_line, is_primary, created_at/i.test(sql) &&
  /ORDER BY is_primary DESC/i.test(sql);

const isSyncSelect = (sql) =>
  /SELECT riot_game_name, riot_tag_line/i.test(sql) &&
  /ORDER BY is_primary DESC/i.test(sql);

test("deleteRiotAccount removes a non-primary account without changing the existing primary", async () => {
  const calls = [];
  const { deleteRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql, params) {
        calls.push({ sql, params });

        if (isInitialLookup(sql)) {
          return [[
            { id: 2, riot_game_name: "smurf", riot_tag_line: "JP1", is_primary: 0 },
          ]];
        }
        if (/DELETE FROM riot_accounts WHERE id = \?/i.test(sql)) {
          return [{ affectedRows: 1 }];
        }
        if (isListLinked(sql)) {
          return [[
            { id: 1, riot_game_name: "main", riot_tag_line: "KR1", is_primary: 1 },
          ]];
        }
        if (isSyncSelect(sql)) {
          return [[{ riot_game_name: "main", riot_tag_line: "KR1" }]];
        }
        if (/UPDATE user SET name = \?/i.test(sql)) {
          return [{ affectedRows: 1 }];
        }

        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteRiotAccount("guild-1", "discord-1", "smurf", "JP1");

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    deletedAccountDisplayName: "smurf#JP1",
    remainingCount: 1,
    primaryAccountDisplayName: "main#KR1",
  });

  // The deleted row is removed by its id.
  assert.deepEqual(
    calls.find((c) => /DELETE FROM riot_accounts/i.test(c.sql)).params,
    [2]
  );
  // No re-promotion happens because a primary already remains.
  assert.equal(
    calls.some((c) => /UPDATE riot_accounts SET is_primary/i.test(c.sql)),
    false
  );
  // The representative name is synced to the surviving primary.
  assert.deepEqual(
    calls.find((c) => /UPDATE user SET name = \?/i.test(c.sql)).params,
    ["main#KR1", "discord-1"]
  );
});

test("deleteRiotAccount promotes the next account to primary when the primary is removed", async () => {
  const calls = [];
  const { deleteRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql, params) {
        calls.push({ sql, params });

        if (isInitialLookup(sql)) {
          return [[
            { id: 1, riot_game_name: "main", riot_tag_line: "KR1", is_primary: 1 },
          ]];
        }
        if (/DELETE FROM riot_accounts WHERE id = \?/i.test(sql)) {
          return [{ affectedRows: 1 }];
        }
        if (isListLinked(sql)) {
          return [[
            { id: 2, riot_game_name: "smurf", riot_tag_line: "JP1", is_primary: 0 },
          ]];
        }
        if (isSyncSelect(sql)) {
          return [[{ riot_game_name: "smurf", riot_tag_line: "JP1" }]];
        }
        if (/UPDATE riot_accounts SET is_primary = 0 WHERE discord_id = \?/i.test(sql)) {
          return [{ affectedRows: 1 }];
        }
        if (/UPDATE riot_accounts SET is_primary = 1 WHERE id = \?/i.test(sql)) {
          return [{ affectedRows: 1 }];
        }
        if (/UPDATE user SET name = \?/i.test(sql)) {
          return [{ affectedRows: 1 }];
        }

        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteRiotAccount("guild-1", "discord-1", "main", "KR1");

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    deletedAccountDisplayName: "main#KR1",
    remainingCount: 1,
    primaryAccountDisplayName: "smurf#JP1",
  });

  // The surviving account is promoted to primary by its id.
  assert.deepEqual(
    calls.find((c) => /UPDATE riot_accounts SET is_primary = 1 WHERE id = \?/i.test(c.sql)).params,
    [2]
  );
  assert.deepEqual(
    calls.find((c) => /UPDATE user SET name = \?/i.test(c.sql)).params,
    ["smurf#JP1", "discord-1"]
  );
});

test("deleteRiotAccount reports that no accounts remain after removing the last one", async () => {
  const calls = [];
  const { deleteRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql) {
        calls.push({ sql });

        if (isInitialLookup(sql)) {
          return [[
            { id: 5, riot_game_name: "solo", riot_tag_line: "KR1", is_primary: 1 },
          ]];
        }
        if (/DELETE FROM riot_accounts WHERE id = \?/i.test(sql)) {
          return [{ affectedRows: 1 }];
        }
        if (isListLinked(sql)) {
          return [[]];
        }

        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteRiotAccount("guild-1", "discord-1", "solo", "KR1");

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    deletedAccountDisplayName: "solo#KR1",
    remainingCount: 0,
    primaryAccountDisplayName: null,
  });
  // No primary re-sync / user name update is attempted when nothing remains.
  assert.equal(
    calls.some((c) => /UPDATE user SET name/i.test(c.sql)),
    false
  );
});

test("deleteRiotAccount returns ACCOUNT_NOT_FOUND without deleting when no match exists", async () => {
  const calls = [];
  const { deleteRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql) {
        calls.push({ sql });

        if (isInitialLookup(sql)) {
          return [[]];
        }

        throw new Error(`Unexpected SQL: ${sql}`);
      },
    }),
  });

  const result = await deleteRiotAccount("guild-1", "discord-1", "ghost", "KR1");

  assert.equal(result.success, false);
  assert.equal(result.code, "ACCOUNT_NOT_FOUND");
  assert.equal(
    calls.some((c) => /DELETE FROM riot_accounts/i.test(c.sql)),
    false
  );
});

test("deleteRiotAccount rejects missing identifiers before querying the database", async () => {
  let queryCount = 0;
  const { deleteRiotAccount } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query() {
        queryCount += 1;
        return [[]];
      },
    }),
  });

  const result = await deleteRiotAccount("guild-1", "discord-1", "smurf", "");

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_INPUT");
  assert.equal(queryCount, 0);
});
