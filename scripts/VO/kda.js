class Kda {
  /**
   *
   * @param {int} kills
   * @param {int} deaths
   * @param {int} assistances
   */
  constructor(kills, deaths, assistances) {
    this.kills = kills;
    this.deaths = deaths;
    this.assistances = assistances;

    this.ratio = ((this.kills + this.assistances) / 2).toFixed(1);
  }
}

module.exports = Kda;
