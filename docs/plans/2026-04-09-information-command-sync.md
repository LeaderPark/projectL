# Information Command Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep `/정보` updated automatically whenever the bot is redeployed through the project deploy flow.

**Architecture:** The deploy script derives deployment metadata from Git and the current time, injects it into Docker Compose environment variables, and the bot formats those values inside `/정보` through a small shared utility. The command keeps a graceful fallback when the bot is launched without deploy metadata.

**Tech Stack:** Node.js, discord.js, PowerShell, Docker Compose, node:test

---

### Task 1: Lock the new behavior with tests

**Files:**
- Modify: `tests/deploy-assets.test.js`
- Modify: `tests/compose-assets.test.js`
- Create: `tests/deployment-info.test.js`
- Create: `tests/information-command.test.js`

**Step 1: Write the failing test**

Add assertions that require:
- a deployment info utility module,
- `/정보` to include commit/message/timestamp metadata,
- deploy wiring for new environment variables.

**Step 2: Run test to verify it fails**

Run: `node --test tests/deployment-info.test.js tests/information-command.test.js tests/deploy-assets.test.js tests/compose-assets.test.js`

Expected: FAIL because the utility module and deploy wiring do not exist yet.

**Step 3: Write minimal implementation**

Create the utility module and wire deploy + compose + command to it.

**Step 4: Run test to verify it passes**

Run the same command again and confirm all four test files pass.

**Step 5: Commit**

Commit message suggestion: `feat: sync info command with deploy metadata`

### Task 2: Add deployment metadata utility

**Files:**
- Create: `scripts/Utils/DeploymentInfo.js`

**Step 1: Write the failing test**

Require `readDeploymentInfo()` to return `version`, `commit`, `message`, and `deployedAt`, and require `formatDeploymentInfoMessage()` to produce a Korean summary with a fallback.

**Step 2: Run test to verify it fails**

Run: `node --test tests/deployment-info.test.js`

Expected: FAIL with `Cannot find module '../scripts/Utils/DeploymentInfo'`.

**Step 3: Write minimal implementation**

Read the new environment variables and `package.json`, then format the response as a simple multiline string.

**Step 4: Run test to verify it passes**

Run: `node --test tests/deployment-info.test.js`

Expected: PASS.

**Step 5: Commit**

Commit together with the command wiring once the feature is complete.

### Task 3: Replace the hard-coded `/정보` response

**Files:**
- Modify: `commands/components/infomation.js`

**Step 1: Write the failing test**

Require `/정보` to reply with deployment metadata when the environment variables are set.

**Step 2: Run test to verify it fails**

Run: `node --test tests/information-command.test.js`

Expected: FAIL because the command still returns the old hard-coded patch text.

**Step 3: Write minimal implementation**

Import the deployment info utility and reply with the formatted message.

**Step 4: Run test to verify it passes**

Run: `node --test tests/information-command.test.js`

Expected: PASS.

**Step 5: Commit**

Keep this in the same feature commit.

### Task 4: Inject deployment metadata during deploy

**Files:**
- Modify: `scripts/deploy.ps1`
- Modify: `compose.yaml`

**Step 1: Write the failing test**

Require `scripts/deploy.ps1` to gather Git metadata and export the three deployment environment variables, and require `compose.yaml` to pass them into the bot container.

**Step 2: Run test to verify it fails**

Run: `node --test tests/deploy-assets.test.js tests/compose-assets.test.js`

Expected: FAIL because the new variables are not present yet.

**Step 3: Write minimal implementation**

Set:
- `BOT_DEPLOY_COMMIT` from `git rev-parse --short HEAD`
- `BOT_DEPLOY_MESSAGE` from `git log -1 --pretty=%s`
- `BOT_DEPLOYED_AT` from the current UTC ISO timestamp

Then forward them in `compose.yaml`.

**Step 4: Run test to verify it passes**

Run: `node --test tests/deploy-assets.test.js tests/compose-assets.test.js`

Expected: PASS.

**Step 5: Commit**

Keep this in the same feature commit.

### Task 5: Run regression verification

**Files:**
- Modify: none
- Test: `tests/*.test.js`

**Step 1: Run targeted tests**

Run: `node --test tests/deployment-info.test.js tests/information-command.test.js tests/deploy-assets.test.js tests/compose-assets.test.js`

Expected: PASS.

**Step 2: Run full suite**

Run: `npm test`

Expected: PASS with no new failures.

**Step 3: Commit**

Commit message suggestion: `feat: sync info command with deploy metadata`
