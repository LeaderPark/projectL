const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

test("legacy placeholder utility commands are removed", () => {
  assert.equal(
    fs.existsSync(path.join("commands", "utility", "autoCommonGameLine.js")),
    false
  );
  assert.equal(
    fs.existsSync(path.join("commands", "utility", "ping.js")),
    false
  );
  assert.equal(
    fs.existsSync(path.join("commands", "utility", "user.js")),
    false
  );
});

test("manual replay upload command is removed", () => {
  assert.equal(
    fs.existsSync(path.join("commands", "riot", "upload.js")),
    false
  );
});

test("guild command deployment also clears legacy global commands", async (t) => {
  const deployScriptPath = require.resolve("../deploy-commands.js");
  const originalLoad = Module._load;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const projectRoot = path.dirname(deployScriptPath);
  const commandsRoot = path.join(projectRoot, "commands");
  const calls = [];

  delete require.cache[deployScriptPath];

  console.log = () => {};
  console.error = () => {};

  Module._load = function mockedLoad(request, parent, isMain) {
    if (request === "discord.js") {
      return {
        REST: class REST {
          setToken() {
            return this;
          }

          put(route, { body }) {
            calls.push({ route, body });
            return Promise.resolve(body);
          }
        },
        Routes: {
          applicationGuildCommands: (clientId, guildId) =>
            `guild:${clientId}:${guildId}`,
          applicationCommands: (clientId) => `global:${clientId}`,
        },
      };
    }

    if (request === "node:fs") {
      return {
        readdirSync(targetPath) {
          if (targetPath === commandsRoot) {
            return ["utility"];
          }

          if (targetPath === path.join(commandsRoot, "utility")) {
            return ["server.js"];
          }

          throw new Error(`Unexpected readdirSync path: ${targetPath}`);
        },
      };
    }

    if (
      request === "./config/runtime" &&
      parent &&
      parent.filename === deployScriptPath
    ) {
      return {
        getRuntimeConfig: () => ({
          discord: {
            token: "token",
            clientId: "client-id",
            guildId: "guild-id",
          },
        }),
      };
    }

    if (request === path.join(commandsRoot, "utility", "server.js")) {
      return {
        data: {
          toJSON: () => ({ name: "server" }),
        },
        execute() {},
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  t.after(() => {
    Module._load = originalLoad;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    delete require.cache[deployScriptPath];
  });

  require(deployScriptPath);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(calls, [
    {
      route: "guild:client-id:guild-id",
      body: [{ name: "server" }],
    },
    {
      route: "global:client-id",
      body: [],
    },
  ]);
});
