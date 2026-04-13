# Early Web Startup Design

**Goal:** Reduce first-request `Bad Gateway` windows by making the HTTP server available before Discord client readiness.

**Decision:** Split the current startup flow into a small bootstrap module that can be tested directly. The HTTP callback/public-site server will start listening immediately during process startup, while Discord-specific readiness work such as presence updates and poller activation will remain in the `ClientReady` handler.

**Why this approach:**
- It addresses the root cause directly: the web listener currently waits on Discord readiness.
- It keeps the existing public-site, callback, and poller wiring intact.
- It gives us a clean seam for regression tests without mocking the whole process entrypoint.

**Non-goals:**
- This is not full zero-downtime deployment.
- This does not change the public-site rendering logic or data queries.
- This does not replace the existing deploy/caching improvements already in progress.
