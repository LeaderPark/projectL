import Inventory from "../VO/Inventory.js";
import Kda from "../VO/kda.js";
import Match from "../VO/match.js";
import Player from "../VO/player.js";
import { Lane } from "../enum/Lane.js";
import { Side } from "../enum/Side.js";
import Team from "../VO/team.js";
// const Match = require("../");
const fs = require("fs");

/**
 *
 * @param {String} path
 * @returns
 */
const getReplayData = (path) => {
  const decoded = fs
    .readFileSync(path, "utf8")
    .toString()
    .split("\n")
    .slice(0, 20)
    .join("");

  const startIndex = decoded.indexOf('{"gameLength"');
  const endIndex = decoded.indexOf(']"}');

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

    for (let i = 0; i < 6; i++) {
      items.push(Number(stats[`ITEM${i}`]));
    }
    players.push(
      new Player(
        stats["NAME"],
        stats["ID"],
        stats["SKIN"],
        stats["LEVEL"],
        stats["TEAM"],
        stats["WIN"],
        stats["KEYSTONE_ID"],
        new Kda(
          stats["CHAMPIONS_KILLED"],
          stats["NUM_DEATHS"],
          stats["ASSISTS"]
        ),
        Lane[stats["PLAYER_POSITION"]],
        stats["MINIONS_KILLED"] +
          stats["NEUTRAL_MINIONS_KILLED"] +
          stats["NEUTRAL_MINIONS_KILLED_YOUR_JUNGLE"] +
          stats["NEUTRAL_MINIONS_KILLED_ENEMY_JUNGLE"],
        new Inventory(items),
        stats["SUMMON_SPELL1_CAST"],
        stats["SUMMON_SPELL2_CAST"]
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
export const addReplay = (path) => {
  const matchData = getReplayData(path);

  const players = getPlayers(statsList);

  const gameLength = new Date(Number(matchData.gameLength));
  const gameVersion = matchData.gameVersion;
  const purpleTeam = getTeam(Side.PURPLE);
  const blueTeam = getTeam(Side.BLUE);

  return new Match(gameLength, gameVersion, purpleTeam, blueTeam, players);
};
