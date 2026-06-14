const { renderLayout } = require("./Layout");
const { renderNoticePanel, renderRankingTable } = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderRankingPage(model) {
  const body = `
    <main id="main-content" class="page page--ranking">
      ${renderNoticePanel(model.notice)}
      <section class="hero-card hero-card--compact">
        <div class="overview-hero__copy">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Ranking</p>
          <h1>전체 랭킹</h1>
          <p>현재 공개 사이트 기준으로 집계된 전체 플레이어 랭킹을 한 번에 확인하고, 각 플레이어 프로필로 바로 이동할 수 있습니다.</p>
        </div>
      </section>
      <section class="panel panel--ranking-full">
        <div class="panel__header">
          <h2>전체 플레이어 랭킹</h2>
          <span>MMR(실력 점수) 기준 정렬 · 머리글을 눌러 다시 정렬</span>
        </div>
        ${renderRankingTable(model.ranking, model.guildId)}
      </section>
    </main>
  `;

  return renderLayout({
    title: `${PROJECT_DISPLAY_NAME} Ranking`,
    description: `${PROJECT_DISPLAY_NAME} 전체 플레이어 랭킹`,
    body,
    guildId: model.guildId,
    activeNav: "ranking",
  });
}

module.exports = {
  renderRankingPage,
};
