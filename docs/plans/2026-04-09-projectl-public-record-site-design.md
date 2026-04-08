# ProjectL Public Record Site Design

**Context:** `projectL` is currently a Discord bot with a lightweight HTTP server used for health checks and Riot tournament callbacks. The bot already stores guild-scoped inhouse match records in MariaDB across `user`, `matches`, and `match_in_users`, and exposes part of that data through Discord slash commands such as `/랭킹` and `/전적`. There is no public website yet, and users must rely on Discord responses to inspect records.

**Product direction:** Build a public website inspired by the information hierarchy and scanning experience of [OP.GG 메인](https://op.gg/ko) and [OP.GG 소환사 상세 예시](https://op.gg/ko/lol/summoners/kr/faker%EC%9D%91%EC%9B%90%ED%95%A9%EB%8B%88%EB%8B%A4-faker), while restricting the data scope to internal inhouse matches only. The site should be readable without login, prioritize fast scanning, and make it easy to move from a league-wide overview into one player's detailed history.

**Decision:** Extend the existing Node HTTP server so it serves both the Riot callback endpoint and a public SSR website. Render HTML on the server, keep client JavaScript minimal, reuse the existing guild database, and add a small set of public routes for the home page, match list, player profile, and player search.

**Approaches considered:**
- **Recommended: extend the current Node HTTP server with SSR pages and static assets.**
  This fits the current codebase, avoids introducing a front-end build pipeline, keeps deployment simple, and is enough to ship a polished OP.GG-inspired first version.
- **Alternative: add a separate SPA frontend and JSON API.**
  This would provide richer client-side interactions, but it would significantly expand the scope with a new build toolchain, asset pipeline, and deployment shape.
- **Alternative: generate static HTML snapshots on a schedule.**
  This is easy to host, but it makes records stale and weakens match-level and player-level drill-down.

**Why the recommendation fits:**
- The project already owns an HTTP entry point in `scripts/Web/CallbackServer.js`.
- The required data already exists in MariaDB and is mostly denormalized enough to render quickly.
- The first version needs polished presentation more than deep client interactivity.
- Public SSR pages let search engines, shared links, and non-Discord users access the same pages directly.

**Goals:**
- Show an OP.GG-style public overview of all inhouse match records for a guild.
- Show a full public player profile page with summary stats, recent matches, champion trends, lane trends, and duo/friend performance.
- Preserve the existing Discord bot behavior and Riot callback behavior.
- Keep the first version focused on inhouse records only, with no external ranked data and no authentication.

**Non-goals:**
- No Riot solo queue, flex queue, or external account match history.
- No login, profile editing, or admin-only site controls.
- No new frontend framework or separate deployment service.
- No multi-guild directory in the first version beyond whichever guild database the bot is already configured to serve.

**Public information architecture:**
- `/`
  Public landing page and overview dashboard. This page acts like an OP.GG summary page for the inhouse league itself.
- `/matches`
  Full inhouse match history ordered by most recent first, with compact match cards.
- `/players/:discordId`
  Public player profile page analogous to a summoner profile page, but scoped to inhouse data.
- `/api/search`
  Lightweight JSON endpoint for player name lookup powering the header search box.
- `/health`
  Existing health check remains intact.
- `POST /riot/callback`
  Existing Riot callback remains intact.

**Page design and UX:**
- **Home page**
  A wide hero area with a bold title, compact description, and a search input for player names. Below that, summary cards show total matches, registered players, current top MMR, highest win-rate player subject to a minimum game threshold, and latest completed match. The main body combines a ranking table and a recent-match feed so the page supports both leaderboard scanning and activity browsing.
- **Matches page**
  A vertical list of dense match cards styled for scan speed. Each card shows date/order, game length, blue/purple result, both team rosters, the best-performing player on each side, and compact KDA/champion rows. Filters are limited to what the current data supports cleanly, such as player search and optional winner-side filtering.
- **Player page**
  A profile header with player name, MMR, wins/losses, win rate, average KDA, average kill participation, favorite champions, and preferred lanes. The body contains recent matches, champion performance tiles, lane breakdown, and teammate synergy based on the existing `friends` aggregate. This should feel like an OP.GG profile page, but with data shaped around custom inhouse sessions rather than solo queue.

**Visual system:**
- Bright, clean base with dark navy text, cool blue highlights, crisp cards, and separate win/loss colors.
- Strong use of sections, borders, row density, and asymmetric layout to avoid generic dashboard styling.
- Search-forward header and stat cards inspired by OP.GG's information hierarchy, not a literal clone.
- Responsive layout that keeps leaderboard and profile sections readable on mobile without collapsing into unusable tables.

**Server architecture:**
- Keep a single Node process hosting both Discord bot behavior and the public web server.
- Split current callback-only server code into a small router that can serve:
  - health check
  - Riot callback POST
  - public HTML pages
  - static assets under a `/public` namespace or similar
  - JSON search endpoint
- Add dedicated web view/render modules so HTML generation does not live inline inside the request router.

**Data access strategy:**
- Reuse the guild-scoped MariaDB connection flow already implemented in `scripts/Utils/Query.js`.
- Add read-only query helpers for:
  - league-wide summary stats
  - public ranking rows
  - recent matches with pagination-ready ordering
  - player profile aggregates
  - player recent matches
  - player search results
- Parse the stored `matches.blue_team` and `matches.purple_team` JSON payloads into web-friendly card models in a separate formatter layer instead of formatting directly inside route handlers.

**Computed metrics:**
- **League summary**
  Total matches, distinct registered players, top MMR, top win rate with a reasonable minimum-games rule, most recent match.
- **Player summary**
  Games played, wins, losses, win rate, current MMR, average KDA, average kill participation, total pentas/quadrakills.
- **Champion breakdown**
  Derived from the existing `champions` JSON field on `user`.
- **Lane breakdown**
  Derived from the existing `lanes` JSON field on `user`.
- **Friend synergy**
  Derived from the existing `friends` JSON field on `user`.
- **Recent match list**
  Derived from `matches` plus `match_in_users`, with participant rows expanded from the stored team JSON.

**Error handling and empty states:**
- If the guild database is not initialized, public pages should render a friendly setup-required state rather than a raw stack trace.
- If no matches exist yet, the home page and matches page should show a zero-state layout that still keeps the site visually complete.
- If a player does not exist, `/players/:discordId` should return a clean 404 page.
- If a single match payload cannot be parsed, skip or degrade that card instead of failing the full page.
- Search should return an empty list rather than a server error for no matches.

**Testing strategy:**
- Add query-layer tests for new summary, ranking, player, and search helpers.
- Add formatter tests that transform stored match JSON into stable card/view models.
- Add route tests for `/`, `/matches`, `/players/:discordId`, `/api/search`, and 404 behavior.
- Add static asset smoke coverage so CSS/JS delivery does not break route handling.
- Keep existing callback and session-poller tests passing to protect current bot behavior.

**Operational notes:**
- The site is public, so routes must not leak secrets or raw internal config.
- Search responses should expose only the data already intended for public profile pages.
- Because this is SSR on the same server, performance should come from simple SQL and inexpensive formatting rather than client caching complexity.
- The callback endpoint and website must coexist safely on the same `WEB_PORT`.

**Future-ready extension points:**
- Pagination for match history.
- Per-match detail page if users later want a deeper breakdown.
- Multi-guild routing if the bot becomes a true public multi-tenant service.
- Static image badges or champion icons if asset management is later added.
