# Ranking Top3 Emphasis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep leaderboard ranks `#1`, `#2`, and `#3` visually special on the ranking page while removing the `TOP` label and making the presentation feel more cohesive.

**Architecture:** The change stays inside the server-rendered ranking page. `scripts/Web/views/RankingPage.js` will keep the top-three-specific row and badge hooks but simplify the badge content, and `public/site.css` will soften the podium styling so it better matches the rest of the dark table UI. Regression coverage will live in `tests/public-site-views.test.js`.

**Tech Stack:** Node.js server-rendered HTML, shared `public/site.css` styling, Node test runner with `assert`.

---

### Task 1: Lock the softer podium markup contract with failing tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Reference: `scripts/Web/views/RankingPage.js`

**Step 1: Write the failing test**

Add assertions that:
- top-three rows receive distinct row classes
- top-three ranks still render a nested badge element
- the ranking page no longer renders the `TOP` label
- lower ranks stay as plain text

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js --test-name-pattern "renderRankingPage|ranking page styles"`

Expected: FAIL because the ranking page still renders the `TOP` label inside the podium badge.

**Step 3: Write minimal implementation**

Do not implement yet in this task. The failure should define the required HTML contract first.

**Step 4: Run test to verify it still fails correctly**

Run the same command and confirm the failure is specifically about missing top-three classes or badge markup.

### Task 2: Implement the simplified top-three ranking markup

**Files:**
- Modify: `scripts/Web/views/RankingPage.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Write the minimal implementation**

Update `renderRankingRows` so that:
- rows `0..2` receive top-three row classes
- the first cell renders a badge wrapper with a dedicated badge class and number-only content
- rows `3+` keep the current plain rank rendering

**Step 2: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js --test-name-pattern "renderRankingPage"`

Expected: PASS for the ranking page markup assertions.

**Step 3: Refactor for clarity**

Keep the top-three logic local and explicit. Prefer a small helper or clear conditional variables over deeply nested template literals.

### Task 3: Lock the softened podium styling contract with CSS assertions

**Files:**
- Modify: `tests/public-site-views.test.js`
- Reference: `public/site.css`

**Step 1: Write the failing test**

Add assertions that:
- `public/site.css` defines top-three row selectors
- top-three badge selectors exist
- mobile overrides exist for badge sizing or padding

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js --test-name-pattern "ranking page styles"`

Expected: PASS if the existing selectors remain present, then refine only if the style hooks change.

### Task 4: Implement the softened podium styling

**Files:**
- Modify: `public/site.css`
- Test: `tests/public-site-views.test.js`

**Step 1: Write minimal implementation**

Add:
- softer top-three row background and border accent styles
- podium badge styling for gold, silver, and bronze with reduced padding and shadow weight
- a cleaner hover treatment that does not overpower the rest of the table
- responsive reductions under the existing mobile breakpoint

**Step 2: Run targeted tests**

Run: `node --test tests/public-site-views.test.js --test-name-pattern "renderRankingPage|ranking page styles"`

Expected: PASS.

**Step 3: Run broader regression**

Run: `node --test tests/public-site-views.test.js`

Expected: PASS with zero failures.

### Task 5: Final verification

**Files:**
- Verify only

**Step 1: Run full verification**

Run: `node --test tests/public-site-views.test.js`

Expected: PASS.

**Step 2: Review diff**

Confirm the diff is limited to:
- `scripts/Web/views/RankingPage.js`
- `public/site.css`
- `tests/public-site-views.test.js`
- the refreshed plan/design docs

**Step 3: Report outcome**

Summarize the markup, styling, and verification results without claiming anything not directly verified.
