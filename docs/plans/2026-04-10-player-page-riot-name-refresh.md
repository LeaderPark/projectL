# Player Page Riot Name Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a public player-page refresh button that checks Riot account names by `puuid`, stores changed names in the guild database, and keeps every public display locked to the player's representative Riot name.

**Architecture:** Keep `puuid` as the durable identity key and add a manual refresh path in the public-site stack. The refresh POST route will call a focused service that loads linked `riot_accounts`, fetches latest Riot names by `puuid`, updates only changed rows, recomputes `user.name` from the primary account, and redirects back to the player page with a status code. Existing match rendering keeps rewriting linked participants to `user.name`, so recent matches and match details automatically show the representative Riot name after refresh.

**Tech Stack:** Node.js, mysql2, axios, node:test, server-rendered HTML views

---

### Task 1: Add query helpers for manual Riot-name refresh

**Files:**
- Modify: `scripts/Utils/Query.js`
- Modify: `tests/public-site-query.test.js`

**Step 1: Write the failing tests**

Add query tests that expect:

- a helper can load linked `riot_accounts` for one `discord_id` with `id`, `puuid`, `riot_game_name`, `riot_tag_line`, and `is_primary`
- a helper updates one `riot_accounts` row when a refreshed `gameName/tagLine` changed
- a helper recomputes `user.name` from the current primary Riot account after account rows were updated
- non-primary updates leave `user.name` set to the primary account display name

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-query.test.js`
Expected: FAIL because the current query module does not expose refresh-specific read/write helpers.

**Step 3: Write minimal implementation**

Add the smallest query surface that supports the refresh flow, for example:

- `listRefreshableRiotAccounts(guildId, discordId)`
- `updateRiotAccountDisplayName(guildId, accountId, riotGameName, riotTagLine)`
- `syncRepresentativeRiotName(guildId, discordId)`

Keep `syncRepresentativeRiotName` authoritative on `is_primary` and reuse existing representative-name conventions.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-query.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Utils/Query.js tests/public-site-query.test.js
git commit -m "feat: add manual riot name refresh query helpers"
```

### Task 2: Add a player refresh service with Riot `puuid` lookups and 5-minute cooldowns

**Files:**
- Modify: `scripts/Riot/DataReceiver.js`
- Create: `scripts/Web/PlayerRiotIdentityRefresh.js`
- Modify: `tests/public-site-service.test.js`

**Step 1: Write the failing tests**

Add service-level tests that expect:

- the refresh service fetches latest Riot identities by `puuid`
- changed rows return `updated`
- unchanged rows return `unchanged`
- partial Riot fetch failures return `partial` while preserving successful updates
- a second refresh for the same `guildId:discordId` within 5 minutes returns `throttled`
- the final representative name always comes from the primary account, even when only a non-primary account changed

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js`
Expected: FAIL because there is no refresh service, no `puuid`-based Riot identity lookup, and no cooldown behavior.

**Step 3: Write minimal implementation**

Implement:

- `getRiotAccountByPuuid(puuid)` in `scripts/Riot/DataReceiver.js`
- a new refresh service module that:
  - reads linked accounts through the new query helper
  - checks an in-memory 5-minute cooldown map keyed by `guildId:discordId`
  - fetches Riot account data by `puuid`
  - updates only changed account rows
  - calls `syncRepresentativeRiotName` once after refresh work completes
  - returns one of `updated`, `unchanged`, `partial`, `failed`, or `throttled`

Keep the cooldown process-local and do not touch the DB when the request is throttled.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Riot/DataReceiver.js scripts/Web/PlayerRiotIdentityRefresh.js tests/public-site-service.test.js
git commit -m "feat: add player riot name refresh service"
```

### Task 3: Wire the refresh POST route into the public-site handler and router

**Files:**
- Modify: `scripts/Web/PublicSite.js`
- Modify: `scripts/Web/PublicSiteRouter.js`
- Modify: `tests/public-site-service.test.js`
- Modify: `tests/public-site-routes.test.js`

**Step 1: Write the failing tests**

Add tests that expect:

- `createPublicSiteHandlers` exposes a refresh handler that returns redirect metadata with a `refresh` status
- `createPublicSiteRouter` accepts `POST /:serverId/players/:discordId/refresh-riot-accounts`
- the POST route responds with `303` and redirects back to the matching player page
- the redirect location includes the correct refresh status query parameter

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js tests/public-site-routes.test.js`
Expected: FAIL because the router currently rejects every non-GET request and the public-site handlers have no refresh action.

**Step 3: Write minimal implementation**

Add only the routing and handler wiring needed for the refresh flow:

- inject the refresh service into `createPublicSiteHandlers`
- add a `handlePlayerRiotIdentityRefresh(routeGuildId, discordId)` style handler that returns redirect info
- teach `createPublicSiteRouter` to special-case the new POST path and issue a `303`

Keep the rest of the public-site router behavior unchanged.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js tests/public-site-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/PublicSite.js scripts/Web/PublicSiteRouter.js tests/public-site-service.test.js tests/public-site-routes.test.js
git commit -m "feat: add public player riot name refresh route"
```

### Task 4: Render the player-page refresh button and feedback banner

**Files:**
- Modify: `scripts/Web/views/PlayerPage.js`
- Modify: `public/site.css`
- Modify: `tests/public-site-views.test.js`

**Step 1: Write the failing tests**

Add player-page view tests that expect:

- the sidebar includes a `닉네임 새로고침` form pointing to `/serverId/players/discordId/refresh-riot-accounts`
- the form uses `method="POST"`
- the page renders status feedback for `updated`, `unchanged`, `partial`, `failed`, and `throttled`

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-views.test.js`
Expected: FAIL because the current player page has no refresh form or status banner.

**Step 3: Write minimal implementation**

Update the player-page view model and markup to render:

- a small refresh form in the Riot-account sidebar section
- a compact banner near the top of the page when a refresh status is present
- minimal CSS so the button and banner match the existing public-site styling without reworking the page layout

Do not add client-side JavaScript for this feature.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-views.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/Web/views/PlayerPage.js public/site.css tests/public-site-views.test.js
git commit -m "feat: add player page riot name refresh controls"
```

### Task 5: Verify the focused regression suite

**Files:**
- Test: `tests/public-site-query.test.js`
- Test: `tests/public-site-service.test.js`
- Test: `tests/public-site-routes.test.js`
- Test: `tests/public-site-views.test.js`

**Step 1: Run the targeted suite**

Run: `node --test tests/public-site-query.test.js tests/public-site-service.test.js tests/public-site-routes.test.js tests/public-site-views.test.js`
Expected: PASS

**Step 2: Verify the key user-facing behavior manually**

Confirm:

- the player page shows the refresh button for public visitors
- repeated clicks inside 5 minutes bounce back with the throttled banner
- refreshing a renamed primary account updates ranking, player page, recent matches, and match detail displays to the representative Riot name
- refreshing a renamed non-primary account updates the linked-account list while keeping public display surfaces tied to the representative Riot name

**Step 3: Commit**

```bash
git add docs/plans/2026-04-10-player-page-riot-name-refresh.md
git commit -m "docs: add player page riot name refresh plan"
```
