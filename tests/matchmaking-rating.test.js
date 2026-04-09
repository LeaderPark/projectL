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
