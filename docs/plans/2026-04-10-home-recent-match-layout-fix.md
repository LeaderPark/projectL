# Home Recent Match Layout Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the home-page recent match summary locked to a horizontal two-team layout while preventing score and KDA text from overflowing narrow cards.

**Architecture:** Treat the home-page summary as a compact public layout instead of relying on viewport-wide breakpoints. Keep the existing HTML structure, then tighten the public-summary CSS so the parent grid can shrink and the per-team stat block reflows inside each card.

**Tech Stack:** Node.js CommonJS views, SSR HTML string templates, `public/site.css`, `node:test`

---

### Task 1: Lock the regression with tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

Add assertions that the public summary button no longer depends on a large fixed minimum width and that the compact team player layout keeps the stat content in a dedicated right-side stack.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/public-site-views.test.js`

Expected: FAIL because the CSS still uses the oversized public summary min width and the team summary player row is not yet compact.

### Task 2: Implement the minimal CSS fix

**Files:**
- Modify: `public/site.css`
- Test: `tests/public-site-views.test.js`

**Step 1: Update the public summary grid**

Remove the large fixed minimum width from the public summary button and ensure its grid children can shrink with `minmax(0, 1fr)` and `min-width: 0`.

**Step 2: Reflow the team player summary stats**

Keep the two team cards side-by-side, but turn the score/KDA area into a stacked right-side block so long text stays inside the card.

**Step 3: Run tests to verify they pass**

Run: `npm test -- tests/public-site-views.test.js`

Expected: PASS
