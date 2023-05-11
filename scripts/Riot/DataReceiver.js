const axios = require("axios");
const { riot_token } = require("../../config.json");

const ddragonApi = axios.create({
  baseURL:
    "http://ddragon.leagueoflegends.com/cdn/10.11.1/data/ko_KR/champion.json",
});

const item = axios.create({
  baseURL: "http://ddragon.leagueoflegends.com/cdn/13.8.1/data/ko_KR/item.json",
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

const getSummonerData = async (summonerName) => {
  try {
    const reqUrl = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riot_token}`;
    const res = await axios.get(reqUrl);

    return res;
  } catch (e) {
    return null;
  }
};

// OLD
// const getChampionData = async (name) => {
//   try {
//     const reqUrl = `http://ddragon.leagueoflegends.com/cdn/13.9.1/data/ko_KR/champion/${championName[name]}.json`;
//     const res = await axios.get(reqUrl);

//     console.log(Object.values(res.data.data)[0].spells);
//   } catch (e) {
//     // return null;
//     console.log(e);
//   }
// };

module.exports = {
  getSummonerData,
};
