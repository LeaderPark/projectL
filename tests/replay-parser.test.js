const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function buildReplayBuffer(metadata, gameVersion = "14.7.571.1234") {
  const header = Buffer.alloc(64);
  header.write(gameVersion.slice(0, 14), 15, "utf8");

  const metadataBytes = Buffer.from(JSON.stringify(metadata), "utf8");
  const metadataLength = Buffer.alloc(4);
  metadataLength.writeInt32LE(metadataBytes.length, 0);

  return Buffer.concat([header, metadataBytes, metadataLength]);
}

function buildStats(overrides = {}) {
  return {
    NAME: "Player#KR1",
    ID: "1",
    SKIN: "Ahri",
    LEVEL: "18",
    TEAM: "200",
    WIN: "Win",
    KEYSTONE_ID: "8112",
    STAT_PERK_SUB_STYLE: "8000",
    CHAMPIONS_KILLED: "7",
    NUM_DEATHS: "2",
    ASSISTS: "9",
    PLAYER_POSITION: "2",
    MINIONS_KILLED: "180",
    NEUTRAL_MINIONS_KILLED: "10",
    NEUTRAL_MINIONS_KILLED_YOUR_JUNGLE: "3",
    NEUTRAL_MINIONS_KILLED_ENEMY_JUNGLE: "2",
    ITEM0: "1056",
    ITEM1: "3020",
    ITEM2: "6655",
    ITEM3: "0",
    ITEM4: "0",
    ITEM5: "0",
    ITEM6: "3340",
    SUMMONER_SPELL_1: "4",
    SUMMONER_SPELL_2: "14",
    SUMMON_SPELL1_CAST: "2",
    SUMMON_SPELL2_CAST: "17",
    VISION_SCORE: "28",
    TOTAL_DAMAGE_DEALT_TO_CHAMPIONS: "23000",
    PUUID: "puuid-player",
    PENTA_KILLS: "0",
    QUADRA_KILLS: "0",
    ...overrides,
  };
}

test("parseROFLBuffer extracts replay metadata from the trailer", () => {
  const { parseROFLBuffer } = require("../scripts/Utils/roflxd");
  const replayBuffer = buildReplayBuffer({
    gameLength: 1800000,
    lastGameChunkId: 12,
    lastKeyFrameId: 4,
    statsJson: JSON.stringify([buildStats()]),
  });

  const metadata = parseROFLBuffer(replayBuffer);

  assert.equal(metadata.gameLength, 1800000);
  assert.equal(metadata.gameVersion, "14.7.571.1234");
  assert.equal(metadata.lastGameChunkId, 12);
  assert.equal(metadata.lastKeyframeId, 4);
  assert.equal(metadata.statsJson[0].NAME, "Player#KR1");
});

test("getMatchData downloads and converts a replay into the internal match model", async () => {
  const { getMatchData } = require("../scripts/Utils/Parser");
  const tempRoot = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "projectl-replay-test-")
  );
  const sourceFile = path.join(tempRoot, "source.rofl");
  const replayBuffer = buildReplayBuffer({
    gameLength: 1800000,
    statsJson: JSON.stringify([
      buildStats({
        NAME: "Blue#KR1",
        TEAM: "200",
        WIN: "Win",
        PUUID: "puuid-blue",
      }),
      buildStats({
        NAME: "Purple#KR1",
        ID: "2",
        TEAM: "100",
        WIN: "Fail",
        PLAYER_POSITION: "1",
        PUUID: "puuid-purple",
      }),
    ]),
  });

  await fs.promises.writeFile(sourceFile, replayBuffer);

  try {
    const match = await getMatchData(
      pathToFileURL(sourceFile).toString(),
      "KR_12345.rofl",
      { tempRoot }
    );

    assert.equal(match.gameLength, 1800000);
    assert.equal(match.blueTeam.side, 200);
    assert.equal(match.purpleTeam.side, 100);
    assert.equal(match.blueTeam.players[0].playerName, "Blue#KR1");
    assert.equal(match.blueTeam.players[0].lane, "MID");
    assert.equal(match.blueTeam.players[0].spell1, 4);
    assert.equal(match.blueTeam.players[0].spell2, 14);
    assert.equal(match.blueTeam.players[0].puuid, "puuid-blue");
    assert.equal(match.purpleTeam.players[0].playerName, "Purple#KR1");
    assert.equal(match.purpleTeam.players[0].lane, "TOP");
    assert.equal(typeof match.blueTeam.players[0].performanceScore, "number");

    const remainingEntries = await fs.promises.readdir(tempRoot);
    assert.deepEqual(remainingEntries, ["source.rofl"]);
  } finally {
    await fs.promises.rm(tempRoot, { recursive: true, force: true });
  }
});

test("buildMatchFromMetadata uses Riot ID fields when replay player names are blank", () => {
  const { buildMatchFromMetadata } = require("../scripts/Utils/Parser");

  const match = buildMatchFromMetadata({
    gameLength: 1800000,
    statsJson: [
      buildStats({
        NAME: "",
        RIOT_ID_GAME_NAME: "Blue",
        RIOT_ID_TAGLINE: "KR1",
        TEAM: "200",
        WIN: "Win",
      }),
      buildStats({
        NAME: "",
        RIOT_ID_GAME_NAME: "Purple",
        RIOT_ID_TAGLINE: "KR1",
        ID: "2",
        TEAM: "100",
        WIN: "Fail",
      }),
    ],
  });

  assert.equal(match.blueTeam.players[0].playerName, "Blue#KR1");
  assert.equal(match.purpleTeam.players[0].playerName, "Purple#KR1");
});

test("buildMatchFromMetadata keeps replay item slots fixed and maps ITEM6 as trinket", () => {
  const { buildMatchFromMetadata } = require("../scripts/Utils/Parser");

  const match = buildMatchFromMetadata({
    gameLength: 1800000,
    statsJson: [
      buildStats({
        ITEM0: "1056",
        ITEM1: "3020",
        ITEM2: "6655",
        ITEM3: "3071",
        ITEM4: "0",
        ITEM5: "0",
        ITEM6: "3340",
      }),
    ],
  });

  const inventory = match.blueTeam.players[0].inventory;

  assert.equal(inventory.item1, 1056);
  assert.equal(inventory.item2, 3020);
  assert.equal(inventory.item3, 6655);
  assert.equal(inventory.item4, 3071);
  assert.equal(inventory.item5, 0);
  assert.equal(inventory.item6, 0);
  assert.equal(inventory.trinket, 3340);
});
