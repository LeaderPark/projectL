# ProjectL Discord Bot

This project runs a Discord bot backed by MariaDB. The local database no longer needs Autoset and can be started directly with Docker Compose.

## What Changed

- MariaDB runs in Docker instead of an external Autoset install.
- The bot reads runtime settings from environment variables first.
- Legacy local `config.json` and `secret.js` files are still supported as a fallback for non-Docker local runs.
- `bot.sql` is imported automatically the first time the database volume is created.

## Files

- `compose.yaml`: bot + MariaDB stack
- `.env.example`: required runtime variables template
- `scripts/bootstrap.ps1`: creates `.env` if needed and starts the stack
- `scripts/verify.ps1`: runs tests and validates compose configuration
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

## Useful Commands

```powershell
Set-Location C:\projectL
docker compose up -d --build
docker compose logs -f bot
docker compose logs -f db
docker compose down
```

## Notes

- The MariaDB host port defaults to `3307` to reduce collisions with other local database installs.
- Files in `/docker-entrypoint-initdb.d` only run on first database initialization. If you need a full reset, run `docker compose down -v` before starting again.
- If you upgraded from an older database volume and `/서버설정 초기화` fails with `Access denied ... to database 'bot_guild_...'`, grant `CREATE` on `*.*` and `ALL PRIVILEGES` on ``${DB_NAME}_guild_%`` to `${DB_USER}`, or recreate the DB volume once.
- `npm start` still works for a legacy local setup when matching local secret files exist.
