const fs = require("node:fs");
const path = require("node:path");

function sendHtml(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
  });
  res.end(body);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function redirectTo(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function normalizeRequestTarget(requestTarget) {
  const rawTarget = String(requestTarget ?? "/");
  if (rawTarget.startsWith("//")) {
    return `/${rawTarget.replace(/^\/+/, "")}`;
  }

  return rawTarget.startsWith("/") ? rawTarget : `/${rawTarget}`;
}

function isGuildIdSegment(value) {
  return /^\d+$/.test(String(value ?? ""));
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
        : extension === ".txt"
          ? "text/plain; charset=utf-8"
        : extension === ".webp"
          ? "image/webp"
          : "application/octet-stream";
  const body =
    extension === ".txt"
      ? fs.readFileSync(filePath, "utf8").replace(/\r?\n$/, "")
      : fs.readFileSync(filePath);

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  res.end(body);
}

function createPublicSiteRouter({
  assetsDir,
  renderLandingPage,
  renderHomePage,
  renderMatchesPage,
  renderRankingPage,
  renderMatchDetailPage,
  renderPlayerPage,
  handlePlayerRiotIdentityRefresh,
  searchPlayers,
  isRegisteredServerId,
  renderNotFoundPage,
}) {
  return async function handlePublicSiteRequest(req, res) {
    const requestUrl = new URL(
      normalizeRequestTarget(req.url),
      "http://127.0.0.1"
    );
    const pathname = requestUrl.pathname;

    if (req.method === "GET" && pathname === "/") {
      sendHtml(res, 200, await renderLandingPage());
      return true;
    }

    if (req.method === "GET" && pathname === "/api/server-validation") {
      const serverId = requestUrl.searchParams.get("serverId") ?? "";
      const registered =
        isGuildIdSegment(serverId) && typeof isRegisteredServerId === "function"
          ? await isRegisteredServerId(serverId)
          : false;
      sendJson(res, 200, { registered });
      return true;
    }

    if (req.method === "GET" && pathname === "/riot.txt") {
      serveAssetFile(res, path.join(assetsDir, "riot.txt"));
      return true;
    }

    if (
      req.method === "GET" &&
      (
        pathname === "/public/site.css" ||
        pathname === "/public/site.js" ||
        pathname === "/public/favicon.webp"
      )
    ) {
      serveAssetFile(res, path.join(assetsDir, path.basename(pathname)));
      return true;
    }

    const segments = pathname.split("/").filter(Boolean);
    const [serverId, ...scopedSegments] = segments;

    if (!isGuildIdSegment(serverId)) {
      return false;
    }

    if (
      typeof isRegisteredServerId === "function" &&
      !(await isRegisteredServerId(serverId))
    ) {
      redirectTo(res, "/");
      return true;
    }

    const scopedPath = `/${scopedSegments.join("/")}`.replace(/\/$/, "") || "/";

    if (
      req.method === "POST" &&
      scopedPath.startsWith("/players/") &&
      scopedPath.endsWith("/refresh-riot-accounts") &&
      typeof handlePlayerRiotIdentityRefresh === "function"
    ) {
      const discordId = scopedPath
        .slice("/players/".length, -"/refresh-riot-accounts".length)
        .replace(/\/$/, "");
      const redirect = await handlePlayerRiotIdentityRefresh(serverId, discordId);
      res.writeHead(redirect?.statusCode ?? 303, {
        Location:
          redirect?.location ?? `/${encodeURIComponent(serverId)}/players/${encodeURIComponent(discordId)}`,
      });
      res.end();
      return true;
    }

    if (req.method !== "GET") {
      return false;
    }

    if (scopedPath === "/") {
      sendHtml(res, 200, await renderHomePage(serverId));
      return true;
    }

    if (scopedPath === "/matches") {
      sendHtml(res, 200, await renderMatchesPage(serverId));
      return true;
    }

    if (scopedPath === "/ranking") {
      sendHtml(res, 200, await renderRankingPage(serverId));
      return true;
    }

    if (scopedPath.startsWith("/matches/")) {
      const matchId = scopedPath.slice("/matches/".length);
      const html = await renderMatchDetailPage(serverId, matchId);

      if (html) {
        sendHtml(res, 200, html);
      } else {
        sendHtml(
          res,
          404,
          renderNotFoundPage({
            title: "경기를 찾을 수 없습니다",
            description: "등록된 경기 기록이 아니에요.",
          })
        );
      }

      return true;
    }

    if (scopedPath === "/api/search") {
      const query = requestUrl.searchParams.get("q") ?? "";
      const players = query.trim()
        ? await searchPlayers(serverId, query.trim())
        : [];
      sendJson(res, 200, players);
      return true;
    }

    if (scopedPath === "/players") {
      const query = requestUrl.searchParams.get("q") ?? "";
      const players = query.trim()
        ? await searchPlayers(serverId, query.trim())
        : [];

      if (players.length > 0) {
        res.writeHead(302, {
          Location: `/${encodeURIComponent(serverId)}/players/${encodeURIComponent(players[0].discordId)}`,
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

    if (scopedPath.startsWith("/players/")) {
      const discordId = scopedPath.slice("/players/".length);
      const refreshStatus = requestUrl.searchParams.get("refresh") ?? undefined;
      const html = await renderPlayerPage(serverId, discordId, refreshStatus);

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
