const test = require("node:test");
const assert = require("node:assert/strict");
const { Events } = require("discord.js");

// matchEnd.js pulls in scripts/Utils/DB, whose module load calls getRuntimeConfig().
// Provide stub env values before requiring it, mirroring the other command tests.
process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
process.env.DB_HOST = process.env.DB_HOST || "db";
process.env.DB_USER = process.env.DB_USER || "bot";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
process.env.DB_NAME = process.env.DB_NAME || "bot";

const { registerInteractionHandler } = require("../scripts/AppRuntime");
const { createMatchEndCommand } = require("../commands/team/matchEnd");

test("registerInteractionHandler does not throw when both reply and followUp reject", async () => {
  const handlers = new Map();
  const errors = [];
  const fakeClient = {
    on(eventName, handler) {
      handlers.set(eventName, handler);
    },
    commands: {
      get() {
        return {
          async execute() {
            throw new Error("slow command exceeded interaction window");
          },
        };
      },
    },
  };

  registerInteractionHandler({
    client: fakeClient,
    logger: {
      log() {},
      error(err) {
        errors.push(err);
      },
    },
  });

  const interaction = {
    client: fakeClient,
    isChatInputCommand: () => true,
    inGuild: () => true,
    commandName: "내전종료",
    replied: false,
    deferred: false,
    async reply() {
      throw Object.assign(new Error("Unknown interaction"), { code: 10062 });
    },
    async followUp() {
      throw Object.assign(new Error("Unknown interaction"), { code: 10062 });
    },
  };

  const handler = handlers.get(Events.InteractionCreate);
  assert.equal(typeof handler, "function");

  // Should not reject / throw even though both recovery paths fail.
  await assert.doesNotReject(handler(interaction));

  // Both the original error and the secondary recovery failure should be logged.
  assert.ok(errors.length >= 2);
});

function createVoiceMember(id) {
  return {
    id,
    voice: {
      async setChannel() {
        if (id === "fail-me") {
          throw new Error("cannot move member");
        }
      },
    },
  };
}

function createChannel(name, memberIds) {
  const members = new Map(memberIds.map((id) => [id, createVoiceMember(id)]));
  return {
    name,
    id: `${name}-id`,
    members: {
      values: () => members.values(),
    },
  };
}

test("matchEnd command defers, edits reply, and tolerates a member move failure", async () => {
  const team1 = createChannel("TEAM BLUE", ["a", "b"]);
  const team2 = createChannel("TEAM PURPLE", ["fail-me", "c"]);
  const unityRoom = createChannel("칼칼경혁", []);

  const channelCache = new Map([
    ["TEAM BLUE", team1],
    ["TEAM PURPLE", team2],
    ["칼칼경혁", unityRoom],
  ]);

  const guild = {
    channels: {
      cache: {
        find(predicate) {
          for (const channel of channelCache.values()) {
            if (predicate(channel)) return channel;
          }
          return undefined;
        },
        get() {
          return undefined;
        },
      },
      async fetch() {
        return null;
      },
    },
  };

  let deferred = false;
  let editReplyMessage = null;
  const interaction = {
    guild,
    guildId: "guild-1",
    async deferReply() {
      deferred = true;
    },
    async editReply(message) {
      editReplyMessage = message;
    },
    async reply() {
      throw new Error("reply() should not be called once deferred");
    },
  };

  const matchEndCommand = createMatchEndCommand({
    async getGuildSettings() {
      return null;
    },
  });

  await matchEndCommand.execute(interaction);

  assert.equal(deferred, true);
  assert.match(editReplyMessage, /3명을 칼칼경혁으로 이동시켰습니다\./);
  assert.match(editReplyMessage, /1명 이동 실패/);
});

test("matchEnd command prefers the configured unity voice channel over the name lookup", async () => {
  const team1 = createChannel("TEAM BLUE", ["a"]);
  const team2 = createChannel("TEAM PURPLE", ["b"]);
  const configuredRoom = createChannel("설정된 통합방", []);
  const namedRoom = createChannel("칼칼경혁", []);

  const channelsById = new Map([[configuredRoom.id, configuredRoom]]);
  const channelCache = new Map([
    ["TEAM BLUE", team1],
    ["TEAM PURPLE", team2],
    ["칼칼경혁", namedRoom],
  ]);

  const guild = {
    channels: {
      cache: {
        find(predicate) {
          for (const channel of channelCache.values()) {
            if (predicate(channel)) return channel;
          }
          return undefined;
        },
        get(id) {
          return channelsById.get(id);
        },
      },
      async fetch(id) {
        return channelsById.get(id) ?? null;
      },
    },
  };

  let editReplyMessage = null;
  const interaction = {
    guild,
    guildId: "guild-1",
    async deferReply() {},
    async editReply(message) {
      editReplyMessage = message;
    },
  };

  const matchEndCommand = createMatchEndCommand({
    async getGuildSettings() {
      return { unity_voice_channel_id: configuredRoom.id };
    },
  });

  await matchEndCommand.execute(interaction);

  assert.match(editReplyMessage, /설정된 통합방/);
});
