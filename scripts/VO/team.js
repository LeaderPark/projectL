const Player = require("./player");

class Team {
  /**
   *
   * @param {int} result
   * @param {int} side
   * @param {Player[]} players
   */
  constructor(result, side, players) {
    this.result = result;
    this.side = side;
    this.players = players;
  }
}

module.exports = Team;
