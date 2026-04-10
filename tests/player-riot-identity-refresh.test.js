const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createPlayerRiotIdentityRefreshService,
} = require("../scripts/Web/PlayerRiotIdentityRefresh");

function buildAccount(overrides = {}) {
  return {
    id: 11,
    discordId: "discord-1",
    puuid: "puuid-main",
    riotGameName: "Main",
    riotTagLine: "KR1",
    isPrimary: true,
    ...overrides,
  };
}

test("refresh service updates changed riot account names and resyncs the representative name", async () => {
  const updatedAccounts = [];
  const syncedDiscordIds = [];
  const service = createPlayerRiotIdentityRefreshService({
    now: () => 1_000,
    cooldownMs: 5 * 60 * 1000,
    async listRefreshableRiotAccounts() {
      return {
        success: true,
        data: [buildAccount()],
      };
    },
    async getRiotAccountByPuuid() {
      return {
        success: true,
        data: {
          gameName: "MainRenamed",
          tagLine: "KR1",
        },
      };
    },
    async updateRiotAccountDisplayName(guildId, accountId, discordId, payload) {
      updatedAccounts.push({ guildId, accountId, discordId, payload });
      return { success: true };
    },
    async syncRepresentativeRiotName(guildId, discordId) {
      syncedDiscordIds.push({ guildId, discordId });
      return {
        success: true,
        data: { primaryAccountDisplayName: "MainRenamed#KR1" },
      };
    },
  });

  const result = await service.refreshPlayerRiotIdentity("guild-1", "discord-1");

  assert.equal(result.success, true);
  assert.equal(result.status, "updated");
  assert.equal(result.primaryAccountDisplayName, "MainRenamed#KR1");
  assert.deepEqual(updatedAccounts, [
    {
      guildId: "guild-1",
      accountId: 11,
      discordId: "discord-1",
      payload: {
        riotGameName: "MainRenamed",
        riotTagLine: "KR1",
      },
    },
  ]);
  assert.deepEqual(syncedDiscordIds, [{ guildId: "guild-1", discordId: "discord-1" }]);
});

test("refresh service returns unchanged when every linked account already matches Riot", async () => {
  let updateCount = 0;
  const service = createPlayerRiotIdentityRefreshService({
    now: () => 2_000,
    cooldownMs: 5 * 60 * 1000,
    async listRefreshableRiotAccounts() {
      return {
        success: true,
        data: [buildAccount()],
      };
    },
    async getRiotAccountByPuuid() {
      return {
        success: true,
        data: {
          gameName: "Main",
          tagLine: "KR1",
        },
      };
    },
    async updateRiotAccountDisplayName() {
      updateCount += 1;
      return { success: true };
    },
    async syncRepresentativeRiotName() {
      return {
        success: true,
        data: { primaryAccountDisplayName: "Main#KR1" },
      };
    },
  });

  const result = await service.refreshPlayerRiotIdentity("guild-1", "discord-1");

  assert.equal(result.success, true);
  assert.equal(result.status, "unchanged");
  assert.equal(result.primaryAccountDisplayName, "Main#KR1");
  assert.equal(updateCount, 0);
});

test("refresh service returns partial when some linked accounts fail to refresh", async () => {
  const updatedAccounts = [];
  const service = createPlayerRiotIdentityRefreshService({
    now: () => 3_000,
    cooldownMs: 5 * 60 * 1000,
    async listRefreshableRiotAccounts() {
      return {
        success: true,
        data: [
          buildAccount(),
          buildAccount({
            id: 12,
            puuid: "puuid-smurf",
            riotGameName: "Smurf",
            riotTagLine: "JP1",
            isPrimary: false,
          }),
        ],
      };
    },
    async getRiotAccountByPuuid(puuid) {
      if (puuid === "puuid-main") {
        return {
          success: true,
          data: {
            gameName: "MainRenamed",
            tagLine: "KR1",
          },
        };
      }

      return {
        success: false,
        msg: "riot lookup failed",
      };
    },
    async updateRiotAccountDisplayName(guildId, accountId, discordId, payload) {
      updatedAccounts.push({ guildId, accountId, discordId, payload });
      return { success: true };
    },
    async syncRepresentativeRiotName() {
      return {
        success: true,
        data: { primaryAccountDisplayName: "MainRenamed#KR1" },
      };
    },
  });

  const result = await service.refreshPlayerRiotIdentity("guild-1", "discord-1");

  assert.equal(result.success, true);
  assert.equal(result.status, "partial");
  assert.equal(result.primaryAccountDisplayName, "MainRenamed#KR1");
  assert.equal(updatedAccounts.length, 1);
  assert.equal(updatedAccounts[0].accountId, 11);
});

test("refresh service keeps the representative name tied to the primary account when only a non-primary account changed", async () => {
  const updatedAccounts = [];
  const service = createPlayerRiotIdentityRefreshService({
    now: () => 4_000,
    cooldownMs: 5 * 60 * 1000,
    async listRefreshableRiotAccounts() {
      return {
        success: true,
        data: [
          buildAccount(),
          buildAccount({
            id: 12,
            puuid: "puuid-smurf",
            riotGameName: "Smurf",
            riotTagLine: "JP1",
            isPrimary: false,
          }),
        ],
      };
    },
    async getRiotAccountByPuuid(puuid) {
      if (puuid === "puuid-smurf") {
        return {
          success: true,
          data: {
            gameName: "SmurfRenamed",
            tagLine: "JP1",
          },
        };
      }

      return {
        success: true,
        data: {
          gameName: "Main",
          tagLine: "KR1",
        },
      };
    },
    async updateRiotAccountDisplayName(guildId, accountId, discordId, payload) {
      updatedAccounts.push({ guildId, accountId, discordId, payload });
      return { success: true };
    },
    async syncRepresentativeRiotName() {
      return {
        success: true,
        data: { primaryAccountDisplayName: "Main#KR1" },
      };
    },
  });

  const result = await service.refreshPlayerRiotIdentity("guild-1", "discord-1");

  assert.equal(result.success, true);
  assert.equal(result.status, "updated");
  assert.equal(result.primaryAccountDisplayName, "Main#KR1");
  assert.equal(updatedAccounts.length, 1);
  assert.equal(updatedAccounts[0].accountId, 12);
});

test("refresh service throttles repeated refreshes for the same player within five minutes", async () => {
  const lookupCalls = [];
  let currentNow = 10_000;
  const service = createPlayerRiotIdentityRefreshService({
    now: () => currentNow,
    cooldownMs: 5 * 60 * 1000,
    async listRefreshableRiotAccounts() {
      return {
        success: true,
        data: [buildAccount()],
      };
    },
    async getRiotAccountByPuuid(puuid) {
      lookupCalls.push(puuid);
      return {
        success: true,
        data: {
          gameName: "Main",
          tagLine: "KR1",
        },
      };
    },
    async updateRiotAccountDisplayName() {
      throw new Error("should not update");
    },
    async syncRepresentativeRiotName() {
      return {
        success: true,
        data: { primaryAccountDisplayName: "Main#KR1" },
      };
    },
  });

  const firstResult = await service.refreshPlayerRiotIdentity("guild-1", "discord-1");
  currentNow += 60 * 1000;
  const secondResult = await service.refreshPlayerRiotIdentity("guild-1", "discord-1");

  assert.equal(firstResult.status, "unchanged");
  assert.equal(secondResult.success, true);
  assert.equal(secondResult.status, "throttled");
  assert.deepEqual(lookupCalls, ["puuid-main"]);
});
