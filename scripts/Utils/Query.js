const { getGuildPromisePool } = require("./DB");
const { buildMatchmakingAdjustments } = require("./MatchmakingRating");
const {
  formatGuildConfigurationError,
  isGuildConfigurationError,
} = require("./GuildDatabase");

function buildErrorResult(error, fallbackMessage) {
  if (isGuildConfigurationError(error)) {
    return {
      success: false,
      code: error.code,
      msg: formatGuildConfigurationError(error),
    };
  }

  return {
    success: false,
    msg: error?.message ?? fallbackMessage,
  };
}

const EMPTY_JSON_OBJECT = "{}";
const EMPTY_JSON_ARRAY = "[]";

function buildInClausePlaceholders(length) {
  return Array.from({ length }, () => "?").join(",");
}

function hasRequiredValue(value) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function buildInvalidInputResult(message) {
  return {
    success: false,
    code: "INVALID_INPUT",
    msg: message,
  };
}

function validateRiotAccount(account) {
  if (!hasRequiredValue(account?.riotGameName)) {
    return buildInvalidInputResult("소환사 이름 정보가 누락되었습니다.");
  }

  if (!hasRequiredValue(account?.riotTagLine)) {
    return buildInvalidInputResult("소환사 태그 정보가 누락되었습니다.");
  }

  if (!hasRequiredValue(account?.puuid)) {
    return buildInvalidInputResult("라이엇 PUUID 정보가 누락되었습니다.");
  }

  if (!hasRequiredValue(account?.summonerId)) {
    return buildInvalidInputResult("라이엇 소환사 ID 정보가 누락되었습니다.");
  }

  return null;
}

function validateMatchInsertPayload(match, name) {
  if (!hasRequiredValue(name)) {
    return buildInvalidInputResult("경기 ID 정보가 누락되었습니다.");
  }

  if (!Number.isFinite(Number(match?.gameLength)) || Number(match?.gameLength) <= 0) {
    return buildInvalidInputResult("리플레이의 게임 길이 정보가 올바르지 않습니다.");
  }

  if (!match?.purpleTeam || !Array.isArray(match.purpleTeam.players)) {
    return buildInvalidInputResult("리플레이의 퍼플팀 정보가 올바르지 않습니다.");
  }

  if (!match?.blueTeam || !Array.isArray(match.blueTeam.players)) {
    return buildInvalidInputResult("리플레이의 블루팀 정보가 올바르지 않습니다.");
  }

  return null;
}

function validateTournamentSession(session) {
  if (!hasRequiredValue(session?.tournamentCode)) {
    return buildInvalidInputResult("토너먼트 코드가 누락되었습니다.");
  }

  if (!hasRequiredValue(session?.sourceChannelId)) {
    return buildInvalidInputResult("원본 음성채널 정보가 누락되었습니다.");
  }

  if (!hasRequiredValue(session?.team1ChannelId)) {
    return buildInvalidInputResult("블루팀 음성채널 정보가 누락되었습니다.");
  }

  if (!hasRequiredValue(session?.team2ChannelId)) {
    return buildInvalidInputResult("퍼플팀 음성채널 정보가 누락되었습니다.");
  }

  return null;
}

function buildRiotDisplayName(gameName, tagLine) {
  return `${gameName}#${tagLine}`;
}

function buildRiotAccountDisplayName(account) {
  const riotGameName = String(
    account?.riot_game_name ?? account?.riotGameName ?? ""
  ).trim();
  const riotTagLine = String(
    account?.riot_tag_line ?? account?.riotTagLine ?? ""
  ).trim();

  return [riotGameName, riotTagLine].filter(Boolean).join("#");
}

async function listLinkedRiotAccountsWithExecutor(executor, discordId) {
  const [rows] = await executor.query(
    `
      SELECT id, riot_game_name, riot_tag_line, is_primary, created_at, discord_id, puuid, summoner_id
      FROM riot_accounts
      WHERE discord_id = ?
      ORDER BY is_primary DESC, created_at ASC, id ASC
    `,
    [discordId]
  );

  return rows;
}

const listRefreshableRiotAccounts = async (guildId, discordId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const rows = await listLinkedRiotAccountsWithExecutor(promisePool, discordId);

    return {
      success: true,
      data: rows.map((row) => ({
        id: Number(row.id),
        discordId: String(row.discord_id ?? ""),
        puuid: String(row.puuid ?? ""),
        riotGameName: String(row.riot_game_name ?? ""),
        riotTagLine: String(row.riot_tag_line ?? ""),
        isPrimary: Number(row.is_primary) === 1,
      })),
    };
  } catch (error) {
    return buildErrorResult(
      error,
      "새로고침 가능한 롤 계정을 불러오는 중 오류가 발생했습니다."
    );
  }
};

const updateRiotAccountDisplayName = async (
  guildId,
  accountId,
  discordId,
  { riotGameName, riotTagLine }
) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    await promisePool.query(
      `UPDATE riot_accounts SET riot_game_name = ?, riot_tag_line = ? WHERE id = ? AND discord_id = ?`,
      [riotGameName, riotTagLine, accountId, discordId]
    );

    return { success: true };
  } catch (error) {
    return buildErrorResult(
      error,
      "롤 계정 표시 이름을 갱신하는 중 오류가 발생했습니다."
    );
  }
};

async function syncPrimaryRiotAccountNameWithExecutor(executor, discordId) {
  const [rows] = await executor.query(
    `SELECT riot_game_name, riot_tag_line
     FROM riot_accounts
     WHERE discord_id = ?
     ORDER BY is_primary DESC, created_at ASC, id ASC
     LIMIT 1`,
    [discordId]
  );
  const primaryAccount = rows[0];

  if (!primaryAccount) {
    return {
      success: false,
      code: "ACCOUNT_NOT_FOUND",
      msg: "등록된 롤 계정을 찾을 수 없습니다.",
    };
  }

  const primaryAccountDisplayName = buildRiotAccountDisplayName(primaryAccount);
  await executor.query(`UPDATE user SET name = ? WHERE discord_id = ?`, [
    primaryAccountDisplayName,
    discordId,
  ]);

  return {
    success: true,
    data: {
      primaryAccountDisplayName,
    },
  };
}

const syncRepresentativeRiotName = async (guildId, discordId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    return await syncPrimaryRiotAccountNameWithExecutor(promisePool, discordId);
  } catch (error) {
    return buildErrorResult(
      error,
      "대표 롤 아이디 이름을 동기화하는 중 오류가 발생했습니다."
    );
  }
};

function buildGetUsersDataSql(ids) {
  return `SELECT discord_id, name, mmr FROM user WHERE discord_id IN (${buildInClausePlaceholders(
    ids.length
  )}) ORDER BY mmr DESC, name ASC`;
}

function buildPublicSummarySql() {
  return `
    SELECT
      COUNT(*) AS total_matches,
      (SELECT COUNT(*) AS total_players FROM user) AS total_players,
      (SELECT MAX(mmr) FROM user) AS top_mmr,
      (
        SELECT COALESCE(
          MAX(ROUND((win / NULLIF(win + lose, 0)) * 100)),
          0
        )
        FROM user
        WHERE (win + lose) > 0
      ) AS top_win_rate
    FROM matches
  `;
}

function buildPublicPlayerSearchSql() {
  return `
    SELECT discord_id, name, mmr, win, lose
    FROM user
    WHERE name LIKE ?
    ORDER BY mmr DESC, name ASC
    LIMIT 10
  `;
}

function buildPublicLeaderboardSql(limit) {
  return `
    SELECT discord_id, name, mmr, win, lose
    FROM user
    ORDER BY mmr DESC, name ASC
    ${Number.isFinite(limit) ? "LIMIT ?" : ""}
  `;
}

function buildPublicMatchHistorySql(limit) {
  return `
    SELECT *
    FROM matches
    ORDER BY id DESC
    ${Number.isFinite(limit) ? "LIMIT ?" : ""}
  `.trim();
}

function buildPublicMatchByIdSql() {
  return `
    SELECT *
    FROM matches
    WHERE id = ?
    LIMIT 1
  `.trim();
}

function parseStoredJson(value, fallback) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeIdentityValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function getLinkedMatchIdentitiesForUser(executor, discordId) {
  const [rows] = await executor.query(
    `
      SELECT puuid, name AS player_name
      FROM user
      WHERE discord_id = ?
      UNION
      SELECT puuid, CONCAT(riot_game_name, '#', riot_tag_line) AS player_name
      FROM riot_accounts
      WHERE discord_id = ?
    `,
    [discordId, discordId]
  );

  return {
    puuids: new Set(
      rows
        .map((row) => normalizeIdentityValue(row?.puuid))
        .filter((value) => value.length > 0)
    ),
    names: new Set(
      rows
        .map((row) => normalizeIdentityValue(row?.player_name))
        .filter((value) => value.length > 0)
    ),
    rawNames: rows
      .map((row) => String(row?.player_name ?? "").trim())
      .filter((value) => value.length > 0),
  };
}

function matchesLinkedIdentity(player, linkedIdentities) {
  if (!linkedIdentities) {
    return false;
  }

  const playerPuuid = normalizeIdentityValue(player?.puuid);
  if (playerPuuid && linkedIdentities.puuids?.has(playerPuuid)) {
    return true;
  }

  const playerName = normalizeIdentityValue(player?.playerName);
  return Boolean(playerName && linkedIdentities.names?.has(playerName));
}

function buildPerspectiveResultMetadata(matchRow, linkedIdentities) {
  const hasPuuidIdentities = linkedIdentities?.puuids instanceof Set;
  const hasNameIdentities = linkedIdentities?.names instanceof Set;
  const hasAnyIdentity =
    (hasPuuidIdentities && linkedIdentities.puuids.size > 0) ||
    (hasNameIdentities && linkedIdentities.names.size > 0);

  if (!hasAnyIdentity) {
    return {};
  }

  const blueTeam = parseStoredJson(matchRow?.blue_team, { players: [], result: 0 });
  const purpleTeam = parseStoredJson(matchRow?.purple_team, {
    players: [],
    result: 0,
  });
  const matchedBluePlayer = Array.isArray(blueTeam.players)
    ? blueTeam.players.find((player) => matchesLinkedIdentity(player, linkedIdentities))
    : null;
  const matchedPurplePlayer =
    !matchedBluePlayer && Array.isArray(purpleTeam.players)
      ? purpleTeam.players.find((player) =>
          matchesLinkedIdentity(player, linkedIdentities)
        )
      : null;

  const playerIsOnBlue = Boolean(matchedBluePlayer);
  const playerIsOnPurple = Boolean(matchedPurplePlayer);

  if (!playerIsOnBlue && !playerIsOnPurple) {
    return {};
  }

  const matchedPlayer = matchedBluePlayer ?? matchedPurplePlayer;
  const preferredLinkedName = Array.isArray(linkedIdentities?.rawNames)
    ? linkedIdentities.rawNames.find((value) => value.length > 0)
    : "";
  const playerWon = playerIsOnBlue
    ? Number(blueTeam.result) === 1
    : Number(purpleTeam.result) === 1;

  return {
    player_result_text: playerWon ? "승리" : "패배",
    player_result_tone: playerWon ? "blue" : "red",
    perspective_player_puuid: String(matchedPlayer?.puuid ?? "").trim() || undefined,
    perspective_player_name:
      String(matchedPlayer?.playerName ?? "").trim() || preferredLinkedName || undefined,
  };
}

async function ensureUserProfile(promisePool, discordId, displayName, puuid) {
  const [rows] = await promisePool.query(
    `SELECT * FROM user WHERE discord_id = ? LIMIT 1`,
    [discordId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  await promisePool.query(
    `INSERT INTO user (discord_id, puuid, name, champions, lanes, friends)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      discordId,
      puuid,
      displayName,
      EMPTY_JSON_OBJECT,
      EMPTY_JSON_OBJECT,
      EMPTY_JSON_OBJECT,
    ]
  );

  return {
    discord_id: discordId,
    puuid,
    name: displayName,
  };
}

async function registerRiotAccount(guildId, discordId, account) {
  try {
    const validationError = validateRiotAccount(account);
    if (validationError) {
      return validationError;
    }

    const promisePool = await getGuildPromisePool(guildId);
    const displayName = buildRiotDisplayName(
      account.riotGameName,
      account.riotTagLine
    );

    const [conflicts] = await promisePool.query(
      `SELECT discord_id
       FROM riot_accounts
       WHERE puuid = ?
          OR summoner_id = ?
          OR (riot_game_name = ? AND riot_tag_line = ?)
       LIMIT 1`,
      [
        account.puuid,
        account.summonerId,
        account.riotGameName,
        account.riotTagLine,
      ]
    );

    if (conflicts.length > 0) {
      const message =
        conflicts[0].discord_id === discordId
          ? "이미 등록된 계정입니다."
          : "다른 디스코드 사용자에게 등록된 계정입니다.";

      return {
        success: false,
        code: "ALREADY_REGISTERED",
        msg: message,
      };
    }

    const linkedAccounts = await listLinkedRiotAccountsWithExecutor(
      promisePool,
      discordId
    );
    const insertedAccountIsPrimary = linkedAccounts.length === 0;
    const userProfile = await ensureUserProfile(
      promisePool,
      discordId,
      displayName,
      account.puuid
    );

    await promisePool.query(
      `INSERT INTO riot_accounts
       (discord_id, riot_game_name, riot_tag_line, puuid, summoner_id, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        discordId,
        account.riotGameName,
        account.riotTagLine,
        account.puuid,
        account.summonerId,
        insertedAccountIsPrimary ? 1 : 0,
      ]
    );

    let primaryAccountDisplayName = displayName;
    if (insertedAccountIsPrimary) {
      if (String(userProfile?.name ?? "").trim() !== displayName) {
        await promisePool.query(`UPDATE user SET name = ? WHERE discord_id = ?`, [
          displayName,
          discordId,
        ]);
      }
    } else {
      const syncResult = await syncPrimaryRiotAccountNameWithExecutor(
        promisePool,
        discordId
      );
      if (!syncResult.success) {
        return syncResult;
      }
      primaryAccountDisplayName = syncResult.data.primaryAccountDisplayName;
    }

    const accountCount = linkedAccounts.length + 1;

    return {
      success: true,
      data: {
        discordId,
        registeredAccountDisplayName: displayName,
        primaryAccountDisplayName,
        accountCount,
        requiresPrimarySelection: accountCount > 1,
        insertedAccountIsPrimary,
      },
    };
  } catch (error) {
    return buildErrorResult(error, "에러가 발생하였습니다.");
  }
}

async function setPrimaryRiotAccount(guildId, discordId, riotGameName, riotTagLine) {
  if (!hasRequiredValue(riotGameName) || !hasRequiredValue(riotTagLine)) {
    return buildInvalidInputResult("대표로 설정할 롤 아이디 정보가 누락되었습니다.");
  }

  let connection;

  try {
    const promisePool = await getGuildPromisePool(guildId);
    connection =
      typeof promisePool.getConnection === "function"
        ? await promisePool.getConnection()
        : null;
    const executor = connection ?? promisePool;

    if (typeof executor.beginTransaction === "function") {
      await executor.beginTransaction();
    }

    const [rows] = await executor.query(
      `
        SELECT id, riot_game_name, riot_tag_line
        FROM riot_accounts
        WHERE discord_id = ?
          AND riot_game_name = ?
          AND riot_tag_line = ?
        LIMIT 1
      `,
      [discordId, riotGameName, riotTagLine]
    );

    if (!rows.length) {
      if (typeof executor.rollback === "function") {
        await executor.rollback();
      }

      return {
        success: false,
        code: "ACCOUNT_NOT_FOUND",
        msg: "등록된 롤 계정을 찾을 수 없습니다.",
      };
    }

    await executor.query(`UPDATE riot_accounts SET is_primary = 0 WHERE discord_id = ?`, [
      discordId,
    ]);
    await executor.query(`UPDATE riot_accounts SET is_primary = 1 WHERE id = ?`, [
      rows[0].id,
    ]);

    const syncResult = await syncPrimaryRiotAccountNameWithExecutor(
      executor,
      discordId
    );
    if (!syncResult.success) {
      if (typeof executor.rollback === "function") {
        await executor.rollback();
      }

      return syncResult;
    }

    if (typeof executor.commit === "function") {
      await executor.commit();
    }

    return {
      success: true,
      data: {
        primaryAccountDisplayName: syncResult.data.primaryAccountDisplayName,
      },
    };
  } catch (error) {
    if (connection && typeof connection.rollback === "function") {
      await connection.rollback();
    }

    return buildErrorResult(error, "대표 롤 아이디를 설정하는 중 오류가 발생했습니다.");
  } finally {
    if (connection && typeof connection.release === "function") {
      connection.release();
    }
  }
}

const registraion = async (guildId, discordId, name, puuid) =>
  registerRiotAccount(guildId, discordId, {
    riotGameName: name.split("#")[0] ?? name,
    riotTagLine: name.split("#")[1] ?? "",
    puuid,
    summonerId: puuid,
  });

async function resolveUsersByPuuids(guildId, puuids) {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    return await resolveUsersByPuuidsWithExecutor(promisePool, puuids);
  } catch (error) {
    return buildErrorResult(error, "연결된 라이엇 계정을 불러오는 중 오류가 발생했습니다.");
  }
}

async function resolveUsersByPuuidsWithExecutor(executor, puuids) {
  if (!puuids.length) {
    return { success: true, data: [] };
  }

  const placeholders = buildInClausePlaceholders(puuids.length);
  const [rows] = await executor.query(
    `SELECT u.*, u.puuid AS linked_puuid
     FROM user u
     WHERE u.puuid IN (${placeholders})
     UNION
     SELECT u.*, ra.puuid AS linked_puuid
     FROM user u
     JOIN riot_accounts ra ON ra.discord_id = u.discord_id
     WHERE ra.puuid IN (${placeholders})`,
    [...puuids, ...puuids]
  );

  return { success: true, data: rows };
}

const insertMatchData = async (guildId, match, name) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    return await insertMatchDataWithExecutor(promisePool, match, name);
  } catch (error) {
    return buildErrorResult(
      error,
      "insertMatchData 중 예기치 못한 오류가 발생하였습니다."
    );
  }
};

async function insertMatchDataWithExecutor(executor, match, name) {
  const validationError = validateMatchInsertPayload(match, name);
  if (validationError) {
    return validationError;
  }

  let sql = `SELECT * FROM matches WHERE game_id = ?`;
  let [result] = await executor.query(sql, [name]);

  if (result.length > 0) {
    return { success: false, msg: "이미 데이터에 존재하는 경기입니다." };
  }

  sql = `INSERT INTO matches (game_id, game_length, played_at_kst, purple_team, blue_team) VALUES (?,?,?,?,?)`;
  [result] = await executor.query(sql, [
    name,
    match.gameLength,
    match.playedAtKst ?? null,
    JSON.stringify(match.purpleTeam),
    JSON.stringify(match.blueTeam),
  ]);

  const matchId = result.insertId;
  const puuids = [...match.blueTeam.players, ...match.purpleTeam.players]
    .map((player) => player.puuid)
    .filter(Boolean);

  const linkedUsers = await resolveUsersByPuuidsWithExecutor(executor, puuids);
  if (!linkedUsers.success) {
    return linkedUsers;
  }

  const uniqueDiscordIds = [...new Set(linkedUsers.data.map((row) => row.discord_id))];
  if (uniqueDiscordIds.length > 0) {
    const values = uniqueDiscordIds.map(() => "(?, ?)").join(", ");
    const params = uniqueDiscordIds.flatMap((discordId) => [matchId, discordId]);
    const sql3 = `INSERT INTO match_in_users (match_id, user_id) VALUES ${values}`;

    await executor.query(sql3, params);
  }

  return { success: true, matchId };
}

const updateUserData = async (guildId, match) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    return await updateUserDataWithExecutor(promisePool, match);
  } catch (error) {
    return buildErrorResult(
      error,
      "updateUserData 중 예기치 못한 오류가 발생하였습니다."
    );
  }
};

async function updateUserDataWithExecutor(executor, match) {
  const players = [...match.blueTeam.players, ...match.purpleTeam.players];
  const linkedUsers = await resolveUsersByPuuidsWithExecutor(
    executor,
    players.map((player) => player.puuid).filter(Boolean)
  );

  if (!linkedUsers.success) {
    return linkedUsers;
  }

  const updateSql = `UPDATE user SET mmr = ?, win = ?, lose = ?, penta = ?, quadra = ?, champions = ?, lanes = ?, friends = ?, t_kill = ?, t_death = ?, t_assist = ?, t_kill_rate = ? WHERE discord_id = ?`;
  const linkedByPuuid = new Map();
  linkedUsers.data.forEach((row) => {
    linkedByPuuid.set(row.linked_puuid, row);
  });

  const ratingInputsByPuuid = new Map();
  match.blueTeam.players.forEach((player) => {
    const user = linkedByPuuid.get(player.puuid);
    ratingInputsByPuuid.set(player.puuid, {
      playerId: player.puuid,
      mmr: Number(user?.mmr ?? 1000),
      win: Number(user?.win ?? 0),
      lose: Number(user?.lose ?? 0),
    });
  });
  match.purpleTeam.players.forEach((player) => {
    const user = linkedByPuuid.get(player.puuid);
    ratingInputsByPuuid.set(player.puuid, {
      playerId: player.puuid,
      mmr: Number(user?.mmr ?? 1000),
      win: Number(user?.win ?? 0),
      lose: Number(user?.lose ?? 0),
    });
  });

  const blueWon = Boolean(match.blueTeam.players[0]?.result);
  const ratingAdjustments = blueWon
    ? buildMatchmakingAdjustments({
        winningTeam: match.blueTeam.players.map((player) =>
          ratingInputsByPuuid.get(player.puuid)
        ),
        losingTeam: match.purpleTeam.players.map((player) =>
          ratingInputsByPuuid.get(player.puuid)
        ),
      })
    : buildMatchmakingAdjustments({
        winningTeam: match.purpleTeam.players.map((player) =>
          ratingInputsByPuuid.get(player.puuid)
        ),
        losingTeam: match.blueTeam.players.map((player) =>
          ratingInputsByPuuid.get(player.puuid)
        ),
      });
  const deltaByPuuid = new Map(
    [...ratingAdjustments.winners, ...ratingAdjustments.losers].map((entry) => [
      entry.playerId,
      entry.delta,
    ])
  );

  const notRegistUser = [];

  for await (const p of players) {
    const user = linkedByPuuid.get(p.puuid);
    if (!user) {
      notRegistUser.push(p.playerName);
      continue;
    }

    let mmr = Number(user.mmr) + Number(deltaByPuuid.get(p.puuid) ?? 0);
    if (mmr <= 300) {
      mmr = 300;
    }

    const win = Number(user.win) + (p.result ? 1 : 0);
    const lose = Number(user.lose) + (p.result ? 0 : 1);
    const penta = Number(user.penta) + p.pentaKill;
    const quadra = Number(user.quadra) + p.quadraKill;

    const champions = user.champions === "" ? {} : JSON.parse(user.champions);
    const lanes = user.lanes === "" ? {} : JSON.parse(user.lanes);
    const friends = user.friends === "" ? {} : JSON.parse(user.friends);

    if (!champions[p.championName]) {
      champions[p.championName] = {
        kills: 0,
        deaths: 0,
        assist: 0,
        win: 0,
        lose: 0,
      };
    }
    champions[p.championName].kills += p.kda.kills;
    champions[p.championName].deaths += p.kda.deaths;
    champions[p.championName].assist += p.kda.assist;
    champions[p.championName].win += p.result ? 1 : 0;
    champions[p.championName].lose += p.result ? 0 : 1;

    if (!lanes[p.lane]) {
      lanes[p.lane] = {
        win: 0,
        lose: 0,
      };
    }
    lanes[p.lane].win += p.result ? 1 : 0;
    lanes[p.lane].lose += p.result ? 0 : 1;

    for (const pp of players) {
      if (pp === p || pp.win !== p.win) {
        continue;
      }

      if (!friends[pp.playerName]) {
        friends[pp.playerName] = { win: 0, lose: 0 };
      }

      friends[pp.playerName].win += p.result ? 1 : 0;
      friends[pp.playerName].lose += p.result ? 0 : 1;
    }

    const tKill = Number(user.t_kill) + p.kda.kills;
    const tDeath = Number(user.t_death) + p.kda.deaths;
    const tAssist = Number(user.t_assist) + p.kda.assist;
    const teamTotalKill = p.team === match.blueTeam.side
      ? match.blueTeam.totalKill
      : match.purpleTeam.totalKill;
    const safeTeamTotalKill = teamTotalKill > 0 ? teamTotalKill : 1;
    const tKillRate =
      Number(user.t_kill_rate) +
      Math.floor(((p.kda.kills + p.kda.assist) / safeTeamTotalKill) * 100);

    await executor.query(updateSql, [
      mmr,
      win,
      lose,
      penta,
      quadra,
      JSON.stringify(champions),
      JSON.stringify(lanes),
      JSON.stringify(friends),
      tKill,
      tDeath,
      tAssist,
      tKillRate,
      user.discord_id,
    ]);
  }

  return { success: true, user: [...new Set(notRegistUser)] };
}

const persistMatchResult = async (guildId, match, name) => {
  let connection;

  try {
    const canonicalGameId = match?.matchId ?? name;
    const promisePool = await getGuildPromisePool(guildId);
    connection =
      typeof promisePool.getConnection === "function"
        ? await promisePool.getConnection()
        : null;
    const executor = connection ?? promisePool;

    if (typeof executor.beginTransaction === "function") {
      await executor.beginTransaction();
    }

    const insertResult = await insertMatchDataWithExecutor(
      executor,
      match,
      canonicalGameId
    );
    if (!insertResult.success) {
      if (insertResult.msg === "이미 데이터에 존재하는 경기입니다.") {
        if (typeof executor.commit === "function") {
          await executor.commit();
        }

        return { success: true, alreadyProcessed: true, user: [] };
      }

      if (typeof executor.rollback === "function") {
        await executor.rollback();
      }

      return insertResult;
    }

    const updateResult = await updateUserDataWithExecutor(executor, match);
    if (!updateResult.success) {
      if (typeof executor.rollback === "function") {
        await executor.rollback();
      }

      return updateResult;
    }

    if (typeof executor.commit === "function") {
      await executor.commit();
    }

    return { success: true, user: updateResult.user ?? [] };
  } catch (error) {
    if (connection && typeof connection.rollback === "function") {
      await connection.rollback();
    }

    return buildErrorResult(
      error,
      "경기 결과를 저장하는 중 예기치 못한 오류가 발생하였습니다."
    );
  } finally {
    if (connection && typeof connection.release === "function") {
      connection.release();
    }
  }
};

const getRankData = async (guildId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const sql = `SELECT discord_id, name FROM user ORDER BY mmr DESC, name ASC`;
    const [result] = await promisePool.query(sql);

    return { success: true, data: result };
  } catch (error) {
    return buildErrorResult(error, "랭킹을 불러오는 중 오류가 발생했습니다.");
  }
};

const getUsersData = async (guildId, ids) => {
  if (!ids.length) {
    return { success: true, data: [] };
  }

  try {
    const promisePool = await getGuildPromisePool(guildId);
    const sql = buildGetUsersDataSql(ids);
    const [result] = await promisePool.query(sql, ids);

    return { success: true, data: result };
  } catch (error) {
    return buildErrorResult(error, "유저 데이터를 불러오는 중 오류가 발생했습니다.");
  }
};

const getUserData = async (guildId, id) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const sql = `SELECT * FROM user where discord_id = ?`;
    const [result] = await promisePool.query(sql, [id]);

    return { success: true, data: result };
  } catch (error) {
    return buildErrorResult(error, "유저 데이터를 불러오는 중 오류가 발생했습니다.");
  }
};

const getLatestMatched = async (guildId, id) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const sql = `SELECT DISTINCT matches.* FROM matches
    JOIN (
        SELECT match_id
        FROM match_in_users
        WHERE user_id = ?
        ORDER BY match_id DESC
        LIMIT 3
    ) recent_matches
    ON matches.id = recent_matches.match_id`;

    const [result] = await promisePool.query(sql, [id]);
    const linkedIdentities = await getLinkedMatchIdentitiesForUser(promisePool, id);
    const annotatedMatches = result.map((matchRow) => ({
      ...matchRow,
      ...buildPerspectiveResultMetadata(matchRow, linkedIdentities),
    }));

    return { success: true, data: annotatedMatches };
  } catch (error) {
    return buildErrorResult(error, "전적을 불러오는 중 오류가 발생했습니다.");
  }
};

const getPublicSiteSummary = async (guildId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [rows] = await promisePool.query(buildPublicSummarySql());

    return {
      success: true,
      data: rows[0] ?? {
        total_matches: 0,
        total_players: 0,
        top_mmr: 0,
        top_win_rate: 0,
      },
    };
  } catch (error) {
    return buildErrorResult(error, "공개 전적 요약을 불러오는 중 오류가 발생했습니다.");
  }
};

const getPublicPlayerProfile = async (guildId, discordId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [rows] = await promisePool.query(
      `SELECT * FROM user WHERE discord_id = ? LIMIT 1`,
      [discordId]
    );

    if (!rows.length) {
      return {
        success: false,
        code: "PLAYER_NOT_FOUND",
        msg: "등록된 플레이어를 찾을 수 없습니다.",
      };
    }

    const [riotAccountRows] = await promisePool.query(
      `
        SELECT riot_game_name, riot_tag_line, is_primary
        FROM riot_accounts
        WHERE discord_id = ?
        ORDER BY is_primary DESC, created_at ASC, riot_game_name ASC, riot_tag_line ASC
      `,
      [discordId]
    );

    return {
      success: true,
      data: {
        ...rows[0],
        riotAccounts: riotAccountRows.map((row) => ({
          riotGameName: row.riot_game_name,
          riotTagLine: row.riot_tag_line,
          displayName: `${row.riot_game_name}#${row.riot_tag_line}`,
          isPrimary: Number(row.is_primary) === 1,
        })),
      },
    };
  } catch (error) {
    return buildErrorResult(
      error,
      "플레이어 공개 프로필을 불러오는 중 오류가 발생했습니다."
    );
  }
};

const getPublicLeaderboard = async (guildId, limit) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const hasLimit = Number.isFinite(limit);
    const [rows] = await promisePool.query(
      buildPublicLeaderboardSql(limit),
      hasLimit ? [limit] : []
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    return buildErrorResult(error, "공개 랭킹을 불러오는 중 오류가 발생했습니다.");
  }
};

const getPublicMatchHistory = async (guildId, limit) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const hasLimit = Number.isFinite(limit);
    const [rows] = await promisePool.query(
      buildPublicMatchHistorySql(limit),
      hasLimit ? [limit] : []
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    return buildErrorResult(error, "공개 경기 목록을 불러오는 중 오류가 발생했습니다.");
  }
};

const getPublicMatchById = async (guildId, matchId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [rows] = await promisePool.query(buildPublicMatchByIdSql(), [matchId]);

    if (!rows.length) {
      return {
        success: false,
        code: "MATCH_NOT_FOUND",
        msg: "등록된 경기를 찾을 수 없습니다.",
      };
    }

    return {
      success: true,
      data: rows[0],
    };
  } catch (error) {
    return buildErrorResult(error, "공개 경기 상세를 불러오는 중 오류가 발생했습니다.");
  }
};

const searchPublicPlayers = async (guildId, term) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [rows] = await promisePool.query(buildPublicPlayerSearchSql(), [
      `%${term}%`,
    ]);

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    return buildErrorResult(error, "플레이어 검색 중 오류가 발생했습니다.");
  }
};

function parseDiscordIdList(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function parseFearlessChampionList(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map((value) => String(value ?? "").trim())
          .filter((value) => value.length > 0)
      : [];
  } catch (error) {
    return [];
  }
}

function mapTournamentSessionRow(guildId, row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    guildId,
    tournamentCode: row.tournament_code,
    providerId: row.provider_id,
    tournamentId: row.tournament_id,
    sourceChannelId: row.source_channel_id,
    team1ChannelId: row.team1_channel_id,
    team2ChannelId: row.team2_channel_id,
    unityVoiceChannelId: row.unity_voice_channel_id,
    team1DiscordIds: parseDiscordIdList(row.team1_discord_ids),
    team2DiscordIds: parseDiscordIdList(row.team2_discord_ids),
    status: row.status,
    lastEventAt: row.last_event_at,
    resultStatus: row.result_status,
    resultGameId: row.result_game_id,
    resultPayload: row.result_payload,
    resultAttempts: row.result_attempts,
    resultError: row.result_error,
    seriesMode: row.series_mode ?? "STANDARD",
    seriesGameNumber: Number(row.series_game_number ?? 1),
    fearlessUsedChampions: parseFearlessChampionList(
      row.fearless_used_champions
    ),
  };
}

const getLatestTournamentSession = async (guildId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [rows] = await promisePool.query(
      `SELECT *
       FROM active_tournament_sessions
       ORDER BY id DESC
       LIMIT 1`
    );

    return {
      success: true,
      data: rows.length ? mapTournamentSessionRow(guildId, rows[0]) : null,
    };
  } catch (error) {
    return buildErrorResult(
      error,
      "가장 최근 토너먼트 세션을 불러오는 중 오류가 발생했습니다."
    );
  }
};

const replaceActiveTournamentSession = async (guildId, session) => {
  try {
    const validationError = validateTournamentSession(session);
    if (validationError) {
      return validationError;
    }

    const promisePool = await getGuildPromisePool(guildId);

    await promisePool.query(
      `UPDATE active_tournament_sessions
       SET status = 'CANCELLED'
       WHERE status IN ('LOBBY', 'CHAMP_SELECT_STARTED')`
    );

    const [result] = await promisePool.query(
      `INSERT INTO active_tournament_sessions
       (tournament_code, provider_id, tournament_id, source_channel_id, team1_channel_id, team2_channel_id, unity_voice_channel_id, team1_discord_ids, team2_discord_ids, status, last_event_at, series_mode, series_game_number, fearless_used_champions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.tournamentCode,
        session.providerId ?? null,
        session.tournamentId ?? null,
        session.sourceChannelId,
        session.team1ChannelId,
        session.team2ChannelId,
        session.unityVoiceChannelId,
        JSON.stringify(session.team1DiscordIds ?? []),
        JSON.stringify(session.team2DiscordIds ?? []),
        session.status ?? "LOBBY",
        session.lastEventAt ?? null,
        session.seriesMode ?? "STANDARD",
        Number(session.seriesGameNumber ?? 1),
        JSON.stringify(session.fearlessUsedChampions ?? []),
      ]
    );

    return { success: true, data: { id: result.insertId } };
  } catch (error) {
    return buildErrorResult(error, "토너먼트 세션을 저장하는 중 오류가 발생했습니다.");
  }
};

const listPendingTournamentSessions = async (guildId) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [rows] = await promisePool.query(
      `SELECT *
       FROM active_tournament_sessions
       WHERE status IN ('LOBBY', 'CHAMP_SELECT_STARTED', 'MOVE_FAILED', 'COMPLETED_PENDING_GATHER', 'GATHER_FAILED', 'COMPLETED')
         AND (status <> 'COMPLETED' OR result_status IN ('PENDING', 'FAILED'))
       ORDER BY id ASC`
    );

    return {
      success: true,
      data: rows.map((row) => mapTournamentSessionRow(guildId, row)),
    };
  } catch (error) {
    return buildErrorResult(error, "활성 토너먼트 세션을 불러오는 중 오류가 발생했습니다.");
  }
};

const updateTournamentSessionStatus = async (
  guildId,
  sessionId,
  status,
  lastEventAt = null
) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    await promisePool.query(
      `UPDATE active_tournament_sessions
       SET status = ?, last_event_at = ?
       WHERE id = ?`,
      [status, lastEventAt, sessionId]
    );

    return { success: true };
  } catch (error) {
    return buildErrorResult(error, "토너먼트 세션 상태를 갱신하는 중 오류가 발생했습니다.");
  }
};

const markTournamentSessionCompletedPendingGather = async (
  guildId,
  tournamentCode,
  callbackPayload
) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [sessions] = await promisePool.query(
      `SELECT id, status
       FROM active_tournament_sessions
       WHERE tournament_code = ?
       LIMIT 1`,
      [tournamentCode]
    );

    if (sessions.length === 0) {
      return {
        success: false,
        msg: "매칭되는 활성 토너먼트 세션이 없습니다.",
      };
    }

    if (
      sessions[0].status === "COMPLETED_PENDING_GATHER" ||
      sessions[0].status === "COMPLETED"
    ) {
      return {
        success: true,
        data: {
          affectedRows: 0,
          alreadyHandled: true,
        },
      };
    }

    const callbackTimestamp = String(
      callbackPayload?.startTime ??
        callbackPayload?.eventTime ??
        Date.now()
    );
    const [result] = await promisePool.query(
      `UPDATE active_tournament_sessions
       SET status = 'COMPLETED_PENDING_GATHER', last_event_at = ?
       WHERE tournament_code = ?
         AND status IN ('LOBBY', 'CHAMP_SELECT_STARTED', 'MOVED', 'MOVE_FAILED', 'GATHER_FAILED')`,
      [callbackTimestamp, tournamentCode]
    );

    return {
      success: result.affectedRows > 0,
      data: {
        affectedRows: result.affectedRows,
      },
      msg:
        result.affectedRows > 0
          ? undefined
          : "매칭되는 활성 토너먼트 세션이 없습니다.",
    };
  } catch (error) {
    return buildErrorResult(
      error,
      "토너먼트 완료 상태를 기록하는 중 오류가 발생했습니다."
    );
  }
};

const markTournamentSessionResultPending = async (
  guildId,
  tournamentCode,
  callbackPayload
) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    const [result] = await promisePool.query(
      `UPDATE active_tournament_sessions
       SET result_status = 'PENDING',
           result_game_id = ?,
           result_payload = ?,
           result_attempts = 0,
           result_error = NULL
       WHERE tournament_code = ?`,
      [
        String(callbackPayload?.gameId ?? ""),
        JSON.stringify(callbackPayload ?? {}),
        tournamentCode,
      ]
    );

    return {
      success: result.affectedRows > 0,
      msg:
        result.affectedRows > 0
          ? undefined
          : "매칭되는 활성 토너먼트 세션이 없습니다.",
    };
  } catch (error) {
    return buildErrorResult(
      error,
      "토너먼트 결과 수집 대기 상태를 기록하는 중 오류가 발생했습니다."
    );
  }
};

const updateTournamentSessionResult = async (guildId, sessionId, updates) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    await promisePool.query(
      `UPDATE active_tournament_sessions
       SET result_status = ?, result_attempts = ?, result_error = ?
       WHERE id = ?`,
      [
        updates.status,
        updates.attempts ?? 0,
        updates.error ?? null,
        sessionId,
      ]
    );

    return { success: true };
  } catch (error) {
    return buildErrorResult(
      error,
      "토너먼트 결과 상태를 갱신하는 중 오류가 발생했습니다."
    );
  }
};

const updateTournamentSessionFearlessState = async (
  guildId,
  sessionId,
  updates
) => {
  try {
    const promisePool = await getGuildPromisePool(guildId);
    await promisePool.query(
      `UPDATE active_tournament_sessions
       SET fearless_used_champions = ?
       WHERE id = ?`,
      [
        JSON.stringify(updates.fearlessUsedChampions ?? JSON.parse(EMPTY_JSON_ARRAY)),
        sessionId,
      ]
    );

    return { success: true };
  } catch (error) {
    return buildErrorResult(
      error,
      "하드 피어리스 챔피언 상태를 갱신하는 중 오류가 발생했습니다."
    );
  }
};

module.exports = {
  buildPublicLeaderboardSql,
  buildPublicMatchByIdSql,
  buildPublicMatchHistorySql,
  buildPublicPlayerSearchSql,
  buildPublicSummarySql,
  buildGetUsersDataSql,
  getPublicLeaderboard,
  getPublicMatchById,
  getPublicMatchHistory,
  getPublicPlayerProfile,
  getPublicSiteSummary,
  getLatestMatched,
  getLatestTournamentSession,
  getRankData,
  getUserData,
  getUsersData,
  insertMatchData,
  listPendingTournamentSessions,
  parseDiscordIdList,
  persistMatchResult,
  registerRiotAccount,
  registraion,
  searchPublicPlayers,
  setPrimaryRiotAccount,
  listRefreshableRiotAccounts,
  markTournamentSessionCompletedPendingGather,
  markTournamentSessionResultPending,
  replaceActiveTournamentSession,
  resolveUsersByPuuids,
  syncRepresentativeRiotName,
  updateTournamentSessionStatus,
  updateTournamentSessionResult,
  updateTournamentSessionFearlessState,
  updateRiotAccountDisplayName,
  updateUserData,
};
