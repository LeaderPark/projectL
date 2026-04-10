# Player Page Main Match Design

**Context:** The player page currently splits `주 챔피언`, `선호 라인`, `함께 잘 맞는 팀원`, and `최근 경기` across two equal content grids. That makes the recent match feed feel like just another side card instead of the primary content on the page.

**Decision:** Reframe the body beneath the hero as a two-column shell. The left column becomes the primary timeline area and contains only `최근 경기`. The right column becomes a secondary sidebar panel that groups `주 챔피언`, `함께 잘 맞는 팀원`, and `선호 라인` into stacked sections.

**Why this works:**
- It matches the requested hierarchy: recent matches become the visual focus, while the profile tendencies read as supporting context.
- It reduces card scattering by consolidating the right-side information into one panel instead of three separate peers.
- It preserves mobile usability by allowing the layout to collapse into a single column with recent matches first.

**Rendering changes:**
- Update `scripts/Web/views/PlayerPage.js` to replace the two `content-grid` sections with a dedicated player-page shell.
- Keep the existing hero stats intact so only the lower body changes.
- Reuse `renderSimpleRows` for each sidebar section to avoid formatter changes.

**Styling changes:**
- Add new page-specific layout classes in `public/site.css` for the player-page shell, main column, sidebar, and sidebar sections.
- Keep the layout responsive so the shell collapses to one column at the existing tablet/mobile breakpoints.
- Preserve the current panel visual language and use spacing/separators rather than introducing a brand-new card style.

**Testing changes:**
- Extend `tests/public-site-views.test.js` to assert the new player page structure exists in the rendered HTML.
- Add CSS assertions for the new player-page shell and sidebar section layout so the hierarchy is protected against regressions.
