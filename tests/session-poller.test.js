const test = require("node:test");
const assert = require("node:assert/strict");

const {
  pollTournamentSessions,
  hasChampSelectStarted,
} = require("../scripts/Tournament/SessionPoller");

test("hasChampSelectStarted detects the champion select event", () => {
  assert.equal(
    hasChampSelectStarted([
      { eventType: "PlayerJoinedGameEvent" },
      { eventType: "ChampSelectStartedEvent" },
    ]),
    true
  );
  assert.equal(hasChampSelectStarted([{ eventType: "PlayerJoinedGameEvent" }]), false);
});

test("pollTournamentSessions marks the session moved after champion select handling", async () => {
  let updatedStatus = null;
  let movedSession = null;

  const sessionStore = {
    async listPendingSessions() {
      return [{ id: 10, tournamentCode: "KR-TEST-1" }];
    },
    async updateSessionStatus(id, status) {
      updatedStatus = { id, status };
    },
  };

  const riotApi = {
    async getLobbyEventsByCode(code) {
      assert.equal(code, "KR-TEST-1");
      return [{ eventType: "ChampSelectStartedEvent" }];
    },
  };

  const moveService = {
    async moveSession(session) {
      movedSession = session;
    },
  };

  await pollTournamentSessions({ sessionStore, riotApi, moveService });

  assert.deepEqual(movedSession, { id: 10, tournamentCode: "KR-TEST-1" });
  assert.deepEqual(updatedStatus, { id: 10, status: "MOVED" });
});

test("pollTournamentSessions gathers users when a session is awaiting post-game gather", async () => {
  const transitions = [];
  const gathered = [];

  const sessionStore = {
    async listPendingSessions() {
      return [
        {
          id: 22,
          guildId: "guild-1",
          tournamentCode: "KR-TEST-2",
          status: "COMPLETED_PENDING_GATHER",
        },
      ];
    },
    async updateSessionStatus(id, status, guildId) {
      transitions.push({ id, status, guildId });
    },
  };

  const riotApi = {
    async getLobbyEventsByCode() {
      throw new Error("should not fetch lobby events for completed sessions");
    },
  };

  const moveService = {
    async moveSession() {
      throw new Error("should not run moveSession for completed sessions");
    },
    async gatherSession(session) {
      gathered.push(session);
    },
  };

  await pollTournamentSessions({ sessionStore, riotApi, moveService });

  assert.deepEqual(gathered, [
    {
      id: 22,
      guildId: "guild-1",
      tournamentCode: "KR-TEST-2",
      status: "COMPLETED_PENDING_GATHER",
    },
  ]);
  assert.deepEqual(transitions, [
    { id: 22, status: "COMPLETED", guildId: "guild-1" },
  ]);
});

test("pollTournamentSessions keeps the session retryable when automatic move has failures", async () => {
  const transitions = [];

  const sessionStore = {
    async listPendingSessions() {
      return [{ id: 30, guildId: "guild-2", tournamentCode: "KR-TEST-3" }];
    },
    async updateSessionStatus(id, status, guildId) {
      transitions.push({ id, status, guildId });
    },
  };

  const riotApi = {
    async getLobbyEventsByCode() {
      return [{ eventType: "ChampSelectStartedEvent" }];
    },
  };

  const moveService = {
    async moveSession() {
      return {
        moved: ["1"],
        dmFallbacks: [],
        failures: [{ discordId: "2", message: "missing permission" }],
      };
    },
  };

  await pollTournamentSessions({ sessionStore, riotApi, moveService });

  assert.deepEqual(transitions, [
    { id: 30, status: "MOVE_FAILED", guildId: "guild-2" },
  ]);
});

test("pollTournamentSessions keeps the session retryable when post-game gather has failures", async () => {
  const transitions = [];

  const sessionStore = {
    async listPendingSessions() {
      return [
        {
          id: 31,
          guildId: "guild-3",
          tournamentCode: "KR-TEST-4",
          status: "COMPLETED_PENDING_GATHER",
        },
      ];
    },
    async updateSessionStatus(id, status, guildId) {
      transitions.push({ id, status, guildId });
    },
  };

  const riotApi = {
    async getLobbyEventsByCode() {
      throw new Error("should not fetch lobby events while gathering");
    },
  };

  const moveService = {
    async moveSession() {
      throw new Error("should not run moveSession while gathering");
    },
    async gatherSession() {
      return {
        moved: ["1"],
        failures: [{ discordId: "2", message: "target full" }],
      };
    },
  };

  await pollTournamentSessions({ sessionStore, riotApi, moveService });

  assert.deepEqual(transitions, [
    { id: 31, status: "GATHER_FAILED", guildId: "guild-3" },
  ]);
});
