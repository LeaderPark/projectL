# ProjectL Docker MariaDB Hosting Design

**Context:** `projectL` is a Discord bot that currently depends on local `config.json`, `secret.js`, and an Autoset-managed MariaDB/MySQL database.

**Decision:** Keep the bot on a MySQL-compatible database and replace Autoset with a Docker Compose stack made of a MariaDB service and a bot service.

**Why this fits this project:**
- The runtime already uses `mysql2` and raw MySQL-style SQL.
- The checked-in schema dump is MariaDB-oriented, so reusing it avoids a risky database migration.
- Docker Compose gives the project the same "bring it up and keep it running" operational shape already used in nearby projects.

**Architecture:**
- `db`: MariaDB container with a named volume for persistent storage.
- `bot`: Node container that installs dependencies, deploys Discord commands, and starts the bot.
- `config`: bot secrets and runtime settings move to `.env`, with a small config loader that still supports a local legacy `config.json` if present.
- `bootstrap`: PowerShell script to create a local `.env` when missing and start the stack.
- `verify`: PowerShell script to validate config, run tests, and confirm the compose file parses.

**Data flow:**
- On first boot, MariaDB imports `bot.sql` through the standard `/docker-entrypoint-initdb.d` hook.
- The bot connects to the compose network database by service name.
- Discord and Riot credentials are injected through environment variables rather than checked-in JSON/JS secrets.

**Risk handling:**
- Keep the schema MySQL-compatible instead of introducing a PostgreSQL migration at the same time.
- Add a test around config loading so environment-based startup does not break the existing runtime path.
- Preserve a fallback path for local `config.json` to reduce migration risk while moving operations to `.env`.
