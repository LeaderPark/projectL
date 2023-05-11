const Match = require("../VO/match");
const { promisePool } = require("./DB");
const config = require("../../config.json");

const registraion = async (discord_id, name, puuid) => {
  let sql, result;

  try {
    sql = `SELECT * FROM user WHERE discord_id = ? OR name = ?`;
    let [r] = await promisePool.query(sql, [discord_id, name]);

    if (r.length > 0) return -1;

    sql = `INSERT INTO user (discord_id, name, puuid) VALUES (?, ?, ?)`;
    result = await promisePool.query(sql, [discord_id, name, puuid]);

    return result;
  } catch (e) {
    return null;
  }
};

/**
 *
 * @param {Match} match
 * @param {String} name
 * @returns
 */
const insertMatchData = async (match, name) => {
  try {
    let sql = `SELECT * FROM matches WHERE game_id = ?`;
    let [result] = await promisePool.query(sql, [name]);

    if (result.length > 0)
      return { success: false, msg: "이미 데이터에 존재하는 경기입니다." };

    sql = `INSERT INTO matches (game_id, game_length, purple_team, blue_team) VALUES (?,?,?,?)`;
    [result] = await promisePool.query(sql, [
      name,
      match.gameLength,
      JSON.stringify(match.purpleTeam),
      JSON.stringify(match.blueTeam),
    ]);

    return { success: true };
  } catch (e) {
    return { success: false, msg: e.message };
  }
};

/**
 *
 * @param {Match} match
 */
const updateUserData = async (match) => {
  try {
    let sql = `SELECT * FROM user where name = ?`;
    let updateSql = `UPDATE user SET mmr = ?, win = ?, lose = ?, 
    penta = ?, quadra = ?, champions = ?, lanes = ?, friends = ?, 
    t_kill = ?, t_death = ?, t_assist = ?, t_kill_rate = ? 
    WHERE name = ?`;

    let result, user;
    let notRegistUser = [];
    let mmr,
      win,
      lose,
      penta,
      quadra,
      champions,
      lanes,
      friends,
      t_kill,
      t_death,
      t_assist,
      t_kill_rate;
    for await (let p of match.blueTeam.players) {
      [result] = await promisePool.query(sql, [p.playerName]);

      if (result.length <= 0) {
        notRegistUser.push(p.playerName);
      }
      user = result[0];
    }
    return { success: true, notRegistUser: notRegistUser };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

module.exports = {
  registraion,
  insertMatchData,
  updateUserData,
};
