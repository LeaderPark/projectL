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

function swapModule(modulePath, exports) {
  const originalModule = require.cache[modulePath];
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
  };

  return () => {
    if (originalModule) {
      require.cache[modulePath] = originalModule;
    } else {
      delete require.cache[modulePath];
    }
  };
}

function loadCommand(commandRelativePath, queryExports) {
  primeRuntimeEnv();

  const commandPath = require.resolve(commandRelativePath);
  const queryPath = require.resolve("../scripts/Utils/Query");

  delete require.cache[commandPath];
  const restoreQuery = swapModule(queryPath, queryExports);
  const command = require(commandPath);
  restoreQuery();

  return command;
}

test("ranking command replies with a public ranking link", async () => {
  const command = loadCommand("../commands/components/rankBoard", {
    getRankData: async () => ({
      success: true,
      data: [{ discord_id: "player-1", name: "main#KR1" }],
    }),
  });

  const replies = [];
  await command.execute({
    guildId: "guild-123",
    async deferReply(payload) {
      replies.push(payload);
    },
    async editReply(payload) {
      replies.push(payload);
    },
  });

  const finalReply = replies.at(-1);
  assert.equal(
    finalReply,
    "공개 랭킹은 아래 링크에서 확인해 주세요.\nhttps://lol.leaderpark.net/guild-123/ranking"
  );
});

test("search command replies with the selected player's public profile link", async () => {
  const command = loadCommand("../commands/components/search", {
    getUserData: async () => ({
      success: true,
      data: [
        {
          name: "main#KR1",
          win: 10,
          lose: 5,
          t_kill: 50,
          t_death: 20,
          t_assist: 40,
          t_kill_rate: 200,
          lanes: JSON.stringify({
            TOP: { win: 5, lose: 1 },
            MID: { win: 4, lose: 3 },
            BOT: { win: 1, lose: 1 },
            SUPPORT: { win: 0, lose: 0 },
          }),
          friends: JSON.stringify({
            duo1: { win: 5, lose: 1 },
            duo2: { win: 1, lose: 4 },
          }),
          champions: JSON.stringify({
            Ahri: { win: 5, lose: 1, kills: 20, deaths: 10, assist: 15 },
            Jinx: { win: 3, lose: 2, kills: 15, deaths: 8, assist: 12 },
            Ornn: { win: 2, lose: 2, kills: 8, deaths: 10, assist: 20 },
          }),
          penta: 1,
          quadra: 2,
        },
      ],
    }),
  });

  const replies = [];
  await command.execute({
    user: { id: "requester-1" },
    guildId: "guild-123",
    guild: {
      members: {
        async fetch(id) {
          assert.equal(id, "requester-1");
          return { id, bot: false };
        },
      },
    },
    options: {
      getUser(name) {
        assert.equal(name, "검색할소환사");
        return null;
      },
    },
    async reply(payload) {
      replies.push(payload);
    },
  });

  assert.equal(
    replies.at(-1),
    "플레이어 정보는 아래 링크에서 확인해 주세요.\nhttps://lol.leaderpark.net/guild-123/players/requester-1"
  );
});

test("match history command replies with the selected player's public profile link", async () => {
  const command = loadCommand("../commands/components/matchHistory", {
    getLatestMatched: async () => ({
      success: true,
      data: [
        {
          id: 1,
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
    }),
  });

  const replies = [];
  await command.execute({
    user: { id: "requester-1" },
    guildId: "guild-123",
    guild: {
      members: {
        async fetch(id) {
          assert.equal(id, "requester-1");
          return { id, bot: false };
        },
      },
    },
    options: {
      getUser(name) {
        assert.equal(name, "검색할소환사");
        return null;
      },
    },
    async deferReply(payload) {
      replies.push(payload);
    },
    async editReply(payload) {
      replies.push(payload);
    },
  });

  assert.equal(
    replies.at(-1),
    "최근 전적은 아래 링크에서 확인해 주세요.\nhttps://lol.leaderpark.net/guild-123/players/requester-1"
  );
});

test("public site link helper ignores the placeholder callback origin", () => {
  const helperPath = require.resolve("../scripts/Utils/PublicSiteLinks");
  delete require.cache[helperPath];
  const { resolvePublicSiteBaseUrl } = require(helperPath);

  assert.equal(
    resolvePublicSiteBaseUrl({
      riot: {
        tournamentCallbackUrl: "https://example.com/projectl-tournament",
      },
    }),
    null
  );
});
