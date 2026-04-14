# Sprint Contract: Group 003 (free-tab-diversification)

## Scope
- Tasks: app-001 (무료탭 N그리드 + 배너 + 레드닷 + 스크롤 복원), app-002 (SwipeFeed 무료 전용 모드 + circular scroll + CTA 상태)
- 레포: app-core-packages
- 의존: be-003 API contract (머지 완료)

## Done Criteria

### app-001
- [ ] `GET /free-tab` react-query 호출, 응답 기반 렌더.
- [ ] 오늘 ACTIVE 10필터 상태 → 2열 그리드 10 카드 (AC 2.1.1).
- [ ] 폴백 (rosterDate==어제) → 그리드 정상 렌더 (빈 화면 아님, AC 2.1.2).
- [ ] `filters: []` 응답 → `FreeEmptyView` 표시 (AC 2.1.3).
- [ ] `freeUsedToday==false` → 보라 그라데이션 배너 + "무료" 탭 레드닷 (AC 2.1.4, 2.5.3 반대).
- [ ] `freeUsedToday==true` → 틸 그라데이션 배너 + 레드닷 미표시 (AC 2.5.1).
- [ ] 무료 생성 성공 → 홈 복귀 시 레드닷 즉시 소멸 (AC 2.5.3). react-query invalidation 또는 직접 state sync.
- [ ] 포그라운드 복귀(AppState `active`) + KST 날짜 변경 → 재조회, 배너 보라/레드닷 복구 (AC 2.5.4).
- [ ] 카드 탭 → SwipeFeed 진입 시 `/free-tab` 또는 `/filters` 추가 호출 0 (그리드 응답 재사용, 네트워크 스파이 테스트).
- [ ] `useTabScrollRestore` 훅 도입 — 무료탭/추천탭 공통. 탭 이동 후 복귀 시 이전 offset 복원 (AC 2.4.1). 앱 재실행 시 초기화.
- [ ] `X-App-Version >= FREE_ROSTER_MIN_VERSION` 전송 (모든 무료탭 관련 호출에서 일관).
- [ ] 구앱 경로는 본 스프린트에서 미변경.
- [ ] Deep link `zzem://free-tab` 등록 (e2e 용도).
- [ ] `FreeTabScreen`/`FreeRosterBanner`/`HomeTabsHeader` 레드닷/`FreeEmptyView` testID 부여 (e2e maestro 요건).

### app-002
- [ ] `SwipeFeedScreen` `mode: "free" | "algo"` prop 추가.
- [ ] 무료 그리드 카드 탭 → SwipeFeed 진입, `initialFilterId` 해당 필터가 첫 화면 (AC 2.2.1).
- [ ] 위/아래 스냅 스크롤로 무료 필터 탐색, 각 카드 동일 CTA 구조 (AC 2.3.1).
- [ ] **Circular scroll**: 마지막→첫/첫→마지막 연결 (AC 2.2.2). `onMomentumScrollEnd` 경계 감지 + `jumpToIndex` 방식 (데이터 복제 금지, 힌트대로).
- [ ] 무료 모드 + `freeUsedToday==false` → 티켓 아이콘 + "무료" CTA.
- [ ] 무료 모드 + `freeUsedToday==true` → 코인 아이콘 + 유료 가격 CTA (AC 2.6.2).
- [ ] 무료 CTA 탭 → 확인 바텀시트 오픈 hand-off (app-003에서 구현. 본 그룹은 bridge event/navigation 정의까지).
- [ ] 유료 CTA 탭 → 크레딧 안내 바텀시트 hand-off.
- [ ] 뒤로가기 → 무료탭 그리드 복귀 (AC 2.3.2).
- [ ] 피드 진입 시 `/free-tab` 또는 `/filters` 네트워크 호출 0 (ALWAYS, 그리드 응답 재사용).
- [ ] Deep link `zzem://swipe-feed/free?filterId=...` 등록.

## Verification Method
- **그리드 렌더**: react-query mock 시나리오 3종 (today-active / yesterday-fallback / empty). Snapshot + state-based assertion.
- **배너/레드닷 분기**: mock usage.freeUsedToday true/false 각각 시각 프로퍼티 단언.
- **포그라운드 복귀**: AppState mock + Date mock → refetch 호출 검증.
- **네트워크 스파이**: SwipeFeed 진입 경로 렌더 중 axios/fetch 호출 내역 0 assertion.
- **Circular scroll**: `onMomentumScrollEnd` 시뮬레이션 → `jumpToIndex` 호출 인수 검증.
- **CTA 분기**: mock usage.freeUsedToday로 아이콘/텍스트 assertion.
- **스크롤 복원**: Navigation 이동 시뮬레이션 + restore assertion.
- **Contract 일치**: be-003 api-contract.yaml 응답 shape에 대응 (FreeUsageState, FilterSummary).
- **E2E**: Maestro flows (home-tabs.yaml extend, swipe-feed.yaml extend, flows/free-tab-grid.yaml new, flows/swipe-feed-free-circular.yaml new).

## Edge Cases
- 응답 중 `freeUsedToday` 변경 (다른 기기 생성) → 다음 refetch 시 state 전환 OK. 현재 세션 강제 sync 요구 없음.
- `filters.length < 10` (부분 폴백) 상태에서도 그리드/circular 정상.
- `initialFilterId`가 응답 filters에 없을 때 — 0번 인덱스로 fallback + 에러 로그 금지(그냥 무시).
- 폴백 응답에서 `requiredCredit > 0` 필터 혼재 → UI 가격 기반 배지 처리 (Group 002 교훈).
- 포그라운드 복귀 시 앱이 백그라운드로 간 적 없는 초기 로드와 구분 — AppState 이전값 추적.

## Lessons from Group 002 (이월 반영)
- App은 `X-App-Version` 헤더를 `/free-tab`, `/filters`, `/filters/:id/gen` 모두에 일관 전송.
- `FREE_ALREADY_USED` 409 에러는 app-003 scope (본 그룹은 CTA→bottom sheet hand-off 정의까지).
- `freeUsedToday` 판정은 서버 응답 기반, local state 덮어쓰기 금지.
- 폴백 응답(`rosterDate != 오늘`)에서 `requiredCredit`은 basePrice. 무료 표시는 `requiredCredit==0`으로만 판정.
- `slotId`는 요청에 포함 금지 (앱이 알 필요 없음, BR-12).

## Sign-off
- Sprint Lead 자체 서명(2026-04-14): Group 001/002 evaluator 이력 기반, Contract는 task spec과 approved prototype에서 직접 파생. 구현 중 이견은 Evaluator fix loop에서 교정.
