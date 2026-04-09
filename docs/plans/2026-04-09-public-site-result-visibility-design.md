# Public Site Result Visibility Design

**Context:** The public ProjectL site currently reuses the same match card and match detail rendering across the home page, the full match timeline, the player page, and the match detail page. Because the shared renderer always prints `승리` and `패배`, result status is exposed everywhere a match appears.

**Decision:** Keep result data in the formatter layer, but move result text exposure behind view-level rendering options so only the player page renders win/loss labels. Public pages that anyone can access, including the home page spotlight, the full match timeline, and the match detail page, must hide explicit result labels while still preserving team structure and existing links.

## Approaches Considered

- **Recommended: add view-level visibility flags.**
  Keep `winningSide` and team summaries intact in the formatter output, then add `showResult` or equivalent options in the shared card renderer and match detail renderer. This keeps the data model stable and limits the behavior change to the presentation layer.
- **Alternative: strip result text in the formatter for public pages.**
  This would work, but it spreads route-specific presentation rules into formatting logic and makes future page-specific behavior harder to reason about.
- **Alternative: split public and private card components.**
  This is the most explicit option, but it adds duplication for a small policy change.

## Rendering Rules

- `HomePage`: hide explicit `승리/패배` labels in the spotlight copy and in recent match cards.
- `MatchesPage`: hide explicit `승리/패배` labels in timeline cards.
- `MatchDetailPage`: hide explicit `승리/패배` labels in team headers.
- `PlayerPage`: keep explicit `승리/패배` labels visible in recent match cards.

## Testing Strategy

- Update view tests to assert public pages no longer contain `승리` or `패배`.
- Add a player-page assertion proving private profile match cards still show result labels.
- Add a handler-level regression test covering both behaviors through the rendered HTML.

## Scope Notes

- No database or query change is required.
- Existing team ordering and any styling based on `winningSide` remain unchanged.
- The change is presentation-only and should not affect routing or API responses.
