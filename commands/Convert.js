function calculateLoLScore(playerData) {
  // 기본 가중치 설정
  const weights = {
    kills: 0.3,
    deaths: -0.4, // 사망 수에 대해 더 큰 패널티 적용
    assists: 0.2,
    damageDealt: 0.1,
    goldEarned: 0.1,
    wardsPlaced: 0.05,
  };

  // 각 항목의 최대 기대치 설정
  const maxValues = {
    kills: 20,
    deaths: 10, // 사망은 더 적을수록 좋으므로 기대치를 낮게 설정
    assists: 20,
    damageDealt: 50000,
    goldEarned: 20000,
    wardsPlaced: 15,
  };

  const valuePerMin = {
    kills: 1,
    deaths: 0.5,
    assists: 0.5,
    damageDealt: 1000,
    vision_socre: 3,
  };

  let score =
    ((playerData.kills / maxValues.kills) * weights.kills +
      (Math.max(0, maxValues.deaths - playerData.deaths) / maxValues.deaths) *
        weights.deaths +
      (playerData.assists / maxValues.assists) * weights.assists +
      (playerData.damageDealt / maxValues.damageDealt) * weights.damageDealt +
      (playerData.goldEarned / maxValues.goldEarned) * weights.goldEarned +
      (playerData.wardsPlaced / maxValues.wardsPlaced) * weights.wardsPlaced) *
    100;

  // 점수를 0과 100 사이로 조정
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}

// 예시 데이터
const playerData = {
  kills: 10,
  deaths: 2,
  assists: 5,
  damageDealt: 30000,
  goldEarned: 15000,
  wardsPlaced: 10,
};

console.log(calculateLoLScore(playerData));
