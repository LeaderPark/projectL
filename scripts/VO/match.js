const Player = require("./player");
const Team = require("./team");

class Match {
  /**
   *
   * @param {int} gameLength
   * @param {string} gameVersion
   * @param {Team} purpleTeam
   * @param {Team} blueTeam
   * @param {Player[]} players
   */
  constructor(gameLength, purpleTeam, blueTeam) {
    this.gameLength = gameLength;
    this.purpleTeam = purpleTeam;
    this.blueTeam = blueTeam;
  }
}

module.exports = Match;
