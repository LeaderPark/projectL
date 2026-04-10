# Primary Riot Identity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users manage one representative Riot account through Discord slash commands and show that representative Riot identity everywhere on the public record site.

**Architecture:** Persist the representative-account choice on `riot_accounts.is_primary`, synchronize `user.name` to the active representative Riot display name, and remove live Discord-name lookups from the public site. Historical match displays keep their stored payloads but rewrite linked participant names at render time by joining `puuid` back to the representative `user.name`.

**Tech Stack:** Node.js, discord.js, mysql2, node:test, server-rendered HTML views

---

### Task 1: Lock representative-account query behavior with failing tests

**Files:**
- Modify: `tests/public-site-query.test.js`
- Modify: `tests/public-site-service.test.js`
- Modify: `tests/team-query.test.js`

**Step 1: Write the failing tests**

Add tests that expect:

- representative Riot names to come from stored primary-account state rather than Discord lookup
- linked match participants to rewrite to the representative Riot name
- helper queries to expose deterministic primary-account behavior

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-query.test.js tests/public-site-service.test.js tests/team-query.test.js`
Expected: FAIL because the current code still prefers Discord-name resolution and has no primary-account concept.

**Step 3: Write minimal implementation**

Add only the query and service hooks needed for primary-account lookups and public-site name rewriting.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-query.test.js tests/public-site-service.test.js tests/team-query.test.js`
Expected: PASS

### Task 2: Add schema and query support for primary Riot accounts

**Files:**
- Modify: `scripts/Utils/GuildDatabase.js`
- Modify: `scripts/Utils/Query.js`
- Modify: `tests/public-site-query.test.js`
- Modify: `tests/match-ingestion.test.js`

**Step 1: Write the failing test**

Add tests that expect:

- `riot_accounts` to include `is_primary`
- first registration to become primary
- representative-name synchronization to update `user.name`
- primary-account reads to default to the first registered account when no explicit choice exists

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-query.test.js tests/match-ingestion.test.js`
Expected: FAIL because the schema and query helpers do not yet track primary accounts.

**Step 3: Write minimal implementation**

Add the migration, helper reads and writes for primary accounts, and the `user.name` synchronization helper.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-query.test.js tests/match-ingestion.test.js`
Expected: PASS

### Task 3: Add representative-account command and registration messaging

**Files:**
- Create: `commands/riot/primaryRiotAccount.js`
- Modify: `commands/riot/registration.js`
- Create: `tests/primary-riot-account-command.test.js`
- Modify: `tests/server-command.test.js`

**Step 1: Write the failing tests**

Add tests that expect:

- `/대표아이디설정` to update the primary account for the invoking user
- first registration to silently become the primary account
- second or later registrations to tell the user to configure a representative account

**Step 2: Run test to verify it fails**

Run: `node --test tests/primary-riot-account-command.test.js tests/server-command.test.js`
Expected: FAIL because the command does not exist and registration replies do not mention representative-account setup.

**Step 3: Write minimal implementation**

Implement the slash command and the registration reply changes without broad command refactors.

**Step 4: Run test to verify it passes**

Run: `node --test tests/primary-riot-account-command.test.js tests/server-command.test.js`
Expected: PASS

### Task 4: Remove Discord-name resolution from the public site

**Files:**
- Modify: `scripts/Web/PublicSite.js`
- Modify: `tests/public-site-service.test.js`

**Step 1: Write the failing test**

Add tests that assert:

- public rankings, player pages, and search results use the representative Riot name from storage
- Discord client lookup helpers are no longer required for public-site rendering

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-site-service.test.js`
Expected: FAIL because the current public-site service still resolves live Discord names.

**Step 3: Write minimal implementation**

Delete the Discord-name overlay path and keep only representative Riot-name rewriting.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-site-service.test.js`
Expected: PASS

### Task 5: Verify the focused regression suite

**Files:**
- Test: `tests/public-site-query.test.js`
- Test: `tests/public-site-service.test.js`
- Test: `tests/public-site-views.test.js`
- Test: `tests/match-ingestion.test.js`
- Test: `tests/primary-riot-account-command.test.js`

**Step 1: Run the targeted suite**

Run: `node --test tests/public-site-query.test.js tests/public-site-service.test.js tests/public-site-views.test.js tests/match-ingestion.test.js tests/primary-riot-account-command.test.js`
Expected: PASS

**Step 2: Verify behavior manually**

Confirm:

- single-account players show their only Riot account everywhere
- multi-account players default to their first account until `/대표아이디설정` is used
- historical match entries render the representative Riot name even when the stored payload contains a sub-account name
