# Riot Verification File Design

**Goal:** Expose a Riot verification file at the exact public URL `https://lol.leaderpark.net/riot.txt` so the production key review can validate domain ownership.

**Current State**

- The public site serves selected static assets from `public/`.
- [`scripts/Web/PublicSiteRouter.js`](C:/projectL/scripts/Web/PublicSiteRouter.js) explicitly allows only `/public/site.css`, `/public/site.js`, and `/public/favicon.webp`.
- Adding `public/riot.txt` alone would not make `GET /riot.txt` reachable.

**Chosen Approach**

- Add one explicit route for `GET /riot.txt` in the public site router.
- Store the verification payload in `public/riot.txt`.
- Reuse the existing asset-serving helper so the response stays file-backed and simple.

**Why This Approach**

- It keeps the change narrowly scoped to the one required public path.
- It avoids opening generic static serving for every file in `public/`.
- It is easy to cover with a focused router test.

**Validation**

- Add a route test that requests `/riot.txt` and asserts:
  - `200` status
  - `text/plain; charset=utf-8` content type
  - exact body content
- Run the targeted test file, then start the local server and confirm `http://127.0.0.1:8000/riot.txt` returns the expected value.
