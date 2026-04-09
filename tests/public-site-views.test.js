const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const { renderLayout } = require("../scripts/Web/views/Layout");
const { renderLandingPage } = require("../scripts/Web/views/LandingPage");
const { renderHomePage } = require("../scripts/Web/views/HomePage");
const { renderMatchesPage } = require("../scripts/Web/views/MatchesPage");
const { renderMatchDetailPage } = require("../scripts/Web/views/MatchDetailPage");
const { renderPlayerPage } = require("../scripts/Web/views/PlayerPage");
const { renderNotFoundPage } = require("../scripts/Web/views/NotFoundPage");
const { renderMatchCard } = require("../scripts/Web/views/ViewHelpers");

const sampleCard = {
  id: 9,
  href: "/matches/9",
  toggleId: "match-9-toggle",
  detailId: "match-9-detail",
  durationText: "31:05",
  playedAtText: "2024.04.09 21:15 KST",
  winningSide: "blue",
  tabs: [
    { id: "summary", label: "종합" },
    { id: "op-score", label: "OP 스코어" },
    { id: "team-analysis", label: "팀 분석" },
    { id: "build", label: "빌드" },
    { id: "other", label: "기타" },
  ],
  teams: {
    blue: {
      resultText: "승리",
      totalKillsText: "48",
      players: [
        {
          name: "Alpha",
          championName: "Ahri",
          championImageUrl: "https://cdn.test/champion/Ahri.png",
          lane: "MIDDLE",
          kdaText: "9/3/11",
          damageText: "36,200",
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
            { imageUrl: "https://cdn.test/spell/Ignite.png", name: "점화" },
          ],
          keystoneImageUrl: "https://cdn.test/rune/Electrocute.png",
          keystoneName: "감전",
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6655.png", name: "루덴의 동반자" },
            { imageUrl: "https://cdn.test/item/3020.png", name: "마법사의 신발" },
          ],
        },
      ],
    },
    purple: {
      resultText: "패배",
      totalKillsText: "31",
      players: [
        {
          name: "Foxtrot",
          championName: "Ornn",
          championImageUrl: "https://cdn.test/champion/Ornn.png",
          lane: "TOP",
          kdaText: "3/6/5",
          damageText: "21,316",
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Ghost.png", name: "유체화" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneImageUrl: "https://cdn.test/rune/Resolve.png",
          keystoneName: "여진",
          itemAssets: [
            { imageUrl: "https://cdn.test/item/3068.png", name: "태양불꽃 방패" },
            { imageUrl: "https://cdn.test/item/3047.png", name: "판금 장화" },
          ],
        },
      ],
    },
  },
};

const sampleMatchDetail = {
  ...sampleCard,
  gameId: "KR-9",
  teams: {
    blue: {
      ...sampleCard.teams.blue,
      players: [
        {
          name: "Alpha",
          championName: "Ahri",
          championImageUrl: "https://cdn.test/champion/Ahri.png",
          lane: "미드",
          level: 18,
          kdaText: "9/3/11",
          performanceScore: 22,
          damageText: "36,200",
          visionScoreText: "19",
          minionScoreText: "212",
          csPerMinuteText: "6.8",
          spellIds: [4, 14],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
            { imageUrl: "https://cdn.test/spell/Ignite.png", name: "점화" },
          ],
          keystoneId: 8112,
          keystoneImageUrl: "https://cdn.test/rune/Electrocute.png",
          itemIds: [6655, 3020, 3157, 4645, 3089, 3135, 3363],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6655.png", name: "루덴의 동반자" },
            { imageUrl: "https://cdn.test/item/3020.png", name: "마법사의 신발" },
          ],
        },
      ],
    },
    purple: {
      ...sampleCard.teams.purple,
      players: [
        {
          name: "Foxtrot",
          championName: "Ornn",
          championImageUrl: "https://cdn.test/champion/Ornn.png",
          lane: "탑",
          level: 16,
          kdaText: "3/6/5",
          performanceScore: -7,
          damageText: "21,316",
          visionScoreText: "8",
          minionScoreText: "198",
          csPerMinuteText: "6.4",
          spellIds: [12, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Ghost.png", name: "유체화" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8439,
          keystoneImageUrl: "https://cdn.test/rune/Resolve.png",
          itemIds: [3068, 3047, 4401, 3075, 3109, 3143, 3364],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/3068.png", name: "태양불꽃 방패" },
            { imageUrl: "https://cdn.test/item/3047.png", name: "판금 장화" },
          ],
        },
      ],
    },
  },
};

test("renderLayout injects title, body, and shared assets", () => {
  const html = renderLayout({
    title: "마법공학 분류모자",
    guildId: "123456789",
    body: "<main>ok</main>",
  });

  assert.match(html, /<title>마법공학 분류모자<\/title>/);
  assert.match(html, /\/public\/site\.css\?v=\d+/);
  assert.match(html, /\/public\/site\.js\?v=\d+/);
  assert.match(html, /<main>ok<\/main>/);
  assert.match(html, /action="\/123456789\/players"/);
  assert.match(html, /href="\/123456789"/);
  assert.match(html, /href="\/123456789\/matches"/);
  assert.match(html, /data-search-endpoint="\/123456789\/api\/search"/);
  assert.match(html, /마법공학 분류모자 전적/);
});

test("renderLandingPage renders only a server-id entry form", () => {
  const html = renderLandingPage();

  assert.match(html, /서버 아이디/);
  assert.match(html, /마법공학 분류모자 서버 선택/);
  assert.match(html, /<form/);
  assert.match(html, /name="serverId"/);
  assert.doesNotMatch(html, /ProjectL/);
  assert.doesNotMatch(html, /site-header/);
});

test("renderHomePage renders summary cards and ranking rows", () => {
  const html = renderHomePage({
    guildId: "123456789",
    summary: {
      totalMatchesText: "34",
      totalPlayersText: "18",
      topWinRateText: "72%",
    },
    ranking: [
      {
        discordId: "1",
        name: "Alpha",
        recordText: "7승 3패",
        winRateText: "70%",
      },
    ],
    recentMatches: [sampleCard],
  });

  assert.match(html, /전체 내전 전적/);
  assert.match(html, /마법공학 분류모자 Competitive Board/);
  assert.match(html, /총 경기 수/);
  assert.match(html, /공개 랭킹/);
  assert.match(html, /Alpha/);
  assert.match(html, /31:05/);
  assert.match(html, /2024\.04\.09 21:15 KST/);
  assert.match(html, /\/123456789\/matches\/9/);
  assert.match(html, /\/123456789\/players\/1/);
  assert.match(html, /\/123456789\/matches/);
  assert.match(html, /최근 전적/);
  assert.match(html, /overview-hero/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.doesNotMatch(html, /MMR/);
  assert.doesNotMatch(html, /ProjectL/);
  assert.doesNotMatch(html, /1,700/);
});

test("renderMatchesPage renders OP.GG-style team sections with public result labels", () => {
  const html = renderMatchesPage({
    guildId: "123456789",
    cards: [sampleCard],
  });

  assert.match(html, /전체 경기/);
  assert.match(html, /마법공학 분류모자 Timeline/);
  assert.match(html, /2024\.04\.09 21:15 KST/);
  assert.match(html, /블루팀/);
  assert.match(html, /레드팀/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.match(html, /match-row__summary-highlight/);
  assert.doesNotMatch(html, /ProjectL/);
  assert.match(html, /\/123456789\/matches\/9/);
  assert.match(html, /전체 전적 타임라인/);
});

test("renderMatchCard groups header and team panels inside a content body", () => {
  const html = renderMatchCard(sampleCard);

  assert.match(
    html,
    /data-match-toggle="match-9-toggle"/
  );
  assert.match(html, /data-match-detail="match-9-detail"/);
  assert.match(html, /match-row__summary-highlight/);
  assert.match(html, /2024\.04\.09 21:15 KST/);
  assert.match(html, /종합/);
  assert.match(html, /OP 스코어/);
  assert.match(html, /빌드/);
  assert.match(html, /<img[^>]+Ahri\.png/);
  assert.match(html, /<img[^>]+Flash\.png/);
  assert.match(html, /<img[^>]+6655\.png/);
});

test("renderPlayerPage renders profile stats, champion rows, and recent matches", () => {
  const html = renderPlayerPage({
    guildId: "123456789",
    profile: {
      discordId: "1",
      name: "Alpha",
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
  assert.match(html, /Alpha - 마법공학 분류모자/);
  assert.match(html, /마법공학 분류모자 Player/);
  assert.match(html, /승률/);
  assert.match(html, /주 챔피언/);
  assert.match(html, /최근 경기/);
  assert.match(html, /2024\.04\.09 21:15 KST/);
  assert.match(html, /Ahri/);
  assert.match(html, /Bravo/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.match(html, /\/123456789\/matches\/9/);
  assert.match(html, /player-summary-hero/);
  assert.match(html, /player-summary-hero__stats/);
  assert.doesNotMatch(html, /MMR/);
  assert.doesNotMatch(html, /ProjectL/);
  assert.doesNotMatch(html, /1,650/);
});

test("player page styles keep the stat cards in a dedicated two-column grid", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /\.player-summary-hero__stats\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(150px,\s*1fr\)\);/
  );
  assert.match(
    css,
    /\.player-summary-hero__stats strong\s*\{[\s\S]*white-space:\s*nowrap;/
  );
});

test("renderMatchDetailPage renders both teams and the full stat columns", () => {
  const html = renderMatchDetailPage({
    guildId: "123456789",
    match: sampleMatchDetail,
  });

  assert.match(html, /경기 상세/);
  assert.match(html, /마법공학 분류모자 Match Detail/);
  assert.match(html, /KR-9/);
  assert.match(html, /2024\.04\.09 21:15 KST/);
  assert.match(html, /36,200/);
  assert.match(html, /와드 점수/);
  assert.match(html, /Electrocute\.png/);
  assert.match(html, /6655\.png/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.doesNotMatch(html, /ProjectL/);
});

test("renderNotFoundPage renders a friendly missing-page message", () => {
  const html = renderNotFoundPage({
    title: "플레이어를 찾을 수 없습니다",
    description: "등록된 내전 플레이어가 아니에요.",
  });

  assert.match(html, /플레이어를 찾을 수 없습니다/);
  assert.match(html, /등록된 내전 플레이어가 아니에요/);
});
