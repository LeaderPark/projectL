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

function buildTeamAdjustments(players, actualScore, expectedScore) {
  return players.map((player) => {
    const gamesPlayed = getGamesPlayed(player);
    const delta = Math.round(getKFactor(gamesPlayed) * (actualScore - expectedScore));

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
  calculateExpectedScore,
  getGamesPlayed,
  getKFactor,
  getTeamAverageRating,
};
