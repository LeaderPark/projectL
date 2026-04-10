const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPublicSiteFormatterOptions,
  formatHomeSummary,
  formatLeaderboardEntry,
  formatMatchCard,
  formatMatchDetail,
  formatPlayerProfileSummary,
} = require("../scripts/Web/formatters/PublicSiteFormatter");

test("formatMatchCard builds blue and purple team rows from stored match JSON", () => {
  const card = formatMatchCard({
    id: 1,
    game_id: "DEMO-KR-001",
    game_length: String(30 * 60 * 1000 + 50 * 1000),
    played_at_kst: "2026-04-07 20:10:00",
    blue_team: JSON.stringify({
      side: 100,
      result: 1,
      players: [
        {
          playerName: "테스트 알파",
          championName: "Renekton",
          level: 17,
          minionScore: 210,
          lane: "TOP",
          performanceScore: 18,
          kda: { kills: 6, deaths: 3, assist: 8 },
        },
        {
          playerName: "테스트 브라보",
          championName: "LeeSin",
          level: 16,
          minionScore: 154,
          lane: "JUNGLE",
          mmr: 15,
          kda: { kills: 4, deaths: 4, assist: 12 },
        },
        {
          playerName: "테스트 찰리",
          championName: "Ahri",
          level: 18,
          minionScore: 236,
          lane: "MIDDLE",
          mmr: 22,
          kda: { kills: 9, deaths: 2, assist: 7 },
        },
        {
          playerName: "테스트 델타",
          championName: "Jinx",
          level: 17,
          minionScore: 248,
          lane: "BOTTOM",
          mmr: 19,
          kda: { kills: 8, deaths: 3, assist: 9 },
        },
        {
          playerName: "테스트 에코",
          championName: "Thresh",
          level: 14,
          minionScore: 34,
          lane: "UTILITY",
          mmr: 14,
          kda: { kills: 1, deaths: 4, assist: 17 },
        },
      ],
    }),
    purple_team: JSON.stringify({
      side: 200,
      result: 0,
      players: [
        {
          playerName: "테스트 폭스트롯",
          championName: "Aatrox",
          level: 16,
          minionScore: 201,
          lane: "TOP",
          mmr: 7,
          kda: { kills: 3, deaths: 6, assist: 4 },
        },
        {
          playerName: "테스트 골프",
          championName: "Viego",
          level: 15,
          minionScore: 147,
          lane: "JUNGLE",
          mmr: 8,
          kda: { kills: 5, deaths: 5, assist: 3 },
        },
        {
          playerName: "테스트 호텔",
          championName: "Orianna",
          level: 16,
          minionScore: 219,
          lane: "MIDDLE",
          mmr: 6,
          kda: { kills: 4, deaths: 7, assist: 5 },
        },
        {
          playerName: "테스트 인디아",
          championName: "Xayah",
          level: 16,
          minionScore: 231,
          lane: "BOTTOM",
          mmr: 9,
          kda: { kills: 6, deaths: 5, assist: 2 },
        },
        {
          playerName: "테스트 줄리엣",
          championName: "Lulu",
          level: 13,
          minionScore: 29,
          lane: "UTILITY",
          mmr: 5,
          kda: { kills: 0, deaths: 6, assist: 10 },
        },
      ],
    }),
  });

  assert.equal(card.durationText, "30:50");
  assert.equal(card.playedAtText, "2026.04.07 20:10");
  assert.equal(card.winningSide, "blue");
  assert.equal(card.href, "/matches/1");
  assert.equal(card.teams.blue.players.length, 5);
  assert.equal(card.teams.purple.players.length, 5);
  assert.equal(card.teams.blue.resultText, "승리");
  assert.equal(card.teams.purple.resultText, "패배");
  assert.equal(card.teams.blue.players[0].kdaText, "6/3/8");
  assert.equal(card.teams.blue.players[0].performanceScore, 18);
  assert.equal(card.teams.blue.players[0].damageText, "0");
  assert.equal(card.teams.blue.totalKillsText, "28");
  assert.equal(card.teams.purple.totalKillsText, "18");
  assert.equal(card.teams.blue.players[1].performanceScore, 15);
});

test("formatMatchCard localizes champion names and lanes when translators are provided", () => {
  const card = formatMatchCard(
    {
      id: 10,
      game_id: "KR-CODE-10",
      game_length: String(20 * 60 * 1000),
      played_at_kst: "2024-04-10 22:05:00",
      blue_team: JSON.stringify({
        result: 1,
        players: [
          {
            playerName: "Alpha",
            championName: "Ahri",
            lane: "MIDDLE",
            kda: { kills: 8, deaths: 2, assist: 6 },
          },
        ],
      }),
      purple_team: JSON.stringify({
        result: 0,
        players: [
          {
            playerName: "Bravo",
            championName: "LeeSin",
            lane: "JUNGLE",
            kda: { kills: 2, deaths: 8, assist: 3 },
          },
        ],
      }),
    },
    {
      translateChampionName(value) {
        return {
          Ahri: "아리",
          LeeSin: "리 신",
        }[value] ?? value;
      },
      translateLaneName(value) {
        return {
          MIDDLE: "미드",
          JUNGLE: "정글",
        }[value] ?? value;
      },
    }
  );

  assert.equal(card.teams.blue.players[0].championName, "아리");
  assert.equal(card.teams.blue.players[0].lane, "미드");
  assert.equal(card.teams.purple.players[0].championName, "리 신");
  assert.equal(card.teams.purple.players[0].lane, "정글");
});

test("formatMatchCard preserves player perspective result overrides", () => {
  const card = formatMatchCard({
    id: 11,
    game_id: "DEMO-KR-011",
    game_length: String(24 * 60 * 1000),
    played_at_kst: "2026-04-10 19:20:00",
    player_result_text: "패배",
    player_result_tone: "red",
    blue_team: JSON.stringify({
      result: 0,
      players: [
        {
          playerName: "Alpha",
          championName: "Ahri",
          lane: "MIDDLE",
          kda: { kills: 4, deaths: 6, assist: 5 },
        },
      ],
    }),
    purple_team: JSON.stringify({
      result: 1,
      players: [
        {
          playerName: "Bravo",
          championName: "LeeSin",
          lane: "JUNGLE",
          kda: { kills: 8, deaths: 2, assist: 9 },
        },
      ],
    }),
  });

  assert.equal(card.resultText, "패배");
  assert.equal(card.resultTone, "red");
  assert.equal(card.winningSide, "purple");
});

test("formatMatchCard builds OP.GG-style row metadata and image assets when asset lookups are provided", () => {
  const card = formatMatchCard(
    {
      id: 12,
      game_id: "DEMO-KR-001",
      game_length: String(26 * 60 * 1000),
      played_at_kst: "2026-04-07 20:10:00",
      blue_team: JSON.stringify({
        result: 1,
        totalKill: 28,
        players: [
          {
            playerName: "테스트 찰리",
            championName: "Ahri",
            lane: "MIDDLE",
            level: 18,
            totalDamage: 36200,
            visionScore: 19,
            minionScore: 236,
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
            kda: { kills: 9, deaths: 2, assist: 7 },
          },
        ],
      }),
      purple_team: JSON.stringify({
        result: 0,
        totalKill: 9,
        players: [],
      }),
    },
    buildPublicSiteFormatterOptions({
      championNameMap: { ahri: "아리" },
      championAssets: {
        ahri: { imageUrl: "https://cdn.test/champion/Ahri.png" },
      },
      itemAssets: {
        6655: { imageUrl: "https://cdn.test/item/6655.png" },
        3020: { imageUrl: "https://cdn.test/item/3020.png" },
        3157: { imageUrl: "https://cdn.test/item/3157.png" },
        4645: { imageUrl: "https://cdn.test/item/4645.png" },
        3089: { imageUrl: "https://cdn.test/item/3089.png" },
        3135: { imageUrl: "https://cdn.test/item/3135.png" },
        3363: { imageUrl: "https://cdn.test/item/3363.png" },
      },
      spellAssets: {
        4: { imageUrl: "https://cdn.test/spell/Flash.png" },
        14: { imageUrl: "https://cdn.test/spell/Ignite.png" },
      },
      runeAssets: {
        8112: { imageUrl: "https://cdn.test/rune/Electrocute.png" },
        8200: { imageUrl: "https://cdn.test/rune/Sorcery.png" },
      },
    })
  );

  assert.equal(card.toggleId, "match-12-toggle");
  assert.equal(card.detailId, "match-12-detail");
  assert.equal(card.playedAtText, "2026.04.07 20:10");
  assert.deepEqual(
    card.tabs.map((tab) => tab.label),
    ["종합", "OP 스코어", "팀 분석", "빌드", "기타"]
  );
  assert.equal(
    card.teams.blue.players[0].championImageUrl,
    "https://cdn.test/champion/Ahri.png"
  );
  assert.equal(
    card.teams.blue.players[0].spellAssets[0].imageUrl,
    "https://cdn.test/spell/Flash.png"
  );
  assert.equal(
    card.teams.blue.players[0].keystoneImageUrl,
    "https://cdn.test/rune/Electrocute.png"
  );
  assert.equal(card.teams.blue.players[0].secondaryRuneId, 8200);
  assert.equal(
    card.teams.blue.players[0].secondaryRuneImageUrl,
    "https://cdn.test/rune/Sorcery.png"
  );
  assert.equal(
    card.teams.blue.players[0].itemAssets[0].imageUrl,
    "https://cdn.test/item/6655.png"
  );
});

test("formatMatchCard formats Date-based played_at_kst values as wall-clock text without a timezone suffix", () => {
  const card = formatMatchCard({
    id: 13,
    game_id: "DEMO-KR-013",
    game_length: String(25 * 60 * 1000),
    played_at_kst: new Date(Date.UTC(2026, 3, 9, 22, 15, 0)),
    blue_team: JSON.stringify({
      result: 1,
      players: [],
    }),
    purple_team: JSON.stringify({
      result: 0,
      players: [],
    }),
  });

  assert.equal(card.playedAtText, "2026.04.09 22:15");
});

test("formatMatchDetail builds detail-friendly rows with items, spells, and rune ids", () => {
  const detail = formatMatchDetail({
    id: 1,
    game_id: "DEMO-KR-001",
    game_length: String(30 * 60 * 1000 + 50 * 1000),
    played_at_kst: "2026-04-07 20:10:00",
    blue_team: JSON.stringify({
      side: 100,
      result: 1,
      totalKill: 28,
      players: [
        {
          playerName: "테스트 찰리",
          championName: "Ahri",
          level: 18,
          minionScore: 236,
          lane: "MIDDLE",
          performanceScore: 22,
          visionScore: 19,
          totalDamage: 36200,
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
          kda: { kills: 9, deaths: 2, assist: 7 },
        },
      ],
    }),
    purple_team: JSON.stringify({
      side: 200,
      result: 0,
      totalKill: 18,
      players: [
        {
          playerName: "테스트 폭스트롯",
          championName: "Aatrox",
          level: 16,
          minionScore: 201,
          lane: "TOP",
          performanceScore: 7,
          visionScore: 12,
          totalDamage: 21316,
          spell1: 12,
          spell2: 4,
          keystoneId: 8010,
          subStyleId: 8400,
          inventory: {
            item1: 6631,
            item2: 3047,
            item3: 3071,
            item4: 3053,
            item5: 3065,
            item6: 3026,
            trinket: 3364,
          },
          kda: { kills: 3, deaths: 6, assist: 4 },
        },
      ],
    }),
  });

  assert.equal(detail.id, 1);
  assert.equal(detail.gameId, "DEMO-KR-001");
  assert.equal(detail.durationText, "30:50");
  assert.equal(detail.playedAtText, "2026.04.07 20:10");
  assert.equal(detail.teams.blue.totalKillsText, "28");
  assert.equal(detail.teams.purple.totalKillsText, "18");
  assert.deepEqual(detail.teams.blue.players[0].itemIds, [
    6655,
    3020,
    3157,
    4645,
    3089,
    3135,
    3363,
  ]);
  assert.deepEqual(detail.teams.blue.players[0].spellIds, [4, 14]);
  assert.equal(detail.teams.blue.players[0].keystoneId, 8112);
  assert.equal(detail.teams.blue.players[0].secondaryRuneId, 8200);
  assert.equal(detail.teams.blue.players[0].damageText, "36,200");
  assert.equal(detail.teams.blue.players[0].visionScoreText, "19");
  assert.equal(detail.teams.purple.players[0].secondaryRuneId, 8400);
});

test("formatPlayerProfileSummary calculates win rate and average kda", () => {
  const summary = formatPlayerProfileSummary({
    name: "Alpha",
    mmr: 1650,
    win: 6,
    lose: 4,
    t_kill: 52,
    t_death: 15,
    t_assist: 38,
    t_kill_rate: 640,
  });

  assert.equal(summary.games, 10);
  assert.equal(summary.recordText, "6승 4패");
  assert.equal(summary.winRateText, "60%");
  assert.equal(summary.averageKdaText, "6.00");
  assert.equal(summary.averageKillRateText, "64%");
  assert.equal("mmrText" in summary, false);
});

test("formatPlayerProfileSummary localizes champion and lane aggregates when translators are provided", () => {
  const summary = formatPlayerProfileSummary(
    {
      name: "Alpha",
      win: 6,
      lose: 4,
      t_kill: 52,
      t_death: 15,
      t_assist: 38,
      t_kill_rate: 640,
      champions: JSON.stringify({ Ahri: { win: 4, lose: 1 } }),
      lanes: JSON.stringify({ MIDDLE: { win: 5, lose: 2 } }),
      friends: JSON.stringify({ Bravo: { win: 4, lose: 1 } }),
    },
    {
      translateChampionName(value) {
        return {
          Ahri: "아리",
        }[value] ?? value;
      },
      translateLaneName(value) {
        return {
          MIDDLE: "미드",
        }[value] ?? value;
      },
    }
  );

  assert.equal(summary.favoriteChampions[0].name, "아리");
  assert.equal(summary.preferredLanes[0].name, "미드");
  assert.equal(summary.friends[0].name, "Bravo");
});

test("formatLeaderboardEntry omits exact mmr text from the public ranking model", () => {
  const row = formatLeaderboardEntry({
    discord_id: "1",
    name: "Alpha",
    mmr: 1700,
    win: 7,
    lose: 3,
  });

  assert.equal(row.discordId, "1");
  assert.equal(row.name, "Alpha");
  assert.equal(row.recordText, "7승 3패");
  assert.equal(row.winRateText, "70%");
  assert.equal("mmrText" in row, false);
});

test("formatHomeSummary omits the top mmr field from the public summary model", () => {
  const summary = formatHomeSummary({
    total_matches: 12,
    total_players: 8,
    top_mmr: 1900,
    top_win_rate: 75,
  });

  assert.equal(summary.totalMatchesText, "12");
  assert.equal(summary.totalPlayersText, "8");
  assert.equal(summary.topWinRateText, "75%");
  assert.equal("topMmrText" in summary, false);
});
