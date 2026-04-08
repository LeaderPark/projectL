# ProjectL Tournament Auto-Move Design

**Context:** `projectL` currently supports one Riot account per Discord user, balances teams from the caller's current voice channel, and moves matched users into fixed voice channels immediately. There is no Riot Tournament API integration, no active match session tracking, no server-configurable post-game gathering room, and no callback-capable HTTP surface for tournament lifecycle automation.

**Decision:** Keep team balancing owned by the bot, generate a tournament code as part of `/내전`, store one active session per guild, and automate two lifecycle transitions. Riot lobby events are used to detect `ChampSelectStartedEvent`, which moves users into team voice channels. A callback-capable HTTP endpoint in this project receives Riot game result notifications and, when the game ends, gathers all users from both team voice channels into a server-configured unity voice channel.

**Approaches considered:**
- **Recommended: bot-owned teams + tournament session trigger.**
  The bot computes the teams up front with the existing balancing logic, saves those Discord IDs as the source of truth, creates the tournament code, and later reacts to Riot lobby events only as a start trigger. This gives stable team assignments even if Riot lobby event details are incomplete.
- **Alternative: infer both team membership and start timing from Riot lobby events only.**
  This removes duplicated state, but it depends on event ordering and undocumented or unstable lobby semantics. It is weaker for the required auto-move behavior.
- **Alternative: manual `/게임시작` command after `/내전`.**
  This is simpler, but it does not meet the requirement that the move happen automatically when champion select begins.

**Why the recommended approach fits:**
- It preserves the existing MMR balancing behavior and only changes when users are moved.
- It supports multiple Riot accounts per Discord user while keeping MMR and match history attached to the Discord identity.
- It tolerates users joining the tournament lobby with any registered Riot account because the move decision is still based on the stored Discord team assignments.

**Architecture:**
- `user` table: becomes the Discord-centric player profile keyed by `discord_id`; MMR and cumulative stats stay here.
- `riot_accounts` table: stores one-to-many Riot account mappings per Discord user, including `riot_game_name`, `riot_tag_line`, `puuid`, and `summoner_id`.
- `active_tournament_sessions` table: stores one active `/내전` session per guild with tournament provider data, tournament code, current status, source voice channel id, target team channel ids, unity voice channel id, and serialized Discord team rosters.
- `tournament adapter`: wraps Riot Tournament API creation and lobby-event polling. It should allow a stub implementation for environments that cannot use full tournament APIs.
- `session poller`: runs in the bot process, loads active sessions, polls Riot lobby events, and triggers the champion-select move once.
- `callback server`: a lightweight HTTP surface in the same project that can later grow into the ranking/match-history website. For this feature it only needs the Riot tournament callback endpoint plus enough plumbing to mark the active session completed.

**Command flow:**
- `/등록`: adds another Riot account for a Discord user instead of replacing the only account. Duplicate `puuid` and duplicate Riot IDs are rejected within the guild.
- `/내전`: keeps the current `MMR` and `무작위` options, builds teams using Discord-centric MMR, creates a tournament code, saves a new active session, and replies with the teams plus the code.
- `/내전` rerun rule: if the guild already has an active session that has not reached the moved or completed state, the new `/내전` replaces it. The previous session is marked cancelled so the poller ignores it. This covers the case where users dislike the first team assignment and rerun the command.
- `/서버설정 공용통화방`: stores the server's post-game gathering voice channel. This is required before `/내전` can create a session that supports automatic post-game gathering.

**Tournament defaults:**
- Map: Summoner's Rift.
- Pick type: Tournament Draft.
- Spectators: disallowed by default.
- Callback and lobby-event polling are used only for session lifecycle tracking, not for team ownership.

**Data flow:**
- The bot creates balanced teams from the initiating voice-channel roster and stores Discord IDs for both teams.
- The bot creates a tournament code and persists an active session with status `LOBBY`, including the configured unity voice channel.
- Players enter the custom lobby using the tournament code with any Riot account already linked to their Discord user.
- The poller repeatedly queries `lobby-events/by-code/{tournamentCode}`.
- When `ChampSelectStartedEvent` appears, the bot marks the session `CHAMP_SELECT_STARTED`, resolves each stored Discord ID to a guild member, and attempts to move them into the configured team voice channels.
- Members already in any guild voice channel are moved directly.
- Members not in voice are skipped and sent a DM containing an invite link to their team voice channel.
- After a successful one-time move, the session is marked `MOVED` so the action is not repeated.
- Riot sends a POST callback to this project's HTTP endpoint when the game finishes.
- The callback handler identifies the matching active session by tournament code, stores the completion signal, and marks the session `COMPLETED_PENDING_GATHER`.
- A completion handler moves every user currently inside the two team voice channels into the configured unity voice channel, then marks the session `COMPLETED`.

**Voice move rules:**
- The move scans the full guild voice state, not just the original waiting room.
- A member found in any voice channel in the same guild is moved to the assigned team channel.
- A member not found in voice is not treated as an error; the bot sends a DM with the proper team channel invite link.
- If a DM cannot be delivered, the bot logs the failure and reports the affected user in the guild response or logs without aborting the rest of the move.
- The post-game gather move is narrower: it only moves members who are currently in either team voice channel into the configured unity voice channel. It does not DM absent users because the requirement is to gather the users already in the team rooms.

**Callback and website direction:**
- The project should expose an HTTP server even before the full ranking/record website is built.
- The initial HTTP scope is intentionally small: health check, Riot callback endpoint, and internal session update plumbing.
- This keeps the callback requirement satisfied now while leaving room for the future public ranking and match-history pages to reuse the same web server.

**Match result ownership:**
- Match updates keep using Discord-centric MMR.
- When replay or result ingestion resolves Riot participants, the system maps any registered Riot account back to the owning `discord_id`.
- Stat changes and MMR updates apply to the `user` row for that Discord ID, regardless of which linked Riot account was used in the match.

**Error handling and safety rails:**
- If tournament code creation fails, `/내전` should fail before creating a new active session.
- If the server has no configured unity voice channel, `/내전` should fail with a clear admin-facing message instructing them to set `/서버설정 공용통화방`.
- If the poller cannot fetch lobby events temporarily, it retries on the next interval without cancelling the session.
- If champion select starts but one or more Discord users are missing from the guild, the move continues for the rest and records the missing users.
- If `/내전` is rerun, the old session is cancelled before the new one is persisted so only one active auto-move target exists per guild.
- If no active session exists, the poller does nothing.
- If the callback arrives for an unknown or already completed tournament code, the server responds safely and logs the mismatch instead of failing the whole process.
- If the unity voice channel no longer exists at gather time, the session is marked failed and reported so an admin can repair the configuration.

**Testing strategy:**
- Add schema tests for the new `riot_accounts` and `active_tournament_sessions` tables.
- Add query-layer tests for multi-account registration and active-session replacement.
- Add command-shape tests for the updated `/내전`, `/등록`, and `/서버설정` payloads.
- Add unit tests for the session poller to verify `ChampSelectStartedEvent` triggers a one-time move and rerun cancellation suppresses stale sessions.
- Add unit tests for the voice move helper to verify cross-channel moves and DM fallback behavior.
- Add callback-handler tests to verify a tournament completion signal gathers the team voice channels into the configured unity voice channel.
