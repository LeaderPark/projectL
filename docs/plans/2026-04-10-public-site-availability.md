# Public Site Availability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce transient public-site asset failures by caching versioned static files aggressively and avoiding full-stack shutdowns during deploy.

**Architecture:** Keep the existing single Node public-site server, but switch versioned `/public/*` assets to immutable caching so browsers and proxies can reuse them during brief origin interruptions. Update the Windows deployment entrypoints to recreate services in place instead of tearing the full Compose stack down first, which shortens visible downtime for asset requests.

**Tech Stack:** Node.js HTTP server, PowerShell, Windows batch, Docker Compose, node:test

---

### Task 1: Lock the asset caching behavior with tests

**Files:**
- Modify: `tests/public-site-routes.test.js`
- Modify: `scripts/Web/PublicSiteRouter.js`

**Step 1: Write the failing test**

```js
test("router serves versioned public assets with immutable caching", async () => {
  const response = await requestServer(createTestServer(), "/public/site.css");
  assert.equal(response.headers["cache-control"], "public, max-age=31536000, immutable");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because the router still serves assets with `Cache-Control: no-store`.

**Step 3: Write minimal implementation**

```js
res.writeHead(200, {
  "Content-Type": contentType,
  "Cache-Control": "public, max-age=31536000, immutable",
});
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

### Task 2: Lock the deploy flow with tests

**Files:**
- Modify: `tests/deploy-assets.test.js`
- Modify: `scripts/deploy.ps1`
- Modify: `deploy.bat`
- Modify: `README.md`

**Step 1: Write the failing test**

```js
test("deploy script recreates compose services without a full compose down", () => {
  const script = fs.readFileSync("scripts/deploy.ps1", "utf8");
  assert.doesNotMatch(script, /docker compose down/);
  assert.match(script, /docker compose up -d --build/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/deploy-assets.test.js`
Expected: FAIL because the deploy assets still use `docker compose down`.

**Step 3: Write minimal implementation**

```powershell
docker compose up -d --build --remove-orphans
```

```bat
powershell -ExecutionPolicy Bypass -File ".\scripts\deploy.ps1"
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/deploy-assets.test.js`
Expected: PASS

### Task 3: Verify the focused regression suite

**Files:**
- Test: `tests/public-site-routes.test.js`
- Test: `tests/deploy-assets.test.js`

**Step 1: Run focused verification**

Run: `node --test tests/public-site-routes.test.js tests/deploy-assets.test.js`
Expected: PASS
