# Match Caret Centering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Center the expand/collapse caret in every shared match-row summary layout without disturbing the rest of the public match-card redesign work already in progress.

**Architecture:** Keep the existing match-row grid layouts intact and fix the issue at the shared caret element level. Lock the behavior with CSS-focused view assertions first, then make the smallest possible style change in `public/site.css` so default, public, and player match summaries all inherit the centered caret behavior.

**Tech Stack:** Node.js SSR views, static CSS in `public/site.css`, Node test runner with `assert`

---

### Task 1: Add a regression test for shared caret centering

**Files:**
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

Add an assertion in the shared public match summary CSS test that expects `.match-row__caret` to use centered horizontal alignment and no right margin in the base rule.

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the base `.match-row__caret` rule still uses `justify-self: end` and `margin-right: 18px`.

**Step 3: Write minimal implementation**

Do not change markup or layout-specific grid areas. Update only the shared `.match-row__caret` rule so its own cell centers the icon in both axes, then keep the player-specific override only if it still adds value after the shared rule changes.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

### Task 2: Verify no match-row layout regresses

**Files:**
- Modify: `public/site.css`
- Verify: `tests/public-site-views.test.js`

**Step 1: Run the focused suite after the CSS change**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS with the new caret-centering assertion and the existing player/public layout assertions still green.

**Step 2: Review the diff**

Confirm the patch only changes the shared caret alignment rule and any directly related expectation updates.

**Step 3: Commit only if requested**

If the user later asks for a commit, stage only the touched files for this caret-centering fix.
