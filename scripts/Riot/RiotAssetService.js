const axios = require("axios");

const { normalizeChampionKey } = require("./ChampionNameService");

const DEFAULT_VERSIONS_URL =
  "https://ddragon.leagueoflegends.com/api/versions.json";
const DEFAULT_CDN_BASE_URL = "https://ddragon.leagueoflegends.com";
const DEFAULT_FALLBACK_VERSION = "10.11.1";
const DEFAULT_LOCALE = "ko_KR";

function buildChampionAssets(rawChampionData, baseUrl, version) {
  return Object.entries(rawChampionData ?? {}).reduce((assets, [key, champion]) => {
    const championKey = normalizeChampionKey(key);
    const imageFile = champion?.image?.full;
    if (!championKey || !imageFile) {
      return assets;
    }

    const imageUrl = `${baseUrl}/cdn/${encodeURIComponent(version)}/img/champion/${encodeURIComponent(imageFile)}`;
    assets[championKey] = {
      id: champion?.id ?? key,
      name: champion?.name ?? champion?.id ?? key,
      imageUrl,
    };
    const apiKey = normalizeChampionKey(champion?.id);
    if (apiKey && !assets[apiKey]) {
      assets[apiKey] = assets[championKey];
    }

    return assets;
  }, {});
}

function buildItemAssets(rawItemData, baseUrl, version) {
  return Object.entries(rawItemData ?? {}).reduce((assets, [key, item]) => {
    const itemId = Number(key);
    const imageFile = item?.image?.full;
    if (!Number.isFinite(itemId) || !imageFile) {
      return assets;
    }

    assets[itemId] = {
      id: itemId,
      name: item?.name ?? String(itemId),
      imageUrl: `${baseUrl}/cdn/${encodeURIComponent(version)}/img/item/${encodeURIComponent(imageFile)}`,
    };
    return assets;
  }, {});
}

function buildSpellAssets(rawSpellData, baseUrl, version) {
  return Object.values(rawSpellData ?? {}).reduce((assets, spell) => {
    const spellId = Number(spell?.key);
    const imageFile = spell?.image?.full;
    if (!Number.isFinite(spellId) || !imageFile) {
      return assets;
    }

    assets[spellId] = {
      id: spellId,
      name: spell?.name ?? String(spellId),
      imageUrl: `${baseUrl}/cdn/${encodeURIComponent(version)}/img/spell/${encodeURIComponent(imageFile)}`,
    };
    return assets;
  }, {});
}

function buildRuneAssets(rawRunes, baseUrl) {
  const assets = {};

  function visitRunes(runes) {
    if (!Array.isArray(runes)) {
      return;
    }

    runes.forEach((rune) => {
      if (Number.isFinite(Number(rune?.id)) && rune?.icon) {
        assets[Number(rune.id)] = {
          id: Number(rune.id),
          name: rune?.name ?? String(rune.id),
          imageUrl: `${baseUrl}/cdn/img/${rune.icon.replace(/^\/+/, "")}`,
        };
      }

      visitRunes(rune?.slots);
      visitRunes(rune?.runes);
    });
  }

  visitRunes(rawRunes);
  return assets;
}

function createRiotAssetService({
  httpClient = axios,
  versionsUrl = DEFAULT_VERSIONS_URL,
  cdnBaseUrl = DEFAULT_CDN_BASE_URL,
  fallbackVersion = DEFAULT_FALLBACK_VERSION,
  locale = DEFAULT_LOCALE,
} = {}) {
  let cachedManifest = null;
  let pendingManifest = null;

  async function resolveVersion() {
    try {
      const response = await httpClient.get(versionsUrl);
      const versions = Array.isArray(response?.data) ? response.data : [];
      const latestVersion = versions.find(
        (version) => typeof version === "string" && version.trim() !== ""
      );

      if (latestVersion) {
        return latestVersion;
      }
    } catch (error) {
      // Fall back to the pinned version when live version lookup fails.
    }

    return fallbackVersion;
  }

  async function loadAssetManifest() {
    const version = await resolveVersion();
    const baseUrl = cdnBaseUrl.replace(/\/$/, "");
    const localePath = encodeURIComponent(locale);

    const [championResponse, itemResponse, spellResponse, runeResponse] =
      await Promise.all([
        httpClient.get(
          `${baseUrl}/cdn/${encodeURIComponent(version)}/data/${localePath}/champion.json`
        ),
        httpClient.get(
          `${baseUrl}/cdn/${encodeURIComponent(version)}/data/${localePath}/item.json`
        ),
        httpClient.get(
          `${baseUrl}/cdn/${encodeURIComponent(version)}/data/${localePath}/summoner.json`
        ),
        httpClient.get(
          `${baseUrl}/cdn/${encodeURIComponent(version)}/data/${localePath}/runesReforged.json`
        ),
      ]);

    return {
      version,
      championAssets: buildChampionAssets(
        championResponse?.data?.data,
        baseUrl,
        version
      ),
      itemAssets: buildItemAssets(itemResponse?.data?.data, baseUrl, version),
      spellAssets: buildSpellAssets(spellResponse?.data?.data, baseUrl, version),
      runeAssets: buildRuneAssets(runeResponse?.data, baseUrl),
    };
  }

  async function getAssetManifest() {
    if (cachedManifest) {
      return cachedManifest;
    }

    if (!pendingManifest) {
      pendingManifest = loadAssetManifest()
        .then((manifest) => {
          cachedManifest = manifest;
          return manifest;
        })
        .finally(() => {
          pendingManifest = null;
        });
    }

    return pendingManifest;
  }

  return {
    getAssetManifest,
  };
}

const riotAssetService = createRiotAssetService();

module.exports = {
  buildChampionAssets,
  buildItemAssets,
  buildRuneAssets,
  buildSpellAssets,
  createRiotAssetService,
  riotAssetService,
};
