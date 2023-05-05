const { table } = require("console");

const attendTeam = (user) => {
  if (teamTable.length >= 10) return { success: false, reason: "full" };
  if (teamTable.includes(user.id)) return { success: false, reason: "already" };
  teamTable.push(user.id);
  return { success: true };
};

const exitTeam = (user) => {
  if (!teamTable.includes(user.id)) return false;
  teamTable.splice(teamTable.indexOf(user.id), 1);
  return true;
};

const exitAllTeam = () => {
    teamTable.splice(0, teamTable.length);
};

const teamTable = [];

module.exports = { attendTeam, exitTeam, exitAllTeam, teamTable };
