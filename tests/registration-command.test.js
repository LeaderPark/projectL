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

test("registration command guides multi-account users to set a representative riot account", async () => {
  const command = loadRegistrationCommand({
    dataReceiver: {
      async getSummonerData() {
        return {
          account: {
            gameName: "smurf",
            tagLine: "JP1",
            puuid: "puuid-2",
          },
          summoner: {
            id: "summoner-2",
          },
        };
      },
    },
    query: {
      async registerRiotAccount() {
        return {
          success: true,
          data: {
            registeredAccountDisplayName: "smurf#JP1",
            primaryAccountDisplayName: "main#KR1",
            accountCount: 2,
            requiresPrimarySelection: true,
            insertedAccountIsPrimary: false,
          },
        };
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
        async fetch() {
          return {
            id: "discord-1",
            bot: false,
          };
        },
      },
    },
    options: {
      getUser() {
        return null;
      },
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
    async deferReply(message) {
      replies.push(message);
    },
    async editReply(message) {
      replies.push(message);
    },
  });

  assert.equal(replies[0], "searching...");
  assert.match(replies[1], /등록을 완료했습니다/);
  assert.match(replies[1], /main#KR1/);
  assert.match(replies[1], /처음 등록한 아이디/);
  assert.match(replies[1], /\/대표아이디설정/);
});

test("an admin can register on behalf of another user", async () => {
  const registerCalls = [];
  const command = loadRegistrationCommand({
    dataReceiver: {
      async getSummonerData() {
        return {
          account: { gameName: "eggcat", tagLine: "KR1", puuid: "puuid-1" },
          summoner: { id: "summoner-1" },
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
    user: { id: "admin-1" },
    memberPermissions: { has: () => true },
    guild: {
      members: {
        async fetch() {
          throw new Error("should not fetch caller when a target user is provided");
        },
      },
    },
    options: {
      getUser(name) {
        assert.equal(name, "등록할소환사");
        return { id: "target-2", bot: false };
      },
      getString(name) {
        if (name === "소환사이름") return "eggcat";
        if (name === "소환사태그") return "KR1";
        throw new Error(`Unexpected option: ${name}`);
      },
    },
    async deferReply(message) {
      replies.push(message);
    },
    async editReply(message) {
      replies.push(message);
    },
    async reply(message) {
      replies.push(message);
    },
  });

  assert.deepEqual(registerCalls, [
    {
      guildId: "guild-1",
      discordId: "target-2",
      account: {
        riotGameName: "eggcat",
        riotTagLine: "KR1",
        puuid: "puuid-1",
        summonerId: "summoner-1",
      },
    },
  ]);
  assert.deepEqual(replies, ["searching...", "등록을 완료했습니다."]);
});

test("a non-admin cannot register on behalf of another user", async () => {
  let summonerLookups = 0;
  let registerCalled = false;
  const command = loadRegistrationCommand({
    dataReceiver: {
      async getSummonerData() {
        summonerLookups += 1;
        return null;
      },
    },
    query: {
      async registerRiotAccount() {
        registerCalled = true;
        return { success: true };
      },
    },
  });

  const replies = [];
  await command.execute({
    guildId: "guild-1",
    user: { id: "member-1" },
    memberPermissions: { has: () => false },
    guild: {
      members: {
        async fetch() {
          throw new Error("should not fetch when registration is rejected");
        },
      },
    },
    options: {
      getUser() {
        return { id: "target-2", bot: false };
      },
      getString(name) {
        if (name === "소환사이름") return "eggcat";
        if (name === "소환사태그") return "KR1";
        throw new Error(`Unexpected option: ${name}`);
      },
    },
    async deferReply(message) {
      replies.push(message);
    },
    async editReply(message) {
      replies.push(message);
    },
    async reply(message) {
      replies.push(message);
    },
  });

  assert.equal(summonerLookups, 0);
  assert.equal(registerCalled, false);
  assert.deepEqual(replies, [
    {
      content: "다른 사람을 대신 등록하는 건 서버 관리자만 할 수 있어요.",
      ephemeral: true,
    },
  ]);
});
