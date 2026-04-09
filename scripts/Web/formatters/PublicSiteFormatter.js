function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatInteger(value) {
  return new Intl.NumberFormat("ko-KR").format(toNumber(value));
}

function formatPercent(numerator, denominator) {
  if (denominator <= 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatFixed(value) {
  return value.toFixed(2);
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(toNumber(milliseconds) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatPlayedAtText(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = String(value.getUTCFullYear()).padStart(4, "0");
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    const hour = String(value.getUTCHours()).padStart(2, "0");
    const minute = String(value.getUTCMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hour}:${minute}`;
  }

  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return "";
  }

  const match = rawValue.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/
  );
  if (!match) {
    return rawValue;
  }

  const [, year, month, day, hour, minute] = match;
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

const HARD_CODED_LANE_LABELS = Object.freeze({
  TOP: "탑",
  JUNGLE: "정글",
  MID: "미드",
  MIDDLE: "미드",
  BOT: "원딜",
  BOTTOM: "원딜",
  SUPPORT: "서포터",
  UTILITY: "서포터",
});
const MATCH_DETAIL_TABS = Object.freeze([
  { id: "summary", label: "종합" },
  { id: "op-score", label: "OP 스코어" },
  { id: "team-analysis", label: "팀 분석" },
  { id: "build", label: "빌드" },
  { id: "other", label: "기타" },
]);

function identity(value, fallback = "-") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function translateLaneName(value) {
  const normalizedLane = String(value ?? "").trim().toUpperCase();
  return HARD_CODED_LANE_LABELS[normalizedLane] ?? identity(value);
}

function normalizeChampionLookupKey(value) {
  return String(value ?? "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function createChampionNameTranslator(championNameMap = {}) {
  return function translateChampionName(value) {
    const rawValue = identity(value);
    const normalizedChampionKey = normalizeChampionLookupKey(rawValue);

    return championNameMap[normalizedChampionKey] ?? rawValue;
  };
}

function createChampionAssetLookup(championAssets = {}) {
  return function getChampionAsset(value) {
    const championKey = normalizeChampionLookupKey(value);
    return championAssets[championKey] ?? null;
  };
}

function createNumericAssetLookup(assetMap = {}) {
  return function getAsset(id) {
    const numericId = toNumber(id);
    return assetMap[numericId] ?? null;
  };
}

function buildPublicSiteFormatterOptions(input = {}) {
  const config =
    input &&
    (Object.prototype.hasOwnProperty.call(input, "championNameMap") ||
      Object.prototype.hasOwnProperty.call(input, "championAssets") ||
      Object.prototype.hasOwnProperty.call(input, "itemAssets") ||
      Object.prototype.hasOwnProperty.call(input, "spellAssets") ||
      Object.prototype.hasOwnProperty.call(input, "runeAssets"))
      ? input
      : { championNameMap: input };

  const championNameMap = config.championNameMap ?? {};
  return {
    translateChampionName: createChampionNameTranslator(championNameMap),
    translateLaneName,
    getChampionAsset: createChampionAssetLookup(config.championAssets),
    getItemAsset: createNumericAssetLookup(config.itemAssets),
    getSpellAsset: createNumericAssetLookup(config.spellAssets),
    getRuneAsset: createNumericAssetLookup(config.runeAssets),
  };
}

function normalizePlayer(player, options = {}) {
  const translateChampionName =
    options.translateChampionName ?? createChampionNameTranslator();
  const translateLaneNameImpl = options.translateLaneName ?? translateLaneName;
  const kills = toNumber(player?.kda?.kills);
  const deaths = toNumber(player?.kda?.deaths);
  const assists = toNumber(player?.kda?.assist);
  const minionScore = toNumber(player?.minionScore);
  const gameLengthMs = toNumber(options.gameLengthMs);
  const totalMinutes = Math.max(gameLengthMs / 60000, 1);
  const championAsset = options.getChampionAsset?.(player?.championName);
  const spellIds = [toNumber(player?.spell1), toNumber(player?.spell2)];
  const keystoneId = toNumber(player?.keystoneId);
  const secondaryRuneId = toNumber(
    player?.secondaryRuneId ?? player?.subStyleId ?? player?.secondaryStyleId
  );
  const itemIds = buildItemIds(player?.inventory);

  return {
    name: player?.playerName ?? "알 수 없음",
    championName: translateChampionName(player?.championName),
    championImageUrl: championAsset?.imageUrl ?? "",
    lane: translateLaneNameImpl(player?.lane),
    level: toNumber(player?.level),
    minionScore,
    minionScoreText: formatInteger(minionScore),
    csPerMinuteText: formatFixed(minionScore / totalMinutes),
    performanceScore: toNumber(player?.performanceScore ?? player?.mmr),
    kdaText: `${kills}/${deaths}/${assists}`,
    damageText: formatInteger(player?.totalDamage),
    visionScoreText: formatInteger(player?.visionScore),
    spellIds,
    spellAssets: spellIds.map((spellId) => ({
      id: spellId,
      name: options.getSpellAsset?.(spellId)?.name ?? String(spellId),
      imageUrl: options.getSpellAsset?.(spellId)?.imageUrl ?? "",
    })),
    keystoneId,
    keystoneName: options.getRuneAsset?.(keystoneId)?.name ?? String(keystoneId),
    keystoneImageUrl: options.getRuneAsset?.(keystoneId)?.imageUrl ?? "",
    secondaryRuneId,
    secondaryRuneName:
      options.getRuneAsset?.(secondaryRuneId)?.name ?? String(secondaryRuneId),
    secondaryRuneImageUrl:
      options.getRuneAsset?.(secondaryRuneId)?.imageUrl ?? "",
    itemIds,
    itemAssets: itemIds.map((itemId) => ({
      id: itemId,
      name: options.getItemAsset?.(itemId)?.name ?? String(itemId),
      imageUrl: options.getItemAsset?.(itemId)?.imageUrl ?? "",
    })),
  };
}

function buildItemIds(inventory) {
  if (Array.isArray(inventory)) {
    return inventory.map((itemId) => toNumber(itemId));
  }

  return [
    toNumber(inventory?.item1),
    toNumber(inventory?.item2),
    toNumber(inventory?.item3),
    toNumber(inventory?.item4),
    toNumber(inventory?.item5),
    toNumber(inventory?.item6),
    toNumber(inventory?.trinket),
  ];
}

function buildTeamSummary(team, resultText, matchRow, options = {}) {
  const players = Array.isArray(team.players)
    ? team.players.map((player) =>
        normalizePlayer(player, {
          ...options,
          gameLengthMs: matchRow?.game_length,
        })
      )
    : [];
  const totalKills =
    toNumber(team?.totalKill) ||
    players.reduce((sum, player) => {
      const [kills] = String(player.kdaText).split("/");
      return sum + toNumber(kills);
    }, 0);

  return {
    resultText,
    totalKillsText: formatInteger(totalKills),
    players,
  };
}

function formatMatchCard(matchRow, options = {}) {
  const blueTeam = parseJson(matchRow?.blue_team, { players: [], result: 0 });
  const purpleTeam = parseJson(matchRow?.purple_team, { players: [], result: 0 });
  const winningSide = blueTeam.result === 1 ? "blue" : "purple";

  const matchId = toNumber(matchRow?.id);

  return {
    id: matchId,
    href: `/matches/${matchId}`,
    toggleId: `match-${matchId}-toggle`,
    detailId: `match-${matchId}-detail`,
    gameId: matchRow?.game_id ?? "",
    durationText: formatDuration(matchRow?.game_length),
    playedAtText: formatPlayedAtText(matchRow?.played_at_kst),
    winningSide,
    tabs: MATCH_DETAIL_TABS,
    teams: {
      blue: buildTeamSummary(
        blueTeam,
        winningSide === "blue" ? "승리" : "패배",
        matchRow,
        options
      ),
      purple: buildTeamSummary(
        purpleTeam,
        winningSide === "purple" ? "승리" : "패배",
        matchRow,
        options
      ),
    },
  };
}

function formatMatchDetail(matchRow, options = {}) {
  return formatMatchCard(matchRow, options);
}

function sortAggregateEntries(entries) {
  return entries.sort((left, right) => {
    if (right.games !== left.games) {
      return right.games - left.games;
    }

    if (right.wins !== left.wins) {
      return right.wins - left.wins;
    }

    return left.name.localeCompare(right.name, "ko");
  });
}

function formatAggregateEntries(rawValue, mapper, limit = 5) {
  const parsed = parseJson(rawValue, {});
  const entries = Object.entries(parsed).map(([name, stats]) => mapper(name, stats));
  return sortAggregateEntries(entries).slice(0, limit);
}

function formatChampionEntries(rawValue, limit = 5, options = {}) {
  const translateChampionName =
    options.translateChampionName ?? createChampionNameTranslator();

  return formatAggregateEntries(
    rawValue,
    (name, stats) => {
      const wins = toNumber(stats?.win);
      const losses = toNumber(stats?.lose);
      return {
        name: translateChampionName(name),
        wins,
        losses,
        games: wins + losses,
        recordText: `${wins}승 ${losses}패`,
        winRateText: formatPercent(wins, wins + losses),
      };
    },
    limit
  );
}

function formatLaneEntries(rawValue, limit = 5, options = {}) {
  const translateLaneNameImpl = options.translateLaneName ?? translateLaneName;

  return formatAggregateEntries(
    rawValue,
    (name, stats) => {
      const wins = toNumber(stats?.win);
      const losses = toNumber(stats?.lose);
      return {
        name: translateLaneNameImpl(name),
        wins,
        losses,
        games: wins + losses,
        recordText: `${wins}승 ${losses}패`,
        winRateText: formatPercent(wins, wins + losses),
      };
    },
    limit
  );
}

function formatFriendEntries(rawValue, limit = 5) {
  return formatAggregateEntries(
    rawValue,
    (name, stats) => {
      const wins = toNumber(stats?.win);
      const losses = toNumber(stats?.lose);
      return {
        name,
        wins,
        losses,
        games: wins + losses,
        recordText: `${wins}승 ${losses}패`,
        winRateText: formatPercent(wins, wins + losses),
      };
    },
    limit
  );
}

function formatPlayerProfileSummary(row, options = {}) {
  const wins = toNumber(row?.win);
  const losses = toNumber(row?.lose);
  const games = wins + losses;
  const totalKills = toNumber(row?.t_kill);
  const totalDeaths = toNumber(row?.t_death);
  const totalAssists = toNumber(row?.t_assist);
  const totalKillRate = toNumber(row?.t_kill_rate);
  const averageKda =
    games > 0
      ? (totalKills + totalAssists) / Math.max(1, totalDeaths)
      : 0;
  const averageKillRate = games > 0 ? Math.round(totalKillRate / games) : 0;

  return {
    discordId: row?.discord_id ?? "",
    name: row?.name ?? "알 수 없음",
    games,
    recordText: `${wins}승 ${losses}패`,
    winRateText: formatPercent(wins, games),
    averageKdaText: formatFixed(averageKda),
    averageKillRateText: `${averageKillRate}%`,
    favoriteChampions: formatChampionEntries(row?.champions, 5, options),
    preferredLanes: formatLaneEntries(row?.lanes, 5, options),
    friends: formatFriendEntries(row?.friends),
  };
}

function formatHomeSummary(summaryRow) {
  return {
    totalMatchesText: formatInteger(summaryRow?.total_matches),
    totalPlayersText: formatInteger(summaryRow?.total_players),
    topWinRateText: `${toNumber(summaryRow?.top_win_rate)}%`,
  };
}

function formatLeaderboardEntry(row) {
  const wins = toNumber(row?.win);
  const losses = toNumber(row?.lose);
  const games = wins + losses;

  return {
    discordId: row?.discord_id ?? "",
    name: row?.name ?? "알 수 없음",
    recordText: `${wins}승 ${losses}패`,
    winRateText: formatPercent(wins, games),
  };
}

module.exports = {
  buildPublicSiteFormatterOptions,
  formatChampionEntries,
  formatFriendEntries,
  formatHomeSummary,
  formatLaneEntries,
  formatLeaderboardEntry,
  formatMatchCard,
  formatMatchDetail,
  formatPlayerProfileSummary,
  translateLaneName,
};
