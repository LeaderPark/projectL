# Replay Upload Restore Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the Discord `/업로드` command so operators can manually ingest `.rofl` replay files again.

**Architecture:** Recreate the deleted replay parser modules and command, but keep current match persistence centralized through `persistMatchResult`. The command validates the attachment, parses the replay into the existing internal `Match` model, and delegates database writes to the atomic persistence helper.

**Tech Stack:** Node.js, discord.js `SlashCommandBuilder`, Node built-in test runner, existing ProjectL VO classes, existing `persistMatchResult`.

---

### Task 1: Command Availability

**Files:**
- Modify: `tests/deploy-commands.test.js`
- Create: `commands/riot/upload.js`

**Step 1:** Change the old removal test so it expects `commands/riot/upload.js` to exist.

**Step 2:** Run `node --test tests/deploy-commands.test.js`.
Expected: FAIL because `commands/riot/upload.js` does not exist.

**Step 3:** Add the minimal command file with `/업로드` slash-command metadata.

**Step 4:** Run `node --test tests/deploy-commands.test.js`.
Expected: PASS for command availability.

### Task 2: Command Behavior

**Files:**
- Create: `tests/upload-command.test.js`
- Modify: `commands/riot/upload.js`

**Step 1:** Add tests that verify invalid extensions reply immediately, parser errors edit the deferred reply, and successful parsing calls `persistMatchResult(guildId, replay, replayBaseName)`.

**Step 2:** Run `node --test tests/upload-command.test.js`.
Expected: FAIL because the command does not execute the behavior yet.

**Step 3:** Implement command execution with `getMatchData` and `persistMatchResult`.

**Step 4:** Run `node --test tests/upload-command.test.js`.
Expected: PASS.

### Task 3: Replay Parser

**Files:**
- Create: `tests/replay-parser.test.js`
- Create: `scripts/Utils/Parser.js`
- Create: `scripts/Utils/roflxd.js`

**Step 1:** Add tests for `.rofl` metadata extraction and parser cleanup using a tiny synthetic replay trailer with JSON metadata.

**Step 2:** Run `node --test tests/replay-parser.test.js`.
Expected: FAIL because parser modules are missing.

**Step 3:** Implement `parseROFLBuffer`, `parseROFL`, and `getMatchData`, reusing current VO classes and calculating `performanceScore`.

**Step 4:** Run `node --test tests/replay-parser.test.js`.
Expected: PASS.

### Task 4: Full Verification

**Files:**
- All changed files.

**Step 1:** Run targeted tests:

```bash
node --test tests/deploy-commands.test.js tests/upload-command.test.js tests/replay-parser.test.js
```

**Step 2:** Run the full suite:

```bash
npm test
```

Expected: all tests pass without errors.
