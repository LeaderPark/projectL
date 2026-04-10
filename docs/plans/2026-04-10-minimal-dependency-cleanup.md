# Minimal Dependency Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the highest-risk direct dependencies with minimal behavior risk and remove the unused development watcher dependency.

**Architecture:** This is a package-level maintenance change. Dependency versions will be updated through npm so manifest and lockfile stay aligned, then the existing automated suite will be used as the regression signal for runtime behavior.

**Tech Stack:** Node.js, npm, axios, mysql2, node:test

---

### Task 1: Lock the approved scope in documentation

**Files:**
- Create: `docs/plans/2026-04-10-minimal-dependency-cleanup-design.md`
- Create: `docs/plans/2026-04-10-minimal-dependency-cleanup.md`

**Step 1: Write the scope note**

Document that this pass upgrades `axios`, upgrades `mysql2`, removes `nodemon`, and intentionally leaves `discord.js` for a later pass.

**Step 2: Keep the plan minimal**

Write only the verification and rollout steps needed for this maintenance update.

### Task 2: Update the approved dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Upgrade `axios`**

Run: `npm install axios@^1.15.0`

Expected: `package.json` and `package-lock.json` update to the latest stable `1.x` release.

**Step 2: Upgrade `mysql2`**

Run: `npm install mysql2@^3.21.1`

Expected: `package.json` and `package-lock.json` update to the latest stable `3.x` release.

**Step 3: Remove `nodemon`**

Run: `npm uninstall nodemon`

Expected: `nodemon` disappears from `package.json`, `package-lock.json`, and `node_modules`.

### Task 3: Verify the cleanup

**Files:**
- Verify only

**Step 1: Confirm installed versions**

Run: `npm ls axios mysql2 nodemon picomatch --all`

Expected: `axios` and `mysql2` resolve to the new versions, `nodemon` is absent, and `picomatch` remains on `2.3.2`.

**Step 2: Run the full test suite**

Run: `npm test`

Expected: PASS with zero failing tests.

**Step 3: Re-run the audit**

Run: `npm audit --json`

Expected: vulnerabilities tied to `axios`, `mysql2`, `nodemon`, and their known transitive paths are gone or reduced; any remaining issues are documented for a follow-up pass.
