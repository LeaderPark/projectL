const test = require("node:test");
const assert = require("node:assert/strict");

function loadServerCommand(dbDeps = {}) {
  process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "discord-token";
  process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "client-id";
  process.env.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN || "riot-token";
  process.env.DB_HOST = process.env.DB_HOST || "db";
  process.env.DB_USER = process.env.DB_USER || "bot";
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || "secret";
  process.env.DB_NAME = process.env.DB_NAME || "bot";

  delete require.cache[require.resolve("../commands/utility/server")];
  const { createServerCommand, formatGuildSettingsSummary } = require("../commands/utility/server");

  return {
    command: createServerCommand(dbDeps),
    formatGuildSettingsSummary,
  };
}

test("server command exposes setup subcommands", () => {
  const { command } = loadServerCommand();
  const json = command.data.toJSON();

  assert.equal(json.name, "서버설정");
  assert.equal(json.description, "현재 서버의 마법공학 분류모자 설정을 관리합니다.");
  assert.equal(json.options.length, 3);
  assert.deepEqual(
    json.options.map((option) => option.name),
    ["보기", "초기화", "공용통화방"]
  );
  assert.equal(
    json.options[0].description,
    "현재 서버의 마법공학 분류모자 설정 상태를 확인합니다."
  );
  assert.equal(json.options[2].options[0].name, "채널");
});

test("server command format includes unity voice channel when present", () => {
  const { formatGuildSettingsSummary } = loadServerCommand();

  const summary = formatGuildSettingsSummary({
    guild_name: "ProjectL",
    database_name: "projectl_guild_1",
    unity_voice_channel_id: "12345",
    unity_voice_channel_name: "칼칼경혁",
    updated_at: "2026-04-08T00:00:00.000Z",
  });

  assert.match(summary, /칼칼경혁/);
  assert.match(summary, /12345/);
});

test("server command denies access when the member lacks manage guild permission", async () => {
  const { command } = loadServerCommand({
    async getGuildSettings() {
      throw new Error("should not be called");
    },
  });

  const replies = [];
  const interaction = {
    memberPermissions: {
      has() {
        return false;
      },
    },
    async reply(payload) {
      replies.push(payload);
    },
  };

  await command.execute(interaction);

  assert.deepEqual(replies, [
    {
      content: "이 명령어는 서버 관리자만 사용할 수 있어요.",
      ephemeral: true,
    },
  ]);
});

test("server command asks for initialization before setting the unity room", async () => {
  const { command } = loadServerCommand({
    async getGuildSettings() {
      return null;
    },
  });

  const replies = [];
  const interaction = {
    guildId: "guild-1",
    memberPermissions: {
      has() {
        return true;
      },
    },
    options: {
      getSubcommand() {
        return "공용통화방";
      },
    },
    async reply(payload) {
      replies.push(payload);
    },
  };

  await command.execute(interaction);

  assert.equal(replies.length, 1);
  assert.match(replies[0].content, /\/서버설정 초기화/);
  assert.equal(replies[0].ephemeral, true);
});

test("server command updates the configured unity room", async () => {
  const updated = [];
  const { command } = loadServerCommand({
    async getGuildSettings() {
      return {
        guild_name: "ProjectL",
        database_name: "projectl_guild_1",
        updated_at: "2026-04-08T00:00:00.000Z",
      };
    },
    async updateGuildUnityVoiceChannel(guildId, channelId) {
      updated.push({ guildId, channelId });
      return { success: true };
    },
  });

  const replies = [];
  const channel = {
    id: "voice-123",
    name: "한판끝나고모이기",
  };
  const interaction = {
    guildId: "guild-1",
    memberPermissions: {
      has() {
        return true;
      },
    },
    options: {
      getSubcommand() {
        return "공용통화방";
      },
      getChannel(name) {
        assert.equal(name, "채널");
        return channel;
      },
    },
    async reply(payload) {
      replies.push(payload);
    },
  };

  await command.execute(interaction);

  assert.deepEqual(updated, [
    {
      guildId: "guild-1",
      channelId: "voice-123",
    },
  ]);
  assert.equal(replies.length, 1);
  assert.match(replies[0].content, /한판끝나고모이기/);
  assert.match(replies[0].content, /voice-123/);
  assert.equal(replies[0].ephemeral, true);
});
