const test = require("node:test");
const assert = require("node:assert/strict");

function withEnv(overrides, fn) {
  const original = {};

  for (const [key, value] of Object.entries(overrides)) {
    original[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function loadInformationCommand() {
  const commandPath = require.resolve("../commands/components/infomation");
  delete require.cache[commandPath];
  return require(commandPath);
}

test("information command exposes the expected slash command name", () => {
  const command = loadInformationCommand();
  const json = command.data.toJSON();

  assert.equal(json.name, "정보");
});

test("information command replies with deployment metadata when available", async () =>
  withEnv(
    {
      BOT_DEPLOY_COMMIT: "31b02cc",
      BOT_DEPLOY_MESSAGE: "원클릭 배포 도구 추가",
      BOT_DEPLOYED_AT: "2026-04-09T10:57:00.000Z",
    },
    async () => {
      const command = loadInformationCommand();
      const replies = [];

      await command.execute({
        async reply(payload) {
          replies.push(payload);
        },
      });

      assert.equal(replies.length, 1);
      assert.match(replies[0], /31b02cc/);
      assert.match(replies[0], /원클릭 배포 도구 추가/);
      assert.match(replies[0], /2026/);
    }
  ));
