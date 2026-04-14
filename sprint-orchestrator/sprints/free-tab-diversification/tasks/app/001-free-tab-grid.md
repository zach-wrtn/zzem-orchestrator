# app-001 · 무료탭 N필터 그리드 + 배너 + 레드닷 + 스크롤 복원

- **Group**: 003
- **Owner**: fe-engineer + design-engineer (프로토타입)
- **Depends on**: be-003 API contract

## Target

`app-core-packages/apps/MemeApp/src/presentation/home/componenets/free-body.tsx` 및 관련 탭/배지 컴포넌트.

## Context

현재 무료탭은 단일 필터 중심. N개(기본 10) 2열 그리드로 전환하고, 배너/레드닷으로 오늘 무료 기회 상태를 시각화한다. 스크롤 위치 복원은 무료·추천탭 공통 인프라로 함께 적용(ALWAYS).

## Objective

PRD US-1, US-4, US-5와 관련 AC를 충족하는 무료탭 화면을 구현한다.

## Specification

### Screens / Components
- `FreeTabScreen` — 2열 그리드 + 상단 배너 + 빈 상태 뷰.
- `FreeRosterBanner` — 보라/틸 그라데이션 전환. 문구는 PRD 고정.
- `HomeTabsHeader` — "무료" 라벨 우상단 **레드닷** 표시.
- `FreeEmptyView` — "지금은 무료 필터가 없어요".

### Behavior
- 진입 시 `GET /free-tab` 호출(react-query). 응답 `usage.freeUsedToday`로 배너·레드닷 결정.
- 그리드 order = 응답의 filters 순서(BR-6, 변경 금지).
- `freeUsedToday == false` → **보라 배너** + 레드닷.
- `freeUsedToday == true` → **틸 배너** + 레드닷 미표시.
- 앱 포그라운드 복귀(AppState `active`) 시 KST 날짜 비교해 변경됐으면 재조회 → 상태 복구(AC 2.5.4).
- 빈 배열(`filters.length == 0`) → `FreeEmptyView`.
- 카드 탭 → `SwipeFeed`로 진입, `entryPoint: "free-tab"`, `initialFilterId` 전달. 그리드에서 받은 `filters`를 **재사용**(추가 API 호출 금지).
- 스크롤 위치 복원: 무료탭/추천탭 공통 훅(`useTabScrollRestore`) 도입해 탭 재진입 시 이전 offset 유지. 앱 재실행 시 초기화.

### Compatibility
- 구앱 경로는 본 스프린트에서 건드리지 않음. 신규 무료탭 화면은 `X-App-Version` 임계 이상에서만 활성.

### Deep link
- `zzem://free-tab` 딥링크 등록(e2e에서 네비게이션 용도).

## Acceptance Criteria

- [ ] 오늘 활성 10필터 상태에서 진입 → 2열 그리드로 10개 카드 표시(AC 2.1.1).
- [ ] 폴백 상태(rosterDate==어제) 응답 → 그리드 정상 표시, 빈 화면 아님(AC 2.1.2).
- [ ] 빈 배열 응답 → `FreeEmptyView` 표시(AC 2.1.3).
- [ ] `freeUsedToday==false`에서 보라 그라데이션 + "무료" 탭 레드닷 표시(AC 2.1.4, 2.5.3 반대).
- [ ] `freeUsedToday==true`에서 틸 그라데이션 + 레드닷 미표시(AC 2.5.1).
- [ ] 무료 생성 성공 후 홈 복귀 시 레드닷 즉시 소멸(AC 2.5.3).
- [ ] 자정 넘긴 뒤 포그라운드 복귀 → 배너 보라 + 레드닷 복구(AC 2.5.4).
- [ ] 카드 탭 → SwipeFeed 진입 시 추가 `/filters` 또는 `/free-tab` 호출 없음(네트워크 스파이 테스트).
- [ ] 무료탭 스크롤 후 다른 탭 이동 후 복귀 → 이전 offset 복원(AC 2.4.1). 추천탭에서도 동일 동작 검증.

### E2E 인증
- Extend: `home-tabs.yaml` — 레드닷 assertVisible + 그리드 카드 수 확인(가능한 경우).
- New: `flows/free-tab-grid.yaml` — 딥링크 진입 후 배너 색상 식별용 testID assertVisible + 빈 상태 분기.

## Implementation Hints

- 기존 `free-body.tsx`의 `LegendList` 설정 재사용.
- 레드닷 `badge.tsx` + 탭 바 컴포넌트 확장.
- 배너는 `react-native-linear-gradient` 기존 사용 패턴 따름.

## Prototype Reference
- **프로토타입**: `prototypes/app/app-001/prototype.html`
- **스크린샷**: `prototypes/app/app-001/screenshots/`
- **상태**: approved
