const mysql = require("mysql2");
const { getRuntimeConfig } = require("../../config/runtime");
const {
  buildControlColumnMigrations,
  buildControlSchemaStatements,
  buildGuildDatabaseName,
  buildGuildColumnMigrations,
  buildGuildSchemaStatements,
  createGuildConfigurationError,
} = require("./GuildDatabase");

const runtimeConfig = getRuntimeConfig();
const { database: controlDatabaseName, ...sharedDatabaseConfig } =
  runtimeConfig.database;

const adminPool = mysql.createPool(sharedDatabaseConfig);
const controlPool = mysql.createPool({
  ...sharedDatabaseConfig,
  database: controlDatabaseName,
});

const adminPromisePool = adminPool.promise();
const controlPromisePool = controlPool.promise();
const guildPromisePoolCache = new Map();
const guildReadyPromiseCache = new Map();

let controlSchemaReadyPromise;

function getOrCreateGuildPromisePool(databaseName) {
  if (!guildPromisePoolCache.has(databaseName)) {
    const pool = mysql.createPool({
      ...sharedDatabaseConfig,
      database: databaseName,
    });

    guildPromisePoolCache.set(databaseName, pool.promise());
  }

  return guildPromisePoolCache.get(databaseName);
}

async function ensureSchema(promisePool, statements) {
  for (const statement of statements) {
    await promisePool.query(statement);
  }
}

async function ensureColumns(promisePool, migrations) {
  for (const migration of migrations) {
    const [rows] = await promisePool.query(
      `SHOW COLUMNS FROM ${mysql.escapeId(migration.tableName)} LIKE ?`,
      [migration.columnName]
    );

    const existingColumn = rows[0];
    const shouldApply =
      rows.length === 0 ||
      (typeof migration.needsUpdate === "function" &&
        migration.needsUpdate(existingColumn));

    if (!shouldApply) {
      continue;
    }

    await promisePool.query(migration.statement);
  }
}

function ensureControlSchema() {
  if (!controlSchemaReadyPromise) {
    controlSchemaReadyPromise = (async () => {
      await adminPromisePool.query(
        `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(controlDatabaseName)}`
      );
      await ensureSchema(controlPromisePool, buildControlSchemaStatements());
      await ensureColumns(controlPromisePool, buildControlColumnMigrations());
    })().catch((error) => {
      controlSchemaReadyPromise = undefined;
      throw error;
    });
  }

  return controlSchemaReadyPromise;
}

function ensureGuildDatabaseReady(databaseName) {
  if (!guildReadyPromiseCache.has(databaseName)) {
    const readyPromise = (async () => {
      await adminPromisePool.query(
        `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(databaseName)}`
      );

      const guildPromisePool = getOrCreateGuildPromisePool(databaseName);
      await ensureSchema(guildPromisePool, buildGuildSchemaStatements());
      await ensureColumns(guildPromisePool, buildGuildColumnMigrations());
    })().catch((error) => {
      guildReadyPromiseCache.delete(databaseName);
      throw error;
    });

    guildReadyPromiseCache.set(databaseName, readyPromise);
  }

  return guildReadyPromiseCache.get(databaseName);
}

async function getGuildSettings(guildId) {
  await ensureControlSchema();

  const [rows] = await controlPromisePool.query(
    `SELECT guild_id, guild_name, database_name, unity_voice_channel_id, created_at, updated_at
     FROM guild_settings
     WHERE guild_id = ?`,
    [guildId]
  );

  return rows[0] ?? null;
}

async function listGuildSettings() {
  await ensureControlSchema();

  const [rows] = await controlPromisePool.query(
    `SELECT guild_id, guild_name, database_name, unity_voice_channel_id, created_at, updated_at
     FROM guild_settings
     ORDER BY guild_id ASC`
  );

  return rows;
}

async function initializeGuildDatabase(guildId, guildName) {
  await ensureControlSchema();

  const databaseName = buildGuildDatabaseName(controlDatabaseName, guildId);
  await ensureGuildDatabaseReady(databaseName);

  await controlPromisePool.query(
    `INSERT INTO guild_settings (guild_id, guild_name, database_name, unity_voice_channel_id)
     VALUES (?, ?, ?, NULL)
     ON DUPLICATE KEY UPDATE
       guild_name = VALUES(guild_name),
       database_name = VALUES(database_name)`,
    [guildId, guildName, databaseName]
  );

  return {
    guildId,
    guildName,
    databaseName,
  };
}

async function getGuildPromisePool(guildId) {
  const guildSettings = await getGuildSettings(guildId);

  if (!guildSettings) {
    throw createGuildConfigurationError(guildId);
  }

  await ensureGuildDatabaseReady(guildSettings.database_name);

  return getOrCreateGuildPromisePool(guildSettings.database_name);
}

async function updateGuildUnityVoiceChannel(guildId, unityVoiceChannelId) {
  await ensureControlSchema();

  const [rows] = await controlPromisePool.query(
    `SELECT guild_id FROM guild_settings WHERE guild_id = ?`,
    [guildId]
  );

  if (!rows.length) {
    throw createGuildConfigurationError(guildId);
  }

  await controlPromisePool.query(
    `UPDATE guild_settings
     SET unity_voice_channel_id = ?
     WHERE guild_id = ?`,
    [unityVoiceChannelId, guildId]
  );

  return { success: true };
}

module.exports = {
  adminPromisePool,
  controlPromisePool,
  ensureControlSchema,
  ensureColumns,
  getGuildPromisePool,
  getGuildSettings,
  initializeGuildDatabase,
  listGuildSettings,
  updateGuildUnityVoiceChannel,
};
