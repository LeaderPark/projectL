const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

test("loads bot and db config from environment variables", () => {
  const originalEnv = { ...process.env };

  process.env.DISCORD_TOKEN = "discord-token";
  process.env.DISCORD_CLIENT_ID = "client-id";
  process.env.DISCORD_GUILD_ID = "guild-id";
  process.env.RIOT_API_TOKEN = "riot-token";
  process.env.RIOT_PLATFORM = "kr";
  process.env.RIOT_TOURNAMENT_REGION = "KR";
  process.env.RIOT_TOURNAMENT_CALLBACK_URL = "https://example.com/callback";
  process.env.RIOT_TOURNAMENT_USE_STUB = "true";
  process.env.RIOT_TOURNAMENT_POLL_INTERVAL_MS = "7000";
  process.env.WEB_PORT = "8080";
  process.env.RIOT_TOURNAMENT_CALLBACK_PATH = "/riot/callback";
  process.env.DB_HOST = "db";
  process.env.DB_PORT = "3306";
  process.env.DB_USER = "bot";
  process.env.DB_PASSWORD = "secret";
  process.env.DB_NAME = "bot";
  process.env.DB_TIMEZONE = "Z";

  try {
    const { loadRuntimeConfig } = require("../config/runtime");
    const runtime = loadRuntimeConfig();

    assert.equal(runtime.discord.token, "discord-token");
    assert.equal(runtime.discord.clientId, "client-id");
    assert.equal(runtime.discord.guildId, "guild-id");
    assert.equal(runtime.riot.token, "riot-token");
    assert.equal(runtime.riot.platform, "kr");
    assert.equal(runtime.riot.tournamentRegion, "KR");
    assert.equal(runtime.riot.tournamentCallbackUrl, "https://example.com/callback");
    assert.equal(runtime.riot.tournamentUseStub, true);
    assert.equal(runtime.riot.tournamentPollIntervalMs, 7000);
    assert.equal(runtime.web.port, 8080);
    assert.equal(runtime.web.riotTournamentCallbackPath, "/riot/callback");
    assert.equal(runtime.database.host, "db");
    assert.equal(runtime.database.port, 3306);
    assert.equal(runtime.database.user, "bot");
    assert.equal(runtime.database.password, "secret");
    assert.equal(runtime.database.database, "bot");
    assert.equal(runtime.database.timezone, "Z");
  } finally {
    process.env = originalEnv;
  }
});

test("falls back to local config and secret files when env vars are missing", () => {
  const originalEnv = { ...process.env };
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "projectl-runtime-"));
  const configPath = path.join(tempRoot, "config.json");
  const secretPath = path.join(tempRoot, "secret.js");

  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        token: "file-discord-token",
        clientId: "file-client-id",
        guildId: "file-guild-id",
        riot_token: "file-riot-token",
      },
      null,
      2
    )
  );
  fs.writeFileSync(
    secretPath,
    [
      "module.exports = {",
      "  host: '127.0.0.1',",
      "  user: 'file-user',",
      "  password: 'file-password',",
      "  database: 'file-db',",
      "  timezone: '+09:00',",
      "};",
      "",
    ].join("\n")
  );

  delete process.env.DISCORD_TOKEN;
  delete process.env.DISCORD_CLIENT_ID;
  delete process.env.DISCORD_GUILD_ID;
  delete process.env.RIOT_API_TOKEN;
  delete process.env.DB_HOST;
  delete process.env.DB_PORT;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  delete process.env.DB_NAME;
  delete process.env.DB_TIMEZONE;
  delete process.env.RIOT_PLATFORM;
  delete process.env.RIOT_TOURNAMENT_REGION;
  delete process.env.RIOT_TOURNAMENT_CALLBACK_URL;
  delete process.env.RIOT_TOURNAMENT_USE_STUB;
  delete process.env.RIOT_TOURNAMENT_POLL_INTERVAL_MS;
  delete process.env.WEB_PORT;
  delete process.env.RIOT_TOURNAMENT_CALLBACK_PATH;

  try {
    const { loadRuntimeConfig } = require("../config/runtime");
    const runtime = loadRuntimeConfig({
      baseDir: tempRoot,
      configPath,
      secretPath,
    });

    assert.equal(runtime.discord.token, "file-discord-token");
    assert.equal(runtime.discord.clientId, "file-client-id");
    assert.equal(runtime.discord.guildId, "file-guild-id");
    assert.equal(runtime.riot.token, "file-riot-token");
    assert.equal(runtime.riot.platform, "kr");
    assert.equal(runtime.riot.tournamentRegion, "KR");
    assert.equal(runtime.riot.tournamentUseStub, true);
    assert.equal(runtime.web.port, 3000);
    assert.equal(runtime.web.riotTournamentCallbackPath, "/riot/callback");
    assert.equal(runtime.database.host, "127.0.0.1");
    assert.equal(runtime.database.user, "file-user");
    assert.equal(runtime.database.password, "file-password");
    assert.equal(runtime.database.database, "file-db");
    assert.equal(runtime.database.timezone, "+09:00");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    process.env = originalEnv;
  }
});

test("guild id is optional in runtime config", () => {
  const originalEnv = { ...process.env };

  process.env.DISCORD_TOKEN = "discord-token";
  process.env.DISCORD_CLIENT_ID = "client-id";
  process.env.RIOT_API_TOKEN = "riot-token";
  process.env.DB_HOST = "db";
  process.env.DB_PORT = "3306";
  process.env.DB_USER = "bot";
  process.env.DB_PASSWORD = "secret";
  process.env.DB_NAME = "bot";

  delete process.env.DISCORD_GUILD_ID;

  try {
    const { loadRuntimeConfig } = require("../config/runtime");
    const runtime = loadRuntimeConfig();

    assert.equal(runtime.discord.guildId, undefined);
    assert.equal(runtime.riot.platform, "kr");
    assert.equal(runtime.web.port, 3000);
  } finally {
    process.env = originalEnv;
  }
});
