# Tournament Callback Result Ingestion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically ingest completed tournament match results from Riot callbacks, fetch the full match details from Riot, transform them into the project's internal match model, and persist match history plus Discord-owned player stats without relying on manual `.rofl` uploads.

**Architecture:** The callback remains a fast completion signal. It records gather state and result-ingestion state on the active tournament session, while the existing session poller performs retriable Riot result lookup and hands the transformed match to a new atomic persistence helper. Voice gather and result ingestion stay independent so a result-fetch failure never blocks the post-game room move.

**Tech Stack:** Node.js, discord.js, axios, mysql2, node:test, MariaDB/MySQL, lightweight HTTP server

---

### Task 1: Add session schema coverage for callback-driven result ingestion state

**Files:**
- Modify: `scripts/Utils/GuildDatabase.js`
- Test: `tests/guild-database.test.js`

**Step 1: Write the failing test**

```js
test("active_tournament_sessions stores result ingestion state for callback processing", () => {
  const sql = buildGuildSchemaStatements().join("\n");
  assert.match(sql, /result_status/);
  assert.match(sql, /result_game_id/);
  assert.match(sql, /result_payload/);
  assert.match(sql, /result_attempts/);
  assert.match(sql, /result_error/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/guild-database.test.js`
Expected: FAIL because the session table does not yet store result-ingestion state.

**Step 3: Write minimal implementation**

```js
`CREATE TABLE IF NOT EXISTS \`active_tournament_sessions\` (
  ...
  \`result_status\` varchar(30) NOT NULL DEFAULT 'IDLE',
  \`result_game_id\` varchar(50) DEFAULT NULL,
  \`result_payload\` longtext DEFAULT NULL,
  \`result_attempts\` int(10) UNSIGNED NOT NULL DEFAULT 0,
  \`result_error\` longtext DEFAULT NULL,
  ...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/guild-database.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/GuildDatabase.js tests/guild-database.test.js
git commit -m "test: add session result-ingestion schema coverage"
```

### Task 2: Add query helpers to mark callback results pending and update retry state

**Files:**
- Modify: `scripts/Utils/Query.js`
- Test: `tests/tournament-result-query.test.js`

**Step 1: Write the failing test**

```js
test("markTournamentSessionResultPending stores the callback payload and game id", async () => {
  const calls = [];
  const { markTournamentSessionResultPending } = loadQueryModule({
    getGuildPromisePool: async () => ({
      async query(sql, params) {
        calls.push({ sql, params });
        return [{ affectedRows: 1 }];
      },
    }),
  });

  await markTournamentSessionResultPending("guild-1", "KR-CODE-1", {
    gameId: 12345,
    shortCode: "KR-CODE-1",
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /result_status = 'PENDING'/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/tournament-result-query.test.js`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

```js
async function markTournamentSessionResultPending(guildId, tournamentCode, callbackPayload) {
  const promisePool = await getGuildPromisePool(guildId);
  await promisePool.query(
    `UPDATE active_tournament_sessions
     SET result_status = 'PENDING',
         result_game_id = ?,
         result_payload = ?,
         result_attempts = 0,
         result_error = NULL
     WHERE tournament_code = ?`,
    [String(callbackPayload?.gameId ?? ""), JSON.stringify(callbackPayload), tournamentCode]
  );
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/tournament-result-query.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js tests/tournament-result-query.test.js
git commit -m "feat: track pending tournament result ingestions"
```

### Task 3: Extend Riot integration with regional match-result lookup

**Files:**
- Modify: `config/runtime.js`
- Modify: `.env.example`
- Modify: `scripts/Riot/TournamentApi.js`
- Test: `tests/tournament-api.test.js`

**Step 1: Write the failing test**

```js
test("buildMatchApiBaseUrl uses regional routing for KR", () => {
  assert.equal(
    buildMatchApiBaseUrl({ regionalRoute: "asia" }),
    "https://asia.api.riotgames.com/lol/match/v5"
  );
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/tournament-api.test.js`
Expected: FAIL because there is no match-result client yet.

**Step 3: Write minimal implementation**

```js
function buildMatchApiBaseUrl({ regionalRoute }) {
  return `https://${regionalRoute}.api.riotgames.com/lol/match/v5`;
}

async function getMatchById(gameId) {
  const response = await matchApi.get(`/matches/KR_${gameId}`);
  return response.data;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/tournament-api.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add config/runtime.js .env.example scripts/Riot/TournamentApi.js tests/tournament-api.test.js
git commit -m "feat: add riot regional match lookup"
```

### Task 4: Add a transformer from Riot match payloads to the current internal match model

**Files:**
- Create: `scripts/Riot/MatchTransformer.js`
- Test: `tests/match-transformer.test.js`

**Step 1: Write the failing test**

```js
test("transformMatchPayload maps Riot participants into internal blue and purple teams", () => {
  const match = transformMatchPayload(sampleMatchPayload);
  assert.equal(match.blueTeam.players.length, 5);
  assert.equal(match.purpleTeam.players.length, 5);
  assert.equal(match.blueTeam.players[0].lane, "TOP");
  assert.equal(match.purpleTeam.players[0].lane, "SUPPORT");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-transformer.test.js`
Expected: FAIL because the transformer does not exist.

**Step 3: Write minimal implementation**

```js
function mapLane(position) {
  return {
    TOP: "TOP",
    JUNGLE: "JUNGLE",
    MIDDLE: "MID",
    BOTTOM: "BOT",
    UTILITY: "SUPPORT",
  }[position] ?? "SUPPORT";
}

function transformMatchPayload(payload) {
  ...
  return new Match(gameLength, purpleTeam, blueTeam);
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/match-transformer.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Riot/MatchTransformer.js tests/match-transformer.test.js
git commit -m "feat: transform riot match results into internal match model"
```

### Task 5: Add one atomic persistence helper for completed match results

**Files:**
- Modify: `scripts/Utils/Query.js`
- Test: `tests/match-ingestion.test.js`

**Step 1: Write the failing test**

```js
test("persistMatchResult is idempotent for a duplicate game id", async () => {
  const result = await persistMatchResult("guild-1", sampleMatch, "KR_12345");
  assert.equal(result.success, true);
  assert.equal(result.alreadyProcessed, true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-ingestion.test.js`
Expected: FAIL because the atomic persistence helper does not exist.

**Step 3: Write minimal implementation**

```js
async function persistMatchResult(guildId, match, gameId) {
  const pool = await getGuildPromisePool(guildId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    ...
    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/match-ingestion.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js tests/match-ingestion.test.js
git commit -m "feat: persist tournament match results atomically"
```

### Task 6: Update the callback handler to queue result ingestion without blocking gather

**Files:**
- Modify: `scripts/Web/CallbackServer.js`
- Modify: `scripts/Tournament/SessionPoller.js`
- Modify: `scripts/Utils/Query.js`
- Test: `tests/callback-server.test.js`

**Step 1: Write the failing test**

```js
test("callback handler marks gather ready and result ingestion pending in one pass", async () => {
  const result = await handleTournamentCallback(
    { shortCode: "KR-CODE-1", gameId: 12345 },
    deps
  );
  assert.equal(result.status, 200);
  assert.equal(deps.sessionStore.markCompletedCalls.length, 1);
  assert.equal(deps.sessionStore.markResultPendingCalls.length, 1);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/callback-server.test.js`
Expected: FAIL because callback handling only marks gather readiness today.

**Step 3: Write minimal implementation**

```js
await deps.sessionStore.markCompletedPendingGather(tournamentCode, body);
await deps.sessionStore.markResultPending(tournamentCode, body);
return { status: 200, body: "ok" };
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/callback-server.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/CallbackServer.js scripts/Tournament/SessionPoller.js scripts/Utils/Query.js tests/callback-server.test.js
git commit -m "feat: queue tournament result ingestion from callback"
```

### Task 7: Teach the poller to fetch, retry, and finalize match results

**Files:**
- Modify: `scripts/Tournament/SessionPoller.js`
- Modify: `index.js`
- Modify: `scripts/Riot/TournamentApi.js`
- Test: `tests/session-poller.test.js`

**Step 1: Write the failing test**

```js
test("poller retries result ingestion failures without blocking post-game gather", async () => {
  const session = {
    id: 1,
    guildId: "guild-1",
    tournamentCode: "KR-CODE-1",
    status: "COMPLETED_PENDING_GATHER",
    resultStatus: "PENDING",
    resultGameId: "12345",
  };
  ...
  assert.equal(updatedStatuses.gather, "COMPLETED");
  assert.equal(updatedStatuses.result, "FAILED");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/session-poller.test.js`
Expected: FAIL because the poller does not process result jobs yet.

**Step 3: Write minimal implementation**

```js
if (session.resultStatus === "PENDING" || session.resultStatus === "FAILED") {
  try {
    const payload = await riotApi.getMatchById(session.resultGameId);
    const match = transformMatchPayload(payload);
    await persistMatchResult(session.guildId, match, session.resultGameId);
    await sessionStore.markResultIngested(session.id, session.guildId);
  } catch (error) {
    await sessionStore.markResultFailed(session.id, session.guildId, error.message);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/session-poller.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Tournament/SessionPoller.js index.js scripts/Riot/TournamentApi.js tests/session-poller.test.js
git commit -m "feat: retry tournament match ingestion in poller"
```

### Task 8: Keep `/업로드` as a fallback and route both ingestion paths through one persistence helper

**Files:**
- Modify: `commands/riot/upload.js`
- Modify: `scripts/Utils/Parser.js`
- Modify: `scripts/Utils/Query.js`
- Test: `tests/match-ingestion.test.js`

**Step 1: Write the failing test**

```js
test("manual replay upload uses the same atomic persistence helper as callback ingestion", async () => {
  const calls = [];
  await executeUploadCommandWithMocks({ persistMatchResult: async (...args) => calls.push(args) });
  assert.equal(calls.length, 1);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-ingestion.test.js`
Expected: FAIL because `/업로드` still calls insert and update separately.

**Step 3: Write minimal implementation**

```js
const result = await persistMatchResult(interaction.guildId, replay, fileName);
if (!result.success) {
  ...
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/match-ingestion.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add commands/riot/upload.js scripts/Utils/Parser.js scripts/Utils/Query.js tests/match-ingestion.test.js
git commit -m "refactor: unify manual and callback match ingestion"
```

### Task 9: Run focused and full verification

**Files:**
- Modify: `tests/*.test.js` as needed from earlier tasks

**Step 1: Run targeted tests for the new behavior**

Run: `node --test tests/guild-database.test.js tests/tournament-result-query.test.js tests/tournament-api.test.js tests/match-transformer.test.js tests/match-ingestion.test.js tests/callback-server.test.js tests/session-poller.test.js`
Expected: PASS

**Step 2: Run the full project test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run the callback and poller startup path once in local verification**

Run: `node --test tests/*.test.js`
Expected: PASS

**Step 4: Commit**

```bash
git add tests
git commit -m "test: verify callback-driven tournament result ingestion"
```
