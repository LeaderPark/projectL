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

function toNumberFromText(value) {
  const numeric = Number(
    String(value ?? "")
      .replaceAll(",", "")
      .replace(/[^\d.-]/g, "")
  );
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMetricValue(value) {
  return new Intl.NumberFormat("ko-KR").format(Math.max(0, Math.round(value)));
}

function parseKdaText(value) {
  const [kills, deaths, assists] = String(value ?? "0/0/0")
    .split("/")
    .map((part) => toNumberFromText(part));

  return {
    kills,
    deaths,
    assists,
  };
}

function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatOpScore(value) {
  return (clampNumber(4.2 + toNumberFromText(value) / 10, 0, 10)).toFixed(1);
}

function getTeamSideName(sideLabel) {
  return sideLabel === "blue" ? "블루팀" : "레드팀";
}

function buildTeamMetrics(team) {
  const players = team?.players ?? [];

  return {
    totalKills: toNumberFromText(team?.totalKillsText),
    totalDamage: players.reduce(
      (sum, player) => sum + toNumberFromText(player?.damageText),
      0
    ),
    totalVision: players.reduce(
      (sum, player) => sum + toNumberFromText(player?.visionScoreText),
      0
    ),
    totalCs: players.reduce(
      (sum, player) => sum + toNumberFromText(player?.minionScoreText),
      0
    ),
  };
}

function buildScoreboardContext(card) {
  const blueEntries = (card?.teams?.blue?.players ?? []).map((player) => ({
    player,
    side: "blue",
  }));
  const redEntries = (card?.teams?.purple?.players ?? []).map((player) => ({
    player,
    side: "red",
  }));
  const allEntries = [...blueEntries, ...redEntries];

  const sortedByPerformance = [...allEntries].sort((left, right) => {
    const performanceDelta =
      toNumberFromText(formatOpScore(right.player?.performanceScore)) -
      toNumberFromText(formatOpScore(left.player?.performanceScore));
    if (performanceDelta !== 0) {
      return performanceDelta;
    }

    const damageDelta =
      toNumberFromText(right.player?.damageText) -
      toNumberFromText(left.player?.damageText);
    if (damageDelta !== 0) {
      return damageDelta;
    }

    return String(left.player?.name ?? "").localeCompare(
      String(right.player?.name ?? ""),
      "ko"
    );
  });

  const ranks = new Map();
  sortedByPerformance.forEach((entry, index) => {
    ranks.set(entry.player, index + 1);
  });

  const sortedBluePlayers = [...blueEntries].sort((left, right) => {
    return (
      toNumberFromText(formatOpScore(right.player?.performanceScore)) -
        toNumberFromText(formatOpScore(left.player?.performanceScore)) ||
      toNumberFromText(right.player?.damageText) -
        toNumberFromText(left.player?.damageText)
    );
  });
  const sortedRedPlayers = [...redEntries].sort((left, right) => {
    return (
      toNumberFromText(formatOpScore(right.player?.performanceScore)) -
        toNumberFromText(formatOpScore(left.player?.performanceScore)) ||
      toNumberFromText(right.player?.damageText) -
        toNumberFromText(left.player?.damageText)
    );
  });

  return {
    teams: {
      blue: buildTeamMetrics(card?.teams?.blue),
      red: buildTeamMetrics(card?.teams?.purple),
    },
    winningSide: card?.winningSide === "blue" ? "blue" : "red",
    ranks,
    teamLeaders: {
      blue: sortedBluePlayers[0]?.player ?? null,
      red: sortedRedPlayers[0]?.player ?? null,
    },
    maxDamage: Math.max(
      1,
      ...allEntries.map((entry) => toNumberFromText(entry.player?.damageText))
    ),
    maxVision: Math.max(
      1,
      ...allEntries.map((entry) => toNumberFromText(entry.player?.visionScoreText))
    ),
    maxCs: Math.max(
      1,
      ...allEntries.map((entry) => toNumberFromText(entry.player?.minionScoreText))
    ),
  };
}

function isRenderableAsset(asset) {
  return Boolean(asset?.imageUrl) || toNumberFromText(asset?.id) > 0;
}

function getRenderableAssets(assets = []) {
  return assets.filter((asset) => isRenderableAsset(asset));
}

function buildPlayerRuneAssets(player) {
  const primaryRune = {
    id: player?.keystoneId,
    name: player?.keystoneName,
    imageUrl: player?.keystoneImageUrl,
  };
  const secondaryRune = {
    id: player?.secondaryRuneId,
    name: player?.secondaryRuneName,
    imageUrl: player?.secondaryRuneImageUrl,
  };

  return [primaryRune, secondaryRune].filter((asset) => isRenderableAsset(asset));
}

function renderPlayerRunes(player, className) {
  const runeAssets = buildPlayerRuneAssets(player);
  if (!runeAssets.length) {
    return "";
  }

  return renderIconGroup(runeAssets, className);
}

function buildPlayerStatSnapshot(player, teamMetrics) {
  const { kills, deaths, assists } = parseKdaText(player?.kdaText);
  const killParticipation =
    teamMetrics?.totalKills > 0
      ? Math.round(((kills + assists) / teamMetrics.totalKills) * 100)
      : 0;
  const kdaRatioText =
    deaths <= 0 ? "Perfect" : `${((kills + assists) / deaths).toFixed(2)}:1`;

  return {
    kills,
    deaths,
    assists,
    killParticipation,
    kdaRatioText,
  };
}

function buildItemBuildRows(player) {
  const items = Array.isArray(player?.itemAssets) ? player.itemAssets : [];

  return {
    topRow: getRenderableAssets(items.slice(0, 3)),
    bottomRow: getRenderableAssets(items.slice(3, 6)),
    trinket: isRenderableAsset(items[6]) ? items[6] : null,
  };
}

function renderCompactPlayer(player, options = {}) {
  const variant = options.variant === "summary" ? "summary" : "default";
  const rowClasses = ["match-row__player"];
  let itemsHtml = renderIconGroup(player.itemAssets ?? [], "match-row__items");

  if (variant === "summary") {
    rowClasses.push("match-row__player--summary");
    itemsHtml = itemsHtml.replace(
      'class="match-row__items"',
      'class="match-row__items match-row__items--summary"'
    );
  }

  return `
    <li class="${rowClasses.join(" ")}">
      <div class="match-row__champion-block">
        ${renderAssetImage(
          { imageUrl: player.championImageUrl, name: player.championName },
          "match-row__champion-image",
          player.championName?.slice(0, 1)
        )}
        <div class="match-row__spells-runes">
          ${renderIconGroup(player.spellAssets ?? [], "match-row__spells")}
          ${renderPlayerRunes(player, "match-row__runes")}
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
      ${itemsHtml}
    </li>
  `;
}

function normalizeIdentityValue(value) {
  return String(value ?? "").trim().toLowerCase();
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

function getPerspectivePlayer(card) {
  const players = [...(card?.teams?.blue?.players ?? []), ...(card?.teams?.purple?.players ?? [])];
  if (!players.length) {
    return null;
  }

  const perspectivePuuid = normalizeIdentityValue(card?.perspectivePlayerPuuid);
  if (perspectivePuuid) {
    const matchedByPuuid = players.find(
      (player) => normalizeIdentityValue(player?.puuid) === perspectivePuuid
    );
    if (matchedByPuuid) {
      return matchedByPuuid;
    }
  }

  const perspectiveName = normalizeIdentityValue(card?.perspectivePlayerName);
  if (perspectiveName) {
    const matchedByName = players.find(
      (player) => normalizeIdentityValue(player?.name) === perspectiveName
    );
    if (matchedByName) {
      return matchedByName;
    }
  }

  return null;
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
          ${renderPlayerRunes(featuredPlayer, "match-row__runes")}
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

function renderPlayerPerspectiveSummary(card) {
  const perspectivePlayer = getPerspectivePlayer(card) ?? getFeaturedPlayer(card);
  if (!perspectivePlayer) {
    return `
      <ul class="match-row__player-list match-row__player-list--summary">
        <li class="match-row__player match-row__player--empty">
          <span>표시할 플레이어 데이터가 없습니다.</span>
        </li>
      </ul>
    `;
  }

  return `
    <ul class="match-row__player-list match-row__player-list--summary">
      ${renderCompactPlayer(perspectivePlayer, { variant: "summary" })}
    </ul>
  `;
}

function getMatchDisplayName(card) {
  return card?.matchName || card?.gameId || `Match #${card?.id ?? "-"}`;
}

function getPerspectiveTeamKey(card, perspectivePlayer) {
  if (!perspectivePlayer) {
    return card?.winningSide === "blue" ? "blue" : "purple";
  }

  if ((card?.teams?.blue?.players ?? []).includes(perspectivePlayer)) {
    return "blue";
  }

  return "purple";
}

function getPerspectiveSideLabel(card, perspectivePlayer) {
  return getPerspectiveTeamKey(card, perspectivePlayer) === "blue" ? "blue" : "red";
}

function getPlayerResultText(card, perspectiveTeamKey) {
  if (perspectiveTeamKey === "blue" || perspectiveTeamKey === "purple") {
    return card?.teams?.[perspectiveTeamKey]?.resultText ?? "";
  }

  return card?.resultText ?? "";
}

function renderPlayerRosterItem(player, perspectivePlayer) {
  const itemClasses = ["match-row__player-roster-item"];

  if (player === perspectivePlayer) {
    itemClasses.push("is-active");
  }

  return `
    <li class="${itemClasses.join(" ")}">
      ${renderAssetImage(
        { imageUrl: player.championImageUrl, name: player.championName },
        "match-row__player-roster-image",
        player.championName?.slice(0, 1)
      )}
      <span class="match-row__player-roster-name">${escapeHtml(player.name)}</span>
    </li>
  `;
}

function renderPlayerRoster(players, sideLabel, perspectivePlayer) {
  return `
    <ul class="match-row__player-roster-list match-row__player-roster-list--${escapeHtml(sideLabel)}">
      ${(players ?? [])
        .map((player) => renderPlayerRosterItem(player, perspectivePlayer))
        .join("")}
    </ul>
  `;
}

function renderPlayerLayoutSummary(card, context) {
  const perspectivePlayer = getPerspectivePlayer(card) ?? getFeaturedPlayer(card);
  const perspectiveTeamKey = getPerspectiveTeamKey(card, perspectivePlayer);
  const perspectiveSideLabel = getPerspectiveSideLabel(card, perspectivePlayer);
  const teamMetrics = context.teams[perspectiveSideLabel];
  const { killParticipation, kdaRatioText } = buildPlayerStatSnapshot(
    perspectivePlayer,
    teamMetrics
  );
  const resultText = getPlayerResultText(card, perspectiveTeamKey) || card?.resultText || "-";

  if (!perspectivePlayer) {
    return `
      <div class="match-row__summary match-row__summary--player-card">
        <div class="match-row__result match-row__result--player">
          <span class="match-row__result-mode">${escapeHtml(getMatchDisplayName(card))}</span>
          <span class="match-row__result-time">${escapeHtml(card.playedAtText || "기록 없음")}</span>
          <strong>${escapeHtml(resultText)}</strong>
          <span class="match-row__result-duration">${escapeHtml(card.durationText || "-")}</span>
        </div>
        <button
          type="button"
          class="match-row__summary-button match-row__summary-button--player"
          data-match-toggle="${escapeHtml(card.toggleId)}"
          aria-expanded="false"
          aria-controls="${escapeHtml(card.detailId)}"
        >
          <div class="match-row__player-empty">표시할 플레이어 데이터가 없습니다.</div>
          <span class="match-row__caret" aria-hidden="true">
            <span class="match-row__caret-icon"></span>
          </span>
        </button>
      </div>
    `;
  }

  return `
    <div class="match-row__summary match-row__summary--player-card">
      <div class="match-row__result match-row__result--player">
        <span class="match-row__result-mode">${escapeHtml(getMatchDisplayName(card))}</span>
        <span class="match-row__result-time">${escapeHtml(card.playedAtText || "기록 없음")}</span>
        <strong>${escapeHtml(resultText)}</strong>
        <span class="match-row__result-duration">${escapeHtml(card.durationText || "-")}</span>
      </div>
      <button
        type="button"
        class="match-row__summary-button match-row__summary-button--player"
        data-match-toggle="${escapeHtml(card.toggleId)}"
        aria-expanded="false"
        aria-controls="${escapeHtml(card.detailId)}"
      >
        <div class="match-row__player-maincard">
          <div class="match-row__player-maincard-top">
            <div class="match-row__champion-block">
              ${renderAssetImage(
                { imageUrl: perspectivePlayer.championImageUrl, name: perspectivePlayer.championName },
                "match-row__champion-image",
                perspectivePlayer.championName?.slice(0, 1)
              )}
              <div class="match-row__spells-runes">
                ${renderIconGroup(perspectivePlayer.spellAssets ?? [], "match-row__spells")}
                ${renderPlayerRunes(perspectivePlayer, "match-row__runes")}
              </div>
            </div>
            <div class="match-row__player-maincard-kda">
              <strong class="match-row__player-maincard-kda-value">${escapeHtml(
                perspectivePlayer.kdaText
              )}</strong>
              <span class="match-row__player-maincard-kda-rating">${escapeHtml(
                `${kdaRatioText} 평점`
              )}</span>
            </div>
          </div>
          <div class="match-row__player-maincard-items">
            ${renderIconGroup(perspectivePlayer.itemAssets ?? [], "match-row__items")}
          </div>
        </div>
        <div class="match-row__player-card-stats">
          <span>킬관여 ${escapeHtml(killParticipation)}%</span>
          <span>CS ${escapeHtml(perspectivePlayer.minionScoreText)} (${escapeHtml(
            perspectivePlayer.csPerMinuteText
          )})</span>
          <span>딜량 ${escapeHtml(perspectivePlayer.damageText)}</span>
        </div>
        <div class="match-row__player-rosters">
          ${renderPlayerRoster(card?.teams?.blue?.players ?? [], "blue", perspectivePlayer)}
          ${renderPlayerRoster(card?.teams?.purple?.players ?? [], "red", perspectivePlayer)}
        </div>
        <span class="match-row__caret" aria-hidden="true">
          <span class="match-row__caret-icon"></span>
        </span>
      </button>
    </div>
  `;
}

function renderScoreboardColumns(mode = "full") {
  if (mode === "compact") {
    return `
      <div class="match-scoreboard__columns">
        <span>플레이어</span>
        <span>OP Score</span>
        <span>KDA</span>
      </div>
    `;
  }

  return `
    <div class="match-scoreboard__columns">
      <span>플레이어</span>
      <span>OP Score</span>
      <span>KDA</span>
      <span>피해량</span>
      <span>와드</span>
      <span>CS</span>
      <span>아이템</span>
    </div>
  `;
}

function renderScoreboardItemBuild(player) {
  const { topRow, bottomRow, trinket } = buildItemBuildRows(player);

  return `
    <div class="match-scoreboard__build-items">
      <div class="match-scoreboard__build-row">
        ${renderIconGroup(topRow, "match-scoreboard__items")}
        <div class="match-scoreboard__build-trinket">
          ${
            trinket
              ? renderAssetImage(
                  trinket,
                  "match-scoreboard__items__icon",
                  String(trinket?.id ?? "")
                )
              : ""
          }
        </div>
      </div>
      <div class="match-scoreboard__build-row">
        ${renderIconGroup(bottomRow, "match-scoreboard__items")}
      </div>
    </div>
  `;
}

function renderScoreboardIdentity(player) {
  return `
    <div class="match-scoreboard__identity">
      ${renderAssetImage(
        { imageUrl: player.championImageUrl, name: player.championName },
        "match-scoreboard__champion-image",
        player.championName?.slice(0, 1)
      )}
      <div class="match-scoreboard__summoners">
        ${renderIconGroup(player.spellAssets ?? [], "match-scoreboard__spells")}
      </div>
      <div class="match-scoreboard__rune-stack">
        ${renderPlayerRunes(player, "match-scoreboard__runes-block")}
      </div>
      <div class="match-scoreboard__identity-copy">
        <strong>${escapeHtml(player.name)}</strong>
        <span>${escapeHtml(buildPlayerMeta(player))}</span>
      </div>
    </div>
  `;
}

function renderScoreboardMeter(widthPercent, tone) {
  const normalizedWidth = clampNumber(widthPercent, 0, 100);

  return `
    <span class="match-scoreboard__meter">
      <span class="match-scoreboard__meter-fill match-scoreboard__meter-fill--${escapeHtml(tone)}" style="width: ${normalizedWidth}%;"></span>
    </span>
  `;
}

function getPerformanceBadgeText(player, sideLabel, context) {
  if (context.teamLeaders[sideLabel] === player) {
    return context.winningSide === sideLabel ? "MVP" : "ACE";
  }

  const rank = context.ranks.get(player) ?? 0;
  return rank > 0 ? `${rank}위` : "-";
}

function getPerformanceBadgeModifier(text) {
  if (text === "MVP") {
    return "mvp";
  }

  if (text === "ACE") {
    return "ace";
  }

  return "rank";
}

function renderSummaryTeamCard(player, sideLabel, context) {
  const teamMetrics = context.teams[sideLabel];

  if (!player) {
    return `
      <div class="match-row__summary-team match-row__summary-team--${escapeHtml(sideLabel)}">
        <span class="match-row__summary-side">${escapeHtml(
          sideLabel === "blue" ? "블루팀" : "레드팀"
        )}</span>
        <div class="match-row__summary-player match-row__summary-player--empty">
          <span>표시할 플레이어 데이터가 없습니다.</span>
        </div>
      </div>
    `;
  }

  const { killParticipation, kdaRatioText } = buildPlayerStatSnapshot(
    player,
    teamMetrics
  );
  const badgeText = getPerformanceBadgeText(player, sideLabel, context);
  const badgeModifier = getPerformanceBadgeModifier(badgeText);

  return `
    <div class="match-row__summary-team match-row__summary-team--${escapeHtml(sideLabel)}">
      <span class="match-row__summary-side">${escapeHtml(
        sideLabel === "blue" ? "블루팀" : "레드팀"
      )}</span>
      <div class="match-row__summary-player">
        <div class="match-row__champion-block">
          ${renderAssetImage(
            { imageUrl: player.championImageUrl, name: player.championName },
            "match-row__champion-image",
            player.championName?.slice(0, 1)
          )}
          <div class="match-row__spells-runes">
            ${renderIconGroup(player.spellAssets ?? [], "match-row__spells")}
            ${renderPlayerRunes(player, "match-row__runes")}
          </div>
        </div>
        <div class="match-row__summary-player-copy">
          <strong class="match-row__player-name">${escapeHtml(player.name)}</strong>
          <span class="match-row__player-meta">${escapeHtml(buildPlayerMeta(player))}</span>
        </div>
        <div class="match-row__summary-player-score">
          <strong>${escapeHtml(formatOpScore(player.performanceScore))}</strong>
          <span class="match-scoreboard__badge match-scoreboard__badge--${escapeHtml(
            badgeModifier
          )}">${escapeHtml(badgeText)}</span>
        </div>
        <div class="match-row__summary-player-kda">
          <strong>${escapeHtml(player.kdaText)} (${escapeHtml(killParticipation)}%)</strong>
          <span>${escapeHtml(kdaRatioText)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderScoreboardRow(player, sideLabel, teamMetrics, context, mode = "full") {
  const { killParticipation, kdaRatioText } = buildPlayerStatSnapshot(
    player,
    teamMetrics
  );
  const damageValue = toNumberFromText(player.damageText);
  const visionValue = toNumberFromText(player.visionScoreText);
  const badgeText = getPerformanceBadgeText(player, sideLabel, context);
  const badgeModifier = getPerformanceBadgeModifier(badgeText);

  if (mode === "compact") {
    return `
      <li class="match-scoreboard__row match-scoreboard__row--${escapeHtml(sideLabel)}">
        ${renderScoreboardIdentity(player)}
        <div class="match-scoreboard__score">
          <strong>${escapeHtml(formatOpScore(player.performanceScore))}</strong>
          <span class="match-scoreboard__badge match-scoreboard__badge--${escapeHtml(badgeModifier)}">${escapeHtml(badgeText)}</span>
        </div>
        <div class="match-scoreboard__kda">
          <strong>${escapeHtml(player.kdaText)} (${escapeHtml(killParticipation)}%)</strong>
          <span>${escapeHtml(kdaRatioText)}</span>
        </div>
      </li>
    `;
  }

  return `
    <li class="match-scoreboard__row match-scoreboard__row--${escapeHtml(sideLabel)}">
      ${renderScoreboardIdentity(player)}
      <div class="match-scoreboard__score">
        <strong>${escapeHtml(formatOpScore(player.performanceScore))}</strong>
        <span class="match-scoreboard__badge match-scoreboard__badge--${escapeHtml(badgeModifier)}">${escapeHtml(badgeText)}</span>
      </div>
      <div class="match-scoreboard__kda">
        <strong>${escapeHtml(player.kdaText)} (${escapeHtml(killParticipation)}%)</strong>
        <span>${escapeHtml(kdaRatioText)}</span>
      </div>
      <div class="match-scoreboard__damage">
        <strong>${escapeHtml(player.damageText)}</strong>
        ${renderScoreboardMeter((damageValue / context.maxDamage) * 100, sideLabel)}
      </div>
      <div class="match-scoreboard__stat">
        <strong>${escapeHtml(player.visionScoreText)}</strong>
        ${renderScoreboardMeter((visionValue / context.maxVision) * 100, sideLabel)}
      </div>
      <div class="match-scoreboard__stat match-scoreboard__stat--cs">
        <strong>${escapeHtml(player.minionScoreText)}</strong>
        <span>분당 ${escapeHtml(player.csPerMinuteText)}</span>
      </div>
      <div class="match-scoreboard__build">
        ${renderScoreboardItemBuild(player)}
      </div>
    </li>
  `;
}

function renderScoreboardTeam(team, sideLabel, context, mode = "full") {
  const teamMetrics = context.teams[sideLabel];

  return `
    <section class="match-scoreboard__team match-scoreboard__team--${escapeHtml(sideLabel)}">
      <header class="match-scoreboard__team-header">
        <div class="match-scoreboard__team-heading">
          <strong>${escapeHtml(team.resultText)} (${escapeHtml(getTeamSideName(sideLabel))})</strong>
          ${
            mode === "full"
              ? `<span>${escapeHtml(team.totalKillsText)}킬 · 피해량 ${escapeHtml(
                  formatMetricValue(teamMetrics.totalDamage)
                )} · 시야 ${escapeHtml(formatMetricValue(teamMetrics.totalVision))}</span>`
              : ""
          }
        </div>
      </header>
      ${renderScoreboardColumns(mode)}
      <ul class="match-scoreboard__list">
        ${(team.players ?? [])
          .map((player) =>
            renderScoreboardRow(player, sideLabel, teamMetrics, context, mode)
          )
          .join("")}
      </ul>
    </section>
  `;
}

function renderTotalsComparisonRow(label, blueValue, redValue) {
  const total = Math.max(blueValue + redValue, 1);
  const blueWidth = (blueValue / total) * 100;
  const redWidth = (redValue / total) * 100;

  return `
    <article class="match-scoreboard__totals-row">
      <div class="match-scoreboard__totals-value match-scoreboard__totals-value--blue">
        <strong>${escapeHtml(formatMetricValue(blueValue))}</strong>
      </div>
      <div class="match-scoreboard__totals-bar-group">
        <span class="match-scoreboard__totals-label">${escapeHtml(label)}</span>
        <div class="match-scoreboard__totals-bar">
          <span class="match-scoreboard__totals-bar-fill match-scoreboard__totals-bar-fill--blue" style="width: ${clampNumber(blueWidth, 0, 100)}%;"></span>
          <span class="match-scoreboard__totals-bar-fill match-scoreboard__totals-bar-fill--red" style="width: ${clampNumber(redWidth, 0, 100)}%;"></span>
        </div>
      </div>
      <div class="match-scoreboard__totals-value match-scoreboard__totals-value--red">
        <strong>${escapeHtml(formatMetricValue(redValue))}</strong>
      </div>
    </article>
  `;
}

function renderScoreboardTotals(context) {
  return `
    <section class="match-scoreboard__totals">
      ${renderTotalsComparisonRow(
        "Total Kill",
        context.teams.blue.totalKills,
        context.teams.red.totalKills
      )}
      ${renderTotalsComparisonRow(
        "Total Damage",
        context.teams.blue.totalDamage,
        context.teams.red.totalDamage
      )}
      ${renderTotalsComparisonRow(
        "Total Vision",
        context.teams.blue.totalVision,
        context.teams.red.totalVision
      )}
    </section>
  `;
}

function renderDetailedScoreboard(card, options = {}) {
  const context = buildScoreboardContext(card);
  const mode = options.mode === "compact" ? "compact" : "full";

  return `
    <div class="match-scoreboard${mode === "compact" ? " match-scoreboard--compact" : ""}">
      ${renderScoreboardTeam(card.teams.blue, "blue", context, mode)}
      ${mode === "full" ? renderScoreboardTotals(context) : ""}
      ${renderScoreboardTeam(card.teams.purple, "red", context, mode)}
    </div>
  `;
}

function renderTeamAnalysisPanel(card) {
  const context = buildScoreboardContext(card);
  const blueLeadDamagePlayer =
    [...(card.teams.blue.players ?? [])].sort(
      (left, right) =>
        toNumberFromText(right.damageText) - toNumberFromText(left.damageText)
    )[0] ?? null;
  const redLeadDamagePlayer =
    [...(card.teams.purple.players ?? [])].sort(
      (left, right) =>
        toNumberFromText(right.damageText) - toNumberFromText(left.damageText)
    )[0] ?? null;

  return `
    <div class="match-row__panel-stack">
      <div class="match-row__team-analysis">
        <article>
          <span>블루팀 핵심 딜러</span>
          <strong>${escapeHtml(blueLeadDamagePlayer?.name ?? "-")}</strong>
          <span>${escapeHtml(blueLeadDamagePlayer?.damageText ?? "0")} 피해</span>
        </article>
        <article>
          <span>레드팀 핵심 딜러</span>
          <strong>${escapeHtml(redLeadDamagePlayer?.name ?? "-")}</strong>
          <span>${escapeHtml(redLeadDamagePlayer?.damageText ?? "0")} 피해</span>
        </article>
        <article>
          <span>게임 길이</span>
          <strong>${escapeHtml(card.durationText)}</strong>
          <span>${escapeHtml(card.playedAtText || "기록 없음")}</span>
        </article>
        <article>
          <span>게임 ID</span>
          <strong>${escapeHtml(card.gameId || "-")}</strong>
          <span>Match #${escapeHtml(card.id)}</span>
        </article>
      </div>
    </div>
  `;
}

function renderBuildPanel(card) {
  return `
    <div class="match-build-grid">
      ${[...card.teams.blue.players, ...card.teams.purple.players]
        .map(
          (player) => `
            <article class="match-build-grid__player">
              <header>
                <strong>${escapeHtml(player.name)}</strong>
                <span>${escapeHtml(player.championName)} · ${escapeHtml(player.lane)}</span>
              </header>
              ${renderIconGroup(player.spellAssets ?? [], "match-build-grid__spells")}
              ${renderPlayerRunes(player, "match-build-grid__runes")}
              ${renderIconGroup(player.itemAssets ?? [], "match-build-grid__items")}
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderOtherPanel(card) {
  return `
    <div class="match-row__other-grid">
      ${[...card.teams.blue.players, ...card.teams.purple.players]
        .map(
          (player) => `
            <article class="match-row__other-card">
              <strong>${escapeHtml(player.name)}</strong>
              <span>라인 ${escapeHtml(player.lane)}</span>
              <span>레벨 ${escapeHtml(player.level)}</span>
              <span>퍼포먼스 ${escapeHtml(formatOpScore(player.performanceScore))}</span>
              <span>CS/분 ${escapeHtml(player.csPerMinuteText)}</span>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTabPanel(card, tabId) {
  if (tabId === "summary" || tabId === "op-score") {
    return renderDetailedScoreboard(card, { mode: "full" });
  }

  if (tabId === "team-analysis") {
    return renderTeamAnalysisPanel(card);
  }

  if (tabId === "build") {
    return renderBuildPanel(card);
  }

  return renderOtherPanel(card);
}

function renderMatchDetailSection(card, options = {}) {
  const detailId = options.detailId ?? card.detailId;
  const hiddenAttribute = options.expanded ? "" : "hidden";
  const mode = options.mode === "compact" ? "compact" : "full";

  return `
    <section
      class="match-row__detail"
      id="${escapeHtml(detailId)}"
      data-match-detail="${escapeHtml(detailId)}"
      ${hiddenAttribute}
    >
      ${renderDetailedScoreboard(card, { mode })}
    </section>
  `;
}

function renderMatchDetailShell(card, options = {}) {
  const detailId = options.detailId ?? `${card.detailId}-page`;
  const mode = options.mode === "compact" ? "compact" : "full";

  return `
    <section class="panel match-detail-shell">
      ${renderMatchDetailSection({ ...card, detailId }, { expanded: true, mode })}
    </section>
  `;
}

function renderMatchCard(card, options = {}) {
  const {
    showResult = true,
    showSummaryHighlight = true,
    layout = "default",
  } = options;
  const context = buildScoreboardContext(card);
  const resultTone = card?.resultTone ?? card?.winningSide;
  const resultText =
    card?.resultText ?? card?.teams?.[card?.winningSide]?.resultText ?? "";
  const isPlayerLayout = layout === "player";
  const articleClasses = [
    "match-row",
    `match-row--${escapeHtml(resultTone)}`,
  ];
  const summaryClasses = ["match-row__summary"];
  const buttonClasses = ["match-row__summary-button"];

  if (isPlayerLayout) {
    articleClasses.push("match-row--player");
    buttonClasses.push("match-row__summary-button--player");
  }

  if (!showResult) {
    summaryClasses.push("match-row__summary--public");
  }

  if (!showSummaryHighlight) {
    buttonClasses.push("match-row__summary-button--public");
  }

  if (isPlayerLayout) {
    return `
      <article class="${articleClasses.join(" ")}" data-match-row="${escapeHtml(card.id)}">
        ${renderPlayerLayoutSummary(card, context)}
        ${renderMatchDetailSection(card, { mode: "compact" })}
      </article>
    `;
  }

  const summaryBody = isPlayerLayout
    ? renderPlayerPerspectiveSummary(card)
    : `
          <div class="match-row__summary-teams${showSummaryHighlight ? "" : " match-row__summary-teams--public"}">
            ${renderSummaryTeamCard(context.teamLeaders.blue, "blue", context)}
            ${renderSummaryTeamCard(context.teamLeaders.red, "red", context)}
          </div>
          ${showSummaryHighlight ? `
            <div class="match-row__summary-builds">
              ${renderSummaryHighlight(card)}
            </div>
          ` : ""}
        `;

  return `
    <article class="${articleClasses.join(" ")}" data-match-row="${escapeHtml(card.id)}">
      <div class="match-row__actions">
        <a class="match-row__detail-link" href="${escapeHtml(card.href ?? `/matches/${card.id}`)}">상세 보기</a>
      </div>
      <div class="${summaryClasses.join(" ")}">
        ${showResult ? `
          <div class="match-row__result">
            <strong>${escapeHtml(resultText)}</strong>
            <span>내전</span>
          </div>
        ` : ""}
        <button
          type="button"
          class="${buttonClasses.join(" ")}"
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
          ${summaryBody}
          <span class="match-row__caret" aria-hidden="true">
            <span class="match-row__caret-icon"></span>
          </span>
        </button>
      </div>
      ${renderMatchDetailSection(card, { mode: "compact" })}
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
  renderMatchDetailShell,
  renderSimpleRows,
};
