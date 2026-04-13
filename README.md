# ProjectL Discord Bot

This project runs a Discord bot backed by MariaDB. The local database no longer needs Autoset and can be started directly with Docker Compose.

## What Changed

- MariaDB runs in Docker instead of an external Autoset install.
- The bot reads runtime settings from environment variables first.
- Legacy local `config.json` and `secret.js` files are still supported as a fallback for non-Docker local runs.
- `bot.sql` is imported automatically the first time the database volume is created.

## Files

- `compose.yaml`: bot + MariaDB + Adminer stack
- `.env.example`: required runtime variables template
- `scripts/bootstrap.ps1`: creates `.env` if needed and starts the stack
- `scripts/start-cloudflare-tunnel.ps1`: starts the optional Cloudflare Tunnel profile
- `scripts/deploy.ps1`: rebuilds and redeploys the current local checkout safely
- `scripts/verify.ps1`: runs tests and validates compose configuration
- `ops/cloudflare-tunnel.md`: Cloudflare domain hosting notes
- `deploy.bat`: double-click entrypoint for one-click redeploy on the Windows host
- `config/runtime.js`: environment-aware runtime config loader
- `bot.sql`: initial MariaDB schema and seed data

## Quick Start

1. Create and edit your local `.env`:

```powershell
Set-Location C:\projectL
Copy-Item .env.example .env
```

2. Fill in these values in `.env`:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `WEB_PUBLIC_GUILD_ID`
- `RIOT_API_TOKEN`
- `DB_PASSWORD`
- `DB_ROOT_PASSWORD`
- `CF_TUNNEL_TOKEN` if you want Cloudflare domain hosting

`WEB_PUBLIC_GUILD_ID` is the guild whose inhouse records should be shown on the public website. In a single-guild setup you can set it to the same value as `DISCORD_GUILD_ID`.
`WEB_PORT` defaults to `8000` and is the bot's internal HTTP port.
`WEB_PUBLIC_PORT` also defaults to `8000` so local browser access and the container's internal web port stay aligned.

3. Start the stack:

```powershell
Set-Location C:\projectL
.\scripts\bootstrap.ps1
```

4. Verify the local setup:

```powershell
Set-Location C:\projectL
.\scripts\verify.ps1
```

5. Open the public record site in a browser:

The public record site is available at `http://localhost:8000/` by default. Change `WEB_PUBLIC_PORT` in `.env` if you want a different host port.

## Cloudflare Domain

To publish the site at `https://lol.leaderpark.net/`, create or open your Cloudflare Tunnel and add this public hostname target:

- Public hostname: `lol.leaderpark.net`
- Service type: `HTTP`
- Service URL: `http://bot:8000`

Then set `CF_TUNNEL_TOKEN` and `CF_PUBLIC_HOSTNAME=lol.leaderpark.net` in `.env` and run:

```powershell
Set-Location C:\projectL
.\scripts\start-cloudflare-tunnel.ps1
```

More detailed operator notes live in `ops/cloudflare-tunnel.md`.

6. Open the database UI if you want to inspect data in a browser:

`Adminer` is available at `http://localhost:8081` by default. You can change the host port with `ADMINER_PUBLIC_PORT` in `.env`.

Use these values to log in:

- `System`: `MariaDB`
- `Server`: `db`
- `Username`: `DB_USER` from `.env` (or `root`)
- `Password`: `DB_PASSWORD` from `.env` (or `DB_ROOT_PASSWORD`)
- `Database`: `DB_NAME` from `.env` for the control database, or the guild-specific database name such as `bot_guild_<guild_id>`

## One-Click Deploy

Run `deploy.bat` directly on the Windows host when you want to redeploy the bot from the current local checkout.
The launcher now hands off to `scripts/deploy.ps1`, which recreates services in place without stopping the current stack first.

The deploy flow does this in order:

- checks that `.env` exists and does not contain placeholder secrets
- reads deployment metadata from the code that is currently checked out locally
- runs `docker compose up -d --build --remove-orphans`
- refreshes Discord slash commands from the running `bot` container after the stack comes back up
- checks `docker compose ps` output before reporting success

When the process finishes, the cmd window stays open and waits for your Enter input so you can read the logs before it closes.

## Useful Commands

```powershell
Set-Location C:\projectL
docker compose up -d --build
start http://localhost:8000
start http://localhost:8081
docker compose logs -f bot
docker compose logs -f db
docker compose down
```

## Notes

- The MariaDB host port defaults to `3307` to reduce collisions with other local database installs.
- The public record site host port defaults to `8000`, and the bot's internal web server also defaults to `8000`.
- The Adminer web UI host port defaults to `8081`.
- Files in `/docker-entrypoint-initdb.d` only run on first database initialization. If you need a full reset, run `docker compose down -v` before starting again.
- If you upgraded from an older database volume and `/서버설정 초기화` fails with `Access denied ... to database 'bot_guild_...'`, grant `CREATE` on `*.*` and `ALL PRIVILEGES` on ``${DB_NAME}_guild_%`` to `${DB_USER}`, or recreate the DB volume once.
- `npm start` still works for a legacy local setup when matching local secret files exist.
- `npm run deploy:commands` refreshes Discord slash commands manually without holding the public site startup path open.
