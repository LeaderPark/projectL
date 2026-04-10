# Public Match Card Action Design

**Context:** The public recent-match card currently renders the detail link as plain `링크` text on the right side of the summary row, while the expand caret lives inside the summary button grid. That makes the action hierarchy unclear and lets the caret position drift when the card opens or closes.

**Decision:** Keep the expand control on the existing right-side track, but convert it into a fixed-size chevron button that only rotates in place. Move the detail navigation into a separate `상세 보기` button placed at the top-right corner of the card container as a rounded rectangle.

**Why this works:**
- It matches the requested hierarchy: the card-level action becomes a clear top-right button, while the inline expand affordance stays where users already expect it.
- It prevents layout jitter because the chevron no longer depends on text glyph metrics or row content height.
- It keeps the summary area accessible by separating the navigation link from the expand/collapse toggle.

**Rendering changes:**
- Update `scripts/Web/views/ViewHelpers.js` so each match card renders a dedicated top-right action link labelled `상세 보기`.
- Replace the current caret text node with a structural chevron element that can be styled entirely in CSS.
- Preserve the existing expand button semantics and the current right-side chevron placement.

**Styling changes:**
- Update `public/site.css` so the summary area reserves space for a top-right action button without overlapping card content.
- Style the new detail link as a rounded rectangular button and anchor it to the card container's upper-right corner.
- Keep the chevron in a fixed square hit area and rotate only the icon, not the container.

**Testing changes:**
- Extend `tests/public-site-views.test.js` to assert that match cards render the `상세 보기` action, the dedicated action wrapper, and the chevron structure.
- Add CSS assertions that protect the top-right action layout and the fixed-position rotating chevron behavior.
