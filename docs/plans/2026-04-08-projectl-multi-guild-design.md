# ProjectL Multi-Guild Data Isolation Design

**Context:** `projectL` currently assumes one Discord guild and one shared MySQL database. Command deployment is tied to a single `DISCORD_GUILD_ID`, and all ranking, registration, match upload, and search data is stored in shared tables.

**Decision:** Support multiple Discord guilds by making slash commands globally deployable and isolating gameplay data into a dedicated database per guild. A control database will store only server configuration metadata.

**Approaches considered:**
- **Recommended: control DB + per-guild databases.**
  Keep one base database for server metadata such as `guild_settings`, then create one logical MySQL database per guild for `user`, `matches`, and `match_in_users`. This matches the requirement that server data be separated at the DB level and keeps ranking isolation simple.
- **Alternative: shared tables with `guild_id` columns.**
  This is easier to implement, but it does not satisfy the request for DB separation per server and increases the chance of accidental cross-guild queries.
- **Alternative: separate bot process per guild.**
  This gives isolation, but it adds avoidable operational cost and makes server onboarding harder than necessary.

**Why the recommended approach fits:**
- It satisfies the requirement literally: each Discord server gets its own database.
- It preserves most of the existing query structure because each guild DB can keep the current table names.
- It allows a lightweight slash-command setup flow without requiring separate deployments.

**Architecture:**
- `control database`: the configured `DB_NAME`; stores `guild_settings`.
- `guild databases`: derived from the base DB name plus the guild id, for example `bot_guild_1234567890`.
- `DB utility`: creates or reuses connection pools for the control database and each guild database.
- `server settings command`: `/서버설정 보기` shows the current guild mapping; `/서버설정 초기화` creates the guild DB and schema and stores the mapping.
- `guild-scoped commands`: registration, upload, ranking, search, match history, and team balancing read only from the current `interaction.guildId`.

**Data flow:**
- On startup, the bot ensures the control database and `guild_settings` table exist.
- A server admin runs `/서버설정 초기화`.
- The bot creates the guild database if it does not exist, creates the gameplay tables inside it, and upserts the guild metadata row.
- Runtime commands resolve the current guild database from `interaction.guildId`, then execute the existing ranking and match queries inside that guild-specific database only.

**Permissions and UX:**
- `/서버설정` is restricted to members with `ManageGuild`.
- Non-configured guilds receive a clear message telling them to ask a server admin to run `/서버설정 초기화`.
- Existing placeholder `/server` behavior is replaced by the real Korean admin command expected by the rest of the bot.

**Deployment behavior:**
- Slash commands are deployed globally by default so the bot can serve multiple guilds.
- If `DISCORD_GUILD_ID` is set, deployment can still target one guild for faster development iteration.

**Risk handling:**
- Guild database names are generated from guild ids only, so they stay deterministic and safe.
- Schema creation uses `CREATE TABLE IF NOT EXISTS` so re-running initialization is safe.
- Query functions fail fast when a guild has not been initialized, preventing silent writes to the wrong database.
