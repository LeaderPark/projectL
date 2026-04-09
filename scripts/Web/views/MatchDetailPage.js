const { renderLayout } = require("./Layout");
const { escapeHtml, renderAssetImage } = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderBuildTokens(label, assets, className) {
  return `
    <div class="${className}">
      <strong>${escapeHtml(label)}</strong>
      <div>
        ${assets
          .map((asset) =>
            renderAssetImage(
              asset,
              `${className}__icon`,
              String(asset?.id ?? "")
            )
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderDetailPlayerRows(players) {
  return players
    .map(
      (player) => `
        <li class="match-detail-player">
          <div class="match-detail-player__identity">
            ${renderAssetImage(
              { imageUrl: player.championImageUrl, name: player.championName },
              "match-detail-player__champion-image",
              player.championName?.slice(0, 1)
            )}
            <div>
              <strong>${escapeHtml(player.name)}</strong>
              <span>${escapeHtml(player.championName)} · ${escapeHtml(player.lane)} · Lv.${escapeHtml(player.level)}</span>
            </div>
          </div>
          <div class="match-detail-player__stats">
            <span>KDA ${escapeHtml(player.kdaText)}</span>
            <span>퍼포먼스 ${escapeHtml(player.performanceScore)}</span>
            <span>총 피해량 ${escapeHtml(player.damageText)}</span>
            <span>와드 점수 ${escapeHtml(player.visionScoreText)}</span>
            <span>CS ${escapeHtml(player.minionScoreText)} (${escapeHtml(player.csPerMinuteText)})</span>
          </div>
          <div class="match-detail-player__builds">
            ${renderBuildTokens("스펠", player.spellAssets ?? [], "match-detail-player__spells")}
            ${renderBuildTokens("룬", [
              {
                id: player.keystoneId,
                name: player.keystoneName,
                imageUrl: player.keystoneImageUrl,
              },
            ], "match-detail-player__runes")}
            ${renderBuildTokens("아이템 빌드", player.itemAssets ?? [], "match-detail-player__items")}
          </div>
        </li>
      `
    )
    .join("");
}

function renderTeamSection(teamName, team, modifier) {
  return `
    <section class="panel match-detail-team match-detail-team--${escapeHtml(modifier)}">
      <div class="panel__header">
        <h2>${escapeHtml(teamName)}</h2>
        <span>${escapeHtml(team.resultText)} · ${escapeHtml(team.totalKillsText)}킬</span>
      </div>
      <ul class="match-detail-player-list">
        ${renderDetailPlayerRows(team.players)}
      </ul>
    </section>
  `;
}

function renderMatchDetailPage({ guildId, match }) {
  const body = `
    <main class="page page--match-detail">
      <section class="overview-hero hero-card hero-card--compact">
        <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Match Detail</p>
        <h1>경기 상세</h1>
        <p>Match #${escapeHtml(match.id)} · ${escapeHtml(match.gameId)} · ${escapeHtml(match.durationText)}${match.playedAtText ? ` · ${escapeHtml(match.playedAtText)}` : ""}</p>
      </section>
      ${renderTeamSection("Blue Team", match.teams.blue, "blue")}
      ${renderTeamSection("Purple Team", match.teams.purple, "purple")}
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
