class Match {
  /**
   *
   * @param {Date} gameLength
   * @param {string} gameVersion
   * @param {Team} purpleTeam
   * @param {Team} blueTeam
   * @param {Player[]} players
   */
  constructor(gameLength, gameVersion, purpleTeam, blueTeam, players) {
    this.gameLength = gameLength;
    this.gameVersion = gameVersion;
    this.purpleTeam = purpleTeam;
    this.blueTeam = blueTeam;

    this.players = players;

    // this.winingTeam =
    //   this.purpleTeam.result === RESULT.VICTORY
    //     ? this.purpleTeam
    //     : this.blueTeam;

    // this.losingTeam =
    //   this.blueTeam.result === RESULT.VICTORY ? this.purpleTeam : this.blueTeam;
  }
}
