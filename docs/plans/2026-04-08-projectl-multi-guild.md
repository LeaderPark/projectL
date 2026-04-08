# ProjectL Multi-Guild Data Isolation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow one bot deployment to serve multiple Discord guilds while isolating ranking and match data into a separate MySQL database for each guild.

**Architecture:** A control database stores guild configuration metadata, and a derived database is created per guild for gameplay tables. Slash commands are deployed globally by default, while runtime commands resolve the correct guild database from `interaction.guildId`.

**Tech Stack:** Node.js, discord.js, mysql2, node:test, MySQL/MariaDB

---

### Task 1: Add guild-database schema helpers and tests

**Files:**
- Create: `scripts/Utils/GuildDatabase.js`
- Test: `tests/guild-database.test.js`

**Step 1: Write the failing test**

```js
test("buildGuildDatabaseName derives a stable guild database name", () => {
  assert.equal(buildGuildDatabaseName("bot", "123456789"), "bot_guild_123456789");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/guild-database.test.js`
Expected: FAIL because `GuildDatabase.js` does not exist yet.

**Step 3: Write minimal implementation**

```js
function buildGuildDatabaseName(baseName, guildId) {
  return `${baseName}_guild_${guildId}`;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/guild-database.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/guild-database.test.js scripts/Utils/GuildDatabase.js
git commit -m "test: add guild database schema helpers"
```

### Task 2: Refactor DB utilities for control DB + per-guild DB resolution

**Files:**
- Modify: `scripts/Utils/DB.js`
- Modify: `scripts/Utils/Query.js`
- Modify: `bot.sql`

**Step 1: Write the failing test**

```js
test("buildGuildSchemaStatements includes gameplay tables", () => {
  const sql = buildGuildSchemaStatements().join("\n");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `user`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `matches`/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/guild-database.test.js`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

```js
function buildGuildSchemaStatements() {
  return [
    "CREATE TABLE IF NOT EXISTS `user` (...)",
    "CREATE TABLE IF NOT EXISTS `matches` (...)",
    "CREATE TABLE IF NOT EXISTS `match_in_users` (...)",
  ];
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/guild-database.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/DB.js scripts/Utils/Query.js bot.sql tests/guild-database.test.js
git commit -m "feat: add per-guild database routing"
```

### Task 3: Replace placeholder server command with admin setup command

**Files:**
- Modify: `commands/utility/server.js`
- Modify: `index.js`

**Step 1: Write the failing test**

```js
test("server command exposes setup subcommands", () => {
  const command = require("../commands/utility/server");
  const json = command.data.toJSON();
  assert.equal(json.name, "서버설정");
  assert.equal(json.options.length, 2);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/server-command.test.js`
Expected: FAIL because the placeholder command does not define guild setup behavior.

**Step 3: Write minimal implementation**

```js
data: new SlashCommandBuilder()
  .setName("서버설정")
  .addSubcommand((subcommand) => subcommand.setName("보기"))
  .addSubcommand((subcommand) => subcommand.setName("초기화"))
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/server-command.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add commands/utility/server.js index.js tests/server-command.test.js
git commit -m "feat: add guild setup command"
```

### Task 4: Thread guild id through ranking and registration commands

**Files:**
- Modify: `commands/components/rankBoard.js`
- Modify: `commands/components/search.js`
- Modify: `commands/components/matchHistory.js`
- Modify: `commands/riot/registration.js`
- Modify: `commands/riot/upload.js`
- Modify: `commands/team/autoMatchTeams.js`

**Step 1: Write the failing test**

```js
test("commands return a setup error for uninitialized guilds", async () => {
  const result = formatGuildConfigError({ code: "GUILD_NOT_CONFIGURED" });
  assert.match(result, /서버설정 초기화/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/guild-database.test.js`
Expected: FAIL because the formatter does not exist yet.

**Step 3: Write minimal implementation**

```js
function formatGuildConfigError(error) {
  if (error?.code === "GUILD_NOT_CONFIGURED") {
    return "이 서버는 아직 초기화되지 않았습니다. 서버 관리자에게 /서버설정 초기화를 요청하세요.";
  }
  return "오류가 발생했습니다.";
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/guild-database.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add commands/components/rankBoard.js commands/components/search.js commands/components/matchHistory.js commands/riot/registration.js commands/riot/upload.js commands/team/autoMatchTeams.js scripts/Utils/GuildDatabase.js tests/guild-database.test.js
git commit -m "feat: scope gameplay commands by guild"
```

### Task 5: Make slash-command deployment multi-guild friendly

**Files:**
- Modify: `config/runtime.js`
- Modify: `deploy-commands.js`

**Step 1: Write the failing test**

```js
test("guild id is optional in runtime config", () => {
  const runtime = loadRuntimeConfig();
  assert.equal(runtime.discord.guildId, undefined);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/runtime-config.test.js`
Expected: FAIL because `guildId` is still required.

**Step 3: Write minimal implementation**

```js
guildId: firstNonEmpty(process.env.DISCORD_GUILD_ID, legacyConfig.guildId),
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/runtime-config.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add config/runtime.js deploy-commands.js tests/runtime-config.test.js
git commit -m "feat: deploy commands globally by default"
```
