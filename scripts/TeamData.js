const attendTeam = (user) => {
  if (teamTable.includes(user.id)) return false;
  teamTable.push(user.id);

  return true;
};

const exitTeam = (user) => {};

const teamData = (userData, index) => {
  console.log(teamTable);
};

const teamTable = [];

module.exports = { attendTeam, exitTeam, teamData };
