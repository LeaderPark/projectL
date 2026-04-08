const fs = require("node:fs");
const path = require("node:path");

function sendHtml(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function serveAssetFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    sendHtml(res, 404, "not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType =
    extension === ".css"
      ? "text/css; charset=utf-8"
      : extension === ".js"
        ? "application/javascript; charset=utf-8"
        : "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  res.end(fs.readFileSync(filePath, "utf8"));
}

function createPublicSiteRouter({
  assetsDir,
  renderHomePage,
  renderMatchesPage,
  renderPlayerPage,
  searchPlayers,
  renderNotFoundPage,
}) {
  return async function handlePublicSiteRequest(req, res) {
    if (req.method !== "GET") {
      return false;
    }

    const requestUrl = new URL(req.url, "http://127.0.0.1");
    const pathname = requestUrl.pathname;

    if (pathname === "/") {
      sendHtml(res, 200, await renderHomePage());
      return true;
    }

    if (pathname === "/matches") {
      sendHtml(res, 200, await renderMatchesPage());
      return true;
    }

    if (pathname === "/api/search") {
      const query = requestUrl.searchParams.get("q") ?? "";
      const players = query.trim() ? await searchPlayers(query.trim()) : [];
      sendJson(res, 200, players);
      return true;
    }

    if (pathname === "/players") {
      const query = requestUrl.searchParams.get("q") ?? "";
      const players = query.trim() ? await searchPlayers(query.trim()) : [];

      if (players.length > 0) {
        res.writeHead(302, {
          Location: `/players/${players[0].discordId}`,
        });
        res.end();
        return true;
      }

      sendHtml(
        res,
        404,
        renderNotFoundPage({
          title: "플레이어를 찾을 수 없습니다",
          description: "입력한 이름과 일치하는 플레이어가 없어요.",
        })
      );
      return true;
    }

    if (pathname === "/public/site.css" || pathname === "/public/site.js") {
      serveAssetFile(res, path.join(assetsDir, path.basename(pathname)));
      return true;
    }

    if (pathname.startsWith("/players/")) {
      const discordId = pathname.slice("/players/".length);
      const html = await renderPlayerPage(discordId);

      if (html) {
        sendHtml(res, 200, html);
      } else {
        sendHtml(
          res,
          404,
          renderNotFoundPage({
            title: "플레이어를 찾을 수 없습니다",
            description: "등록된 내전 플레이어가 아니에요.",
          })
        );
      }

      return true;
    }

    return false;
  };
}

module.exports = {
  createPublicSiteRouter,
};
