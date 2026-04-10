const test = require("node:test");
const assert = require("node:assert/strict");

function primeRuntimeEnv() {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.RIOT_TOURNAMENT_CALLBACK_URL =
    process.env.RIOT_TOURNAMENT_CALLBACK_URL || "https://lol.leaderpark.net/riot/callback";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";
}

function loadMatchHistoryCommand(overrides = {}) {
  primeRuntimeEnv();

  const commandPath = require.resolve("../commands/components/matchHistory");
  const queryPath = require.resolve("../scripts/Utils/Query");
  const originalQueryModule = require.cache[queryPath];

  delete require.cache[commandPath];
  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: {
      getLatestMatched: async () => ({ success: true, data: [] }),
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

test("match history command links to the selected player's public profile", async () => {
  const queryCalls = [];
  const command = loadMatchHistoryCommand({
    query: {
      async getLatestMatched(guildId, discordId) {
        queryCalls.push({ guildId, discordId });
        return {
          success: true,
          data: [
            {
              id: 3,
              game_length: String(25 * 60 * 1000),
              purple_team: JSON.stringify({
                result: 0,
                players: [],
              }),
              blue_team: JSON.stringify({
                result: 1,
                players: [],
              }),
            },
          ],
        };
      },
    },
  });

  const replies = [];
  await command.execute({
    user: { id: "requester-1" },
    guildId: "guild-1",
    guild: {
      members: {
        async fetch(id) {
          assert.equal(id, "requester-1");
          return { user: { id, bot: false } };
        },
      },
    },
    options: {
      getUser(name) {
        assert.equal(name, "검색할소환사");
        return { id: "target-7", bot: false };
      },
    },
    async deferReply(payload) {
      replies.push(payload);
    },
    async editReply(payload) {
      replies.push(payload);
    },
  });

  assert.deepEqual(queryCalls, [{ guildId: "guild-1", discordId: "target-7" }]);
  assert.equal(
    replies.at(-1),
    "최근 전적은 아래 링크에서 확인해 주세요.\nhttps://lol.leaderpark.net/guild-1/players/target-7"
  );
});
