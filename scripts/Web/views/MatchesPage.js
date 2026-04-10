const { renderLayout } = require("./Layout");
const { buildGuildPath, renderMatchCard } = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderEmptyTimelineState() {
  return `
    <div class="panel-empty-state">
      <strong>아직 집계된 경기가 없어요.</strong>
      <p>첫 경기 결과가 등록되면 이 타임라인에서 바로 확인할 수 있습니다.</p>
    </div>
  `;
}

function renderMatchesPage(model) {
  const hasCards = model.cards.length > 0;
  const body = `
    <main class="page page--matches">
      ${model.notice ? `
        <section class="panel panel--notice">
          <h2>${model.notice.title}</h2>
          <p>${model.notice.description}</p>
        </section>
      ` : ""}
      <section class="hero-card hero-card--compact">
        <div class="overview-hero__copy">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Timeline</p>
          <h1>전체 경기</h1>
          <p>최신 경기부터 이어지는 카드형 타임라인으로 전체 전적 흐름을 한눈에 확인할 수 있습니다.</p>
        </div>
      </section>
      <section class="panel panel--timeline">
        <div class="panel__header">
          <h2>전체 전적 타임라인</h2>
          <span>최신순</span>
        </div>
        <div class="match-feed${hasCards ? "" : " match-feed--empty"}">
          ${hasCards
            ? model.cards
              .map((card) =>
                renderMatchCard({
                  ...card,
                  href: buildGuildPath(model.guildId, `/matches/${card.id}`),
                }, { showResult: false, showSummaryHighlight: false })
              )
              .join("")
            : renderEmptyTimelineState()}
        </div>
      </section>
    </main>
  `;

  return renderLayout({
    title: `${PROJECT_DISPLAY_NAME} 전체 경기`,
    description: `${PROJECT_DISPLAY_NAME} 전체 경기 히스토리`,
    body,
    guildId: model.guildId,
  });
}

module.exports = {
  renderMatchesPage,
};
