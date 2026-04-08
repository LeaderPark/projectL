const { escapeHtml } = require("./ViewHelpers");

function renderLayout({ title, body, description = "ProjectL public inhouse records" }) {
  return `<!DOCTYPE html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <meta name="description" content="${escapeHtml(description)}" />
      <link rel="stylesheet" href="/public/site.css" />
    </head>
    <body>
      <div class="site-shell">
        <header class="site-header">
          <a class="site-logo" href="/">ProjectL Record</a>
          <nav class="site-nav">
            <a href="/">홈</a>
            <a href="/matches">전체 경기</a>
          </nav>
          <form class="site-search" action="/players" data-player-search>
            <input
              type="search"
              name="q"
              placeholder="플레이어 이름 검색"
              autocomplete="off"
              data-player-search-input
            />
            <div class="site-search__results" data-player-search-results></div>
          </form>
        </header>
        ${body}
      </div>
      <script src="/public/site.js"></script>
    </body>
  </html>`;
}

module.exports = {
  renderLayout,
};
