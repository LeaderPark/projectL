const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("deploy launcher exists and waits for operator input", () => {
  const batchFile = fs.readFileSync("deploy.bat", "utf8");

  assert.match(batchFile, /powershell/i);
  assert.match(batchFile, /scripts\\deploy\.ps1/i);
  assert.doesNotMatch(batchFile, /docker compose down/i);
  assert.match(batchFile, /set\s+\/p/i);
});

test("deploy script rebuilds the current local checkout in place", () => {
  const script = fs.readFileSync("scripts/deploy.ps1", "utf8");

  assert.doesNotMatch(script, /git status --porcelain/);
  assert.doesNotMatch(script, /git pull --ff-only/);
  assert.match(script, /git rev-parse --short HEAD/);
  assert.match(script, /git log -1 --pretty=%s/);
  assert.match(script, /BOT_DEPLOY_COMMIT/);
  assert.match(script, /BOT_DEPLOY_MESSAGE/);
  assert.match(script, /BOT_DEPLOYED_AT/);
  assert.match(script, /docker compose up -d --build/);
  assert.doesNotMatch(script, /docker compose down/);
  assert.match(script, /docker compose ps/);
  assert.match(script, /sync-commands\.ps1/);
});

test("bootstrap script and deploy flow both refresh slash commands after services start", () => {
  const bootstrapScript = fs.readFileSync("scripts/bootstrap.ps1", "utf8");
  const deployScript = fs.readFileSync("scripts/deploy.ps1", "utf8");

  assert.equal(fs.existsSync("scripts/sync-commands.ps1"), true);
  assert.match(bootstrapScript, /sync-commands\.ps1/);
  assert.match(deployScript, /sync-commands\.ps1/);
});

test("README documents the one-click deploy entrypoint", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /deploy\.bat/);
  assert.match(readme, /current local checkout|currently checked out locally|current workspace/i);
  assert.doesNotMatch(readme, /git pull/i);
  assert.match(readme, /docker compose/i);
  assert.match(readme, /without taking the full stack down|without stopping the current stack first/i);
});
