const http = require("node:http");

async function handleTournamentCallback(body, deps) {
  const tournamentCode = body?.shortCode ?? body?.tournamentCode;
  if (!tournamentCode) {
    return {
      status: 400,
      body: "missing tournament code",
    };
  }

  const result = await deps.sessionStore.markCompletedPendingGather(
    tournamentCode,
    body
  );

  if (!result?.success) {
    return {
      status: 404,
      body: "session not found",
    };
  }

  return {
    status: 200,
    body: "ok",
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function createCallbackServer({ callbackPath = "/riot/callback", sessionStore }) {
  return http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }

    if (req.method === "POST" && req.url === callbackPath) {
      try {
        const body = await readJsonBody(req);
        const result = await handleTournamentCallback(body, { sessionStore });
        res.writeHead(result.status, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(result.body);
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(error?.message ?? "callback error");
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("not found");
  });
}

module.exports = {
  createCallbackServer,
  handleTournamentCallback,
};
