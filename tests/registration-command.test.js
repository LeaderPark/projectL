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

function loadRegistrationCommand(overrides = {}) {
  primeRuntimeEnv();

  const commandPath = require.resolve("../commands/riot/registration");
  const dataReceiverPath = require.resolve("../scripts/Riot/DataReceiver");
  const queryPath = require.resolve("../scripts/Utils/Query");
  const originalDataReceiverModule = require.cache[dataReceiverPath];
  const originalQueryModule = require.cache[queryPath];

  delete require.cache[commandPath];
  require.cache[dataReceiverPath] = {
    id: dataReceiverPath,
    filename: dataReceiverPath,
    loaded: true,
    exports: {
      getSummonerData: async () => null,
      ...overrides.dataReceiver,
    },
  };
  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: {
      registerRiotAccount: async () => ({ success: true }),
      ...overrides.query,
    },
  };

  const command = require(commandPath);

  if (originalDataReceiverModule) {
    require.cache[dataReceiverPath] = originalDataReceiverModule;
  } else {
    delete require.cache[dataReceiverPath];
  }

  if (originalQueryModule) {
    require.cache[queryPath] = originalQueryModule;
  } else {
    delete require.cache[queryPath];
  }

  return command;
}

test("registration command exposes riot name, tag, and optional target user", () => {
  const command = loadRegistrationCommand();
  const json = command.data.toJSON();

  assert.equal(json.name, "등록");
  assert.deepEqual(
    json.options.map((option) => option.name),
    ["소환사이름", "소환사태그", "등록할소환사"]
  );
});

test("registration command falls back to puuid when Riot summoner id is missing", async () => {
  const registerCalls = [];
  const command = loadRegistrationCommand({
    dataReceiver: {
      async getSummonerData() {
        return {
          account: {
            gameName: "eggcat",
            tagLine: "KR1",
            puuid: "puuid-1",
          },
          summoner: {},
        };
      },
    },
    query: {
      async registerRiotAccount(guildId, discordId, account) {
        registerCalls.push({ guildId, discordId, account });
        return { success: true };
      },
    },
  });

  const replies = [];
  await command.execute({
    guildId: "guild-1",
    user: {
      id: "requester-1",
    },
    guild: {
      members: {
        async fetch(id) {
          assert.equal(id, "requester-1");
          return {
            id: "discord-1",
            bot: false,
          };
        },
      },
    },
    options: {
      getUser(name) {
        assert.equal(name, "등록할소환사");
        return null;
      },
      getString(name) {
        if (name === "소환사이름") {
          return "eggcat";
        }

        if (name === "소환사태그") {
          return "KR1";
        }

        throw new Error(`Unexpected option: ${name}`);
      },
    },
    async deferReply(message) {
      replies.push(message);
    },
    async editReply(message) {
      replies.push(message);
    },
  });

  assert.deepEqual(registerCalls, [
    {
      guildId: "guild-1",
      discordId: "discord-1",
      account: {
        riotGameName: "eggcat",
        riotTagLine: "KR1",
        puuid: "puuid-1",
        summonerId: "puuid-1",
      },
    },
  ]);
  assert.deepEqual(replies, ["searching...", "등록을 완료했습니다."]);
});
