# Hard Fearless Inhouse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a usable `/내전` hard fearless mode that can start or continue a series, carry forward previously used champions, and update that champion pool after each ingested game.

**Architecture:** Keep Riot room creation on the existing tournament-code path, but add ProjectL-owned series state on `active_tournament_sessions`. `/내전` will choose between fresh balancing and previous-team reuse based on the requested hard fearless action, while result ingestion will append the latest game's champion picks back into the stored session row.

**Tech Stack:** Node.js, discord.js, node:test, MySQL

---

### Task 1: Lock the slash-command schema for hard fearless controls

**Files:**
- Modify: `tests/team-command.test.js`

**Step 1: Write the failing test**

Update the command schema test to expect:

- `옵션`
- `픽방식`
- `특수규칙`
- `시리즈동작`

And assert the new choice values:

- `특수규칙`: `STANDARD`, `HARD_FEARLESS`
- `시리즈동작`: `AUTO`, `NEW`, `CONTINUE`

**Step 2: Run test to verify it fails**

Run: `node --test tests/team-command.test.js`
Expected: FAIL because `/내전` does not expose the hard fearless options yet.

**Step 3: Write minimal implementation**

Add the two slash-command options and the label helpers in `commands/team/autoMatchTeams.js`.

**Step 4: Run test to verify it passes**

Run: `node --test tests/team-command.test.js`
Expected: PASS

### Task 2: Lock `/내전` hard fearless execution behavior

**Files:**
- Modify: `tests/auto-match-teams-execute.test.js`

**Step 1: Write the failing tests**

Add focused execution tests that assert:

- a fresh hard fearless series stores `seriesMode: "HARD_FEARLESS"`, `seriesGameNumber: 1`, and `fearlessUsedChampions: []`
- the embed shows `하드 피어리스` and `1세트`
- `이어하기` reuses the previous team assignments instead of rebalancing
- `이어하기` surfaces the stored fearless champion list in the embed

**Step 2: Run test to verify it fails**

Run: `node --test tests/auto-match-teams-execute.test.js`
Expected: FAIL because the command does not know about hard fearless session state or continuation yet.

**Step 3: Write minimal implementation**

Teach `commands/team/autoMatchTeams.js` to:

- read the new options
- load the latest session when hard fearless is requested
- choose between fresh balancing and continuation
- persist the new session state fields
- render the hard fearless fields in the success embed

**Step 4: Run test to verify it passes**

Run: `node --test tests/auto-match-teams-execute.test.js`
Expected: PASS

### Task 3: Lock the new session schema and query mapping

**Files:**
- Modify: `tests/guild-database.test.js`
- Modify: `tests/tournament-result-query.test.js`
- Modify: `tests/query-guardrails.test.js`

**Step 1: Write the failing tests**

Add assertions for:

- `series_mode`
- `series_game_number`
- `fearless_used_champions`

And add query-level expectations that:

- `replaceActiveTournamentSession` can store these values
- `listPendingTournamentSessions` exposes these values to pollers and services

**Step 2: Run test to verify it fails**

Run: `node --test tests/guild-database.test.js tests/tournament-result-query.test.js tests/query-guardrails.test.js`
Expected: FAIL because the schema and query helpers do not include the new fields yet.

**Step 3: Write minimal implementation**

Update `scripts/Utils/GuildDatabase.js` and `scripts/Utils/Query.js` with the new fields, defaults, and mapping helpers.

**Step 4: Run test to verify it passes**

Run: `node --test tests/guild-database.test.js tests/tournament-result-query.test.js tests/query-guardrails.test.js`
Expected: PASS

### Task 4: Lock hard fearless result ingestion

**Files:**
- Create: `tests/tournament-result-service.test.js`
- Create: `scripts/Tournament/TournamentResultService.js`
- Modify: `index.js`

**Step 1: Write the failing tests**

Add result-service tests that assert:

- a hard fearless session updates its stored champion list after successful ingestion
- champion names are deduplicated
- standard sessions do not call the fearless updater

**Step 2: Run test to verify it fails**

Run: `node --test tests/tournament-result-service.test.js`
Expected: FAIL because result ingestion currently only persists the match and does not update hard fearless session state.

**Step 3: Write minimal implementation**

Extract the result ingestion flow into `scripts/Tournament/TournamentResultService.js` and append hard fearless champion history there.

**Step 4: Run test to verify it passes**

Run: `node --test tests/tournament-result-service.test.js`
Expected: PASS

### Task 5: Verify the focused regression suite

**Files:**
- Test: `tests/team-command.test.js`
- Test: `tests/auto-match-teams-execute.test.js`
- Test: `tests/guild-database.test.js`
- Test: `tests/query-guardrails.test.js`
- Test: `tests/tournament-result-query.test.js`
- Test: `tests/tournament-result-service.test.js`

**Step 1: Run the targeted suite**

Run: `node --test tests/team-command.test.js tests/auto-match-teams-execute.test.js tests/guild-database.test.js tests/query-guardrails.test.js tests/tournament-result-query.test.js tests/tournament-result-service.test.js`
Expected: PASS

**Step 2: Review the diff**

Confirm:

- standard `/내전` behavior still works as before
- hard fearless can start fresh or continue the latest eligible series
- continuation preserves teams
- next-game fearless bans come from stored champion history
- successful ingestion appends the just-played champions back into session state
