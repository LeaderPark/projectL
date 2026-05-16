# OP Score Personal Performance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make OP score primarily reflect individual performance so strong losing players can rank above weak winning players.

**Architecture:** Keep the existing `performanceScore` field and public display conversion. Change only the calculation in `scripts/Riot/MatchTransformer.js` so match result becomes a small modifier instead of separating winner and loser score bands.

**Tech Stack:** Node.js, CommonJS modules, Node test runner

---

### Task 1: Lock the desired OP score behavior in tests

**Files:**
- Modify: `tests/match-transformer.test.js`

**Step 1: Write the failing test**

Add a test that builds one high-impact losing player and one low-impact winning player, then asserts the losing player receives the higher `calculatePerformanceScore` value.

**Step 2: Run test to verify it fails**

Run: `node --test tests/match-transformer.test.js`

Expected: FAIL because the current calculation forces losers into a negative score band.

**Step 3: Commit**

Commit the design and plan documents plus the failing test once the expected failure is confirmed.

### Task 2: Change the score calculation

**Files:**
- Modify: `scripts/Riot/MatchTransformer.js`

**Step 1: Write minimal implementation**

Remove the loser negative conversion and return the raw individual score plus a small result modifier.

**Step 2: Run targeted verification**

Run: `node --test tests/match-transformer.test.js`

Expected: PASS.

**Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

**Step 4: Commit**

Commit the implementation after verification passes.
