const { renderLayout } = require("./Layout");
const { escapeHtml, renderMatchCard } = require("./ViewHelpers");

function renderRankingRows(rows) {
  return rows
    .map(
      (row, index) => `
        <tr>
          <td>#${index + 1}</td>
          <td><a href="/players/${escapeHtml(row.discordId)}">${escapeHtml(row.name)}</a></td>
          <td>${escapeHtml(row.mmrText)}</td>
          <td>${escapeHtml(row.recordText)}</td>
          <td>${escapeHtml(row.winRateText)}</td>
        </tr>
      `
    )
    .join("");
}

function renderHomePage(model) {
  const body = `
    <main class="page page--home">
      ${model.notice ? `
        <section class="panel panel--notice">
          <h2>${escapeHtml(model.notice.title)}</h2>
          <p>${escapeHtml(model.notice.description)}</p>
        </section>
      ` : ""}
      <section class="hero-card">
        <p class="hero-card__eyebrow">ProjectL Public Board</p>
        <h1>전체 내전 전적</h1>
        <p>OP.GG처럼 빠르게 훑고, 바로 개인 상세로 들어갈 수 있는 공개 전적 페이지입니다.</p>
      </section>

      <section class="summary-grid">
        <article class="summary-card"><span>총 경기 수</span><strong>${escapeHtml(model.summary.totalMatchesText)}</strong></article>
        <article class="summary-card"><span>등록 플레이어</span><strong>${escapeHtml(model.summary.totalPlayersText)}</strong></article>
        <article class="summary-card"><span>최고 MMR</span><strong>${escapeHtml(model.summary.topMmrText)}</strong></article>
        <article class="summary-card"><span>최고 승률</span><strong>${escapeHtml(model.summary.topWinRateText)}</strong></article>
      </section>

      <section class="content-grid">
        <section class="panel">
          <div class="panel__header">
            <h2>MMR 랭킹</h2>
          </div>
          <table class="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>플레이어</th>
                <th>MMR</th>
                <th>전적</th>
                <th>승률</th>
              </tr>
            </thead>
            <tbody>
              ${renderRankingRows(model.ranking)}
            </tbody>
          </table>
        </section>

        <section class="panel">
          <div class="panel__header">
            <h2>최근 경기</h2>
          </div>
          <div class="match-feed">
            ${model.recentMatches.map(renderMatchCard).join("")}
          </div>
        </section>
      </section>
    </main>
  `;

  return renderLayout({
    title: "ProjectL 전체 내전 전적",
    description: "ProjectL 내전 기록을 한눈에 보여주는 공개 페이지",
    body,
  });
}

module.exports = {
  renderHomePage,
};
