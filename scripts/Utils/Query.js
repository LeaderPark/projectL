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
    for await (let p of match.blueTeam.players) {
      [result] = await promisePool.query(sql, [p.playerName]);
      if (result.length <= 0) {
        notRegistUser.push(p.playerName);
        continue;
      }

      user = result[0];
      mmr = user.mmr + p.mmr;
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
          champions[p.championName] = { kills: 0, deaths: 0, assist: 0 };
        }
        champions[p.championName].kills += p.kda.kills;
        champions[p.championName].deaths += p.kda.deaths;
        champions[p.championName].assist += p.kda.assist;
      }

      //lanes update
      {
        if (!lanes[p.lane]) {
          lanes[p.lane] = {
            kills: 0,
            deaths: 0,
            assist: 0,
          };
        }
        lanes[p.lane].kills += p.kda.kills;
        lanes[p.lane].deaths += p.kda.deaths;
        lanes[p.lane].assist += p.kda.assist;
      }
      //friends update
      {
        for (let pp of match.blueTeam.players) {
          if (pp === p) continue;

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
