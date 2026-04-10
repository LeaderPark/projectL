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

function createMember(id, name) {
  return {
    displayName: name,
    user: {
      id,
      username: name,
    },
    toString() {
      return `<@${id}>`;
    },
  };
}

function loadAutoMatchTeamsCommand(overrides = {}) {
  primeRuntimeEnv();

  const commandPath = require.resolve("../commands/team/autoMatchTeams");
  const runtimePath = require.resolve("../config/runtime");
  const tournamentApiPath = require.resolve("../scripts/Riot/TournamentApi");
  const dbPath = require.resolve("../scripts/Utils/DB");
  const queryPath = require.resolve("../scripts/Utils/Query");

  const originals = new Map(
    [runtimePath, tournamentApiPath, dbPath, queryPath].map((modulePath) => [
      modulePath,
      require.cache[modulePath],
    ])
  );

  delete require.cache[commandPath];
  delete require.cache[runtimePath];

  require.cache[tournamentApiPath] = {
    id: tournamentApiPath,
    filename: tournamentApiPath,
    loaded: true,
    exports: {
      createTournamentApi: () => ({
        async createProvider() {
          return "provider-1";
        },
        async createTournament() {
          return "tournament-1";
        },
        async createTournamentCode(tournamentId, options) {
          if (overrides.onCreateTournamentCode) {
            await overrides.onCreateTournamentCode(tournamentId, options);
          }

          return "CODE-1234";
        },
      }),
    },
  };

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      getGuildSettings: async () => ({
        unity_voice_channel_id: "unity-room-1",
      }),
      ...overrides.db,
    },
  };

  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: {
      getUsersData: async () => ({ success: true, data: [] }),
      getLatestTournamentSession: async () => ({ success: true, data: null }),
      replaceActiveTournamentSession: async () => ({ success: true }),
      ...overrides.query,
    },
  };

  const command = require(commandPath);

  for (const [modulePath, original] of originals.entries()) {
    if (original) {
      require.cache[modulePath] = original;
    } else {
      delete require.cache[modulePath];
    }
  }

  return command;
}

test("auto match command uses the selected pick mode when creating a tournament room", async () => {
  const createTournamentCodeCalls = [];
  const command = loadAutoMatchTeamsCommand({
    onCreateTournamentCode: async (tournamentId, options) => {
      createTournamentCodeCalls.push({ tournamentId, options });
    },
  });

  const members = Array.from({ length: 10 }, (_, index) =>
    createMember(`user-${index + 1}`, `Player ${index + 1}`)
  );
  const voiceChannel = {
    id: "voice-room-1",
    name: "내전 대기실",
    members: new Map(members.map((member) => [member.user.id, member])),
  };
  const replies = [];

  await command.execute({
    guildId: "guild-1",
    guild: {
      name: "ProjectL",
      channels: {
        cache: {
          find(predicate) {
            return [
              { id: "blue-room", name: "TEAM BLUE" },
              { id: "purple-room", name: "TEAM PURPLE" },
            ].find(predicate);
          },
        },
      },
    },
    member: {
      voice: {
        channel: voiceChannel,
      },
    },
    user: {
      id: "creator-1",
    },
    options: {
      getString(name) {
        if (name === "옵션") {
          return "RANDOM";
        }

        if (name === "픽방식") {
          return "ALL_RANDOM";
        }

        if (name === "특수규칙") {
          return "STANDARD";
        }

        if (name === "시리즈동작") {
          return "AUTO";
        }

        throw new Error(`unexpected option lookup: ${name}`);
      },
    },
    async deferReply() {},
    async editReply(payload) {
      replies.push(payload);
      return payload;
    },
  });

  assert.equal(createTournamentCodeCalls.length, 1);
  assert.equal(createTournamentCodeCalls[0].tournamentId, "tournament-1");
  assert.equal(createTournamentCodeCalls[0].options.pickType, "ALL_RANDOM");
});

test("auto match command success embed includes the selected pick mode label", async () => {
  const command = loadAutoMatchTeamsCommand();
  const members = Array.from({ length: 10 }, (_, index) =>
    createMember(`user-${index + 1}`, `Player ${index + 1}`)
  );
  const voiceChannel = {
    id: "voice-room-1",
    name: "내전 대기실",
    members: new Map(members.map((member) => [member.user.id, member])),
  };
  const replies = [];

  await command.execute({
    guildId: "guild-1",
    guild: {
      name: "ProjectL",
      channels: {
        cache: {
          find(predicate) {
            return [
              { id: "blue-room", name: "TEAM BLUE" },
              { id: "purple-room", name: "TEAM PURPLE" },
            ].find(predicate);
          },
        },
      },
    },
    member: {
      voice: {
        channel: voiceChannel,
      },
    },
    user: {
      id: "creator-1",
    },
    options: {
      getString(name) {
        if (name === "옵션") {
          return "RANDOM";
        }

        if (name === "픽방식") {
          return "DRAFT_MODE";
        }

        if (name === "특수규칙") {
          return "STANDARD";
        }

        if (name === "시리즈동작") {
          return "AUTO";
        }

        throw new Error(`unexpected option lookup: ${name}`);
      },
    },
    async deferReply() {},
    async editReply(payload) {
      replies.push(payload);
      return payload;
    },
  });

  assert.equal(replies.length, 1);
  assert.equal(replies[0].embeds.length, 1);
  assert.match(JSON.stringify(replies[0].embeds[0].data), /드래프트 모드/);
});

test("auto match command stores a new hard fearless series with set 1 metadata", async () => {
  let storedSession = null;
  const command = loadAutoMatchTeamsCommand({
    query: {
      replaceActiveTournamentSession: async (_guildId, session) => {
        storedSession = session;
        return { success: true };
      },
    },
  });

  const members = Array.from({ length: 10 }, (_, index) =>
    createMember(`user-${index + 1}`, `Player ${index + 1}`)
  );
  const voiceChannel = {
    id: "voice-room-1",
    name: "내전 대기실",
    members: new Map(members.map((member) => [member.user.id, member])),
  };
  const replies = [];

  await command.execute({
    guildId: "guild-1",
    guild: {
      name: "ProjectL",
      channels: {
        cache: {
          find(predicate) {
            return [
              { id: "blue-room", name: "TEAM BLUE" },
              { id: "purple-room", name: "TEAM PURPLE" },
            ].find(predicate);
          },
        },
      },
    },
    member: {
      voice: {
        channel: voiceChannel,
      },
    },
    user: {
      id: "creator-1",
    },
    options: {
      getString(name) {
        if (name === "옵션") {
          return "RANDOM";
        }

        if (name === "픽방식") {
          return "TOURNAMENT_DRAFT";
        }

        if (name === "특수규칙") {
          return "HARD_FEARLESS";
        }

        if (name === "시리즈동작") {
          return "AUTO";
        }

        throw new Error(`unexpected option lookup: ${name}`);
      },
    },
    async deferReply() {},
    async editReply(payload) {
      replies.push(payload);
      return payload;
    },
  });

  assert.deepEqual(storedSession.seriesMode, "HARD_FEARLESS");
  assert.equal(storedSession.seriesGameNumber, 1);
  assert.deepEqual(storedSession.fearlessUsedChampions, []);
  assert.equal(replies.length, 1);
  assert.match(JSON.stringify(replies[0].embeds[0].data), /하드 피어리스/);
  assert.match(JSON.stringify(replies[0].embeds[0].data), /1세트/);
});

test("auto match command continues a hard fearless series with the previous teams and bans", async () => {
  let storedSession = null;
  const command = loadAutoMatchTeamsCommand({
    query: {
      getLatestTournamentSession: async () => ({
        success: true,
        data: {
          id: 70,
          status: "COMPLETED",
          resultStatus: "INGESTED",
          seriesMode: "HARD_FEARLESS",
          seriesGameNumber: 1,
          fearlessUsedChampions: ["Ahri", "Lee Sin"],
          team1DiscordIds: ["user-1", "user-3", "user-5", "user-7", "user-9"],
          team2DiscordIds: ["user-2", "user-4", "user-6", "user-8", "user-10"],
        },
      }),
      replaceActiveTournamentSession: async (_guildId, session) => {
        storedSession = session;
        return { success: true };
      },
    },
  });

  const members = [
    createMember("user-10", "Player 10"),
    createMember("user-9", "Player 9"),
    createMember("user-8", "Player 8"),
    createMember("user-7", "Player 7"),
    createMember("user-6", "Player 6"),
    createMember("user-5", "Player 5"),
    createMember("user-4", "Player 4"),
    createMember("user-3", "Player 3"),
    createMember("user-2", "Player 2"),
    createMember("user-1", "Player 1"),
  ];
  const voiceChannel = {
    id: "voice-room-1",
    name: "내전 대기실",
    members: new Map(members.map((member) => [member.user.id, member])),
  };
  const replies = [];

  await command.execute({
    guildId: "guild-1",
    guild: {
      name: "ProjectL",
      channels: {
        cache: {
          find(predicate) {
            return [
              { id: "blue-room", name: "TEAM BLUE" },
              { id: "purple-room", name: "TEAM PURPLE" },
            ].find(predicate);
          },
        },
      },
    },
    member: {
      voice: {
        channel: voiceChannel,
      },
    },
    user: {
      id: "creator-1",
    },
    options: {
      getString(name) {
        if (name === "옵션") {
          return "RANDOM";
        }

        if (name === "픽방식") {
          return "TOURNAMENT_DRAFT";
        }

        if (name === "특수규칙") {
          return "HARD_FEARLESS";
        }

        if (name === "시리즈동작") {
          return "CONTINUE";
        }

        throw new Error(`unexpected option lookup: ${name}`);
      },
    },
    async deferReply() {},
    async editReply(payload) {
      replies.push(payload);
      return payload;
    },
  });

  assert.deepEqual(storedSession.team1DiscordIds, [
    "user-1",
    "user-3",
    "user-5",
    "user-7",
    "user-9",
  ]);
  assert.deepEqual(storedSession.team2DiscordIds, [
    "user-2",
    "user-4",
    "user-6",
    "user-8",
    "user-10",
  ]);
  assert.equal(storedSession.seriesGameNumber, 2);
  assert.deepEqual(storedSession.fearlessUsedChampions, ["Ahri", "Lee Sin"]);
  assert.match(JSON.stringify(replies[0].embeds[0].data), /2세트/);
  assert.match(JSON.stringify(replies[0].embeds[0].data), /아리/);
  assert.match(JSON.stringify(replies[0].embeds[0].data), /리 신/);
  assert.doesNotMatch(JSON.stringify(replies[0].embeds[0].data), /Ahri/);
  assert.doesNotMatch(JSON.stringify(replies[0].embeds[0].data), /Lee Sin/);
});
