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

function normalizePlayer(player) {
  const kills = toNumber(player?.kda?.kills);
  const deaths = toNumber(player?.kda?.deaths);
  const assists = toNumber(player?.kda?.assist);

  return {
    name: player?.playerName ?? "알 수 없음",
    championName: player?.championName ?? "-",
    lane: player?.lane ?? "-",
    level: toNumber(player?.level),
    minionScore: toNumber(player?.minionScore),
    performanceScore: toNumber(player?.performanceScore ?? player?.mmr),
    kdaText: `${kills}/${deaths}/${assists}`,
  };
}

function formatMatchCard(matchRow) {
  const blueTeam = parseJson(matchRow?.blue_team, { players: [], result: 0 });
  const purpleTeam = parseJson(matchRow?.purple_team, { players: [], result: 0 });
  const winningSide = blueTeam.result === 1 ? "blue" : "purple";

  return {
    id: toNumber(matchRow?.id),
    gameId: matchRow?.game_id ?? "",
    durationText: formatDuration(matchRow?.game_length),
    winningSide,
    teams: {
      blue: {
        resultText: winningSide === "blue" ? "승리" : "패배",
        players: Array.isArray(blueTeam.players)
          ? blueTeam.players.map(normalizePlayer)
          : [],
      },
      purple: {
        resultText: winningSide === "purple" ? "승리" : "패배",
        players: Array.isArray(purpleTeam.players)
          ? purpleTeam.players.map(normalizePlayer)
          : [],
      },
    },
  };
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

function formatChampionEntries(rawValue, limit = 5) {
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

function formatLaneEntries(rawValue, limit = 5) {
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

function formatPlayerProfileSummary(row) {
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
    mmrText: formatInteger(row?.mmr),
    games,
    recordText: `${wins}승 ${losses}패`,
    winRateText: formatPercent(wins, games),
    averageKdaText: formatFixed(averageKda),
    averageKillRateText: `${averageKillRate}%`,
    favoriteChampions: formatChampionEntries(row?.champions),
    preferredLanes: formatLaneEntries(row?.lanes),
    friends: formatFriendEntries(row?.friends),
  };
}

function formatHomeSummary(summaryRow) {
  return {
    totalMatchesText: formatInteger(summaryRow?.total_matches),
    totalPlayersText: formatInteger(summaryRow?.total_players),
    topMmrText: formatInteger(summaryRow?.top_mmr),
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
    mmrText: formatInteger(row?.mmr),
    recordText: `${wins}승 ${losses}패`,
    winRateText: formatPercent(wins, games),
  };
}

module.exports = {
  formatChampionEntries,
  formatFriendEntries,
  formatHomeSummary,
  formatLaneEntries,
  formatLeaderboardEntry,
  formatMatchCard,
  formatPlayerProfileSummary,
};
