const test = require("node:test");
const assert = require("node:assert/strict");

const {
  handleTournamentCallback,
} = require("../scripts/Web/CallbackServer");

test("callback handler marks the matching session ready for post-game gather from Riot shortCode", async () => {
  const calls = [];
  const deps = {
    sessionStore: {
      async markCompletedPendingGather(tournamentCode, payload) {
        calls.push({ tournamentCode, payload });
        return { success: true };
      },
    },
  };

  const payload = {
    shortCode: "KR-CODE-1",
    gameId: 12345,
  };

  const result = await handleTournamentCallback(payload, deps);

  assert.deepEqual(calls, [
    {
      tournamentCode: "KR-CODE-1",
      payload,
    },
  ]);
  assert.deepEqual(result, { status: 200, body: "ok" });
});

test("callback handler also accepts tournamentCode for local/internal calls", async () => {
  const calls = [];
  const deps = {
    sessionStore: {
      async markCompletedPendingGather(tournamentCode, payload) {
        calls.push({ tournamentCode, payload });
        return { success: true };
      },
    },
  };

  const payload = {
    tournamentCode: "KR-CODE-LEGACY",
    gameId: 12345,
  };

  const result = await handleTournamentCallback(payload, deps);

  assert.deepEqual(calls, [
    {
      tournamentCode: "KR-CODE-LEGACY",
      payload,
    },
  ]);
  assert.deepEqual(result, { status: 200, body: "ok" });
});

test("callback handler rejects payloads without a tournament code", async () => {
  const deps = {
    sessionStore: {
      async markCompletedPendingGather() {
        throw new Error("should not be called");
      },
    },
  };

  const result = await handleTournamentCallback({}, deps);

  assert.deepEqual(result, {
    status: 400,
    body: "missing tournament code",
  });
});

test("callback handler returns 404 when there is no active session for the code", async () => {
  const deps = {
    sessionStore: {
      async markCompletedPendingGather() {
        return { success: false };
      },
    },
  };

  const result = await handleTournamentCallback(
    { shortCode: "KR-UNKNOWN" },
    deps
  );

  assert.deepEqual(result, {
    status: 404,
    body: "session not found",
  });
});
