# Minimal Dependency Cleanup Design

**Date:** 2026-04-10

**Goal:** Reduce the highest-risk dependency vulnerabilities without changing runtime behavior or widening the upgrade surface unnecessarily.

**Scope:**
- Upgrade `axios` to the latest stable `1.x` release.
- Upgrade `mysql2` to the latest stable `3.x` release.
- Remove `nodemon` because it is not referenced by project scripts and the user explicitly requested removal.
- Keep `discord.js` unchanged in this pass to avoid mixing unrelated library behavior changes into a low-risk security cleanup.

**Approach:**
- Use package-manager-driven updates so `package.json` and `package-lock.json` stay consistent.
- Verify the result with `npm ls`, `npm audit`, and the full `npm test` suite.
- Accept residual advisories that remain outside this approved scope, then report them clearly.

**Risk Notes:**
- `axios` and `mysql2` are direct runtime dependencies, so the main risk is subtle API behavior drift across minor releases.
- Existing automated tests cover Riot API wiring, database helpers, and command/runtime behavior, which makes them a reasonable regression net for this cleanup.
- Removing `nodemon` is low risk because it is not used in the repository scripts and no code imports it.
