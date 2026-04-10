# Discord Public Link Responses Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/전적`, `/검색`, and `/랭킹` reply with a short 안내문 plus the correct public-site URL instead of Discord embeds.

**Architecture:** Add one shared helper that builds absolute public-site URLs from runtime configuration and route context, then update the three Discord commands to keep their existing validation behavior while switching the success path to plain-text replies. Focused command tests will lock the new response format before implementation and verify the correct guild/player/ranking URLs.

**Tech Stack:** Node.js, discord.js, node:test

---

### Task 1: Lock public-link response behavior with failing tests

**Files:**
- Create: `tests/public-link-command.test.js`

**Step 1: Write the failing tests**

Add tests that expect:

- `/랭킹` to reply with 안내문 text plus the guild ranking URL
- `/검색` to reply with 안내문 text plus the selected player URL
- `/전적` to reply with 안내문 text plus the selected player URL

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-link-command.test.js`
Expected: FAIL because the commands still return embeds and there is no shared public-link helper.

**Step 3: Write minimal implementation**

Add only the helper and command changes required to return string content for the three success paths.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-link-command.test.js`
Expected: PASS

### Task 2: Add the shared public-site URL builder and update the commands

**Files:**
- Create: `scripts/Utils/PublicSiteLinks.js`
- Modify: `config/runtime.js`
- Modify: `commands/components/matchHistory.js`
- Modify: `commands/components/search.js`
- Modify: `commands/components/rankBoard.js`

**Step 1: Write the failing test**

Extend the command tests so they also expect:

- the configured public hostname to become an absolute `https://` URL
- guild and player ids to be encoded into the correct route shape
- commands to preserve existing error replies when validation fails

**Step 2: Run test to verify it fails**

Run: `node --test tests/public-link-command.test.js`
Expected: FAIL because runtime config and command behavior do not yet expose those link paths.

**Step 3: Write minimal implementation**

Implement the URL builder, wire the public hostname into runtime config, and replace embed success responses with 안내문 content in the three commands.

**Step 4: Run test to verify it passes**

Run: `node --test tests/public-link-command.test.js`
Expected: PASS

### Task 3: Verify the focused command regression suite

**Files:**
- Test: `tests/public-link-command.test.js`
- Test: `tests/match-history-command.test.js`
- Test: `tests/runtime-config.test.js`

**Step 1: Run the targeted suite**

Run: `node --test tests/public-link-command.test.js tests/match-history-command.test.js tests/runtime-config.test.js`
Expected: PASS

**Step 2: Review the diff**

Confirm:

- only the three commands and the shared link helper changed behavior
- no embed-building success path remains in those commands
- runtime config still falls back cleanly when legacy values are used
