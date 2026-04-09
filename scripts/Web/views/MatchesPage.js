const { renderLayout } = require("./Layout");
const { buildGuildPath, renderMatchCard } = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderMatchesPage(model) {
  const body = `
    <main class="page page--matches">
      ${model.notice ? `
        <section class="panel panel--notice">
          <h2>${model.notice.title}</h2>
          <p>${model.notice.description}</p>
        </section>
      ` : ""}
      <section class="overview-hero hero-card hero-card--compact">
        <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Timeline</p>
        <h1>전체 경기</h1>
        <p>전체 전적 타임라인을 최신 경기부터 OP.GG 스타일의 압축 카드로 살펴볼 수 있습니다.</p>
      </section>
      <section class="panel panel--timeline">
        <div class="panel__header">
          <h2>전체 전적 타임라인</h2>
          <span>최신순</span>
        </div>
        <div class="match-feed">
          ${model.cards
            .map((card) =>
              renderMatchCard({
                ...card,
                href: buildGuildPath(model.guildId, `/matches/${card.id}`),
              }, { showResult: false })
            )
            .join("")}
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
