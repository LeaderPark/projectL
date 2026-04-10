# Player Page Main Match Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the player page show recent matches as the primary main-column content and move champion, teammate, and lane summaries into a right-side supporting panel.

**Architecture:** Keep the existing player hero and data formatters unchanged. Only reshape the player page view markup and add page-specific CSS so the same data is presented with a stronger information hierarchy.

**Tech Stack:** Node.js server-rendered HTML views, shared site CSS, Node test runner

---

### Task 1: Lock in the desired player-page structure with tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Reference: `scripts/Web/views/PlayerPage.js`
- Reference: `public/site.css`

**Step 1: Write the failing test**

```js
assert.match(html, /player-page__shell/);
assert.match(html, /player-page__main/);
assert.match(html, /player-page__sidebar/);
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the player page still uses the old paired `content-grid` layout.

**Step 3: Add CSS expectations for the dedicated shell**

```js
assert.match(
  css,
  /\.player-page__shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.32fr\)\s+minmax\(280px,\s*0\.68fr\);/
);
```

**Step 4: Run test to verify it fails for the CSS rule**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the new player-page layout classes are not defined yet.

### Task 2: Implement the player page main/sidebar layout

**Files:**
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `public/site.css`
- Test: `tests/public-site-views.test.js`

**Step 1: Write minimal markup changes**

```js
<section class="player-page__shell">
  <section class="panel panel--timeline player-page__main">...</section>
  <aside class="panel player-page__sidebar">...</aside>
</section>
```

**Step 2: Run the targeted test**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL or partial progress until the CSS classes are added.

**Step 3: Add the minimal CSS**

```css
.player-page__shell {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(280px, 0.68fr);
}
```

**Step 4: Run the targeted test again**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

### Task 3: Verify the player page layout change end-to-end

**Files:**
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `public/site.css`
- Modify: `tests/public-site-views.test.js`

**Step 1: Run the focused public-site test suite**

Run: `node --test tests/public-site-views.test.js tests/public-site-formatter.test.js`
Expected: PASS

**Step 2: Inspect for unrelated regressions**

Run: `git diff -- scripts/Web/views/PlayerPage.js public/site.css tests/public-site-views.test.js`
Expected: Only the intended player page view, styling, and test changes appear.

**Step 3: Commit when the worktree is ready**

```bash
git add docs/plans/2026-04-10-player-page-main-match-design.md docs/plans/2026-04-10-player-page-main-match.md tests/public-site-views.test.js scripts/Web/views/PlayerPage.js public/site.css
git commit -m "feat: prioritize recent matches on player page"
```
