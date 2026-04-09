# Elo Matchmaking Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current performance-accumulation MMR flow with a result-based matchmaking rating update and upgrade team balancing to search the best 5v5 split.

**Architecture:** Keep the existing `user.mmr` column and public surfaces intact, but change how it is updated after each match. Match ingestion will compute team expected score from both teams' current ratings and apply a bounded Elo-style delta with a higher K-factor for newer players. The `/내전` command will stop using the current greedy assignment and instead evaluate every 5-player combination to find the lowest-bias split while still discouraging exact repeat teams.

**Tech Stack:** Node.js, Discord.js, MariaDB query helpers, Node test runner

---

### Task 1: Lock in rating-update behavior with tests

**Files:**
- Modify: `tests/match-ingestion.test.js`
- Test: `tests/match-ingestion.test.js`

**Step 1: Write the failing test**

Add tests that prove:
- an underdog win produces a larger positive delta than a favored win
- a favored loss produces a larger negative delta than an underdog loss
- newer players get a larger absolute delta than established players

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-ingestion.test.js`
Expected: FAIL because the current implementation still uses per-player replay stats instead of expected-result rating deltas.

**Step 3: Write minimal implementation**

Update the match ingestion path in `scripts/Utils/Query.js` so rating deltas are computed from:
- team average MMR
- expected score via Elo expectation
- bounded K-factor chosen from games played

**Step 4: Run test to verify it passes**

Run: `node --test tests/match-ingestion.test.js`
Expected: PASS

### Task 2: Lock in optimal team balancing with tests

**Files:**
- Modify: `tests/team-command.test.js`
- Modify: `commands/team/autoMatchTeams.js`
- Optionally create: `scripts/Utils/TeamBalancer.js`

**Step 1: Write the failing test**

Add tests that prove:
- the balancing helper finds the minimum-difference 5v5 split for a 10-player lobby
- repeat-side penalties are applied only as a tiebreaker, not by making obviously worse MMR splits

**Step 2: Run test to verify it fails**

Run: `node --test tests/team-command.test.js`
Expected: FAIL because the current command still assigns users greedily.

**Step 3: Write minimal implementation**

Extract a balancing helper that:
- enumerates every 5-player combination
- scores each split by MMR gap plus a modest repeat-team penalty
- returns two 5-player rosters for the command to render and persist

**Step 4: Run test to verify it passes**

Run: `node --test tests/team-command.test.js`
Expected: PASS

### Task 3: Verify regression surface

**Files:**
- Modify: `commands/team/autoMatchTeams.js`
- Modify: `scripts/Utils/Query.js`
- Test: `tests/match-ingestion.test.js`
- Test: `tests/team-command.test.js`

**Step 1: Run targeted verification**

Run: `node --test tests/match-ingestion.test.js tests/team-command.test.js`
Expected: PASS

**Step 2: Run broader smoke coverage**

Run: `npm test`
Expected: PASS, or identify any unrelated pre-existing failure without changing unrelated files.
