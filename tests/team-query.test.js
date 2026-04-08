const test = require("node:test");
const assert = require("node:assert/strict");

test("buildGetUsersDataSql returns a discord-centric user query", () => {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";

  const { buildGetUsersDataSql } = require("../scripts/Utils/Query");
  const sql = buildGetUsersDataSql(["1", "2"]);

  assert.match(sql, /SELECT discord_id, name, mmr FROM user/);
  assert.doesNotMatch(sql, /riot_accounts/);
});
