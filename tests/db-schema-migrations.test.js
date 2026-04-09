const test = require("node:test");
const assert = require("node:assert/strict");

function loadDbModule() {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";

  delete require.cache[require.resolve("../scripts/Utils/DB")];
  return require("../scripts/Utils/DB");
}

test("ensureColumns applies ALTER statements for missing or mismatched columns", async () => {
  const { ensureColumns } = loadDbModule();
  const seenChecks = [];
  const executedStatements = [];
  const promisePool = {
    async query(statement, params = []) {
      if (statement.startsWith("SHOW COLUMNS")) {
        seenChecks.push({ statement, params });
        if (params[0] === "existing_column") {
          return [[{ Field: "existing_column", Null: "YES", Default: null }]];
        }

        if (params[0] === "champions") {
          return [[{ Field: "champions", Null: "NO", Default: null }]];
        }

        return [[]];
      }

      executedStatements.push({ statement, params });
      return [[]];
    },
  };

  await ensureColumns(promisePool, [
    {
      tableName: "guild_settings",
      columnName: "existing_column",
      statement:
        "ALTER TABLE `guild_settings` ADD COLUMN `existing_column` varchar(50) DEFAULT NULL",
    },
    {
      tableName: "guild_settings",
      columnName: "unity_voice_channel_id",
      statement:
        "ALTER TABLE `guild_settings` ADD COLUMN `unity_voice_channel_id` varchar(50) DEFAULT NULL",
    },
    {
      tableName: "user",
      columnName: "champions",
      statement:
        "ALTER TABLE `user` MODIFY COLUMN `champions` longtext NOT NULL DEFAULT '{}'",
      needsUpdate(column) {
        return column.Default !== "{}";
      },
    },
  ]);

  assert.equal(seenChecks.length, 3);
  assert.deepEqual(
    seenChecks.map(({ params }) => params[0]),
    ["existing_column", "unity_voice_channel_id", "champions"]
  );
  assert.deepEqual(executedStatements, [
    {
      statement:
        "ALTER TABLE `guild_settings` ADD COLUMN `unity_voice_channel_id` varchar(50) DEFAULT NULL",
      params: [],
    },
    {
      statement:
        "ALTER TABLE `user` MODIFY COLUMN `champions` longtext NOT NULL DEFAULT '{}'",
      params: [],
    },
  ]);
});
