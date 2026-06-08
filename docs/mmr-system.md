# MMR 산출 방식 (성과 가중 Elo)

내전 MMR은 **Elo**를 기반으로 하되, 팀의 변동폭을 **OP Score(성과)** 로 팀 내에서 재분배합니다.
코드: `scripts/Utils/MatchmakingRating.js`, 적용: `scripts/Utils/Query.js`의 `updateUserData`.

## 공식

```
E_team   = 1 / (1 + 10^((상대팀평균MMR − 우리팀평균MMR)/400))   # 기대 승률
base_i   = K_i × (결과 − E_team)                               # 결과: 승1 / 패0
w_i      = clamp(1 + dir·s·(OP_i − 팀평균OP)/팀평균OP, 0.7, 1.3)  # dir: 승 +1 / 패 −1
w_i      = w_i / 팀평균(w)                                      # 팀 평균=1로 정규화
ΔMMR_i   = round(base_i × w_i)        # mmr += Δ, 하한 300
```

- **K-factor**: 10판 미만 48, 30판 미만 36, 이상 24.
- 파라미터(`PERF_WEIGHT`): 민감도 `s=0.5`, 클램프 `[0.7, 1.3]`.

## 설계 원칙

- **부호는 승패가 결정**(가중치는 항상 양수): 이긴 사람은 절대 MMR이 깎이지 않음.
- **크기는 상대 팀 실력(Elo)이 결정**: 강팀을 이기면 더 받고, 약팀에게 지면 더 잃음.
- **OP는 팀 *내부* 재분배만**: 캐리는 더(+)/덜(−), 무임승차·트롤은 반대. OP에 이미 승리 보너스가 포함돼 있어 **팀 내 상대값**만 사용(승리 이중계산 방지).
- **총량 보존**: 팀 가중치 평균을 1로 정규화 → 팀 전체 MMR 변동량은 기존 Elo와 동일(인플레이션 없음).
- **하위 호환**: OP가 없으면 가중치 전부 1 → 순수 Elo와 동일.

예시(짝팀, K=24, 기본 ±12): 같은 승리팀에서 OP가 높은 캐리는 +16, 무임승차는 +8, 팀 합계는 +60 그대로.

## 패배팀은 변동 차등이 작다 (의도된 동작)

패배팀은 팀 내 OP 분산이 승리팀의 ~절반(73경기 레퍼런스: 승 std 23.8 vs 패 12.6)입니다. 이는 PS Score의 고유
성질(다 같이 졌으면 기여 차이가 작음)이라 OP가 그대로 재현합니다. 그래도 패배팀 ACE는 의미 있게 덜 깎입니다.
패배팀 차등을 더 키우려면 `direction === -1`일 때 클램프 폭만 따로 넓히면 됩니다.

## 재계산 (모델 변경 후)

- 매치 저장 시 OP(`performanceScore`)가 같이 저장되므로, MMR은 그 값을 가중치로 사용합니다.
- **전체 재계산**: `Query.recomputeGuildUserStats(guildId)` — 모든 저장 매치를 `id`(시간) 순으로 다시 재생.
  매치 삭제(`/매치삭제`) 후에도 같은 경로로 자동 재계산되어 항상 일관됩니다.

```bash
# 컨테이너에서 1회성 재계산
docker compose exec -T bot node -e "require('./scripts/Utils/Query').recomputeGuildUserStats('<GUILD_ID>').then(r=>console.log(JSON.stringify(r)))"
```

## OP Score와의 관계

- OP Score = 경기당 성과(≈ lol.ps PS Score, v5 ~0.95 일치). 누적 아님. 자세한 건 [`op-score-dataset.md`](./op-score-dataset.md).
- MMR = 누적 실력. OP는 MMR 갱신의 **가중치 입력**이지 MMR 그 자체가 아님.

> 주의(레거시): `gold`·`damageTaken` 필드가 생기기 전 저장된 매치는 v5 OP 재계산이 불가하여(원본 리플레이 필요),
> 재계산 시 **저장돼 있던 구모델 OP**를 가중치로 사용합니다. 이후 저장되는 매치는 v5 OP가 자동 적용됩니다.
