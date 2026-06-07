let TeamData = {
  team1: [],
  team2: [],
};

const TeamDataSaver = (team1, team2) => {
  TeamData["team1"] = team1;
  TeamData["team2"] = team2;
};

module.exports = {
  TeamData,
  TeamDataSaver,
};
