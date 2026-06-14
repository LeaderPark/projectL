# DESIGN.md — 공개 기록 사이트 UI/UX 기준

이 문서는 `scripts/Web/`(공개 기록 사이트)의 디자인 시스템과 UI/UX 규칙을 정의합니다.
출처: `uxui_design_feedback_website_guide`(Madia Design + WCAG 2.2 / Material 3 / NN.g 기반)를
이 프로젝트(League of Legends 내전 **기록/통계** 사이트)에 맞게 적용한 것입니다.
화면을 만들거나 수정할 때 이 문서를 옆에 두고 검수하세요.

> 이 사이트는 마케팅/전환 사이트가 아니라 **랭킹·플레이어·경기 기록 조회** 사이트입니다.
> 가이드의 가격/가입/세일즈 CTA 항목은 적용하지 않고, **정보 위계·일관성·접근성·반응형**에 집중합니다.

## 0. 테마

- **다크 단일 테마**입니다. `public/site.css`의 두 번째 `:root`(다크)가 실제 적용값입니다.
  (첫 번째 `:root`의 색상은 다크 블록이 덮어쓰며, 간격/타입 토큰만 첫 블록에서 유효합니다.)
- 새 색상 역할 토큰은 다크 `:root`에 추가합니다.

## 1. 디자인 토큰 (`public/site.css` `:root`)

### 간격 (8px 시스템)
`--space-2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80`
- 관련 요소는 가깝게, 다른 그룹은 멀게. **카드 내부 패딩 < 카드 간 간격.**
- 섹션 간격은 크게(32~48px+), 그룹 내부는 24~32px. 새 px 리터럴을 감으로 넣지 말고 토큰을 쓰세요.

### 타입 스케일 (역할 기반)
`--text-display / --text-h1 / --text-h2 / --text-h3 / --text-body(16px) / --text-body-sm / --text-caption / --text-button`
- 본문 16px·`--lh-body: 1.6` 기본. 캡션은 **12px 미만 금지**.
- 굵기는 `--fw-regular(400) / --fw-medium(500) / --fw-bold(700)` 3단계로 제한. 800 남발 금지.
- 역할 없는 새 폰트 크기를 만들지 마세요.

### 색상 역할 (시맨틱)
`--color-primary`(브랜드 행동, 큰 텍스트·버튼 배경) / `--color-primary-hover` /
`--color-link`(본문·표 링크 텍스트, AA 대비 확보용) / `--color-secondary` /
`--color-surface` / `--color-bg` / `--color-text` / `--color-text-muted` /
`--color-border` / `--color-border-strong`(입력 테두리, 비텍스트 대비≥3:1) /
`--color-success / --color-error / --color-warning / --color-info`
- **브랜드 색을 모든 곳에 쓰지 말 것.** 클릭 대상·핵심 강조에만.
- 링크 텍스트는 `--color-primary`(#5383ff, ~3.9:1) 대신 `--color-link`(#8eb1ff, ~7:1)를 사용.

### 포커스
`--focus-outline`(2px solid) / `--focus-ring`(box-shadow). 모든 인터랙티브 요소에 `:focus-visible` 링 필수.

## 2. 정보 구조 / 페이지

- 페이지마다 `<h1>` 정확히 1개. 섹션 제목은 `<h2>/<h3>`, 단계 건너뛰기 금지.
- 시맨틱 태그: `<main id="main-content">`, `<nav>`, `<table>`(+`<th scope="col">`), `<form>`+`<label for>`.
- 표는 모바일에서 `.table-scroll`로 감싸거나 카드로 변환. (스코어보드는 ≤1200px에서 단일 컬럼 카드형.)
- **빈 상태 필수**: 경기/랭킹/검색 결과 없음 → `.panel-empty-state`로 다음 행동 안내.
- 404/오류/성공 상태도 설계 (현재 `NotFoundPage`, 폼 인라인 오류 보유).

## 3. 컴포넌트 상태 (가이드 §9.4)

버튼·입력·탭·카드·모달은 다음 상태를 갖춰야 합니다:
`default / hover / focus-visible / active / disabled / loading / error / success`
- **섹션당 Primary 버튼 1개.** 버튼 문구는 동사로 시작.
- `disabled`는 이유를 알 수 있게, `loading`은 중복 제출 차단 + 진행 표시(`aria-busy`).

## 4. 접근성 (시작 기준, 마지막 보정 아님)

- 텍스트 대비 AA: 일반 4.5:1, 큰 텍스트 3:1, 비텍스트(입력 테두리·아이콘) 3:1.
- **색만으로 상태 전달 금지** — 텍스트/아이콘/위치 병행 (승/패 라벨 등).
- 링크는 색 외에 밑줄로도 식별(`.ranking-table td a`, `.panel__link`).
- 키보드: 모든 인터랙션 요소 도달 + 보이는 포커스. `skip-link`로 본문 바로가기 제공.
- 모든 `<img>`에 의미 있는 `alt`(장식은 `alt=""`/`aria-hidden`).
- 검색 자동완성은 combobox/listbox 패턴(↑↓/Enter/Esc, `aria-expanded`/`aria-activedescendant`).
- `prefers-reduced-motion` 존중.

## 5. 폼 (가이드 §10)

- 라벨은 placeholder로 숨기지 말 것(`sr-only` 라벨이라도 부여).
- 오류는 **해당 필드 근처 인라인**으로, 문제+해결 방법을 함께. `window.alert` 금지.
- 제출 중 로딩/중복 제출 방지, 성공 후 다음 행동 안내. 키보드만으로 완결 가능.

## 6. 반응형 (가이드 §12)

- 모바일은 데스크톱 축소판이 아님 — 콘텐츠 순서 재정리.
- 모바일 좌우 패딩 ≥16px. 탭 타깃 ≥44px.
- 카드 그리드는 1~2열로 재배치, 와이드 표는 스크롤/카드/핵심열.

## 7. 점검 순서

1. 기획: 페이지 목적·사용자 질문·필요 페이지 정의.
2. 디자인: 위 토큰/상태/대비 규칙 적용.
3. 검수: `npm test`(뷰/클라이언트/포맷터 테스트) + 모바일 실기기 + 키보드 전용 흐름.

## 8-1. 전문가 원칙 2차 반영 (Nielsen·Krug·Morville·Wroblewski 등)

- **검색 빈 결과**: 검색어가 있는데 결과 0건이면 `.site-search__empty`로 "‘…’ 검색 결과가 없어요"를 표시(침묵 금지 — 상태 가시성).
- **스코어보드 모바일 라벨**: 컬럼 헤더가 숨겨지는 ≤1200px에서 각 셀의 `data-label`을 `::before`로 노출(라벨 없는 숫자 나열 방지).
- **용어 풀이**: 푸터 `.site-footer__glossary`(OP Score/MVP/ACE) + OP Score 컬럼 `title`. **MMR은 공개 사이트에서 노출 금지**(값·용어 모두 — 홈/플레이어 페이지). 랭킹의 정렬 라벨에서만 "MMR" 단어 허용.
- **랭킹 정렬**: `renderRankingTable`이 `data-sortable-table` + 머리글 `button[data-sort-key]`(name/wins/winrate) 생성, `site.js`가 클라이언트 정렬·`aria-sort` 토글. 행에 `data-rank/wins/winrate`.
- **경기 필터**: `/matches`에 `[data-match-filter]` 입력 → 로드된 카드 텍스트 필터, 빈 결과 시 `[data-match-filter-empty]` 안내.
- **새로고침 로딩**: 플레이어 닉네임 새로고침 폼 제출 시 버튼 disabled + "갱신 중…" + `aria-busy`.
- **공유 컴포넌트**: `renderNoticePanel` / `renderStatTile` / `renderRankingTable`로 홈·랭킹·경기·플레이어 중복 제거(시스템적 일관성).
- **분석(측정) 시드**: `Layout`이 `WEB_ANALYTICS_SCRIPT_URL`(+선택 `WEB_ANALYTICS_DOMAIN`) 설정 시에만 `<head>`에 스크립트 주입. **기본 비활성 = 어떤 추적도 안 함.** 쿠키리스·프라이버시 친화 도구(Plausible/Umami 등) 권장. 출시 후 "행동 관찰" 원칙의 진입점.

## 8. 관련 파일

- `public/site.css` — 토큰 + 컴포넌트 + 반응형 + 접근성 보정(파일 끝 블록).
- `public/site.js` — 검색 자동완성, 경기 펼치기/탭, 더보기, 서버ID 폼(모두 접근성 처리).
- `scripts/Web/views/Layout.js` — 셸/헤더/네비/검색/푸터/skip-link.
- `scripts/Web/views/*.js`, `ViewHelpers.js` — 페이지/공유 컴포넌트.
