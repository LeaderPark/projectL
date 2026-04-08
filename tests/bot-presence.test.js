const test = require("node:test");
const assert = require("node:assert/strict");
const { ActivityType } = require("discord.js");

const { buildBotPresenceActivity } = require("../scripts/Discord/BotPresence");

test("buildBotPresenceActivity returns the configured streaming presence", () => {
  assert.deepEqual(buildBotPresenceActivity(), {
    name: '시스템 가동 "준비완료"',
    type: ActivityType.Streaming,
    url: "https://www.youtube.com/watch?v=MviIDKKvex0",
  });
});
