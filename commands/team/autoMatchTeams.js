const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getRuntimeConfig } = require("../../config/runtime");
const { createTournamentApi } = require("../../scripts/Riot/TournamentApi");
const { getGuildSettings } = require("../../scripts/Utils/DB");
const {
  getUsersData,
  replaceActiveTournamentSession,
} = require("../../scripts/Utils/Query");
const {
  TeamDataSaver,
  CheckTeamMember,
  ConvertTeam,
} = require("../../scripts/Utils/SaveTeamData");

function buildRandomEntry(member) {
  return {
    member,
    user: {
      discord_id: member.user.id,
      name: member.displayName ?? member.user.username,
      mmr: 0,
    },
  };
}

function buildTournamentEmbed({
  addOption,
  channel,
  team1Channel,
  team2Channel,
  team1Members,
  team2Members,
  team1MMR,
  team2MMR,
  tournamentCode,
}) {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("내전 팀 분배")
    .setAuthor({
      name: `${addOption}팀 분배 결과`,
    })
    .setDescription(
      `${channel.name} 기준으로 팀을 구성했고 토너먼트 코드를 생성했습니다.`
    )
    .addFields(
      {
        name: `블루팀 - ${team1Channel.name}`,
        value: team1Members
          .map(
            (entry) =>
              `${entry.user.name} - ${entry.member}${entry.user.mmr ? ` (${entry.user.mmr})` : ""}`
          )
          .join("\n"),
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: `퍼플팀 - ${team2Channel.name}`,
        value: team2Members
          .map(
            (entry) =>
              `${entry.user.name} - ${entry.member}${entry.user.mmr ? ` (${entry.user.mmr})` : ""}`
          )
          .join("\n"),
        inline: true,
      }
    )
    .addFields({
      name: "토너먼트 코드",
      value: `\`${tournamentCode}\``,
      inline: false,
    })
    .setTimestamp()
    .setFooter({
      text: "만든놈 - 환주, 진우",
    });

  if (team1MMR > 0 || team2MMR > 0) {
    embed.addFields(
      {
        name: "블루팀 평균 MMR",
        value: `${(team1MMR / team1Members.length).toFixed(1)}`,
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: "퍼플팀 평균 MMR",
        value: `${(team2MMR / team2Members.length).toFixed(1)}`,
        inline: true,
      }
    );
  }

  embed.addFields({
    name: "자동 이동",
    value:
      "이 토너먼트 방에서 챔피언 선택이 시작되면, 현재 서버 음성채널 어디에 있든 팀 채널로 자동 이동합니다. 음성채널에 없으면 DM으로 팀 채널 초대 링크를 보냅니다.",
    inline: false,
  });

  return embed;
}

async function createTournamentSession(interaction, addOption) {
  const runtimeConfig = getRuntimeConfig();
  const riotApi = createTournamentApi({
    token: runtimeConfig.riot.token,
    platform: runtimeConfig.riot.platform,
    region: runtimeConfig.riot.tournamentRegion,
    callbackUrl: runtimeConfig.riot.tournamentCallbackUrl,
    useStub: runtimeConfig.riot.tournamentUseStub,
  });

  const providerId = await riotApi.createProvider();
  const tournamentId = await riotApi.createTournament(
    providerId,
    `${interaction.guild.name} ${Date.now()}`
  );
  const tournamentCode = await riotApi.createTournamentCode(tournamentId, {
    mapType: "SUMMONERS_RIFT",
    pickType: "TOURNAMENT_DRAFT",
    spectatorType: "NONE",
    teamSize: 5,
    metaData: JSON.stringify({
      guildId: interaction.guildId,
      createdBy: interaction.user.id,
      option: addOption,
      createdAt: new Date().toISOString(),
    }),
  });

  return {
    providerId: String(providerId),
    tournamentId: String(tournamentId),
    tournamentCode,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("내전")
    .setDescription(
      "음성채팅방에 있는 유저들을 두 팀으로 나누고 토너먼트 코드를 생성합니다."
    )
    .addStringOption((option) =>
      option
        .setName("옵션")
        .setDescription("추가 옵션을 지정해주세요.")
        .setRequired(true)
        .addChoices(
          { name: "MMR", value: "MMR" },
          { name: "무작위", value: "RANDOM" }
        )
    ),
  async execute(interaction) {
    const channel = interaction.member.voice.channel;
    const team1Channel = interaction.guild.channels.cache.find(
      (x) => x.name === "TEAM BLUE"
    );
    const team2Channel = interaction.guild.channels.cache.find(
      (x) => x.name === "TEAM PURPLE"
    );
    const addOption = interaction.options.getString("옵션");

    if (!channel) {
      return await interaction.reply({
        content: "음성채팅방에 참가해주세요!",
        ephemeral: true,
      });
    }

    if (!team1Channel || !team2Channel) {
      return await interaction.reply({
        content: "TEAM BLUE 또는 TEAM PURPLE 채널을 찾지 못했습니다.",
        ephemeral: true,
      });
    }

    const members = Array.from(channel.members.values());
    if (members.length !== 10) {
      return await interaction.reply({
        content: "토너먼트 내전은 음성채팅방에 정확히 10명이 있어야 합니다.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const guildSettings = await getGuildSettings(interaction.guildId);
    if (!guildSettings?.unity_voice_channel_id) {
      return await interaction.editReply(
        "공용 통화방이 설정되지 않았습니다. 서버 관리자에게 `/서버설정 공용통화방` 설정을 요청해주세요."
      );
    }

    let team1Members = [];
    let team2Members = [];
    let team1MMR = 0;
    let team2MMR = 0;

    switch (addOption) {
      case "RANDOM": {
        const shuffled = [...members].sort(() => Math.random() - 0.5);
        shuffled.forEach((member, index) => {
          if (index % 2 === 0) {
            team1Members.push(buildRandomEntry(member));
          } else {
            team2Members.push(buildRandomEntry(member));
          }
        });
        break;
      }
      case "MMR": {
        const userIds = members.map((member) => member.user.id);
        const users = await getUsersData(interaction.guildId, userIds);

        if (!users.success) {
          return await interaction.editReply(
            users.msg || "유저 정보를 불러오는 중 오류가 발생했습니다."
          );
        }

        if (users.data.length < 10) {
          return await interaction.editReply(
            "등록되지 않은 소환사가 있습니다. 모든 참여자가 최소 1개 이상의 라이엇 계정을 등록해야 합니다."
          );
        }

        for (let i = 0; i < users.data.length; i++) {
          const user = users.data[i];
          const member = members.find((x) => x.user.id === user.discord_id);
          if (!member) {
            continue;
          }

          if (team1MMR > team2MMR || team1Members.length >= 5) {
            team2MMR += user.mmr;
            team2Members.push({ member, user });
          } else {
            team1MMR += user.mmr;
            team1Members.push({ member, user });
          }
        }

        const shouldConvert = CheckTeamMember(team1Members, team2Members);
        if (shouldConvert) {
          const [convertedTeam1, convertedTeam2] = ConvertTeam(
            team1Members,
            team2Members
          );
          team1Members = convertedTeam1;
          team2Members = convertedTeam2;
          team1MMR = team1Members.reduce((sum, entry) => sum + entry.user.mmr, 0);
          team2MMR = team2Members.reduce((sum, entry) => sum + entry.user.mmr, 0);
        }

        TeamDataSaver(team1Members, team2Members);
        break;
      }
      default:
        return await interaction.editReply("해당하는 옵션이 없습니다.");
    }

    if (team1Members.length !== 5 || team2Members.length !== 5) {
      return await interaction.editReply(
        "팀 구성이 올바르게 완료되지 않았습니다. 다시 시도해주세요."
      );
    }

    try {
      const tournament = await createTournamentSession(interaction, addOption);
      const sessionResult = await replaceActiveTournamentSession(
        interaction.guildId,
        {
          tournamentCode: tournament.tournamentCode,
          providerId: tournament.providerId,
          tournamentId: tournament.tournamentId,
          sourceChannelId: channel.id,
          team1ChannelId: team1Channel.id,
          team2ChannelId: team2Channel.id,
          unityVoiceChannelId: guildSettings.unity_voice_channel_id,
          team1DiscordIds: team1Members.map((entry) => entry.member.user.id),
          team2DiscordIds: team2Members.map((entry) => entry.member.user.id),
          status: "LOBBY",
        }
      );

      if (!sessionResult.success) {
        return await interaction.editReply(
          sessionResult.msg || "토너먼트 세션을 저장하는 중 오류가 발생했습니다."
        );
      }

      const embed = buildTournamentEmbed({
        addOption,
        channel,
        team1Channel,
        team2Channel,
        team1Members,
        team2Members,
        team1MMR,
        team2MMR,
        tournamentCode: tournament.tournamentCode,
      });

      return await interaction.editReply({
        content:
          "팀을 확정했고 새 토너먼트 세션을 생성했습니다. 다시 `/내전`을 실행하면 이전 활성 세션은 취소되고 새 팀/코드로 교체됩니다.",
        embeds: [embed],
      });
    } catch (error) {
      return await interaction.editReply(
        `토너먼트 코드를 생성하는 중 오류가 발생했습니다: ${
          error?.message ?? "알 수 없는 오류"
        }`
      );
    }
  },
};
