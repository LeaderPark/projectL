const { renderLayout } = require("./Layout");
const {
  buildGuildPath,
  escapeHtml,
  renderMatchCard,
  renderNoticePanel,
} = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderEmptyTimelineState() {
  return `
    <div class="panel-empty-state">
      <strong>아직 집계된 경기가 없어요.</strong>
      <p>첫 경기 결과가 등록되면 이 타임라인에서 바로 확인할 수 있습니다.</p>
    </div>
  `;
}

function renderFilterControl(hasCards) {
  if (!hasCards) {
    return "";
  }

  return `
    <div class="match-filter">
      <label class="sr-only" for="match-filter-input">경기 필터 (플레이어 이름)</label>
      <input
        type="search"
        id="match-filter-input"
        class="match-filter__input"
        placeholder="플레이어 이름으로 이 목록 거르기"
        autocomplete="off"
        data-match-filter
        aria-controls="match-timeline-feed"
      />
      <p class="match-filter__empty" data-match-filter-empty role="status" aria-live="polite" hidden>
        조건에 맞는 경기가 없어요.
      </p>
    </div>
  `;
}

function renderMatchesPage(model) {
  const hasCards = model.cards.length > 0;
  const body = `
    <main id="main-content" class="page page--matches">
      ${renderNoticePanel(model.notice)}
      <section class="hero-card hero-card--compact">
        <div class="overview-hero__copy">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Timeline</p>
          <h1>${model.serverName ? `${escapeHtml(model.serverName)} ` : ""}전체 경기</h1>
        </div>
      </section>
      <section class="panel panel--timeline">
        <div class="panel__header">
          <h2>전체 전적 타임라인</h2>
          <span>최신순</span>
        </div>
        ${renderFilterControl(hasCards)}
        <div class="match-feed${hasCards ? "" : " match-feed--empty"}" id="match-timeline-feed">
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
    activeNav: "matches",
  });
}

module.exports = {
  renderMatchesPage,
};
