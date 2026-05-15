const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const { fileURLToPath } = require("node:url");

const Inventory = require("../VO/Inventory");
const Kda = require("../VO/kda");
const Match = require("../VO/match");
const Player = require("../VO/player");
const Team = require("../VO/team");
const Lane = require("../enum/Lane");
const Side = require("../enum/Side");
const { calculatePerformanceScore } = require("../Riot/MatchTransformer");
const { parseROFL } = require("./roflxd");

function downloadHttpFile(url, filePath, redirectsRemaining = 3) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(url, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location &&
        redirectsRemaining > 0
      ) {
        response.resume();
        downloadHttpFile(response.headers.location, filePath, redirectsRemaining - 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }

      const file = fs.createWriteStream(filePath);
      response.pipe(file);

      file.on("finish", () => {
        file.close(resolve);
      });
      file.on("error", (error) => {
        fs.unlink(filePath, () => reject(error));
      });
    });

    request.on("error", reject);
  });
}

async function downloadFile(url, filePath) {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol === "file:") {
    await fs.promises.copyFile(fileURLToPath(parsedUrl), filePath);
    return;
  }

  if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
    await downloadHttpFile(url, filePath);
    return;
  }

  throw new Error(`Unsupported replay URL protocol: ${parsedUrl.protocol}`);
}

function readNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function readPlayerName(stats) {
  const explicitName = firstNonEmpty(
    stats.NAME,
    stats.PLAYER_NAME,
    stats.SUMMONER_NAME,
    stats.riotId,
    stats.summonerName
  );
  if (explicitName) {
    return explicitName;
  }

  const gameName = firstNonEmpty(
    stats.RIOT_ID_GAME_NAME,
    stats.RIOTID_GAME_NAME,
    stats.RIOT_ID_NAME,
    stats.riotIdGameName,
    stats.gameName
  );
  const tagLine = firstNonEmpty(
    stats.RIOT_ID_TAGLINE,
    stats.RIOT_ID_TAG_LINE,
    stats.RIOTID_TAGLINE,
    stats.riotIdTagline,
    stats.riotIdTagLine,
    stats.tagLine
  );

  if (gameName && tagLine) {
    return `${gameName}#${tagLine}`;
  }

  return gameName || "Unknown";
}

function readPlayerPuuid(stats) {
  return firstNonEmpty(
    stats.RIOT_PUUID,
    stats.PLAYER_PUUID,
    stats.riotPuuid,
    stats.puuid,
    stats.PUUID
  );
}

function readSummonerSpellId(stats, slot) {
  return readNumber(stats[`SUMMONER_SPELL_${slot}`]);
}

function buildInventory(stats) {
  return new Inventory([
    readNumber(stats.ITEM0),
    readNumber(stats.ITEM1),
    readNumber(stats.ITEM2),
    readNumber(stats.ITEM6),
    readNumber(stats.ITEM3),
    readNumber(stats.ITEM4),
    readNumber(stats.ITEM5),
  ]);
}

function buildPlayer(stats) {
  return new Player(
    readPlayerName(stats),
    readNumber(stats.ID),
    String(stats.SKIN ?? "Unknown"),
    readNumber(stats.LEVEL),
    readNumber(stats.TEAM),
    String(stats.WIN ?? "Fail"),
    readNumber(stats.KEYSTONE_ID),
    readNumber(stats.STAT_PERK_SUB_STYLE ?? stats.SUBSTYLE_ID),
    new Kda(
      readNumber(stats.CHAMPIONS_KILLED),
      readNumber(stats.NUM_DEATHS),
      readNumber(stats.ASSISTS)
    ),
    Lane[readNumber(stats.PLAYER_POSITION)] ?? "SUPPORT",
    readNumber(stats.MINIONS_KILLED) +
      readNumber(stats.NEUTRAL_MINIONS_KILLED) +
      readNumber(stats.NEUTRAL_MINIONS_KILLED_YOUR_JUNGLE) +
      readNumber(stats.NEUTRAL_MINIONS_KILLED_ENEMY_JUNGLE),
    buildInventory(stats),
    readSummonerSpellId(stats, 1),
    readSummonerSpellId(stats, 2),
    readNumber(stats.VISION_SCORE),
    readNumber(stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS),
    readPlayerPuuid(stats),
    readNumber(stats.PENTA_KILLS),
    readNumber(stats.QUADRA_KILLS)
  );
}

function buildTeam(side, players, gameLength) {
  const teamPlayers = players.filter((player) => player.team === side);
  const totalKill = teamPlayers.reduce(
    (sum, player) => sum + player.kda.kills,
    0
  );

  teamPlayers.forEach((player) => {
    player.performanceScore = calculatePerformanceScore(player, gameLength);
  });

  return new Team(teamPlayers[0]?.result ?? 0, side, teamPlayers, totalKill);
}

function buildMatchFromMetadata(metadata) {
  const statsList = Array.isArray(metadata?.statsJson) ? metadata.statsJson : [];
  const players = statsList.map(buildPlayer);
  const gameLength = readNumber(metadata?.gameLength);
  const purpleTeam = buildTeam(Side.PURPLE, players, gameLength);
  const blueTeam = buildTeam(Side.BLUE, players, gameLength);

  return new Match(gameLength, purpleTeam, blueTeam);
}

async function getMatchData(url, name, options = {}) {
  const tempRoot = options.tempRoot ?? os.tmpdir();
  const tempDir = await fs.promises.mkdtemp(
    path.join(tempRoot, "projectl-replay-")
  );
  const filePath = path.join(tempDir, path.basename(name || "replay.rofl"));

  try {
    await downloadFile(url, filePath);
    const metadata = await parseROFL(filePath);
    return buildMatchFromMetadata(metadata);
  } catch (error) {
    return error.message;
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

module.exports = {
  buildMatchFromMetadata,
  downloadFile,
  getMatchData,
};
