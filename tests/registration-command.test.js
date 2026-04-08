const test = require("node:test");
const assert = require("node:assert/strict");

test("registration command exposes riot name, tag, and optional target user", () => {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";

  const command = require("../commands/riot/registration");
  const json = command.data.toJSON();

  assert.equal(json.name, "등록");
  assert.deepEqual(
    json.options.map((option) => option.name),
    ["소환사이름", "소환사태그", "등록할소환사"]
  );
});
