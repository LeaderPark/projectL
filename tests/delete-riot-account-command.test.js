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

function loadDeleteCommand(overrides = {}) {
  primeRuntimeEnv();

  const commandPath = require.resolve("../commands/riot/deleteRiotAccount");
  const queryPath = require.resolve("../scripts/Utils/Query");
  const originalQueryModule = require.cache[queryPath];

  delete require.cache[commandPath];
  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: {
      deleteRiotAccount: async () => ({ success: true, data: {} }),
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

function buildInteraction({ getString }) {
  const replies = [];
  return {
    replies,
    interaction: {
      guildId: "guild-1",
      user: { id: "discord-1" },
      options: { getString },
      async deferReply(payload) {
        replies.push(payload);
      },
      async editReply(payload) {
        replies.push(payload);
      },
    },
  };
}

function getStringFor(name) {
  if (name === "소환사이름") return "smurf";
  if (name === "소환사태그") return "JP1";
  throw new Error(`Unexpected option: ${name}`);
}

test("delete riot account command exposes riot name and tag options", () => {
  const command = loadDeleteCommand();
  const json = command.data.toJSON();

  assert.equal(json.name, "아이디삭제");
  assert.deepEqual(
    json.options.map((option) => option.name),
    ["소환사이름", "소환사태그"]
  );
  assert.deepEqual(
    json.options.map((option) => option.required),
    [true, true]
  );
});

test("delete riot account command removes the caller's account and reports the new primary", async () => {
  const deleteCalls = [];
  const command = loadDeleteCommand({
    query: {
      async deleteRiotAccount(guildId, discordId, riotGameName, riotTagLine) {
        deleteCalls.push({ guildId, discordId, riotGameName, riotTagLine });
        return {
          success: true,
          data: {
            deletedAccountDisplayName: "smurf#JP1",
            remainingCount: 1,
            primaryAccountDisplayName: "main#KR1",
          },
        };
      },
    },
  });

  const { replies, interaction } = buildInteraction({ getString: getStringFor });
  await command.execute(interaction);

  assert.deepEqual(deleteCalls, [
    {
      guildId: "guild-1",
      discordId: "discord-1",
      riotGameName: "smurf",
      riotTagLine: "JP1",
    },
  ]);
  assert.deepEqual(replies, [
    { ephemeral: true },
    "등록을 삭제했습니다: smurf#JP1\n현재 대표 아이디: main#KR1\n남은 등록 아이디: 1개",
  ]);
});

test("delete riot account command notes when no accounts remain", async () => {
  const command = loadDeleteCommand({
    query: {
      async deleteRiotAccount() {
        return {
          success: true,
          data: {
            deletedAccountDisplayName: "smurf#JP1",
            remainingCount: 0,
            primaryAccountDisplayName: null,
          },
        };
      },
    },
  });

  const { replies, interaction } = buildInteraction({ getString: getStringFor });
  await command.execute(interaction);

  assert.deepEqual(replies, [
    { ephemeral: true },
    "등록을 삭제했습니다: smurf#JP1\n이제 등록된 롤 아이디가 없습니다.",
  ]);
});

test("delete riot account command surfaces the failure message when deletion fails", async () => {
  const command = loadDeleteCommand({
    query: {
      async deleteRiotAccount() {
        return {
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          msg: "등록된 롤 계정을 찾을 수 없습니다.",
        };
      },
    },
  });

  const { replies, interaction } = buildInteraction({ getString: getStringFor });
  await command.execute(interaction);

  assert.deepEqual(replies, [
    { ephemeral: true },
    "등록된 롤 계정을 찾을 수 없습니다.",
  ]);
});
