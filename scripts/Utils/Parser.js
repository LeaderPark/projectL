const fs = require("fs");
const https = require("https");

const Inventory = require("../VO/Inventory");
const Kda = require("../VO/kda");
const Match = require("../VO/match");
const Player = require("../VO/player");
const Team = require("../VO/team");

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

  const decoded = fs
    .readFileSync(filePath, "utf8")
    .toString()
    .split("\n")
    .slice(0, 20)
    .join("");

  const startIndex = decoded.indexOf('{"gameLength"');
  const endIndex = decoded.indexOf(']"}');

  if (startIndex <= -1 || endIndex <= -1) {
    throw new Error("잘못 된 파일");
  }

  try {
    const jsonStr = decoded.substring(startIndex, endIndex) + ']"}';
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
        Number(stats["SUMMON_SPELL2_CAST"])
      )
    );
  }

  return players;
};

/**
 *
 * @param {Side} side
 * @param {Player[]} players
 * @returns
 */
const getTeam = (side, players) => {
  const playerList = players.filter((x) => x.team === side);

  return new Team(playerList[0].result, side, playerList);
};

/**
 *
 * @param {String} path
 */
const addReplay = async (path, name) => {
  try {
    const matchData = await getReplayData(path, name);
    const players = getPlayers(JSON.parse(matchData.statsJson));

    const gameLength = Number(matchData.gameLength);
    const gameVersion = matchData.gameVersion;
    const purpleTeam = getTeam(Side.PURPLE, players);
    const blueTeam = getTeam(Side.BLUE, players);

    return new Match(gameLength, gameVersion, purpleTeam, blueTeam, players);
  } catch (err) {
    return err.message;
  }
};
module.exports = { addReplay };
