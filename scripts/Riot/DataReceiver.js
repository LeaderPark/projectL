const axios = require("axios");
const { getRuntimeConfig } = require("../../config/runtime");

const runtimeConfig = getRuntimeConfig();

// Pass the Riot API key via the X-Riot-Token header (like TournamentApi) instead
// of a ?api_key= query string, so the secret does not leak into URLs/logs.
const RIOT_AUTH = { headers: { "X-Riot-Token": runtimeConfig.riot.token } };

const getSummonerData = async (summonerName, summonerTag) => {
  try {
    const encodedName = encodeURIComponent(summonerName);
    const encodedTag = encodeURIComponent(summonerTag);
    const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`;
    const accountRes = await axios.get(accountUrl, RIOT_AUTH);
    const summonerUrl = `https://${runtimeConfig.riot.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(
      accountRes.data.puuid
    )}`;
    const summonerRes = await axios.get(summonerUrl, RIOT_AUTH);

    return {
      account: accountRes.data,
      summoner: summonerRes.data,
    };
  } catch (e) {
    return null;
  }
};

const getRiotAccountByPuuid = async (puuid) => {
  try {
    const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(
      puuid
    )}`;
    const accountRes = await axios.get(accountUrl, RIOT_AUTH);

    return {
      success: true,
      data: accountRes.data,
    };
  } catch (e) {
    return {
      success: false,
      msg: e?.message ?? "라이엇 계정 정보를 불러오지 못했습니다.",
    };
  }
};

module.exports = {
  getRiotAccountByPuuid,
  getSummonerData,
};
