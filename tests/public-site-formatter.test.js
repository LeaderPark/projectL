const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatMatchCard,
  formatPlayerProfileSummary,
} = require("../scripts/Web/formatters/PublicSiteFormatter");

test("formatMatchCard builds blue and purple team rows from stored match JSON", () => {
  const card = formatMatchCard({
    id: 9,
    game_id: "KR-CODE-9",
    game_length: String(31 * 60 * 1000 + 5 * 1000),
    blue_team: JSON.stringify({
      side: 100,
      result: 1,
      players: [
        {
          playerName: "Alpha",
          championName: "Ahri",
          level: 18,
          minionScore: 212,
          lane: "MIDDLE",
          mmr: 22,
          kda: { kills: 9, deaths: 3, assist: 11 },
        },
        {
          playerName: "Bravo",
          championName: "LeeSin",
          level: 16,
          minionScore: 144,
          lane: "JUNGLE",
          mmr: 10,
          kda: { kills: 4, deaths: 5, assist: 14 },
        },
        {
          playerName: "Charlie",
          championName: "Jinx",
          level: 17,
          minionScore: 251,
          lane: "BOTTOM",
          mmr: 8,
          kda: { kills: 7, deaths: 4, assist: 8 },
        },
        {
          playerName: "Delta",
          championName: "Nautilus",
          level: 14,
          minionScore: 38,
          lane: "UTILITY",
          mmr: 6,
          kda: { kills: 2, deaths: 6, assist: 17 },
        },
        {
          playerName: "Echo",
          championName: "Renekton",
          level: 17,
          minionScore: 205,
          lane: "TOP",
          mmr: 9,
          kda: { kills: 6, deaths: 4, assist: 9 },
        },
      ],
    }),
    purple_team: JSON.stringify({
      side: 200,
      result: 0,
      players: [
        {
          playerName: "Foxtrot",
          championName: "Ornn",
          level: 16,
          minionScore: 198,
          lane: "TOP",
          mmr: -7,
          kda: { kills: 3, deaths: 6, assist: 5 },
        },
        {
          playerName: "Golf",
          championName: "Viego",
          level: 15,
          minionScore: 130,
          lane: "JUNGLE",
          mmr: -9,
          kda: { kills: 4, deaths: 8, assist: 7 },
        },
        {
          playerName: "Hotel",
          championName: "Syndra",
          level: 17,
          minionScore: 224,
          lane: "MIDDLE",
          mmr: -11,
          kda: { kills: 8, deaths: 7, assist: 4 },
        },
        {
          playerName: "India",
          championName: "KaiSa",
          level: 16,
          minionScore: 233,
          lane: "BOTTOM",
          mmr: -4,
          kda: { kills: 5, deaths: 5, assist: 4 },
        },
        {
          playerName: "Juliet",
          championName: "Rakan",
          level: 13,
          minionScore: 32,
          lane: "UTILITY",
          mmr: -3,
          kda: { kills: 1, deaths: 7, assist: 9 },
        },
      ],
    }),
  });

  assert.equal(card.durationText, "31:05");
  assert.equal(card.winningSide, "blue");
  assert.equal(card.teams.blue.players.length, 5);
  assert.equal(card.teams.purple.players.length, 5);
  assert.equal(card.teams.blue.resultText, "승리");
  assert.equal(card.teams.purple.resultText, "패배");
  assert.equal(card.teams.blue.players[0].kdaText, "9/3/11");
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
  assert.equal(summary.mmrText, "1,650");
});
