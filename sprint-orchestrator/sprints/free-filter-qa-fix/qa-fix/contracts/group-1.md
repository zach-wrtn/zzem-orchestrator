# Sprint Contract: Group 1 (free-filter-qa-fix)

> QA-Fix Stage 3 contract — Done Criteria = 각 ticket의 Verification Steps 통과 + Root Cause 확인 (AC 충족이 아님).

## Scope

- **Sprint**: free-filter-qa-fix
- **Group**: group-1 (무료 필터 사용 플로우)
- **Tickets**:
  - `IS-1365` (P1): 무료 필터 피드에서 프리뷰 버튼 선택 시 에러 화면 노출
  - `IS-1367` (P1): 무료 필터 미사용 상태에서 무료 필터 생성 불가
- **Build**: Dev 1.3.0 (6817), iPhone 16 / Galaxy S25
- **Source sprint**: free-tab-diversification (2026-04-09~14, REPORT.md 참조). 본 그룹은 그 후속 회귀 fix.
- **Repos in scope**:
  - `app` (app-core-packages, base `zzem/sprint-002`) — `apps/MemeApp/src/screens/free-tab/**`, `apps/MemeApp/src/contexts/RosterContext*`, `apps/MemeApp/src/hooks/useFreeFilter*`, `apps/MemeApp/src/components/swipe-feed/**`
  - `backend` (wrtn-backend, base `develop`) — `src/domain/free-filter-slot/**`, `src/domain/user-free-quota/**`, `src/api/free-tab/**`, `GenMemeDomainService` (free-tab REPORT 기반 추정)

## Done Criteria

### Ticket: IS-1365 — 무료 필터 피드 프리뷰 에러 화면

- [ ] **DC-1365-A**: 무료 탭 → 무료 필터 피드 → 프리뷰 버튼 탭 시 **프리뷰 화면이 정상 노출** (에러 화면 0건). 모든 무료 필터 슬롯에서 동일.
- [ ] **DC-1365-B**: **Root Cause 명시** — 리포터 단서 "유료 필터에선 정상, 무료에서만 발생" 의 분기 지점을 코드에서 식별하여 jira 코멘트의 `Root Cause` 필드에 1문단으로 기재. "Unknown" 금지.
- [ ] **DC-1365-C**: **회귀 점검** — 유료 필터 프리뷰 진입 동작이 fix 후에도 정상 (변경 없음 또는 동등 동작 확인).
- [ ] **DC-1365-D**: 사용 후(오늘 무료 1회 소진) 무료 필터 프리뷰도 정상 (quota state 의존성이 프리뷰 분기에 있다면 이쪽도 검증).

### Ticket: IS-1367 — 무료 필터 미사용 상태에서 생성 불가

- [ ] **DC-1367-A**: 무료 필터 **미사용 상태** (오늘 무료 quota 1회 미소진) 에서 무료 필터 생성 동작 시 **정상 생성** (생성 실패 0건). free-tab-diversification BR-1 (1일 1회 무료 생성) 의 정상 케이스.
- [ ] **DC-1367-B**: **Root Cause 명시** — quota 검사 로직 / `freeUsedToday` 판정 / `todayActiveSlots` 등 어느 분기가 미사용 상태에서 생성 차단을 유발하는지 코드 trace 후 jira 코멘트에 기재.
- [ ] **DC-1367-C**: **BR-1 회귀 점검** — 무료 1회 사용 후(quota 소진) 무료 생성 차단 로직이 보존됨. fix 가 BR-1 자체를 무효화하지 않음.
- [ ] **DC-1367-D**: BR-3 (DB 레벨 unique 제약) 도 fix 후 보존 — `UserFreeQuota` unique index 위반 시 정상 reject.

### Cross-ticket (G1 공통)

- [ ] **DC-G1-X1** (KB: correctness-003): pricing source(`requiredCredit`) 와 display source(`themeTag`/`displaySlots`) 가 분리 유지. fix 가 두 source를 다시 혼재시키지 않음. (free-tab-diversification REPORT.md Major #2 회귀 방지)
- [ ] **DC-G1-X2** (KB: integration-001): IS-1365/1367 fix 시 BE 응답 필드명이 `api-contract.yaml` (또는 free-tab `/free-tab` 엔드포인트의 contract) 과 정확히 일치 — 새 필드 추가 시 BE↔FE 양쪽 반영.
- [ ] **DC-G1-X3** (KB: completeness-003): IS-1367 fix 가 navigation route params 변경을 수반하면 모든 callsite 가 새 param 을 전달 + `useCallback` deps 갱신.
- [ ] **DC-G1-X4** (KB: completeness-007): 무료 필터 생성 페이로드가 parent context (RosterContext의 today slots) 에 의존하면 모든 진입 path 에서 prop threading 보장.

## Verification Method

| Criterion | 검증 방법 |
|-----------|----------|
| DC-1365-A | 수동: 무료 탭 → 무료 필터 슬롯 N개 각각의 프리뷰 버튼 탭 → 프리뷰 화면 진입 확인. 자동: 가능 시 useFreeFilter\* 훅 + preview navigation 콜백의 unit 테스트로 분기 경로 trace. |
| DC-1365-B | 코드 trace: `if (filter.isFree) { ... }` 또는 동치 분기에서 차이 식별. PR diff에 1문단 root cause 명시. |
| DC-1365-C | 수동: 유료 필터 프리뷰 1개 이상 탭 → 정상 진입 확인. |
| DC-1365-D | 수동: 무료 1회 사용 후(다른 무료 필터 생성 완료) 다른 무료 필터의 프리뷰 진입 → 정상. |
| DC-1367-A | 수동: 앱 fresh state (또는 quota reset) → 무료 필터 생성 액션 → 결과(필터 정상 생성 + free-tab UI 갱신) 확인. |
| DC-1367-B | 코드 trace: `RosterContext` / `useFreeGenCTA` / quota 검사 path. PR diff에 root cause 명시. |
| DC-1367-C | 수동: 무료 1회 생성 → 같은 날짜(또는 KST 자정 전) 두 번째 무료 생성 시도 → 차단(유료 fallback) 확인. |
| DC-1367-D | BE 단위테스트 또는 DB 직접 쿼리: 동일 (userId, date) 두 번째 quota row 시도 시 unique 제약 위반 확인. |
| DC-G1-X1 | grep: `rg 'requiredCredit' app/apps/MemeApp/src` + `rg 'displaySlots\|todayActiveSlots' app/apps/MemeApp/src` — 두 source 가 별개 네이밍 유지. RosterContext 분리 구조 보존. |
| DC-G1-X2 | grep: PR diff 의 BE 응답 필드 추가/변경 → app 의 query/mapper 동일 필드명 사용. api-contract.yaml 갱신 시 두 레포 동시. |
| DC-G1-X3 | grep: route 정의 (예: `RootStackParamList`) 변경 시 모든 `navigation.navigate('<Screen>'` callsite 가 새 param 포함. |
| DC-G1-X4 | trace: 무료 필터 생성 진입 path (FreeTabScreen, SwipeFeed, deep link) 모두에서 quota state 가 동일 source. |

### Default Verification Gates (template 기본 — G1 적용)

- [ ] **Mapper fallback 금지** (KB: completeness-008) — fix 시 새 필드 도입하면 `rg '?? 0|?? false|\|\| ""' app/apps/MemeApp/src` → 0 hit (예외는 명시적 optional 만)
- [ ] **Dead hook/method 금지** (KB: completeness-009) — fix 로 신규 hook 추가 시 callsite ≥1 hit
- [ ] **Cross-component 전수 나열** (KB: completeness-010) — 무료 필터 분기 fix 가 영향 받는 진입 path (FreeTabScreen 그리드, SwipeFeed 무료 모드, 추천탭 외부 진입점 US-7) 전수 점검
- [ ] **FE typecheck clean**: `cd app/apps/MemeApp && yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` → 신규 0 hit

## Edge Cases to Test

- **EC-1**: 무료 quota = 1회 미사용, 디바이스 시간이 KST 자정 직전 → 생성 → KST 자정 직후 quota reset 정상 (BR-16 회귀 방지).
- **EC-2**: 네트워크 오프라인 상태에서 프리뷰 버튼 탭 → 에러 처리 (silent crash 금지).
- **EC-3**: 동일 무료 슬롯에 대해 빠른 더블탭 → 단일 진입 / 단일 생성 (race 방지).
- **EC-4**: 유료/무료 필터 혼재된 피드에서 스와이프 → 무료↔유료 전환 시 프리뷰/생성 분기가 슬롯별 정확히 적용.
- **EC-5**: 비로그인 상태에서 무료 필터 진입 → 로그인 유도 (생성 시도 대신).

## Business Rules to Validate

- **BR-1** (free-tab): 1일 1회 무료 생성. fix 후에도 유지.
- **BR-3** (free-tab): DB 레벨 unique 제약. fix 후에도 유지.
- **BR-13** (free-tab): 필터 목록 API 가 오늘 무료 사용 여부 포함. fix 가 이 응답 정합성을 유지.
- **BR-16** (free-tab): KST 자정 경계. fix 가 자정 reset 동작에 영향 없음.

## Cross-Task Integration Points

- **IS-1365 ↔ IS-1367 공통 분기**: 두 티켓이 같은 "무료 슬롯 vs 유료 슬롯" 분기 (RosterContext.todayActiveSlots) 를 다르게 해석할 가능성이 있다. 한쪽 fix 가 다른쪽 root cause 일 수도. **Engineer 는 IS-1367 root cause 식별 후 IS-1365 가 같은 fix 로 해소되는지 먼저 확인** — 그렇다면 IS-1365 는 회귀 검증만 추가.
- **free-tab-diversification 회귀 영역**: REPORT.md Group-002 Major #2 (어제 폴백 filter `requiredCredit=0` 과다 노출 → UI/생성 불일치) 가 본 그룹의 모듈과 동일. 그 fix (RosterContext → todayActiveSlots/displaySlots 분리) 가 어떻게든 깨지지 않도록 verify.
- **AppService 진입점**: 무료 필터 생성 트리거가 여러 곳에서 호출되면 (피드 그리드, SwipeFeed, 추천탭 US-7) 모든 진입 path 에서 동일 quota check.

## Prior Group Lessons (free-tab-diversification reflection 반영)

- **L-1** (Contract): "복수 경로 cleanup 의무" — 새 무료 필터 분기 로직은 모든 기존 진입점(그리드/SwipeFeed/추천탭/딥링크)에 일관 적용.
- **L-2** (Contract): "폴백 응답 spec 상세화" — fallback 시 quota/pricing 계산 기준 명시.
- **L-3** (Contract): "Route params 추가 시 모든 callsite + useCallback deps".
- **L-4** (Contract): "Deep link fallback" — 무료 필터에 deep link 직진입 가능하면 quota state fallback 보장.
- **L-5** (재사용 훅 선행 설계): IS-1365 와 IS-1367 가 같은 quota helper 를 공유하면 그 helper 수정으로 양쪽 해결 — 새 hook 도입보다 기존 `useFreeGenCTA` / RosterContext API 보강 우선.

---

## Sign-off

**Round 1 self-review by Sprint Lead** (independent Evaluator unavailable in this session — defer to user gate before Stage 4):

- [x] 포괄 표현 ("모든", "전체") 구체화: DC-G1-X4 에서 진입 path 3개 (FreeTabScreen 그리드 / SwipeFeed 무료 모드 / 추천탭 US-7) 명시.
- [x] 신규 hook callsite grep 게이트 — default gate 포함.
- [x] Mapper fallback 금지 grep 게이트 — default gate 포함 (KB completeness-008).
- [x] Prior sprint pattern 재발 위험 평가 — L-1~L-5 (free-tab reflection lessons) 인라인.
- [x] Storage primitive 언급 없음 — 해당 없음.
- [x] Contract 내부 모순 점검: DC-1367-A (미사용 → 생성 가능) vs DC-1367-C (사용 후 → 차단) — 시나리오 다름, 모순 없음.

**Independent Evaluator review pending** — 본 contract 는 user gate 통과 후 implementation 시작 전 (또는 직후 코드와 함께) 외부 검토 가능.

_Approved at: 2026-04-27T15:55:00+09:00 (self-review)_

