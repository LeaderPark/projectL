# Public Site MMR Privacy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide exact MMR values from the public record site while keeping ranking order MMR-based, then seed a few fake records for testing.

**Architecture:** The public query layer keeps returning MMR for internal ordering, but the public formatter and views stop carrying or rendering exact MMR text. Demo players and matches are inserted directly into the configured public guild database so the site has realistic content immediately after the UI privacy fix lands.

**Tech Stack:** Node.js, server-rendered HTML views, node:test, MariaDB

---

### Task 1: Privacy regression tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Modify: `tests/public-site-formatter.test.js`
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-formatter.test.js`

**Step 1: Write the failing test**

```js
assert.doesNotMatch(html, /MMR/);
assert.doesNotMatch(html, /1,700/);
assert.equal("mmrText" in summary, false);
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-formatter.test.js`
Expected: FAIL because the public pages and formatter still expose exact MMR text.

**Step 3: Write minimal implementation**

```js
// Remove public mmrText/topMmrText fields from formatter output.
// Remove the MMR summary/stat cells from the public views.
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js tests/public-site-formatter.test.js`
Expected: PASS

### Task 2: Public page copy cleanup

**Files:**
- Modify: `scripts/Web/views/HomePage.js`
- Modify: `scripts/Web/views/PlayerPage.js`

**Step 1: Write the failing test**

```js
assert.match(html, /공개 랭킹/);
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the home page still labels the section as `MMR 랭킹`.

**Step 3: Write minimal implementation**

```js
<h2>공개 랭킹</h2>
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

### Task 3: Demo data seeding

**Files:**
- Modify runtime data only: `bot_guild_930430128553611264.user`
- Modify runtime data only: `bot_guild_930430128553611264.matches`
- Modify runtime data only: `bot_guild_930430128553611264.match_in_users`

**Step 1: Prepare deterministic fake records**

Create ten fake players and three fake matches with stable IDs and aggregate stats.

**Step 2: Insert data**

Run a MariaDB script through `docker exec` that upserts fake `user` rows, inserts fake `matches`, and links users in `match_in_users`.

**Step 3: Verify data appears**

Run:
- `docker exec ... SELECT COUNT(*) FROM matches`
- `Invoke-WebRequest http://localhost:8000/`

Expected: public pages render non-empty ranking and recent match content.
