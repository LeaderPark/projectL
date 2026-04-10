# Inhouse Pick Mode Selection Design

**Context:** The `/내전` command already splits 10 players into two teams and creates a Riot tournament code, but the created lobby always uses `TOURNAMENT_DRAFT`. The new requirement is to let users choose the lobby pick mode directly when creating the room.

## Goals

- Keep `/내전` as the single command for team creation and tournament-code generation.
- Expose every Riot-supported tournament `pickType` as a selectable slash-command choice.
- Preserve the current team-balance option (`MMR` or `무작위`) without mixing it into pick-mode selection.
- Show the selected pick mode in the success response so users can verify what kind of room was created.

## Non-Goals

- Changing how teams are balanced.
- Adding free-text input for Riot lobby settings.
- Expanding map, spectator, or team-size customization in this change.

## Approaches Considered

- **Recommended: add a dedicated `픽방식` string option with fixed choices.**
  This keeps the current `옵션` field focused on team balancing while making the Riot lobby rule explicit and easy to understand in Discord's slash UI.
- **Alternative: combine team-balance and pick-mode values into one large option list.**
  This creates too many combinations and makes the command harder to scan and maintain.
- **Alternative: accept raw enum text from the user.**
  This is flexible but loses the safety and discoverability of slash-command choices.

## API Mapping

- Riot Tournament V5 documents four legal `pickType` values for tournament codes:
  - `BLIND_PICK`
  - `DRAFT_MODE`
  - `ALL_RANDOM`
  - `TOURNAMENT_DRAFT`
- The command should expose friendly Korean labels while sending the Riot enum value unchanged to `createTournamentCode`.

## Application Changes

- Add a new required slash-command option named `픽방식`.
- Read the selected pick mode in `/내전` execution and pass it into tournament session creation.
- Replace the hard-coded `TOURNAMENT_DRAFT` value in the Riot tournament-code request with the selected value.
- Add a small formatter/helper for turning the enum into human-readable text in the embed.

## Error Handling

- Keep existing validation for missing voice channel, missing team channels, missing guild settings, and non-10-player lobbies.
- Keep the current Riot API error handling; the only changed request field is `pickType`.
- Rely on slash-command fixed choices so invalid pick-mode input cannot reach runtime during normal use.

## Testing Strategy

- Update the slash-command definition test to assert the new `픽방식` option and all four supported values.
- Add execution tests that prove the selected pick mode is forwarded into the Riot tournament-code request.
- Assert the success embed includes the selected pick mode label so the user-visible output matches the created lobby settings.
