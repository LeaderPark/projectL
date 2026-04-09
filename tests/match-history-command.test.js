const test = require("node:test");
const assert = require("node:assert/strict");

function loadMatchHistoryCommand(overrides = {}) {
  const commandPath = require.resolve("../commands/components/matchHistory");
  const queryPath = require.resolve("../scripts/Utils/Query");
  const originalQueryModule = require.cache[queryPath];

  delete require.cache[commandPath];
  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: {
      getLatestMatched: async () => ({ success: true, data: [] }),
      ...overrides.query,
    },
  };

  const command = require(commandPath);

  if (originalQueryModule) {
    require.cache[queryPath] = originalQueryModule;
  } else {
    delete require.cache[queryPath];
  }

  return command;
}

test("match history command uses performance score and supports legacy mmr fallback", async () => {
  const command = loadMatchHistoryCommand({
    query: {
      async getLatestMatched() {
        return {
          success: true,
          data: [
            {
              id: 3,
              game_length: String(25 * 60 * 1000),
              purple_team: JSON.stringify({
                result: 0,
                players: [
                  {
                    playerName: "PurpleCarry",
                    championName: "Ahri",
                    level: 16,
                    minionScore: 210,
                    lane: "MID",
                    kda: { kills: 10, deaths: 4, assist: 3 },
                    mmr: 25,
                  },
                ],
              }),
              blue_team: JSON.stringify({
                result: 1,
                players: [
                  {
                    playerName: "BlueCarry",
                    championName: "Jinx",
                    level: 17,
                    minionScore: 240,
                    lane: "BOT",
                    kda: { kills: 11, deaths: 2, assist: 8 },
                    performanceScore: 31,
                  },
                ],
              }),
            },
          ],
        };
      },
    },
  });

  const replies = [];

  await command.execute({
    user: { id: "requester-1" },
    guildId: "guild-1",
    guild: {
      members: {
        async fetch(id) {
          assert.equal(id, "requester-1");
          return { user: { id }, bot: false };
        },
      },
    },
    options: {
      getUser(name) {
        assert.equal(name, "검색할소환사");
        return null;
      },
    },
    async deferReply(payload) {
      replies.push(payload);
    },
    async editReply(payload) {
      replies.push(payload);
    },
  });

  const finalReply = replies.at(-1);
  const embed = finalReply.embeds[0].toJSON();
  const fieldNames = embed.fields.map((field) => field.name);
  const fieldValues = embed.fields.map((field) => field.value).join("\n");

  assert.match(fieldNames.join("\n"), /BlueCarry.*\( MVP \)/);
  assert.match(fieldNames.join("\n"), /PurpleCarry.*\( ACE \)/);
  assert.match(fieldValues, /퍼포먼스 점수\*\* : 31/);
  assert.match(fieldValues, /퍼포먼스 점수\*\* : 25/);
});
