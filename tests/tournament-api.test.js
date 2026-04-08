const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildTournamentApiBaseUrl,
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

test("normalizeLobbyEvents always returns an event list array", () => {
  assert.deepEqual(normalizeLobbyEvents({ eventList: [{ eventType: "ChampSelectStartedEvent" }] }), [
    { eventType: "ChampSelectStartedEvent" },
  ]);
  assert.deepEqual(normalizeLobbyEvents(null), []);
});
