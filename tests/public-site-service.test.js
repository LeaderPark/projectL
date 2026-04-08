const test = require("node:test");
const assert = require("node:assert/strict");

const { createPublicSiteHandlers } = require("../scripts/Web/PublicSite");

test("public site handlers render the home page using the configured guild context", async () => {
  const seenGuildIds = [];
  const site = createPublicSiteHandlers({
    preferredGuildId: "guild-1",
    async listGuildSettings() {
      return [{ guild_id: "guild-fallback" }];
    },
    async getPublicSiteSummary(guildId) {
      seenGuildIds.push(guildId);
      return {
        success: true,
        data: { total_matches: 12, total_players: 8, top_mmr: 1700, top_win_rate: 72 },
      };
    },
    async getPublicLeaderboard() {
      return {
        success: true,
        data: [{ discord_id: "1", name: "Alpha", mmr: 1700, win: 7, lose: 3 }],
      };
    },
    async getPublicMatchHistory() {
      return {
        success: true,
        data: [
          {
            id: 4,
            game_id: "KR-4",
            game_length: String(24 * 60 * 1000),
            blue_team: JSON.stringify({ result: 1, players: [] }),
            purple_team: JSON.stringify({ result: 0, players: [] }),
          },
        ],
      };
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

  const html = await site.renderHomePage();

  assert.deepEqual(seenGuildIds, ["guild-1"]);
  assert.match(html, /전체 내전 전적/);
  assert.match(html, /Alpha/);
});

test("public site handlers do not guess a public guild when none is configured", async () => {
  const site = createPublicSiteHandlers({
    async getPublicSiteSummary(guildId) {
      throw new Error(`should not query summary for ${guildId}`);
    },
    async getPublicLeaderboard() {
      throw new Error("should not query leaderboard");
    },
    async getPublicMatchHistory() {
      throw new Error("should not query match history");
    },
    async getPublicPlayerProfile() {
      throw new Error("not used");
    },
    async getLatestMatched() {
      throw new Error("not used");
    },
    async searchPublicPlayers() {
      return { success: true, data: [] };
    },
  });

  const html = await site.renderHomePage();

  assert.match(html, /공개 길드 설정이 필요합니다/);
});

test("public site handlers return null for unknown player pages and map search results", async () => {
  const site = createPublicSiteHandlers({
    preferredGuildId: "guild-1",
    async listGuildSettings() {
      return [];
    },
    async getPublicSiteSummary() {
      throw new Error("not used");
    },
    async getPublicLeaderboard() {
      throw new Error("not used");
    },
    async getPublicMatchHistory() {
      throw new Error("not used");
    },
    async getPublicPlayerProfile(_guildId, discordId) {
      if (discordId === "missing") {
        return { success: false, code: "PLAYER_NOT_FOUND" };
      }

      return {
        success: true,
        data: {
          discord_id: discordId,
          name: "Alpha",
          mmr: 1600,
          win: 6,
          lose: 4,
          t_kill: 50,
          t_death: 20,
          t_assist: 40,
          t_kill_rate: 610,
          champions: JSON.stringify({ Ahri: { win: 4, lose: 1 } }),
          lanes: JSON.stringify({ MIDDLE: { win: 5, lose: 2 } }),
          friends: JSON.stringify({ Bravo: { win: 4, lose: 1 } }),
        },
      };
    },
    async getLatestMatched() {
      return {
        success: true,
        data: [
          {
            id: 9,
            game_id: "KR-9",
            game_length: String(30 * 60 * 1000),
            blue_team: JSON.stringify({ result: 1, players: [] }),
            purple_team: JSON.stringify({ result: 0, players: [] }),
          },
        ],
      };
    },
    async searchPublicPlayers() {
      return {
        success: true,
        data: [{ discord_id: "1", name: "Alpha", mmr: 1600 }],
      };
    },
  });

  const missingHtml = await site.renderPlayerPage("missing");
  const playerHtml = await site.renderPlayerPage("1");
  const searchResults = await site.searchPlayers("Al");

  assert.equal(missingHtml, null);
  assert.match(playerHtml, /Alpha/);
  assert.deepEqual(searchResults, [{ discordId: "1", name: "Alpha" }]);
});
