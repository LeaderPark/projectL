# Public Site Discord Name Sync Design

**Context:** The public site currently renders `user.name` from the guild database on the home ranking, ranking page, player search results, and player profile. That value is written during Riot account registration, so it behaves like a stored Riot-facing label rather than the user's current Discord identity. The requested behavior is to show the current Discord name on ranking and record surfaces, while still exposing the Riot nicknames a user registered on their personal page.

## Goals

- Show the current Discord-facing name on public ranking and player profile surfaces.
- Do not persist Discord display names ahead of time.
- Handle renamed Discord users by resolving names at render time.
- Show every Riot account registered by the player on the personal page.

## Non-Goals

- Rewriting stored historical match payload player names.
- Migrating or removing the existing `user.name` column.
- Reworking MMR, win/loss, or match detail calculations.

## Recommended Approach

Resolve Discord names in the web layer at request time instead of updating the database. The public site already has route-level guild context, so it can ask the Discord client for the current guild member and derive the display name from live Discord data.

Name resolution order:

1. `GuildMember.displayName`
2. `User.globalName`
3. `User.username`
4. Stored fallback from `user.name`

This keeps the site responsive to Discord nickname changes while preserving a graceful fallback if the member lookup fails or the user has left the guild.

## Data Flow

### Ranking and Home

- Keep the existing leaderboard queries for ordering and stats.
- After the query returns, resolve current Discord names for the listed `discord_id` values.
- Replace the visible `name` field in the render model with the live Discord display name.

### Player Page

- Keep the existing profile query for aggregate stats.
- Extend the profile payload with linked Riot accounts from `riot_accounts`.
- Resolve the page owner's Discord display name just before formatting.
- Render the linked Riot accounts in a dedicated panel on the player page.

### Search

- Keep the existing search path and result shape.
- Replace returned display labels with live Discord names so the visible suggestion text matches the ranking and profile pages.

## Error Handling

- If guild lookup fails, fall back to the stored `user.name`.
- If a specific member lookup fails, fall back to `globalName`, then `username`, then stored `user.name`.
- If linked Riot accounts cannot be read, keep the player page available and render an empty linked-account list.

## Testing Strategy

- Add service-level tests proving leaderboard, search, and player page models use live Discord names when available.
- Add player-page view tests for the new linked Riot account section.
- Keep formatter tests focused on data shaping, not Discord API behavior.
