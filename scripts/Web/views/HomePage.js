const { renderLayout } = require("./Layout");
const {
  buildGuildPath,
  escapeHtml,
  renderMatchCard,
  renderNoticePanel,
  renderRankingTable,
  renderStatTile,
} = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderHomePage(model) {
  const body = `
    <main id="main-content" class="page page--home">
      ${renderNoticePanel(model.notice)}
      <section class="overview-hero hero-card">
        <div class="overview-hero__copy">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Competitive Board</p>
          <h1>${model.serverName ? `${escapeHtml(model.serverName)} ` : ""}전체 내전 전적</h1>
        </div>
      </section>

      <section class="summary-grid">
        ${renderStatTile("총 경기 수", model.summary.totalMatchesText, "summary-card")}
        ${renderStatTile("등록 플레이어", model.summary.totalPlayersText, "summary-card")}
        ${renderStatTile("최고 승률", model.summary.topWinRateText, "summary-card")}
      </section>

      <section class="content-grid">
        <section class="panel panel--timeline">
          <div class="panel__header">
            <h2>최근 전적</h2>
            <a class="panel__link" href="${escapeHtml(buildGuildPath(model.guildId, "/matches"))}">전체 경기 보기</a>
          </div>
          <div class="match-feed${model.recentMatches.length ? "" : " match-feed--empty"}">
            ${model.recentMatches.length
              ? model.recentMatches
                  .map((card) =>
                    renderMatchCard({
                      ...card,
                      href: buildGuildPath(model.guildId, `/matches/${card.id}`),
                    }, { showResult: false, showSummaryHighlight: false })
                  )
                  .join("")
              : `<div class="panel-empty-state">
                  <strong>아직 집계된 경기가 없어요.</strong>
                  <p>첫 경기 결과가 등록되면 이곳에 최근 전적이 표시됩니다.</p>
                </div>`}
          </div>
        </section>

        <section class="panel panel--ranking">
          <div class="panel__header">
            <h2>공개 랭킹</h2>
          </div>
          ${renderRankingTable(model.ranking, model.guildId)}
        </section>
      </section>
    </main>
  `;

  return renderLayout({
    title: `${PROJECT_DISPLAY_NAME} 전체 내전 전적`,
    description: `${PROJECT_DISPLAY_NAME} 내전 기록을 한눈에 보여주는 공개 페이지`,
    body,
    guildId: model.guildId,
    activeNav: "home",
  });
}

module.exports = {
  renderHomePage,
};
