const { getRuntimeConfig } = require("../../config/runtime");

function normalizeBaseUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate).origin;
  } catch (error) {
    return null;
  }
}

function resolvePublicSiteBaseUrl(runtimeConfig = getRuntimeConfig()) {
  const explicitBaseUrl = normalizeBaseUrl(
    process.env.WEB_PUBLIC_BASE_URL || process.env.CF_PUBLIC_HOSTNAME
  );
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const callbackBaseUrl = normalizeBaseUrl(runtimeConfig?.riot?.tournamentCallbackUrl);
  if (callbackBaseUrl === "https://example.com") {
    return null;
  }

  return callbackBaseUrl;
}

function buildGuildPath(guildId, suffix = "") {
  const normalizedGuildId = String(guildId ?? "").trim();
  if (!normalizedGuildId) {
    return null;
  }

  return `/${encodeURIComponent(normalizedGuildId)}${suffix}`;
}

function buildPublicUrl(pathname, runtimeConfig = getRuntimeConfig()) {
  const baseUrl = resolvePublicSiteBaseUrl(runtimeConfig);
  if (!baseUrl || !pathname) {
    return null;
  }

  return `${baseUrl}${pathname}`;
}

function buildPublicRankingUrl(guildId, runtimeConfig) {
  return buildPublicUrl(buildGuildPath(guildId, "/ranking"), runtimeConfig);
}

function buildPublicPlayerUrl(guildId, discordId, runtimeConfig) {
  const normalizedDiscordId = String(discordId ?? "").trim();
  if (!normalizedDiscordId) {
    return null;
  }

  return buildPublicUrl(
    buildGuildPath(guildId, `/players/${encodeURIComponent(normalizedDiscordId)}`),
    runtimeConfig
  );
}

module.exports = {
  buildPublicPlayerUrl,
  buildPublicRankingUrl,
  resolvePublicSiteBaseUrl,
};
