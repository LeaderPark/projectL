# ProjectL Docker MariaDB Hosting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Autoset-managed local database setup with a Docker Compose based MariaDB + Discord bot stack that can start reliably from project files alone.

**Architecture:** The bot keeps its existing MySQL-compatible query layer and connects to a MariaDB container through environment-based config. Compose owns service startup and restart policy, while PowerShell helper scripts handle local bootstrap and verification.

**Tech Stack:** Node.js, discord.js, mysql2, MariaDB, Docker Compose, PowerShell, node:test

---

### Task 1: Runtime config normalization

**Files:**
- Create: `config/runtime.js`
- Modify: `index.js`
- Modify: `deploy-commands.js`
- Modify: `scripts/Riot/DataReceiver.js`
- Modify: `scripts/Utils/DB.js`
- Modify: `scripts/Utils/Query.js`
- Test: `tests/runtime-config.test.js`

**Step 1: Write the failing test**

```js
test("loads bot and db config from environment variables", async () => {
  process.env.DISCORD_TOKEN = "discord-token";
  process.env.DISCORD_CLIENT_ID = "client-id";
  process.env.DISCORD_GUILD_ID = "guild-id";
  process.env.RIOT_API_TOKEN = "riot-token";
  process.env.DB_HOST = "db";
  process.env.DB_USER = "bot";
  process.env.DB_PASSWORD = "secret";
  process.env.DB_NAME = "bot";

  const runtime = loadRuntimeConfig();

  assert.equal(runtime.discord.token, "discord-token");
  assert.equal(runtime.database.host, "db");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/runtime-config.test.js`
Expected: FAIL because `loadRuntimeConfig` does not exist yet.

**Step 3: Write minimal implementation**

```js
function loadRuntimeConfig() {
  return {
    discord: {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      guildId: process.env.DISCORD_GUILD_ID,
    },
    riot: {
      token: process.env.RIOT_API_TOKEN,
    },
    database: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: process.env.DB_TIMEZONE ?? "Z",
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/runtime-config.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/runtime-config.test.js config/runtime.js index.js deploy-commands.js scripts/Riot/DataReceiver.js scripts/Utils/DB.js scripts/Utils/Query.js
git commit -m "feat: add environment-based runtime config"
```

### Task 2: Containerized hosting assets

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `compose.yaml`
- Create: `.env.example`
- Create: `scripts/bootstrap.ps1`
- Create: `scripts/verify.ps1`

**Step 1: Write the failing test**

```js
test("compose file exists and references bot and db services", () => {
  const compose = readFileSync("compose.yaml", "utf8");
  assert.match(compose, /bot:/);
  assert.match(compose, /db:/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/compose-assets.test.js`
Expected: FAIL because the compose assets do not exist yet.

**Step 3: Write minimal implementation**

```yaml
services:
  db:
    image: mariadb:11.4
    restart: unless-stopped
  bot:
    build: .
    restart: unless-stopped
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/compose-assets.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add Dockerfile .dockerignore compose.yaml .env.example scripts/bootstrap.ps1 scripts/verify.ps1 tests/compose-assets.test.js
git commit -m "feat: add docker hosting stack"
```

### Task 3: Operator documentation

**Files:**
- Create: `README.md`
- Modify: `package.json`

**Step 1: Write the failing test**

```js
test("package.json includes a verification script", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["test:runtime"], "node --test tests/*.test.js");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/package-scripts.test.js`
Expected: FAIL because the script is missing.

**Step 3: Write minimal implementation**

```json
{
  "scripts": {
    "test:runtime": "node --test tests/*.test.js"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/package-scripts.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md package.json tests/package-scripts.test.js
git commit -m "docs: document docker hosting workflow"
```
