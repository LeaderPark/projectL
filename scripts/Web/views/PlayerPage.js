const { renderLayout } = require("./Layout");
const {
  buildGuildPath,
  escapeHtml,
  renderMatchCard,
  renderSimpleRows,
} = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderPlayerPage(model) {
  const { profile } = model;
  const body = `
    <main class="page page--player">
      <section class="player-summary-hero player-hero">
        <div class="player-summary-hero__identity">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Player</p>
          <h1>${escapeHtml(profile.name)}</h1>
          <p>${escapeHtml(profile.recordText)} · 승률 ${escapeHtml(profile.winRateText)} · 최근 경기와 주력 지표를 한 번에 확인할 수 있습니다.</p>
        </div>
        <div class="player-hero__stats player-summary-hero__stats">
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
        <section class="panel panel--timeline">
          <div class="panel__header"><h2>최근 경기</h2></div>
          <div class="match-feed">
            ${model.recentMatches
              .map((card) =>
                renderMatchCard({
                  ...card,
                  href: buildGuildPath(model.guildId, `/matches/${card.id}`),
                }, { showResult: true })
              )
              .join("")}
          </div>
        </section>
      </section>
    </main>
  `;

  return renderLayout({
    title: `${profile.name} - ${PROJECT_DISPLAY_NAME}`,
    description: `${profile.name}의 ${PROJECT_DISPLAY_NAME} 내전 전적`,
    body,
    guildId: model.guildId,
  });
}

module.exports = {
  renderPlayerPage,
};
