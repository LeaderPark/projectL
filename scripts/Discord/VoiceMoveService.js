async function createTeamInvite(targetChannel) {
  const invite = await targetChannel.createInvite({
    maxAge: 0,
    maxUses: 0,
    unique: true,
  });

  return invite.url;
}

async function moveUsersToAssignedChannels({ guild, assignments }) {
  const moved = [];
  const dmFallbacks = [];
  const failures = [];
  const inviteCache = new Map();

  for (const assignment of assignments) {
    try {
      const member = await guild.members.fetch(assignment.discordId);

      if (member.voice?.channel) {
        await member.voice.setChannel(assignment.targetChannel);
        moved.push(assignment.discordId);
        continue;
      }

      let inviteUrl = inviteCache.get(assignment.targetChannel.id);
      if (!inviteUrl) {
        inviteUrl = await createTeamInvite(assignment.targetChannel);
        inviteCache.set(assignment.targetChannel.id, inviteUrl);
      }

      await member.user.send(
        `${assignment.targetChannel.name} 음성채널로 참가해주세요: ${inviteUrl}`
      );
      dmFallbacks.push(assignment.discordId);
    } catch (error) {
      failures.push({
        discordId: assignment.discordId,
        message: error?.message ?? "알 수 없는 오류",
      });
    }
  }

  return {
    moved,
    dmFallbacks,
    failures,
  };
}

async function gatherTeamChannelsToUnityRoom({ teamChannels, unityChannel }) {
  const moved = [];
  const failures = [];
  const seen = new Set();

  for (const channel of teamChannels) {
    const members = Array.from(channel.members.values());
    for (const member of members) {
      if (seen.has(member.id)) {
        continue;
      }

      seen.add(member.id);

      try {
        await member.voice.setChannel(unityChannel);
        moved.push(member.id);
      } catch (error) {
        failures.push({
          discordId: member.id,
          message: error?.message ?? "알 수 없는 오류",
        });
      }
    }
  }

  return {
    moved,
    failures,
  };
}

module.exports = {
  createTeamInvite,
  gatherTeamChannelsToUnityRoom,
  moveUsersToAssignedChannels,
};
