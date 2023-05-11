class Champion {
  /**
   *
   * @param {string} name
   * @param {string} description
   * @param {string} tooltip
   * @param {array} cooldown
   * @param {array} cost
   * @param {array} range
   * @param {string} image
   *
   */
  constructor(name, description, tooltip, cooldown, cost, range, image) {
    this.name = name;
    this.description = description;
    this.tooltip = tooltip;
    this.cooldown = cooldown;
    this.cost = cost;
    this.range = range;
    this.image = image.full;
  }
}

module.exports = Champion;
