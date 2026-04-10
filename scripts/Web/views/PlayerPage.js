const { renderLayout } = require("./Layout");
const {
  buildGuildPath,
  escapeHtml,
  renderMatchCard,
  renderSimpleRows,
} = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderLinkedRiotAccountRows(accounts = []) {
  if (!accounts.length) {
    return '<li class="simple-list__empty">등록된 롤 계정이 없어요.</li>';
  }

  return accounts
    .map(
      (account) => `
        <li class="simple-list__item">
          <span class="simple-list__name">${escapeHtml(account.displayName)}</span>
        </li>
      `
    )
    .join("");
}

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

      <section class="player-page__shell">
        <section class="panel panel--timeline player-page__main">
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
        <aside class="panel player-page__sidebar">
          <div class="panel__header">
            <h2>플레이 성향 요약</h2>
            <span>서브 지표</span>
          </div>
          <div class="player-page__sidebar-sections">
            <section class="player-page__sidebar-section">
              <h3>등록된 롤 닉네임</h3>
              <ul class="simple-list">
                ${renderLinkedRiotAccountRows(profile.linkedRiotAccounts)}
              </ul>
            </section>
            <section class="player-page__sidebar-section">
              <h3>주 챔피언</h3>
              <ul class="simple-list">
                ${renderSimpleRows(profile.favoriteChampions)}
              </ul>
            </section>
            <section class="player-page__sidebar-section">
              <h3>함께 잘 맞는 팀원</h3>
              <ul class="simple-list">
                ${renderSimpleRows(profile.friends)}
              </ul>
            </section>
            <section class="player-page__sidebar-section">
              <h3>선호 라인</h3>
              <ul class="simple-list">
                ${renderSimpleRows(profile.preferredLanes)}
              </ul>
            </section>
          </div>
        </aside>
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
