# Public Site Discord Name Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show live Discord names on public ranking and player profile surfaces while listing each player's registered Riot accounts on the personal page.

**Architecture:** Keep database reads responsible for rankings, stats, and Riot account linkage, then resolve current Discord-facing names in the public-site service layer just before formatting. This avoids storing Discord names, preserves request-time freshness, and keeps the DB fallback intact when Discord lookups fail.

**Tech Stack:** Node.js, discord.js, mysql2, node:test, server-rendered HTML views

---

### Task 1: Lock the requested behavior with failing public-site tests

**Files:**
- Modify: `tests/public-site-service.test.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing tests**

Add tests that expect:

- ranking and player pages to render the current Discord display name instead of the stored Riot-facing name
- search results to expose the current Discord display name
- player pages to include a linked Riot account section

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: FAIL because the service still passes stored `user.name` through unchanged and the player page has no Riot account section.

**Step 3: Write minimal implementation**

Add only the minimal wiring needed to provide live names and linked accounts to the render layer.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: PASS

### Task 2: Add query support for linked Riot accounts on player pages

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `tests/public-site-query.test.js`

**Step 1: Write the failing test**

Add a test that expects the public player profile query path to return linked Riot accounts ordered in a stable way.

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-query.test.js`
Expected: FAIL because the player profile query currently returns only the `user` row.

**Step 3: Write minimal implementation**

Extend the player profile read path so it also fetches linked records from `riot_accounts` and attaches them to the returned profile payload.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-query.test.js`
Expected: PASS

### Task 3: Resolve live Discord names in the public-site service layer

**Files:**
- Modify: `scripts/Web/PublicSite.js`
- Modify: `tests/public-site-service.test.js`

**Step 1: Write the failing test**

Add service-level assertions for the name resolution order:

- guild member `displayName`
- Discord user `globalName`
- Discord user `username`
- stored fallback name

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js`
Expected: FAIL because the service does not currently resolve Discord identities.

**Step 3: Write minimal implementation**

Add a small helper that resolves one or many Discord display names using the runtime client, then overlays those names onto leaderboard, player-page, and search models.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js`
Expected: PASS

### Task 4: Render linked Riot accounts on the player page

**Files:**
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `public/site.css`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

Add a view assertion that the player page shows a dedicated linked-account section and renders each Riot account as `gameName#tagLine`.

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the current player page has no linked-account panel.

**Step 3: Write minimal implementation**

Render a compact panel for linked Riot accounts and add only the CSS required to keep the current layout stable on desktop and mobile.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

### Task 5: Run the focused regression suite

**Files:**
- Test: `tests/public-site-query.test.js`
- Test: `tests/public-site-service.test.js`
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-formatter.test.js`

**Step 1: Run the targeted suite**

Run: `node --test tests/public-site-query.test.js tests/public-site-service.test.js tests/public-site-views.test.js tests/public-site-formatter.test.js`
Expected: PASS

**Step 2: Verify no public-site regressions remain**

Confirm the ranking page, player page, and search result models all expose Discord-facing names while the player profile still lists linked Riot accounts.
