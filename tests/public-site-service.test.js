const test = require("node:test");
const assert = require("node:assert/strict");

const { createPublicSiteHandlers } = require("../scripts/Web/PublicSite");

function buildAssetManifest() {
  return {
    championAssets: {
      ahri: { imageUrl: "https://cdn.test/champion/Ahri.png" },
      ornn: { imageUrl: "https://cdn.test/champion/Ornn.png" },
    },
    itemAssets: {
      6655: { imageUrl: "https://cdn.test/item/6655.png" },
      3020: { imageUrl: "https://cdn.test/item/3020.png" },
      3157: { imageUrl: "https://cdn.test/item/3157.png" },
      4645: { imageUrl: "https://cdn.test/item/4645.png" },
      3089: { imageUrl: "https://cdn.test/item/3089.png" },
      3135: { imageUrl: "https://cdn.test/item/3135.png" },
      3363: { imageUrl: "https://cdn.test/item/3363.png" },
      3068: { imageUrl: "https://cdn.test/item/3068.png" },
      3047: { imageUrl: "https://cdn.test/item/3047.png" },
    },
    spellAssets: {
      4: { imageUrl: "https://cdn.test/spell/Flash.png" },
      14: { imageUrl: "https://cdn.test/spell/Ignite.png" },
      12: { imageUrl: "https://cdn.test/spell/Ghost.png" },
    },
    runeAssets: {
      8112: { imageUrl: "https://cdn.test/rune/Electrocute.png" },
      8439: { imageUrl: "https://cdn.test/rune/Resolve.png" },
    },
  };
}

test("public site handlers render the home page using the configured guild context", async () => {
  const seenGuildIds = [];
  const site = createPublicSiteHandlers({
    preferredGuildId: "guild-1",
    async getChampionNameMap() {
      return {
        ahri: "아리",
      };
    },
    async getRiotAssetManifest() {
      return buildAssetManifest();
    },
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
    async getPublicMatchById() {
      throw new Error("not used");
    },
    async getPublicMatchHistory() {
      return {
        success: true,
        data: [
          {
            id: 4,
            game_id: "KR-4",
            game_length: String(24 * 60 * 1000),
            played_at_kst: "2024-04-09 21:15:00",
            blue_team: JSON.stringify({
              result: 1,
              totalKill: 17,
              players: [
                {
                  playerName: "Alpha",
                  championName: "Ahri",
                  lane: "MIDDLE",
                  level: 16,
                  totalDamage: 22880,
                  visionScore: 15,
                  minionScore: 188,
                  spell1: 4,
                  spell2: 14,
                  keystoneId: 8112,
                  inventory: {
                    item1: 6655,
                    item2: 3020,
                    item3: 3157,
                    item4: 4645,
                    item5: 3089,
                    item6: 3135,
                    trinket: 3363,
                  },
                  kda: { kills: 8, deaths: 2, assist: 7 },
                },
              ],
            }),
            purple_team: JSON.stringify({
              result: 0,
              totalKill: 9,
              players: [
                {
                  playerName: "Foxtrot",
                  championName: "Ornn",
                  lane: "TOP",
                  level: 14,
                  totalDamage: 14020,
                  visionScore: 8,
                  minionScore: 144,
                  spell1: 12,
                  spell2: 4,
                  keystoneId: 8439,
                  inventory: {
                    item1: 3068,
                    item2: 3047,
                  },
                  kda: { kills: 3, deaths: 5, assist: 4 },
                },
              ],
            }),
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
  assert.match(html, /Ahri\.png/);
  assert.match(html, /2024\.04\.09 21:15 KST/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
});

test("public site handlers prefer the guild id passed into renderers", async () => {
  const seenGuildIds = [];
  const site = createPublicSiteHandlers({
    preferredGuildId: "guild-fallback",
    async getChampionNameMap() {
      return {
        ahri: "아리",
      };
    },
    async getRiotAssetManifest() {
      return buildAssetManifest();
    },
    async getPublicSiteSummary(guildId) {
      seenGuildIds.push(guildId);
      return {
        success: true,
        data: { total_matches: 5, total_players: 3, top_win_rate: 80 },
      };
    },
    async getPublicLeaderboard(guildId) {
      seenGuildIds.push(guildId);
      return { success: true, data: [] };
    },
    async getPublicMatchHistory(guildId) {
      seenGuildIds.push(guildId);
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

  await site.renderHomePage("guild-9");

  assert.deepEqual(seenGuildIds, ["guild-9", "guild-9", "guild-9"]);
});

test("public site handlers do not guess a public guild when none is configured", async () => {
  const site = createPublicSiteHandlers({
    async getChampionNameMap() {
      throw new Error("should not query champion names");
    },
    async getRiotAssetManifest() {
      throw new Error("should not query asset manifest");
    },
    async getPublicSiteSummary(guildId) {
      throw new Error(`should not query summary for ${guildId}`);
    },
    async getPublicLeaderboard() {
      throw new Error("should not query leaderboard");
    },
    async getPublicMatchById() {
      throw new Error("should not query match detail");
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
    async getChampionNameMap() {
      return {
        ahri: "아리",
      };
    },
    async getRiotAssetManifest() {
      return buildAssetManifest();
    },
    async listGuildSettings() {
      return [];
    },
    async getPublicSiteSummary() {
      throw new Error("not used");
    },
    async getPublicLeaderboard() {
      throw new Error("not used");
    },
    async getPublicMatchById() {
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
            played_at_kst: "2024-04-08 20:05:00",
            blue_team: JSON.stringify({
              result: 1,
              players: [
                {
                  playerName: "Alpha",
                  championName: "Ahri",
                  lane: "MIDDLE",
                  level: 18,
                  minionScore: 212,
                  totalDamage: 36200,
                  visionScore: 19,
                  spell1: 4,
                  spell2: 14,
                  keystoneId: 8112,
                  inventory: {
                    item1: 6655,
                    item2: 3020,
                    item3: 3157,
                    item4: 4645,
                    item5: 3089,
                    item6: 3135,
                    trinket: 3363,
                  },
                  kda: { kills: 9, deaths: 3, assist: 11 },
                },
              ],
            }),
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

  const missingHtml = await site.renderPlayerPage("guild-1", "missing");
  const playerHtml = await site.renderPlayerPage("guild-1", "1");
  const searchResults = await site.searchPlayers("guild-1", "Al");

  assert.equal(missingHtml, null);
  assert.match(playerHtml, /Alpha/);
  assert.match(playerHtml, /아리/);
  assert.match(playerHtml, /미드/);
  assert.match(playerHtml, /Ahri\.png/);
  assert.match(playerHtml, /2024\.04\.08 20:05 KST/);
  assert.match(playerHtml, /승리/);
  assert.match(playerHtml, /패배/);
  assert.deepEqual(searchResults, [{ discordId: "1", name: "Alpha" }]);
});

test("public site handlers render a match detail page and return null for unknown matches", async () => {
  const site = createPublicSiteHandlers({
    preferredGuildId: "guild-1",
    async getChampionNameMap() {
      return {
        ahri: "아리",
      };
    },
    async getRiotAssetManifest() {
      return buildAssetManifest();
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
    async getPublicPlayerProfile() {
      throw new Error("not used");
    },
    async getLatestMatched() {
      throw new Error("not used");
    },
    async getPublicMatchById(_guildId, matchId) {
      if (String(matchId) === "404") {
        return { success: false, code: "MATCH_NOT_FOUND" };
      }

      return {
        success: true,
        data: {
          id: 9,
          game_id: "KR-9",
          game_length: String(30 * 60 * 1000),
          played_at_kst: "2024-04-07 19:55:00",
          blue_team: JSON.stringify({
            result: 1,
            totalKill: 48,
            players: [
              {
                playerName: "Alpha",
                championName: "Ahri",
                lane: "MIDDLE",
                level: 18,
                minionScore: 212,
                performanceScore: 22,
                totalDamage: 36200,
                visionScore: 19,
                spell1: 4,
                spell2: 14,
                keystoneId: 8112,
                inventory: {
                  item1: 6655,
                  item2: 3020,
                  item3: 3157,
                  item4: 4645,
                  item5: 3089,
                  item6: 3135,
                  trinket: 3363,
                },
                kda: { kills: 9, deaths: 3, assist: 11 },
              },
            ],
          }),
          purple_team: JSON.stringify({
            result: 0,
            totalKill: 31,
            players: [],
          }),
        },
      };
    },
    async searchPublicPlayers() {
      throw new Error("not used");
    },
  });

  const missingHtml = await site.renderMatchDetailPage("guild-1", "404");
  const matchHtml = await site.renderMatchDetailPage("guild-1", "9");

  assert.equal(missingHtml, null);
  assert.match(matchHtml, /경기 상세/);
  assert.match(matchHtml, /36,200/);
  assert.match(matchHtml, /Electrocute\.png/);
  assert.match(matchHtml, /2024\.04\.07 19:55 KST/);
  assert.match(matchHtml, /승리/);
  assert.match(matchHtml, /패배/);
});
