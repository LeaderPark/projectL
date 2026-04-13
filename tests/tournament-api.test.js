const test = require("node:test");
const assert = require("node:assert/strict");

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

const {
  buildTournamentApiBaseUrl,
  buildMatchApiBaseUrl,
  normalizeLobbyEvents,
} = require("../scripts/Riot/TournamentApi");

test("buildTournamentApiBaseUrl selects stub mode when configured", () => {
  assert.equal(
    buildTournamentApiBaseUrl({ useStub: true, platform: "kr" }),
    "https://kr.api.riotgames.com/lol/tournament-stub/v5"
  );
});

test("buildTournamentApiBaseUrl selects live tournament mode when stub is disabled", () => {
  assert.equal(
    buildTournamentApiBaseUrl({ useStub: false, platform: "na1" }),
    "https://na1.api.riotgames.com/lol/tournament/v5"
  );
});

test("buildMatchApiBaseUrl selects the regional match-v5 route", () => {
  assert.equal(
    buildMatchApiBaseUrl({ regionalRoute: "asia" }),
    "https://asia.api.riotgames.com/lol/match/v5"
  );
});

test("buildMatchApiBaseUrl infers the regional route from the platform when not provided", () => {
  assert.equal(
    buildMatchApiBaseUrl({ platform: "kr" }),
    "https://asia.api.riotgames.com/lol/match/v5"
  );
});

test("buildMatchApiBaseUrl fails fast for unknown platforms without an explicit regional route", () => {
  assert.throws(
    () => buildMatchApiBaseUrl({ platform: "unknown1" }),
    /regional route/i
  );
});

test("normalizeLobbyEvents always returns an event list array", () => {
  assert.deepEqual(normalizeLobbyEvents({ eventList: [{ eventType: "ChampSelectStartedEvent" }] }), [
    { eventType: "ChampSelectStartedEvent" },
  ]);
  assert.deepEqual(normalizeLobbyEvents(null), []);
});

test("createTournamentApi fetches full match details by match id on the regional route", async () => {
  const axiosCalls = [];
  const fakeClients = [];
  const { createTournamentApi } = loadTournamentApiModule({
    create(config) {
      axiosCalls.push(config);
      const client = {
        async get(path) {
          fakeClients.push({ baseURL: config.baseURL, path });
          return { data: { metadata: { matchId: "KR_12345" } } };
        },
      };

      return client;
    },
  });

  const api = createTournamentApi({
    token: "riot-token",
    platform: "kr",
    useStub: false,
    regionalRoute: "asia",
  });

  const result = await api.getMatchById("KR_12345");

  assert.deepEqual(result, { metadata: { matchId: "KR_12345" } });
  assert.deepEqual(
    axiosCalls.map((entry) => entry.baseURL),
    [
      "https://kr.api.riotgames.com/lol/tournament/v5",
      "https://asia.api.riotgames.com/lol/match/v5",
    ]
  );
  assert.deepEqual(fakeClients, [
    {
      baseURL: "https://asia.api.riotgames.com/lol/match/v5",
      path: "/matches/KR_12345",
    },
  ]);
});

test("createTournamentApi prefixes numeric match ids with the uppercased platform", async () => {
  const fakeClients = [];
  const { createTournamentApi } = loadTournamentApiModule({
    create(config) {
      return {
        async get(path) {
          fakeClients.push({ baseURL: config.baseURL, path });
          return { data: { metadata: { matchId: "KR_12345" } } };
        },
      };
    },
  });

  const api = createTournamentApi({
    token: "riot-token",
    platform: "kr",
    useStub: false,
  });

  await api.getMatchById(12345);

  assert.deepEqual(fakeClients, [
    {
      baseURL: "https://asia.api.riotgames.com/lol/match/v5",
      path: "/matches/KR_12345",
    },
  ]);
});

test("createTournamentApi translates tournament 403 errors into actionable guidance", async () => {
  const { createTournamentApi } = loadTournamentApiModule({
    create() {
      return {
        async post() {
          const error = new Error("Request failed with status code 403");
          error.response = {
            status: 403,
            data: {
              status: {
                message: "Forbidden",
                status_code: 403,
              },
            },
          };
          throw error;
        },
      };
    },
  });

  const api = createTournamentApi({
    token: "riot-token",
    platform: "kr",
    region: "KR",
    callbackUrl: "https://example.com/riot/callback",
    useStub: true,
  });

  await assert.rejects(
    () => api.createProvider(),
    /Tournament API 호출이 403으로 거부되었습니다/
  );
});
