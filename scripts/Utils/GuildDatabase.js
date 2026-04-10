const MAX_DATABASE_NAME_LENGTH = 64;
const GUILD_NOT_CONFIGURED = "GUILD_NOT_CONFIGURED";
const EMPTY_JSON_OBJECT = "{}";
const EMPTY_JSON_ARRAY = "[]";

function sanitizeDatabaseSegment(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function buildGuildDatabaseName(baseName, guildId) {
  const sanitizedBaseName = sanitizeDatabaseSegment(baseName) || "projectl";
  const guildSuffix = `_guild_${guildId}`;
  const maxBaseLength = Math.max(
    1,
    MAX_DATABASE_NAME_LENGTH - guildSuffix.length
  );

  return `${sanitizedBaseName.slice(0, maxBaseLength)}${guildSuffix}`;
}

function buildControlSchemaStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS \`guild_settings\` (
      \`guild_id\` varchar(50) NOT NULL,
      \`guild_name\` varchar(255) NOT NULL,
      \`database_name\` varchar(64) NOT NULL,
      \`unity_voice_channel_id\` varchar(50) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`guild_id\`),
      UNIQUE KEY \`uq_guild_settings_database_name\` (\`database_name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];
}

function buildControlColumnMigrations() {
  return [
    {
      tableName: "guild_settings",
      columnName: "unity_voice_channel_id",
      statement:
        "ALTER TABLE `guild_settings` ADD COLUMN `unity_voice_channel_id` varchar(50) DEFAULT NULL AFTER `database_name`",
    },
  ];
}

function buildGuildSchemaStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS \`user\` (
      \`discord_id\` varchar(50) NOT NULL,
      \`puuid\` varchar(255) NOT NULL,
      \`name\` varchar(50) NOT NULL,
      \`mmr\` mediumint(8) UNSIGNED NOT NULL DEFAULT 1000,
      \`win\` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
      \`lose\` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
      \`penta\` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
      \`quadra\` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
      \`champions\` longtext NOT NULL DEFAULT '${EMPTY_JSON_OBJECT}',
      \`lanes\` longtext NOT NULL DEFAULT '${EMPTY_JSON_OBJECT}',
      \`friends\` longtext NOT NULL DEFAULT '${EMPTY_JSON_OBJECT}',
      \`t_kill\` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
      \`t_death\` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
      \`t_assist\` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
      \`t_kill_rate\` int(10) UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (\`discord_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS \`matches\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`game_id\` varchar(50) NOT NULL,
      \`game_length\` varchar(50) NOT NULL,
      \`played_at_kst\` datetime DEFAULT NULL,
      \`purple_team\` longtext NOT NULL,
      \`blue_team\` longtext NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS \`match_in_users\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`match_id\` int(11) NOT NULL,
      \`user_id\` varchar(50) NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`fk_bot_matches\` (\`match_id\`),
      KEY \`fk_bot_user\` (\`user_id\`),
      CONSTRAINT \`fk_bot_matches\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`fk_bot_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`discord_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS \`riot_accounts\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`discord_id\` varchar(50) NOT NULL,
      \`riot_game_name\` varchar(50) NOT NULL,
      \`riot_tag_line\` varchar(50) NOT NULL,
      \`puuid\` varchar(255) NOT NULL,
      \`summoner_id\` varchar(255) NOT NULL,
      \`is_primary\` tinyint(1) NOT NULL DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_riot_accounts_puuid\` (\`puuid\`),
      UNIQUE KEY \`uq_riot_accounts_summoner_id\` (\`summoner_id\`),
      UNIQUE KEY \`uq_riot_accounts_riot_id\` (\`riot_game_name\`, \`riot_tag_line\`),
      KEY \`fk_riot_accounts_user\` (\`discord_id\`),
      CONSTRAINT \`fk_riot_accounts_user\` FOREIGN KEY (\`discord_id\`) REFERENCES \`user\` (\`discord_id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS \`active_tournament_sessions\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`tournament_code\` varchar(255) NOT NULL,
      \`provider_id\` varchar(50) DEFAULT NULL,
      \`tournament_id\` varchar(50) DEFAULT NULL,
      \`source_channel_id\` varchar(50) NOT NULL,
      \`team1_channel_id\` varchar(50) NOT NULL,
      \`team2_channel_id\` varchar(50) NOT NULL,
      \`unity_voice_channel_id\` varchar(50) DEFAULT NULL,
      \`team1_discord_ids\` longtext NOT NULL,
      \`team2_discord_ids\` longtext NOT NULL,
      \`status\` varchar(30) NOT NULL DEFAULT 'LOBBY',
      \`last_event_at\` varchar(50) DEFAULT NULL,
      \`result_status\` varchar(30) NOT NULL DEFAULT 'IDLE',
      \`result_game_id\` varchar(50) DEFAULT NULL,
      \`result_payload\` longtext DEFAULT NULL,
      \`result_attempts\` int(10) UNSIGNED NOT NULL DEFAULT 0,
      \`result_error\` longtext DEFAULT NULL,
      \`series_mode\` varchar(30) NOT NULL DEFAULT 'STANDARD',
      \`series_game_number\` int(10) UNSIGNED NOT NULL DEFAULT 1,
      \`fearless_used_champions\` longtext NOT NULL DEFAULT '${EMPTY_JSON_ARRAY}',
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_active_tournament_sessions_code\` (\`tournament_code\`),
      KEY \`idx_active_tournament_sessions_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];
}

function buildGuildColumnMigrations() {
  const buildJsonDefaultMigration = (columnName) => ({
    tableName: "user",
    columnName,
    statement: `ALTER TABLE \`user\` MODIFY COLUMN \`${columnName}\` longtext NOT NULL DEFAULT '${EMPTY_JSON_OBJECT}'`,
    needsUpdate(column) {
      return column.Null !== "NO" || column.Default !== EMPTY_JSON_OBJECT;
    },
  });

  return [
    {
      tableName: "matches",
      columnName: "played_at_kst",
      statement:
        "ALTER TABLE `matches` ADD COLUMN `played_at_kst` datetime DEFAULT NULL AFTER `game_length`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "unity_voice_channel_id",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `unity_voice_channel_id` varchar(50) DEFAULT NULL AFTER `team2_channel_id`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "result_status",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `result_status` varchar(30) NOT NULL DEFAULT 'IDLE' AFTER `last_event_at`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "result_game_id",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `result_game_id` varchar(50) DEFAULT NULL AFTER `result_status`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "result_payload",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `result_payload` longtext DEFAULT NULL AFTER `result_game_id`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "result_attempts",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `result_attempts` int(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `result_payload`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "result_error",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `result_error` longtext DEFAULT NULL AFTER `result_attempts`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "series_mode",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `series_mode` varchar(30) NOT NULL DEFAULT 'STANDARD' AFTER `result_error`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "series_game_number",
      statement:
        "ALTER TABLE `active_tournament_sessions` ADD COLUMN `series_game_number` int(10) UNSIGNED NOT NULL DEFAULT 1 AFTER `series_mode`",
    },
    {
      tableName: "active_tournament_sessions",
      columnName: "fearless_used_champions",
      statement:
        `ALTER TABLE \`active_tournament_sessions\` ADD COLUMN \`fearless_used_champions\` longtext NOT NULL DEFAULT '${EMPTY_JSON_ARRAY}' AFTER \`series_game_number\``,
    },
    {
      tableName: "riot_accounts",
      columnName: "is_primary",
      statement:
        "ALTER TABLE `riot_accounts` ADD COLUMN `is_primary` tinyint(1) NOT NULL DEFAULT 0 AFTER `summoner_id`",
    },
    buildJsonDefaultMigration("champions"),
    buildJsonDefaultMigration("lanes"),
    buildJsonDefaultMigration("friends"),
  ];
}

function createGuildConfigurationError(guildId) {
  const error = new Error(
    `Guild ${guildId} has not been initialized yet.`
  );

  error.code = GUILD_NOT_CONFIGURED;
  error.guildId = guildId;

  return error;
}

function isGuildConfigurationError(error) {
  return error?.code === GUILD_NOT_CONFIGURED;
}

function formatGuildConfigurationError(error) {
  if (isGuildConfigurationError(error)) {
    return "이 서버는 아직 초기화되지 않았습니다. 서버 관리자에게 /서버설정 초기화를 요청하세요.";
  }

  return error?.message ?? "오류가 발생했습니다.";
}

module.exports = {
  buildControlColumnMigrations,
  GUILD_NOT_CONFIGURED,
  buildControlSchemaStatements,
  buildGuildDatabaseName,
  buildGuildColumnMigrations,
  buildGuildSchemaStatements,
  createGuildConfigurationError,
  formatGuildConfigurationError,
  isGuildConfigurationError,
};
