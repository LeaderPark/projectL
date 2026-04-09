# ProjectL OP.GG-Style Public Record Redesign Design

**Context:** `projectL` already serves a public SSR site from the same Node process as the Discord bot. The site has working routes for the home page, match history, player profiles, and search, but the current presentation is a light dashboard rather than a dense match-analysis experience. Match payloads already store enough structured data to support a much richer UI, including champion names, lane, level, CS, total damage, vision score, summoner spells, keystone rune, inventory, and per-player performance score.

**Product direction:** Redesign the public record site so the **match area** feels intentionally almost identical to OP.GG's match-history workflow. The user explicitly wants the match layout and UX copied as closely as possible, while allowing only slight tone adjustments to the color palette. We should therefore prioritize the same fast-scanning rhythm: compact match rows, left-side result strip, inline expansion rather than page-first drill-down, tabbed detail panes, and real Riot imagery for champions, items, summoner spells, and runes.

**Decision:** Keep the existing server-rendered architecture, but pivot the public match presentation to an OP.GG-style inline expansion model. The primary UX should live in `/matches` and any recent-match feed that reuses its rows: a collapsed match row that expands in place into a tabbed detail panel. Keep `/matches/:id` only as an optional deep-link fallback, but treat it as secondary. Add a Riot static asset service based on Data Dragon so the UI uses actual icons instead of text chips.

**Approaches considered:**
- **Recommended: OP.GG-style inline expansion rows with a shareable fallback detail page.**
  This matches the requested UX most closely because the user interacts with match data primarily as a list of expandable rows.
- **Alternative: dedicated match-detail pages as the primary interaction.**
  This is clean technically, but it does not match the specific UX the user asked us to reproduce.
- **Alternative: modal overlays for detail.**
  This still diverges from OP.GG and complicates browser navigation.

**Why the recommendation fits:**
- The stored match JSON already contains nearly all of the fields needed for OP.GG-like expanded rows.
- The current public-site JS is minimal, so adding row expansion and tab switching is still lightweight.
- SSR can render the full row content up front, while a small client script controls expand/collapse and tabs.
- Riot Data Dragon provides the image assets needed to match the visual rhythm more faithfully.

**Goals:**
- Redesign the match rows and expanded match detail panes to mirror OP.GG's layout and interaction flow as closely as the available dataset allows.
- Replace text placeholders for champion, item, summoner spell, and rune information with actual Riot-sourced images.
- Preserve the current public search flow and existing routes, but make inline match expansion the main UX.
- Reuse only data already stored in ProjectL's inhouse match records.

**Non-goals:**
- No ranked solo queue import, Riot timeline data, bans, or gold-over-time charts.
- No new frontend framework, asset build pipeline, or JSON-first frontend app.
- No admin editing controls or authentication work.
- No attempt to reproduce every OP.GG interaction one-for-one if the current dataset cannot support it.

**Information architecture:**
- `/matches`
  This becomes the canonical primary page for the OP.GG-like experience. It should render a stack of expandable match rows.
- Match rows
  Each row should collapse by default and expand inline into a tabbed detail module.
- `/`
  The home page can reuse the same row component for recent matches, but the full OP.GG interaction density should center on the matches view.
- `/players/:discordId`
  Keep as a supporting route, but recent-match rows there should reuse the same expandable component.
- `/matches/:id`
  Preserve as an optional deep-link fallback for direct sharing, but not as the primary interaction.
- `/api/search`
  Keep unchanged.

**Page design and UX:**
- **Shared shell**
  Keep the surrounding shell lightweight so the eye lands immediately on the match list. The match module should dominate the page visually.
- **Collapsed match row**
  Mirror OP.GG's row pattern: a colored result strip at left, compact match meta, champion/spell/rune cluster, KDA block, item row, player-result snippets, and a caret affordance.
- **Expanded match detail**
  Expanding a row should reveal a tab bar and a dense scoreboard panel underneath the summary row, closely resembling the provided screenshot.
- **Tabs**
  Include the OP.GG-like tab rhythm such as `종합`, `OP 스코어`, `팀 분석`, `빌드`, `기타`. If some tabs must reuse the same underlying data due ProjectL constraints, the layout should still follow the expected interaction model.
- **Images**
  Champion portrait, item icons, summoner spell icons, and keystone rune icons should all be rendered as actual images from Riot static data.

**Data shaping strategy:**
- Replace the current summary-card-centric formatter with an expandable-row model that contains:
  - collapsed row metadata
  - image URLs for champion, items, spells, and rune
  - expanded tab sections
  - per-team totals and player detail rows
- Extend the Riot static data layer so formatter output can attach image URLs instead of raw ids.
- Preserve champion/lane localization through the existing formatter options flow.

**Routing and server changes:**
- Keep `/matches/:id` support, but focus route rendering work on richer `/matches` rows.
- Extend the handler formatter options to include Riot asset metadata.
- Continue returning friendly 404 pages for deep-link misses.

**Error handling and empty states:**
- Missing guild configuration should still show the existing setup-required state.
- Empty home and match-history pages should render complete shells with an empty-state panel instead of blank sections.
- Missing match ids should route to a clean 404 page with a "back to matches" path.
- If match JSON is malformed, degrade the individual card or detail section rather than breaking the page render.

**Testing strategy:**
- Add Riot static asset service tests for version resolution and icon URL generation.
- Add formatter tests for expandable-row models, inline tab sections, and image URLs.
- Add view tests for OP.GG-style collapsed rows plus expanded detail panes.
- Add client-JS tests or string-level hooks for row expansion and tab targeting where practical.
- Keep the existing public-site and callback tests passing.

**Implementation constraints:**
- The repository currently has unrelated in-progress modifications in the public-site area, so edits must preserve and extend the current working tree rather than reverting it.
- The redesign should stay SSR-friendly and avoid introducing dependencies beyond the current stack.
- The match data alone must drive the copied UX; account-level ranked profile widgets are intentionally out of scope.

**Future-ready extension points:**
- Asset caching and local mirroring if Data Dragon latency becomes noticeable.
- Optional player filters on `/matches`.
- Per-player contribution badges or MVP/ACE markers derived from existing performance score data.
- Deeper team-analysis metrics if more match fields are stored later.
