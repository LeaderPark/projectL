# Player Page Refresh Button Placement Design

**Context:** The player page sidebar currently renders the `닉네임 새로고침` action on its own line between the `등록된 롤 닉네임` heading and the linked Riot account list. That makes the action feel detached from the section title and interrupts the reading flow inside an otherwise compact sidebar card.

**Decision:** Treat the refresh action as a header-level secondary action for the `등록된 롤 닉네임` section. The heading stays on the left, while the button sits on the right as a compact capsule control that visually matches the dark glassmorphism sidebar UI.

## Layout

- Wrap the heading and form in a shared section header row.
- Keep the linked Riot account list unchanged under the header row.
- Allow the row to wrap on smaller screens so the button can fall below the heading without clipping.

## Visual Direction

- Use a compact pill button with a subtle border and translucent navy background.
- Add a hover state with a slightly brighter background and stronger border contrast.
- Add a visible focus ring that matches the site's existing blue accent.
- Keep the control visually secondary so it supports the nickname section instead of competing with the page hero.

## Testing

- Update player-page view coverage to assert the new section-header wrapper and refresh button class.
- Re-run the player-page view test file after the markup and CSS change.
