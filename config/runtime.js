const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_BASE_DIR = path.resolve(__dirname, "..");

let cachedRuntimeConfig;

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function readJsonConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function readSecretConfig(secretPath) {
  if (!fs.existsSync(secretPath)) {
    return {};
  }

  delete require.cache[secretPath];
  return require(secretPath);
}

function requiredValue(value, label) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required runtime config: ${label}`);
  }

  return value;
}

function loadRuntimeConfig(options = {}) {
  const baseDir = options.baseDir ?? DEFAULT_BASE_DIR;
  const configPath = options.configPath ?? path.join(baseDir, "config.json");
  const secretPath = options.secretPath ?? path.join(baseDir, "secret.js");

  const legacyConfig = readJsonConfig(configPath);
  const legacySecret = readSecretConfig(secretPath);

  const databasePort = Number(
    firstNonEmpty(process.env.DB_PORT, process.env.MYSQL_PORT, legacySecret.port, 3306)
  );

  return {
    discord: {
      token: requiredValue(
        firstNonEmpty(process.env.DISCORD_TOKEN, legacyConfig.token),
        "DISCORD_TOKEN"
      ),
      clientId: requiredValue(
        firstNonEmpty(process.env.DISCORD_CLIENT_ID, legacyConfig.clientId),
        "DISCORD_CLIENT_ID"
      ),
      guildId: firstNonEmpty(process.env.DISCORD_GUILD_ID, legacyConfig.guildId),
    },
    riot: {
      token: requiredValue(
        firstNonEmpty(
          process.env.RIOT_API_TOKEN,
          process.env.RIOT_TOKEN,
          legacyConfig.riot_token,
          legacyConfig.riotToken
        ),
        "RIOT_API_TOKEN"
      ),
      platform: firstNonEmpty(
        process.env.RIOT_PLATFORM,
        legacyConfig.riotPlatform,
        "kr"
      ),
      tournamentRegion: firstNonEmpty(
        process.env.RIOT_TOURNAMENT_REGION,
        legacyConfig.riotTournamentRegion,
        "KR"
      ),
      tournamentCallbackUrl: firstNonEmpty(
        process.env.RIOT_TOURNAMENT_CALLBACK_URL,
        legacyConfig.riotTournamentCallbackUrl,
        "https://example.com/projectl-tournament"
      ),
      tournamentUseStub:
        String(
          firstNonEmpty(
            process.env.RIOT_TOURNAMENT_USE_STUB,
            legacyConfig.riotTournamentUseStub,
            "true"
          )
        ).toLowerCase() === "true",
      tournamentPollIntervalMs: Number(
        firstNonEmpty(
          process.env.RIOT_TOURNAMENT_POLL_INTERVAL_MS,
          legacyConfig.riotTournamentPollIntervalMs,
          10000
        )
      ),
    },
    database: {
      host: requiredValue(
        firstNonEmpty(process.env.DB_HOST, process.env.MYSQL_HOST, legacySecret.host),
        "DB_HOST"
      ),
      port: Number.isNaN(databasePort) ? 3306 : databasePort,
      user: requiredValue(
        firstNonEmpty(process.env.DB_USER, process.env.MYSQL_USER, legacySecret.user),
        "DB_USER"
      ),
      password: requiredValue(
        firstNonEmpty(
          process.env.DB_PASSWORD,
          process.env.MYSQL_PASSWORD,
          legacySecret.password
        ),
        "DB_PASSWORD"
      ),
      database: requiredValue(
        firstNonEmpty(process.env.DB_NAME, process.env.MYSQL_DATABASE, legacySecret.database),
        "DB_NAME"
      ),
      timezone: firstNonEmpty(
        process.env.DB_TIMEZONE,
        process.env.MYSQL_TIMEZONE,
        legacySecret.timezone,
        "Z"
      ),
      connectionLimit: Number(
        firstNonEmpty(process.env.DB_CONNECTION_LIMIT, legacySecret.connectionLimit, 10)
      ),
    },
    web: {
      port: Number(
        firstNonEmpty(
          process.env.WEB_PORT,
          legacyConfig.webPort,
          3000
        )
      ),
      publicGuildId: firstNonEmpty(
        process.env.WEB_PUBLIC_GUILD_ID,
        process.env.DISCORD_GUILD_ID,
        legacyConfig.webPublicGuildId,
        legacyConfig.guildId
      ),
      riotTournamentCallbackPath: firstNonEmpty(
        process.env.RIOT_TOURNAMENT_CALLBACK_PATH,
        legacyConfig.riotTournamentCallbackPath,
        "/riot/callback"
      ),
    },
  };
}

function getRuntimeConfig() {
  if (!cachedRuntimeConfig) {
    cachedRuntimeConfig = loadRuntimeConfig();
  }

  return cachedRuntimeConfig;
}

module.exports = {
  getRuntimeConfig,
  loadRuntimeConfig,
};
