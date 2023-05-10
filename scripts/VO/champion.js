class Champion {
  /**
   *
   * @param {string} name
   * @param {string} title
   * @param {string} image
   * @param {string} allytips
   * @param {string} enemytips
   * @param {array} tags
   * @param {table} info
   * @param {VO} stat
   * @param {VO} spells
   * @param {table} passive
   *
   */
  constructor(
    name,
    title,
    image,
    allytips,
    enemytips,
    tags,
    info,
    stat,
    spells,
    passive
  ) {
    this.name = name;
    this.title = title;
    this.champion_square = image.full;
    this.allytips = allytips;
    this.enemytips = enemytips;
    this.tags = tags;
    this.info = info;
    this.stat = stat;
    this.spells = spells;
    this.passive = passive;
  }
}

module.exports = Champion;
