# Local Rebuild Deploy Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `deploy.bat` and `scripts/deploy.ps1` rebuild the current local workspace without blocking on git cleanliness or pulling remote changes first.

**Architecture:** Keep the existing deploy entrypoint and compose-based redeploy flow, but remove the git guardrails that force a clean tree and the remote fast-forward pull step. Update deploy-facing tests and README wording to describe "rebuild current local checkout" instead of "pull latest changes".

**Tech Stack:** Windows batch, PowerShell, Docker Compose, Node.js test runner

---

### Task 1: Update deploy-flow expectations

**Files:**
- Modify: `tests/deploy-assets.test.js`
- Modify: `README.md`

**Step 1: Write the failing test**

Change the deploy-flow test so it expects:
- no `git status --porcelain`
- no `git pull --ff-only`
- continued metadata collection and compose rebuild behavior

Adjust the README expectation so it describes local rebuild behavior instead of pulling latest git changes.

**Step 2: Run test to verify it fails**

Run: `node --test tests/deploy-assets.test.js`
Expected: FAIL because the current deploy script still checks git status and pulls latest changes.

**Step 3: Write minimal implementation**

Update the README deploy section to explain that `deploy.bat` rebuilds whatever is currently checked out locally.

**Step 4: Run test to verify it still fails on script behavior**

Run: `node --test tests/deploy-assets.test.js`
Expected: FAIL only because the deploy script still contains git-based guardrails.

### Task 2: Remove git gate from deploy script

**Files:**
- Modify: `scripts/deploy.ps1`

**Step 1: Write minimal implementation**

Remove:
- `Require-Command -Name "git"`
- working-tree status checks
- `git pull --ff-only`

Keep:
- `.env` checks
- deployment metadata
- compose config validation
- `docker compose up -d --build --remove-orphans`
- service-status checks
- slash-command refresh

**Step 2: Run targeted tests**

Run: `node --test tests/deploy-assets.test.js`
Expected: PASS

### Task 3: Verify the final behavior

**Files:**
- Verify: `tests/deploy-assets.test.js`
- Verify: `tests/package-scripts.test.js`

**Step 1: Run final verification**

Run: `node --test tests/deploy-assets.test.js tests/package-scripts.test.js`
Expected: PASS with 0 failures
