const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const { renderLayout } = require("../scripts/Web/views/Layout");
const { renderLandingPage } = require("../scripts/Web/views/LandingPage");
const { renderHomePage } = require("../scripts/Web/views/HomePage");
const { renderMatchesPage } = require("../scripts/Web/views/MatchesPage");
const { renderRankingPage } = require("../scripts/Web/views/RankingPage");
const { renderMatchDetailPage } = require("../scripts/Web/views/MatchDetailPage");
const { renderPlayerPage } = require("../scripts/Web/views/PlayerPage");
const { renderNotFoundPage } = require("../scripts/Web/views/NotFoundPage");
const { renderMatchCard } = require("../scripts/Web/views/ViewHelpers");

const sampleCard = {
  id: 1,
  gameId: "DEMO-KR-001",
  href: "/matches/1",
  toggleId: "match-1-toggle",
  detailId: "match-1-detail",
  durationText: "30:50",
  playedAtText: "2026.04.07 20:10",
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
      totalKillsText: "28",
      players: [
        {
          name: "테스트 알파",
          championName: "Renekton",
          championImageUrl: "https://cdn.test/champion/Renekton.png",
          lane: "탑",
          level: 17,
          kdaText: "6/3/8",
          performanceScore: 18,
          damageText: "28,400",
          visionScoreText: "14",
          minionScoreText: "210",
          csPerMinuteText: "6.81",
          spellIds: [12, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Teleport.png", name: "순간이동" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8010,
          keystoneImageUrl: "https://cdn.test/rune/Conqueror.png",
          keystoneName: "정복자",
          secondaryRuneId: 8400,
          secondaryRuneImageUrl: "https://cdn.test/rune/Resolve.png",
          secondaryRuneName: "결의",
          itemIds: [6631, 3047, 3071, 3053, 3065, 3074, 3364],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6631.png", name: "신성 파괴자" },
            { imageUrl: "https://cdn.test/item/3047.png", name: "판금 장화" },
            { imageUrl: "https://cdn.test/item/3071.png", name: "칠흑의 양날 도끼" },
            { imageUrl: "https://cdn.test/item/3053.png", name: "스테락의 도전" },
            { imageUrl: "https://cdn.test/item/3065.png", name: "정령의 형상" },
            { imageUrl: "https://cdn.test/item/3074.png", name: "굶주린 히드라" },
            { imageUrl: "https://cdn.test/item/3364.png", name: "투명 와드" },
          ],
        },
        {
          name: "테스트 브라보",
          championName: "Lee Sin",
          championImageUrl: "https://cdn.test/champion/LeeSin.png",
          lane: "정글",
          level: 16,
          kdaText: "4/4/12",
          performanceScore: 15,
          damageText: "24,420",
          visionScoreText: "28",
          minionScoreText: "154",
          csPerMinuteText: "4.99",
          spellIds: [11, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Smite.png", name: "강타" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8010,
          keystoneImageUrl: "https://cdn.test/rune/Conqueror.png",
          keystoneName: "정복자",
          secondaryRuneId: 8400,
          secondaryRuneImageUrl: "https://cdn.test/rune/Resolve.png",
          secondaryRuneName: "결의",
          itemIds: [6630, 3111, 3053, 3071, 6333, 3026, 3364],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6630.png", name: "선혈포식자" },
            { imageUrl: "https://cdn.test/item/3111.png", name: "헤르메스의 발걸음" },
            { imageUrl: "https://cdn.test/item/3053.png", name: "스테락의 도전" },
          ],
        },
        {
          name: "테스트 찰리",
          championName: "Ahri",
          championImageUrl: "https://cdn.test/champion/Ahri.png",
          lane: "미드",
          level: 18,
          kdaText: "9/2/7",
          performanceScore: 22,
          damageText: "36,200",
          visionScoreText: "19",
          minionScoreText: "236",
          csPerMinuteText: "7.65",
          spellIds: [4, 14],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
            { imageUrl: "https://cdn.test/spell/Ignite.png", name: "점화" },
          ],
          keystoneId: 8112,
          keystoneImageUrl: "https://cdn.test/rune/Electrocute.png",
          keystoneName: "감전",
          secondaryRuneId: 8200,
          secondaryRuneImageUrl: "https://cdn.test/rune/Sorcery.png",
          secondaryRuneName: "마법",
          itemIds: [6655, 3020, 3157, 4645, 3089, 3135, 3363],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6655.png", name: "루덴의 동반자" },
            { imageUrl: "https://cdn.test/item/3020.png", name: "마법사의 신발" },
            { imageUrl: "https://cdn.test/item/3157.png", name: "존야의 모래시계" },
          ],
        },
        {
          name: "테스트 델타",
          championName: "Jinx",
          championImageUrl: "https://cdn.test/champion/Jinx.png",
          lane: "원딜",
          level: 17,
          kdaText: "8/3/9",
          performanceScore: 19,
          damageText: "31,980",
          visionScoreText: "17",
          minionScoreText: "248",
          csPerMinuteText: "8.04",
          spellIds: [7, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Heal.png", name: "회복" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8008,
          keystoneImageUrl: "https://cdn.test/rune/LethalTempo.png",
          keystoneName: "치명적 속도",
          secondaryRuneId: 8300,
          secondaryRuneImageUrl: "https://cdn.test/rune/Inspiration.png",
          secondaryRuneName: "영감",
          itemIds: [6672, 3006, 3094, 3036, 3085, 3072, 3363],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6672.png", name: "크라켄 학살자" },
            { imageUrl: "https://cdn.test/item/3006.png", name: "광전사의 군화" },
            { imageUrl: "https://cdn.test/item/3094.png", name: "고속 연사포" },
          ],
        },
        {
          name: "테스트 에코",
          championName: "Thresh",
          championImageUrl: "https://cdn.test/champion/Thresh.png",
          lane: "서포터",
          level: 14,
          kdaText: "1/4/17",
          performanceScore: 14,
          damageText: "9,840",
          visionScoreText: "57",
          minionScoreText: "34",
          csPerMinuteText: "1.10",
          spellIds: [3, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Exhaust.png", name: "탈진" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8439,
          keystoneImageUrl: "https://cdn.test/rune/Aftershock.png",
          keystoneName: "여진",
          secondaryRuneId: 8300,
          secondaryRuneImageUrl: "https://cdn.test/rune/Inspiration.png",
          secondaryRuneName: "영감",
          itemIds: [3190, 3117, 3109, 3050, 2065, 3860, 3364],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/3190.png", name: "강철의 솔라리 펜던트" },
            { imageUrl: "https://cdn.test/item/3117.png", name: "기동력의 장화" },
            { imageUrl: "https://cdn.test/item/3109.png", name: "기사의 맹세" },
          ],
        },
      ],
    },
    purple: {
      resultText: "패배",
      totalKillsText: "18",
      players: [
        {
          name: "테스트 폭스트롯",
          championName: "Aatrox",
          championImageUrl: "https://cdn.test/champion/Aatrox.png",
          lane: "탑",
          level: 16,
          kdaText: "3/6/4",
          performanceScore: 7,
          damageText: "21,316",
          visionScoreText: "12",
          minionScoreText: "201",
          csPerMinuteText: "6.52",
          spellIds: [12, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Teleport.png", name: "순간이동" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8010,
          keystoneImageUrl: "https://cdn.test/rune/Conqueror.png",
          keystoneName: "정복자",
          secondaryRuneId: 8400,
          secondaryRuneImageUrl: "https://cdn.test/rune/Resolve.png",
          secondaryRuneName: "결의",
          itemIds: [6631, 3047, 3071, 3053, 3065, 3026, 3364],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6631.png", name: "신성 파괴자" },
            { imageUrl: "https://cdn.test/item/3047.png", name: "판금 장화" },
            { imageUrl: "https://cdn.test/item/3071.png", name: "칠흑의 양날 도끼" },
          ],
        },
        {
          name: "테스트 골프",
          championName: "Viego",
          championImageUrl: "https://cdn.test/champion/Viego.png",
          lane: "정글",
          level: 15,
          kdaText: "5/5/3",
          performanceScore: 8,
          damageText: "19,870",
          visionScoreText: "14",
          minionScoreText: "147",
          csPerMinuteText: "4.77",
          spellIds: [11, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Smite.png", name: "강타" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8010,
          keystoneImageUrl: "https://cdn.test/rune/Conqueror.png",
          keystoneName: "정복자",
          secondaryRuneId: 8400,
          secondaryRuneImageUrl: "https://cdn.test/rune/Resolve.png",
          secondaryRuneName: "결의",
          itemIds: [3153, 3111, 3053, 3071, 6333, 3026, 3364],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/3153.png", name: "몰락한 왕의 검" },
            { imageUrl: "https://cdn.test/item/3111.png", name: "헤르메스의 발걸음" },
            { imageUrl: "https://cdn.test/item/3053.png", name: "스테락의 도전" },
          ],
        },
        {
          name: "테스트 호텔",
          championName: "Orianna",
          championImageUrl: "https://cdn.test/champion/Orianna.png",
          lane: "미드",
          level: 16,
          kdaText: "4/7/5",
          performanceScore: 6,
          damageText: "29,200",
          visionScoreText: "13",
          minionScoreText: "219",
          csPerMinuteText: "7.10",
          spellIds: [4, 14],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
            { imageUrl: "https://cdn.test/spell/Ignite.png", name: "점화" },
          ],
          keystoneId: 8112,
          keystoneImageUrl: "https://cdn.test/rune/Electrocute.png",
          keystoneName: "감전",
          secondaryRuneId: 8200,
          secondaryRuneImageUrl: "https://cdn.test/rune/Sorcery.png",
          secondaryRuneName: "마법",
          itemIds: [6655, 3020, 4645, 3089, 3135, 3165, 3363],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6655.png", name: "루덴의 동반자" },
            { imageUrl: "https://cdn.test/item/3020.png", name: "마법사의 신발" },
            { imageUrl: "https://cdn.test/item/4645.png", name: "그림자불꽃" },
          ],
        },
        {
          name: "테스트 인디아",
          championName: "Xayah",
          championImageUrl: "https://cdn.test/champion/Xayah.png",
          lane: "원딜",
          level: 16,
          kdaText: "6/5/2",
          performanceScore: 9,
          damageText: "26,530",
          visionScoreText: "12",
          minionScoreText: "231",
          csPerMinuteText: "7.49",
          spellIds: [7, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Heal.png", name: "회복" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8008,
          keystoneImageUrl: "https://cdn.test/rune/LethalTempo.png",
          keystoneName: "치명적 속도",
          secondaryRuneId: 8300,
          secondaryRuneImageUrl: "https://cdn.test/rune/Inspiration.png",
          secondaryRuneName: "영감",
          itemIds: [6672, 3006, 3031, 3094, 3085, 3036, 3363],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/6672.png", name: "크라켄 학살자" },
            { imageUrl: "https://cdn.test/item/3006.png", name: "광전사의 군화" },
            { imageUrl: "https://cdn.test/item/3031.png", name: "무한의 대검" },
          ],
        },
        {
          name: "테스트 줄리엣",
          championName: "Lulu",
          championImageUrl: "https://cdn.test/champion/Lulu.png",
          lane: "서포터",
          level: 13,
          kdaText: "0/6/10",
          performanceScore: 5,
          damageText: "8,120",
          visionScoreText: "45",
          minionScoreText: "29",
          csPerMinuteText: "0.94",
          spellIds: [3, 4],
          spellAssets: [
            { imageUrl: "https://cdn.test/spell/Exhaust.png", name: "탈진" },
            { imageUrl: "https://cdn.test/spell/Flash.png", name: "점멸" },
          ],
          keystoneId: 8465,
          keystoneImageUrl: "https://cdn.test/rune/Guardian.png",
          keystoneName: "수호자",
          secondaryRuneId: 8300,
          secondaryRuneImageUrl: "https://cdn.test/rune/Inspiration.png",
          secondaryRuneName: "영감",
          itemIds: [3504, 3117, 3107, 3222, 2065, 3860, 3364],
          itemAssets: [
            { imageUrl: "https://cdn.test/item/3504.png", name: "불타는 향로" },
            { imageUrl: "https://cdn.test/item/3117.png", name: "기동력의 장화" },
            { imageUrl: "https://cdn.test/item/3107.png", name: "구원" },
          ],
        },
      ],
    },
  },
};

const sampleMatchDetail = {
  ...sampleCard,
  teams: {
    blue: {
      ...sampleCard.teams.blue,
      players: sampleCard.teams.blue.players.map((player) => ({ ...player })),
    },
    purple: {
      ...sampleCard.teams.purple,
      players: sampleCard.teams.purple.players.map((player) => ({ ...player })),
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
  assert.match(html, /href="\/123456789\/ranking"/);
  assert.match(html, /data-search-endpoint="\/123456789\/api\/search"/);
  assert.match(html, /site-logo__text">마법공학 분류모자</);
  assert.doesNotMatch(html, /site-logo__mark/);
  assert.doesNotMatch(html, /마법공학 분류모자 전적/);
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
  assert.match(html, /30:50/);
  assert.match(html, /2026\.04\.07 20:10/);
  assert.match(html, /match-row__summary-player/);
  assert.match(html, /\/123456789\/matches\/1/);
  assert.match(html, /\/123456789\/players\/1/);
  assert.match(html, /\/123456789\/matches/);
  assert.match(html, /최근 전적/);
  assert.match(html, /overview-hero/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.doesNotMatch(html, /match-row__summary-highlight/);
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
  assert.match(html, /overview-hero__copy/);
  assert.match(html, /2026\.04\.07 20:10/);
  assert.match(html, /블루팀/);
  assert.match(html, /레드팀/);
  assert.match(html, /match-row__summary-team--blue[\s\S]*테스트 찰리/);
  assert.match(html, /match-row__summary-team--red[\s\S]*테스트 인디아/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.doesNotMatch(html, /match-row__summary-highlight/);
  assert.doesNotMatch(html, /ProjectL/);
  assert.match(html, /\/123456789\/matches\/1/);
  assert.match(html, /전체 전적 타임라인/);
});

test("renderRankingPage renders the full public ranking table", () => {
  const html = renderRankingPage({
    guildId: "123456789",
    ranking: [
      {
        discordId: "1",
        name: "Alpha",
        recordText: "7승 3패",
        winRateText: "70%",
      },
      {
        discordId: "2",
        name: "Bravo",
        recordText: "6승 4패",
        winRateText: "60%",
      },
    ],
  });

  assert.match(html, /전체 랭킹/);
  assert.match(html, /마법공학 분류모자 Ranking/);
  assert.match(html, /전체 플레이어 랭킹/);
  assert.match(html, /Alpha/);
  assert.match(html, /Bravo/);
  assert.match(html, /\/123456789\/players\/1/);
  assert.match(html, /\/123456789\/players\/2/);
  assert.match(html, /\/123456789\/ranking/);
});

test("renderMatchCard groups header and team panels inside a content body", () => {
  const html = renderMatchCard(sampleCard);

  assert.match(
    html,
    /data-match-toggle="match-1-toggle"/
  );
  assert.match(html, /data-match-detail="match-1-detail"/);
  assert.match(html, /match-row__summary-highlight/);
  assert.match(html, /2026\.04\.07 20:10/);
  assert.match(html, /match-row__summary-team--blue[\s\S]*테스트 찰리/);
  assert.match(html, /match-row__summary-team--red[\s\S]*테스트 인디아/);
  assert.match(html, /Sorcery\.png/);
  assert.doesNotMatch(html, />종합</);
  assert.doesNotMatch(html, />OP 스코어</);
  assert.doesNotMatch(html, />빌드</);
  assert.doesNotMatch(html, /match-row__tabs/);
  assert.match(html, /match-scoreboard__columns/);
  assert.match(html, /Total Kill/);
  assert.match(html, /Total Damage/);
  assert.match(html, /match-scoreboard__build-items/);
  assert.match(html, /match-scoreboard__build-row/);
  assert.match(html, /match-scoreboard__build-trinket/);
  assert.match(html, /match-scoreboard__summoners/);
  assert.match(html, /match-scoreboard__runes-block/);
  assert.match(
    html,
    /match-scoreboard__build-row[\s\S]*6631\.png[\s\S]*3047\.png[\s\S]*3071\.png[\s\S]*3364\.png[\s\S]*match-scoreboard__build-row[\s\S]*3053\.png[\s\S]*3065\.png[\s\S]*3074\.png/
  );
  assert.match(html, /<img[^>]+Renekton\.png/);
  assert.match(html, /<img[^>]+Teleport\.png/);
  assert.match(html, /<img[^>]+6631\.png/);
});

test("renderMatchCard hides the result strip and uses the compact public summary layout when requested", () => {
  const html = renderMatchCard(sampleCard, {
    showResult: false,
    showSummaryHighlight: false,
  });

  assert.doesNotMatch(html, /class="match-row__result"/);
  assert.match(html, /class="match-row__summary match-row__summary--public"/);
  assert.match(html, /class="match-row__summary-teams match-row__summary-teams--public"/);
  assert.match(html, /match-row__summary-team--red[\s\S]*테스트 인디아/);
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
  assert.match(html, /2026\.04\.07 20:10/);
  assert.match(html, /Ahri/);
  assert.match(html, /Bravo/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.match(html, /\/123456789\/matches\/1/);
  assert.match(html, /player-summary-hero/);
  assert.match(html, /player-summary-hero__stats/);
  assert.match(html, /match-row__summary-highlight/);
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
  assert.match(html, /DEMO-KR-001/);
  assert.match(html, /2026\.04\.07 20:10/);
  assert.match(html, /36,200/);
  assert.match(html, /와드/);
  assert.match(html, /Electrocute\.png/);
  assert.match(html, /Sorcery\.png/);
  assert.match(html, /6655\.png/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.match(html, /overview-hero__copy/);
  assert.match(html, /match-detail-shell/);
  assert.doesNotMatch(html, /match-row__tabs/);
  assert.doesNotMatch(html, /match-detail-shell__summary/);
  assert.match(html, /match-scoreboard__columns/);
  assert.match(html, /Total Kill/);
  assert.match(html, /Total Damage/);
  assert.match(html, /match-scoreboard__build-items/);
  assert.match(html, /match-scoreboard__summoners/);
  assert.match(html, /match-scoreboard__runes-block/);
  assert.match(
    html,
    /<section class="overview-hero hero-card hero-card--compact">\s*<div class="overview-hero__copy">/
  );
  assert.doesNotMatch(html, /ProjectL/);
});

test("match detail styles size player rows as identity, stats, and builds columns", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /\.match-scoreboard__columns\s*\{[\s\S]*grid-template-columns:\s*minmax\(252px,\s*1\.22fr\)\s+minmax\(84px,\s*0\.44fr\)\s+minmax\(148px,\s*0\.78fr\)\s+minmax\(148px,\s*0\.78fr\)\s+minmax\(84px,\s*0\.42fr\)\s+minmax\(96px,\s*0\.46fr\)\s+minmax\(224px,\s*1\.02fr\);/
  );
  assert.match(
    css,
    /\.match-scoreboard__identity\s*\{[\s\S]*grid-template-columns:\s*52px\s+24px\s+24px\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /\.match-scoreboard__totals\s*\{[\s\S]*display:\s*grid;/
  );
  assert.match(
    css,
    /\.match-detail-shell\s*\{[\s\S]*display:\s*grid;/
  );
  assert.match(
    css,
    /\.match-scoreboard__build-items\s*\{[\s\S]*display:\s*grid;/
  );
  assert.match(
    css,
    /\.match-scoreboard__build-row\s*\{[\s\S]*display:\s*flex;/
  );
  assert.match(
    css,
    /\.match-scoreboard__build-row\s+\.match-scoreboard__items__icon\s*\{[\s\S]*width:\s*28px;[\s\S]*height:\s*28px;/
  );
  assert.match(
    css,
    /\.match-scoreboard__runes-block__icon\s*,?[\s\S]*width:\s*24px;[\s\S]*height:\s*24px;/
  );
  assert.match(
    css,
    /\.match-scoreboard__totals-bar\s*\{[\s\S]*display:\s*flex;[\s\S]*gap:\s*0;/
  );
});

test("public match summary styles drop the left result strip and distribute team cards evenly", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /\.match-row__summary--public\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;/
  );
  assert.match(
    css,
    /\.match-row__summary-teams--public\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/
  );
  assert.match(
    css,
    /\.match-row__summary-button--public\s*\{[\s\S]*grid-template-columns:\s*112px\s+minmax\(0,\s*1fr\)\s+24px;/
  );
  assert.match(
    css,
    /\.match-row__summary-player\s*\{[\s\S]*grid-template-columns:\s*64px\s+minmax\(0,\s*1fr\)\s+max-content;[\s\S]*grid-template-areas:\s*"champion copy score"\s*"champion copy kda";/
  );
  assert.match(
    css,
    /\.match-row__summary-player-score\s*\{[\s\S]*grid-area:\s*score;[\s\S]*justify-items:\s*end;/
  );
  assert.match(
    css,
    /\.match-row__summary-player-kda\s*\{[\s\S]*grid-area:\s*kda;[\s\S]*justify-items:\s*end;/
  );
  assert.match(
    css,
    /\.match-row__summary-player-kda strong\s*\{[\s\S]*white-space:\s*nowrap;/
  );
  assert.doesNotMatch(
    css,
    /\.match-row__summary-teams,\s*\.match-row__summary-teams--public\s*\{[\s\S]*grid-template-columns:\s*1fr;/
  );
});

test("renderNotFoundPage renders a friendly missing-page message", () => {
  const html = renderNotFoundPage({
    title: "플레이어를 찾을 수 없습니다",
    description: "등록된 내전 플레이어가 아니에요.",
  });

  assert.match(html, /플레이어를 찾을 수 없습니다/);
  assert.match(html, /등록된 내전 플레이어가 아니에요/);
});
