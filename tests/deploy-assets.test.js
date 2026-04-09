const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("deploy launcher exists and waits for operator input", () => {
  const batchFile = fs.readFileSync("deploy.bat", "utf8");

  assert.match(batchFile, /powershell/i);
  assert.match(batchFile, /scripts\\deploy\.ps1/i);
  assert.match(batchFile, /set\s+\/p/i);
});

test("deploy script uses git pull and compose restart flow", () => {
  const script = fs.readFileSync("scripts/deploy.ps1", "utf8");

  assert.match(script, /git status --porcelain/);
  assert.match(script, /git pull --ff-only/);
  assert.match(script, /git rev-parse --short HEAD/);
  assert.match(script, /git log -1 --pretty=%s/);
  assert.match(script, /BOT_DEPLOY_COMMIT/);
  assert.match(script, /BOT_DEPLOY_MESSAGE/);
  assert.match(script, /BOT_DEPLOYED_AT/);
  assert.match(script, /docker compose down/);
  assert.match(script, /docker compose up -d --build/);
  assert.match(script, /docker compose ps/);
});

test("README documents the one-click deploy entrypoint", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /deploy\.bat/);
  assert.match(readme, /git pull/i);
  assert.match(readme, /docker compose/i);
});
