const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

function loadUploadCommand({ parser = {}, query = {} } = {}) {
  const commandPath = require.resolve("../commands/riot/upload");
  const originalLoad = Module._load;

  delete require.cache[commandPath];

  Module._load = function mockedLoad(request, parent, isMain) {
    if (
      request === "../../scripts/Utils/Parser" &&
      parent &&
      parent.filename === commandPath
    ) {
      return {
        getMatchData: async () => "parser mock missing",
        ...parser,
      };
    }

    if (
      request === "../../scripts/Utils/Query" &&
      parent &&
      parent.filename === commandPath
    ) {
      return {
        persistMatchResult: async () => ({ success: true, user: [] }),
        ...query,
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(commandPath);
  } finally {
    Module._load = originalLoad;
  }
}

function createInteraction(attachment) {
  const replies = [];

  return {
    guildId: "guild-1",
    replies,
    options: {
      getAttachment(name) {
        assert.equal(name, "replay");
        return attachment;
      },
    },
    async reply(message) {
      replies.push({ method: "reply", message });
    },
    async deferReply(message) {
      replies.push({ method: "deferReply", message });
    },
    async editReply(message) {
      replies.push({ method: "editReply", message });
    },
  };
}

test("upload command exposes a required replay attachment option", () => {
  const command = loadUploadCommand();
  const json = command.data.toJSON();

  assert.equal(json.name, "업로드");
  assert.deepEqual(
    json.options.map((option) => ({
      name: option.name,
      required: option.required,
    })),
    [{ name: "replay", required: true }]
  );
});

test("upload command rejects non-rofl attachments before parsing", async () => {
  const command = loadUploadCommand();
  const interaction = createInteraction({
    name: "match.txt",
    url: "https://cdn.example/match.txt",
  });

  await command.execute(interaction);

  assert.deepEqual(interaction.replies, [
    { method: "reply", message: "match.txt is not .rofl file" },
  ]);
});

test("upload command reports parser errors without persisting", async () => {
  let persistCalls = 0;
  const command = loadUploadCommand({
    parser: {
      async getMatchData(url, name) {
        assert.equal(url, "https://cdn.example/KR_12345.rofl");
        assert.equal(name, "KR_12345.rofl");
        return "리플레이 파싱 실패";
      },
    },
    query: {
      async persistMatchResult() {
        persistCalls += 1;
        return { success: true, user: [] };
      },
    },
  });
  const interaction = createInteraction({
    name: "KR_12345.rofl",
    url: "https://cdn.example/KR_12345.rofl",
  });

  await command.execute(interaction);

  assert.equal(persistCalls, 0);
  assert.deepEqual(interaction.replies, [
    { method: "deferReply", message: "uploading..." },
    { method: "editReply", message: "리플레이 파싱 실패" },
  ]);
});

test("upload command persists parsed replays through the common match helper", async () => {
  const replay = { gameLength: 1800000, blueTeam: { players: [] }, purpleTeam: { players: [] } };
  const persistCalls = [];
  const command = loadUploadCommand({
    parser: {
      async getMatchData() {
        return replay;
      },
    },
    query: {
      async persistMatchResult(...args) {
        persistCalls.push(args);
        return { success: true, user: [] };
      },
    },
  });
  const interaction = createInteraction({
    name: "KR_12345.rofl",
    url: "https://cdn.example/KR_12345.rofl",
  });

  await command.execute(interaction);

  assert.deepEqual(persistCalls, [["guild-1", replay, "KR_12345"]]);
  assert.deepEqual(interaction.replies, [
    { method: "deferReply", message: "uploading..." },
    { method: "editReply", message: "업로드가 완료되었습니다." },
  ]);
});

test("upload command reports unregistered replay participants", async () => {
  const command = loadUploadCommand({
    parser: {
      async getMatchData() {
        return { gameLength: 1800000, blueTeam: { players: [] }, purpleTeam: { players: [] } };
      },
    },
    query: {
      async persistMatchResult() {
        return { success: true, user: ["Alpha#KR1", "Bravo#KR1"] };
      },
    },
  });
  const interaction = createInteraction({
    name: "KR_12345.rofl",
    url: "https://cdn.example/KR_12345.rofl",
  });

  await command.execute(interaction);

  assert.equal(
    interaction.replies.at(-1).message,
    "업로드가 완료되었습니다. 등록 되지 않은 소환사 : Alpha#KR1, Bravo#KR1"
  );
});

test("upload command omits unregistered participant text when no names are present", async () => {
  const command = loadUploadCommand({
    parser: {
      async getMatchData() {
        return { gameLength: 1800000, blueTeam: { players: [] }, purpleTeam: { players: [] } };
      },
    },
    query: {
      async persistMatchResult() {
        return { success: true, user: ["", "   "] };
      },
    },
  });
  const interaction = createInteraction({
    name: "KR_12345.rofl",
    url: "https://cdn.example/KR_12345.rofl",
  });

  await command.execute(interaction);

  assert.equal(interaction.replies.at(-1).message, "업로드가 완료되었습니다.");
});

test("upload command reports persistence failures", async () => {
  const command = loadUploadCommand({
    parser: {
      async getMatchData() {
        return { gameLength: 1800000, blueTeam: { players: [] }, purpleTeam: { players: [] } };
      },
    },
    query: {
      async persistMatchResult() {
        return { success: false, msg: "저장 실패" };
      },
    },
  });
  const interaction = createInteraction({
    name: "KR_12345.rofl",
    url: "https://cdn.example/KR_12345.rofl",
  });

  await command.execute(interaction);

  assert.equal(interaction.replies.at(-1).message, "저장 실패");
});
