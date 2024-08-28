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
const { parseROFL } = require("./roflxd");

const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
        return;
      }

      res.pipe(file);

      file.on('finish', () => {
        file.close(resolve);
      });

      file.on('error', (err) => {
        fs.unlink(filePath, () => reject(err));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
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
  const time = gameLength / 60000;
  const visionScorePerMin = player.visionScore / time / 2;
  const damagePerMin = player.totalDamage / time;
  const killValue = player.kda.kills / time;
  const assistValue = player.kda.assist / 2 / time;
  const deathValue = player.kda.deaths / time;
  const isOverDeath =
    player.kda.kills + player.kda.assist / 2 < player.kda.deaths;

  let mmr = 10;

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
    deathPenalty;

  console.log(
    "시야 점수 : ", visionScoreWeight * 100, "\n",
    "데미지 점수 : ", damageScoreWeight * 100, "\n",
    "킬 어시 점수 : ", killAssistWeight * 100, "\n",
    "덜 죽은 점수 : ", deathValuePenalty * 100, "\n",
    "분당 1뎃 : ", deathPenalty);

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
    const filePath = `./files/${name}`;
    const data = await downloadFile(path, filePath);
    const outputFile = await parseROFL(filePath);
    const jsonData = await fs.promises.readFile(outputFile);
    const metadata = JSON.parse(jsonData);
    const players = getPlayers(metadata.statsJson);
    const gameLength = Number(metadata.gameLength);
    const gameVersion = metadata.gameVersion;
    const purpleTeam = getTeam(Side.PURPLE, players, gameLength);
    const blueTeam = getTeam(Side.BLUE, players, gameLength);

    return new Match(gameLength, purpleTeam, blueTeam);
  } catch (err) {
    return err.message;
  }
};
module.exports = { getMatchData };
