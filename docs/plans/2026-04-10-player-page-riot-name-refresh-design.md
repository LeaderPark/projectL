# Player Page Riot Name Refresh Design

**Context:** `projectL` uses Riot `puuid` as the durable account identifier, while public-facing Riot names are stored in `riot_accounts` and mirrored into `user.name` for representative display. Match ingestion already stays stable when a Riot account changes its `gameName` or `tagLine`, but the stored Riot-name fields remain stale until something rewrites them. The user wants a manual refresh flow on the public player page rather than automatic background synchronization.

## Goals

- Add a public refresh button on the player page that checks the latest Riot names for the player's linked accounts.
- Update stored Riot account names only when the button is pressed.
- Keep `puuid` as the matching key for ingestion and identity resolution.
- Show the representative Riot account name everywhere on the public site, including recent matches and match detail pages.
- Limit refresh traffic with a per-player cooldown of 5 minutes.

## Non-Goals

- Automatically refreshing Riot names during callback ingestion, page rendering, or Discord command execution.
- Rewriting stored historical match JSON payloads in `matches`.
- Adding viewer authentication or restricting who may trigger the refresh.
- Changing MMR, win/loss, or match-linking logic.

## Recommended Approach

Keep Riot identity matching anchored on `puuid`, but add a manual public-site refresh path that updates the stored Riot account names for one player on demand. The refresh action should live on the player page as a server-rendered form that submits to a new POST route. The backend will look up the player's linked `riot_accounts`, fetch the latest Riot account names by `puuid`, persist only changed rows, then resynchronize `user.name` from the representative account.

Public-site rendering should continue to use the stored representative name from `user.name`. The existing public-site rewrite path that maps linked participant `puuid` values back to `user.name` should remain in place so historical cards and match details immediately reflect the refreshed representative Riot name without mutating stored match payloads.

## Route And UX

- Add a `닉네임 새로고침` button to the player-page sidebar.
- Implement the button as a plain HTML `<form method="POST">` so it works without client-side JavaScript.
- Add a new route: `POST /:serverId/players/:discordId/refresh-riot-accounts`
- After processing, always respond with `303 See Other` back to `/:serverId/players/:discordId`.
- Encode the outcome as a query parameter so the page can render a short status banner:
  - `updated`
  - `unchanged`
  - `partial`
  - `failed`
  - `throttled`

## Refresh Data Flow

1. The player page renders the refresh form and, when present, a banner derived from the `refresh` query string.
2. A visitor clicks the refresh button for a player profile.
3. The POST handler validates the guild-scoped player exists and checks the player-level cooldown.
4. If the player is still in cooldown, the handler redirects back with `refresh=throttled`.
5. Otherwise, the handler loads every linked account from `riot_accounts` for that `discord_id`.
6. For each account, the backend fetches the latest Riot account identity by `puuid`.
7. Only rows whose latest `gameName` or `tagLine` differ are updated.
8. After all account fetches complete, the backend finds the `is_primary = 1` account and synchronizes `user.name` to that account's latest display name.
9. The handler redirects back to the player page with the appropriate result code.

## Data Model Rules

- `puuid` remains the only durable account identifier for Riot identities.
- `riot_accounts.riot_game_name` and `riot_accounts.riot_tag_line` become manually refreshed profile data.
- `user.name` remains a cached copy of the representative Riot display name.
- Even if a non-primary account changed, `user.name` must still be recomputed from the primary account after refresh.
- Recent matches and match-detail pages must keep rewriting linked participant names to `user.name`, which means every linked participant appears under the representative Riot name rather than the specific account used in the game.

## Riot API Integration

The current Riot helper resolves from Riot ID to `puuid`, which is the opposite of what this feature needs. Add a dedicated helper that fetches Riot account identity by `puuid` and returns the latest `gameName` and `tagLine`. This helper should be used only by the new player-page refresh flow.

## Cooldown Strategy

- Store a process-local cooldown map keyed by `guildId:discordId`.
- The cooldown window is 5 minutes from the start of the last accepted refresh.
- Cooldown is checked before making Riot API requests.
- A throttled request should not touch the database.
- Because the cooldown is in-memory, it resets on process restart. That is acceptable for this feature.

## Error Handling

- If the player profile does not exist, redirect back to the player page path and let the existing 404 behavior stand.
- If some linked accounts refresh successfully and others fail, persist the successful updates, resync `user.name` from the current primary row, and return `partial`.
- If all Riot fetches fail or a fatal database write fails before any useful update, return `failed`.
- Refresh failures must not affect match ingestion, callback processing, or Discord command flows.

## Testing Strategy

- Add query-level tests for refreshing Riot account rows by `puuid` and resynchronizing `user.name` from the primary account.
- Add service-level tests covering:
  - changed Riot names become stored updates
  - unchanged Riot names return `unchanged`
  - non-primary updates do not change the representative name
  - partial Riot fetch failure returns `partial`
  - throttled requests skip Riot API and DB writes
- Add router tests for the new POST endpoint and `303` redirect behavior.
- Add player-page view tests for the refresh button and status banner.
- Keep recent-match and match-detail regression tests to confirm linked participants still render through `user.name`.
