let TeamData = {
  team1: [],
  team2: [],
};

const TeamDataSaver = (team1, team2) => {
  TeamData["team1"] = team1;
  TeamData["team2"] = team2;
};

const CheckTeamMember = (newTeam1, newTeam2) => {
  if (!TeamData["team1"][0] || !TeamData["team2"][0]) {
    console.log("기존팀이 없습니다.");
    return false;
  }
  const existingTeam1 = TeamData["team1"];
  const existingTeam2 = TeamData["team2"];

  let index1 = existingTeam1.filter((player) =>
    newTeam1.some(
      (newPlayer) => player.user.discord_id === newPlayer.user.discord_id
    )
  ).length;
  console.log("1팀 중복", index1);
  if (index1 > 4) {
    return true;
  }

  let index2 = existingTeam2.filter((player) =>
    newTeam2.some(
      (newPlayer) => player.user.discord_id === newPlayer.user.discord_id
    )
  ).length;
  console.log("2팀 중복", index2);
  if (index2 > 4) {
    return true;
  }
  return false;
};

const ConvertTeam = (team1, team2) => {
  let differences = [];

  for (let player1 of team1) {
    for (let player2 of team2) {
      const difference = Math.abs(player1["user"].mmr - player2["user"].mmr);
      differences.push({ difference, player1, player2 });
    }
  }

  differences.sort((a, b) => a.difference - b.difference);

  let playersToSwitch = [];
  let selectedPlayers = new Set();

  for (let { difference, player1, player2 } of differences) {
    if (!selectedPlayers.has(player1) && !selectedPlayers.has(player2)) {
      playersToSwitch.push({ player1, player2 });
      selectedPlayers.add(player1);
      selectedPlayers.add(player2);
      if (playersToSwitch.length === 2) break;
    }
  }

  for (const { player1, player2 } of playersToSwitch) {
    console.log(player1["user"], player2["user"]);
    team1.splice(team1.indexOf(player1), 1, player2);
    team2.splice(team2.indexOf(player2), 1, player1);
  }

  return [team1, team2];
};

module.exports = {
  TeamData,
  TeamDataSaver,
  CheckTeamMember,
  ConvertTeam,
};
