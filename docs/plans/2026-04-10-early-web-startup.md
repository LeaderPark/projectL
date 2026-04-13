# Early Web Startup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the HTTP server listen before Discord ready so public pages and callbacks stay reachable during bot startup.

**Architecture:** Extract the startup orchestration from `index.js` into a small bootstrap module with injectable dependencies. The new module will start the callback/public-site server immediately, then log in the Discord client, and only start readiness-dependent work after the ready event fires.

**Tech Stack:** Node.js CommonJS, Discord.js, built-in `node:test`

---

### Task 1: Lock the startup order with a failing test

**Files:**
- Create: `tests/app-runtime.test.js`
- Create: `scripts/AppRuntime.js`

**Step 1: Write the failing test**

Add a test that expects startup to call the HTTP server's `listen` method before Discord login resolves and before any ready-only work runs.

**Step 2: Run test to verify it fails**

Run: `node --test tests/app-runtime.test.js`
Expected: FAIL because the runtime bootstrap module does not exist yet.

**Step 3: Write minimal implementation**

Create a bootstrap module that:
- registers a ready handler
- starts the callback server immediately
- then calls `client.login(...)`

**Step 4: Run test to verify it passes**

Run: `node --test tests/app-runtime.test.js`
Expected: PASS

### Task 2: Move the process entrypoint onto the bootstrap module

**Files:**
- Modify: `index.js`
- Modify: `scripts/AppRuntime.js`

**Step 1: Refactor the current startup wiring**

Move the existing command loading, interaction handling, service creation, and startup sequencing into `scripts/AppRuntime.js`.

**Step 2: Keep behavior stable**

Preserve:
- slash-command loading
- interaction handling
- callback/public-site routes
- poller startup on ready
- deployment logging

**Step 3: Make `index.js` a thin entrypoint**

Keep `index.js` responsible only for building the default dependencies and invoking the bootstrap.

**Step 4: Run focused tests**

Run: `node --test tests/app-runtime.test.js tests/public-site-routes.test.js tests/callback-server.test.js`
Expected: PASS

### Task 3: Verify related availability protections still hold

**Files:**
- Test: `tests/deploy-assets.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Run the availability-focused suite**

Run: `node --test tests/app-runtime.test.js tests/public-site-routes.test.js tests/callback-server.test.js tests/deploy-assets.test.js`
Expected: PASS
