const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildGuildDatabaseName,
  buildControlSchemaStatements,
  buildControlColumnMigrations,
  buildGuildColumnMigrations,
  buildGuildSchemaStatements,
  formatGuildConfigurationError,
} = require("../scripts/Utils/GuildDatabase");

test("buildGuildDatabaseName derives a stable guild database name", () => {
  assert.equal(
    buildGuildDatabaseName("bot", "123456789"),
    "bot_guild_123456789"
  );
});

test("buildGuildSchemaStatements includes gameplay tables", () => {
  const sql = buildGuildSchemaStatements().join("\n");

  assert.match(sql, /CREATE TABLE IF NOT EXISTS `user`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `matches`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `match_in_users`/);
});

test("buildGuildSchemaStatements includes riot account and active session tables", () => {
  const sql = buildGuildSchemaStatements().join("\n");

  assert.match(sql, /CREATE TABLE IF NOT EXISTS `riot_accounts`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `active_tournament_sessions`/);
  assert.match(sql, /unity_voice_channel_id/);
});

test("buildGuildSchemaStatements gives player aggregate fields JSON defaults", () => {
  const sql = buildGuildSchemaStatements().join("\n");

  assert.match(sql, /`champions`\s+longtext NOT NULL DEFAULT '\{\}'/);
  assert.match(sql, /`lanes`\s+longtext NOT NULL DEFAULT '\{\}'/);
  assert.match(sql, /`friends`\s+longtext NOT NULL DEFAULT '\{\}'/);
});

test("buildControlSchemaStatements includes a unity voice channel setting", () => {
  const sql = buildControlSchemaStatements().join("\n");

  assert.match(sql, /unity_voice_channel_id/);
});

test("buildControlColumnMigrations covers upgrading guild settings with a unity room column", () => {
  const migrations = buildControlColumnMigrations();

  assert.deepEqual(
    migrations.map(({ tableName, columnName }) => ({
      tableName,
      columnName,
    })),
    [
      {
        tableName: "guild_settings",
        columnName: "unity_voice_channel_id",
      },
    ]
  );
  assert.match(
    migrations[0].statement,
    /ALTER TABLE `guild_settings` ADD COLUMN `unity_voice_channel_id`/
  );
});

test("buildGuildColumnMigrations covers upgrading active sessions with a unity room column", () => {
  const migrations = buildGuildColumnMigrations();
  const unityMigration = migrations.find(
    ({ tableName, columnName }) =>
      tableName === "active_tournament_sessions" &&
      columnName === "unity_voice_channel_id"
  );

  assert.ok(unityMigration);
  assert.match(
    unityMigration.statement,
    /ALTER TABLE `active_tournament_sessions` ADD COLUMN `unity_voice_channel_id`/
  );
});

test("formatGuildConfigurationError guides admins to initialize the guild", () => {
  const message = formatGuildConfigurationError({
    code: "GUILD_NOT_CONFIGURED",
  });

  assert.match(message, /\/서버설정 초기화/);
});
