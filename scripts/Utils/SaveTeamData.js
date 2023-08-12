let TeamData = {
  team1: [],
  team2: []
};

const TeamDataSaver = (team1, team2) => {
  TeamData["team1"] = team1
  TeamData["team2"] = team2
};

const CheckTeamMember = (team1, team2) => {
  if (!TeamData["team1"][0] || !TeamData["team2"][0]) {
    console.log("기존팀이 없습니다.")
    return false;
  }
  let index = 0;
  const TeamData1 = TeamData["team1"];
  const TeamData2 = TeamData["team2"];
  for (let i = 0; i < TeamData1.length; i++) {
    for (let j = 0; i < team1.length; i++) {
      if (TeamData1[i]["user"]["discord_id"] == team1[j]["user"]["discord_id"]) {
        index++;
      }
    }
  }
  console.log("1팀 중복", index);
  if (index > 3) {
    return true;
  }
  index = 0;
  for (let i = 0; i < TeamData2.length; i++) {
    for (let j = 0; i < team2.length; i++) {
      if (TeamData2[i]["user"]["discord_id"] == team2[j]["user"]["discord_id"]) {
        index++;
      }
    }
  }
  console.log("2팀 중복", index);
  if (index > 3) {
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
      console.log(player1["user"], player2["user"], difference);
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
