function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildGuildPath(guildId, suffix = "") {
  const normalizedGuildId = String(guildId ?? "").trim();
  if (!normalizedGuildId) {
    return suffix || "/";
  }

  return `/${encodeURIComponent(normalizedGuildId)}${suffix}`;
}

function renderAssetImage({ imageUrl, name = "" } = {}, className, fallback = "") {
  if (imageUrl) {
    return `<img class="${className}" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" loading="lazy" />`;
  }

  return `<span class="${className} ${className}--placeholder">${escapeHtml(fallback || name || "?")}</span>`;
}

function renderIconGroup(items, className) {
  return `
    <div class="${className}">
      ${items
        .map((item) =>
          renderAssetImage(item, `${className}__icon`, String(item?.id ?? ""))
        )
        .join("")}
    </div>
  `;
}

function buildPlayerMeta(player) {
  const fragments = [player.championName, player.lane].filter(Boolean);
  if (player.level) {
    fragments.push(`Lv.${player.level}`);
  }

  return fragments.join(" · ");
}

function renderCompactPlayer(player) {
  return `
    <li class="match-row__player">
      <div class="match-row__champion-block">
        ${renderAssetImage(
          { imageUrl: player.championImageUrl, name: player.championName },
          "match-row__champion-image",
          player.championName?.slice(0, 1)
        )}
        <div class="match-row__spells-runes">
          ${renderIconGroup(player.spellAssets ?? [], "match-row__spells")}
          ${renderAssetImage(
            { imageUrl: player.keystoneImageUrl, name: player.keystoneName },
            "match-row__rune-image",
            player.keystoneId
          )}
        </div>
      </div>
      <div class="match-row__player-main">
        <strong class="match-row__player-name">${escapeHtml(player.name)}</strong>
        <span class="match-row__player-meta">${escapeHtml(buildPlayerMeta(player))}</span>
      </div>
      <div class="match-row__player-kda">
        <strong>${escapeHtml(player.kdaText)}</strong>
        <span>딜량 ${escapeHtml(player.damageText)}</span>
      </div>
      ${renderIconGroup(player.itemAssets ?? [], "match-row__items")}
    </li>
  `;
}

function renderTeamRoster(team, sideLabel) {
  return `
    <section class="match-row__team match-row__team--${escapeHtml(sideLabel)}">
      <header class="match-row__team-header">
        <div>
          <strong>${escapeHtml(team.resultText)}</strong>
          <span>${escapeHtml(sideLabel === "blue" ? "블루팀" : "레드팀")}</span>
        </div>
        <strong>${escapeHtml(team.totalKillsText)}킬</strong>
      </header>
      <ul class="match-row__player-list">
        ${team.players.map(renderCompactPlayer).join("")}
      </ul>
    </section>
  `;
}

function renderScoreboardRows(team, sideLabel) {
  return team.players
    .map(
      (player) => `
        <li class="match-scoreboard__row match-scoreboard__row--${escapeHtml(sideLabel)}">
          <div class="match-scoreboard__identity">
            ${renderAssetImage(
              { imageUrl: player.championImageUrl, name: player.championName },
              "match-scoreboard__champion-image",
              player.championName?.slice(0, 1)
            )}
            <div>
              <strong>${escapeHtml(player.name)}</strong>
              <span>${escapeHtml(buildPlayerMeta(player))}</span>
            </div>
          </div>
          <div class="match-scoreboard__stat"><strong>${escapeHtml(player.kdaText)}</strong><span>KDA</span></div>
          <div class="match-scoreboard__stat"><strong>${escapeHtml(player.damageText)}</strong><span>피해량</span></div>
          <div class="match-scoreboard__stat"><strong>${escapeHtml(player.visionScoreText)}</strong><span>와드</span></div>
          <div class="match-scoreboard__stat"><strong>${escapeHtml(player.minionScoreText)}</strong><span>CS</span></div>
          <div class="match-scoreboard__build">
            ${renderIconGroup(player.spellAssets ?? [], "match-scoreboard__spells")}
            ${renderAssetImage(
              { imageUrl: player.keystoneImageUrl, name: player.keystoneName },
              "match-scoreboard__rune-image",
              player.keystoneId
            )}
            ${renderIconGroup(player.itemAssets ?? [], "match-scoreboard__items")}
          </div>
        </li>
      `
    )
    .join("");
}

function getFeaturedPlayer(card) {
  const players = [...(card.teams.blue.players ?? []), ...(card.teams.purple.players ?? [])];
  if (!players.length) {
    return null;
  }

  return [...players].sort((left, right) => {
    if ((right.performanceScore ?? 0) !== (left.performanceScore ?? 0)) {
      return (right.performanceScore ?? 0) - (left.performanceScore ?? 0);
    }

    return String(left.name ?? "").localeCompare(String(right.name ?? ""), "ko");
  })[0];
}

function renderSummaryHighlight(card) {
  const featuredPlayer = getFeaturedPlayer(card);
  if (!featuredPlayer) {
    return '<div class="match-row__summary-highlight match-row__summary-highlight--empty"><span>표시할 플레이어 데이터가 없습니다.</span></div>';
  }

  return `
    <div class="match-row__summary-highlight">
      <div class="match-row__summary-highlight-identity">
        <div class="match-row__champion-block">
          ${renderAssetImage(
            { imageUrl: featuredPlayer.championImageUrl, name: featuredPlayer.championName },
            "match-row__champion-image",
            featuredPlayer.championName?.slice(0, 1)
          )}
          <div class="match-row__spells-runes">
            ${renderIconGroup(featuredPlayer.spellAssets ?? [], "match-row__spells")}
            ${renderAssetImage(
              { imageUrl: featuredPlayer.keystoneImageUrl, name: featuredPlayer.keystoneName },
              "match-row__rune-image",
              featuredPlayer.keystoneId
            )}
          </div>
        </div>
        <div class="match-row__summary-highlight-copy">
          <strong class="match-row__player-name">${escapeHtml(featuredPlayer.name)}</strong>
          <span class="match-row__player-meta">${escapeHtml(buildPlayerMeta(featuredPlayer))}</span>
        </div>
      </div>
      <div class="match-row__summary-highlight-stats">
        <strong>${escapeHtml(featuredPlayer.kdaText)}</strong>
        <span>딜량 ${escapeHtml(featuredPlayer.damageText)}</span>
      </div>
      <div class="match-row__summary-highlight-builds">
        ${renderIconGroup(featuredPlayer.itemAssets ?? [], "match-row__items")}
      </div>
    </div>
  `;
}

function renderTabPanel(card, tabId) {
  if (tabId === "summary") {
    return `
      <div class="match-row__panel-body match-row__panel-body--teams">
        ${renderTeamRoster(card.teams.blue, "blue")}
        ${renderTeamRoster(card.teams.purple, "red")}
      </div>
    `;
  }

  if (tabId === "op-score") {
    return `
      <div class="match-scoreboard">
        <div class="match-scoreboard__section">
          <header class="match-scoreboard__section-header"><strong>승리 (${escapeHtml(card.teams.blue.totalKillsText)}킬)</strong></header>
          <ul class="match-scoreboard__list">
            ${renderScoreboardRows(card.teams.blue, "blue")}
          </ul>
        </div>
        <div class="match-scoreboard__section">
          <header class="match-scoreboard__section-header"><strong>패배 (${escapeHtml(card.teams.purple.totalKillsText)}킬)</strong></header>
          <ul class="match-scoreboard__list">
            ${renderScoreboardRows(card.teams.purple, "red")}
          </ul>
        </div>
      </div>
    `;
  }

  if (tabId === "team-analysis") {
    return `
      <div class="match-row__team-analysis">
        <article><span>블루팀 킬</span><strong>${escapeHtml(card.teams.blue.totalKillsText)}</strong></article>
        <article><span>레드팀 킬</span><strong>${escapeHtml(card.teams.purple.totalKillsText)}</strong></article>
        <article><span>게임 길이</span><strong>${escapeHtml(card.durationText)}</strong></article>
        <article><span>게임 ID</span><strong>${escapeHtml(card.gameId)}</strong></article>
      </div>
    `;
  }

  if (tabId === "build") {
    return `
      <div class="match-build-grid">
        ${[...card.teams.blue.players, ...card.teams.purple.players]
          .map(
            (player) => `
              <article class="match-build-grid__player">
                <header>
                  <strong>${escapeHtml(player.name)}</strong>
                  <span>${escapeHtml(player.championName)}</span>
                </header>
                ${renderIconGroup(player.spellAssets ?? [], "match-build-grid__spells")}
                ${renderAssetImage(
                  { imageUrl: player.keystoneImageUrl, name: player.keystoneName },
                  "match-build-grid__rune-image",
                  player.keystoneId
                )}
                ${renderIconGroup(player.itemAssets ?? [], "match-build-grid__items")}
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div class="match-row__other-grid">
      ${[...card.teams.blue.players, ...card.teams.purple.players]
        .map(
          (player) => `
            <article class="match-row__other-card">
              <strong>${escapeHtml(player.name)}</strong>
              <span>라인 ${escapeHtml(player.lane)}</span>
              <span>레벨 ${escapeHtml(player.level)}</span>
              <span>퍼포먼스 ${escapeHtml(player.performanceScore)}</span>
              <span>CS/분 ${escapeHtml(player.csPerMinuteText)}</span>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderMatchDetailSection(card) {
  return `
    <section
      class="match-row__detail"
      id="${escapeHtml(card.detailId)}"
      data-match-detail="${escapeHtml(card.detailId)}"
      hidden
    >
      <div class="match-row__tabs" role="tablist" aria-label="매치 상세 탭">
        ${card.tabs
          .map(
            (tab, index) => `
              <button
                type="button"
                class="match-row__tab${index === 0 ? " is-active" : ""}"
                data-match-tab="${escapeHtml(tab.id)}"
                data-match-tab-target="${escapeHtml(card.detailId)}"
                aria-selected="${index === 0 ? "true" : "false"}"
              >${escapeHtml(tab.label)}</button>
            `
          )
          .join("")}
      </div>
      <div class="match-row__panels">
        ${card.tabs
          .map(
            (tab, index) => `
              <section
                class="match-row__panel${index === 0 ? " is-active" : ""}"
                data-match-panel="${escapeHtml(tab.id)}"
                data-match-panel-parent="${escapeHtml(card.detailId)}"
                ${index === 0 ? "" : "hidden"}
              >
                ${renderTabPanel(card, tab.id)}
              </section>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderMatchCard(card) {
  return `
    <article class="match-row match-row--${escapeHtml(card.winningSide)}" data-match-row="${escapeHtml(card.id)}">
      <div class="match-row__summary">
        <div class="match-row__result">
          <strong>${escapeHtml(card.teams[card.winningSide].resultText)}</strong>
          <span>내전</span>
        </div>
        <button
          type="button"
          class="match-row__summary-button"
          data-match-toggle="${escapeHtml(card.toggleId)}"
          aria-expanded="false"
          aria-controls="${escapeHtml(card.detailId)}"
        >
          <div class="match-row__meta">
            <span class="match-row__meta-label">Match #${escapeHtml(card.id)}</span>
            <strong>${escapeHtml(card.durationText)}</strong>
            <span>${escapeHtml(card.gameId || "Custom Match")}</span>
            ${card.playedAtText ? `<span class="match-row__played-at">${escapeHtml(card.playedAtText)}</span>` : ""}
          </div>
          <div class="match-row__summary-teams">
            <div class="match-row__summary-team">
              <span class="match-row__summary-side">블루</span>
              <strong>${escapeHtml(card.teams.blue.totalKillsText)}킬</strong>
              <span>${escapeHtml(card.teams.blue.players[0]?.name ?? "-")}</span>
            </div>
            <div class="match-row__summary-team">
              <span class="match-row__summary-side">레드</span>
              <strong>${escapeHtml(card.teams.purple.totalKillsText)}킬</strong>
              <span>${escapeHtml(card.teams.purple.players[0]?.name ?? "-")}</span>
            </div>
          </div>
          <div class="match-row__summary-builds">
            ${renderSummaryHighlight(card)}
          </div>
          <span class="match-row__caret" aria-hidden="true">⌄</span>
        </button>
        <a class="match-row__detail-link" href="${escapeHtml(card.href ?? `/matches/${card.id}`)}">링크</a>
      </div>
      ${renderMatchDetailSection(card)}
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
          <span class="simple-list__name">${escapeHtml(item.name)}</span>
          <span class="simple-list__meta">${escapeHtml(item.recordText)}${item.winRateText ? ` · ${escapeHtml(item.winRateText)}` : ""}</span>
        </li>
      `
    )
    .join("");
}

module.exports = {
  buildGuildPath,
  escapeHtml,
  renderAssetImage,
  renderMatchCard,
  renderSimpleRows,
};
