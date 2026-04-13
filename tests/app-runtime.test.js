const test = require("node:test");
const assert = require("node:assert/strict");
const { Events } = require("discord.js");

const { startAppRuntime } = require("../scripts/AppRuntime");

test("startAppRuntime listens for HTTP traffic before Discord ready work", async () => {
  const calls = [];
  const readyHandlers = new Map();
  const callbackServer = {
    listen(port, onListen) {
      calls.push(`listen:${port}`);
      if (typeof onListen === "function") {
        onListen();
      }
    },
  };
  const poller = {
    start() {
      calls.push("poller:start");
    },
    async tick() {
      calls.push("poller:tick");
    },
  };
  const client = {
    callbackServer: null,
    tournamentSessionPoller: null,
    user: {
      setActivity(activity) {
        calls.push(`activity:${activity}`);
      },
    },
    once(eventName, handler) {
      readyHandlers.set(eventName, handler);
      calls.push(`once:${eventName}`);
    },
    login(token) {
      calls.push(`login:${token}`);
      return Promise.resolve("logged-in");
    },
  };

  await startAppRuntime({
    client,
    callbackServer,
    poller,
    runtimeConfig: {
      discord: {
        token: "discord-token",
      },
      web: {
        port: 8000,
        riotTournamentCallbackPath: "/riot/callback",
      },
    },
    buildBotPresenceActivity() {
      return "분류모자 가동 중";
    },
    logger: {
      log() {},
      error() {},
    },
  });

  assert.equal(client.callbackServer, callbackServer);
  assert.equal(client.tournamentSessionPoller, poller);
  assert.equal(typeof readyHandlers.get(Events.ClientReady), "function");
  assert.ok(calls.indexOf(`once:${Events.ClientReady}`) !== -1);
  assert.ok(calls.indexOf("listen:8000") !== -1);
  assert.ok(calls.indexOf("login:discord-token") !== -1);
  assert.ok(calls.indexOf("listen:8000") < calls.indexOf("login:discord-token"));
  assert.equal(calls.includes("poller:start"), false);
  assert.equal(calls.includes("poller:tick"), false);

  await readyHandlers.get(Events.ClientReady)({ user: { tag: "bot#7703" } });

  assert.ok(calls.includes("activity:분류모자 가동 중"));
  assert.ok(calls.includes("poller:start"));
  assert.ok(calls.includes("poller:tick"));
});
