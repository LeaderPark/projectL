# Ranking Top3 Emphasis Design

**Context:** The ranking page already has top-three-specific row and badge treatment, but the current `TOP` label and strong podium styling feel visually heavier than the rest of the page. The goal is to keep the first three ranks feeling special while making the ranking table look more cohesive and less over-decorated.

**Decision:** Keep the table structure intact and preserve top-three-specific presentation inside the existing first column and row styles, but simplify the badge content to the rank number only and soften the visual contrast. Use a lighter medal-chip treatment for the badge and reduce the row gradients so the table still scans cleanly.

## Approaches Considered

- **Recommended: badge + row emphasis hybrid.**
  This keeps the current table readable while making the top three noticeable at a glance. It also fits the existing panel-based visual system without turning the table into cards.
- **Alternative: turn the first three rows into separate cards above the table.**
  This would create stronger visual hierarchy, but it duplicates ranking data and makes the page longer and more complex.
- **Alternative: style only the rank number.**
  This is very safe, but the effect is too subtle for the request and does not make the podium rows feel special enough.

## UI Direction

- Keep all leaderboard rows in the same table.
- Keep a dedicated rank badge wrapper for rows `1` through `3`.
- Remove the `TOP` text label entirely so the rank marker reads more cleanly.
- Use gold, silver, and bronze tones for the three badges, but with smaller height, tighter padding, and softer shadows.
- Keep a light gradient background and border tint for the top-three rows only, but reduce saturation and spread so the effect feels integrated rather than flashy.
- Give rank `#1` one extra layer of emphasis through tone and contrast, not extra copy.

## Markup Strategy

- Update `buildRankCell` in `scripts/Web/views/RankingPage.js`.
- Keep row classes for `ranking-table__row--top-1`, `--top-2`, and `--top-3`.
- Keep the nested badge element for top-three entries, but remove the badge label span so the markup only needs the number.
- Leave ranks `4+` as plain text to preserve scan speed.

## Styling Strategy

- Refine the existing podium-specific table row styles in `public/site.css`.
- Keep contrast high enough for the current dark theme, but lower the intensity of glow and hover effects.
- Reduce badge padding, border radius, and shadow depth so the first column feels more aligned with the rest of the table.
- Limit the effect to the ranking page table so the home-page preview stays simple unless explicitly requested later.
- Keep a mobile-friendly reduction in badge size and padding so the first column does not become cramped.

## Testing Strategy

- Extend the ranking page view test to assert top-three row classes and badge markup still exist.
- Add a regression assertion that the ranking page no longer renders the `TOP` label.
- Keep CSS assertions focused on the presence of the top-three selectors and responsive badge sizing hooks.
- Run the ranking-related view tests first, then the full `tests/public-site-views.test.js` suite.

## Scope Notes

- No sorting or data changes are needed.
- No icon assets are required; the effect can be achieved with HTML and CSS alone.
- The existing table structure remains the source of truth for all ranks.
