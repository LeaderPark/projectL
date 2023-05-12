const Player = require("./player");

class Team {
  /**
   *
   * @param {int} result
   * @param {int} side
   * @param {Player[]} players
   */
  constructor(result, side, players, totalKill) {
    this.result = result;
    this.side = side;
    this.players = players;
    this.totalKill = totalKill;
  }
}

module.exports = Team;
