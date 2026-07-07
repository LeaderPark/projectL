const test = require("node:test");
const assert = require("node:assert/strict");

const { createPublicSiteHandlers } = require("../scripts/Web/PublicSite");

function buildAssetManifest() {
  return {
    championAssets: {},
    itemAssets: {},
    spellAssets: {},
    runeAssets: {},
  };
}

test("renderMatchesPage requests a finite, numeric cap from getPublicMatchHistory", async () => {
  const calls = [];
  const site = createPublicSiteHandlers({
    preferredGuildId: "guild-1",
    async getChampionNameMap() {
      return {};
    },
    async getRiotAssetManifest() {
      return buildAssetManifest();
    },
    async getGuildName() {
      return "Test Server";
    },
    async getPublicSiteSummary() {
      throw new Error("not used");
    },
    async getPublicLeaderboard() {
      throw new Error("not used");
    },
    async getPublicMatchHistory(guildId, limit) {
      calls.push({ guildId, limit });
      return { success: true, data: [] };
    },
    async getPublicMatchById() {
      throw new Error("not used");
    },
    async getPublicPlayerProfile() {
      throw new Error("not used");
    },
    async getLatestMatched() {
      throw new Error("not used");
    },
    async searchPublicPlayers() {
      throw new Error("not used");
    },
  });

  await site.renderMatchesPage("guild-1");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].guildId, "guild-1");
  assert.equal(typeof calls[0].limit, "number");
  assert.ok(Number.isFinite(calls[0].limit), "limit must be a finite number, not unbounded");
  assert.ok(calls[0].limit > 0, "limit must be positive");
});
