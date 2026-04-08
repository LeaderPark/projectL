# AGENT.md

## Project Context

- This repository is a Node.js Discord bot project.
- The bot uses `discord.js` for Discord interactions and `axios` for external API calls.
- Riot Games data and Discord bot behavior are both core implementation areas in this codebase.

## Required Documentation Sources

When you need to figure out how to implement, modify, or debug behavior in this repository, use these official docs as the primary references:

- Riot Games League of Legends API: <https://developer.riotgames.com/docs/lol>
- discord.js documentation for v14.26.2: <https://discord.js.org/docs/packages/discord.js/14.26.2>

## Implementation Rules

- For any Riot API work, check the Riot API documentation first for endpoint shape, authentication, routing, rate limits, and response fields before writing code.
- For any Discord bot work, check the `discord.js` v14.26.2 documentation first for client APIs, slash commands, interactions, embeds, collectors, permissions, and event handling before writing code.
- Prefer these official docs over memory, blog posts, or unofficial examples when choosing an implementation approach.
- If the current code and the official docs appear to differ, verify the installed package behavior carefully and call out any version mismatch or migration work that may be needed.
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
