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

test("compose file publishes the bot web port to a configurable host port", () => {
  const compose = fs.readFileSync("compose.yaml", "utf8");

  assert.match(compose, /^\s{4}ports:\s*$/m);
  assert.match(compose, /\$\{WEB_PUBLIC_PORT:-8000\}:8000/);
  assert.match(compose, /WEB_PORT:\s+\$\{WEB_PORT:-8000\}/);
  assert.match(compose, /RIOT_TOURNAMENT_CALLBACK_URL:\s+\$\{RIOT_TOURNAMENT_CALLBACK_URL\}/);
});

test("compose file defines an optional cloudflared tunnel service", () => {
  const compose = fs.readFileSync("compose.yaml", "utf8");

  assert.match(compose, /^\s{2}cloudflared:\s*$/m);
  assert.match(compose, /profiles:\s*\["cloudflare"\]/);
  assert.match(compose, /command:\s+tunnel --no-autoupdate run --token \$\{CF_TUNNEL_TOKEN\}/);
  assert.match(compose, /bot:\s*\n\s*condition:\s*service_healthy/);
});

test("compose file waits for the bot web port to be healthy before serving the tunnel", () => {
  const compose = fs.readFileSync("compose.yaml", "utf8");

  assert.match(compose, /^\s{4}healthcheck:\s*$/m);
  assert.match(compose, /wget --spider -q http:\/\/127\.0\.0\.1:8000\//);
  assert.match(compose, /interval:\s+5s/);
  assert.match(compose, /timeout:\s+5s/);
  assert.match(compose, /start_period:\s+15s/);
  assert.match(compose, /retries:\s+12/);
});

test("bootstrap and verify scripts exist", () => {
  assert.equal(fs.existsSync("scripts/bootstrap.ps1"), true);
  assert.equal(fs.existsSync("scripts/verify.ps1"), true);
  assert.equal(fs.existsSync("scripts/start-cloudflare-tunnel.ps1"), true);
  assert.equal(fs.existsSync("scripts/db-init/02-guild-privileges.sh"), true);
  assert.equal(fs.existsSync(".env.example"), true);
  assert.equal(fs.existsSync("Dockerfile"), true);
  assert.equal(fs.existsSync("ops/cloudflare-tunnel.md"), true);
});

test(".env.example documents the web port and cloudflare settings", () => {
  const envExample = fs.readFileSync(".env.example", "utf8");

  assert.match(envExample, /^WEB_PORT=8000$/m);
  assert.match(envExample, /^WEB_PUBLIC_PORT=8000$/m);
  assert.match(envExample, /^CLOUDFLARED_IMAGE=cloudflare\/cloudflared:latest$/m);
  assert.match(envExample, /^CF_TUNNEL_TOKEN=__CHANGE_ME__$/m);
  assert.match(envExample, /^CF_PUBLIC_HOSTNAME=lol\.leaderpark\.net$/m);
});

test("README documents the public and local site URLs", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /http:\/\/localhost:8000\//);
  assert.match(readme, /https:\/\/lol\.leaderpark\.net\/?/);
  assert.match(readme, /http:\/\/bot:8000/);
});
