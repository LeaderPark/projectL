# OP Score 레퍼런스 데이터셋 (PS Score 매칭용)

`scripts/Riot/MatchTransformer.js`의 `calculatePerformanceScore`(= 사이트의 OP Score)를
lol.ps **PS Score**에 맞춰 튜닝하기 위한 레퍼런스 데이터입니다. 모델을 다시 적합(refit)하거나
검증할 때 계속 사용합니다.

- **데이터 파일**: [`op-score-dataset.json`](./op-score-dataset.json) — 경기별·플레이어별 리플레이 파싱 스탯 + PS Score 라벨
- **PS Score 스케일**: lol.ps 정수 점수, 약 0~150 (MVP ~100+, 완벽 캐리 140대, ACE = 패배팀 1위)

## 출처
| 소환사 | 경기 수 | 티어 | PS 출처 |
|---|---|---|---|
| `Hide on bush_KR1` | 10 | Challenger | lol.ps 스크린샷 판독(검증 완료) |
| `대상혁_2005` | 7 | Silver~Gold | lol.ps 텍스트(챔피언/KDA 매칭, 검증) |
| `수영장파티티모#KR2` | 20 | Bronze | lol.ps 텍스트(KDA 매칭, 200/200 검증) |
| `Bluffing#1207` | 19 | Challenger | lol.ps 텍스트(KDA 매칭, 190/190 검증) |

> 현재 **56경기 / 560명** 전원 PS Score가 채워져 있습니다(`null` 없음). Iron~Challenger 4명 커버.
> (Bluffing의 15:14 1경기는 리플레이 파일이 없어 제외.)

> lol.ps는 SPA(자바스크립트 렌더)라 웹에서 PS Score를 자동으로 긁어올 수 없고, PS Score는
> lol.ps 독자 지표라 Riot 공식 API에도 없습니다. 그래서 PS 값은 **스크린샷 또는 텍스트 붙여넣기**로 받아야 합니다.

## 플레이어 행 스키마 (`games[].players[]`)
| 필드 | 의미 |
|---|---|
| `champion` | 챔피언(영문 내부명) |
| `name` | 라이엇 닉네임#태그 |
| `team` | 100(블루) / 200(레드) |
| `win` | 1(승) / 0(패) |
| `k`,`d`,`a` | 킬/데스/어시스트 |
| `cs` | 미니언+정글 처치 |
| `vision` | 시야 점수 |
| `gold` | 획득 골드 |
| `dmgDealt` | 챔피언에게 가한 피해 |
| `dmgTaken` | 받은 피해 |
| `psScore` | lol.ps PS Score (없으면 `null` = 대기) |
| `isOwner` | 해당 리플레이 소유 소환사 여부 |

플레이어 순서: 각 경기 블루팀(100) 5명 → 레드팀(200) 5명. (신규 배치는 팀 순서만 보장)

## 현재 배포 모델 (v3) · 56경기 일반화 검증
`scripts/Riot/MatchTransformer.js`의 `calculatePerformanceScore`에 적용된 계수입니다.
```
OP = -18.021 + 5.326·KDA비 + 0.01915·(딜/분) + 0.09791·(골드/분)
   + 2.192·(시야/분) - 1.297·(CS/분) + 4.053·승리     → 1 이상 정수
```
- **KDA비** = (킬+어시) / max(데스, 1). **CS/분**은 음(−) 계수(골드 통제 시 낮은 CS = 킬·오브젝트 수입 = 임팩트↑).

v3는 옛 17경기(2명)로 적합됐습니다. 신규 2명에 대한 **일반화 성능**:

| 평가셋 | Pearson | MAE |
|---|---|---|
| 옛 17경기(학습셋) | 0.939 | 7.29 |
| 수영장파티티모 20 (Bronze, 신규) | 0.925 | 8.47 |
| Bluffing 19 (Challenger, 신규) | 0.918 | 8.45 |
| **전체 56경기** | 0.923 | 8.11 |

→ 새 플레이어에선 MAE가 ~8.5로 올라감(실제 유저 기반에 가까운 값). 데이터가 4명/전 티어로 늘었으니 재적합 가치가 큼.

## 재적합 후보 (56경기, leave-one-game-out CV)
| 모델 | 피처 | CV Pearson | CV MAE | PS≥100 구간 MAE |
|---|---|---|---|---|
| v3 재적합 | 6 (현행) | 0.924 | 8.25 | 17.14 |
| v4a | +데스/분 | 0.929 | 8.20 | 16.01 |
| **v4b (권장)** | +데스/분 +받은피해/분 | **0.932** | **7.94** | **15.95** |

- **데스/분**: KDA 비율이 상단에서 포화돼 엘리트 캐리를 못 가르는 문제를 보완(큰 음수 계수).
- **받은피해/분**: 탱커·서폿의 전방 기여 포착. 둘 다 `dmgTaken`은 이미 파싱되지만 현재 Player VO엔 미노출.
- PS≥100(캐리) 구간은 여전히 MAE ~16 — 종료 시점 집계 지표 + 선형 모델의 한계. 더 낮추려면 타임라인 지표(분당 골드/경험치 리드, 킬관여%) 또는 비선형이 필요.

> v2 계수(참고): `-21.32 + 5.19·KDA + 0.0238·딜/분 + 0.0646·골드/분 + 4.60·시야/분 + 4.45·승리`.

## 데이터 추가 방법 (계속 쓰기 위해)
1. 새 `.rofl`을 폴더에 두고, 각 경기의 lol.ps PS Score를 텍스트/스크린샷으로 제공.
2. 리플레이 파싱 → 챔피언·KDA로 PS 매칭 → `op-score-dataset.json`에 경기 추가.
3. 위 검증 스니펫(아래)으로 Pearson/MAE를 다시 확인하고, 필요하면 `PERF_COEFFS`를 재적합(v4).
4. 경기가 충분히 모이면(예: 30~50경기) 역할 지표(힐량·CC·받은피해)를 추가하고 라인별 보정/비선형을 검토.

## 재검증 스니펫
```bash
node -e "
const d = require('./docs/op-score-dataset.json');
const C = { intercept:-18.021, kda:5.326, damagePerMin:0.01915, goldPerMin:0.09791, visionPerMin:2.192, csPerMin:-1.297, win:4.053 };
const pred=(p,m)=>C.intercept+C.kda*((p.k+p.a)/Math.max(p.d,1))+C.damagePerMin*(p.dmgDealt/m)+C.goldPerMin*(p.gold/m)+C.visionPerMin*(p.vision/m)+C.csPerMin*(p.cs/m)+C.win*(p.win?1:0);
let xs=[],ys=[],ae=0,n=0;
for(const g of d.games)for(const p of g.players){const yp=pred(p,g.gameLengthMin);xs.push(yp);ys.push(p.psScore);ae+=Math.abs(yp-p.psScore);n++;}
const m=a=>a.reduce((s,x)=>s+x,0)/a.length,ma=m(xs),mb=m(ys);
let num=0,da=0,db=0;for(let i=0;i<n;i++){num+=(xs[i]-ma)*(ys[i]-mb);da+=(xs[i]-ma)**2;db+=(ys[i]-mb)**2;}
console.log('Pearson',(num/Math.sqrt(da*db)).toFixed(4),'MAE',(ae/n).toFixed(3),'n',n);
"
```
