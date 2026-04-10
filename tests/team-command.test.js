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
  assert.equal(json.options[1].name, "픽방식");
  assert.equal(json.options[2].name, "특수규칙");
  assert.equal(json.options[3].name, "시리즈동작");
  assert.deepEqual(
    json.options[0].choices.map((choice) => choice.value),
    ["MMR", "RANDOM"]
  );
  assert.deepEqual(
    json.options[1].choices.map((choice) => choice.value),
    ["BLIND_PICK", "DRAFT_MODE", "ALL_RANDOM", "TOURNAMENT_DRAFT"]
  );
  assert.deepEqual(
    json.options[2].choices.map((choice) => choice.value),
    ["STANDARD", "HARD_FEARLESS"]
  );
  assert.deepEqual(
    json.options[3].choices.map((choice) => choice.value),
    ["AUTO", "NEW", "CONTINUE"]
  );
});
