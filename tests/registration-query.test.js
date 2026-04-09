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

test("registerRiotAccount seeds JSON stat fields for a newly linked Discord user", async () => {
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
    ["discord-1", "eggcat", "KR1", "puuid-1", "summoner-1"],
  ]);
});
