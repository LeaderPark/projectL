# Replay Reupload Overwrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace stored match details when the same replay is uploaded again without changing already-applied user statistics.

**Architecture:** Keep `persistMatchResult` as the single ingestion entry point. Duplicate `game_id` detection will branch to an overwrite helper that updates `matches` and refreshes `match_in_users`, while the new-match path keeps the existing insert plus user-stat update flow.

**Tech Stack:** Node.js, MariaDB SQL through `mysql2`, Node built-in test runner.

---

### Task 1: Duplicate Replay Regression Test

**Files:**
- Modify: `tests/match-ingestion.test.js`

**Step 1:** Replace the old duplicate-id idempotency test with a test that expects duplicate replay uploads to overwrite match data.

**Step 2:** Run `node --test tests/match-ingestion.test.js`.

Expected: FAIL because the current duplicate path commits without updating `matches` or `match_in_users`.

### Task 2: Match-Only Overwrite

**Files:**
- Modify: `scripts/Utils/Query.js`

**Step 1:** Return duplicate match metadata from `insertMatchDataWithExecutor`.

**Step 2:** Add an overwrite helper that resolves current replay participants, rejects orphan reuploads, updates the `matches` row, deletes old `match_in_users` links, and inserts the latest linked users.

**Step 3:** In `persistMatchResult`, call the overwrite helper for duplicate matches and skip `updateUserDataWithExecutor`.

**Step 4:** Run `node --test tests/match-ingestion.test.js`.

Expected: PASS.

### Task 3: Verification

**Files:**
- All changed files.

**Step 1:** Run `npm test`.

Expected: all tests pass.
