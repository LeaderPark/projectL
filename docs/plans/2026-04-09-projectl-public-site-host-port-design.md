# ProjectL Public Site Host Port Design

**Context:** `projectL` already serves the public record site and Riot callback endpoint from the bot process on internal port `3000`, but the current Docker Compose setup does not publish that web server to the Windows host. This makes the site unreachable from a local browser, and the user's host `3000` is already occupied by another project.

**Decision:** Keep the app's internal `WEB_PORT=3000` unchanged and add a separate host-side publish port in Docker Compose. Make that host port configurable through `.env` so operators can choose a non-conflicting value, with `8000` as the default host port for this project.

**Why this fits this project:**
- The Node app already expects to listen on one internal port, so changing only the host mapping avoids unnecessary application changes.
- Docker Compose is already the deployment boundary for the bot, database, and Adminer.
- A `.env`-driven host port keeps local setup flexible for machines running multiple projects.

**Architecture:**
- `compose.yaml`: publish `${WEB_PUBLIC_PORT:-8000}:3000` for the `bot` service.
- `.env.example`: add `WEB_PUBLIC_PORT=8000` so new setups expose the site without colliding with common local defaults.
- `README.md`: document that the public site is available at `http://localhost:<WEB_PUBLIC_PORT>/`.
- `tests/compose-assets.test.js`: lock the compose contract so future changes do not remove the published web port accidentally.

**Risk handling:**
- Preserve the container's internal `3000` port so callback handling and server startup behavior stay unchanged.
- Use a host-only port variable so operators can resolve local conflicts without modifying code.
- Keep the default host port different from `3000` to avoid the exact collision reported in this environment while giving the project a stable browser URL.
