const { renderLayout } = require("./Layout");
const { escapeHtml, renderMatchDetailShell } = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderMatchDetailPage({ guildId, match }) {
  const body = `
    <main class="page page--match-detail">
      <section class="overview-hero hero-card hero-card--compact">
        <div class="overview-hero__copy">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Match Detail</p>
          <h1>경기 상세</h1>
          <p>Match #${escapeHtml(match.id)} · ${escapeHtml(match.gameId)} · ${escapeHtml(match.durationText)}${match.playedAtText ? ` · ${escapeHtml(match.playedAtText)}` : ""}</p>
        </div>
      </section>
      ${renderMatchDetailShell(match, {
        detailId: `${match.detailId}-page`,
      })}
    </main>
  `;

  return renderLayout({
    title: `경기 상세 - ${match.gameId}`,
    description: `${match.gameId} 경기 상세 기록`,
    body,
    guildId,
  });
}

module.exports = {
  renderMatchDetailPage,
};
