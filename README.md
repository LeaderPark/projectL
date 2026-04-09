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
- `scripts/deploy.ps1`: pulls latest code and redeploys the Docker stack safely
- `scripts/verify.ps1`: runs tests and validates compose configuration
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

`WEB_PUBLIC_GUILD_ID` is the guild whose inhouse records should be shown on the public website. In a single-guild setup you can set it to the same value as `DISCORD_GUILD_ID`.

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

5. Open the database UI if you want to inspect data in a browser:

`Adminer` is available at `http://localhost:8081` by default. You can change the host port with `ADMINER_PUBLIC_PORT` in `.env`.

Use these values to log in:

- `System`: `MariaDB`
- `Server`: `db`
- `Username`: `DB_USER` from `.env` (or `root`)
- `Password`: `DB_PASSWORD` from `.env` (or `DB_ROOT_PASSWORD`)
- `Database`: `DB_NAME` from `.env` for the control database, or the guild-specific database name such as `bot_guild_<guild_id>`

## One-Click Deploy

Run `deploy.bat` directly on the Windows host when you want to redeploy the bot with the latest Git changes.

The deploy flow does this in order:

- checks that `.env` exists and does not contain placeholder secrets
- stops if the repository has local uncommitted changes
- runs `git pull --ff-only`
- runs `docker compose down`
- runs `docker compose up -d --build`
- checks `docker compose ps` output before reporting success

When the process finishes, the cmd window stays open and waits for your Enter input so you can read the logs before it closes.

## Useful Commands

```powershell
Set-Location C:\projectL
docker compose up -d --build
start http://localhost:8081
docker compose logs -f bot
docker compose logs -f db
docker compose down
```

## Notes

- The MariaDB host port defaults to `3307` to reduce collisions with other local database installs.
- The Adminer web UI host port defaults to `8081`.
- Files in `/docker-entrypoint-initdb.d` only run on first database initialization. If you need a full reset, run `docker compose down -v` before starting again.
- If you upgraded from an older database volume and `/서버설정 초기화` fails with `Access denied ... to database 'bot_guild_...'`, grant `CREATE` on `*.*` and `ALL PRIVILEGES` on ``${DB_NAME}_guild_%`` to `${DB_USER}`, or recreate the DB volume once.
- `npm start` still works for a legacy local setup when matching local secret files exist.
