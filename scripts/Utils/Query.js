const { promisePool } = require("./DB");

const registraion = async (discord_id, name) => {
    let sql, result;

    try {
        sql = `SELECT * FROM user WHERE discord_id = ? OR name = ?`
        let [r] = await promisePool.query(sql, [discord_id, name])

        if (r.length > 0) return -1;

        sql = `INSERT INTO user (discord_id, name) VALUES (?, ?)`
        result = await promisePool.query(sql, [discord_id, name]);

        return result
    } catch (e) {
        return null;
    }
}

module.exports = {
    registraion
}