# OP.GG-Style Public Record Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the public match area so it mirrors OP.GG's inline match-row layout and expand/collapse UX as closely as possible, while using Riot Data Dragon images for champions, items, spells, and runes.

**Architecture:** Keep the existing Node SSR site and enrich it in place. Replace card-first match rendering with expandable OP.GG-style rows, render full tabbed detail markup on the server, and use small client-side JS only for expansion and tab switching. Add a Riot static asset service that resolves the current Data Dragon version and produces image metadata for the formatter layer.

**Tech Stack:** Node.js, server-rendered HTML, static CSS/JS, axios, mysql2, node:test, existing ProjectL web/router modules, Riot Data Dragon

---

### Task 1: Add failing tests for Riot static asset metadata

**Files:**
- Create or Modify: `scripts/Riot/RiotAssetService.js`
- Create: `tests/riot-asset-service.test.js`

**Step 1: Write the failing test**

Add tests that expect the asset service to:
- resolve a Data Dragon version
- return champion, item, spell, and rune image URLs
- cache the metadata between calls

**Step 2: Run test to verify it fails**

Run: `node --test tests/riot-asset-service.test.js`
Expected: FAIL because the asset service does not exist yet.

**Step 3: Write minimal implementation**

Add a lightweight Riot asset service that fetches the necessary static JSON once and exposes lookup helpers.

**Step 4: Run test to verify it passes**

Run: `node --test tests/riot-asset-service.test.js`
Expected: PASS

### Task 2: Add failing tests for expandable match-row formatter output

**Files:**
- Modify: `tests/public-site-formatter.test.js`
- Modify: `scripts/Web/formatters/PublicSiteFormatter.js`

**Step 1: Write the failing test**

Add coverage that expects `formatMatchCard()` to expose:
- collapsed row layout data
- inline-expanded section data
- tab ids
- actual image URLs for champion, item, spell, and rune assets

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-formatter.test.js`
Expected: FAIL because the current formatter does not provide OP.GG-style row sections or image metadata.

**Step 3: Write minimal implementation**

Extend the formatter to normalize players more deeply and to attach route metadata and per-team summary fields without changing unrelated query behavior.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-formatter.test.js`
Expected: PASS

### Task 3: Add failing tests for the updated public-site handler flow

**Files:**
- Modify: `tests/public-site-service.test.js`
- Modify: `scripts/Web/PublicSite.js`

**Step 1: Write the failing test**

Add coverage that `createPublicSiteHandlers()` injects Riot asset metadata into match rows and still supports deep-link detail rendering for valid match ids.

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js`
Expected: FAIL because the handler does not yet support match detail rendering.

**Step 3: Write minimal implementation**

Add `renderMatchDetailPage(matchId)` to the handlers and wire it to a new single-match query helper.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js`
Expected: PASS

### Task 4: Add failing route tests for OP.GG-style match row rendering hooks

**Files:**
- Modify: `tests/public-site-routes.test.js`
- Modify: `scripts/Web/PublicSiteRouter.js`
- Modify: `public/site.js`

**Step 1: Write the failing test**

Add route coverage for:
- expanded row markup on `/matches`
- `GET /matches/9` fallback detail rendering
- HTML hooks needed for row expansion and tab interaction

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js`
Expected: FAIL because the router only supports `/matches`.

**Step 3: Write minimal implementation**

Extend the router to dispatch `/matches/:id` to the new handler and preserve existing list-route behavior.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js`
Expected: PASS

### Task 5: Add failing view tests for OP.GG-style collapsed and expanded rows

**Files:**
- Modify: `tests/public-site-views.test.js`
- Modify: `scripts/Web/views/MatchesPage.js`
- Modify: `scripts/Web/views/HomePage.js`
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `scripts/Web/views/ViewHelpers.js`

**Step 1: Write the failing test**

Add coverage that the detail page renders:
- OP.GG-like row shell with result strip and summary fields
- inline expandable detail section
- tab buttons such as `종합`, `OP 스코어`, `팀 분석`, `빌드`, `기타`
- image tags rather than plain id chips

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the detail page renderer does not exist yet.

**Step 3: Write minimal implementation**

Create a dedicated detail-page renderer and shared helper functions for stat rows and build cells.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

### Task 6: Implement Riot asset service and formatter enrichment

**Files:**
- Create or Modify: `scripts/Riot/RiotAssetService.js`
- Modify: `scripts/Web/formatters/PublicSiteFormatter.js`
- Modify: `scripts/Web/PublicSite.js`
- Modify: `tests/riot-asset-service.test.js`
- Modify: `tests/public-site-formatter.test.js`

**Step 1: Run the focused tests to confirm red**

Run: `node --test tests/riot-asset-service.test.js tests/public-site-formatter.test.js`
Expected: FAIL in the new asset and image-url expectations.

**Step 3: Write minimal implementation**

Add the Riot static asset service and feed its metadata into the match formatter layer.

**Step 4: Run targeted tests to confirm green**

Run: `node --test tests/riot-asset-service.test.js tests/public-site-formatter.test.js`
Expected: PASS

### Task 7: Rebuild match rows, inline detail panes, and tabs

**Files:**
- Modify: `public/site.css`
- Modify: `public/site.js`
- Modify: `scripts/Web/views/HomePage.js`
- Modify: `scripts/Web/views/MatchesPage.js`
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `scripts/Web/views/MatchDetailPage.js`
- Modify: `scripts/Web/views/ViewHelpers.js`
- Modify: `tests/public-site-routes.test.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing test**

Add coverage that rows include:
- result strip
- summary clusters
- expand/collapse buttons
- inline tab panels
- image-based item/spell/rune/champion slots

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-routes.test.js tests/public-site-views.test.js`
Expected: FAIL because the current HTML/CSS/JS does not mirror the OP.GG interaction model closely enough.

**Step 3: Write minimal implementation**

Replace the current match-card HTML/CSS/JS with OP.GG-style row markup and inline tabs.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-routes.test.js tests/public-site-views.test.js`
Expected: PASS

### Task 8: Wire the updated handler and fallback detail page

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `scripts/Web/PublicSite.js`
- Modify: `scripts/Web/PublicSiteRouter.js`
- Modify: `scripts/Web/views/MatchDetailPage.js`
- Modify: `tests/public-site-service.test.js`
- Modify: `tests/public-site-routes.test.js`

**Step 1: Run the service and route tests to confirm red**

Run: `node --test tests/public-site-service.test.js tests/public-site-routes.test.js`
Expected: FAIL if the new asset-aware row model is not wired through all handlers yet.

**Step 2: Write the implementation**

Connect the Riot asset service to formatter options, ensure `/matches` is the primary expanded experience, and keep `/matches/:id` working as fallback.

**Step 3: Run service and route tests**

Run: `node --test tests/public-site-service.test.js tests/public-site-routes.test.js`
Expected: PASS

### Task 9: Polish supporting pages that reuse match rows

**Files:**
- Modify: `scripts/Web/formatters/PublicSiteFormatter.js`
- Modify: `scripts/Web/views/HomePage.js`
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `tests/public-site-formatter.test.js`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write failing tests for any remaining presentation helpers**

Add coverage for reused expandable rows inside the home page and player page so they do not regress into a different UX.

**Step 2: Run targeted tests to confirm red**

Run: `node --test tests/public-site-formatter.test.js tests/public-site-views.test.js`
Expected: FAIL for the newly added presentation expectations.

**Step 3: Write minimal implementation**

Add only the formatter fields that the redesigned pages actually consume.

**Step 4: Run targeted tests to confirm green**

Run: `node --test tests/public-site-formatter.test.js tests/public-site-views.test.js`
Expected: PASS

### Task 10: Verify the full public-site flow and run regression coverage

**Files:**
- Modify: `tests/public-site-formatter.test.js` as needed
- Modify: `tests/public-site-service.test.js` as needed
- Modify: `tests/public-site-routes.test.js` as needed
- Modify: `tests/public-site-views.test.js` as needed

**Step 1: Run the focused public-site suite**

Run: `node --test tests/riot-asset-service.test.js tests/public-site-query.test.js tests/public-site-formatter.test.js tests/public-site-service.test.js tests/public-site-routes.test.js tests/public-site-views.test.js`
Expected: PASS

**Step 2: Run the whole repository test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run project verification**

Run: `npm run verify`
Expected: PASS
