const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildMatchmakingAdjustments,
} = require("../scripts/Utils/MatchmakingRating");

function buildPlayer(id, rating, gamesPlayed) {
  return {
    discordId: id,
    mmr: rating,
    win: Math.floor(gamesPlayed / 2),
    lose: Math.ceil(gamesPlayed / 2),
  };
}

test("underdog wins gain more rating than favorites winning as expected", () => {
  const underdogWin = buildMatchmakingAdjustments({
    winningTeam: [
      buildPlayer("blue-1", 1000, 30),
      buildPlayer("blue-2", 1000, 30),
      buildPlayer("blue-3", 1000, 30),
      buildPlayer("blue-4", 1000, 30),
      buildPlayer("blue-5", 1000, 30),
    ],
    losingTeam: [
      buildPlayer("purple-1", 1400, 30),
      buildPlayer("purple-2", 1400, 30),
      buildPlayer("purple-3", 1400, 30),
      buildPlayer("purple-4", 1400, 30),
      buildPlayer("purple-5", 1400, 30),
    ],
  });

  const favoriteWin = buildMatchmakingAdjustments({
    winningTeam: [
      buildPlayer("blue-1", 1400, 30),
      buildPlayer("blue-2", 1400, 30),
      buildPlayer("blue-3", 1400, 30),
      buildPlayer("blue-4", 1400, 30),
      buildPlayer("blue-5", 1400, 30),
    ],
    losingTeam: [
      buildPlayer("purple-1", 1000, 30),
      buildPlayer("purple-2", 1000, 30),
      buildPlayer("purple-3", 1000, 30),
      buildPlayer("purple-4", 1000, 30),
      buildPlayer("purple-5", 1000, 30),
    ],
  });

  assert.ok(
    underdogWin.winners[0].delta > favoriteWin.winners[0].delta,
    "underdog winners should gain more MMR than favorites"
  );
});

test("favorites lose more rating than underdogs losing as expected", () => {
  const favoriteLoss = buildMatchmakingAdjustments({
    winningTeam: [
      buildPlayer("blue-1", 1000, 30),
      buildPlayer("blue-2", 1000, 30),
      buildPlayer("blue-3", 1000, 30),
      buildPlayer("blue-4", 1000, 30),
      buildPlayer("blue-5", 1000, 30),
    ],
    losingTeam: [
      buildPlayer("purple-1", 1400, 30),
      buildPlayer("purple-2", 1400, 30),
      buildPlayer("purple-3", 1400, 30),
      buildPlayer("purple-4", 1400, 30),
      buildPlayer("purple-5", 1400, 30),
    ],
  });

  const underdogLoss = buildMatchmakingAdjustments({
    winningTeam: [
      buildPlayer("blue-1", 1400, 30),
      buildPlayer("blue-2", 1400, 30),
      buildPlayer("blue-3", 1400, 30),
      buildPlayer("blue-4", 1400, 30),
      buildPlayer("blue-5", 1400, 30),
    ],
    losingTeam: [
      buildPlayer("purple-1", 1000, 30),
      buildPlayer("purple-2", 1000, 30),
      buildPlayer("purple-3", 1000, 30),
      buildPlayer("purple-4", 1000, 30),
      buildPlayer("purple-5", 1000, 30),
    ],
  });

  assert.ok(
    Math.abs(favoriteLoss.losers[0].delta) >
      Math.abs(underdogLoss.losers[0].delta),
    "favorites should lose more MMR when upset"
  );
});

test("newer players move faster than established players", () => {
  const mixedExperience = buildMatchmakingAdjustments({
    winningTeam: [
      buildPlayer("new-player", 1000, 4),
      buildPlayer("new-2", 1000, 4),
      buildPlayer("new-3", 1000, 4),
      buildPlayer("new-4", 1000, 4),
      buildPlayer("new-5", 1000, 4),
    ],
    losingTeam: [
      buildPlayer("est-player", 1000, 40),
      buildPlayer("est-2", 1000, 40),
      buildPlayer("est-3", 1000, 40),
      buildPlayer("est-4", 1000, 40),
      buildPlayer("est-5", 1000, 40),
    ],
  });

  assert.ok(
    mixedExperience.winners[0].delta > Math.abs(mixedExperience.losers[0].delta),
    "newer players should have larger swings"
  );
});

function buildPerfPlayer(id, op) {
  return { discordId: id, mmr: 1000, win: 15, lose: 15, performanceScore: op };
}

test("performance weighting: a carry gains more than a passenger on the same winning team", () => {
  const result = buildMatchmakingAdjustments({
    winningTeam: [
      buildPerfPlayer("carry", 120),
      buildPerfPlayer("mid", 60),
      buildPerfPlayer("mid2", 60),
      buildPerfPlayer("mid3", 60),
      buildPerfPlayer("passenger", 20),
    ],
    losingTeam: [
      buildPerfPlayer("l1", 40),
      buildPerfPlayer("l2", 40),
      buildPerfPlayer("l3", 40),
      buildPerfPlayer("l4", 40),
      buildPerfPlayer("l5", 40),
    ],
  });

  const carry = result.winners.find((w) => w.playerId === "carry");
  const passenger = result.winners.find((w) => w.playerId === "passenger");

  assert.ok(carry.delta > passenger.delta, "carry should gain more than passenger");
  assert.ok(passenger.delta > 0, "every winner should still gain MMR");
  // aggregate transfer preserved vs flat Elo (5 even players, K=24, base +12 each = 60)
  const total = result.winners.reduce((sum, w) => sum + w.delta, 0);
  assert.ok(Math.abs(total - 60) <= 2, `winning team aggregate preserved, got ${total}`);
});

test("performance weighting: a strong loser loses less than a feeder on the same team", () => {
  const result = buildMatchmakingAdjustments({
    winningTeam: [
      buildPerfPlayer("w1", 50),
      buildPerfPlayer("w2", 50),
      buildPerfPlayer("w3", 50),
      buildPerfPlayer("w4", 50),
      buildPerfPlayer("w5", 50),
    ],
    losingTeam: [
      buildPerfPlayer("ace", 70),
      buildPerfPlayer("avg", 30),
      buildPerfPlayer("avg2", 30),
      buildPerfPlayer("avg3", 30),
      buildPerfPlayer("feeder", 10),
    ],
  });

  const ace = result.losers.find((l) => l.playerId === "ace");
  const feeder = result.losers.find((l) => l.playerId === "feeder");

  assert.ok(ace.delta < 0 && feeder.delta < 0, "every loser should still lose MMR");
  assert.ok(
    Math.abs(ace.delta) < Math.abs(feeder.delta),
    "the ACE should lose less than the feeder"
  );
});

test("performance weighting is a no-op when no OP scores are supplied (backward compatible)", () => {
  const result = buildMatchmakingAdjustments({
    winningTeam: [
      { discordId: "a", mmr: 1000, win: 15, lose: 15 },
      { discordId: "b", mmr: 1000, win: 15, lose: 15 },
      { discordId: "c", mmr: 1000, win: 15, lose: 15 },
      { discordId: "d", mmr: 1000, win: 15, lose: 15 },
      { discordId: "e", mmr: 1000, win: 15, lose: 15 },
    ],
    losingTeam: [
      { discordId: "f", mmr: 1000, win: 15, lose: 15 },
      { discordId: "g", mmr: 1000, win: 15, lose: 15 },
      { discordId: "h", mmr: 1000, win: 15, lose: 15 },
      { discordId: "i", mmr: 1000, win: 15, lose: 15 },
      { discordId: "j", mmr: 1000, win: 15, lose: 15 },
    ],
  });

  const deltas = result.winners.map((w) => w.delta);
  assert.ok(deltas.every((d) => d === deltas[0]), "all winners move identically without OP");
});
