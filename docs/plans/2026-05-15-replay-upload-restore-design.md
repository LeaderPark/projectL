# Replay Upload Restore Design

**Context:** The project previously supported a Discord `/업로드` command that accepted a `.rofl` replay file, parsed its embedded metadata, and saved match history. That path was removed in commit `7b664ed`, while the newer tournament-result flow now persists matches through `persistMatchResult`.

**Decision:** Restore the replay-file path as a manual fallback. Recreate the replay parser and `/업로드` command, but route saved matches through `persistMatchResult` so replay upload uses the same transactional persistence path as Riot callback ingestion.

**Scope:**
- Recreate `scripts/Utils/roflxd.js` for low-level `.rofl` metadata extraction.
- Recreate `scripts/Utils/Parser.js` for converting replay stats into the existing `Match`, `Team`, and `Player` model.
- Recreate `commands/riot/upload.js` as a slash command that accepts a required `.rofl` attachment.
- Replace the obsolete removal assertion in `tests/deploy-commands.test.js` with coverage that the command exists.
- Add focused tests for command behavior and parser behavior.

**Error handling:**
- Non-`.rofl` attachments should receive a direct validation reply.
- Parser failures should return a user-facing message and avoid persistence.
- Persistence failures should return the existing database error message.
- Duplicate matches stay idempotent because `persistMatchResult` handles them as already processed.

**Testing:** Use Node's built-in test runner. Add failing tests before implementation for command registration, persistence delegation, invalid extension handling, parser file cleanup, and ROFL metadata parsing.
