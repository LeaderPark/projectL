const TeamData = {
  team1: {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
  },
  team2: {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
  },
};

const TeamDataSaver = (team1, team2) => {
  for (let i = 0; i < team1.length; i++) {
    TeamData["team1"][i] = team1[i]["user"]["discord_id"];
    TeamData["team2"][i] = team2[i]["user"]["discord_id"];
  }
  console.log(TeamData);
};

const CheckTeamMember = (team1, team2) => {
  if (TeamData["team1"][0] == null) return false;
  let index = 0;
  for (let i = 0; i < TeamData.team1.length; i++) {
    for (let j = 0; i < team1.length; i++) {
      if (TeamData["team1"][i] == team1[j]["user"]["discord_id"]) {
        index++;
      }
    }
  }
  if (index > 4) {
    return true;
  }
  index = 0;
  for (let i = 0; i < TeamData.team2.length; i++) {
    for (let j = 0; i < team2.length; i++) {
      if (TeamData["team2"][i] == team2[j]["user"]["discord_id"]) {
        index++;
      }
    }
  }
  if (index > 4) {
    return true;
  }
  return false;
};

const ConvertTeam = (team1, team2) => {
  let smallestDifference = Infinity;
  let secondSmallestDifference = Infinity;
  let playersToSwitch = [];

  for (const player1 of team1) {
    for (const player2 of team2) {
      const difference = Math.abs(player1["user"].mmr - player2["user"].mmr);
      if (difference < smallestDifference) {
        secondSmallestDifference = smallestDifference;
        smallestDifference = difference;
        playersToSwitch = [{ team1: player1, team2: player2 }];
      } else if (
        difference === smallestDifference &&
        difference < secondSmallestDifference
      ) {
        secondSmallestDifference = difference;
        playersToSwitch.push({ team1: player1, team2: player2 });
      }
    }
  }

  for (const { team1: player1, team2: player2 } of playersToSwitch) {
    team1.splice(team1.indexOf(player1), 1);
    team2.splice(team2.indexOf(player2), 1);
    team1.push(player2);
    team2.push(player1);
  }

  return [team1, team2];
};

module.exports = {
  TeamData,
  TeamDataSaver,
  CheckTeamMember,
  ConvertTeam,
};
