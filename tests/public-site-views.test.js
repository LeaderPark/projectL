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

function stripInlineStyles(html) {
  return html.replace(/<style data-inline-site-css>[\s\S]*?<\/style>/g, "");
}

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

test("renderLayout uses a fixed browser title and shared assets", () => {
  const html = renderLayout({
    title: "임의 페이지 제목",
    guildId: "123456789",
    body: "<main>ok</main>",
  });
  const pageHtml = stripInlineStyles(html);

  assert.match(html, /<title>마법공학 분류모자<\/title>/);
  assert.doesNotMatch(html, /<title>임의 페이지 제목<\/title>/);
  assert.match(html, /<style data-inline-site-css>/);
  assert.match(html, /--color-bg:/);
  assert.match(pageHtml, /\/public\/site\.css\?v=\d+/);
  assert.match(pageHtml, /\/public\/site\.js\?v=\d+/);
  assert.match(
    pageHtml,
    /<link rel="icon" type="image\/webp" href="\/public\/favicon\.webp\?v=\d+"/
  );
  assert.match(pageHtml, /<main>ok<\/main>/);
  assert.match(pageHtml, /action="\/123456789\/players"/);
  assert.match(pageHtml, /href="\/123456789"/);
  assert.match(pageHtml, /href="\/123456789\/matches"/);
  assert.match(pageHtml, /href="\/123456789\/ranking"/);
  assert.match(pageHtml, /data-search-endpoint="\/123456789\/api\/search"/);
  assert.match(pageHtml, /site-logo__text">마법공학 분류모자</);
  assert.doesNotMatch(pageHtml, /site-logo__mark/);
  assert.doesNotMatch(pageHtml, /마법공학 분류모자 전적/);
});

test("renderLandingPage renders only a server-id entry form", () => {
  const html = renderLandingPage();
  const pageHtml = stripInlineStyles(html);

  assert.match(pageHtml, /서버 아이디/);
  assert.match(pageHtml, /<title>마법공학 분류모자<\/title>/);
  assert.match(pageHtml, /<form/);
  assert.match(pageHtml, /name="serverId"/);
  assert.doesNotMatch(pageHtml, /ProjectL/);
  assert.doesNotMatch(pageHtml, /site-header/);
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
  const pageHtml = stripInlineStyles(html);

  assert.match(pageHtml, /전체 내전 전적/);
  assert.match(pageHtml, /마법공학 분류모자 Competitive Board/);
  assert.match(pageHtml, /총 경기 수/);
  assert.match(pageHtml, /공개 랭킹/);
  assert.match(pageHtml, /Alpha/);
  assert.match(pageHtml, /30:50/);
  assert.match(pageHtml, /2026\.04\.07 20:10/);
  assert.match(pageHtml, /match-row__summary-player/);
  assert.match(pageHtml, /\/123456789\/matches\/1/);
  assert.match(pageHtml, /\/123456789\/players\/1/);
  assert.match(pageHtml, /\/123456789\/matches/);
  assert.match(pageHtml, /최근 전적/);
  assert.match(pageHtml, /overview-hero/);
  assert.match(pageHtml, /승리/);
  assert.match(pageHtml, /패배/);
  assert.doesNotMatch(pageHtml, /match-row__summary-highlight/);
  assert.doesNotMatch(pageHtml, /MMR/);
  assert.doesNotMatch(pageHtml, /ProjectL/);
  assert.doesNotMatch(pageHtml, /1,700/);
});

test("renderMatchesPage renders OP.GG-style team sections with public result labels", () => {
  const html = renderMatchesPage({
    guildId: "123456789",
    cards: [sampleCard],
  });
  const pageHtml = stripInlineStyles(html);

  assert.match(pageHtml, /전체 경기/);
  assert.match(pageHtml, /마법공학 분류모자 Timeline/);
  assert.match(pageHtml, /overview-hero__copy/);
  assert.match(pageHtml, /2026\.04\.07 20:10/);
  assert.match(pageHtml, /블루팀/);
  assert.match(pageHtml, /레드팀/);
  assert.match(pageHtml, /match-row__summary-team--blue[\s\S]*테스트 찰리/);
  assert.match(pageHtml, /match-row__summary-team--red[\s\S]*테스트 인디아/);
  assert.match(pageHtml, /승리/);
  assert.match(pageHtml, /패배/);
  assert.doesNotMatch(pageHtml, /match-row__summary-highlight/);
  assert.doesNotMatch(pageHtml, /ProjectL/);
  assert.match(pageHtml, /\/123456789\/matches\/1/);
  assert.match(pageHtml, /전체 전적 타임라인/);
});

test("renderMatchesPage renders a dedicated empty state when there are no matches", () => {
  const html = renderMatchesPage({
    guildId: "123456789",
    cards: [],
  });

  assert.match(html, /전체 경기/);
  assert.match(html, /전체 전적 타임라인/);
  assert.match(html, /class="match-feed match-feed--empty"/);
  assert.match(html, /class="panel-empty-state"/);
  assert.match(html, /아직 집계된 경기가 없어요\./);
});

test("match timeline empty-state styles reserve space for the panel body", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /\.match-feed--empty\s*\{[\s\S]*min-height:\s*220px;/
  );
  assert.match(
    css,
    /\.panel-empty-state\s*\{[\s\S]*display:\s*grid;[\s\S]*place-items:\s*center;[\s\S]*text-align:\s*center;/
  );
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
      {
        discordId: "3",
        name: "Charlie",
        recordText: "5승 5패",
        winRateText: "50%",
      },
      {
        discordId: "4",
        name: "Delta",
        recordText: "4승 6패",
        winRateText: "40%",
      },
    ],
  });

  assert.match(html, /전체 랭킹/);
  assert.match(html, /마법공학 분류모자 Ranking/);
  assert.match(html, /전체 플레이어 랭킹/);
  assert.match(html, /Alpha/);
  assert.match(html, /Bravo/);
  assert.match(html, /Charlie/);
  assert.match(html, /Delta/);
  assert.match(html, /\/123456789\/players\/1/);
  assert.match(html, /\/123456789\/players\/2/);
  assert.match(html, /\/123456789\/ranking/);
  assert.match(html, /class="site-shell"/);
  assert.doesNotMatch(html, /site-shell--ranking-wide/);
  assert.match(
    html,
    /class="ranking-table__row ranking-table__row--top-1"[\s\S]*class="ranking-table__rank-badge ranking-table__rank-badge--top-1"[\s\S]*1/
  );
  assert.match(
    html,
    /class="ranking-table__row ranking-table__row--top-2"[\s\S]*class="ranking-table__rank-badge ranking-table__rank-badge--top-2"[\s\S]*2/
  );
  assert.match(
    html,
    /class="ranking-table__row ranking-table__row--top-3"[\s\S]*class="ranking-table__rank-badge ranking-table__rank-badge--top-3"[\s\S]*3/
  );
  assert.doesNotMatch(html, /ranking-table__rank-badge-label/);
  assert.doesNotMatch(html, />TOP<\/span>/);
  assert.match(html, /class="ranking-table__rank-cell">#4<\/td>/);
});

test("ranking page styles reuse the shared shell gutters", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /\.site-shell\s*\{[\s\S]*width:\s*min\(1360px,\s*calc\(100%\s*-\s*28px\)\);/
  );
  assert.match(
    css,
    /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.site-shell\s*\{[\s\S]*width:\s*min\(100%\s*-\s*18px,\s*1360px\);/
  );
  assert.doesNotMatch(css, /\.site-shell--ranking-wide\s*\{/);
  assert.match(
    css,
    /\.ranking-table__row--top-1\s*\{[\s\S]*linear-gradient/
  );
  assert.match(
    css,
    /\.ranking-table__rank-badge--top-1\s*\{[\s\S]*box-shadow:/
  );
  assert.match(
    css,
    /\.ranking-table__rank-badge--top-2\s*\{/
  );
  assert.match(
    css,
    /\.ranking-table__rank-badge--top-3\s*\{/
  );
  assert.doesNotMatch(
    css,
    /\.ranking-table__rank-badge-label\s*\{/
  );
  assert.match(
    css,
    /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.ranking-table__rank-badge\s*\{[\s\S]*min-width:/
  );
});

test("site styles define a non-white root background for mobile overscroll", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /html\s*\{[\s\S]*background-color:\s*var\(--color-bg-strong\);/
  );
  assert.match(
    css,
    /body\s*\{[\s\S]*position:\s*relative;[\s\S]*min-height:\s*100vh;/
  );
  assert.match(
    css,
    /body::before\s*\{[\s\S]*position:\s*fixed;[\s\S]*inset:\s*0;[\s\S]*z-index:\s*-1;[\s\S]*background:/
  );
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
  assert.match(html, /match-scoreboard--compact/);
  assert.match(html, /match-scoreboard__columns/);
  assert.match(html, />플레이어</);
  assert.match(html, />OP Score</);
  assert.match(html, />KDA</);
  assert.doesNotMatch(html, /피해량/);
  assert.doesNotMatch(html, /와드/);
  assert.doesNotMatch(html, /CS/);
  assert.doesNotMatch(html, /아이템/);
  assert.doesNotMatch(html, /Total Kill/);
  assert.doesNotMatch(html, /Total Damage/);
  assert.doesNotMatch(html, /Total Vision/);
  assert.doesNotMatch(html, /match-scoreboard__build-items/);
  assert.doesNotMatch(html, /match-scoreboard__build-row/);
  assert.doesNotMatch(html, /match-scoreboard__build-trinket/);
  assert.match(html, /match-scoreboard__summoners/);
  assert.match(html, /match-scoreboard__runes-block/);
  assert.match(html, /class="match-row__actions"/);
  assert.match(
    html,
    /class="match-row__detail-link" href="\/matches\/1">상세 보기<\/a>/
  );
  assert.doesNotMatch(html, />링크</);
  assert.match(
    html,
    /class="match-row__caret" aria-hidden="true">\s*<span class="match-row__caret-icon"><\/span>\s*<\/span>/
  );
  assert.match(html, /<img[^>]+Renekton\.png/);
  assert.match(html, /<img[^>]+Teleport\.png/);
  assert.doesNotMatch(html, /<img[^>]+6631\.png/);
});

test("renderMatchCard hides the result strip and uses the compact public summary layout when requested", () => {
  const html = renderMatchCard(sampleCard, {
    showResult: false,
    showSummaryHighlight: false,
  });

  assert.doesNotMatch(html, /class="match-row__result"/);
  assert.match(html, /class="match-row__summary match-row__summary--public"/);
  assert.match(
    html,
    /class="match-row__meta">[\s\S]*Match #1[\s\S]*30:50[\s\S]*DEMO-KR-001[\s\S]*2026\.04\.07 20:10/
  );
  assert.match(html, /class="match-row__summary-teams match-row__summary-teams--public"/);
  assert.match(
    html,
    /match-row__summary-team--blue[\s\S]*Flash\.png[\s\S]*Ignite\.png[\s\S]*Electrocute\.png[\s\S]*Sorcery\.png[\s\S]*6\.4[\s\S]*MVP[\s\S]*9\/2\/7 \(57%\)[\s\S]*8\.00:1/
  );
  assert.match(
    html,
    /match-row__summary-team--red[\s\S]*Heal\.png[\s\S]*Flash\.png[\s\S]*LethalTempo\.png[\s\S]*Inspiration\.png[\s\S]*5\.1[\s\S]*ACE[\s\S]*6\/5\/2 \(44%\)[\s\S]*1\.60:1/
  );
  assert.match(html, /match-row__summary-team--red[\s\S]*테스트 인디아/);
});

test("renderMatchCard uses the player perspective result when one is provided", () => {
  const html = renderMatchCard({
    ...sampleCard,
    resultText: "패배",
    resultTone: "red",
  });

  assert.match(html, /class="match-row match-row--red"/);
  assert.match(
    html,
    /class="match-row__result">\s*<strong>패배<\/strong>\s*<span>내전<\/span>/
  );
});

test("renderMatchCard exposes an op.gg-style player-page layout variant", () => {
  const html = renderMatchCard({
    ...sampleCard,
    perspectivePlayerPuuid: "puuid-charlie",
    perspectivePlayerName: "테스트 찰리",
    teams: {
      ...sampleCard.teams,
      blue: {
        ...sampleCard.teams.blue,
        players: sampleCard.teams.blue.players.map((player) =>
          player.name === "테스트 찰리"
            ? { ...player, puuid: "puuid-charlie" }
            : { ...player, puuid: `puuid-${player.name}` }
        ),
      },
      purple: {
        ...sampleCard.teams.purple,
        players: sampleCard.teams.purple.players.map((player) => ({
          ...player,
          puuid: `puuid-${player.name}`,
        })),
      },
    },
  }, {
    layout: "player",
  });
  const summaryHtml =
    html.match(/<div class="match-row__summary match-row__summary--player-card">[\s\S]*?<\/div>\s*<section/)?.[0] ??
    "";

  assert.match(html, /class="match-row match-row--blue match-row--player"/);
  assert.match(html, /class="match-row__summary match-row__summary--player-card"/);
  assert.match(html, /class="match-row__result match-row__result--player"/);
  assert.match(html, /class="match-row__result-mode">DEMO-KR-001<\/span>/);
  assert.match(html, /class="match-row__result-time">2026\.04\.07 20:10<\/span>/);
  assert.match(html, /<strong>승리<\/strong>/);
  assert.match(html, /class="match-row__result-duration">30:50<\/span>/);
  assert.match(
    html,
    /class="match-row__summary-button match-row__summary-button--player"/
  );
  assert.match(summaryHtml, /class="match-row__player-maincard"/);
  assert.match(summaryHtml, /class="match-row__player-card-stats"/);
  assert.match(summaryHtml, /class="match-row__player-maincard-kda"/);
  assert.match(summaryHtml, /class="match-row__player-maincard-kda-value">9\/2\/7<\/strong>/);
  assert.match(summaryHtml, /class="match-row__player-maincard-kda-rating">8\.00:1 평점<\/span>/);
  assert.match(summaryHtml, /class="match-row__player-rosters"/);
  assert.match(summaryHtml, /class="match-row__player-roster-list match-row__player-roster-list--blue"/);
  assert.match(summaryHtml, /class="match-row__player-roster-list match-row__player-roster-list--red"/);
  assert.match(summaryHtml, /class="match-row__player-roster-item is-active"[\s\S]*테스트 찰리/);
  assert.match(summaryHtml, /테스트 인디아/);
  assert.match(summaryHtml, /킬관여 57%/);
  assert.match(summaryHtml, /CS 236 \(7\.65\)/);
  assert.match(summaryHtml, /딜량 36,200/);
  assert.doesNotMatch(summaryHtml, /class="match-row__player-name">테스트 찰리<\/strong>/);
  assert.doesNotMatch(summaryHtml, /Ahri · 미드 · Lv\.18/);
  assert.doesNotMatch(summaryHtml, /<div class="match-row__player-card-stats">[\s\S]*8\.00:1 평점/);
  assert.doesNotMatch(summaryHtml, /MVP/);
  assert.doesNotMatch(summaryHtml, /ACE/);
  assert.doesNotMatch(summaryHtml, /match-row__summary-team/);
  assert.doesNotMatch(summaryHtml, /match-row__summary-highlight/);
  assert.doesNotMatch(summaryHtml, /class="match-row__meta"/);
  assert.doesNotMatch(summaryHtml, /상세 보기/);
  assert.doesNotMatch(summaryHtml, />내전</);
  assert.doesNotMatch(summaryHtml, /match-row__player-roster-label/);
});

test("renderPlayerPage renders profile stats, champion rows, and recent matches", () => {
  const html = renderPlayerPage({
    guildId: "123456789",
    refreshStatus: "updated",
    profile: {
      discordId: "1",
      name: "Alpha",
      recordText: "6승 4패",
      winRateText: "60%",
      averageKdaText: "6.00",
      averageKillRateText: "64%",
      linkedRiotAccounts: [
        { displayName: "Alpha#KR1" },
        { displayName: "Bravo#JP1" },
      ],
      favoriteChampions: [{ name: "Ahri", recordText: "4승 1패" }],
      preferredLanes: [{ name: "MIDDLE", recordText: "5승 2패" }],
      friends: [{ name: "Bravo", recordText: "4승 1패" }],
    },
    recentMatches: [{
      ...sampleCard,
      perspectivePlayerPuuid: "puuid-charlie",
      perspectivePlayerName: "테스트 찰리",
      teams: {
        ...sampleCard.teams,
        blue: {
          ...sampleCard.teams.blue,
          players: sampleCard.teams.blue.players.map((player) =>
            player.name === "테스트 찰리"
              ? { ...player, puuid: "puuid-charlie" }
              : { ...player, puuid: `puuid-${player.name}` }
          ),
        },
        purple: {
          ...sampleCard.teams.purple,
          players: sampleCard.teams.purple.players.map((player) => ({
            ...player,
            puuid: `puuid-${player.name}`,
          })),
        },
      },
    }],
  });
  const summaryHtml =
    html.match(/<div class="match-row__summary match-row__summary--player-card">[\s\S]*?<\/div>\s*<section/)?.[0] ??
    "";

  assert.match(html, /Alpha/);
  assert.match(html, /<title>마법공학 분류모자<\/title>/);
  assert.match(html, /마법공학 분류모자 Player/);
  assert.match(html, /승률/);
  assert.match(html, /주 챔피언/);
  assert.match(html, /최근 경기/);
  assert.match(html, /등록된 롤 닉네임/);
  assert.match(html, /닉네임 새로고침/);
  assert.match(html, /method="POST"/);
  assert.match(html, /action="\/123456789\/players\/1\/refresh-riot-accounts"/);
  assert.match(html, /player-page__section-header/);
  assert.match(html, /player-page__section-action/);
  assert.match(html, /player-page__refresh-button/);
  assert.match(html, /라이엇 닉네임을 최신 상태로 업데이트했어요\./);
  assert.match(html, /Alpha#KR1/);
  assert.match(html, /Bravo#JP1/);
  assert.match(html, /2026\.04\.07 20:10/);
  assert.match(html, /Ahri/);
  assert.match(html, /Bravo/);
  assert.match(html, /승리/);
  assert.match(html, /패배/);
  assert.match(html, /player-summary-hero/);
  assert.match(html, /player-summary-hero__stats/);
  assert.match(html, /match-row--player/);
  assert.match(html, /match-row__summary-button--player/);
  assert.match(html, /data-match-toggle="match-1-toggle"/);
  assert.match(summaryHtml, /class="match-row__result-mode">DEMO-KR-001<\/span>/);
  assert.match(summaryHtml, /class="match-row__result-time">2026\.04\.07 20:10<\/span>/);
  assert.match(summaryHtml, /class="match-row__player-maincard"/);
  assert.match(summaryHtml, /class="match-row__player-card-stats"/);
  assert.match(summaryHtml, /class="match-row__player-maincard-kda"/);
  assert.match(summaryHtml, /class="match-row__player-rosters"/);
  assert.match(
    html,
    /player-page__shell[\s\S]*player-page__main[\s\S]*최근 경기[\s\S]*player-page__sidebar[\s\S]*주 챔피언[\s\S]*함께 잘 맞는 팀원[\s\S]*선호 라인/
  );
  assert.doesNotMatch(summaryHtml, /MVP/);
  assert.doesNotMatch(summaryHtml, /ACE/);
  assert.doesNotMatch(summaryHtml, /match-row__summary-highlight/);
  assert.doesNotMatch(summaryHtml, /상세 보기/);
  assert.doesNotMatch(summaryHtml, />내전</);
  assert.doesNotMatch(html, /MMR/);
  assert.doesNotMatch(html, /ProjectL/);
  assert.doesNotMatch(html, /1,650/);
});

test("renderPlayerPage renders the throttled refresh banner", () => {
  const html = renderPlayerPage({
    guildId: "123456789",
    refreshStatus: "throttled",
    profile: {
      discordId: "1",
      name: "Alpha",
      recordText: "6승 4패",
      winRateText: "60%",
      averageKdaText: "6.00",
      averageKillRateText: "64%",
      linkedRiotAccounts: [],
      favoriteChampions: [],
      preferredLanes: [],
      friends: [],
    },
    recentMatches: [],
  });

  assert.match(html, /5분 후에 다시 시도해 주세요\./);
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
  assert.match(
    css,
    /\.player-page__shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.32fr\)\s+minmax\(280px,\s*0\.68fr\);/
  );
  assert.match(
    css,
    /\.player-page__sidebar-sections\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*18px;/
  );
  assert.match(
    css,
    /\.match-row__summary--player-card\s*\{[\s\S]*grid-template-columns:\s*116px\s+minmax\(0,\s*1fr\);[\s\S]*min-height:\s*104px;/
  );
  assert.match(
    css,
    /\.match-row__result--player\s*\{[\s\S]*padding:\s*10px\s+12px;/
  );
  assert.match(
    css,
    /\.match-row__summary-button--player\s*\{[\s\S]*grid-template-columns:\s*minmax\(240px,\s*1\.15fr\)\s+120px\s+minmax\(220px,\s*0\.95fr\)\s+32px;[\s\S]*min-height:\s*104px;[\s\S]*padding:\s*10px\s+14px\s+10px\s+16px;/
  );
  assert.match(
    css,
    /\.match-row__player-maincard\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*8px;/
  );
  assert.match(
    css,
    /\.match-row__player-maincard-kda\s*\{[\s\S]*display:\s*grid;[\s\S]*align-content:\s*center;/
  );
  assert.match(
    css,
    /\.match-row__player-maincard-kda-value\s*\{[\s\S]*font-size:\s*1\.08rem;/
  );
  assert.match(
    css,
    /\.match-row__player-maincard-kda-rating\s*\{[\s\S]*font-size:\s*0\.76rem;/
  );
  assert.match(
    css,
    /\.match-row__player-card-stats\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*2px;[\s\S]*justify-items:\s*end;/
  );
  assert.match(
    css,
    /\.match-row__player-rosters\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/
  );
  assert.match(
    css,
    /\.match-row__player-roster-list\s*\{[\s\S]*gap:\s*2px;/
  );
  assert.match(
    css,
    /\.match-row__player-roster-item\s*\{[\s\S]*padding:\s*1px\s+4px;[\s\S]*font-size:\s*0\.74rem;/
  );
  assert.match(
    css,
    /\.match-row__player-maincard-top\s*\{[\s\S]*grid-template-columns:\s*106px\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /\.match-row__summary-button--player\s+\.match-row__caret\s*\{[\s\S]*margin:\s*0;/
  );
  assert.match(
    css,
    /\.match-row__player-roster-item\.is-active\s*\{[\s\S]*background:\s*rgba\(83,\s*131,\s*255,\s*0\.16\);/
  );
  assert.match(
    css,
    /\.match-row__player-card-stats,\s*\.match-row__player-rosters\s*\{[\s\S]*border-left:\s*1px solid rgba\(154,\s*169,\s*202,\s*0\.08\);/
  );
});

test("renderMatchDetailPage renders both teams and the full stat columns", () => {
  const html = renderMatchDetailPage({
    guildId: "123456789",
    match: sampleMatchDetail,
  });
  const pageHtml = stripInlineStyles(html);

  assert.match(pageHtml, /경기 상세/);
  assert.match(pageHtml, /마법공학 분류모자 Match Detail/);
  assert.match(pageHtml, /DEMO-KR-001/);
  assert.match(pageHtml, /2026\.04\.07 20:10/);
  assert.match(pageHtml, /36,200/);
  assert.match(pageHtml, /와드/);
  assert.match(pageHtml, /Electrocute\.png/);
  assert.match(pageHtml, /Sorcery\.png/);
  assert.match(pageHtml, /6655\.png/);
  assert.match(pageHtml, /승리/);
  assert.match(pageHtml, /패배/);
  assert.match(pageHtml, /overview-hero__copy/);
  assert.match(pageHtml, /match-detail-shell/);
  assert.doesNotMatch(pageHtml, /match-scoreboard--compact/);
  assert.doesNotMatch(pageHtml, /match-row__tabs/);
  assert.doesNotMatch(pageHtml, /match-detail-shell__summary/);
  assert.match(pageHtml, /match-scoreboard__columns/);
  assert.match(pageHtml, />플레이어</);
  assert.match(pageHtml, />OP Score</);
  assert.match(pageHtml, />KDA</);
  assert.match(pageHtml, /피해량/);
  assert.match(pageHtml, /CS/);
  assert.match(pageHtml, /아이템/);
  assert.match(pageHtml, /Total Kill/);
  assert.match(pageHtml, /Total Damage/);
  assert.match(pageHtml, /Total Vision/);
  assert.match(pageHtml, /match-scoreboard__build-items/);
  assert.match(pageHtml, /match-scoreboard__summoners/);
  assert.match(pageHtml, /match-scoreboard__runes-block/);
  assert.match(
    pageHtml,
    /<section class="overview-hero hero-card hero-card--compact">\s*<div class="overview-hero__copy">/
  );
  assert.doesNotMatch(pageHtml, /ProjectL/);
});

test("match detail styles keep full scoreboard defaults and compact inline overrides", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /\.match-scoreboard__columns\s*\{[\s\S]*grid-template-columns:\s*minmax\(252px,\s*1\.22fr\)\s+minmax\(84px,\s*0\.44fr\)\s+minmax\(148px,\s*0\.78fr\)\s+minmax\(148px,\s*0\.78fr\)\s+minmax\(84px,\s*0\.42fr\)\s+minmax\(96px,\s*0\.46fr\)\s+minmax\(224px,\s*1\.02fr\);/
  );
  assert.match(
    css,
    /\.match-scoreboard--compact\s+\.match-scoreboard__columns\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.72fr\)\s+minmax\(104px,\s*0\.52fr\)\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /\.match-scoreboard--compact\s+\.match-scoreboard__row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.72fr\)\s+minmax\(104px,\s*0\.52fr\)\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /\.match-scoreboard--compact\s+\.match-scoreboard__score\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;[\s\S]*justify-self:\s*end;[\s\S]*justify-content:\s*flex-end;[\s\S]*gap:\s*8px;/
  );
  assert.match(
    css,
    /\.match-scoreboard--compact\s+\.match-scoreboard__kda\s*\{[\s\S]*justify-self:\s*end;[\s\S]*justify-items:\s*start;[\s\S]*text-align:\s*left;[\s\S]*padding-right:\s*12px;/
  );
  assert.match(
    css,
    /\.match-scoreboard--compact\s+\.match-scoreboard__columns\s+span:nth-child\(2\)\s*\{[\s\S]*justify-self:\s*end;[\s\S]*text-align:\s*right;/
  );
  assert.match(
    css,
    /\.match-scoreboard--compact\s+\.match-scoreboard__columns\s+span:nth-child\(3\)\s*\{[\s\S]*justify-self:\s*end;[\s\S]*text-align:\s*left;[\s\S]*padding-right:\s*12px;/
  );
  assert.match(
    css,
    /\.match-scoreboard__identity\s*\{[\s\S]*grid-template-columns:\s*52px\s+24px\s+24px\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /\.match-detail-shell\s*\{[\s\S]*display:\s*grid;/
  );
  assert.match(
    css,
    /\.match-scoreboard__runes-block__icon\s*,?[\s\S]*width:\s*24px;[\s\S]*height:\s*24px;/
  );
  assert.match(css, /\.match-scoreboard__totals\s*\{/);
  assert.match(css, /\.match-scoreboard__build-items\s*\{/);
  assert.match(css, /\.match-scoreboard__build-row\s*\{/);
  assert.match(css, /\.match-scoreboard__totals-bar\s*\{/);
});

test("public match summary styles drop the left result strip and distribute team cards evenly", () => {
  const css = fs.readFileSync("public/site.css", "utf8");

  assert.match(
    css,
    /\.match-row\s*\{[\s\S]*position:\s*relative;/
  );
  assert.match(
    css,
    /\.match-row__actions\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*18px;[\s\S]*right:\s*18px;/
  );
  assert.match(
    css,
    /\.match-row__detail-link\s*\{[\s\S]*border-radius:\s*12px;/
  );
  assert.match(
    css,
    /\.match-row__summary\s*\{[\s\S]*grid-template-columns:\s*88px\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /\.match-row__summary--public\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /\.match-row__summary-teams--public\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/
  );
  assert.match(
    css,
    /\.match-row__summary-button\s*\{[\s\S]*grid-template-columns:\s*minmax\(420px,\s*0\.95fr\)\s+minmax\(280px,\s*1\.05fr\)\s+52px;[\s\S]*grid-template-areas:\s*"meta meta caret"[\s\S]*"teams builds caret";/
  );
  assert.match(
    css,
    /\.match-row__summary-button--public\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+52px;[\s\S]*grid-template-areas:\s*"meta meta"[\s\S]*"teams caret";/
  );
  assert.match(
    css,
    /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.match-row__summary-button--public\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+52px;[\s\S]*grid-template-areas:\s*"meta meta"[\s\S]*"teams caret";/
  );
  assert.match(
    css,
    /\.match-row__caret\s*\{[\s\S]*justify-self:\s*center;[\s\S]*align-self:\s*center;[\s\S]*width:\s*24px;[\s\S]*height:\s*24px;[\s\S]*margin-right:\s*0;/
  );
  assert.match(
    css,
    /\.match-row__caret-icon\s*\{[\s\S]*transform:\s*rotate\(45deg\);/
  );
  assert.match(
    css,
    /\.match-row__summary-button\[aria-expanded="true"\]\s+\.match-row__caret-icon\s*\{[\s\S]*transform:\s*rotate\(135deg\);/
  );
  assert.match(
    css,
    /\.match-row__meta\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*wrap;/
  );
  assert.match(
    css,
    /\.match-row__summary-player\s*\{[\s\S]*grid-template-columns:\s*112px\s+minmax\(0,\s*1fr\)\s+max-content;[\s\S]*grid-template-areas:\s*"champion copy score"\s*"champion copy kda";/
  );
  assert.match(
    css,
    /\.match-row__spells-runes\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*24px\);/
  );
  assert.match(
    css,
    /\.match-row__spells,\s*\.match-row__runes\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*1fr;/
  );
  assert.match(
    css,
    /\.match-row__summary-player-score\s*\{[\s\S]*display:\s*flex;[\s\S]*justify-content:\s*flex-end;/
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
