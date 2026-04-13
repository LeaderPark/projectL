# Riot Verification File Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the public site serve the Riot verification token from `/riot.txt` with the exact required filename and contents.

**Architecture:** Keep the implementation file-backed by placing the token in `public/riot.txt` and teaching the public router to serve that single root-level path. This avoids broadening static file exposure while keeping the deployment artifact simple.

**Tech Stack:** Node.js built-in HTTP server, existing public-site router, Node test runner

---

### Task 1: Document the required route behavior with a failing test

**Files:**
- Modify: `tests/public-site-routes.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

```js
test("router serves the riot verification file from the site root", async () => {
  const response = await requestServer(createTestServer(), "/riot.txt");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "text/plain; charset=utf-8");
  assert.equal(response.body, "159d7677-a16d-4d0f-a9e1-86494c63ff8a");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because `/riot.txt` currently falls through to `404 not found`.

### Task 2: Add the minimal production change

**Files:**
- Modify: `scripts/Web/PublicSiteRouter.js`
- Create: `public/riot.txt`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write minimal implementation**

```js
if (req.method === "GET" && pathname === "/riot.txt") {
  serveAssetFile(res, path.join(assetsDir, "riot.txt"));
  return true;
}
```

Also extend the asset content type map so `.txt` returns `text/plain; charset=utf-8`.

**Step 2: Add the verification file**

Create `public/riot.txt` containing exactly:

```text
159d7677-a16d-4d0f-a9e1-86494c63ff8a
```

No extra text, no additional lines beyond the normal trailing newline in the file.

**Step 3: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

### Task 3: Verify the route end-to-end locally

**Files:**
- Modify: none
- Test: local runtime verification

**Step 1: Run the broader test suite if needed**

Run: `npm test`
Expected: PASS or existing unrelated failures only

**Step 2: Start the app and request the route**

Run: `node .`

Then verify:

Run: `Invoke-WebRequest http://127.0.0.1:8000/riot.txt | Select-Object -ExpandProperty Content`
Expected: `159d7677-a16d-4d0f-a9e1-86494c63ff8a`
