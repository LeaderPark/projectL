# Discord Public Link Responses Design

**Context:** The Discord commands `/전적`, `/검색`, and `/랭킹` still build detailed embed payloads inside the bot even though the public site now exposes guild-scoped ranking, player, and match record pages. The new requirement is to stop rendering those details in Discord and instead send users to the website with a short 안내문 and the right public URL.

## Goals

- Replace the embed-based responses for `/전적`, `/검색`, and `/랭킹` with a short 안내문 plus a public site link.
- Keep the existing slash command names and option shapes unchanged.
- Route `/랭킹` to the guild ranking page and `/검색`, `/전적` to the selected player's public profile page.
- Preserve current guardrails for bots, missing setup, and missing user data.

## Non-Goals

- Redesigning the public site itself.
- Changing database query behavior beyond what is needed to validate that a user or guild has data.
- Adding new slash commands or changing command permissions.

## Approaches Considered

- **Recommended: validate access as today, then reply with a short message and the public URL.**
  This keeps Discord behavior lightweight, reuses the public site as the single presentation layer, and minimizes future maintenance.
- **Alternative: keep a tiny summary plus the link.**
  This still leaves response-format logic in Discord and does not fully meet the goal of moving presentation to the website.
- **Alternative: leave embeds and append a link.**
  This is the smallest code change, but it does not match the request to switch over to website-link delivery.

## Routing Strategy

- `/랭킹` replies with the guild-scoped ranking URL: `https://<public-host>/<guildId>/ranking`
- `/검색` replies with the selected user's player page URL: `https://<public-host>/<guildId>/players/<discordId>`
- `/전적` replies with the same selected user's player page URL because the public profile already contains recent match cards.

## Application Changes

- Add a shared utility that builds the public base URL and guild/player/ranking URLs from runtime configuration.
- Keep the current query checks that already distinguish between missing setup, unregistered users, and empty match history.
- Remove embed construction from the three commands and replace it with string responses that include:
  - a short 안내문
  - the public URL

## Error Handling

- If the target is a bot account, keep the existing rejection message.
- If the guild is not initialized or the query layer returns an error, keep returning the existing error message.
- If the user has no public data yet, keep returning the current "등록된 정보가 없습니다." or "최근 전적이 없습니다." style message instead of sending a dead link.
- If the public hostname is missing from runtime configuration, fall back to a clear temporary error instead of sending a malformed URL.

## Testing Strategy

- Add or update command tests for all three commands so they assert a plain content reply with the expected public URL.
- Cover `/검색` and `/전적` with both self-targeting and explicit target user behavior.
- Cover `/랭킹` with the guild ranking URL.
- Keep error-path tests intact where they already exist.
