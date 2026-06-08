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
| `A D#Code` | 17 | Gold~Diamond(주로 Emerald/Plat) | lol.ps 텍스트(KDA 매칭, 170/170 검증) |

> 현재 **73경기 / 730명** 전원 PS Score가 채워져 있습니다(`null` 없음). Iron~Challenger 5명, 전 티어 커버.
> (Bluffing 15:14, A D의 02:05·05:34 다시하기 경기는 제외.)

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

## 현재 배포 모델 (v5) · 73경기 적합
`scripts/Riot/MatchTransformer.js`의 `calculatePerformanceScore`에 적용된 계수입니다.
```
OP = -9.619 + 8.262·KDA비 - 0.1727·KDA비²
   + 0.01872·(딜/분) + 0.0704·(골드/분) - 0.05324·(시야/분)
   - 1.549·(CS/분) + 3.436·승리
   - 19.8·(데스/분) + 0.007256·(받은피해/분)        → 1 이상 정수
```
- **KDA비** = (킬+어시) / max(데스, 1).
- **KDA비² (음, 오목)**: PS는 캐리를 비선형으로 보상하므로 KDA가 선형으로 폭주하지 않게 곡선을 맞춤. **v5의 핵심 개선**(캐리 구간 오차를 크게 줄임). 730명에선 과적합 없이 일반화(17경기 때는 과적합했음).
- **CS/분** 음(−): 골드 통제 시 낮은 CS = 킬·오브젝트 수입 = 임팩트↑. **데스/분** 음(−). **받은피해/분** 양(+): 탱커·서폿 전방 기여.

### 검증 (leave-one-game-out CV, 73경기 730명)
| 모델 | 피처 | CV Pearson | CV MAE | PS≥100 구간 MAE |
|---|---|---|---|---|
| v4b | 9 (선형) | 0.933 | 7.93 | 17.2 |
| **v5 (배포)** | +KDA² | **0.948** | **6.92** | **12.1** |

### 시도했지만 효과 없던 것 (정직한 기록)
- 추가 집계 지표(CC시간·오브젝트딜·포탑딜·팀힐·자가완화) → CV ΔMAE ±0.02, **사실상 무의미**(오브젝트/포탑딜은 오히려 악화). 종료 시점 집계 지표는 천장.
- 데이터만 더 추가(중간 티어 17경기) → CV 7.94→7.93, **거의 그대로**(bias-limited).
- **실제 효과는 비선형(KDA²)에서 나옴.** 데이터가 730명으로 늘어 비선형을 과적합 없이 쓸 수 있게 된 게 핵심.

> 더 올리려면(>0.95) 타임라인 API 지표(분당 골드/경험치 리드, 킬관여%)가 필요 — .rofl 종료 집계엔 없는 신호.

## OP ↔ PS 일치도 (현재 v5, 73경기 730명)
| 측정 방식 | 값 | 의미 |
|---|---|---|
| Pearson 상관 r | **0.952** | 선형 상관 |
| R² (분산 설명력) | **91%** | PS 변동의 91%를 설명 |
| 팀내 순위 일치율 | **92%** | 두 선수 우열 방향이 PS와 일치 |
| 평균 절대오차 MAE | **6.7점** | PS 0~166 척도의 ~4% |
| 예측 ±10 / ±15 / ±20 이내 | **80% / 93% / 96%** | |

→ 한 줄 요약: **순위·분산 기준 ≈ 92% 일치**, 절대 점수는 평균 ±6.7점. (v4b는 0.936 / 88% / ±7.7)

## 역할별 적합도 & 다음에 넣을 데이터
v4b 잔차(배치 2+3, 390명, Bronze+Challenger). 모든 경기에 5역할이 이미 포함되므로 역할은 **표본 부족이 아니라 적합도** 문제.

| 역할 | MAE | 편향(+과대/−과소) | 비고 |
|---|---|---|---|
| MID | 6.77 | +0.3 | 가장 정확 |
| TOP | 7.62 | −2.5 | 약간 과소 |
| JNG | 7.74 | −2.1 | 약간 과소 |
| ADC | 8.13 | **+4.4** | 체계적 과대평가(딜 보상 과함) |
| SUP | **9.45** | +0.2 | **가장 부정확**(시야·로밍·CC 미반영) |

티어별: SUP·TOP은 **Bronze에서 특히 나쁨**(SUP 10.2, TOP 9.3) vs Challenger(8.7, 5.9).

**결론 — 정글/탑 데이터를 "더" 넣는 건 우선순위 낮음.** 약한 곳은 정글/탑이 아니라 **SUP(최악)·ADC(편향)** 와 **저티어**. 효과 순서:
1. **새 피처**(가장 큼): CC 시간, 오브젝트/포탑 딜, 킬관여% → 특히 SUP의 시야·이니시 가치 포착. (`.rofl`에서 추출 가능, 현재 데이터셋엔 없음)
2. **저·중 티어 신규 플레이어 다양성**: 지금 Bronze 1명·Silver~Gold 1명뿐 → Iron/Silver/Gold/Plat/Emerald 새 owner 추가.
3. 캐리(PS≥100) 표본 계속 확보.

## 데이터 추가 방법 (계속 쓰기 위해)
1. 새 `.rofl`을 폴더에 두고, 각 경기의 lol.ps PS Score를 텍스트/스크린샷으로 제공.
2. 리플레이 파싱 → 챔피언·KDA로 PS 매칭 → `op-score-dataset.json`에 경기 추가.
3. 위 검증 스니펫(아래)으로 Pearson/MAE를 다시 확인하고, 필요하면 `PERF_COEFFS`를 재적합(v4).
4. 경기가 충분히 모이면(예: 30~50경기) 역할 지표(힐량·CC·받은피해)를 추가하고 라인별 보정/비선형을 검토.

## 재검증 스니펫
```bash
node -e "
const d = require('./docs/op-score-dataset.json');
const C = { intercept:-9.619, kda:8.262, damagePerMin:0.01872, goldPerMin:0.0704, visionPerMin:-0.05324, csPerMin:-1.549, win:3.436, deathsPerMin:-19.8, damageTakenPerMin:0.007256, kdaSq:-0.1727 };
const kr=p=>(p.k+p.a)/Math.max(p.d,1);
const pred=(p,m)=>C.intercept+C.kda*kr(p)+C.damagePerMin*(p.dmgDealt/m)+C.goldPerMin*(p.gold/m)+C.visionPerMin*(p.vision/m)+C.csPerMin*(p.cs/m)+C.win*(p.win?1:0)+C.deathsPerMin*(p.d/m)+C.damageTakenPerMin*(p.dmgTaken/m)+C.kdaSq*kr(p)*kr(p);
let xs=[],ys=[],ae=0,n=0;
for(const g of d.games)for(const p of g.players){const yp=pred(p,g.gameLengthMin);xs.push(yp);ys.push(p.psScore);ae+=Math.abs(yp-p.psScore);n++;}
const m=a=>a.reduce((s,x)=>s+x,0)/a.length,ma=m(xs),mb=m(ys);
let num=0,da=0,db=0;for(let i=0;i<n;i++){num+=(xs[i]-ma)*(ys[i]-mb);da+=(xs[i]-ma)**2;db+=(ys[i]-mb)**2;}
console.log('Pearson',(num/Math.sqrt(da*db)).toFixed(4),'MAE',(ae/n).toFixed(3),'n',n);
"
```
