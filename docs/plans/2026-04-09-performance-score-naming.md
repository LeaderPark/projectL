# Performance Score Naming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate persistent matchmaking MMR from per-match performance scoring by renaming serialized match player `mmr` to `performanceScore` while keeping old match history readable.

**Architecture:** `user.mmr` remains unchanged as the leaderboard and balancing rating. Match ingestion will now write `performanceScore` on each serialized player object, and read paths will normalize `performanceScore ?? mmr` so legacy match rows still work without a data migration.

**Tech Stack:** Node.js, Discord.js, serialized match JSON, Node test runner

---

### Task 1: Lock in the new match field name with tests

**Files:**
- Modify: `tests/match-transformer.test.js`
- Modify: `tests/public-site-formatter.test.js`

**Step 1: Write the failing test**

Add tests that prove:
- transformed match players expose `performanceScore`
- public match-card formatting reads `performanceScore`
- formatting still falls back to legacy `mmr`

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-transformer.test.js tests/public-site-formatter.test.js`
Expected: FAIL because the current implementation still writes and reads `mmr`.

**Step 3: Write minimal implementation**

Rename the in-memory match-player field and add fallback normalization for legacy rows.

**Step 4: Run test to verify it passes**

Run: `node --test tests/match-transformer.test.js tests/public-site-formatter.test.js`
Expected: PASS

### Task 2: Lock in match history presentation behavior

**Files:**
- Modify: `tests/match-history-command.test.js`
- Modify: `commands/components/matchHistory.js`

**Step 1: Write the failing test**

Add a test that proves MVP/ACE selection prefers `performanceScore` and still supports old `mmr` values from stored match JSON.

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-history-command.test.js`
Expected: FAIL because the command currently reads only `mmr`.

**Step 3: Write minimal implementation**

Normalize the value once when reading match JSON and sort on the normalized performance score.

**Step 4: Run test to verify it passes**

Run: `node --test tests/match-history-command.test.js`
Expected: PASS

### Task 3: Verify the rename end-to-end

**Files:**
- Modify: `scripts/Riot/MatchTransformer.js`
- Modify: `scripts/VO/player.js`
- Modify: `commands/components/matchHistory.js`
- Modify: `scripts/Web/formatters/PublicSiteFormatter.js`
- Test: `tests/match-transformer.test.js`
- Test: `tests/public-site-formatter.test.js`
- Test: `tests/match-history-command.test.js`

**Step 1: Run targeted verification**

Run: `node --test tests/match-transformer.test.js tests/public-site-formatter.test.js tests/match-history-command.test.js`
Expected: PASS

**Step 2: Run full regression suite**

Run: `npm test`
Expected: PASS
