const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

function normalizeIdentityValue(value) {
  return String(value ?? "").trim();
}

function buildRefreshKey(guildId, discordId) {
  return `${normalizeIdentityValue(guildId)}:${normalizeIdentityValue(discordId)}`;
}

function buildRefreshDisplayName(account) {
  const gameName = normalizeIdentityValue(account?.gameName ?? account?.riotGameName);
  const tagLine = normalizeIdentityValue(account?.tagLine ?? account?.riotTagLine);

  return [gameName, tagLine].filter(Boolean).join("#");
}

function createPlayerRiotIdentityRefreshService({
  now = Date.now,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  cooldownStore = new Map(),
  listRefreshableRiotAccounts: listRefreshableRiotAccountsImpl,
  getRiotAccountByPuuid: getRiotAccountByPuuidImpl,
  updateRiotAccountDisplayName: updateRiotAccountDisplayNameImpl,
  syncRepresentativeRiotName: syncRepresentativeRiotNameImpl,
} = {}) {
  const resolvedListRefreshableRiotAccounts =
    listRefreshableRiotAccountsImpl ??
    require("../Utils/Query").listRefreshableRiotAccounts;
  const resolvedGetRiotAccountByPuuid =
    getRiotAccountByPuuidImpl ?? require("../Riot/DataReceiver").getRiotAccountByPuuid;
  const resolvedUpdateRiotAccountDisplayName =
    updateRiotAccountDisplayNameImpl ??
    require("../Utils/Query").updateRiotAccountDisplayName;
  const resolvedSyncRepresentativeRiotName =
    syncRepresentativeRiotNameImpl ??
    require("../Utils/Query").syncRepresentativeRiotName;

  return {
    async refreshPlayerRiotIdentity(guildId, discordId) {
      const refreshKey = buildRefreshKey(guildId, discordId);
      const currentTime = Number(now());
      const lastAcceptedAt = Number(cooldownStore.get(refreshKey) ?? 0);

      if (
        Number.isFinite(lastAcceptedAt) &&
        lastAcceptedAt > 0 &&
        currentTime - lastAcceptedAt < cooldownMs
      ) {
        return {
          success: true,
          status: "throttled",
        };
      }

      cooldownStore.set(refreshKey, currentTime);

      const accountsResult = await resolvedListRefreshableRiotAccounts(guildId, discordId);
      if (!accountsResult?.success) {
        return {
          success: false,
          status: "failed",
          msg: accountsResult?.msg ?? "refresh failed",
        };
      }

      const accounts = Array.isArray(accountsResult.data) ? accountsResult.data : [];
      if (!accounts.length) {
        return {
          success: true,
          status: "unchanged",
        };
      }

      let updatedCount = 0;
      let failedCount = 0;
      let successfulLookupCount = 0;

      for (const account of accounts) {
        const riotAccountResult = await resolvedGetRiotAccountByPuuid(account.puuid);
        if (!riotAccountResult?.success) {
          failedCount += 1;
          continue;
        }

        successfulLookupCount += 1;
        const latestGameName = normalizeIdentityValue(
          riotAccountResult?.data?.gameName ?? riotAccountResult?.data?.riotGameName
        );
        const latestTagLine = normalizeIdentityValue(
          riotAccountResult?.data?.tagLine ?? riotAccountResult?.data?.riotTagLine
        );
        const currentGameName = normalizeIdentityValue(account.riotGameName);
        const currentTagLine = normalizeIdentityValue(account.riotTagLine);

        if (
          latestGameName === currentGameName &&
          latestTagLine === currentTagLine
        ) {
          continue;
        }

        const updateResult = await resolvedUpdateRiotAccountDisplayName(
          guildId,
          account.id,
          discordId,
          {
            riotGameName: latestGameName,
            riotTagLine: latestTagLine,
          }
        );

        if (!updateResult?.success) {
          failedCount += 1;
          continue;
        }

        updatedCount += 1;
      }

      if (successfulLookupCount === 0 && failedCount > 0) {
        return {
          success: false,
          status: "failed",
          msg: "refresh failed",
        };
      }

      const syncResult = await resolvedSyncRepresentativeRiotName(guildId, discordId);
      if (!syncResult?.success) {
        return {
          success: false,
          status: failedCount > 0 || updatedCount > 0 ? "partial" : "failed",
          msg: syncResult?.msg ?? "refresh failed",
        };
      }

      const primaryAccountDisplayName = buildRefreshDisplayName({
        gameName:
          syncResult?.data?.primaryAccountDisplayName?.split("#")[0] ??
          syncResult?.data?.primaryAccountDisplayName,
        tagLine: syncResult?.data?.primaryAccountDisplayName?.split("#").slice(1).join("#"),
      }) || normalizeIdentityValue(syncResult?.data?.primaryAccountDisplayName);

      if (failedCount > 0) {
        return {
          success: true,
          status: "partial",
          primaryAccountDisplayName,
        };
      }

      return {
        success: true,
        status: updatedCount > 0 ? "updated" : "unchanged",
        primaryAccountDisplayName,
      };
    },
  };
}

module.exports = {
  DEFAULT_COOLDOWN_MS,
  createPlayerRiotIdentityRefreshService,
};
