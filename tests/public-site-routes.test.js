const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

const { createCallbackServer } = require("../scripts/Web/CallbackServer");
const { createPublicSiteRouter } = require("../scripts/Web/PublicSiteRouter");

function requestServer(server, requestPath) {
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port: address.port,
          path: requestPath,
          method: "GET",
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
    async renderHomePage() {
      return "<main>전체 내전 전적</main>";
    },
    async renderMatchesPage() {
      return "<main>전체 경기</main>";
    },
    async renderPlayerPage(discordId) {
      if (discordId === "missing") {
        return null;
      }

      return "<main>Alpha</main>";
    },
    async searchPlayers(query) {
      return [{ discordId: "1", name: `Alpha:${query}` }];
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
  assert.match(response.body, /전체 내전 전적/);
});

test("router returns JSON from the public search endpoint", async () => {
  const response = await requestServer(createTestServer(), "/api/search?q=egg");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(response.body), [
    { discordId: "1", name: "Alpha:egg" },
  ]);
});

test("player search submissions redirect to the first matching profile", async () => {
  const response = await requestServer(createTestServer(), "/players?q=egg");

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "/players/1");
});

test("router serves the public stylesheet", async () => {
  const response = await requestServer(createTestServer(), "/public/site.css");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "text/css; charset=utf-8");
  assert.match(response.body, /--color-bg/);
});

test("missing player routes return the not-found page", async () => {
  const response = await requestServer(createTestServer(), "/players/missing");

  assert.equal(response.statusCode, 404);
  assert.match(response.body, /플레이어를 찾을 수 없습니다/);
});
