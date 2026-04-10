# Minimal Scoreboard Detail Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make only the inline opened scoreboard compact while keeping the dedicated match detail page on the full stat-rich layout.

**Architecture:** Keep one shared scoreboard helper, but add a rendering mode so inline match cards can use a compact three-column layout while the dedicated page keeps the original seven-column layout and totals block. Update the stylesheet to support both layouts without duplicating the rest of the card styling.

**Tech Stack:** Node.js CommonJS SSR views, `public/site.css`, `node:test`

---

### Task 1: Lock the split scoreboard contract in tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Modify: `tests/public-site-routes.test.js`
- Modify: `tests/public-site-service.test.js`
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-routes.test.js`
- Test: `tests/public-site-service.test.js`

**Step 1: Write the failing test**

Keep the inline opened panel assertions compact, but restore the dedicated detail page assertions so they expect the extra stat headers, total comparison block, and item-build markup.

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js tests/public-site-service.test.js`

Expected: FAIL because the current implementation makes both surfaces compact.

### Task 2: Split the shared scoreboard renderer into compact and full modes

**Files:**
- Modify: `scripts/Web/views/ViewHelpers.js`
- Modify: `scripts/Web/views/MatchDetailPage.js` (only if helper options need to be passed explicitly)
- Test: `tests/public-site-views.test.js`

**Step 1: Write minimal implementation**

Restore the full scoreboard helpers and add a mode option so inline detail sections render the compact version while the dedicated detail shell renders the full version.

**Step 2: Run tests to verify they pass**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js tests/public-site-service.test.js`

Expected: PASS

### Task 3: Support both scoreboard layouts in CSS

**Files:**
- Modify: `public/site.css`
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the minimal CSS update**

Restore the full scoreboard grid as the default style, then add a compact modifier for the inline opened panel so it can collapse to three columns without affecting the dedicated page.

**Step 2: Run tests to verify they pass**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js tests/public-site-service.test.js`

Expected: PASS
