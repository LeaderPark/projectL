# Player Page Refresh Button Placement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the player-page Riot nickname refresh button next to the registered Riot nickname heading and style it to match the sidebar UI.

**Architecture:** The change stays server-rendered. `scripts/Web/views/PlayerPage.js` will emit a small header row that pairs the section title with the existing refresh form, and `public/site.css` will provide the compact action-button styling plus responsive wrapping behavior. Tests will assert the new markup so the placement stays stable.

**Tech Stack:** Node.js server-rendered views, plain HTML forms, CSS, Node test runner

---

### Task 1: Lock the new markup with a failing view test

**Files:**
- Modify: `tests/public-site-views.test.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

Add assertions that the rendered player page includes:
- `player-page__section-header`
- `player-page__section-action`
- `player-page__refresh-button`

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the old markup does not emit the new class names.

**Step 3: Commit**

Skip commit for now because this task is part of one small local change set.

### Task 2: Implement the section-header layout and button styling

**Files:**
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `public/site.css`
- Test: `tests/public-site-views.test.js`

**Step 1: Write minimal implementation**

- Wrap the section title and refresh form in a shared header container.
- Add semantic class names for the header row, form, and button.
- Style the header row as a flexible, wrapping layout.
- Style the button as a compact pill with hover and focus-visible states that fit the sidebar card.

**Step 2: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

**Step 3: Commit**

Skip commit for now because this task is part of one small local change set.

### Task 3: Verify no regressions in the player page rendering path

**Files:**
- Test: `tests/public-site-views.test.js`

**Step 1: Run focused verification**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS with the updated player-page coverage still green.

**Step 2: Commit**

Skip commit for now because this task is part of one small local change set.
