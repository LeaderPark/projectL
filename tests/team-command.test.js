const test = require("node:test");
const assert = require("node:assert/strict");

test("team command still exposes the balance mode option", () => {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";

  const command = require("../commands/team/autoMatchTeams");
  const json = command.data.toJSON();

  assert.equal(json.name, "내전");
  assert.equal(json.options[0].name, "옵션");
  assert.deepEqual(
    json.options[0].choices.map((choice) => choice.value),
    ["MMR", "RANDOM"]
  );
});
