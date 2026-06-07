const test = require("node:test");
const assert = require("node:assert/strict");
const { PermissionFlagsBits } = require("discord.js");

function primeRuntimeEnv() {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";
}

function loadDeleteMatchCommand(overrides = {}) {
  primeRuntimeEnv();

  const commandPath = require.resolve("../commands/utility/deleteMatch");
  const queryPath = require.resolve("../scripts/Utils/Query");
  const originalQueryModule = require.cache[queryPath];

  delete require.cache[commandPath];
  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: {
      deleteMatchById: async () => ({ success: true, data: {} }),
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

function buildInteraction({ getInteger, isAdmin }) {
  const replies = [];
  return {
    replies,
    interaction: {
      guildId: "guild-1",
      memberPermissions: { has: () => isAdmin },
      options: { getInteger },
      async reply(payload) {
        replies.push(payload);
      },
      async deferReply(payload) {
        replies.push(payload);
      },
      async editReply(payload) {
        replies.push(payload);
      },
    },
  };
}

test("delete match command is admin-gated and exposes a required integer match id option", () => {
  const command = loadDeleteMatchCommand();
  const json = command.data.toJSON();

  assert.equal(json.name, "매치삭제");
  assert.equal(
    json.default_member_permissions,
    String(PermissionFlagsBits.ManageGuild)
  );
  assert.equal(json.options.length, 1);
  assert.equal(json.options[0].name, "매치아이디");
  assert.equal(json.options[0].required, true);
  // ApplicationCommandOptionType.Integer = 4
  assert.equal(json.options[0].type, 4);
  assert.equal(json.options[0].min_value, 1);
});

test("a non-admin cannot run the match delete command", async () => {
  let deleteCalled = false;
  const command = loadDeleteMatchCommand({
    query: {
      async deleteMatchById() {
        deleteCalled = true;
        return { success: true, data: {} };
      },
    },
  });

  const { replies, interaction } = buildInteraction({
    getInteger: () => 5,
    isAdmin: false,
  });
  await command.execute(interaction);

  assert.equal(deleteCalled, false);
  assert.deepEqual(replies, [
    { content: "이 명령어는 서버 관리자만 사용할 수 있어요.", ephemeral: true },
  ]);
});

test("an admin deletes the requested match and gets a recompute summary", async () => {
  const deleteCalls = [];
  const command = loadDeleteMatchCommand({
    query: {
      async deleteMatchById(guildId, matchId) {
        deleteCalls.push({ guildId, matchId });
        return {
          success: true,
          data: {
            deletedMatchId: 5,
            deletedGameId: "KR-5",
            remainingMatchCount: 4,
          },
        };
      },
    },
  });

  const { replies, interaction } = buildInteraction({
    getInteger: (name) => {
      assert.equal(name, "매치아이디");
      return 5;
    },
    isAdmin: true,
  });
  await command.execute(interaction);

  assert.deepEqual(deleteCalls, [{ guildId: "guild-1", matchId: 5 }]);
  assert.deepEqual(replies[0], { ephemeral: true });
  assert.match(replies[1], /매치를 삭제했습니다: KR-5 \(ID 5\)/);
  assert.match(replies[1], /남은 경기 수: 4개/);
});

test("the match delete command surfaces the failure message", async () => {
  const command = loadDeleteMatchCommand({
    query: {
      async deleteMatchById() {
        return {
          success: false,
          code: "MATCH_NOT_FOUND",
          msg: "해당 매치를 찾을 수 없습니다.",
        };
      },
    },
  });

  const { replies, interaction } = buildInteraction({
    getInteger: () => 999,
    isAdmin: true,
  });
  await command.execute(interaction);

  assert.deepEqual(replies, [
    { ephemeral: true },
    "해당 매치를 찾을 수 없습니다.",
  ]);
});
