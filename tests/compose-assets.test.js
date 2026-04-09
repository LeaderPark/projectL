const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("compose file defines bot and db services", () => {
  const compose = fs.readFileSync("compose.yaml", "utf8");

  assert.match(compose, /^services:\s*$/m);
  assert.match(compose, /^\s{2}db:\s*$/m);
  assert.match(compose, /^\s{2}bot:\s*$/m);
  assert.match(compose, /restart:\s+unless-stopped/);
  assert.match(compose, /\/docker-entrypoint-initdb\.d\/01-bot\.sql/);
  assert.match(compose, /\/docker-entrypoint-initdb\.d\/02-guild-privileges\.sh/);
  assert.match(compose, /BOT_DEPLOY_COMMIT:\s*"?\$\{BOT_DEPLOY_COMMIT/);
  assert.match(compose, /BOT_DEPLOY_MESSAGE:\s*"?\$\{BOT_DEPLOY_MESSAGE/);
  assert.match(compose, /BOT_DEPLOYED_AT:\s*"?\$\{BOT_DEPLOYED_AT/);
});

test("bootstrap and verify scripts exist", () => {
  assert.equal(fs.existsSync("scripts/bootstrap.ps1"), true);
  assert.equal(fs.existsSync("scripts/verify.ps1"), true);
  assert.equal(fs.existsSync("scripts/db-init/02-guild-privileges.sh"), true);
  assert.equal(fs.existsSync(".env.example"), true);
  assert.equal(fs.existsSync("Dockerfile"), true);
});
