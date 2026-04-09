# Performance Score Naming Design

**Context:** The project currently uses `user.mmr` as the persistent matchmaking rating and also stores a per-match `player.mmr` inside serialized match JSON. After the recent Elo change, those two fields no longer mean the same thing, but they still share the same name.

## Recommended Approach

Keep the persistent user rating as `MMR`, and rename the per-match stat field to `performanceScore`.

### Why this is the right split

- `user.mmr` is now the long-term matchmaking rating used for ranking and balanced lobbies.
- Per-match score is still useful for MVP/ACE-style displays, but it is not the same thing as matchmaking rating.
- Renaming only the per-match field keeps the public leaderboard and team-balancing terminology stable.

## Alternatives Considered

### 1. Keep both fields named `mmr`

This is the lowest-effort path, but it keeps the current confusion alive and makes future bugs more likely.

### 2. Rename everything to generic `rating`

This would reduce the number of `mmr` references, but it would force larger UI and query changes for little practical gain because the visible ranking is still naturally understood as MMR.

### 3. Recommended: Keep `user.mmr`, rename match JSON field

This gives us the clearest semantic separation with the smallest migration surface.

## Data Compatibility

No database schema migration is required because the match payload is stored as JSON text in `matches.blue_team` and `matches.purple_team`.

- New matches should serialize `performanceScore`.
- Existing matches that already contain `mmr` must still render correctly.
- Readers should prefer `performanceScore` and fall back to legacy `mmr`.

## Affected Areas

- `scripts/Riot/MatchTransformer.js`
- `scripts/VO/player.js`
- `commands/components/matchHistory.js`
- `scripts/Web/formatters/PublicSiteFormatter.js`
- tests covering match transformation, match history formatting, and public match cards

## User-Facing Copy

- Persistent rating surfaces keep using `MMR`.
- Per-match displays should use `퍼포먼스 점수` when the value is shown explicitly.
- MVP/ACE heuristics should rank by `performanceScore`, with fallback for legacy match JSON.
