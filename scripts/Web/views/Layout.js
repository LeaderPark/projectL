const fs = require("node:fs");
const path = require("node:path");

const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");
const { buildGuildPath, escapeHtml } = require("./ViewHelpers");

function getAssetHref(fileName) {
  const assetPath = path.join(__dirname, "../../../public", fileName);
  const version = Math.floor(fs.statSync(assetPath).mtimeMs);
  return `/public/${fileName}?v=${version}`;
}

function renderHeader(guildId) {
  const homeHref = buildGuildPath(guildId);
  const matchesHref = buildGuildPath(guildId, "/matches");
  const rankingHref = buildGuildPath(guildId, "/ranking");
  const playerSearchAction = buildGuildPath(guildId, "/players");
  const playerSearchEndpoint = buildGuildPath(guildId, "/api/search");

  return `
        <header class="site-header">
          <a class="site-logo" href="${escapeHtml(homeHref)}">
            <span class="site-logo__text">${escapeHtml(PROJECT_DISPLAY_NAME)}</span>
          </a>
          <nav class="site-nav">
            <a href="${escapeHtml(homeHref)}">홈</a>
            <a href="${escapeHtml(matchesHref)}">전체 경기</a>
            <a href="${escapeHtml(rankingHref)}">랭킹</a>
          </nav>
          <form
            class="site-search"
            action="${escapeHtml(playerSearchAction)}"
            data-player-search
            data-search-endpoint="${escapeHtml(playerSearchEndpoint)}"
            data-player-path-prefix="${escapeHtml(playerSearchAction)}"
          >
            <input
              type="search"
              name="q"
              placeholder="플레이어 이름 또는 닉네임 검색"
              autocomplete="off"
              data-player-search-input
            />
            <div class="site-search__results" data-player-search-results></div>
          </form>
        </header>
  `;
}

function renderLayout({
  title: _title,
  body,
  description = `${PROJECT_DISPLAY_NAME} 공개 내전 전적`,
  guildId = "",
  showHeader = true,
  shellClassName = "site-shell",
}) {
  const faviconHref = getAssetHref("favicon.webp");
  const stylesheetHref = getAssetHref("site.css");
  const scriptHref = getAssetHref("site.js");

  return `<!DOCTYPE html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(PROJECT_DISPLAY_NAME)}</title>
      <meta name="description" content="${escapeHtml(description)}" />
      <link rel="icon" type="image/webp" href="${escapeHtml(faviconHref)}" />
      <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}" />
    </head>
    <body>
      <div class="${escapeHtml(shellClassName)}">
        ${showHeader ? renderHeader(guildId) : ""}
        ${body}
      </div>
      <script src="${escapeHtml(scriptHref)}"></script>
    </body>
  </html>`;
}

module.exports = {
  renderLayout,
};
