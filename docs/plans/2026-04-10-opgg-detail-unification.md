# OP.GG Detail Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make both the inline match-detail panel and the dedicated match-detail page render the same OP.GG-like tabbed team-detail layout and information density.

**Architecture:** Keep the existing server-rendered public site, but move the detailed match table markup into shared view helpers so the inline and dedicated surfaces stay visually and structurally aligned. Extend the formatter only where the view needs extra summary data, then update the CSS to support the denser OP.GG-style table, tab strip, and team-total bars on both desktop and mobile.

**Tech Stack:** Node.js SSR views, plain HTML/CSS/JS, `node:test`

---

### Task 1: Lock the unified detail contract in tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Modify: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

Add assertions that both renderers expose the same tab labels, team table shell, stat headers, and total bars.

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`

Expected: FAIL because the dedicated detail page still renders a separate card layout instead of the shared OP.GG-like table shell.

**Step 3: Write minimal implementation**

Refactor the views so both paths render the shared detail module.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`

Expected: PASS

### Task 2: Share the detailed match table renderer

**Files:**
- Modify: `scripts/Web/views/ViewHelpers.js`
- Modify: `scripts/Web/views/MatchDetailPage.js`

**Step 1: Write the failing test**

Add assertions that the dedicated page uses the same team table row structure, tab strip, and item/spell/rune cells as the inline detail panel.

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`

Expected: FAIL on the dedicated page markup assertions.

**Step 3: Write minimal implementation**

Extract shared render helpers for:
- tab buttons and panel switching targets
- OP.GG-like scoreboard rows
- team headers with kill totals
- summary/team-analysis/build/other panels

Make the dedicated page render the same shared panels in an always-open shell.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`

Expected: PASS

### Task 3: Restyle both detailed surfaces to match the OP.GG rhythm

**Files:**
- Modify: `public/site.css`
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

Add CSS assertions for:
- full-width tab strip styling
- scoreboard header columns
- team-total comparison bar
- dedicated detail wrapper layout

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`

Expected: FAIL because the stylesheet does not yet define the new shared selectors.

**Step 3: Write minimal implementation**

Update the stylesheet to support the denser OP.GG-like layout while preserving responsive collapse rules.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`

Expected: PASS

### Task 4: Verify the public site paths end-to-end

**Files:**
- Modify: `scripts/Web/views/ViewHelpers.js` (if any cleanup remains)
- Modify: `scripts/Web/views/MatchDetailPage.js` (if any cleanup remains)
- Modify: `public/site.css` (if any cleanup remains)

**Step 1: Run focused verification**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js tests/public-site-service.test.js`

Expected: PASS

**Step 2: Run broader regression verification**

Run: `npm test`

Expected: PASS
