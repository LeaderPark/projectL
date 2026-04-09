# Public Site Result Visibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show match win/loss results only on player pages and hide them everywhere else on the public ProjectL site.

**Architecture:** Keep match result data in the existing formatter output so the application still knows which side won, but make result text rendering conditional in the shared view helpers and match detail page. Public pages will opt out of result labels, while the player page will explicitly opt in.

**Tech Stack:** Node.js, server-rendered HTML views, Node test runner, strict assertion tests

---

### Task 1: Document the rendering policy in tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Modify: `tests/public-site-service.test.js`

**Step 1: Write the failing test**

```js
test("renderMatchesPage hides result labels from the public timeline", () => {
  const html = renderMatchesPage({ guildId: "123", cards: [sampleCard] });
  assert.doesNotMatch(html, /승리/);
  assert.doesNotMatch(html, /패배/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-service.test.js`
Expected: FAIL because the shared card renderer still prints `승리` and `패배` on public pages.

**Step 3: Write minimal implementation**

```js
renderMatchCard({ ...card, showResult: false });
renderMatchCard({ ...card, showResult: true });
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js tests/public-site-service.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/public-site-views.test.js tests/public-site-service.test.js
git commit -m "test: cover player-only result visibility"
```

### Task 2: Make shared match cards hide result text by default

**Files:**
- Modify: `scripts/Web/views/ViewHelpers.js`
- Modify: `scripts/Web/views/HomePage.js`
- Modify: `scripts/Web/views/MatchesPage.js`
- Modify: `scripts/Web/views/PlayerPage.js`

**Step 1: Write the failing test**

```js
assert.match(playerHtml, /승리/);
assert.doesNotMatch(homeHtml, /승리/);
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-service.test.js`
Expected: FAIL because all pages currently share the same always-on result labels.

**Step 3: Write minimal implementation**

```js
function renderMatchCard(card, options = {}) {
  const showResult = options.showResult === true;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js tests/public-site-service.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/views/ViewHelpers.js scripts/Web/views/HomePage.js scripts/Web/views/MatchesPage.js scripts/Web/views/PlayerPage.js
git commit -m "feat: limit result labels to player pages"
```

### Task 3: Hide result labels on the match detail page

**Files:**
- Modify: `scripts/Web/views/MatchDetailPage.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

```js
test("renderMatchDetailPage hides result labels on the public detail page", () => {
  const html = renderMatchDetailPage({ guildId: "123", match: sampleMatchDetail });
  assert.doesNotMatch(html, /승리/);
  assert.doesNotMatch(html, /패배/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the detail page header currently includes `team.resultText`.

**Step 3: Write minimal implementation**

```js
<span>${escapeHtml(team.totalKillsText)}킬</span>
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/views/MatchDetailPage.js tests/public-site-views.test.js
git commit -m "feat: hide result labels from public match detail"
```

### Task 4: Run the targeted regression suite

**Files:**
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-service.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Run the tests**

Run: `node --test tests/public-site-views.test.js tests/public-site-service.test.js tests/public-site-routes.test.js`
Expected: PASS

**Step 2: Commit**

```bash
git add scripts/Web/views/ViewHelpers.js scripts/Web/views/HomePage.js scripts/Web/views/MatchesPage.js scripts/Web/views/PlayerPage.js scripts/Web/views/MatchDetailPage.js tests/public-site-views.test.js tests/public-site-service.test.js tests/public-site-routes.test.js docs/plans/2026-04-09-public-site-result-visibility-design.md docs/plans/2026-04-09-public-site-result-visibility.md
git commit -m "feat: show results only on player pages"
```
