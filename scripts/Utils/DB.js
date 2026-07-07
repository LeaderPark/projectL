const mysql = require("mysql2");
const { getRuntimeConfig } = require("../../config/runtime");
const {
  buildControlColumnMigrations,
  buildControlSchemaStatements,
  buildGuildDatabaseName,
  buildGuildColumnMigrations,
  buildGuildIndexMigrations,
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

// Idempotent index-ensure step, parallel to ensureColumns but keyed on
// SHOW INDEX instead of SHOW COLUMNS (indexes have no equivalent of
// `MODIFY COLUMN`, so there is no `needsUpdate` — an index either exists or it
// doesn't). Also tolerates a duplicate-key-name race (e.g. two bootstraps
// running concurrently) so it never throws for an index that already exists.
async function ensureIndexes(promisePool, migrations) {
  for (const migration of migrations) {
    const [rows] = await promisePool.query(
      `SHOW INDEX FROM ${mysql.escapeId(migration.tableName)} WHERE Key_name = ?`,
      [migration.indexName]
    );

    if (rows.length > 0) {
      continue;
    }

    try {
      await promisePool.query(migration.statement);
    } catch (error) {
      if (error?.code !== "ER_DUP_KEYNAME") {
        throw error;
      }
    }
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
      await ensureIndexes(guildPromisePool, buildGuildIndexMigrations());
    })().catch((error) => {
      guildReadyPromiseCache.delete(databaseName);
      throw error;
    });

    guildReadyPromiseCache.set(databaseName, readyPromise);
  }

  return guildReadyPromiseCache.get(databaseName);
}

// D7: guild_settings rarely changes (only via /서버설정), but getGuildPromisePool
// (called on every guild-scoped query) hits it every time via getGuildSettings.
// A short TTL memo cuts a page load's handful of identical PK lookups down to
// one per TTL window. Negative (not-yet-initialized) results are NOT cached so
// a guild that just ran /서버설정 초기화 is seen immediately on the next call.
const GUILD_SETTINGS_CACHE_TTL_MS = 30_000;
const guildSettingsCache = new Map();

function invalidateGuildSettingsCache(guildId) {
  guildSettingsCache.delete(guildId);
}

async function getGuildSettings(guildId) {
  await ensureControlSchema();

  const cached = guildSettingsCache.get(guildId);
  if (cached && Date.now() - cached.cachedAt < GUILD_SETTINGS_CACHE_TTL_MS) {
    return cached.value;
  }

  const [rows] = await controlPromisePool.query(
    `SELECT guild_id, guild_name, database_name, unity_voice_channel_id, created_at, updated_at
     FROM guild_settings
     WHERE guild_id = ?`,
    [guildId]
  );

  const guildSettings = rows[0] ?? null;

  if (guildSettings) {
    guildSettingsCache.set(guildId, { value: guildSettings, cachedAt: Date.now() });
  } else {
    guildSettingsCache.delete(guildId);
  }

  return guildSettings;
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
  invalidateGuildSettingsCache(guildId);

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
  invalidateGuildSettingsCache(guildId);

  return { success: true };
}

module.exports = {
  adminPromisePool,
  controlPromisePool,
  ensureControlSchema,
  ensureColumns,
  ensureIndexes,
  getGuildPromisePool,
  getGuildSettings,
  initializeGuildDatabase,
  listGuildSettings,
  updateGuildUnityVoiceChannel,
};
