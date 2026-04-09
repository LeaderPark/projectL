# Public Site Ranking Page Design

**Context:** The public site already exposes a ranking preview on the guild home page, but there is no dedicated category for ranking like the existing full match timeline or player profile pages. Users want a `/ranking` style page that shows the ranking for every player in the guild with the same overall UI direction as the rest of the public site.

**Decision:** Add a dedicated guild-scoped ranking page at `/:guildId/ranking` that reuses the existing public leaderboard query and formatter model. Keep the home page preview as-is for quick scanning, and move the full list to the new page so the information architecture stays consistent with the existing `홈`, `전체 경기`, and `플레이어` flows.

## Approaches Considered

- **Recommended: add a server-rendered ranking page that reuses the current leaderboard query.**
  This keeps the existing data contract, matches the current HTML rendering architecture, and adds the smallest possible amount of new code.
- **Alternative: expand the home page ranking table to include every user.**
  This avoids a new route, but it makes the home page long and less focused, and it breaks the current pattern of giving major content areas their own page.
- **Alternative: add a JSON API and render the ranking client-side.**
  This would help if sorting and filtering were needed immediately, but it adds complexity that the current request does not require.

## Routing And Data Flow

- Add `/:guildId/ranking` to the public site router.
- Add `renderRankingPage(routeGuildId)` to the public site handlers.
- Reuse `getPublicLeaderboard(guildId, limit)` for both pages:
  - Home page keeps a limited preview.
  - Ranking page requests the full list by omitting the limit.
- Reuse `formatLeaderboardEntry` so both pages show the same public-safe fields.

## UI And UX

- Add a `랭킹` navigation item in the shared site header.
- Use the same hero + panel structure as the existing public pages.
- Render a full-width ranking table with:
  - rank
  - player name
  - record
  - win rate
- Keep player names linked to the existing profile route.
- Follow the current dark theme and panel styling instead of introducing a new visual language.

## Testing Strategy

- Add a route test for `/:guildId/ranking`.
- Add handler tests to confirm the new page uses the scoped guild id and renders leaderboard rows.
- Add view tests for the new ranking page and header navigation.
- Run the targeted public-site regression suite after implementation.

## Scope Notes

- No database schema change is required.
- Ranking order stays the same as the existing public leaderboard: `MMR DESC, name ASC`.
- The public page continues to hide exact MMR values and shows only public-safe summary fields.
