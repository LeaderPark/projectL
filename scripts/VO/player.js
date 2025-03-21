const Inventory = require("./Inventory");
const Kda = require("./kda");

const Result = require("../enum/Result");

class Player {
  /**
   *
   * @param {string} playerName
   * @param {long} playerId
   * @param {string} championName
   * @param {int} level
   * @param {Team} team
   * @param {string} win
   * @param {int} keystoneId
   * @param {Kda} kda
   * @param {Lane} lane
   * @param {int} minionScore
   * @param {Inventory} inventory
   * @param {int} spell1
   * @param {int} spell2
   * @param {int} visionScore
   * @param {int} totalDamage
   * @param {String} puuid
   * @param {int} penta
   * @param {int} quadra
   */
  constructor(
    playerName,
    playerId,
    championName,
    level,
    team,
    win,
    keystoneId,
    kda,
    lane,
    minionScore,
    inventory,
    spell1,
    spell2,
    visionScore,
    totalDamage,
    puuid,
    penta,
    quadra
  ) {
    this.playerName = playerName;
    this.playerId = playerId;
    this.championName = championName;

    this.win = win;
    this.result = win === "Win" ? Result.VICTORY : Result.DEFEAT;
    this.level = level;
    this.minionScore = minionScore;
    this.keystoneId = keystoneId;

    this.spell1 = spell1;
    this.spell2 = spell2;

    this.visionScore = visionScore;
    this.totalDamage = totalDamage;

    this.team = team;
    this.lane = lane;
    this.kda = kda;
    this.inventory = inventory;
    this.puuid = puuid;

    this.pentaKill = penta;
    this.quadraKill = quadra;

    this.mmr = 0;
  }
}

module.exports = Player;
