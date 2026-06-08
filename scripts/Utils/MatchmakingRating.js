function getPlayerId(player) {
  return player?.playerId ?? player?.discordId ?? player?.id ?? null;
}

function getGamesPlayed(player) {
  return Math.max(Number(player?.win ?? 0) + Number(player?.lose ?? 0), 0);
}

function getKFactor(gamesPlayed) {
  if (gamesPlayed < 10) {
    return 48;
  }

  if (gamesPlayed < 30) {
    return 36;
  }

  return 24;
}

function getTeamAverageRating(players) {
  if (!Array.isArray(players) || players.length === 0) {
    return 1000;
  }

  const total = players.reduce((sum, player) => sum + Number(player?.mmr ?? 1000), 0);
  return total / players.length;
}

function calculateExpectedScore(teamRating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - teamRating) / 400));
}

// Performance weighting: the team's Elo delta (sign fixed by win/loss, magnitude
// by opponent strength) is redistributed within the team by each player's OP score
// relative to teammates. A carry gains more / loses less; a passenger the opposite.
// Weights are clamped and normalized so the team's aggregate MMR transfer is
// preserved (no inflation). If OP scores are missing, weights are all 1 (== plain
// Elo), so callers that don't supply performanceScore are unaffected.
const PERF_WEIGHT = { sensitivity: 0.5, min: 0.7, max: 1.3 };

function getPerformanceScore(player) {
  const value = Number(player?.performanceScore);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function buildPerformanceWeights(players, actualScore) {
  const scores = players.map(getPerformanceScore);
  const valid = scores.filter((score) => score !== null);
  if (valid.length < 2) {
    return players.map(() => 1);
  }

  const teamMean = valid.reduce((sum, score) => sum + score, 0) / valid.length;
  if (!(teamMean > 0)) {
    return players.map(() => 1);
  }

  // Winners (actualScore 1): higher OP -> larger weight. Losers (0): higher OP ->
  // smaller weight (less loss). Missing OP is treated as average (neutral weight).
  const direction = actualScore >= 1 ? 1 : -1;
  const raw = scores.map((score) => {
    const relative = ((score ?? teamMean) - teamMean) / teamMean;
    const weight = 1 + direction * PERF_WEIGHT.sensitivity * relative;
    return Math.min(PERF_WEIGHT.max, Math.max(PERF_WEIGHT.min, weight));
  });

  const rawMean = raw.reduce((sum, weight) => sum + weight, 0) / raw.length;
  if (!(rawMean > 0)) {
    return players.map(() => 1);
  }

  return raw.map((weight) => weight / rawMean);
}

function buildTeamAdjustments(players, actualScore, expectedScore) {
  const weights = buildPerformanceWeights(players, actualScore);

  return players.map((player, index) => {
    const gamesPlayed = getGamesPlayed(player);
    const base = getKFactor(gamesPlayed) * (actualScore - expectedScore);
    const delta = Math.round(base * weights[index]);

    return {
      playerId: getPlayerId(player),
      delta,
    };
  });
}

function buildMatchmakingAdjustments({ winningTeam, losingTeam }) {
  const winningTeamRating = getTeamAverageRating(winningTeam);
  const losingTeamRating = getTeamAverageRating(losingTeam);
  const winningExpectedScore = calculateExpectedScore(
    winningTeamRating,
    losingTeamRating
  );
  const losingExpectedScore = calculateExpectedScore(
    losingTeamRating,
    winningTeamRating
  );

  return {
    winners: buildTeamAdjustments(winningTeam, 1, winningExpectedScore),
    losers: buildTeamAdjustments(losingTeam, 0, losingExpectedScore),
  };
}

module.exports = {
  buildMatchmakingAdjustments,
  buildPerformanceWeights,
  calculateExpectedScore,
  getGamesPlayed,
  getKFactor,
  getTeamAverageRating,
};
