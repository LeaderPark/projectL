const {
  calculateExpectedScore,
  getTeamAverageRating,
} = require("./MatchmakingRating");

function sumTeamMmr(team) {
  return team.reduce((sum, entry) => sum + Number(entry?.user?.mmr ?? 0), 0);
}

function countSameSidePlayers(currentTeam, previousTeam) {
  if (!Array.isArray(previousTeam) || previousTeam.length === 0) {
    return 0;
  }

  return currentTeam.filter((entry) =>
    previousTeam.some(
      (previousEntry) =>
        previousEntry?.user?.discord_id === entry?.user?.discord_id
    )
  ).length;
}

function calculateRepeatPenalty(team1Members, team2Members, previousTeams = {}) {
  return (
    countSameSidePlayers(team1Members, previousTeams.team1) +
    countSameSidePlayers(team2Members, previousTeams.team2)
  );
}

function isBetterCandidate(candidate, best) {
  if (!best) {
    return true;
  }

  if (candidate.balanceScore !== best.balanceScore) {
    return candidate.balanceScore < best.balanceScore;
  }

  if (candidate.repeatPenalty !== best.repeatPenalty) {
    return candidate.repeatPenalty < best.repeatPenalty;
  }

  if (candidate.mmrGap !== best.mmrGap) {
    return candidate.mmrGap < best.mmrGap;
  }

  return candidate.team1ExpectedScore <= best.team1ExpectedScore;
}

function buildCandidate(entries, selectedIndexes, previousTeams) {
  const team1Members = entries.filter((_, index) => selectedIndexes.has(index));
  const team2Members = entries.filter((_, index) => !selectedIndexes.has(index));
  const team1MMR = sumTeamMmr(team1Members);
  const team2MMR = sumTeamMmr(team2Members);
  const team1ExpectedScore = calculateExpectedScore(
    getTeamAverageRating(team1Members.map((entry) => entry.user)),
    getTeamAverageRating(team2Members.map((entry) => entry.user))
  );
  const team2ExpectedScore = 1 - team1ExpectedScore;

  return {
    team1Members,
    team2Members,
    team1MMR,
    team2MMR,
    team1ExpectedScore,
    team2ExpectedScore,
    balanceScore: Math.abs(team1ExpectedScore - 0.5),
    mmrGap: Math.abs(team1MMR - team2MMR),
    repeatPenalty: calculateRepeatPenalty(
      team1Members,
      team2Members,
      previousTeams
    ),
  };
}

function balanceTeams(entries, previousTeams = {}) {
  if (!Array.isArray(entries) || entries.length !== 10) {
    throw new Error("balanceTeams requires exactly 10 entries.");
  }

  const fixedIndex = 0;
  let bestCandidate = null;

  function choose(start, picked) {
    if (picked.length === 4) {
      const selectedIndexes = new Set([fixedIndex, ...picked]);
      const candidate = buildCandidate(entries, selectedIndexes, previousTeams);

      if (isBetterCandidate(candidate, bestCandidate)) {
        bestCandidate = candidate;
      }

      return;
    }

    for (let index = start; index < entries.length; index += 1) {
      picked.push(index);
      choose(index + 1, picked);
      picked.pop();
    }
  }

  choose(1, []);

  return bestCandidate;
}

module.exports = {
  balanceTeams,
  calculateRepeatPenalty,
  sumTeamMmr,
};
