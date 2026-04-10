# Primary Riot Identity Design

**Context:** The public record site currently mixes stored Riot-facing names with live Discord display-name resolution. The new requirement is to remove Discord-name lookups from the public site and always show one representative Riot identity per Discord user across rankings, player pages, search, and historical match renders. Users must be able to choose that representative identity through a Discord slash command.

## Goals

- Remove live Discord display-name lookups from the public site.
- Let each Discord user choose a representative Riot account with a slash command.
- Default the representative Riot account to the first registered account when the user has not explicitly changed it.
- Keep single-account users automatically represented by that only account.
- Rewrite displayed historical participant names to the representative Riot identity when the participant is linked by `puuid`.

## Non-Goals

- Rewriting stored historical match payloads in the database.
- Adding a web UI for representative-account management.
- Changing MMR, win/loss, or player aggregation rules.

## Recommended Approach

Store representative-account state in `riot_accounts` with an `is_primary` flag and keep `user.name` synchronized to the current representative Riot account display name. This makes the representative identity explicit in the schema while preserving the fast read path that already powers rankings, search, and profile summaries.

Primary-account rules:

1. If a user has exactly one Riot account, that account is primary.
2. When a second or later account is registered, the first registered account remains primary by default.
3. After registering a second or later account, the bot tells the user to configure a representative account with a slash command.
4. The `/대표아이디설정` command updates the primary flag and synchronizes `user.name`.

## Data Model

### `riot_accounts`

- Add `is_primary` as `tinyint(1) NOT NULL DEFAULT 0`.
- Existing rows are backfilled so each Discord user has exactly one primary row.
- Backfill preference order:
  1. account whose `puuid` matches `user.puuid`
  2. earliest `created_at`
  3. lowest `id`

### `user`

- Keep `user.name` as the denormalized representative display name.
- Keep `user.puuid` unchanged for now to avoid broad side effects in registration and match-ingestion flows.

## Application Flow

### Registration

- First registration inserts the Riot account and marks it primary.
- Second or later registration inserts the Riot account as non-primary.
- After insertion, synchronize `user.name` from the effective primary Riot account.
- If the user now has multiple Riot accounts, include guidance in the reply telling them to use `/대표아이디설정`.

### Representative Account Command

- Add `/대표아이디설정` with `소환사이름` and `소환사태그` options.
- Resolve only against Riot accounts already linked to the invoking Discord user in the current guild.
- On success:
  - clear any previous primary row for that user
  - mark the requested row primary
  - update `user.name`
- On failure, return a clear message explaining that the account is not linked.

### Public Site

- Remove Discord client name resolution from the web layer.
- Rankings, search results, and player profiles use `user.name` directly.
- Match history and match detail pages resolve linked `puuid` values back to the owning `user.name` and replace displayed participant names at render time.

## Error Handling

- If a primary account is requested for a user with no linked Riot accounts, return a validation error.
- If the requested Riot account is not linked to the invoking user, return a not-found style command response.
- If backfill cannot identify a preferred row through `user.puuid`, fall back deterministically to the earliest registered row.

## Testing Strategy

- Add query tests for primary-account selection and primary-name synchronization.
- Add command tests for first registration, subsequent registration messaging, and representative-account updates.
- Update public-site service tests so they assert representative Riot names instead of live Discord names.
- Add migration-aware tests for auto-primary backfill behavior and match-name rewriting.
