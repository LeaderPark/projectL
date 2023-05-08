const secret = require("../../secret");

const mysql = require("mysql2");

const pool = mysql.createPool(secret);
const promisePool = pool.promise();

module.exports = { promisePool };
