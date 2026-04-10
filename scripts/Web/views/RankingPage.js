const { renderLayout } = require("./Layout");
const { buildGuildPath, escapeHtml } = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function buildRankCell(index) {
  const rank = index + 1;

  if (rank > 3) {
    return `#${rank}`;
  }

  return `
    <span class="ranking-table__rank-badge ranking-table__rank-badge--top-${rank}">
      <strong>${rank}</strong>
    </span>
  `;
}

function renderRankingRows(rows, guildId) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="4">아직 집계된 플레이어가 없어요.</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row, index) => {
        const rank = index + 1;
        const rowClassName = rank <= 3
          ? `ranking-table__row ranking-table__row--top-${rank}`
          : "ranking-table__row";

        return `
        <tr class="${rowClassName}">
          <td class="ranking-table__rank-cell">${buildRankCell(index)}</td>
          <td><a href="${escapeHtml(buildGuildPath(guildId, `/players/${encodeURIComponent(row.discordId)}`))}">${escapeHtml(row.name)}</a></td>
          <td>${escapeHtml(row.recordText)}</td>
          <td>${escapeHtml(row.winRateText)}</td>
        </tr>
      `;
      }
    )
    .join("");
}

function renderRankingPage(model) {
  const body = `
    <main class="page page--ranking">
      ${model.notice ? `
        <section class="panel panel--notice">
          <h2>${escapeHtml(model.notice.title)}</h2>
          <p>${escapeHtml(model.notice.description)}</p>
        </section>
      ` : ""}
      <section class="hero-card hero-card--compact">
        <div class="overview-hero__copy">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Ranking</p>
          <h1>전체 랭킹</h1>
          <p>현재 공개 사이트 기준으로 집계된 전체 플레이어 랭킹을 한 번에 확인하고, 각 플레이어 프로필로 바로 이동할 수 있습니다.</p>
        </div>
      </section>
      <section class="panel panel--ranking-full">
        <div class="panel__header">
          <h2>전체 플레이어 랭킹</h2>
          <span>MMR 기준 정렬</span>
        </div>
        <div class="table-scroll">
          <table class="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>플레이어</th>
                <th>전적</th>
                <th>승률</th>
              </tr>
            </thead>
            <tbody>
              ${renderRankingRows(model.ranking, model.guildId)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  return renderLayout({
    title: `${PROJECT_DISPLAY_NAME} Ranking`,
    description: `${PROJECT_DISPLAY_NAME} 전체 플레이어 랭킹`,
    body,
    guildId: model.guildId,
  });
}

module.exports = {
  renderRankingPage,
};
