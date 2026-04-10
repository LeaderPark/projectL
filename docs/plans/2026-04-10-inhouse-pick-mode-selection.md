# Inhouse Pick Mode Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let `/내전` creators choose the Riot tournament lobby pick mode from all supported options when generating a room.

**Architecture:** Keep the existing team-balance flow intact and add one new slash-command option dedicated to Riot `pickType`. The command execution path will read that value, pass it to the Riot tournament API wrapper, and surface the chosen mode in the success embed. Focused command tests will lock the new option schema and the request plumbing before the implementation is considered complete.

**Tech Stack:** Node.js, discord.js, node:test

---

### Task 1: Lock the slash-command schema with a failing test

**Files:**
- Modify: `tests/team-command.test.js`

**Step 1: Write the failing test**

Update the command schema test to expect:

- the existing `옵션` choice list to stay as `MMR`, `RANDOM`
- a new required `픽방식` string option
- the `픽방식` choices to include `BLIND_PICK`, `DRAFT_MODE`, `ALL_RANDOM`, `TOURNAMENT_DRAFT`

**Step 2: Run test to verify it fails**

Run: `node --test tests/team-command.test.js`
Expected: FAIL because `/내전` currently exposes only the `옵션` field.

**Step 3: Write minimal implementation**

Add the new slash-command option and choice list without changing any unrelated command behavior.

**Step 4: Run test to verify it passes**

Run: `node --test tests/team-command.test.js`
Expected: PASS

### Task 2: Lock pick-mode request plumbing with failing execution tests

**Files:**
- Create: `tests/auto-match-teams-execute.test.js`

**Step 1: Write the failing tests**

Add focused execution tests that expect:

- the selected `픽방식` value to be forwarded into `riotApi.createTournamentCode`
- the success embed to contain a readable pick-mode label

**Step 2: Run test to verify it fails**

Run: `node --test tests/auto-match-teams-execute.test.js`
Expected: FAIL because the command currently hard-codes `TOURNAMENT_DRAFT` and does not show the chosen pick mode.

**Step 3: Write minimal implementation**

Plumb the selected pick mode through `createTournamentSession` and the embed builder, adding only the formatting needed for the user-facing label.

**Step 4: Run test to verify it passes**

Run: `node --test tests/auto-match-teams-execute.test.js`
Expected: PASS

### Task 3: Verify the focused regression suite

**Files:**
- Test: `tests/team-command.test.js`
- Test: `tests/auto-match-teams-execute.test.js`

**Step 1: Run the targeted suite**

Run: `node --test tests/team-command.test.js tests/auto-match-teams-execute.test.js`
Expected: PASS

**Step 2: Review the diff**

Confirm:

- only `/내전` command behavior changed
- all four Riot-supported pick modes are exposed
- the Riot tournament request uses the selected mode instead of a constant
- the success embed reflects the selected lobby rules
