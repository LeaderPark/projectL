# Public Match Card Action Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the public match detail link into a top-right `상세 보기` button and keep the expand chevron fixed in place while it rotates on open and close.

**Architecture:** Adjust the server-rendered match-card markup so the card owns a dedicated action area above the summary body. Keep the expand toggle in the current right-side summary track, but render the chevron as CSS-driven lines inside a fixed-size wrapper so only the icon rotation changes.

**Tech Stack:** Node.js CommonJS views, SSR HTML string templates, `public/site.css`, `node:test`

---

### Task 1: Lock the requested UI in tests

**Files:**
- Modify: `tests/public-site-views.test.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

Add assertions that `renderMatchCard()` outputs a top-right action wrapper, a `상세 보기` link button, and a chevron element structure without the old `링크` label.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/public-site-views.test.js`

Expected: FAIL because the current markup still renders `링크` inline and uses the old caret text glyph.

### Task 2: Update the card markup

**Files:**
- Modify: `scripts/Web/views/ViewHelpers.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Add the top-right detail action**

Render a dedicated action wrapper inside each match card and move the detail link into it with the text `상세 보기`.

**Step 2: Replace the caret glyph with structural chevron markup**

Keep the chevron in the current right-side summary slot, but render it as nested spans so CSS can control its look and rotation.

**Step 3: Run test to verify it passes**

Run: `npm test -- tests/public-site-views.test.js`

Expected: The new HTML assertions pass while existing match-card rendering tests stay green.

### Task 3: Style the new actions

**Files:**
- Modify: `public/site.css`
- Test: `tests/public-site-views.test.js`

**Step 1: Reserve top-right action space on the card**

Add card-level positioning and summary padding so the new `상세 보기` button sits in the container's upper-right corner without overlapping the content.

**Step 2: Style the detail button and chevron**

Give the detail link a rounded rectangular button treatment. Style the chevron as two angled strokes inside a fixed square wrapper and rotate only the inner icon when expanded.

**Step 3: Run tests to verify they pass**

Run: `npm test -- tests/public-site-views.test.js`

Expected: PASS
