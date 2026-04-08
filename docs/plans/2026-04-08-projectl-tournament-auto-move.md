# ProjectL Tournament Auto-Move Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-account Riot registration, create a tournament code during `/내전`, store one active session per guild, automatically move Discord users to team voice channels when Riot champion select starts, and automatically gather both team rooms into a server-configured unity voice channel when Riot reports the game has ended.

**Architecture:** Discord users remain the source of truth for MMR and match history. Riot accounts become child records attached to a Discord ID, `/내전` saves a guild-scoped active session with bot-owned teams and a configured unity room, a background poller watches Riot lobby events for `ChampSelectStartedEvent`, and a lightweight HTTP callback server in this project receives Riot game-result notifications to trigger the post-game gather.

**Tech Stack:** Node.js, discord.js, axios, mysql2, node:test, MariaDB/MySQL, lightweight HTTP server

---

### Task 1: Add schema coverage for multi-account users, active sessions, and unity-room guild settings

**Files:**
- Modify: `scripts/Utils/GuildDatabase.js`
- Modify: `scripts/Utils/DB.js`
- Test: `tests/guild-database.test.js`

**Step 1: Write the failing test**

```js
test("buildGuildSchemaStatements includes riot account and active session tables", () => {
  const sql = buildGuildSchemaStatements().join("\n");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `riot_accounts`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `active_tournament_sessions`/);
});

test("buildControlSchemaStatements stores a unity voice channel for each guild", () => {
  const sql = buildControlSchemaStatements().join("\n");
  assert.match(sql, /unity_voice_channel_id/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/guild-database.test.js`
Expected: FAIL because the control schema does not include the unity voice channel field yet.

**Step 3: Write minimal implementation**

```js
`CREATE TABLE IF NOT EXISTS \`guild_settings\` (
  ...
  \`unity_voice_channel_id\` varchar(50) DEFAULT NULL,
  ...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/guild-database.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/GuildDatabase.js scripts/Utils/DB.js tests/guild-database.test.js
git commit -m "test: add tournament and unity-room schema coverage"
```

### Task 2: Add Riot account lookup helpers and active session persistence

**Files:**
- Modify: `scripts/Utils/Query.js`
- Test: `tests/tournament-query.test.js`

**Step 1: Write the failing test**

```js
test("replaceActiveTournamentSession cancels the previous session before saving a new one", async () => {
  const calls = [];
  const pool = { query: async (sql) => calls.push(sql) };
  await replaceActiveTournamentSession(pool, { guildId: "1", code: "ABC" });
  assert.match(calls[0], /UPDATE active_tournament_sessions/);
  assert.match(calls[1], /INSERT INTO active_tournament_sessions/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/tournament-query.test.js`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

```js
async function replaceActiveTournamentSession(guildId, session) {
  const promisePool = await getGuildPromisePool(guildId);
  await promisePool.query(
    "UPDATE active_tournament_sessions SET status = 'CANCELLED' WHERE status IN ('LOBBY','CHAMP_SELECT_STARTED','COMPLETED_PENDING_GATHER')"
  );
  await promisePool.query(
    "INSERT INTO active_tournament_sessions (...) VALUES (...)",
    [...]
  );
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/tournament-query.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js tests/tournament-query.test.js
git commit -m "feat: add active tournament session persistence"
```

### Task 3: Support multiple Riot accounts per Discord user in registration flow

**Files:**
- Modify: `commands/riot/registration.js`
- Modify: `scripts/Riot/DataReceiver.js`
- Modify: `scripts/Utils/Query.js`
- Test: `tests/registration-command.test.js`

**Step 1: Write the failing test**

```js
test("registration command still exposes riot name and tag options", () => {
  const command = require("../commands/riot/registration");
  const json = command.data.toJSON();
  assert.equal(json.name, "등록");
  assert.deepEqual(
    json.options.map((option) => option.name),
    ["소환사이름", "소환사태그", "등록할소환사"]
  );
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/registration-command.test.js`
Expected: FAIL because the new test file does not exist yet.

**Step 3: Write minimal implementation**

```js
const account = await getSummonerData(userName, userTag);
await registerRiotAccount(interaction.guildId, user.id, {
  riotGameName: userName,
  riotTagLine: userTag,
  puuid: account.account.puuid,
  summonerId: account.summoner.id,
});
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/registration-command.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add commands/riot/registration.js scripts/Riot/DataReceiver.js scripts/Utils/Query.js tests/registration-command.test.js
git commit -m "feat: support multiple riot accounts per discord user"
```

### Task 4: Keep Discord-centric MMR queries for team balancing

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `commands/team/autoMatchTeams.js`
- Test: `tests/team-query.test.js`

**Step 1: Write the failing test**

```js
test("getUsersData returns one MMR profile per discord id even with multiple riot accounts", async () => {
  const sql = buildGetUsersDataSql(["1", "2"]);
  assert.match(sql, /FROM user/);
  assert.doesNotMatch(sql, /riot_accounts/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/team-query.test.js`
Expected: FAIL because the helper and test file do not exist yet.

**Step 3: Write minimal implementation**

```js
function buildGetUsersDataSql(ids) {
  return `SELECT discord_id, name, mmr FROM user WHERE discord_id IN (${buildInClausePlaceholders(ids.length)}) ORDER BY mmr DESC, name ASC`;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/team-query.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js commands/team/autoMatchTeams.js tests/team-query.test.js
git commit -m "refactor: keep team balancing discord-centric"
```

### Task 5: Add a tournament adapter for provider, tournament, code, and lobby events

**Files:**
- Create: `scripts/Riot/TournamentApi.js`
- Modify: `config/runtime.js`
- Modify: `.env.example`
- Test: `tests/tournament-api.test.js`

**Step 1: Write the failing test**

```js
test("buildTournamentApiBaseUrl selects stub mode when configured", () => {
  assert.equal(buildTournamentApiBaseUrl({ useStub: true, platform: "kr" }), "https://kr.api.riotgames.com/lol/tournament-stub/v5");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/tournament-api.test.js`
Expected: FAIL because the adapter does not exist.

**Step 3: Write minimal implementation**

```js
function buildTournamentApiBaseUrl({ useStub, platform }) {
  const family = useStub ? "tournament-stub" : "tournament";
  return `https://${platform}.api.riotgames.com/lol/${family}/v5`;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/tournament-api.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Riot/TournamentApi.js config/runtime.js .env.example tests/tournament-api.test.js
git commit -m "feat: add riot tournament api adapter"
```

### Task 6: Add a server-setting command for the unity voice room

**Files:**
- Modify: `commands/utility/server.js`
- Modify: `scripts/Utils/DB.js`
- Test: `tests/server-command.test.js`

**Step 1: Write the failing test**

```js
test("server command exposes a unity voice room configuration subcommand", () => {
  const command = require("../commands/utility/server");
  const json = command.data.toJSON();
  assert.ok(json.options.some((option) => option.name === "공용통화방"));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/server-command.test.js`
Expected: FAIL because the command does not expose the new subcommand yet.

**Step 3: Write minimal implementation**

```js
.addSubcommand((subcommand) =>
  subcommand
    .setName("공용통화방")
    .setDescription("게임 종료 후 모일 음성채널을 설정합니다.")
    .addChannelOption((option) =>
      option.setName("채널").setRequired(true)
    )
)
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/server-command.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add commands/utility/server.js scripts/Utils/DB.js tests/server-command.test.js
git commit -m "feat: add unity voice room server setting"
```

### Task 7: Expand `/내전` to create a tournament session and reply with the code

**Files:**
- Modify: `commands/team/autoMatchTeams.js`
- Modify: `scripts/Utils/Query.js`
- Test: `tests/team-command.test.js`

**Step 1: Write the failing test**

```js
test("team command still exposes the balance mode option", () => {
  const command = require("../commands/team/autoMatchTeams");
  const json = command.data.toJSON();
  assert.equal(json.name, "내전");
  assert.equal(json.options[0].name, "옵션");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/team-command.test.js`
Expected: FAIL because the new test file does not exist yet.

**Step 3: Write minimal implementation**

```js
const tournamentCode = await createTournamentCode(...);
const unityVoiceChannelId = await getUnityVoiceChannelId(interaction.guildId);
await replaceActiveTournamentSession(interaction.guildId, {
  tournamentCode,
  sourceChannelId: channel.id,
  team1ChannelId: team1.id,
  team2ChannelId: team2.id,
  unityVoiceChannelId,
  team1DiscordIds,
  team2DiscordIds,
});
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/team-command.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add commands/team/autoMatchTeams.js scripts/Utils/Query.js tests/team-command.test.js
git commit -m "feat: create tournament sessions from team command"
```

### Task 8: Add a voice-move helper with DM invite fallback and post-game gather support

**Files:**
- Create: `scripts/Discord/VoiceMoveService.js`
- Test: `tests/voice-move-service.test.js`

**Step 1: Write the failing test**

```js
test("moveUsersToAssignedChannels DMs users who are not in voice", async () => {
  const result = await moveUsersToAssignedChannels({ members: [offlineMember] });
  assert.equal(result.dmFallbacks.length, 1);
});

test("gatherTeamChannelsToUnityRoom moves everyone from both team channels into the unity room", async () => {
  const result = await gatherTeamChannelsToUnityRoom(...);
  assert.equal(result.moved.length, 10);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/voice-move-service.test.js`
Expected: FAIL because the service does not exist.

**Step 3: Write minimal implementation**

```js
async function moveUsersToAssignedChannels({ guild, assignments }) {
  ...
}

async function gatherTeamChannelsToUnityRoom({ teamChannels, unityChannel }) {
  ...
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/voice-move-service.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Discord/VoiceMoveService.js tests/voice-move-service.test.js
git commit -m "feat: add voice move helpers"
```

### Task 9: Add a background poller for champion-select detection

**Files:**
- Create: `scripts/Tournament/SessionPoller.js`
- Modify: `index.js`
- Modify: `scripts/Utils/Query.js`
- Test: `tests/session-poller.test.js`

**Step 1: Write the failing test**

```js
test("poller marks the session moved after champion select handling", async () => {
  const sessionStore = createFakeSessionStore();
  const riotApi = { getLobbyEventsByCode: async () => [{ eventType: "ChampSelectStartedEvent" }] };
  await pollTournamentSessions({ sessionStore, riotApi, moveService });
  assert.equal(sessionStore.updatedStatus, "MOVED");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/session-poller.test.js`
Expected: FAIL because the poller does not exist.

**Step 3: Write minimal implementation**

```js
async function pollTournamentSessions({ sessionStore, riotApi, moveService }) {
  const sessions = await sessionStore.listPendingSessions();
  for (const session of sessions) {
    const events = await riotApi.getLobbyEventsByCode(session.tournamentCode);
    if (!events.some((event) => event.eventType === "ChampSelectStartedEvent")) {
      continue;
    }
    await moveService.moveSession(session);
    await sessionStore.updateSessionStatus(session.id, "MOVED", session.guildId);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/session-poller.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Tournament/SessionPoller.js index.js scripts/Utils/Query.js tests/session-poller.test.js
git commit -m "feat: auto move users on champion select"
```

### Task 10: Add an HTTP callback server for Riot game completion

**Files:**
- Modify: `package.json`
- Modify: `config/runtime.js`
- Create: `scripts/Web/CallbackServer.js`
- Test: `tests/callback-server.test.js`

**Step 1: Write the failing test**

```js
test("callback handler marks the matching session ready for post-game gather", async () => {
  const result = await handleTournamentCallback({ tournamentCode: "KR-123" }, deps);
  assert.equal(result.status, 200);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/callback-server.test.js`
Expected: FAIL because the callback server does not exist.

**Step 3: Write minimal implementation**

```js
async function handleTournamentCallback(body, deps) {
  await deps.sessionStore.markCompletedPendingGather(body.tournamentCode, body);
  return { status: 200 };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/callback-server.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json config/runtime.js scripts/Web/CallbackServer.js tests/callback-server.test.js
git commit -m "feat: add riot tournament callback server"
```

### Task 11: Trigger post-game gather from callback-completed sessions

**Files:**
- Modify: `scripts/Tournament/SessionPoller.js`
- Modify: `scripts/Utils/Query.js`
- Modify: `index.js`
- Test: `tests/session-poller.test.js`

**Step 1: Write the failing test**

```js
test("poller gathers team rooms into the unity room when a session is completed", async () => {
  ...
  assert.equal(updatedStatus.status, "COMPLETED");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/session-poller.test.js`
Expected: FAIL because completed-session gather is not implemented yet.

**Step 3: Write minimal implementation**

```js
if (session.status === "COMPLETED_PENDING_GATHER") {
  await moveService.gatherSession(session);
  await sessionStore.updateSessionStatus(session.id, "COMPLETED", session.guildId);
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/session-poller.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Tournament/SessionPoller.js scripts/Utils/Query.js index.js tests/session-poller.test.js
git commit -m "feat: auto gather team rooms after game completion"
```

### Task 12: Update result ingestion to resolve Riot accounts back to Discord users

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `commands/riot/upload.js`
- Test: `tests/match-ingestion.test.js`

**Step 1: Write the failing test**

```js
test("match ingestion updates discord-owned mmr when a linked riot account appears in the match", async () => {
  const player = { puuid: "alt-puuid" };
  const result = await resolveUsersByPuuids("guild-1", [player.puuid]);
  assert.equal(result.data[0].discord_id, "123456");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-ingestion.test.js`
Expected: FAIL because the resolver does not cover linked accounts yet.

**Step 3: Write minimal implementation**

```js
async function resolveUsersByPuuids(guildId, puuids) {
  ...
  JOIN riot_accounts ra ON ra.discord_id = u.discord_id
  ...
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/match-ingestion.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js commands/riot/upload.js tests/match-ingestion.test.js
git commit -m "feat: map linked riot accounts back to discord mmr"
```

### Task 13: Run the full verification suite

**Files:**
- Modify: `tests/*.test.js` as needed from earlier tasks

**Step 1: Run targeted tests for the new behavior**

Run: `node --test tests/guild-database.test.js tests/tournament-query.test.js tests/registration-command.test.js tests/team-query.test.js tests/tournament-api.test.js tests/team-command.test.js tests/voice-move-service.test.js tests/session-poller.test.js tests/match-ingestion.test.js tests/callback-server.test.js`
Expected: PASS

**Step 2: Run the full project test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run runtime verification**

Run: `npm run verify`
Expected: PASS

**Step 4: Commit**

```bash
git add tests
git commit -m "test: verify tournament lifecycle automation"
```
