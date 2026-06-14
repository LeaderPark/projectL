const { renderLayout } = require("./Layout");
const { buildGuildPath, escapeHtml, renderMatchCard } = require("./ViewHelpers");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

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
      (row, index) => `
        <tr>
          <td>#${index + 1}</td>
          <td><a href="${escapeHtml(buildGuildPath(guildId, `/players/${encodeURIComponent(row.discordId)}`))}">${escapeHtml(row.name)}</a></td>
          <td>${escapeHtml(row.recordText)}</td>
          <td>${escapeHtml(row.winRateText)}</td>
        </tr>
      `
    )
    .join("");
}

function renderHomePage(model) {
  const latestMatch = model.recentMatches[0] ?? null;
  const body = `
    <main id="main-content" class="page page--home">
      ${model.notice ? `
        <section class="panel panel--notice">
          <h2>${escapeHtml(model.notice.title)}</h2>
          <p>${escapeHtml(model.notice.description)}</p>
        </section>
      ` : ""}
      <section class="overview-hero hero-card">
        <div class="overview-hero__copy">
          <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Competitive Board</p>
          <h1>전체 내전 전적</h1>
          <p>승패 흐름, 최근 경기 결과, 플레이어 랭킹을 한 화면에서 확인하고 경기별 상세 기록까지 바로 이동할 수 있습니다.</p>
        </div>
        <div class="overview-hero__spotlight">
          <span>최근 전적</span>
          <strong>${latestMatch ? escapeHtml(latestMatch.durationText) : "기록 없음"}</strong>
          <p>${
            model.serverName
              ? escapeHtml(model.serverName)
              : latestMatch
                ? escapeHtml(latestMatch.gameId || `Match #${latestMatch.id}`)
                : "아직 집계된 경기가 없어요."
          }</p>
        </div>
      </section>

      <section class="summary-grid">
        <article class="summary-card"><span>총 경기 수</span><strong>${escapeHtml(model.summary.totalMatchesText)}</strong></article>
        <article class="summary-card"><span>등록 플레이어</span><strong>${escapeHtml(model.summary.totalPlayersText)}</strong></article>
        <article class="summary-card"><span>최고 승률</span><strong>${escapeHtml(model.summary.topWinRateText)}</strong></article>
      </section>

      <section class="content-grid">
        <section class="panel panel--timeline">
          <div class="panel__header">
            <h2>최근 전적</h2>
            <a class="panel__link" href="${escapeHtml(buildGuildPath(model.guildId, "/matches"))}">전체 경기 보기</a>
          </div>
          <div class="match-feed${model.recentMatches.length ? "" : " match-feed--empty"}">
            ${model.recentMatches.length
              ? model.recentMatches
                  .map((card) =>
                    renderMatchCard({
                      ...card,
                      href: buildGuildPath(model.guildId, `/matches/${card.id}`),
                    }, { showResult: false, showSummaryHighlight: false })
                  )
                  .join("")
              : `<div class="panel-empty-state">
                  <strong>아직 집계된 경기가 없어요.</strong>
                  <p>첫 경기 결과가 등록되면 이곳에 최근 전적이 표시됩니다.</p>
                </div>`}
          </div>
        </section>

        <section class="panel panel--ranking">
          <div class="panel__header">
            <h2>공개 랭킹</h2>
          </div>
          <div class="table-scroll">
            <table class="ranking-table">
              <thead>
                <tr>
                  <th scope="col">순위</th>
                  <th scope="col">플레이어</th>
                  <th scope="col">전적</th>
                  <th scope="col">승률</th>
                </tr>
              </thead>
              <tbody>
                ${renderRankingRows(model.ranking, model.guildId)}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  `;

  return renderLayout({
    title: `${PROJECT_DISPLAY_NAME} 전체 내전 전적`,
    description: `${PROJECT_DISPLAY_NAME} 내전 기록을 한눈에 보여주는 공개 페이지`,
    body,
    guildId: model.guildId,
    activeNav: "home",
  });
}

module.exports = {
  renderHomePage,
};
