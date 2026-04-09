# ProjectL One-Click Deploy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a double-clickable Windows deployment entrypoint that pulls the latest code, restarts the Docker Compose stack, reports status clearly, and keeps the terminal window open until the operator acknowledges completion.

**Architecture:** A new batch launcher provides the desktop-friendly entrypoint while a PowerShell script owns deployment logic and safety checks. The implementation stays aligned with the existing `bootstrap` and `verify` scripts so operators get one consistent workflow.

**Tech Stack:** Windows batch, PowerShell, Git, Docker Compose, Node.js, node:test

---

### Task 1: Deployment asset tests

**Files:**
- Create: `tests/deploy-assets.test.js`
- Modify: `tests/package-scripts.test.js`
- Test: `tests/deploy-assets.test.js`
- Test: `tests/package-scripts.test.js`

**Step 1: Write the failing test**

```js
test("deploy launcher waits for operator input after the PowerShell script finishes", () => {
  const batchFile = readFileSync("deploy.bat", "utf8");

  assert.match(batchFile, /powershell/i);
  assert.match(batchFile, /set \/p/i);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/deploy-assets.test.js tests/package-scripts.test.js`
Expected: FAIL because `deploy.bat`, `scripts/deploy.ps1`, and the `deploy` package script do not exist yet.

**Step 3: Write minimal implementation**

```bat
@echo off
powershell -ExecutionPolicy Bypass -File ".\scripts\deploy.ps1"
set /p _="Press Enter to close..."
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/deploy-assets.test.js tests/package-scripts.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/deploy-assets.test.js tests/package-scripts.test.js deploy.bat scripts/deploy.ps1 package.json
git commit -m "test: add one-click deployment asset coverage"
```

### Task 2: Deployment orchestration

**Files:**
- Create: `deploy.bat`
- Create: `scripts/deploy.ps1`
- Modify: `package.json`

**Step 1: Write the failing test**

```js
test("deploy script performs fast-forward pull and compose restart", () => {
  const ps1 = readFileSync("scripts/deploy.ps1", "utf8");

  assert.match(ps1, /git pull --ff-only/);
  assert.match(ps1, /docker compose down/);
  assert.match(ps1, /docker compose up -d --build/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/deploy-assets.test.js`
Expected: FAIL because the deploy script does not exist yet.

**Step 3: Write minimal implementation**

```powershell
git pull --ff-only
docker compose down
docker compose up -d --build
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/deploy-assets.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add deploy.bat scripts/deploy.ps1 package.json tests/deploy-assets.test.js
git commit -m "feat: add one-click deployment flow"
```

### Task 3: Operator documentation

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

```js
test("README documents the one-click deploy entrypoint", () => {
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /deploy\.bat/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/deploy-assets.test.js`
Expected: FAIL because the README does not mention the deployment launcher yet.

**Step 3: Write minimal implementation**

```md
## One-Click Deploy

Run `deploy.bat` on the Windows host to pull and redeploy the stack.
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/deploy-assets.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md tests/deploy-assets.test.js
git commit -m "docs: add one-click deploy instructions"
```
