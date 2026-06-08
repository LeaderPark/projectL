# OP Score 레퍼런스 데이터셋 (PS Score 매칭용)

`scripts/Riot/MatchTransformer.js`의 `calculatePerformanceScore`(= 사이트의 OP Score)를
lol.ps **PS Score**에 맞춰 튜닝하기 위한 레퍼런스 데이터입니다. 모델을 다시 적합(refit)하거나
검증할 때 계속 사용합니다.

- **데이터 파일**: [`op-score-dataset.json`](./op-score-dataset.json) — 경기별·플레이어별 리플레이 파싱 스탯 + PS Score 라벨
- **PS Score 스케일**: lol.ps 정수 점수, 약 0~135 (MVP ~100+, ACE = 패배팀 1위)

## 출처
| 소환사 | 경기 수 | PS 출처 | 비고 |
|---|---|---|---|
| `Hide on bush_KR1` | 10 | lol.ps 스크린샷에서 판독(검증 완료) | 1주일 전 아지르 판까지 최근 10경기 |
| `대상혁_2005` | 7 | lol.ps 텍스트 붙여넣기(챔피언/KDA로 매칭, 검증 완료) | 2일 전 아지르 판까지 |

> 현재 **17경기 / 170명** 전원 PS Score가 채워져 있습니다(`null` 없음).

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

플레이어 순서: 각 경기 블루팀(100) 5명 → 레드팀(200) 5명, 역할(탑/정글/미드/원딜/서폿) 순.

## 현재 모델 (v3) · 검증
`scripts/Riot/MatchTransformer.js`의 `calculatePerformanceScore`에 적용된 계수입니다.
```
OP = -18.021
   + 5.326 ·KDA비
   + 0.01915·(딜량/분)
   + 0.09791·(골드/분)
   + 2.192 ·(시야/분)
   - 1.297 ·(CS/분)
   + 4.053 ·승리                 → 1 이상 정수
```
- **KDA비** = (킬+어시) / max(데스, 1)
- **CS/분**은 음(−)의 계수: 골드를 통제하면 CS가 낮을수록 수입이 킬·오브젝트에서 나왔다는 뜻이라 더 임팩트가 큼.

전체 **17경기 / 170명**(Iron~Challenger) 기준 검증:

| 지표 | 값 |
|---|---|
| Pearson 상관 | **0.939** |
| Leave-one-game-out MAE | **7.29** |
| 팀내 순위 일치도(pairwise) | **0.909** |

> v2(시야/분까지, CS 미사용)는 동일 데이터에서 Pearson 0.932 / MAE 7.74였고, v3에서 CS/분을 추가해 개선했습니다.
> v2 계수: `-21.32 + 5.19·KDA + 0.0238·딜/분 + 0.0646·골드/분 + 4.60·시야/분 + 4.45·승리`.

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
