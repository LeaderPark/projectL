# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.
It is derived from `AGENT.md` and extended with verified project context.

## Project Context

- This repository is a Node.js Discord bot for organizing and recording League of Legends custom (inhouse) games.
- The bot uses `discord.js` for Discord interactions and `axios` for external (Riot Games) API calls.
- Riot Games data and Discord bot behavior are both core implementation areas in this codebase.
- Data is stored in **MariaDB**, run via Docker Compose. State is partitioned **per Discord guild** into separate `bot_<dbname>_guild_<guild_id>` databases, with a shared control database (`DB_NAME`, default `bot`) holding `guild_settings`.
- A built-in HTTP server publishes a public record site (rankings, players, match history), optionally exposed through a Cloudflare Tunnel.

## Required Documentation Sources

When you need to figure out how to implement, modify, or debug behavior in this repository, use these official docs as the primary references:

- Riot Games League of Legends API: <https://developer.riotgames.com/docs/lol>
- discord.js documentation for v14.26.2: <https://discord.js.org/docs/packages/discord.js/14.26.2>

## Implementation Rules

- For any Riot API work, check the Riot API documentation first for endpoint shape, authentication, routing, rate limits, and response fields before writing code.
- For any Discord bot work, check the `discord.js` v14.26.2 documentation first for client APIs, slash commands, interactions, embeds, collectors, permissions, and event handling before writing code.
- Prefer these official docs over memory, blog posts, or unofficial examples when choosing an implementation approach.
- If the current code and the official docs appear to differ, verify the installed package behavior carefully and call out any version mismatch or migration work that may be needed. (Note: `package.json` pins `discord.js` at `^14.9.0` while the doc source of truth above is `v14.26.2` — confirm installed behavior when in doubt.)
- When summarizing implementation decisions, mention when Riot API docs or `discord.js` docs were used as the source of truth.

## Scope Guidance

Use the Riot API docs whenever the task touches:

- summoner, match, spectator, rank, champion, or other League of Legends endpoints
- Riot authentication or request headers
- Riot platform or regional routing
- Riot API error handling or rate-limit handling

Use the `discord.js` docs whenever the task touches:

- slash command registration
- message sending or editing
- embeds, buttons, select menus, modals, or collectors
- interaction replies, defer/follow-up flows, or ephemeral responses
- gateway events, intents, presence, or permissions

## Repository Layout

- `index.js` — entrypoint; wires dependencies and calls `bootstrapApp` from `scripts/AppRuntime.js`.
- `commands/` — Discord slash commands (`team/`, `riot/`, `utility/`, `components/`).
- `scripts/Utils/` — core utilities: `DB.js` (pools + per-guild schema bootstrap), `Query.js` (all SQL data access), `GuildDatabase.js` (schema/migration definitions), `TeamBalancer.js`, `MatchmakingRating.js`.
- `scripts/Riot/` — Riot API + match transformation. `scripts/Tournament/` — tournament session polling/results. `scripts/Web/` — public record site (router, handlers, views).
- `config/runtime.js` — environment-aware runtime config loader (env vars first, legacy `config.json`/`secret.js` as fallback).
- `bot.sql` — initial MariaDB schema/seed, auto-imported on first DB volume creation.
- `compose.yaml` — bot + MariaDB + Adminer (+ optional `cloudflare` profile) stack.
- `tests/` — Node built-in test runner specs.
- `docs/`, `ops/` — operator and design notes.

## Data Model (per-guild database)

Defined in `scripts/Utils/GuildDatabase.js` (`buildGuildSchemaStatements`):

- `user` — registered players and **accumulated** stats: `mmr` (default 1000), `win`, `lose`, `penta`, `quadra`, `champions`/`lanes`/`friends` (JSON), `t_kill`/`t_death`/`t_assist`/`t_kill_rate`.
- `matches` — one row per recorded game (`game_id`, `game_length`, `played_at_kst`, `purple_team`/`blue_team` JSON).
- `match_in_users` — links matches to users; `FK match_id -> matches(id)` is `ON DELETE CASCADE`.
- `riot_accounts` — linked Riot accounts per user; `FK discord_id -> user(discord_id)` is `ON DELETE CASCADE`.
- `active_tournament_sessions` — in-flight tournament/series state.

Important: user stats in `user` are accumulated incrementally as matches are saved (`Query.js` → `updateUserData`). Deleting rows from `matches` does **not** roll those stats back — resetting match history and resetting accumulated stats are separate operations.

`mmr` is **performance-weighted Elo**: win/loss sets the sign, opponent strength the magnitude, and each player's OP Score (`performanceScore`) redistributes the delta within the team (see [`docs/mmr-system.md`](docs/mmr-system.md)). The OP Score model that feeds it is documented in [`docs/op-score-dataset.md`](docs/op-score-dataset.md). After a scoring/MMR model change, replay all matches with `Query.recomputeGuildUserStats(guildId)`.

## Common Commands

```powershell
# From C:\projectL
npm start                 # run the bot locally (node .)
npm test                  # node --test tests/*.test.js
npm run deploy:commands   # refresh Discord slash commands
npm run bootstrap         # scripts/bootstrap.ps1 — create .env if needed + start stack
npm run deploy            # scripts/deploy.ps1 — rebuild/redeploy current checkout
npm run verify            # scripts/verify.ps1 — tests + validate compose config

docker compose up -d --build      # build + start bot/db/adminer
docker compose logs -f bot        # follow bot logs
docker compose ps                 # stack status
```

- Public record site: `http://localhost:8000/` (host port `WEB_PUBLIC_PORT`, default 8000).
- Adminer DB UI: `http://localhost:8081` (default). MariaDB host port defaults to `3307`.
- Required env vars live in `.env` (see `.env.example`): `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `WEB_PUBLIC_GUILD_ID`, `RIOT_API_TOKEN`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, etc.

## Operational Notes

- `/docker-entrypoint-initdb.d` scripts (incl. `bot.sql`) only run on first DB volume init. For a full DB reset: `docker compose down -v` before starting again.
- A new guild gets its dedicated database via the `/서버설정 초기화` slash command (`initializeGuildDatabase`), which also runs idempotent schema/column migrations.
- The bot reads from the database on demand per request, so data changes are reflected on the public site without a restart.
