# Hard Fearless Inhouse Design

**Context:** `/내전` already creates one Riot tournament room and tracks one active session per guild. Riot's tournament `pickType` does not support Fearless Draft variants, so "하드 피어리스" must be enforced by ProjectL itself, not by the Riot API.

## Goals

- Add a visible hard fearless mode to `/내전`.
- Let the bot remember champions used in previous hard fearless games and surface them before the next room is created.
- Allow the next `/내전` run to continue the latest hard fearless series without rebalancing teams when the same 10 players are present.
- Keep the existing non-fearless `/내전` flow unchanged.

## Non-Goals

- Modifying Riot's tournament API behavior or inventing unsupported `pickType` values.
- Automatically creating the next room as soon as a game ends.
- Building a public-site hard fearless history view in this change.

## Hard Fearless Rule

- Riot's current global Fearless Draft announcement for 2025 states that once a champion is picked in a previous game of a best-of-series, that champion becomes unavailable for **both teams** for the rest of the series.
- This project will implement that stricter "hard fearless" interpretation.
- The ban list is built from all champion picks seen in prior games of the same ProjectL hard fearless series.

## User Experience

- `/내전` gains a new required `특수규칙` option:
  - `일반`
  - `하드 피어리스`
- `/내전` gains a new optional `시리즈동작` option:
  - `자동`
  - `새 시리즈`
  - `이어하기`
- `일반` ignores `시리즈동작` and behaves exactly like today.
- `하드 피어리스` behavior:
  - `자동`: continue only when the latest stored session is a completed hard fearless game with ingested results, fewer than 5 games played, and the same 10 Discord users are in voice. Otherwise start a new series.
  - `새 시리즈`: always create a fresh hard fearless series and reset the used-champion list.
  - `이어하기`: require the latest stored session to be an eligible completed hard fearless game with the same 10 Discord users. Reuse the prior teams exactly and carry the used-champion list forward.

## Team Assignment Rules

- New hard fearless series:
  - Use the existing `옵션` behavior (`MMR` balancing or `무작위`) to produce teams.
- Continued hard fearless series:
  - Reuse the previous blue/purple Discord assignments exactly.
  - Do not rebalance, even if `옵션` is `MMR`.
  - Keep showing player names and, when `옵션` is `MMR`, include registered MMR values in the embed if available.

## Stored Session State

Add these fields to `active_tournament_sessions`:

- `series_mode` varchar(30) default `STANDARD`
- `series_game_number` int unsigned default `1`
- `fearless_used_champions` longtext default `[]`

Meaning:

- `series_mode`: whether this room belongs to a standard flow or a hard fearless flow.
- `series_game_number`: the set number represented by the room.
- `fearless_used_champions`: cumulative champion list for all prior and current games in this series row. Before the game is played, it matches the ban list shown to users. After ingestion, it is updated to include the just-played champions.

## Continuation Model

- Continuation only considers the latest stored session in the guild database.
- A latest session is eligible for continuation only if:
  - `series_mode` is `HARD_FEARLESS`
  - `status` is `COMPLETED`
  - `result_status` is `INGESTED`
  - `series_game_number` is less than 5
  - the current voice members match the previous session's 10 Discord ids exactly
- This keeps the model simple and avoids ambiguous branching between multiple unfinished or historical series.

## Result Ingestion Update

- After Riot match ingestion succeeds, the session row for a hard fearless game should be updated by unioning the current match's champion picks into `fearless_used_champions`.
- Champion names should stay in their Riot payload form so the next `/내전` embed can surface the exact names already used.
- Duplicate champion names must be ignored.

## Error Handling

- `이어하기` with no eligible latest hard fearless session should return a clear Discord error.
- `이어하기` with mismatched 10 users should return a clear error instead of silently rebalancing.
- If the latest hard fearless game has not finished result ingestion yet, continuation should fail with a message telling users to wait until the previous game is fully processed.
- If a hard fearless series has already reached game 5, `자동` should start fresh and `이어하기` should fail.

## Testing Strategy

- Command schema test:
  - assert the new `특수규칙` and `시리즈동작` options and their choices
- Command execution tests:
  - assert a new hard fearless series stores `series_mode`, `series_game_number`, and an empty used-champion list
  - assert continuation reuses previous teams and surfaces existing fearless bans in the embed
- Query/schema tests:
  - assert the new session columns and row mapping
- Result-service tests:
  - assert successful hard fearless ingestion updates the session's champion history
  - assert non-hard-fearless ingestion leaves session fearless state untouched
