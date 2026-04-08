const { moveUsersToAssignedChannels } = require("../Discord/VoiceMoveService");

function hasChampSelectStarted(events) {
  return events.some((event) => event.eventType === "ChampSelectStartedEvent");
}

function hasMoveFailures(result) {
  return Array.isArray(result?.failures) && result.failures.length > 0;
}

async function pollTournamentSessions({ sessionStore, riotApi, moveService }) {
  const sessions = await sessionStore.listPendingSessions();

  for (const session of sessions) {
    try {
      if (
        session.status === "COMPLETED_PENDING_GATHER" ||
        session.status === "GATHER_FAILED"
      ) {
        const gatherResult = await moveService.gatherSession(session);
        await sessionStore.updateSessionStatus(
          session.id,
          hasMoveFailures(gatherResult) ? "GATHER_FAILED" : "COMPLETED",
          session.guildId
        );
        continue;
      }

      const events = await riotApi.getLobbyEventsByCode(session.tournamentCode);
      if (!hasChampSelectStarted(events)) {
        continue;
      }

      const moveResult = await moveService.moveSession(session);
      const lastEventAt = events[events.length - 1]?.timestamp ?? null;
      await sessionStore.updateSessionStatus(
        session.id,
        hasMoveFailures(moveResult) ? "MOVE_FAILED" : "MOVED",
        session.guildId,
        lastEventAt
      );
    } catch (error) {
      console.error(
        `Failed to process tournament session ${session.id}:`,
        error?.message ?? error
      );
      if (session.guildId) {
        await sessionStore.updateSessionStatus(
          session.id,
          "MOVE_FAILED",
          session.guildId
        );
      }
    }
  }
}

function createDatabaseSessionStore() {
  const { listGuildSettings } = require("../Utils/DB");
  const {
    listPendingTournamentSessions,
    markTournamentSessionCompletedPendingGather,
    updateTournamentSessionStatus,
  } = require("../Utils/Query");

  return {
    async listPendingSessions() {
      const guilds = await listGuildSettings();
      const sessions = [];

      for (const guild of guilds) {
        const result = await listPendingTournamentSessions(guild.guild_id);
        if (!result.success) {
          console.error(
            `Failed to list pending tournament sessions for guild ${guild.guild_id}:`,
            result.msg
          );
          continue;
        }

        sessions.push(...result.data);
      }

      return sessions;
    },
    async updateSessionStatus(sessionId, status, guildId, lastEventAt = null) {
      return updateTournamentSessionStatus(guildId, sessionId, status, lastEventAt);
    },
    async markCompletedPendingGather(tournamentCode, payload) {
      const guilds = await listGuildSettings();

      for (const guild of guilds) {
        const result = await markTournamentSessionCompletedPendingGather(
          guild.guild_id,
          tournamentCode,
          payload
        );

        if (result.success) {
          return result;
        }
      }

      return {
        success: false,
        msg: "매칭되는 활성 토너먼트 세션이 없습니다.",
      };
    },
  };
}

async function getGuildChannel(guild, channelId) {
  const cached = guild.channels.cache.get(channelId);
  if (cached) {
    return cached;
  }

  return guild.channels.fetch(channelId);
}

function createGuildMoveService(client) {
  return {
    async moveSession(session) {
      const guild =
        client.guilds.cache.get(session.guildId) ||
        (await client.guilds.fetch(session.guildId));

      const team1Channel = await getGuildChannel(guild, session.team1ChannelId);
      const team2Channel = await getGuildChannel(guild, session.team2ChannelId);

      if (!team1Channel || !team2Channel) {
        throw new Error("팀 음성채널을 찾지 못했습니다.");
      }

      const assignments = [
        ...session.team1DiscordIds.map((discordId) => ({
          discordId,
          targetChannel: team1Channel,
        })),
        ...session.team2DiscordIds.map((discordId) => ({
          discordId,
          targetChannel: team2Channel,
        })),
      ];

      return moveUsersToAssignedChannels({
        guild,
        assignments,
      });
    },
    async gatherSession(session) {
      const guild =
        client.guilds.cache.get(session.guildId) ||
        (await client.guilds.fetch(session.guildId));

      const team1Channel = await getGuildChannel(guild, session.team1ChannelId);
      const team2Channel = await getGuildChannel(guild, session.team2ChannelId);
      const unityChannel = await getGuildChannel(guild, session.unityVoiceChannelId);

      if (!team1Channel || !team2Channel || !unityChannel) {
        throw new Error("게임 종료 후 모일 음성채널을 찾지 못했습니다.");
      }

      const {
        gatherTeamChannelsToUnityRoom,
      } = require("../Discord/VoiceMoveService");

      return gatherTeamChannelsToUnityRoom({
        teamChannels: [team1Channel, team2Channel],
        unityChannel,
      });
    },
  };
}

function createSessionPoller({
  sessionStore,
  riotApi,
  moveService,
  intervalMs = 10000,
}) {
  let running = false;
  let timer = null;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      await pollTournamentSessions({ sessionStore, riotApi, moveService });
    } finally {
      running = false;
    }
  };

  return {
    start() {
      if (timer) {
        return timer;
      }

      timer = setInterval(() => {
        tick().catch((error) => {
          console.error("Tournament session poll failed:", error);
        });
      }, intervalMs);

      if (typeof timer.unref === "function") {
        timer.unref();
      }

      return timer;
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    tick,
  };
}

module.exports = {
  createDatabaseSessionStore,
  createGuildMoveService,
  createSessionPoller,
  hasChampSelectStarted,
  hasMoveFailures,
  pollTournamentSessions,
};
