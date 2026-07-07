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
          headers: options.headers,
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

      if (options.body !== undefined) {
        req.write(options.body);
      }

      req.end();
    });
  });
}

function createTestServer({
  isRegisteredServerId = async (serverId) => serverId === "123456789",
} = {}) {
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
    isRegisteredServerId,
    renderNotFoundPage({ title, description, guildId }) {
      return `<main>${title} - ${description} - ${guildId ?? ""}</main>`;
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

test("sendHtml responses include hardening headers and a content security policy", async () => {
  const response = await requestServer(createTestServer(), "/");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.equal(response.headers["referrer-policy"], "no-referrer");
  assert.match(response.headers["content-security-policy"] ?? "", /default-src 'self'/);
});

test("sendJson responses include hardening headers but no content security policy", async () => {
  const response = await requestServer(
    createTestServer(),
    "/123456789/api/search?q=egg"
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.equal(response.headers["referrer-policy"], "no-referrer");
  assert.equal(response.headers["content-security-policy"], undefined);
});

test("callback server rejects oversized JSON bodies with a 413 instead of buffering them fully", async () => {
  const oversizedBody = Buffer.alloc(64 * 1024 + 1, "a");

  const response = await requestServer(createTestServer(), "/riot/callback", {
    method: "POST",
    body: oversizedBody,
  });

  assert.equal(response.statusCode, 413);
});

test("callback server still accepts a normal-sized tournament callback payload", async () => {
  const response = await requestServer(createTestServer(), "/riot/callback", {
    method: "POST",
    body: JSON.stringify({ shortCode: "KR-CODE-1" }),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, "ok");
});

test("GET / with a registered numeric serverId query param redirects to the guild-scoped home", async () => {
  const response = await requestServer(
    createTestServer(),
    "/?serverId=123456789"
  );

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "/123456789");
});

test("GET / with an unregistered serverId query param falls back to the landing page", async () => {
  const response = await requestServer(
    createTestServer(),
    "/?serverId=999999999"
  );

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /서버 아이디/);
});

test("an unknown path under a registered guild renders the styled Korean 404 instead of plain text", async () => {
  const response = await requestServer(
    createTestServer(),
    "/123456789/some-unknown-page"
  );

  assert.equal(response.statusCode, 404);
  assert.match(response.body, /페이지를 찾을 수 없습니다/);
  assert.match(response.body, /123456789/);
});
