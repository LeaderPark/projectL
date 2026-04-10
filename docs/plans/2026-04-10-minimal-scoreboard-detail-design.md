# Minimal Scoreboard Detail Design

**Goal:** Keep the inline opened match panel simple while preserving the full stats-heavy scoreboard on the dedicated match detail page.

**Decision:** Split the shared scoreboard helper into two rendering modes:
- `compact` for the inline opened panel with only `플레이어`, `OP Score`, and `KDA`
- `full` for the dedicated detail page with team header summaries, damage/vision/CS/item columns, gauge bars, and the middle totals comparison block

**Why:** The inline panel should stay scannable in the feed, but the dedicated detail page is the place where players expect the full stat table.

**Affected surfaces:**
- inline expanded match card detail uses the compact mode
- dedicated match detail page uses the full mode

**Validation:** Update SSR view, route, and service tests so the inline panel asserts the reduced columns while the dedicated detail page asserts the restored totals/build/bar markup.
