const test = require("node:test");
const assert = require("node:assert/strict");

const { balanceTeams } = require("../scripts/Utils/TeamBalancer");
const {
  calculateExpectedScore,
  getTeamAverageRating,
} = require("../scripts/Utils/MatchmakingRating");

function buildEntry(id, mmr) {
  return {
    member: { user: { id } },
    user: {
      discord_id: id,
      name: id,
      mmr,
    },
  };
}

function sumMmr(team) {
  return team.reduce((sum, entry) => sum + entry.user.mmr, 0);
}

function bruteForceMinimum(entries) {
  const indices = entries.map((_, index) => index);
  let minimumGap = Number.POSITIVE_INFINITY;

  function choose(start, picked) {
    if (picked.length === 5) {
      const selected = new Set(picked);
      const team1 = indices.filter((index) => selected.has(index));
      const team2 = indices.filter((index) => !selected.has(index));
      const gap = Math.abs(
        team1.reduce((sum, index) => sum + entries[index].user.mmr, 0) -
          team2.reduce((sum, index) => sum + entries[index].user.mmr, 0)
      );

      minimumGap = Math.min(minimumGap, gap);
      return;
    }

    for (let index = start; index < indices.length; index += 1) {
      picked.push(index);
      choose(index + 1, picked);
      picked.pop();
    }
  }

  choose(0, []);
  return minimumGap;
}

function bruteForceBestBalance(entries) {
  const indices = entries.map((_, index) => index);
  let bestScore = Number.POSITIVE_INFINITY;

  function choose(start, picked) {
    if (picked.length === 5) {
      const selected = new Set(picked);
      const team1 = indices
        .filter((index) => selected.has(index))
        .map((index) => entries[index].user);
      const team2 = indices
        .filter((index) => !selected.has(index))
        .map((index) => entries[index].user);
      const expectedScore = calculateExpectedScore(
        getTeamAverageRating(team1),
        getTeamAverageRating(team2)
      );

      bestScore = Math.min(bestScore, Math.abs(expectedScore - 0.5));
      return;
    }

    for (let index = start; index < indices.length; index += 1) {
      picked.push(index);
      choose(index + 1, picked);
      picked.pop();
    }
  }

  choose(0, []);
  return bestScore;
}

test("balanceTeams returns the split whose expected win rate is closest to 50%", () => {
  const entries = [
    1700, 1620, 1580, 1510, 1490, 1410, 1380, 1320, 1270, 1220,
  ].map((mmr, index) => buildEntry(`player-${index + 1}`, mmr));

  const result = balanceTeams(entries);
  const actualGap = Math.abs(sumMmr(result.team1Members) - sumMmr(result.team2Members));
  const actualBalance = Math.abs(result.team1ExpectedScore - 0.5);

  assert.equal(result.team1Members.length, 5);
  assert.equal(result.team2Members.length, 5);
  assert.equal(actualGap, bruteForceMinimum(entries));
  assert.equal(actualBalance, bruteForceBestBalance(entries));
  assert.equal(
    Number((result.team1ExpectedScore + result.team2ExpectedScore).toFixed(6)),
    1
  );
});

test("balanceTeams uses repeat-team avoidance as a tiebreaker when MMR is equal", () => {
  const entries = Array.from({ length: 10 }, (_, index) =>
    buildEntry(`player-${index + 1}`, 1000)
  );

  const result = balanceTeams(entries, {
    team1: entries.slice(0, 5),
    team2: entries.slice(5),
  });

  const repeatedSameSideCount =
    result.team1Members.filter((entry) =>
      entries.slice(0, 5).some((previous) => previous.user.discord_id === entry.user.discord_id)
    ).length +
    result.team2Members.filter((entry) =>
      entries.slice(5).some((previous) => previous.user.discord_id === entry.user.discord_id)
    ).length;

  assert.ok(
    repeatedSameSideCount < 10,
    "when multiple perfect splits exist, the balancer should avoid returning the exact same teams"
  );
});
