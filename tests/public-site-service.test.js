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
      8400: { imageUrl: "https://cdn.test/rune/Resolve.png" },
      8200: { imageUrl: "https://cdn.test/rune/Sorcery.png" },
      8300: { imageUrl: "https://cdn.test/rune/Inspiration.png" },
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
            game_id: "DEMO-KR-001",
            game_length: String(30 * 60 * 1000 + 50 * 1000),
            played_at_kst: "2026-04-07 20:10:00",
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
                  subStyleId: 8200,
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
                  subStyleId: 8300,
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
  assert.match(html, /2026\.04\.07 20:10/);
  assert.match(html, /Sorcery\.png/);
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

test("public site handlers render the ranking page using the scoped guild context", async () => {
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
    async getPublicSiteSummary() {
      throw new Error("not used");
    },
    async getPublicLeaderboard(guildId, limit) {
      seenGuildIds.push({ guildId, limit });
      return {
        success: true,
        data: [
          { discord_id: "1", name: "Alpha", mmr: 1700, win: 7, lose: 3 },
          { discord_id: "2", name: "Bravo", mmr: 1650, win: 6, lose: 4 },
        ],
      };
    },
    async getPublicMatchHistory() {
      throw new Error("not used");
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

  const html = await site.renderRankingPage("guild-9");

  assert.deepEqual(seenGuildIds, [{ guildId: "guild-9", limit: undefined }]);
  assert.match(html, /전체 랭킹/);
  assert.match(html, /Alpha/);
  assert.match(html, /Bravo/);
  assert.match(html, /\/guild-9\/players\/1/);
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
      return {
        success: true,
        data: { total_matches: 1, total_players: 1, top_win_rate: 100 },
      };
    },
    async getPublicLeaderboard() {
      return { success: true, data: [] };
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
            game_id: "DEMO-KR-002",
            game_length: String(30 * 60 * 1000),
            played_at_kst: "2026-04-08 21:05:00",
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
                  subStyleId: 8200,
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
  assert.match(playerHtml, /2026\.04\.08 21:05/);
  assert.match(playerHtml, /승리/);
  assert.match(playerHtml, /패배/);
  assert.deepEqual(searchResults, [{ discordId: "1", name: "Alpha" }]);
});

test("public site handlers keep representative riot names without Discord lookups and keep Riot accounts on the player page", async () => {
  let discordLookupCount = 0;
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
    async resolveDiscordDisplayNames() {
      discordLookupCount += 1;
      return {};
    },
    async getPublicSiteSummary() {
      return {
        success: true,
        data: { total_matches: 5, total_players: 2, top_win_rate: 70 },
      };
    },
    async getPublicLeaderboard() {
      return {
        success: true,
        data: [{ discord_id: "1", name: "Stored Riot", mmr: 1700, win: 7, lose: 3 }],
      };
    },
    async getPublicMatchHistory() {
      return { success: true, data: [] };
    },
    async getPublicMatchById() {
      throw new Error("not used");
    },
    async getPublicPlayerProfile() {
      return {
        success: true,
        data: {
          discord_id: "1",
          name: "Stored Riot",
          win: 6,
          lose: 4,
          t_kill: 50,
          t_death: 20,
          t_assist: 40,
          t_kill_rate: 610,
          champions: JSON.stringify({ Ahri: { win: 4, lose: 1 } }),
          lanes: JSON.stringify({ MIDDLE: { win: 5, lose: 2 } }),
          friends: JSON.stringify({ Bravo: { win: 4, lose: 1 } }),
          riotAccounts: [
            { riotGameName: "Stored", riotTagLine: "KR1", displayName: "Stored#KR1" },
            { riotGameName: "Smurf", riotTagLine: "JP1", displayName: "Smurf#JP1" },
          ],
        },
      };
    },
    async getLatestMatched() {
      return { success: true, data: [] };
    },
    async searchPublicPlayers() {
      return {
        success: true,
        data: [{ discord_id: "1", name: "Stored Riot", mmr: 1600 }],
      };
    },
  });

  const rankingHtml = await site.renderRankingPage("guild-1");
  const playerHtml = await site.renderPlayerPage("guild-1", "1");
  const searchResults = await site.searchPlayers("guild-1", "Stored");

  assert.equal(discordLookupCount, 0);
  assert.match(rankingHtml, /Stored Riot/);
  assert.match(playerHtml, /Stored Riot/);
  assert.match(playerHtml, /Stored#KR1/);
  assert.match(playerHtml, /Smurf#JP1/);
  assert.deepEqual(searchResults, [{ discordId: "1", name: "Stored Riot" }]);
});

test("public site handlers rewrite linked match participants to the representative riot name without Discord lookups", async () => {
  let discordLookupCount = 0;
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
    async resolveDiscordDisplayNames() {
      discordLookupCount += 1;
      return {};
    },
    async resolveUsersByPuuids() {
      return {
        success: true,
        data: [
          {
            linked_puuid: "puuid-alpha",
            discord_id: "1",
            name: "대표계정#KR1",
          },
        ],
      };
    },
    async getPublicSiteSummary() {
      return {
        success: true,
        data: { total_matches: 1, total_players: 1, top_win_rate: 100 },
      };
    },
    async getPublicLeaderboard() {
      return { success: true, data: [] };
    },
    async getPublicMatchHistory() {
      return {
        success: true,
        data: [
          {
            id: 4,
            game_id: "DEMO-KR-001",
            game_length: String(30 * 60 * 1000),
            played_at_kst: "2026-04-07 20:10:00",
            blue_team: JSON.stringify({
              result: 1,
              totalKill: 17,
              players: [
                {
                  puuid: "puuid-alpha",
                  playerName: "Stored#KR1",
                  championName: "Ahri",
                  lane: "MIDDLE",
                  level: 16,
                  totalDamage: 22880,
                  visionScore: 15,
                  minionScore: 188,
                  spell1: 4,
                  spell2: 14,
                  keystoneId: 8112,
                  subStyleId: 8200,
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
              players: [],
            }),
          },
        ],
      };
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

  const matchesHtml = await site.renderMatchesPage("guild-1");
  const homeHtml = await site.renderHomePage("guild-1");

  assert.equal(discordLookupCount, 0);
  assert.match(matchesHtml, /대표계정#KR1/);
  assert.doesNotMatch(matchesHtml, /Stored#KR1/);
  assert.match(homeHtml, /대표계정#KR1/);
  assert.doesNotMatch(homeHtml, /Stored#KR1/);
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
          game_id: "DEMO-KR-001",
          game_length: String(30 * 60 * 1000),
          played_at_kst: "2026-04-07 20:10:00",
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
                subStyleId: 8200,
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
  assert.match(matchHtml, />플레이어</);
  assert.match(matchHtml, />OP Score</);
  assert.match(matchHtml, />KDA</);
  assert.match(matchHtml, /36,200/);
  assert.match(matchHtml, /Total Kill/);
  assert.match(matchHtml, /match-scoreboard__build-items/);
  assert.match(matchHtml, /Electrocute\.png/);
  assert.match(matchHtml, /2026\.04\.07 20:10/);
  assert.match(matchHtml, /승리/);
  assert.match(matchHtml, /패배/);
});

test("public site handlers return a player refresh redirect result with the refresh status", async () => {
  const refreshCalls = [];
  const site = createPublicSiteHandlers({
    preferredGuildId: "guild-1",
    async getChampionNameMap() {
      return {};
    },
    async getRiotAssetManifest() {
      return buildAssetManifest();
    },
    async refreshPlayerRiotIdentity(guildId, discordId) {
      refreshCalls.push({ guildId, discordId });
      return {
        success: true,
        status: "updated",
      };
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

  const result = await site.handlePlayerRiotIdentityRefresh("guild-1", "discord-1");

  assert.deepEqual(refreshCalls, [{ guildId: "guild-1", discordId: "discord-1" }]);
  assert.deepEqual(result, {
    statusCode: 303,
    location: "/guild-1/players/discord-1?refresh=updated",
  });
});
