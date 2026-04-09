# Public Site Ranking Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated `/:guildId/ranking` page that shows every ranked player on the public site using the existing ranking model and UI style.

**Architecture:** Extend the current public-site router and handler set with a ranking page renderer, then add a new server-rendered view that reuses the public leaderboard formatter output. Keep the existing home-page preview limited, but let the ranking page request the full leaderboard and render it in a dedicated panel with shared navigation.

**Tech Stack:** Node.js, server-rendered HTML views, shared public-site view helpers, Node test runner

---

### Task 1: Lock in the ranking-page contract with tests

**Files:**
- Modify: `tests/public-site-routes.test.js`
- Modify: `tests/public-site-service.test.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

```js
test("router serves the guild-scoped ranking page", async () => {
  const response = await requestServer(createTestServer(), "/123456789/ranking");
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /전체 랭킹 123456789/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: FAIL because the router, handlers, and views do not expose a ranking page yet.

**Step 3: Write minimal implementation**

```js
if (scopedPath === "/ranking") {
  sendHtml(res, 200, await renderRankingPage(serverId));
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/public-site-routes.test.js tests/public-site-service.test.js tests/public-site-views.test.js
git commit -m "test: cover public ranking page"
```

### Task 2: Add ranking rendering to the public-site handlers and router

**Files:**
- Modify: `scripts/Web/PublicSiteRouter.js`
- Modify: `scripts/Web/PublicSite.js`
- Modify: `scripts/Utils/Query.js`

**Step 1: Write the failing test**

```js
assert.deepEqual(seenGuildIds, ["guild-9"]);
assert.match(html, /전체 랭킹/);
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js tests/public-site-routes.test.js`
Expected: FAIL because the ranking handler is missing and the router does not dispatch to it.

**Step 3: Write minimal implementation**

```js
async renderRankingPage(routeGuildId) {
  const guildId = await getGuildId(routeGuildId);
  const leaderboardResult = await resolvedGetPublicLeaderboard(guildId);
  return renderRankingPage({ guildId, ranking: leaderboardResult.data.map(formatLeaderboardEntry) });
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js tests/public-site-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/PublicSiteRouter.js scripts/Web/PublicSite.js scripts/Utils/Query.js
git commit -m "feat: add public ranking page handler"
```

### Task 3: Build the dedicated ranking page and shared navigation link

**Files:**
- Add: `scripts/Web/views/RankingPage.js`
- Modify: `scripts/Web/views/Layout.js`
- Modify: `public/site.css`

**Step 1: Write the failing test**

```js
test("renderRankingPage renders the full public ranking table", () => {
  const html = renderRankingPage({ guildId: "123456789", ranking: [{ discordId: "1", name: "Alpha", recordText: "7승 3패", winRateText: "70%" }] });
  assert.match(html, /전체 랭킹/);
  assert.match(html, /\/123456789\/players\/1/);
  assert.match(html, /\/123456789\/ranking/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the ranking page view and header link do not exist.

**Step 3: Write minimal implementation**

```js
<a href="${buildGuildPath(guildId, "/ranking")}">랭킹</a>
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/views/RankingPage.js scripts/Web/views/Layout.js public/site.css
git commit -m "feat: add public ranking page view"
```

### Task 4: Run the targeted regression suite

**Files:**
- Test: `tests/public-site-routes.test.js`
- Test: `tests/public-site-service.test.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Run the tests**

Run: `node --test tests/public-site-routes.test.js tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: PASS

**Step 2: Commit**

```bash
git add scripts/Web/PublicSiteRouter.js scripts/Web/PublicSite.js scripts/Web/views/RankingPage.js scripts/Web/views/Layout.js public/site.css tests/public-site-routes.test.js tests/public-site-service.test.js tests/public-site-views.test.js docs/plans/2026-04-10-public-site-ranking-page-design.md docs/plans/2026-04-10-public-site-ranking-page.md
git commit -m "feat: add public ranking page"
```
