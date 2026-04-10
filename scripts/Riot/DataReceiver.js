const axios = require("axios");
const { getRuntimeConfig } = require("../../config/runtime");

const runtimeConfig = getRuntimeConfig();

const ddragonApi = axios.create({
  baseURL:
    "https://ddragon.leagueoflegends.com/cdn/10.11.1/data/ko_KR/champion.json",
});

const item = axios.create({
  baseURL: "https://ddragon.leagueoflegends.com/cdn/13.8.1/data/ko_KR/item.json",
});
// http://ddragon.leagueoflegends.com/cdn/13.8.1/img/champion/{name}.png -챔피언 프로필
// http://ddragon.leagueoflegends.com/cdn/13.8.1/img/item/{itemKey}.png -아이템

/*
http://ddragon.leagueoflegends.com/cdn/13.8.1/data/ko_KR/summoner.json
http://ddragon.leagueoflegends.com/cdn/13.8.1/img/spell/SummonerFlash.png
 */
const setChampionData = async () => {
  const championRes = await ddragonApi.get();
  const itemRes = await item.get();

  const championData = championRes.data.data;
  const itemData = itemRes.data.data;
  //   console.log(championData);
};
setChampionData();

// const getSummonerData = async (summonerName) => {
//   try {
//     const reqUrl = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riot_token}`;
//     const res = await axios.get(reqUrl);

//     return res;
//   } catch (e) {
//     return null;
//   }
// };

const getSummonerData = async (summonerName, summonerTag) => {
  try {
    const encodedName = encodeURIComponent(summonerName);
    const encodedTag = encodeURIComponent(summonerTag);
    const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}?api_key=${runtimeConfig.riot.token}`;
    const accountRes = await axios.get(accountUrl);
    const summonerUrl = `https://${runtimeConfig.riot.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(
      accountRes.data.puuid
    )}?api_key=${runtimeConfig.riot.token}`;
    const summonerRes = await axios.get(summonerUrl);

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
    )}?api_key=${runtimeConfig.riot.token}`;
    const accountRes = await axios.get(accountUrl);

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
