# Public Site MMR Privacy Design

**Context:** The public record site currently exposes exact MMR values on the home summary, public ranking table, and player profile. The user wants the ranking order to remain MMR-based internally, but the exact MMR number must not be shown publicly. The same public site also needs a few fake match records so the UI can be checked with realistic data.

**Decision:** Keep all existing query behavior and MMR-based ordering on the server, but remove exact MMR fields from the public presentation layer. Seed a small set of demo players and matches directly into the configured public guild database using clearly fake names and unique IDs so the site can be tested immediately without touching real match history.

**Why this fits this project:**
- Sorting remains unchanged, so matchmaking and ranking behavior stay consistent.
- Privacy is enforced at the public view/model layer, which is where exposure currently happens.
- Demo data can be inserted into the mostly empty guild database without overwriting real match history.

**Architecture:**
- `scripts/Web/views/HomePage.js`: remove the exact-MMR summary card and MMR column, and rename the ranking section to a neutral public label.
- `scripts/Web/views/PlayerPage.js`: remove the MMR stat card from the public profile header.
- `scripts/Web/formatters/PublicSiteFormatter.js`: stop carrying exact public MMR display fields through formatter output.
- `tests/public-site-views.test.js` and `tests/public-site-formatter.test.js`: add privacy-focused assertions proving public models and HTML no longer include exact MMR text.
- Demo data: insert a few fake players, three fake matches, and the needed `match_in_users` rows into `bot_guild_930430128553611264`.

**Risk handling:**
- Keep SQL ordering by `mmr DESC` so only display changes, not ranking semantics.
- Use obviously fake demo identifiers and names to avoid confusion with real users.
- Insert demo rows idempotently where practical so reruns do not duplicate records.
