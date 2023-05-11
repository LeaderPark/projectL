class Champion_stat {
  /**
   *
   * @param {float} hp,
   * @param {float} hpperlevel,
   * @param {float} mp,
   * @param {float} mpperlevel,
   * @param {float} movespeed,
   * @param {float} armor,
   * @param {float} armorperlevel,
   * @param {float} spellblock,
   * @param {float} spellblockperlevel,
   * @param {float} attackrange,
   * @param {float} hpregen,
   * @param {float} hpregenperlevel,
   * @param {float} mpregen,
   * @param {float} mpregenperlevel,
   * @param {float} crit,
   * @param {float} critperlevel,
   * @param {float} attackdamage,
   * @param {float} attackdamageperlevel,
   * @param {float} attackspeedperlevel,
   * @param {float} attackspeed
   *
   */
  constructor(
    hp,
    hpperlevel,
    mp,
    mpperlevel,
    movespeed,
    armor,
    armorperlevel,
    spellblock,
    spellblockperlevel,
    attackrange,
    hpregen,
    hpregenperlevel,
    mpregen,
    mpregenperlevel,
    crit,
    critperlevel,
    attackdamage,
    attackdamageperlevel,
    attackspeedperlevel,
    attackspeed
  ) {
    this.hp = hp;
    this.hpperlevel = hpperlevel;
    this.mp = mp;
    this.mpperlevel = mpperlevel;
    this.movespeed = movespeed;
    this.armor = armor;
    this.armorperlevel = armorperlevel;
    this.spellblock = spellblock;
    this.spellblockperlevel = spellblockperlevel;
    this.attackrange = attackrange;
    this.hpregen = hpregen;
    this.hpregenperlevel = hpregenperlevel;
    this.mpregen = mpregen;
    this.mpregenperlevel = mpregenperlevel;
    this.crit = crit;
    this.critperlevel = critperlevel;
    this.attackdamage = attackdamage;
    this.attackdamageperlevel = attackdamageperlevel;
    this.attackspeedperlevel = attackspeedperlevel;
    this.attackspeed = attackspeed;
  }
}

module.exports = Champion_stat;
