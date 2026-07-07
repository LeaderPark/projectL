const test = require("node:test");
const assert = require("node:assert/strict");

const { renderLayout } = require("../scripts/Web/views/Layout");
const { renderNotFoundPage } = require("../scripts/Web/views/NotFoundPage");
const { renderRankingTable } = require("../scripts/Web/views/ViewHelpers");

test("renderLayout uses the passed title and emits an og:title tag", () => {
  const html = renderLayout({
    title: "임의 페이지 제목",
    guildId: "123456789",
    body: "<main>ok</main>",
  });

  assert.match(html, /<title>임의 페이지 제목<\/title>/);
  assert.match(html, /<meta property="og:title" content="임의 페이지 제목" \/>/);
  assert.match(html, /<meta property="og:type" content="website" \/>/);
  assert.match(html, /<meta property="og:site_name" content="[^"]+" \/>/);
});

test("renderLayout falls back to the brand name when no title is passed", () => {
  const html = renderLayout({
    guildId: "123456789",
    body: "<main>ok</main>",
  });

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  assert.ok(titleMatch);
  assert.match(html, new RegExp(`<meta property="og:title" content="${titleMatch[1]}" />`));
});

test("renderLayout ships styles through a single delivery path (no duplicated inline dump)", () => {
  const html = renderLayout({
    title: "스타일 테스트",
    guildId: "123456789",
    body: "<main>ok</main>",
  });

  assert.doesNotMatch(html, /<style data-inline-site-css>/);
  assert.match(html, /<link rel="stylesheet" href="\/public\/site\.css\?v=\d+" \/>/);
});

test("renderNotFoundPage with a guildId produces a guild-scoped home link", () => {
  const html = renderNotFoundPage({
    title: "플레이어를 찾을 수 없습니다",
    description: "등록된 내전 플레이어가 아니에요.",
    guildId: "123456789",
  });

  assert.match(html, /href="\/123456789"[^>]*>홈으로 돌아가기/);
});

test("renderNotFoundPage without a guildId falls back to the root home link", () => {
  const html = renderNotFoundPage({
    title: "페이지를 찾을 수 없습니다",
    description: "요청한 페이지가 존재하지 않아요.",
  });

  assert.match(html, /href="\/"[^>]*>홈으로 돌아가기/);
});

test("renderRankingTable does not put a static aria-sort on the win-rate header", () => {
  const html = renderRankingTable(
    [
      { discordId: "1", name: "Alpha", recordText: "7승 3패", winRateText: "70%" },
      { discordId: "2", name: "Beta", recordText: "4승 6패", winRateText: "40%" },
    ],
    "123456789"
  );

  const headerCells = html.split("</th>").filter((cell) => cell.includes("<th"));
  const winRateHeaderCell = headerCells.find((cell) => cell.includes("승률"));

  assert.ok(winRateHeaderCell, "expected a header cell containing 승률");
  assert.doesNotMatch(winRateHeaderCell, /aria-sort/);
});
