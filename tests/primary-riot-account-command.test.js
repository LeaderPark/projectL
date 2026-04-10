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

function loadPrimaryCommand(overrides = {}) {
  primeRuntimeEnv();

  const commandPath = require.resolve("../commands/riot/primaryRiotAccount");
  const queryPath = require.resolve("../scripts/Utils/Query");
  const originalQueryModule = require.cache[queryPath];

  delete require.cache[commandPath];
  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: {
      setPrimaryRiotAccount: async () => ({ success: true }),
      ...overrides.query,
    },
  };

  const command = require(commandPath);

  if (originalQueryModule) {
    require.cache[queryPath] = originalQueryModule;
  } else {
    delete require.cache[queryPath];
  }

  return command;
}

test("primary riot account command exposes riot name and tag options", () => {
  const command = loadPrimaryCommand();
  const json = command.data.toJSON();

  assert.equal(json.name, "대표아이디설정");
  assert.deepEqual(
    json.options.map((option) => option.name),
    ["소환사이름", "소환사태그"]
  );
});

test("primary riot account command updates the representative riot account for the caller", async () => {
  const updateCalls = [];
  const command = loadPrimaryCommand({
    query: {
      async setPrimaryRiotAccount(guildId, discordId, riotGameName, riotTagLine) {
        updateCalls.push({ guildId, discordId, riotGameName, riotTagLine });
        return {
          success: true,
          data: {
            primaryAccountDisplayName: "smurf#JP1",
          },
        };
      },
    },
  });

  const replies = [];
  await command.execute({
    guildId: "guild-1",
    user: {
      id: "discord-1",
    },
    options: {
      getString(name) {
        if (name === "소환사이름") {
          return "smurf";
        }

        if (name === "소환사태그") {
          return "JP1";
        }

        throw new Error(`Unexpected option: ${name}`);
      },
    },
    async deferReply(payload) {
      replies.push(payload);
    },
    async editReply(payload) {
      replies.push(payload);
    },
  });

  assert.deepEqual(updateCalls, [
    {
      guildId: "guild-1",
      discordId: "discord-1",
      riotGameName: "smurf",
      riotTagLine: "JP1",
    },
  ]);
  assert.deepEqual(replies, [
    { ephemeral: true },
    "대표 아이디를 smurf#JP1 로 설정했습니다.",
  ]);
});
