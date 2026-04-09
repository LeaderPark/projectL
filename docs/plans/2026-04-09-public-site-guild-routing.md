# Public Site Guild Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change the public record site so `/` shows only a Discord server-id entry page and all actual public record pages run under `/:serverId`.

**Architecture:** Keep the existing callback server and SSR rendering stack. Move guild selection into the route layer, add a dedicated landing-page renderer for `/`, and thread `serverId` through the public-site handlers so every match, player, search, and navigation path stays scoped to the active guild.

**Tech Stack:** Node.js, node:test, lightweight HTTP server, server-rendered HTML, static CSS/JS

---

### Task 1: Add failing route coverage for the new root page and guild-prefixed routes

**Files:**
- Modify: `tests/public-site-routes.test.js`
- Modify: `scripts/Web/PublicSiteRouter.js`

**Step 1: Write the failing test**

```js
test("router serves the landing page at root", async () => {
  const response = await requestServer(createTestServer(), "/");
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /서버 아이디/);
});

test("router serves the guild-scoped home page", async () => {
  const response = await requestServer(createTestServer(), "/guild-1");
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /guild-1/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because the router still treats `/` as the public home page and does not recognize guild-prefixed routes.

**Step 3: Write minimal implementation**

```js
if (pathname === "/") {
  sendHtml(res, 200, renderLandingPage());
  return true;
}

const [serverId, ...rest] = pathname.slice(1).split("/");
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

### Task 2: Add failing service coverage for explicit guild-id arguments

**Files:**
- Modify: `tests/public-site-service.test.js`
- Modify: `scripts/Web/PublicSite.js`

**Step 1: Write the failing test**

```js
test("public site handlers use the guild id passed into renderHomePage", async () => {
  const seenGuildIds = [];
  const site = createPublicSiteHandlers({ ...deps });

  await site.renderHomePage("guild-9");

  assert.deepEqual(seenGuildIds, ["guild-9"]);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js`
Expected: FAIL because the handlers still rely on a configured preferred guild.

**Step 3: Write minimal implementation**

```js
async function renderHomePage(guildId) {
  const resolvedGuildId = await getGuildId(guildId);
  // existing query flow
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js`
Expected: PASS

### Task 3: Add a landing-page view and update view coverage

**Files:**
- Add: `scripts/Web/views/LandingPage.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

```js
test("renderLandingPage renders a server-id form", () => {
  const html = renderLandingPage();
  assert.match(html, /서버 아이디/);
  assert.match(html, /<form/);
  assert.match(html, /name="serverId"/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the landing-page renderer does not exist.

**Step 3: Write minimal implementation**

```js
function renderLandingPage() {
  return renderLayout({
    title: "ProjectL 서버 선택",
    body: `<main><form><input name="serverId" /></form></main>`,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

### Task 4: Update SSR links and search forms so they preserve the active guild path

**Files:**
- Modify: `scripts/Web/views/HomePage.js`
- Modify: `scripts/Web/views/MatchesPage.js`
- Modify: `scripts/Web/views/MatchDetailPage.js`
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `scripts/Web/views/Layout.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

```js
test("renderHomePage scopes internal links with the current guild id", () => {
  const html = renderHomePage({ guildId: "guild-1", ...model });
  assert.match(html, /href="\/guild-1\/matches"/);
  assert.match(html, /href="\/guild-1\/players\/1"/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because internal links still point to global routes.

**Step 3: Write minimal implementation**

```js
function buildGuildPath(guildId, suffix = "") {
  return `/${encodeURIComponent(guildId)}${suffix}`;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

### Task 5: Implement the guild-prefixed router behavior

**Files:**
- Modify: `scripts/Web/PublicSiteRouter.js`
- Modify: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

```js
test("player search redirects within the active guild", async () => {
  const response = await requestServer(createTestServer(), "/guild-1/players?q=egg");
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "/guild-1/players/1");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because redirect and detail routes are still global.

**Step 3: Write minimal implementation**

```js
const scopedPath = `/${rest.join("/")}`;
const players = await searchPlayers(serverId, query);
res.writeHead(302, { Location: `/${encodeURIComponent(serverId)}/players/${players[0].discordId}` });
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

### Task 6: Implement the landing page and guild-aware handler signatures

**Files:**
- Modify: `scripts/Web/PublicSite.js`
- Modify: `scripts/Web/PublicSiteRouter.js`
- Add: `scripts/Web/views/LandingPage.js`
- Modify: `tests/public-site-service.test.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

```js
test("public site handlers return empty states when a guild id is missing", async () => {
  const site = createPublicSiteHandlers({ ...deps });
  const html = await site.renderHomePage("");
  assert.match(html, /서버 아이디/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: FAIL because the handlers do not accept route-provided guild ids yet.

**Step 3: Write minimal implementation**

```js
async function renderHomePage(guildId) {
  if (!guildId) {
    return renderLandingPage();
  }
  // existing home-page logic
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: PASS

### Task 7: Run targeted verification and full regression coverage

**Files:**
- Modify: `tests/public-site-routes.test.js` as needed
- Modify: `tests/public-site-service.test.js` as needed
- Modify: `tests/public-site-views.test.js` as needed

**Step 1: Run the public-site test subset**

Run: `node --test tests/public-site-routes.test.js tests/public-site-service.test.js tests/public-site-views.test.js`
Expected: PASS

**Step 2: Run the full project test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run project verification**

Run: `npm run verify`
Expected: PASS
