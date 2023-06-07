const Match = require("../VO/match");
const { promisePool } = require("./DB");
const config = require("../../config.json");
const Kda = require("../VO/kda");

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

    const match_id = result.insertId;
    const playerNames = [
      ...match.blueTeam.players,
      ...match.purpleTeam.players,
    ].map((x) => x.playerName);

    let sql2 = `SELECT discord_id from user where name IN (?,?,?,?,?,?,?,?,?,?)`;
    let [result2] = await promisePool.query(sql2, [...playerNames]);

    let sql3 = `INSERT INTO match_in_users (match_id, user_id) VALUES `;

    for (let i = 0; i < result2.length; i++) {
      const playerId = result2[i].discord_id;
      sql3 +=
        i >= result2.length - 1
          ? `(${match_id}, ${playerId})`
          : `(${match_id}, ${playerId}), `;
    }

    let [result3] = await promisePool.query(sql3);

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
    let updateSql = `UPDATE user SET mmr = ?, win = ?, lose = ?, penta = ?, quadra = ?, champions = ?, lanes = ?, friends = ?, t_kill = ?, t_death = ?, t_assist = ?, t_kill_rate = ? WHERE name = ?`;

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

    const players = [...match.blueTeam.players, ...match.purpleTeam.players];
    for await (let p of players) {
      [result] = await promisePool.query(sql, [p.playerName]);
      if (result.length <= 0) {
        notRegistUser.push(p.playerName);
        continue;
      }

      user = result[0];
      mmr = user.mmr + p.mmr;
      mmr <= 300 && (mmr = 300);
      win = user.win + (p.result ? 1 : 0);
      lose = user.lose + (p.result ? 0 : 1);

      penta = user.penta + p.pentaKill;
      quadra = user.quadra + p.quadraKill;

      champions = user.champions === "" ? {} : JSON.parse(user.champions);
      lanes = user.lanes === "" ? {} : JSON.parse(user.lanes);
      friends = user.friends === "" ? {} : JSON.parse(user.friends);

      //champions update
      {
        if (!champions[p.championName]) {
          champions[p.championName] = {
            kills: 0,
            deaths: 0,
            assist: 0,
            win: 0,
            lose: 0,
          };
        }
        champions[p.championName].kills += p.kda.kills;
        champions[p.championName].deaths += p.kda.deaths;
        champions[p.championName].assist += p.kda.assist;
        champions[p.championName].win += p.result ? 1 : 0;
        champions[p.championName].lose += p.result ? 0 : 1;
      }

      //lanes update
      {
        if (!lanes[p.lane]) {
          lanes[p.lane] = {
            win: 0,
            lose: 0,
          };
        }
        lanes[p.lane].win += p.result ? 1 : 0;
        lanes[p.lane].lose += p.result ? 0 : 1;
      }
      //friends update
      {
        for (let pp of players) {
          if (pp === p || pp.win !== p.win) continue;

          if (!friends[pp.playerName]) {
            friends[pp.playerName] = { win: 0, lose: 0 };
          }

          friends[pp.playerName].win += p.result ? 1 : 0;
          friends[pp.playerName].lose += p.result ? 0 : 1;
        }
      }

      t_kill = user.t_kill + p.kda.kills;
      t_death = user.t_death + p.kda.deaths;
      t_assist = user.t_assist + p.kda.assist;
      t_kill_rate =
        user.t_kill_rate +
        Math.floor(
          ((p.kda.kills + p.kda.assist) / match.blueTeam.totalKill) * 100
        );

      [result] = await promisePool.query(updateSql, [
        mmr,
        win,
        lose,
        penta,
        quadra,
        JSON.stringify(champions),
        JSON.stringify(lanes),
        JSON.stringify(friends),
        t_kill,
        t_death,
        t_assist,
        t_kill_rate,
        p.playerName,
      ]);
    }
    return { success: true, user: notRegistUser };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

const getRankData = async () => {
  try {
    let sql = `SELECT discord_id, name FROM user ORDER BY mmr DESC, name ASC`;

    let [result] = await promisePool.query(sql);

    return { success: true, data: result };
  } catch (e) {
    return { success: false, msg: e.message };
  }
};

const getUsersData = async (ids) => {
  try {
    let sql = `SELECT discord_id, name, mmr  FROM user where discord_id IN (?,?,?,?,?,?,?,?,?,?) ORDER BY mmr DESC, name ASC`;
    // let sql = `SELECT discord_id, name, mmr  FROM user where discord_id IN (?,?) ORDER BY mmr DESC, name ASC`;
    let [result] = await promisePool.query(sql, [...ids]);

    return { success: true, data: result };
  } catch (e) {
    return { success: false, msg: e.message };
  }
};

const getUserData = async (id) => {
  try {
    let sql = `SELECT * FROM user where discord_id IN (?)`;
    let [result] = await promisePool.query(sql, [id]);

    return { success: true, data: result };
  } catch (e) {
    return { success: false, msg: e.message };
  }
};

module.exports = {
  registraion,
  insertMatchData,
  updateUserData,
  getRankData,
  getUsersData,
  getUserData,
};
