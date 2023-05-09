const Match = require("../VO/match");
const { promisePool } = require("./DB");

const registraion = async (discord_id, name) => {
  let sql, result;

  try {
    sql = `SELECT * FROM user WHERE discord_id = ? OR name = ?`;
    let [r] = await promisePool.query(sql, [discord_id, name]);

    if (r.length > 0) return -1;

    sql = `INSERT INTO user (discord_id, name) VALUES (?, ?)`;
    result = await promisePool.query(sql, [discord_id, name]);

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

    console.log(result);
    return { success: true };
  } catch (e) {
    return { success: false, msg: e.message };
  }
};

module.exports = {
  registraion,
  insertMatchData,
};
