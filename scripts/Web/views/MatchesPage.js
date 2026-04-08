const { renderLayout } = require("./Layout");
const { renderMatchCard } = require("./ViewHelpers");

function renderMatchesPage(model) {
  const body = `
    <main class="page page--matches">
      ${model.notice ? `
        <section class="panel panel--notice">
          <h2>${model.notice.title}</h2>
          <p>${model.notice.description}</p>
        </section>
      ` : ""}
      <section class="hero-card hero-card--compact">
        <p class="hero-card__eyebrow">ProjectL History</p>
        <h1>전체 경기</h1>
        <p>누적된 내전 경기 결과를 최신순으로 확인할 수 있습니다.</p>
      </section>
      <section class="panel">
        <div class="match-feed">
          ${model.cards.map(renderMatchCard).join("")}
        </div>
      </section>
    </main>
  `;

  return renderLayout({
    title: "ProjectL 전체 경기",
    description: "ProjectL 전체 경기 히스토리",
    body,
  });
}

module.exports = {
  renderMatchesPage,
};
