# ProjectL Public Site Guild Routing Design

**Context:** The public record site already renders a guild-scoped overview, match timeline, match detail page, and player profile page through `scripts/Web/PublicSite.js`, `scripts/Web/PublicSiteRouter.js`, and the SSR view modules in `scripts/Web/views`. Today that web surface is wired to a single configured guild via `preferredGuildId`, so the site always shows the same guild data regardless of the requested URL.

**Product direction:** Make the public site explicitly server-scoped in the URL so users can open `http://localhost:8000/<discord-server-id>` and immediately see only that server's record data. When visiting `/`, users should see only a server-id entry screen and move into the scoped site after entering a Discord server id.

**Decision:** Replace the single-guild public entry point with a route-aware public site. The root path `/` becomes a lightweight landing page with a server-id form. All public record routes move under `/:serverId/...`, and the route layer becomes responsible for extracting `serverId` and passing it into the public site handlers for every request.

**Approaches considered:**
- **Recommended: path-scoped guild routes with a root landing page.**
  This directly matches the requested UX, makes shared links unambiguous, and keeps every match/player page explicitly tied to a guild.
- **Alternative: keep one route tree and use `?serverId=` query parameters.**
  This requires slightly less route reshaping, but it produces weaker URLs and does not satisfy the requested direct-access shape as cleanly.
- **Alternative: store the last entered guild in the browser and keep existing routes global.**
  This is the smallest code change, but direct links, reloads, and search results become ambiguous and fragile.

**Why the recommendation fits:**
- The current router already centralizes GET route handling, so path-prefix parsing can be added without changing the callback server architecture.
- Public data access is already guild-scoped at the query layer, so only the guild-id source needs to move from config to request context.
- Existing SSR pages for overview, matches, match detail, and players can be reused with only link-generation updates.

**Goals:**
- Render a root landing page with a single Discord server id input and submit action.
- Render guild-specific public pages under `/:serverId`.
- Ensure all links and search redirects stay within the active guild namespace.
- Preserve existing Riot callback and health-check behavior.

**Non-goals:**
- No server discovery UI, guild picker dropdown, or auto-complete.
- No authentication or permission checks for public routes in this change.
- No multi-guild index page showing all available servers.
- No changes to the Discord bot command surface.

**Information architecture:**
- `/`
  Landing page with a server id input, validation message area, and submit button that navigates to `/<serverId>`.
- `/:serverId`
  Guild-scoped public overview page.
- `/:serverId/matches`
  Guild-scoped match history page.
- `/:serverId/matches/:matchId`
  Guild-scoped match detail page.
- `/:serverId/players?q=<name>`
  Guild-scoped player search redirect endpoint.
- `/:serverId/players/:discordId`
  Guild-scoped player profile page.
- `/:serverId/api/search?q=<name>`
  Guild-scoped JSON search endpoint.
- `/health`
  Existing health endpoint remains unchanged.
- `POST /riot/callback`
  Existing Riot callback remains unchanged.

**Routing design:**
- `PublicSiteRouter` should parse the incoming pathname into either:
  - a root landing route,
  - a static asset route,
  - or a guild-scoped route with `serverId` plus a remainder path.
- Static assets should stay outside guild scope at `/public/site.css` and `/public/site.js` so the existing layout can keep one shared asset path.
- `serverId` should be treated as an opaque string and passed through exactly as it appears in the path segment after URL decoding.

**Handler and data-flow changes:**
- `createPublicSiteHandlers` should stop depending on a single configured guild for request routing.
- Each renderer/search function should accept `guildId` explicitly:
  - `renderHomePage(guildId)`
  - `renderMatchesPage(guildId)`
  - `renderMatchDetailPage(guildId, matchId)`
  - `renderPlayerPage(guildId, discordId)`
  - `searchPlayers(guildId, query)`
- The runtime config value for `preferredGuildId` can remain as a fallback for other internals, but the public router should prefer the path-provided guild id for every public request.

**View and UX updates:**
- Add a dedicated landing-page renderer with:
  - one text input for the Discord server id,
  - one submit button,
  - client-side prevention for blank input,
  - form submission that routes to `/<serverId>`.
- Update home, matches, match detail, and player pages so all internal links preserve the active `serverId`.
- Update layout-level navigation and search behavior to generate guild-scoped URLs.

**Error handling:**
- Invalid or unknown guild ids should degrade gracefully:
  - overview and matches pages should show empty-state or setup-style messaging rather than crash,
  - match detail and player detail should still return clean 404 pages when the target record does not exist within that guild.
- Root-page validation should block empty submissions on the client before navigation.
- Search endpoints should return an empty array when the guild or query has no matches.

**Testing strategy:**
- Add router tests for:
  - `/` returning the landing page,
  - `/:serverId` returning the guild-scoped home page,
  - `/:serverId/api/search` returning JSON,
  - `/:serverId/players?q=...` redirecting within the same guild,
  - `/:serverId/matches/:matchId` returning a detail page,
  - `/:serverId/players/:discordId` returning 404 when missing.
- Update service tests to verify the guild id passed into handlers comes from the route argument rather than a fixed configuration value.
- Update view tests to verify the landing page markup and guild-scoped links.

**Operational notes:**
- This change remains SSR-only and should not require a new build step.
- Existing callback-server behavior must continue to short-circuit callback and health routes before public-route handling.
- Because the workspace already contains in-progress public-site changes, implementation should be careful not to overwrite unrelated markup or formatting work.
