const fs = require("fs");
const https = require("https");

const Inventory = require("../VO/Inventory");
const Kda = require("../VO/kda");
const Match = require("../VO/match");
const Player = require("../VO/player");
const Team = require("../VO/team");
const { TextDecoder } = require("util");
const decoder = new TextDecoder("utf-8");

const Lane = require("../enum/Lane");
const Side = require("../enum/Side");
const downloadFile = (path, filePath) => {
  return new Promise((resolve, reject) => {
    let data = "";

    https.get(path, (res) => {
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(data);
      });

      res.on("error", (err) => {
        reject(err);
      });
    });
  });
};

/**
 *
 * @param {String} path
 * @returns
 */
const getReplayData = async (path, name) => {
  const filePath = `./files/${name}`;

  const data = await downloadFile(path, filePath);

  fs.writeFileSync(filePath, data, (err) => {
    if (err) {
      throw new Error(err);
    }
  });

  const fileContent = fs.readFileSync(filePath);
  const decoded = decoder.decode(fileContent);
  const lines = decoded.split("\n").slice(0, 20).join("");

  const startIndex = lines.indexOf('{"gameLength"');
  const endIndex = lines.indexOf(']"}');

  if (startIndex <= -1 || endIndex <= -1) {
    throw new Error("잘못 된 파일");
  }

  try {
    const jsonStr = lines.substring(startIndex, endIndex) + ']"}';
    return JSON.parse(jsonStr);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("Unable to parse replay data from this replay file.");
    } else {
      throw new Error(
        "An unexpected error has occured while trying to parse replay data."
      );
    }
  }
};

/**
 *
 * @param {Object[]} statsList
 * @returns
 */
const getPlayers = (statsList) => {
  let players = [];

  for (let stats of statsList) {
    let items = [];

    for (let i = 0; i <= 6; i++) {
      items.push(Number(stats[`ITEM${i}`]));
    }
    players.push(
      new Player(
        stats["NAME"],
        Number(stats["ID"]),
        stats["SKIN"],
        Number(stats["LEVEL"]),
        Number(stats["TEAM"]),
        stats["WIN"],
        Number(stats["KEYSTONE_ID"]),
        new Kda(
          Number(stats["CHAMPIONS_KILLED"]),
          Number(stats["NUM_DEATHS"]),
          Number(stats["ASSISTS"])
        ),
        Lane[Number(stats["PLAYER_POSITION"])],
        Number(stats["MINIONS_KILLED"]) +
          Number(stats["NEUTRAL_MINIONS_KILLED"]) +
          Number(stats["NEUTRAL_MINIONS_KILLED_YOUR_JUNGLE"]) +
          Number(stats["NEUTRAL_MINIONS_KILLED_ENEMY_JUNGLE"]),
        new Inventory(items),
        Number(stats["SUMMON_SPELL1_CAST"]),
        Number(stats["SUMMON_SPELL2_CAST"]),
        Number(stats["VISION_SCORE"]),
        Number(stats["TOTAL_DAMAGE_DEALT_TO_CHAMPIONS"]),
        stats["PUUID"],
        Number(stats["PENTA_KILLS"]),
        Number(stats["QUADRA_KILLS"])
      )
    );
  }

  return players;
};

/**
 *
 * @param {Player} player
 * @param {Number} time
 */
const getMMR = (player, gameLength) => {
  const time = gameLength / 60000; // 1분 = 60000ms
  const visionScorePerMin = player.visionScore / time;
  const damagePerMin = player.totalDamage / time;
  const killValue = player.kda.kills / time;
  const assistValue = player.kda.assist / 2 / time;
  const deathValue = player.kda.deaths / time;
  const isOverDeath = (player.kda.kills + (player.kda.assist / 2)) < player.kda.deaths;
  let mmr = 10; // 최소 점수로 시작
  if (
    visionScorePerMin >= 3 &&
    damagePerMin >= 1000 &&
    !isOverDeath &&
    killValue + assistValue >= 2 &&
    deathValue <= 0.1
  ) {
    mmr = 100; // 모든 조건을 만족하면 최대 점수
  } else {
    const visionScoreWeight = Math.min(Math.max(visionScorePerMin / 3, 0), 1); // 0 ~ 1 사이의 값
    const damageScoreWeight = Math.min(Math.max(damagePerMin / 1000, 0), 1); // 0 ~ 1 사이의 값
    const killAssistWeight = Math.min(
      Math.max((killValue + assistValue) / 2, 0),
      1
    ); // 0 ~ 1 사이의 값
    const deathPenalty = isOverDeath ? 0.5 : 1; // 사망이 많으면 점수 감소
    const deathValuePenalty = Math.max(1 - deathValue, 0); // 사망률에 따른 패널티

    // 가중치를 적용한 최종 MMR 계산
    mmr +=
      (visionScoreWeight +
        damageScoreWeight +
        killAssistWeight +
        deathValuePenalty) *
      22.5 *
      deathPenalty; // 10 ~ 100 사이의 값 조정
  }

  if (player.win === "Win") {
    return Math.round(mmr);
  }

  return -Math.round((100 - mmr) / 3);
};

/**
 *
 * @param {Side} side
 * @param {Player[]} players
 * @returns
 */
const getTeam = (side, players, time) => {
  const playerList = players.filter((x) => x.team === side);
  let totalKill = 0;
  playerList.forEach((p) => (totalKill += p.kda.kills));

  for (let key in playerList) {
    playerList[key].mmr = getMMR(playerList[key], time);
    console.log(playerList[key].playerName, playerList[key].mmr);
  }
  return new Team(playerList[0].result, side, playerList, totalKill);
};

/**
 *
 * @param {String} path
 */
const getMatchData = async (path, name) => {
  try {
    const matchData = await getReplayData(path, name);
    const players = getPlayers(JSON.parse(matchData.statsJson));

    const gameLength = Number(matchData.gameLength);
    const gameVersion = matchData.gameVersion;
    const purpleTeam = getTeam(Side.PURPLE, players, gameLength);
    const blueTeam = getTeam(Side.BLUE, players, gameLength);

    return new Match(gameLength, purpleTeam, blueTeam);
  } catch (err) {
    return err.message;
  }
};
module.exports = { getMatchData };
