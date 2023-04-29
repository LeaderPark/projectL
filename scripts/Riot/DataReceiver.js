const axios = require("axios");

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
  console.log(itemData);
};
setChampionData();
