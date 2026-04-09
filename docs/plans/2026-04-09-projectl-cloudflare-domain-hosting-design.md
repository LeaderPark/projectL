# ProjectL Cloudflare Domain Hosting Design

**Context:** `projectL` already serves its public website and Riot callback endpoint from the bot process, and the site is exposed locally on port `8000`. The user wants this project hosted under the Cloudflare-managed domain `lol.leaderpark.net`, and also wants the bot web port standardized to `8000` both inside Docker and on the host.

**Decision:** Standardize the app's internal `WEB_PORT` to `8000`, keep the local host publish port at `8000`, and add an optional `cloudflared` service to Docker Compose using the same pattern as `Project_C`. Cloudflare Tunnel will publish `lol.leaderpark.net` to the bot container over HTTP at `http://bot:8000`.

## Options Considered

- **Recommended: Docker Compose plus optional `cloudflared` profile**
  This matches `Project_C`, keeps runtime assets together, and lets operators start or stop the tunnel with a dedicated compose profile.
- **Alternative: run `cloudflared` as a separate Windows service**
  This can work, but it splits operational state between Docker and the Windows host and is less consistent with the reference project.
- **Alternative: front the bot with a separate reverse proxy**
  This adds more moving parts than needed for a single service that Cloudflare Tunnel can already publish directly.

## Architecture

- `index.js` continues to host both the public website and the Riot callback endpoint from one Node HTTP server.
- `config/runtime.js` changes the default internal web port from `3000` to `8000`.
- `compose.yaml` publishes the bot as `${WEB_PUBLIC_PORT:-8000}:8000` and adds a `cloudflared` service behind a `cloudflare` compose profile.
- Cloudflare Tunnel forwards `https://lol.leaderpark.net` to `http://bot:8000` inside the Docker network.

## Configuration

- `.env.example` documents:
  - `WEB_PORT=8000`
  - `WEB_PUBLIC_PORT=8000`
  - `CLOUDFLARED_IMAGE=cloudflare/cloudflared:latest`
  - `CF_TUNNEL_TOKEN=__CHANGE_ME__`
  - `CF_PUBLIC_HOSTNAME=lol.leaderpark.net`
- `.env` stores the real tunnel token and hostname for this machine.
- `RIOT_TOURNAMENT_CALLBACK_URL` should be updated to the production hostname if Riot callbacks are meant to arrive through the public domain.

## Operational Flow

1. Operator starts the normal stack with Docker Compose.
2. Operator starts the tunnel service only when Cloudflare exposure is needed.
3. Cloudflare Tunnel publishes `lol.leaderpark.net` to the `bot` container on port `8000`.
4. Local access remains available at `http://localhost:8000`.

## Error Handling

- If `CF_TUNNEL_TOKEN` is missing, the Cloudflare start script should fail fast with a clear message.
- If the tunnel profile is not enabled, the bot remains locally reachable and the project still works without Cloudflare.
- Existing Riot callback and public-site routes must keep working after the port change.

## Testing

- Update tests that currently assume internal port `3000` defaults.
- Add asset-level checks for the new Cloudflare environment variables and compose service.
- Run the existing Node test suite and `docker compose config` to verify the deployment assets.
