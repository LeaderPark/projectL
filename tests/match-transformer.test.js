const test = require("node:test");
const assert = require("node:assert/strict");

const { transformMatchPayload } = require("../scripts/Riot/MatchTransformer");

test("transformMatchPayload maps Riot participants into the internal match model", () => {
  const match = transformMatchPayload({
    metadata: {
      matchId: "KR_12345",
    },
    info: {
      gameDuration: 1800,
      participants: [
        {
          riotIdGameName: "BlueTop",
          riotIdTagline: "KR1",
          participantId: 1,
          championName: "Garen",
          champLevel: 18,
          teamId: 200,
          win: true,
          perks: {
            styles: [
              {
                selections: [{ perk: 8010 }],
              },
            ],
          },
          kills: 10,
          deaths: 2,
          assists: 5,
          individualPosition: "TOP",
          totalMinionsKilled: 210,
          neutralMinionsKilled: 12,
          item0: 1001,
          item1: 2003,
          item2: 3006,
          item3: 3071,
          item4: 3053,
          item5: 3065,
          item6: 3364,
          summoner1Id: 4,
          summoner2Id: 12,
          visionScore: 24,
          totalDamageDealtToChampions: 28000,
          puuid: "puuid-blue-top",
          pentaKills: 0,
          quadraKills: 1,
        },
        {
          riotIdGameName: "PurpleSupport",
          riotIdTagline: "KR1",
          participantId: 2,
          championName: "Leona",
          champLevel: 15,
          teamId: 100,
          win: false,
          perks: {
            styles: [
              {
                selections: [{ perk: 8439 }],
              },
            ],
          },
          kills: 1,
          deaths: 7,
          assists: 14,
          individualPosition: "UTILITY",
          totalMinionsKilled: 32,
          neutralMinionsKilled: 0,
          item0: 3860,
          item1: 3117,
          item2: 3190,
          item3: 3109,
          item4: 3050,
          item5: 3082,
          item6: 3364,
          summoner1Id: 4,
          summoner2Id: 14,
          visionScore: 62,
          totalDamageDealtToChampions: 9500,
          puuid: "puuid-purple-support",
          pentaKills: 0,
          quadraKills: 0,
        },
      ],
    },
  });

  assert.equal(match.gameLength, 1800000);
  assert.equal(match.matchId, "KR_12345");
  assert.equal(match.blueTeam.side, 200);
  assert.equal(match.purpleTeam.side, 100);
  assert.equal(match.blueTeam.players.length, 1);
  assert.equal(match.purpleTeam.players.length, 1);
  assert.equal(match.blueTeam.players[0].playerName, "BlueTop#KR1");
  assert.equal(match.blueTeam.players[0].lane, "TOP");
  assert.equal(match.blueTeam.players[0].result, 1);
  assert.equal(match.blueTeam.players[0].inventory.item1, 1001);
  assert.equal(match.blueTeam.players[0].inventory.item4, 3071);
  assert.equal(match.blueTeam.players[0].inventory.trinket, 3364);
  assert.equal(match.purpleTeam.players[0].playerName, "PurpleSupport#KR1");
  assert.equal(match.purpleTeam.players[0].lane, "SUPPORT");
  assert.equal(match.purpleTeam.players[0].result, 0);
  assert.equal(match.blueTeam.totalKill, 10);
  assert.equal(match.purpleTeam.totalKill, 1);
  assert.equal(typeof match.blueTeam.players[0].mmr, "number");
  assert.equal(typeof match.purpleTeam.players[0].mmr, "number");
});
