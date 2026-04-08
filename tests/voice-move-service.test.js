const test = require("node:test");
const assert = require("node:assert/strict");

const {
  moveUsersToAssignedChannels,
  gatherTeamChannelsToUnityRoom,
} = require("../scripts/Discord/VoiceMoveService");

test("moveUsersToAssignedChannels moves members who are already in voice", async () => {
  const moved = [];
  const onlineMember = {
    id: "1",
    voice: {
      channel: { id: "waiting" },
      async setChannel(channel) {
        moved.push(channel.id);
      },
    },
    user: {
      async send() {
        throw new Error("should not DM online users");
      },
    },
  };

  const guild = {
    members: {
      async fetch(id) {
        assert.equal(id, "1");
        return onlineMember;
      },
    },
  };

  const targetChannel = { id: "blue" };
  const result = await moveUsersToAssignedChannels({
    guild,
    assignments: [{ discordId: "1", targetChannel }],
  });

  assert.deepEqual(moved, ["blue"]);
  assert.deepEqual(result.moved, ["1"]);
  assert.deepEqual(result.dmFallbacks, []);
});

test("moveUsersToAssignedChannels DMs users who are not in voice", async () => {
  const sent = [];
  const offlineMember = {
    id: "2",
    voice: {
      channel: null,
      async setChannel() {
        throw new Error("should not move offline users");
      },
    },
    user: {
      async send(message) {
        sent.push(message);
      },
    },
  };

  const targetChannel = {
    id: "purple",
    name: "TEAM PURPLE",
    async createInvite() {
      return { url: "https://discord.gg/test-purple" };
    },
  };

  const guild = {
    members: {
      async fetch(id) {
        assert.equal(id, "2");
        return offlineMember;
      },
    },
  };

  const result = await moveUsersToAssignedChannels({
    guild,
    assignments: [{ discordId: "2", targetChannel }],
  });

  assert.equal(sent.length, 1);
  assert.match(sent[0], /https:\/\/discord\.gg\/test-purple/);
  assert.deepEqual(result.moved, []);
  assert.deepEqual(result.dmFallbacks, ["2"]);
});

test("gatherTeamChannelsToUnityRoom moves users from both team channels into the unity room", async () => {
  const moved = [];
  const blueMember = {
    id: "blue-1",
    voice: {
      async setChannel(channel) {
        moved.push(["blue-1", channel.id]);
      },
    },
  };
  const purpleMember = {
    id: "purple-1",
    voice: {
      async setChannel(channel) {
        moved.push(["purple-1", channel.id]);
      },
    },
  };

  const result = await gatherTeamChannelsToUnityRoom({
    teamChannels: [
      {
        members: new Map([["blue-1", blueMember]]),
      },
      {
        members: new Map([["purple-1", purpleMember]]),
      },
    ],
    unityChannel: { id: "unity" },
  });

  assert.deepEqual(moved, [
    ["blue-1", "unity"],
    ["purple-1", "unity"],
  ]);
  assert.deepEqual(result.moved.sort(), ["blue-1", "purple-1"]);
  assert.deepEqual(result.failures, []);
});
