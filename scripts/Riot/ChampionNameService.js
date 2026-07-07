const axios = require("axios");

const DEFAULT_VERSIONS_URL =
  "https://ddragon.leagueoflegends.com/api/versions.json";
const DEFAULT_CHAMPION_CDN_BASE_URL =
  "https://ddragon.leagueoflegends.com";
const DEFAULT_FALLBACK_VERSION = "10.11.1";
const RIOT_HTTP_TIMEOUT_MS = 8000;
const CHAMPION_NAME_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const API_CHAMPION_ALIASES = Object.freeze({
  MonkeyKing: ["Wukong"],
});

function normalizeChampionKey(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function buildChampionNameMap(rawChampionData) {
  return Object.entries(rawChampionData ?? {}).reduce(
    (championNameMap, [key, champion]) => {
      const localizedName = champion?.name;
      if (!localizedName) {
        return championNameMap;
      }

      const identifiers = [key, champion?.id];
      const aliasIdentifiers = API_CHAMPION_ALIASES[key] ?? API_CHAMPION_ALIASES[champion?.id] ?? [];
      identifiers.push(...aliasIdentifiers);
      identifiers.forEach((identifier) => {
        const normalizedKey = normalizeChampionKey(identifier);
        if (normalizedKey) {
          championNameMap[normalizedKey] = localizedName;
        }
      });

      return championNameMap;
    },
    {}
  );
}

function createChampionNameService({
  httpClient = axios,
  versionsUrl = DEFAULT_VERSIONS_URL,
  championCdnBaseUrl = DEFAULT_CHAMPION_CDN_BASE_URL,
  fallbackVersion = DEFAULT_FALLBACK_VERSION,
} = {}) {
  let cachedChampionNameMap = null;
  let cachedChampionNameMapAt = 0;
  let pendingChampionNameMap = null;

  async function resolveChampionVersion() {
    try {
      const response = await httpClient.get(versionsUrl, {
        timeout: RIOT_HTTP_TIMEOUT_MS,
      });
      const versions = Array.isArray(response?.data) ? response.data : [];
      const latestVersion = versions.find(
        (version) => typeof version === "string" && version.trim() !== ""
      );

      if (latestVersion) {
        return latestVersion;
      }
    } catch (error) {
      // Fall back to the configured CDN version if the live version lookup fails.
    }

    return fallbackVersion;
  }

  async function loadChampionNameMap() {
    const version = await resolveChampionVersion();
    const baseUrl = championCdnBaseUrl.replace(/\/$/, "");
    const response = await httpClient.get(
      `${baseUrl}/cdn/${encodeURIComponent(version)}/data/ko_KR/champion.json`,
      { timeout: RIOT_HTTP_TIMEOUT_MS }
    );

    return buildChampionNameMap(response?.data?.data);
  }

  async function getChampionNameMap() {
    if (
      cachedChampionNameMap &&
      Date.now() - cachedChampionNameMapAt < CHAMPION_NAME_CACHE_TTL_MS
    ) {
      return cachedChampionNameMap;
    }

    if (!pendingChampionNameMap) {
      pendingChampionNameMap = loadChampionNameMap()
        .then((championNameMap) => {
          cachedChampionNameMap = championNameMap;
          cachedChampionNameMapAt = Date.now();
          return championNameMap;
        })
        .finally(() => {
          pendingChampionNameMap = null;
        });
    }

    return pendingChampionNameMap;
  }

  return {
    getChampionNameMap,
  };
}

const championNameService = createChampionNameService();

module.exports = {
  buildChampionNameMap,
  championNameService,
  createChampionNameService,
  normalizeChampionKey,
};
