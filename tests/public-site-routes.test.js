const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

const { createCallbackServer } = require("../scripts/Web/CallbackServer");
const { createPublicSiteRouter } = require("../scripts/Web/PublicSiteRouter");

function requestServer(server, requestPath, options = {}) {
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port: address.port,
          path: requestPath,
          method: options.method ?? "GET",
        },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            server.close(() => {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                body,
              });
            });
          });
        }
      );

      req.on("error", (error) => {
        server.close(() => reject(error));
      });
      req.end();
    });
  });
}

function createTestServer() {
  const publicSiteRouter = createPublicSiteRouter({
    assetsDir: path.join(process.cwd(), "public"),
    async renderLandingPage() {
      return '<main><form><label>서버 아이디<input name="serverId" /></label></form></main>';
    },
    async renderHomePage(serverId) {
      return `<main>전체 내전 전적 ${serverId}</main>`;
    },
    async renderMatchesPage(serverId) {
      return `<main>전체 경기 ${serverId}</main>`;
    },
    async renderRankingPage(serverId) {
      return `<main>전체 랭킹 ${serverId}</main>`;
    },
    async renderMatchDetailPage(serverId, matchId) {
      if (matchId === "404") {
        return null;
      }

      return `<main>경기 상세 ${serverId} ${matchId}</main>`;
    },
    async renderPlayerPage(serverId, discordId, refreshStatus) {
      if (discordId === "missing") {
        return null;
      }

      return `<main>${serverId} Alpha ${refreshStatus ?? ""}</main>`;
    },
    async searchPlayers(serverId, query) {
      return [{ discordId: "1", name: `${serverId}:Alpha:${query}` }];
    },
    renderNotFoundPage({ title, description }) {
      return `<main>${title} - ${description}</main>`;
    },
  });

  return createCallbackServer({
    callbackPath: "/riot/callback",
    sessionStore: {
      async markCompletedPendingGather() {
        return { success: true };
      },
    },
    publicSiteRouter,
  });
}

test("router serves the public home page", async () => {
  const response = await requestServer(createTestServer(), "/");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "text/html; charset=utf-8");
  assert.match(response.body, /서버 아이디/);
});

test("router returns JSON from the public search endpoint", async () => {
  const response = await requestServer(
    createTestServer(),
    "/123456789/api/search?q=egg"
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(response.body), [
    { discordId: "1", name: "123456789:Alpha:egg" },
  ]);
});

test("player search submissions redirect to the first matching profile", async () => {
  const response = await requestServer(
    createTestServer(),
    "/123456789/players?q=egg"
  );

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "/123456789/players/1");
});

test("router serves the public stylesheet", async () => {
  const response = await requestServer(createTestServer(), "/public/site.css");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "text/css; charset=utf-8");
  assert.equal(response.headers["cache-control"], "no-store");
  assert.match(response.body, /--color-bg/);
});

test("router serves the public script with match expansion hooks", async () => {
  const response = await requestServer(createTestServer(), "/public/site.js");

  assert.equal(response.statusCode, 200);
  assert.equal(
    response.headers["content-type"],
    "application/javascript; charset=utf-8"
  );
  assert.match(response.body, /data-match-toggle/);
  assert.match(response.body, /data-match-tab/);
});

test("router serves the public favicon as a webp image", async () => {
  const response = await requestServer(createTestServer(), "/public/favicon.webp");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "image/webp");
  assert.equal(response.headers["cache-control"], "no-store");
});

test("router serves the dedicated match detail page", async () => {
  const response = await requestServer(createTestServer(), "/123456789/matches/9");

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /경기 상세 123456789 9/);
});

test("missing match routes return the not-found page", async () => {
  const response = await requestServer(
    createTestServer(),
    "/123456789/matches/404"
  );

  assert.equal(response.statusCode, 404);
  assert.match(response.body, /경기를 찾을 수 없습니다/);
});

test("public stylesheet keeps recent-match player rows readable in narrow cards", async () => {
  const response = await requestServer(createTestServer(), "/public/site.css");

  assert.equal(response.statusCode, 200);
  assert.match(
    response.body,
    /\.match-player\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;[\s\S]*grid-template-areas:\s*"name kda"\s*"champion lane";/
  );
  assert.match(
    response.body,
    /\.match-player__name\s*\{[\s\S]*min-width:\s*0;[\s\S]*white-space:\s*nowrap;[\s\S]*text-overflow:\s*ellipsis;/
  );
  assert.match(response.body, /\.match-card__link\s*\{/);
  assert.match(response.body, /\.match-detail-player__items\s*\{/);
  assert.match(response.body, /\.match-row__summary-button\s*\{/);
  assert.match(
    response.body,
    /\.match-scoreboard__columns\s*\{[\s\S]*grid-template-columns:\s*minmax\(252px,\s*1\.22fr\)\s+minmax\(84px,\s*0\.44fr\)\s+minmax\(148px,\s*0\.78fr\)\s+minmax\(148px,\s*0\.78fr\)\s+minmax\(84px,\s*0\.42fr\)\s+minmax\(96px,\s*0\.46fr\)\s+minmax\(224px,\s*1\.02fr\);/
  );
  assert.match(
    response.body,
    /\.match-scoreboard--compact\s+\.match-scoreboard__columns\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.72fr\)\s+minmax\(104px,\s*0\.52fr\)\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    response.body,
    /\.match-scoreboard--compact\s+\.match-scoreboard__row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.72fr\)\s+minmax\(104px,\s*0\.52fr\)\s+minmax\(0,\s*1fr\);/
  );
  assert.match(
    response.body,
    /\.match-scoreboard--compact\s+\.match-scoreboard__columns\s+span:nth-child\(2\)\s*\{[\s\S]*justify-self:\s*end;[\s\S]*text-align:\s*right;/
  );
  assert.match(
    response.body,
    /\.match-scoreboard--compact\s+\.match-scoreboard__score\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;[\s\S]*justify-self:\s*end;[\s\S]*justify-content:\s*flex-end;[\s\S]*gap:\s*8px;/
  );
  assert.match(
    response.body,
    /\.match-scoreboard--compact\s+\.match-scoreboard__kda\s*\{[\s\S]*justify-self:\s*end;[\s\S]*justify-items:\s*start;[\s\S]*text-align:\s*left;[\s\S]*padding-right:\s*12px;/
  );
  assert.match(
    response.body,
    /\.match-scoreboard--compact\s+\.match-scoreboard__columns\s+span:nth-child\(3\)\s*\{[\s\S]*justify-self:\s*end;[\s\S]*text-align:\s*left;[\s\S]*padding-right:\s*12px;/
  );
  assert.match(response.body, /\.match-detail-shell\s*\{/);
  assert.match(response.body, /\.match-scoreboard__totals\s*\{/);
  assert.match(response.body, /\.match-scoreboard__build-items\s*\{/);
});

test("public stylesheet gives match detail player containers explicit padding", async () => {
  const response = await requestServer(createTestServer(), "/public/site.css");

  assert.equal(response.statusCode, 200);
  assert.match(
    response.body,
    /\.match-detail-player-list\s*\{[\s\S]*display:\s*grid;[\s\S]*margin:\s*0;[\s\S]*padding:\s*0;[\s\S]*list-style:\s*none;/
  );
  assert.match(
    response.body,
    /\.match-detail-player\s*\{[\s\S]*display:\s*grid;[\s\S]*padding:\s*18px;/
  );
});

test("missing player routes return the not-found page", async () => {
  const response = await requestServer(
    createTestServer(),
    "/123456789/players/missing"
  );

  assert.equal(response.statusCode, 404);
  assert.match(response.body, /플레이어를 찾을 수 없습니다/);
});

test("router serves the guild-scoped home page", async () => {
  const response = await requestServer(createTestServer(), "/123456789");

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /전체 내전 전적 123456789/);
});

test("router serves the guild-scoped ranking page", async () => {
  const response = await requestServer(createTestServer(), "/123456789/ranking");

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /전체 랭킹 123456789/);
});

test("router passes the refresh status query parameter into the player page renderer", async () => {
  const response = await requestServer(
    createTestServer(),
    "/123456789/players/1?refresh=updated"
  );

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /updated/);
});

test("router redirects player riot-name refresh POST requests back to the player page", async () => {
  const publicSiteRouter = createPublicSiteRouter({
    assetsDir: path.join(process.cwd(), "public"),
    async renderLandingPage() {
      throw new Error("not used");
    },
    async renderHomePage() {
      throw new Error("not used");
    },
    async renderMatchesPage() {
      throw new Error("not used");
    },
    async renderRankingPage() {
      throw new Error("not used");
    },
    async renderMatchDetailPage() {
      throw new Error("not used");
    },
    async renderPlayerPage() {
      throw new Error("not used");
    },
    async handlePlayerRiotIdentityRefresh() {
      return {
        statusCode: 303,
        location: "/123456789/players/1?refresh=updated",
      };
    },
    async searchPlayers() {
      throw new Error("not used");
    },
    renderNotFoundPage({ title, description }) {
      return `<main>${title} - ${description}</main>`;
    },
  });

  const server = createCallbackServer({
    callbackPath: "/riot/callback",
    sessionStore: {
      async markCompletedPendingGather() {
        return { success: true };
      },
    },
    publicSiteRouter,
  });

  const response = await requestServer(
    server,
    "/123456789/players/1/refresh-riot-accounts",
    { method: "POST" }
  );

  assert.equal(response.statusCode, 303);
  assert.equal(response.headers.location, "/123456789/players/1?refresh=updated");
});
