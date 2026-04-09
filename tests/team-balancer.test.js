const test = require("node:test");
const assert = require("node:assert/strict");

const { balanceTeams } = require("../scripts/Utils/TeamBalancer");

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

test("balanceTeams finds a minimum-gap 5v5 split", () => {
  const entries = [
    1700, 1620, 1580, 1510, 1490, 1410, 1380, 1320, 1270, 1220,
  ].map((mmr, index) => buildEntry(`player-${index + 1}`, mmr));

  const result = balanceTeams(entries);
  const actualGap = Math.abs(sumMmr(result.team1Members) - sumMmr(result.team2Members));

  assert.equal(result.team1Members.length, 5);
  assert.equal(result.team2Members.length, 5);
  assert.equal(actualGap, bruteForceMinimum(entries));
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
