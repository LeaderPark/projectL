# ProjectL Tournament Callback Result Ingestion Design

**Context:** `projectL` currently stores match history and applies Discord-owned MMR updates only when a user uploads a `.rofl` replay through `/업로드`. The Riot tournament callback path already exists, but it only marks a session as completed so the bot can gather voice channels after the game. It does not persist match history or update player stats.

**Decision:** Keep the Riot callback as the trigger, but stop treating the callback body itself as the source of truth for match stats. Instead, use the callback's `shortCode` and `gameId` to enqueue result ingestion, fetch the full completed match from Riot, transform that payload into the existing internal `Match -> Team -> Player` shape, and persist the result through one atomic match-ingestion path that updates both `matches` and `user` data. Voice gather remains independent so it still runs even if result ingestion fails and needs retry.

**Approaches considered:**
- **Recommended: callback triggers Riot full-result lookup, then reuse the existing internal match model.**
  The callback remains lightweight and reliable, while match history and MMR continue to be computed from the detailed stats payload the current code already expects.
- **Alternative: parse the callback JSON directly and store only minimal winner/game metadata.**
  This is easier, but it cannot support the current champion, lane, KDA, kill participation, and Discord-centric MMR calculations without dropping existing behavior.
- **Alternative: keep `.rofl` upload as the only source of record.**
  This preserves current behavior, but it does not meet the new requirement to process results automatically from tournament completion.

**Why the recommended approach fits:**
- Riot's callback sample includes the identifiers needed to fetch the completed game, but not the detailed participant stats required by the current ingestion code.
- The project already has a stable internal match representation and downstream query logic, so transforming Riot's result into that shape is lower risk than rewriting ranking logic from scratch.
- It keeps the existing `/업로드` command available as a manual fallback while automatic ingestion is rolled out.

**Key validation result:**
- The callback body by itself is insufficient for the current ranking flow because the parser-backed path depends on detailed per-player fields such as champion, KDA, lane, vision score, damage dealt, PUUID, and multi-kill counts.
- Riot's official tournament documentation describes the callback as a completion signal and explicitly points developers to use the returned match identifier to fetch the full result.
- Therefore, automatic callback-based ingestion is feasible only when paired with a follow-up Riot result lookup.

**Architecture:**
- `callback server`: keeps accepting the Riot tournament POST and returns HTTP 200 quickly. Its job is to record the callback payload, game identifier, and ingestion status for the matching active session.
- `result ingestion state`: move result processing out of the callback request path. Each active tournament session stores enough state to retry result ingestion independently of voice gather, including `result_status`, `result_game_id`, `result_payload`, `result_attempts`, and `result_error`.
- `Riot result client`: extend Riot integration with a full-result lookup method. Tournament endpoints continue using platform routing such as `kr.api.riotgames.com`, while match-result lookup must use the correct regional routing such as `asia.api.riotgames.com` for KR.
- `match transformer`: convert Riot's completed match payload into the existing `Match`, `Team`, and `Player` value objects so the rest of the project can stay centered on the current domain model.
- `atomic persistence`: add one orchestration helper that validates the transformed match, inserts the `matches` row, links users through `match_in_users`, and updates Discord-owned user aggregates in a single database transaction.
- `session poller`: continue gathering voice channels for `COMPLETED_PENDING_GATHER`, and in the same loop also process pending or failed result-ingestion jobs until they succeed.

**Data flow:**
- Riot sends the tournament callback with `shortCode` and `gameId`.
- The callback handler finds the matching active session and marks it `COMPLETED_PENDING_GATHER` for voice handling.
- The same handler also records result-ingestion metadata on that session and marks `result_status = 'PENDING'`.
- The poller sees the pending result job, fetches the full result from Riot, and transforms it into the internal match shape.
- The persistence helper writes match history and Discord-owned stat updates transactionally.
- On success, the poller marks `result_status = 'INGESTED'`.
- On failure, the poller records the error, increments the attempt count, and leaves the job retryable without blocking voice gather.

**Transformation rules:**
- `gameId` becomes the unique `matches.game_id`.
- `info.gameDuration` is converted into the internal `gameLength`.
- Riot `participants` are split by `teamId` into blue `200` and purple `100` to match the current `Side` enum.
- Riot `win` is mapped to the current numeric `Result` model.
- `individualPosition` is mapped into the existing lane labels: `UTILITY -> SUPPORT`, `BOTTOM -> BOT`, `MIDDLE -> MID`, `TOP -> TOP`, `JUNGLE -> JUNGLE`.
- `kills`, `deaths`, `assists`, `visionScore`, `totalDamageDealtToChampions`, `puuid`, `championName`, `pentaKills`, and `quadraKills` flow directly into the current player shape.
- The current MMR formula remains unchanged and runs on the transformed player objects, not on replay-only data.

**Failure handling and retries:**
- If the callback has no `shortCode`, it is rejected as it is today.
- If the callback has a tournament code but no `gameId`, the session still proceeds to voice gather, while the result-ingestion state records a retryable error.
- If Riot result lookup returns a transient failure such as rate limiting or a temporary 404 just after game completion, the poller retries on the next interval.
- If the result has already been ingested for the same `gameId`, the persistence helper treats it as idempotent success and does not double-apply user stats.
- If result persistence fails after fetching Riot data, the transaction rolls back so retries do not leave half-written matches.

**Operational notes:**
- The repository currently defaults to `RIOT_TOURNAMENT_USE_STUB=true`. Unit tests can still cover the whole flow with mocked clients, but real end-to-end result ingestion should be validated against a real tournament environment because stub-mode match retrieval behavior is not guaranteed by the current codebase.
- `/업로드` should remain available until callback-based ingestion has been validated in production-like conditions.

**Testing strategy:**
- Add query-layer tests for the new result-ingestion session fields and retry state updates.
- Add Riot-client tests for regional base URL selection and full-result lookup behavior.
- Add transformer tests that prove a Match-v5-like payload becomes the current internal `Match` shape with correct lanes, teams, and MMR inputs.
- Add callback-handler tests that verify callback success now records both gather readiness and result-ingestion readiness.
- Add poller tests that verify result ingestion retries after failure while voice gather still completes.
- Add persistence tests that verify duplicate `gameId` handling is idempotent and user stats are updated only once.
