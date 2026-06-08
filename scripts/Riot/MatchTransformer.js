const Inventory = require("../VO/Inventory");
const Kda = require("../VO/kda");
const Match = require("../VO/match");
const Player = require("../VO/player");
const Team = require("../VO/team");
const Side = require("../enum/Side");

// Per-game performance ("OP") score, tuned to approximate the lol.ps "PS Score"
// (roughly 0-135, where MVP ~100+). Fitted by linear regression over 10 reference
// games using only metrics we can parse from a replay: KDA ratio, kill participation,
// team damage share, and win/loss.
const PERF_COEFFS = {
  intercept: -7.72,
  kda: 5.45,
  killParticipation: 23.1,
  damageShare: 105.47,
  win: 10.08,
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

function calculatePerformanceScore(player, teamContext = {}) {
  const kills = Number(player?.kda?.kills ?? 0);
  const deaths = Number(player?.kda?.deaths ?? 0);
  const assists = Number(player?.kda?.assist ?? 0);
  const teamKills = Number(teamContext.teamKills) || 0;
  const teamDamage = Number(teamContext.teamDamage) || 0;

  // KDA ratio (deaths floored at 1), kill participation and team damage share,
  // each derived only from data available in our parsed match payload.
  const kda = (kills + assists) / Math.max(deaths, 1);
  const killParticipation = teamKills > 0 ? (kills + assists) / teamKills : 0;
  const damageShare =
    teamDamage > 0 ? Number(player?.totalDamage ?? 0) / teamDamage : 0;
  const win = player.win === "Win" ? 1 : 0;

  const raw =
    PERF_COEFFS.intercept +
    PERF_COEFFS.kda * kda +
    PERF_COEFFS.killParticipation * killParticipation +
    PERF_COEFFS.damageShare * damageShare +
    PERF_COEFFS.win * win;

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

  return new Player(
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
}

function buildTeam(side, players, gameLengthMs) {
  const teamPlayers = players.filter((player) => player.team === side);
  const totalKill = teamPlayers.reduce((sum, player) => sum + player.kda.kills, 0);
  const totalDamage = teamPlayers.reduce(
    (sum, player) => sum + Number(player.totalDamage ?? 0),
    0
  );

  teamPlayers.forEach((player) => {
    player.performanceScore = calculatePerformanceScore(player, {
      teamKills: totalKill,
      teamDamage: totalDamage,
    });
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
