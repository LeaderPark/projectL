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
| `대상혁_2005` | 7 | **대기(PENDING)** — lol.ps 점수 필요 | 2일 전 아지르 판까지 |

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

## 현재 모델 (v2) · 검증
```
OP = -21.32 + 5.19·KDA비 + 0.0238·(딜량/분) + 0.0646·(골드/분) + 4.60·(시야/분) + 4.45·승리  → 1 이상 정수
```
Hide on bush 10경기(100명) 기준: PS와 **Pearson 0.942, 팀내 순위상관 0.904, MAE 7.16**.

## 대기 중: `대상혁_2005` 7경기 — PS Score 필요
아래 경기를 lol.ps에서 열어 **각 플레이어 PS Score**를 (게임 11처럼) 텍스트로 주시거나 스크린샷을 주시면
`op-score-dataset.json`에 채워 넣고 v3로 재적합합니다. (챔피언/KDA로 자동 매칭)

| matchId | 길이 | 대상혁 챔피언 | 결과 | 블루팀(100) | 레드팀(200) |
|---|---|---|---|---|---|
| KR-8246642821 | 23.4m | Azir(미드) | 패 | Kayn, Evelynn, **Azir**, Ezreal, Rell | Fiora, Sylas, Malzahar, Lucian, Thresh |
| KR-8246709967 | 45.3m | Kindred(정글) | 패 | XinZhao, **Kindred**, Xerath, Corki, Shaco | Kayle, Karthus, Yasuo, Kaisa, Ezreal |
| KR-8248474508 | 16.9m | Sejuani(정글) | 승 | Illaoi, **Sejuani**, Xerath, Kaisa, Blitzcrank | Aatrox, XinZhao, Malzahar, Jhin, Thresh |
| KR-8248529432 | 32.6m | Rammus(정글) | 패 | Yone, LeeSin, Malzahar, Sivir, Teemo | Malphite, **Rammus**, Naafiri, Caitlyn, Bard |
| KR-8250291740 | 27.1m | Zac(정글) | 패 | Darius, MonkeyKing, Viego, MissFortune, Janna | Malphite, **Zac**, Talon, Caitlyn, Malzahar |
| KR-8250334888 | 29.8m | Sylas(미드) | 승 | Darius, **Sylas**, Syndra, Tristana, Thresh | Jax, Shen, Zoe, MissFortune, Pyke |
| KR-8250377808 | 37.3m | Ekko(미드) | 승 | Poppy, **Ekko**, Zed, MissFortune, Lulu | Ryze, MonkeyKing, Orianna, Caitlyn, Mel |

## 데이터 추가 방법 (계속 쓰기 위해)
1. 새 `.rofl`을 폴더에 두고, 각 경기의 lol.ps PS Score를 텍스트/스크린샷으로 제공.
2. 리플레이 파싱 → 챔피언·KDA로 PS 매칭 → `op-score-dataset.json`에 경기 추가.
3. 경기가 충분히 모이면(예: 30~50경기) 역할 지표(힐량·CC·받은피해)를 추가하고 라인별 보정/비선형을 넣어 재적합(v3).
