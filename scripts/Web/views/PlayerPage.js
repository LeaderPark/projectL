const { renderLayout } = require("./Layout");
const { escapeHtml, renderMatchCard, renderSimpleRows } = require("./ViewHelpers");

function renderPlayerPage(model) {
  const { profile } = model;
  const body = `
    <main class="page page--player">
      <section class="player-hero">
        <p class="hero-card__eyebrow">ProjectL Player</p>
        <h1>${escapeHtml(profile.name)}</h1>
        <div class="player-hero__stats">
          <article><span>MMR</span><strong>${escapeHtml(profile.mmrText)}</strong></article>
          <article><span>전적</span><strong>${escapeHtml(profile.recordText)}</strong></article>
          <article><span>승률</span><strong>${escapeHtml(profile.winRateText)}</strong></article>
          <article><span>평균 KDA</span><strong>${escapeHtml(profile.averageKdaText)}</strong></article>
          <article><span>평균 킬관여</span><strong>${escapeHtml(profile.averageKillRateText)}</strong></article>
        </div>
      </section>

      <section class="content-grid">
        <section class="panel">
          <div class="panel__header"><h2>주 챔피언</h2></div>
          <ul class="simple-list">
            ${renderSimpleRows(profile.favoriteChampions)}
          </ul>
        </section>
        <section class="panel">
          <div class="panel__header"><h2>선호 라인</h2></div>
          <ul class="simple-list">
            ${renderSimpleRows(profile.preferredLanes)}
          </ul>
        </section>
      </section>

      <section class="content-grid">
        <section class="panel">
          <div class="panel__header"><h2>함께 잘 맞는 팀원</h2></div>
          <ul class="simple-list">
            ${renderSimpleRows(profile.friends)}
          </ul>
        </section>
        <section class="panel">
          <div class="panel__header"><h2>최근 경기</h2></div>
          <div class="match-feed">
            ${model.recentMatches.map(renderMatchCard).join("")}
          </div>
        </section>
      </section>
    </main>
  `;

  return renderLayout({
    title: `${profile.name} - ProjectL`,
    description: `${profile.name}의 ProjectL 내전 전적`,
    body,
  });
}

module.exports = {
  renderPlayerPage,
};
