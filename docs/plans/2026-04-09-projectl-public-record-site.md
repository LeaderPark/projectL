# ProjectL Public Record Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a public OP.GG-inspired website that shows overall inhouse match records, a browsable match history, and a public player profile page using only ProjectL's existing inhouse data.

**Architecture:** Keep one Node process for both the Discord bot and the HTTP surface. Extend the existing web server into a small SSR router, add read-only query helpers for public stats, and render HTML through dedicated view modules plus shared static CSS/JS. The site remains public, read-only, and scoped to inhouse records only.

**Tech Stack:** Node.js, discord.js, mysql2, node:test, MariaDB/MySQL, lightweight HTTP server, server-rendered HTML, static CSS/JS

---

### Task 1: Add coverage for the public-site query contract

**Files:**
- Modify: `scripts/Utils/Query.js`
- Test: `tests/public-site-query.test.js`

**Step 1: Write the failing test**

```js
test("public summary query returns aggregate counts and leaders", async () => {
  const sql = buildPublicSummarySql();
  assert.match(sql, /COUNT\(\*\) AS total_matches/i);
  assert.match(sql, /FROM matches/i);
});

test("player search query limits public search results", async () => {
  const sql = buildPublicPlayerSearchSql();
  assert.match(sql, /LIMIT 10/i);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-query.test.js`
Expected: FAIL because the public-site SQL helpers do not exist yet.

**Step 3: Write minimal implementation**

```js
function buildPublicSummarySql() {
  return `
    SELECT
      (SELECT COUNT(*) FROM matches) AS total_matches,
      (SELECT COUNT(*) FROM user) AS total_players
  `;
}

function buildPublicPlayerSearchSql() {
  return `
    SELECT discord_id, name, mmr, win, lose
    FROM user
    WHERE name LIKE ?
    ORDER BY mmr DESC, name ASC
    LIMIT 10
  `;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-query.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js tests/public-site-query.test.js
git commit -m "test: add public site query coverage"
```

### Task 2: Add public data helpers for summary, matches, player detail, and search

**Files:**
- Modify: `scripts/Utils/Query.js`
- Test: `tests/public-site-query.test.js`

**Step 1: Write the failing test**

```js
test("getPublicPlayerProfile returns a missing result when the player does not exist", async () => {
  const result = await getPublicPlayerProfile("guild-1", "missing");
  assert.equal(result.success, false);
  assert.equal(result.code, "PLAYER_NOT_FOUND");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-query.test.js`
Expected: FAIL because the public player helper does not exist yet.

**Step 3: Write minimal implementation**

```js
async function getPublicPlayerProfile(guildId, discordId) {
  const promisePool = await getGuildPromisePool(guildId);
  const [rows] = await promisePool.query(
    "SELECT * FROM user WHERE discord_id = ? LIMIT 1",
    [discordId]
  );

  if (rows.length === 0) {
    return { success: false, code: "PLAYER_NOT_FOUND" };
  }

  return { success: true, data: rows[0] };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-query.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js tests/public-site-query.test.js
git commit -m "feat: add public site data queries"
```

### Task 3: Add formatter helpers for league cards, match cards, and player sections

**Files:**
- Create: `scripts/Web/formatters/PublicSiteFormatter.js`
- Test: `tests/public-site-formatter.test.js`

**Step 1: Write the failing test**

```js
test("formatMatchCard builds blue and purple team rows from stored match JSON", () => {
  const card = formatMatchCard(matchRow);
  assert.equal(card.teams.blue.players.length, 5);
  assert.equal(card.teams.purple.players.length, 5);
});

test("formatPlayerProfileSummary calculates win rate and average kda", () => {
  const summary = formatPlayerProfileSummary(playerRow);
  assert.equal(summary.winRateText, "60%");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-formatter.test.js`
Expected: FAIL because the formatter module does not exist yet.

**Step 3: Write minimal implementation**

```js
function formatPlayerProfileSummary(row) {
  const games = Number(row.win) + Number(row.lose);
  const winRate = games > 0 ? Math.round((Number(row.win) / games) * 100) : 0;
  return {
    games,
    winRateText: `${winRate}%`,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-formatter.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/formatters/PublicSiteFormatter.js tests/public-site-formatter.test.js
git commit -m "feat: add public site formatters"
```

### Task 4: Add shared SSR layout and HTML view helpers

**Files:**
- Create: `scripts/Web/views/Layout.js`
- Create: `scripts/Web/views/HomePage.js`
- Create: `scripts/Web/views/MatchesPage.js`
- Create: `scripts/Web/views/PlayerPage.js`
- Create: `scripts/Web/views/NotFoundPage.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

```js
test("renderLayout injects title, body, and shared assets", () => {
  const html = renderLayout({ title: "ProjectL", body: "<main>ok</main>" });
  assert.match(html, /<title>ProjectL<\/title>/);
  assert.match(html, /site\.css/);
  assert.match(html, /site\.js/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the layout renderer does not exist yet.

**Step 3: Write minimal implementation**

```js
function renderLayout({ title, body }) {
  return `<!DOCTYPE html>
  <html lang="ko">
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="/public/site.css" />
    </head>
    <body>${body}<script src="/public/site.js"></script></body>
  </html>`;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/views/Layout.js scripts/Web/views/HomePage.js scripts/Web/views/MatchesPage.js scripts/Web/views/PlayerPage.js scripts/Web/views/NotFoundPage.js tests/public-site-views.test.js
git commit -m "feat: add public site SSR views"
```

### Task 5: Extend the web server into a public router with HTML pages and JSON search

**Files:**
- Modify: `scripts/Web/CallbackServer.js`
- Create: `scripts/Web/PublicSiteRouter.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

```js
test("router serves the public home page", async () => {
  const response = await requestRoute("/");
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /전체 내전 전적/);
});

test("router returns JSON from the public search endpoint", async () => {
  const response = await requestRoute("/api/search?q=egg");
  assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because the router does not serve public pages yet.

**Step 3: Write minimal implementation**

```js
if (req.method === "GET" && req.url === "/") {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderHomePage(model));
  return;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/CallbackServer.js scripts/Web/PublicSiteRouter.js tests/public-site-routes.test.js
git commit -m "feat: add public site routing"
```

### Task 6: Add public static assets for the OP.GG-inspired visual system

**Files:**
- Create: `public/site.css`
- Create: `public/site.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

```js
test("router serves the public stylesheet", async () => {
  const response = await requestRoute("/public/site.css");
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /--color-bg/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because the stylesheet route does not exist yet.

**Step 3: Write minimal implementation**

```css
:root {
  --color-bg: #f4f7fb;
  --color-surface: #ffffff;
  --color-accent: #4171d6;
  --color-text: #1f2a44;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add public/site.css public/site.js tests/public-site-routes.test.js
git commit -m "feat: add public site assets"
```

### Task 7: Build the public home page with summary cards, ranking, and recent matches

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `scripts/Web/formatters/PublicSiteFormatter.js`
- Modify: `scripts/Web/views/HomePage.js`
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

```js
test("home page renders summary cards and ranking rows", () => {
  const html = renderHomePage(model);
  assert.match(html, /총 경기 수/);
  assert.match(html, /MMR 랭킹/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`
Expected: FAIL because the home page renderer does not include the public summary sections yet.

**Step 3: Write minimal implementation**

```js
function renderHomePage(model) {
  return renderLayout({
    title: "ProjectL 내전 전적",
    body: `<main><section>총 경기 수</section><section>MMR 랭킹</section></main>`,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js scripts/Web/formatters/PublicSiteFormatter.js scripts/Web/views/HomePage.js tests/public-site-views.test.js tests/public-site-routes.test.js
git commit -m "feat: add public home page"
```

### Task 8: Build the public match-history page

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `scripts/Web/formatters/PublicSiteFormatter.js`
- Modify: `scripts/Web/views/MatchesPage.js`
- Test: `tests/public-site-formatter.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

```js
test("matches page renders both teams and the result label", () => {
  const html = renderMatchesPage(model);
  assert.match(html, /Blue Team/);
  assert.match(html, /Purple Team/);
  assert.match(html, /승리|패배/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-formatter.test.js tests/public-site-routes.test.js`
Expected: FAIL because the matches page does not render the full card layout yet.

**Step 3: Write minimal implementation**

```js
function renderMatchesPage(model) {
  return renderLayout({
    title: "전체 내전 경기",
    body: model.cards.map((card) => `<article>${card.resultLabel}</article>`).join(""),
  });
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-formatter.test.js tests/public-site-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js scripts/Web/formatters/PublicSiteFormatter.js scripts/Web/views/MatchesPage.js tests/public-site-formatter.test.js tests/public-site-routes.test.js
git commit -m "feat: add public match history page"
```

### Task 9: Build the public player profile page

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `scripts/Web/formatters/PublicSiteFormatter.js`
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `scripts/Web/views/NotFoundPage.js`
- Test: `tests/public-site-views.test.js`
- Test: `tests/public-site-routes.test.js`

**Step 1: Write the failing test**

```js
test("player page renders profile stats, champion rows, and recent matches", () => {
  const html = renderPlayerPage(model);
  assert.match(html, /승률/);
  assert.match(html, /주 챔피언/);
  assert.match(html, /최근 경기/);
});

test("missing player routes return the not-found page", async () => {
  const response = await requestRoute("/players/missing");
  assert.equal(response.statusCode, 404);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`
Expected: FAIL because the player route and profile renderer are not implemented yet.

**Step 3: Write minimal implementation**

```js
function renderPlayerPage(model) {
  return renderLayout({
    title: `${model.profile.name} - ProjectL`,
    body: `<main><section>승률</section><section>주 챔피언</section><section>최근 경기</section></main>`,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js tests/public-site-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js scripts/Web/formatters/PublicSiteFormatter.js scripts/Web/views/PlayerPage.js scripts/Web/views/NotFoundPage.js tests/public-site-views.test.js tests/public-site-routes.test.js
git commit -m "feat: add public player profile page"
```

### Task 10: Run the public-site verification suite and full regression checks

**Files:**
- Modify: `tests/public-site-query.test.js` as needed
- Modify: `tests/public-site-formatter.test.js` as needed
- Modify: `tests/public-site-views.test.js` as needed
- Modify: `tests/public-site-routes.test.js` as needed

**Step 1: Run targeted public-site tests**

Run: `node --test tests/public-site-query.test.js tests/public-site-formatter.test.js tests/public-site-views.test.js tests/public-site-routes.test.js`
Expected: PASS

**Step 2: Run existing bot and web regression tests**

Run: `node --test tests/callback-server.test.js tests/session-poller.test.js tests/server-command.test.js tests/team-command.test.js tests/registration-command.test.js`
Expected: PASS

**Step 3: Run the full project test suite**

Run: `npm test`
Expected: PASS

**Step 4: Run runtime verification**

Run: `npm run verify`
Expected: PASS

**Step 5: Commit**

```bash
git add tests scripts/Web scripts/Utils/Query.js public
git commit -m "test: verify public record site"
```
