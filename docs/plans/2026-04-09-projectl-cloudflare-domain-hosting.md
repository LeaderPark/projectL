# ProjectL Cloudflare Domain Hosting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize `projectL` web hosting on port `8000` and publish the public site at `https://lol.leaderpark.net` through an optional Cloudflare Tunnel service.

**Architecture:** Keep the existing single Node HTTP server for both the public site and Riot callback endpoint, but change its default internal port to `8000`. Extend Docker Compose with a `cloudflared` profile that can publish the `bot` container through Cloudflare Tunnel, and document the operator flow so local and public access stay aligned.

**Tech Stack:** Node.js, Docker Compose, PowerShell, Cloudflare Tunnel, Node test runner

---

### Task 1: Change the default internal web port to 8000

**Files:**
- Modify: `config/runtime.js`
- Modify: `tests/runtime-config.test.js`

**Step 1: Write the failing test**

```js
test("falls back to 8000 as the default web port", () => {
  const runtime = loadRuntimeConfig({
    baseDir: tempRoot,
    configPath,
    secretPath,
  });

  assert.equal(runtime.web.port, 8000);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/runtime-config.test.js`
Expected: FAIL because the current default port is still `3000`.

**Step 3: Write minimal implementation**

```js
web: {
  port: Number(
    firstNonEmpty(
      process.env.WEB_PORT,
      legacyConfig.webPort,
      8000
    )
  ),
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/runtime-config.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add config/runtime.js tests/runtime-config.test.js
git commit -m "refactor: default web port to 8000"
```

### Task 2: Update Docker and environment assets for Cloudflare hosting

**Files:**
- Modify: `compose.yaml`
- Modify: `.env.example`
- Modify: `tests/compose-assets.test.js`
- Create: `scripts/start-cloudflare-tunnel.ps1`

**Step 1: Write the failing test**

```js
test("compose file exposes the bot on port 8000 and defines a cloudflared profile", () => {
  const compose = fs.readFileSync("compose.yaml", "utf8");

  assert.match(compose, /\$\{WEB_PUBLIC_PORT:-8000\}:8000/);
  assert.match(compose, /^\s{2}cloudflared:\s*$/m);
  assert.match(compose, /profiles:\s*\["cloudflare"\]/);
  assert.match(compose, /tunnel --no-autoupdate run --token \$\{CF_TUNNEL_TOKEN\}/);
});

test(".env.example documents Cloudflare tunnel settings", () => {
  const envExample = fs.readFileSync(".env.example", "utf8");

  assert.match(envExample, /^WEB_PORT=8000$/m);
  assert.match(envExample, /^CF_TUNNEL_TOKEN=__CHANGE_ME__$/m);
  assert.match(envExample, /^CF_PUBLIC_HOSTNAME=lol\.leaderpark\.net$/m);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/compose-assets.test.js`
Expected: FAIL because compose and env assets do not define the Cloudflare tunnel yet.

**Step 3: Write minimal implementation**

```yaml
bot:
  ports:
    - "${WEB_PUBLIC_PORT:-8000}:8000"

cloudflared:
  profiles: ["cloudflare"]
  image: ${CLOUDFLARED_IMAGE}
  command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
```

```powershell
if ([string]::IsNullOrWhiteSpace($envMap["CF_TUNNEL_TOKEN"])) {
  throw "CF_TUNNEL_TOKEN is empty."
}

docker compose --profile cloudflare up -d cloudflared
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/compose-assets.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add compose.yaml .env.example scripts/start-cloudflare-tunnel.ps1 tests/compose-assets.test.js
git commit -m "feat: add cloudflare tunnel hosting assets"
```

### Task 3: Document the operator flow for lol.leaderpark.net

**Files:**
- Modify: `README.md`
- Create: `ops/cloudflare-tunnel.md`
- Modify: `tests/compose-assets.test.js`

**Step 1: Write the failing test**

```js
test("README documents the Cloudflare hostname", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /https:\/\/lol\.leaderpark\.net/);
  assert.match(readme, /http:\/\/bot:8000/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/compose-assets.test.js`
Expected: FAIL because the README does not yet document the domain-hosting flow.

**Step 3: Write minimal implementation**

```md
- Public site local URL: `http://localhost:8000/`
- Public site domain: `https://lol.leaderpark.net/`
- Cloudflare Tunnel public hostname: `lol.leaderpark.net`
- Cloudflare Tunnel service target: `http://bot:8000`
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/compose-assets.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md ops/cloudflare-tunnel.md tests/compose-assets.test.js
git commit -m "docs: add cloudflare tunnel operator guide"
```

### Task 4: Verify the full hosting configuration

**Files:**
- Modify: `.env`
- Verify: `compose.yaml`
- Verify: `scripts/verify.ps1`

**Step 1: Fill the local runtime values**

```dotenv
WEB_PORT=8000
WEB_PUBLIC_PORT=8000
CF_PUBLIC_HOSTNAME=lol.leaderpark.net
CF_TUNNEL_TOKEN=<real token>
```

**Step 2: Run targeted tests**

Run: `node --test tests/runtime-config.test.js tests/compose-assets.test.js`
Expected: PASS

**Step 3: Validate compose configuration**

Run: `docker compose --env-file .env config`
Expected: PASS with resolved `bot` and `cloudflared` services.

**Step 4: Start the local stack**

Run: `docker compose up -d --build`
Expected: PASS and `bot`, `db`, `adminer` become healthy or running.

**Step 5: Start the Cloudflare tunnel profile**

Run: `powershell -ExecutionPolicy Bypass -File .\scripts\start-cloudflare-tunnel.ps1`
Expected: PASS and `cloudflared` starts with the configured token.

**Step 6: Verify local and public endpoints**

Run: `Invoke-WebRequest http://localhost:8000/`
Expected: HTTP 200

Manual: open `https://lol.leaderpark.net/`
Expected: the public site loads through Cloudflare Tunnel.

**Step 7: Commit**

```bash
git add .env compose.yaml README.md scripts/start-cloudflare-tunnel.ps1
git commit -m "chore: verify cloudflare domain hosting flow"
```
