const Inventory = require("../VO/Inventory");
const Kda = require("../VO/kda");
const Match = require("../VO/match");
const Player = require("../VO/player");
const Team = require("../VO/team");
const Side = require("../enum/Side");

// Per-game performance ("OP") score, tuned to approximate the lol.ps "PS Score"
// (roughly 0-150, where MVP ~100+). Regression over 73 reference games (730
// players, 5 players Iron→Challenger) using replay-parsable metrics: KDA ratio,
// damage/min, gold/min, vision/min, CS/min, win/loss, deaths/min, damage-taken/min
// and a KDA-squared term. CS/min is negative (controlling for gold, lower CS means
// more income came from kills/objectives); deaths/min is negative; damage-taken/min
// credits frontline/tank contribution; the KDA² term (negative = concave) shapes
// the carry curve so high-KDA performances land on PS's nonlinear scale instead of
// blowing up linearly. See docs/op-score-dataset.md.
// (v5: Pearson ~0.95, leave-one-game-out MAE ~6.9.)
const PERF_COEFFS = {
  intercept: -9.619,
  kda: 8.262,
  damagePerMin: 0.01872,
  goldPerMin: 0.0704,
  visionPerMin: -0.05324,
  csPerMin: -1.549,
  win: 3.436,
  deathsPerMin: -19.8,
  damageTakenPerMin: 0.007256,
  kdaSq: -0.1727,
};

function mapLane(position) {
  const mapped = {
    TOP: "TOP",
    JUNGLE: "JUNGLE",
    MIDDLE: "MID",
    BOTTOM: "BOT",
    UTILITY: "SUPPORT",
  };

  return mapped[position] ?? "SUPPORT";
}

function buildPlayerName(participant) {
  const gameName = participant?.riotIdGameName ?? participant?.summonerName ?? "Unknown";
  const tagLine = participant?.riotIdTagline ?? participant?.riotIdTagLine;

  return tagLine ? `${gameName}#${tagLine}` : gameName;
}

function calculatePerformanceScore(player, gameLengthMs) {
  const minutes = Math.max(Number(gameLengthMs) / 60000, 1);
  const kills = Number(player?.kda?.kills ?? 0);
  const deaths = Number(player?.kda?.deaths ?? 0);
  const assists = Number(player?.kda?.assist ?? 0);

  // Per-minute rates keep the score comparable across game lengths. KDA ratio
  // floors deaths at 1. All inputs come straight from the parsed player stats.
  const kda = (kills + assists) / Math.max(deaths, 1);
  const damagePerMin = Number(player?.totalDamage ?? 0) / minutes;
  const goldPerMin = Number(player?.gold ?? 0) / minutes;
  const visionPerMin = Number(player?.visionScore ?? 0) / minutes;
  const csPerMin = Number(player?.minionScore ?? 0) / minutes;
  const deathsPerMin = deaths / minutes;
  const damageTakenPerMin = Number(player?.damageTaken ?? 0) / minutes;
  const win = player.win === "Win" ? 1 : 0;

  const raw =
    PERF_COEFFS.intercept +
    PERF_COEFFS.kda * kda +
    PERF_COEFFS.damagePerMin * damagePerMin +
    PERF_COEFFS.goldPerMin * goldPerMin +
    PERF_COEFFS.visionPerMin * visionPerMin +
    PERF_COEFFS.csPerMin * csPerMin +
    PERF_COEFFS.win * win +
    PERF_COEFFS.deathsPerMin * deathsPerMin +
    PERF_COEFFS.damageTakenPerMin * damageTakenPerMin +
    PERF_COEFFS.kdaSq * kda * kda;

  return Math.max(1, Math.round(raw));
}

function buildInventory(participant) {
  return new Inventory([
    Number(participant?.item0 ?? 0),
    Number(participant?.item1 ?? 0),
    Number(participant?.item2 ?? 0),
    Number(participant?.item6 ?? 0),
    Number(participant?.item3 ?? 0),
    Number(participant?.item4 ?? 0),
    Number(participant?.item5 ?? 0),
  ]);
}

function buildPlayer(participant) {
  const keystoneId =
    participant?.perks?.styles?.[0]?.selections?.[0]?.perk ?? 0;
  const subStyleId = participant?.perks?.styles?.[1]?.style ?? 0;

  const player = new Player(
    buildPlayerName(participant),
    Number(participant?.participantId ?? 0),
    participant?.championName ?? "Unknown",
    Number(participant?.champLevel ?? 0),
    Number(participant?.teamId ?? 0),
    participant?.win ? "Win" : "Fail",
    Number(keystoneId),
    Number(subStyleId),
    new Kda(
      Number(participant?.kills ?? 0),
      Number(participant?.deaths ?? 0),
      Number(participant?.assists ?? 0)
    ),
    mapLane(participant?.individualPosition),
    Number(participant?.totalMinionsKilled ?? 0) +
      Number(participant?.neutralMinionsKilled ?? 0),
    buildInventory(participant),
    Number(participant?.summoner1Id ?? 0),
    Number(participant?.summoner2Id ?? 0),
    Number(participant?.visionScore ?? 0),
    Number(participant?.totalDamageDealtToChampions ?? 0),
    participant?.puuid ?? "",
    Number(participant?.pentaKills ?? 0),
    Number(participant?.quadraKills ?? 0)
  );
  player.gold = Number(participant?.goldEarned ?? 0);
  player.damageTaken = Number(participant?.totalDamageTaken ?? 0);
  return player;
}

function buildTeam(side, players, gameLengthMs) {
  const teamPlayers = players.filter((player) => player.team === side);
  const totalKill = teamPlayers.reduce((sum, player) => sum + player.kda.kills, 0);

  teamPlayers.forEach((player) => {
    player.performanceScore = calculatePerformanceScore(player, gameLengthMs);
  });

  return new Team(teamPlayers[0]?.result ?? 0, side, teamPlayers, totalKill);
}

function formatKstDateTime(epochMs) {
  const numericEpoch = Number(epochMs);
  if (!Number.isFinite(numericEpoch) || numericEpoch <= 0) {
    return null;
  }

  const kstDate = new Date(numericEpoch + 9 * 60 * 60 * 1000);
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  const hour = String(kstDate.getUTCHours()).padStart(2, "0");
  const minute = String(kstDate.getUTCMinutes()).padStart(2, "0");
  const second = String(kstDate.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function resolvePlayedAtKst(payload, gameLengthMs) {
  const gameStartTimestamp = Number(payload?.info?.gameStartTimestamp);
  const gameCreationTimestamp = Number(payload?.info?.gameCreation);
  const gameEndTimestamp = Number(payload?.info?.gameEndTimestamp);

  if (Number.isFinite(gameStartTimestamp) && gameStartTimestamp > 0) {
    return formatKstDateTime(gameStartTimestamp);
  }

  if (Number.isFinite(gameCreationTimestamp) && gameCreationTimestamp > 0) {
    return formatKstDateTime(gameCreationTimestamp);
  }

  if (
    Number.isFinite(gameEndTimestamp) &&
    gameEndTimestamp > 0 &&
    Number.isFinite(gameLengthMs) &&
    gameLengthMs > 0
  ) {
    return formatKstDateTime(gameEndTimestamp - gameLengthMs);
  }

  return null;
}

function transformMatchPayload(payload) {
  const participants = Array.isArray(payload?.info?.participants)
    ? payload.info.participants.map(buildPlayer)
    : [];
  const gameLengthMs = Math.round(Number(payload?.info?.gameDuration ?? 0) * 1000);

  const purpleTeam = buildTeam(Side.PURPLE, participants, gameLengthMs);
  const blueTeam = buildTeam(Side.BLUE, participants, gameLengthMs);
  const match = new Match(gameLengthMs, purpleTeam, blueTeam);
  match.matchId = payload?.metadata?.matchId ?? null;
  match.playedAtKst = resolvePlayedAtKst(payload, gameLengthMs);

  return match;
}

module.exports = {
  calculatePerformanceScore,
  formatKstDateTime,
  mapLane,
  resolvePlayedAtKst,
  transformMatchPayload,
};
