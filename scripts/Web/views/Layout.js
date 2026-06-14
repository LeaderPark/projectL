const fs = require("node:fs");
const path = require("node:path");

const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");
const { buildGuildPath, escapeHtml } = require("./ViewHelpers");

function getAssetSnapshot(fileName, options = {}) {
  const assetPath = path.join(__dirname, "../../../public", fileName);
  const version = Math.floor(fs.statSync(assetPath).mtimeMs);

  return {
    href: `/public/${fileName}?v=${version}`,
    content:
      options.readAsText === true ? fs.readFileSync(assetPath, "utf8") : undefined,
  };
}

function escapeInlineStyle(cssText) {
  return String(cssText ?? "").replace(/<\/style/gi, "<\\/style");
}

function navLinkAttrs(isActive) {
  return isActive ? ' aria-current="page"' : "";
}

function renderHeader(guildId, activeNav = "") {
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
          <nav class="site-nav" aria-label="주요 메뉴">
            <a href="${escapeHtml(homeHref)}"${navLinkAttrs(activeNav === "home")}>홈</a>
            <a href="${escapeHtml(matchesHref)}"${navLinkAttrs(activeNav === "matches")}>전체 경기</a>
            <a href="${escapeHtml(rankingHref)}"${navLinkAttrs(activeNav === "ranking")}>랭킹</a>
          </nav>
          <form
            class="site-search"
            role="search"
            action="${escapeHtml(playerSearchAction)}"
            data-player-search
            data-search-endpoint="${escapeHtml(playerSearchEndpoint)}"
            data-player-path-prefix="${escapeHtml(playerSearchAction)}"
          >
            <label class="sr-only" for="site-search-input">플레이어 검색</label>
            <input
              type="search"
              id="site-search-input"
              name="q"
              placeholder="플레이어 이름 또는 닉네임 검색"
              autocomplete="off"
              role="combobox"
              aria-expanded="false"
              aria-autocomplete="list"
              aria-controls="site-search-results"
              data-player-search-input
            />
            <button type="submit" class="site-search__submit" aria-label="검색">
              <span aria-hidden="true">🔍</span>
            </button>
            <div
              class="site-search__results"
              id="site-search-results"
              role="listbox"
              aria-label="검색 결과"
              data-player-search-results
            ></div>
          </form>
        </header>
  `;
}

function renderFooter() {
  return `
        <footer class="site-footer">
          <p>${escapeHtml(PROJECT_DISPLAY_NAME)} · 디스코드 내전 전적 공개 기록</p>
        </footer>
  `;
}

// 분석 도구는 기본 비활성. 운영자가 WEB_ANALYTICS_SCRIPT_URL을 설정한 경우에만
// 주입한다(예: Plausible/Umami 등 쿠키리스·프라이버시 친화 도구). 가이드: 출시 후 관찰/측정.
function renderAnalytics() {
  const scriptUrl = String(process.env.WEB_ANALYTICS_SCRIPT_URL ?? "").trim();
  if (!scriptUrl) {
    return "";
  }

  const domain = String(process.env.WEB_ANALYTICS_DOMAIN ?? "").trim();
  const domainAttr = domain ? ` data-domain="${escapeHtml(domain)}"` : "";
  return `<script defer src="${escapeHtml(scriptUrl)}"${domainAttr}></script>`;
}

function renderLayout({
  title: _title,
  body,
  description = `${PROJECT_DISPLAY_NAME} 공개 내전 전적`,
  guildId = "",
  showHeader = true,
  activeNav = "",
  shellClassName = "site-shell",
}) {
  const faviconAsset = getAssetSnapshot("favicon.webp");
  const stylesheetAsset = getAssetSnapshot("site.css", { readAsText: true });
  const scriptAsset = getAssetSnapshot("site.js");

  return `<!DOCTYPE html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(PROJECT_DISPLAY_NAME)}</title>
      <meta name="description" content="${escapeHtml(description)}" />
      <link rel="icon" type="image/webp" href="${escapeHtml(faviconAsset.href)}" />
      <style data-inline-site-css>${escapeInlineStyle(stylesheetAsset.content)}</style>
      <link rel="stylesheet" href="${escapeHtml(stylesheetAsset.href)}" />
      ${renderAnalytics()}
    </head>
    <body>
      ${showHeader ? '<a class="skip-link" href="#main-content">본문 바로가기</a>' : ""}
      <div class="${escapeHtml(shellClassName)}">
        ${showHeader ? renderHeader(guildId, activeNav) : ""}
        ${body}
        ${showHeader ? renderFooter() : ""}
      </div>
      <script src="${escapeHtml(scriptAsset.href)}"></script>
    </body>
  </html>`;
}

module.exports = {
  renderLayout,
};
