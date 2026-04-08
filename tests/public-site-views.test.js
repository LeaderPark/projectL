const test = require("node:test");
const assert = require("node:assert/strict");

const { renderLayout } = require("../scripts/Web/views/Layout");
const { renderHomePage } = require("../scripts/Web/views/HomePage");
const { renderMatchesPage } = require("../scripts/Web/views/MatchesPage");
const { renderPlayerPage } = require("../scripts/Web/views/PlayerPage");
const { renderNotFoundPage } = require("../scripts/Web/views/NotFoundPage");

const sampleCard = {
  id: 9,
  durationText: "31:05",
  winningSide: "blue",
  teams: {
    blue: {
      resultText: "승리",
      players: [
        { name: "Alpha", championName: "Ahri", lane: "MIDDLE", kdaText: "9/3/11" },
      ],
    },
    purple: {
      resultText: "패배",
      players: [
        { name: "Foxtrot", championName: "Ornn", lane: "TOP", kdaText: "3/6/5" },
      ],
    },
  },
};

test("renderLayout injects title, body, and shared assets", () => {
  const html = renderLayout({ title: "ProjectL", body: "<main>ok</main>" });

  assert.match(html, /<title>ProjectL<\/title>/);
  assert.match(html, /\/public\/site\.css/);
  assert.match(html, /\/public\/site\.js/);
  assert.match(html, /<main>ok<\/main>/);
});

test("renderHomePage renders summary cards and ranking rows", () => {
  const html = renderHomePage({
    summary: {
      totalMatchesText: "34",
      totalPlayersText: "18",
      topMmrText: "1,700",
      topWinRateText: "72%",
    },
    ranking: [
      {
        discordId: "1",
        name: "Alpha",
        mmrText: "1,700",
        recordText: "7승 3패",
        winRateText: "70%",
      },
    ],
    recentMatches: [sampleCard],
  });

  assert.match(html, /전체 내전 전적/);
  assert.match(html, /총 경기 수/);
  assert.match(html, /MMR 랭킹/);
  assert.match(html, /Alpha/);
  assert.match(html, /31:05/);
});

test("renderMatchesPage renders both teams and result labels", () => {
  const html = renderMatchesPage({
    cards: [sampleCard],
  });

  assert.match(html, /전체 경기/);
  assert.match(html, /Blue Team/);
  assert.match(html, /Purple Team/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
});

test("renderPlayerPage renders profile stats, champion rows, and recent matches", () => {
  const html = renderPlayerPage({
    profile: {
      discordId: "1",
      name: "Alpha",
      mmrText: "1,650",
      recordText: "6승 4패",
      winRateText: "60%",
      averageKdaText: "6.00",
      averageKillRateText: "64%",
      favoriteChampions: [{ name: "Ahri", recordText: "4승 1패" }],
      preferredLanes: [{ name: "MIDDLE", recordText: "5승 2패" }],
      friends: [{ name: "Bravo", recordText: "4승 1패" }],
    },
    recentMatches: [sampleCard],
  });

  assert.match(html, /Alpha/);
  assert.match(html, /승률/);
  assert.match(html, /주 챔피언/);
  assert.match(html, /최근 경기/);
  assert.match(html, /Ahri/);
  assert.match(html, /Bravo/);
});

test("renderNotFoundPage renders a friendly missing-page message", () => {
  const html = renderNotFoundPage({
    title: "플레이어를 찾을 수 없습니다",
    description: "등록된 내전 플레이어가 아니에요.",
  });

  assert.match(html, /플레이어를 찾을 수 없습니다/);
  assert.match(html, /등록된 내전 플레이어가 아니에요/);
});
