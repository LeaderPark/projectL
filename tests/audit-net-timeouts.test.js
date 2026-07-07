const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const { downloadHttpFile } = require("../scripts/Utils/Parser");

// Mirrors the axios-injection pattern used in tests/tournament-api.test.js:
// axios is a regular file-based module, so swapping require.cache lets us
// observe the config TournamentApi hands to axios.create() without making
// real network calls.
function loadTournamentApiModule(axiosOverrides) {
  const axiosPath = require.resolve("axios");
  const modulePath = require.resolve("../scripts/Riot/TournamentApi");
  const originalAxiosModule = require.cache[axiosPath];

  delete require.cache[modulePath];
  require.cache[axiosPath] = {
    id: axiosPath,
    filename: axiosPath,
    loaded: true,
    exports: axiosOverrides,
  };

  const tournamentApiModule = require(modulePath);

  if (originalAxiosModule) {
    require.cache[axiosPath] = originalAxiosModule;
  } else {
    delete require.cache[axiosPath];
  }

  return tournamentApiModule;
}

test("createTournamentApi builds its axios clients with a bounded timeout", () => {
  const axiosCalls = [];
  const { createTournamentApi } = loadTournamentApiModule({
    create(config) {
      axiosCalls.push(config);
      return { async get() {}, async post() {} };
    },
  });

  createTournamentApi({
    token: "riot-token",
    platform: "kr",
    useStub: false,
    regionalRoute: "asia",
  });

  assert.equal(axiosCalls.length, 2);
  axiosCalls.forEach((config) => {
    assert.equal(typeof config.timeout, "number");
    assert.ok(config.timeout > 0, "axios client must have a positive timeout");
    assert.ok(config.timeout <= 8000, "axios client timeout should be bounded");
  });
});

test("Parser.downloadHttpFile rejects once a stalled response exceeds the timeout", async () => {
  // The server sends headers and a partial body, then never calls res.end(),
  // simulating a half-open socket (e.g. a stalled Discord CDN download).
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/octet-stream" });
    res.write("partial-bytes-only");
    // Intentionally never end the response.
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/replay.rofl`;

  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "projectl-net-timeout-test-")
  );
  const filePath = path.join(tempDir, "replay.rofl");

  try {
    await assert.rejects(
      () => downloadHttpFile(url, filePath, 3, 200),
      /timed out/
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
