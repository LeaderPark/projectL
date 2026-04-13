# Public Site Server Id Guard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent unregistered server ids from entering the public site from the home input, and redirect direct invalid scoped URLs back to `/`.

**Architecture:** Add a small public validation endpoint that answers whether a server id is registered, reuse the same registration check in the scoped router to guard direct URL access, and update the landing-page script to validate before navigation. Keep the existing numeric-format validation in the browser and layer registration validation on top so the UX stays immediate.

**Tech Stack:** Node.js HTTP server, server-rendered public site router, vanilla browser JavaScript, Node test runner

---

### Task 1: Router registration guard

**Files:**
- Modify: `scripts/Web/PublicSiteRouter.js`
- Modify: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

Add route tests for:
- `GET /api/server-validation?serverId=...` returning `{ registered: true|false }`
- `GET /<unregistered-server-id>` returning `302` with `Location: /`

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because the router does not expose the validation endpoint or redirect invalid scoped routes.

**Step 3: Write minimal implementation**

Add an optional `isRegisteredServerId(serverId)` dependency to the public router, serve a root validation JSON endpoint, and redirect scoped numeric requests to `/` when the id is not registered.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

### Task 2: Landing-page submit validation

**Files:**
- Modify: `public/site.js`
- Modify: `scripts/Web/views/LandingPage.js`
- Add: `tests/public-site-client.test.js`

**Step 1: Write the failing test**

Add a browser-script test that submits the landing form with:
- a registered numeric server id and expects navigation
- an unregistered numeric server id and expects an alert without navigation

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-client.test.js`
Expected: FAIL because the current script navigates immediately after numeric validation.

**Step 3: Write minimal implementation**

Expose the validation endpoint path through the landing form dataset, fetch registration status on submit, redirect only when the id is registered, and show an alert when the id is missing from the registered server list.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-client.test.js`
Expected: PASS

### Task 3: Final verification

**Files:**
- Verify: `tests/public-site-routes.test.js`
- Verify: `tests/public-site-client.test.js`

**Step 1: Run targeted verification**

Run: `node --test tests/public-site-routes.test.js tests/public-site-client.test.js`
Expected: PASS with 0 failures

**Step 2: Run broader regression coverage**

Run: `node --test tests/public-site-views.test.js tests/public-site-service.test.js`
Expected: PASS with 0 failures
