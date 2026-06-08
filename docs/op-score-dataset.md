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

## 현재 배포 모델 (v4b) · 56경기 적합
`scripts/Riot/MatchTransformer.js`의 `calculatePerformanceScore`에 적용된 계수입니다.
```
OP = -4.939 + 4.021·KDA비 + 0.01837·(딜/분) + 0.08929·(골드/분)
   + 0.7726·(시야/분) - 1.715·(CS/분) + 8.239·승리
   - 45.85·(데스/분) + 0.008216·(받은피해/분)        → 1 이상 정수
```
- **KDA비** = (킬+어시) / max(데스, 1).
- **CS/분** 음(−): 골드 통제 시 낮은 CS = 킬·오브젝트 수입 = 임팩트↑.
- **데스/분** 큰 음(−): KDA 비율이 상단에서 포화돼 엘리트 캐리를 못 가르므로 별도 데스 항으로 캐리 해상도 복원.
- **받은피해/분** 양(+): 탱커·서폿 전방 기여 반영. (`damageTaken` = .rofl `TOTAL_DAMAGE_TAKEN` / Riot `totalDamageTaken`, Player VO에 추가.)

### 검증 (leave-one-game-out CV, 56경기 560명)
| 모델 | 피처 | CV Pearson | CV MAE | PS≥100 구간 MAE |
|---|---|---|---|---|
| v3-form 재적합 | 6 | 0.924 | 8.25 | 17.1 |
| v4a | +데스/분 | 0.929 | 8.20 | 16.0 |
| **v4b (배포)** | +데스/분 +받은피해/분 | **0.932** | **7.94** | **16.0** |

### 39경기 신규 데이터가 한 일 (유의미성)
1. **실제 오차를 드러냄**: 옛 v3는 자체 17경기에선 MAE 7.29 / Pearson 0.939였지만, 신규 39경기(새 2명)에선 **MAE 8.46 / Pearson 0.918** — 실제로는 ~1.2 MAE 더 틀림. 데이터가 없었으면 과신했을 것.
2. **데이터만으론 소폭**: 피처를 v3 그대로 두고 데이터만 추가 → 신규 39경기 MAE 8.46 → 8.43 (거의 그대로). bias-limited 재확인.
3. **데이터가 새 피처를 가능케 함**: 560명(특히 캐리 구간 ~22→~91명)으로 데스/분·받은피해/분을 과적합 없이 검증 가능. v4b의 신규 39경기 held-out 성능 **MAE 8.18 / Pearson 0.929 / 캐리 16.7** (옛 v3 8.46 / 0.918 / 19.6 대비 개선, 특히 캐리 구간).

> PS≥100(캐리)는 여전히 MAE ~16 — 종료 시점 집계 + 선형 모델의 한계. 더 낮추려면 타임라인 지표(분당 골드/경험치 리드, 킬관여%)나 비선형 필요.
> v3 계수(참고): `-18.021 + 5.326·KDA + 0.01915·딜/분 + 0.09791·골드/분 + 2.192·시야/분 - 1.297·CS/분 + 4.053·승리`.

## OP ↔ PS 일치도 (현재 v4b, 56경기 560명)
| 측정 방식 | 값 | 의미 |
|---|---|---|
| Pearson 상관 r | **0.936** | 선형 상관 |
| R² (분산 설명력) | **88%** | PS 변동의 88%를 설명 |
| 팀내 순위 일치율 | **91%** | 두 선수 우열 방향이 PS와 일치 |
| 평균 절대오차 MAE | **7.7점** | PS 0~140 척도의 ~5.5% |
| 예측 ±10 / ±15 / ±20 이내 | **74% / 89% / 96%** | |

→ 한 줄 요약: **순위·분산 기준 ≈ 90% 일치**, 절대 점수는 평균 ±7.7점.

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
const C = { intercept:-4.939, kda:4.021, damagePerMin:0.01837, goldPerMin:0.08929, visionPerMin:0.7726, csPerMin:-1.715, win:8.239, deathsPerMin:-45.85, damageTakenPerMin:0.008216 };
const pred=(p,m)=>C.intercept+C.kda*((p.k+p.a)/Math.max(p.d,1))+C.damagePerMin*(p.dmgDealt/m)+C.goldPerMin*(p.gold/m)+C.visionPerMin*(p.vision/m)+C.csPerMin*(p.cs/m)+C.win*(p.win?1:0)+C.deathsPerMin*(p.d/m)+C.damageTakenPerMin*(p.dmgTaken/m);
let xs=[],ys=[],ae=0,n=0;
for(const g of d.games)for(const p of g.players){const yp=pred(p,g.gameLengthMin);xs.push(yp);ys.push(p.psScore);ae+=Math.abs(yp-p.psScore);n++;}
const m=a=>a.reduce((s,x)=>s+x,0)/a.length,ma=m(xs),mb=m(ys);
let num=0,da=0,db=0;for(let i=0;i<n;i++){num+=(xs[i]-ma)*(ys[i]-mb);da+=(xs[i]-ma)**2;db+=(ys[i]-mb)**2;}
console.log('Pearson',(num/Math.sqrt(da*db)).toFixed(4),'MAE',(ae/n).toFixed(3),'n',n);
"
```
