function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPlayerList(players) {
  return players
    .map(
      (player) => `
        <li class="match-player">
          <span class="match-player__name">${escapeHtml(player.name)}</span>
          <span class="match-player__champion">${escapeHtml(player.championName)}</span>
          <span class="match-player__lane">${escapeHtml(player.lane)}</span>
          <span class="match-player__kda">${escapeHtml(player.kdaText)}</span>
        </li>
      `
    )
    .join("");
}

function renderMatchCard(card) {
  return `
    <article class="match-card">
      <div class="match-card__header">
        <div>
          <p class="match-card__eyebrow">Match #${escapeHtml(card.id)}</p>
          <h3 class="match-card__title">${escapeHtml(card.durationText)}</h3>
        </div>
        <span class="match-card__badge match-card__badge--${escapeHtml(card.winningSide)}">${escapeHtml(card.teams[card.winningSide].resultText)}</span>
      </div>
      <div class="match-card__teams">
        <section class="team-panel team-panel--blue">
          <h4>Blue Team</h4>
          <p class="team-panel__result">${escapeHtml(card.teams.blue.resultText)}</p>
          <ul class="match-player-list">
            ${renderPlayerList(card.teams.blue.players)}
          </ul>
        </section>
        <section class="team-panel team-panel--purple">
          <h4>Purple Team</h4>
          <p class="team-panel__result">${escapeHtml(card.teams.purple.resultText)}</p>
          <ul class="match-player-list">
            ${renderPlayerList(card.teams.purple.players)}
          </ul>
        </section>
      </div>
    </article>
  `;
}

function renderSimpleRows(items) {
  if (!items.length) {
    return '<li class="simple-list__empty">아직 집계된 데이터가 없어요.</li>';
  }

  return items
    .map(
      (item) => `
        <li class="simple-list__item">
          <span>${escapeHtml(item.name)}</span>
          <span>${escapeHtml(item.recordText)}</span>
        </li>
      `
    )
    .join("");
}

module.exports = {
  escapeHtml,
  renderMatchCard,
  renderSimpleRows,
};
