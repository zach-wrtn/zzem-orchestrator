# be-003 · 무료탭 API + 필터 목록 v2 (usage 포함)

- **Group**: 002
- **Owner**: be-engineer
- **Depends on**: be-001, be-002

## Target

`wrtn-backend/apps/meme-api/src/controller/filter/*`, `application/filter/filter-query-app.service.ts`.

## Context

앱은 무료탭 진입 시 오늘의 N필터와 "오늘 무료 사용 여부"(BR-13)를 함께 필요로 한다. 구앱 호환(BR-11)을 위해 `X-App-Version` 기준 분기.

## Objective

`GET /free-tab` 신설 및 `GET /filters` v2 응답에 `usage` 블록을 추가한다. 계약은 `contracts/api-contract.yaml` 참조.

## Specification

### `GET /free-tab`
- 오늘 `ACTIVE` 슬롯을 `orderIndex` 오름차순으로 반환.
- `usage.freeUsedToday`: 오늘 KST 범위에서 사용자가 **완료 or 진행중** 무료 생성을 가진 경우 true(BR-1/2).
- `usage.rosterDate`: 실제로 반환된 슬롯의 날짜(폴백 여부 판별용, AC 2.1.2).
- 오늘/어제 모두 없음 → `filters: []` (AC 2.1.3 — 앱 빈 상태 트리거).
- 인증 선택: 미로그인 시 `freeUsedToday: false`.

### `GET /filters` v2
- 기존 응답 구조 보존(구앱 파싱 에러 금지, BR-11).
- **신규 필드만 추가**: 상단에 `usage` 블록 및 각 `FilterSummary.themeTag`.
- `X-App-Version` < `FREE_ROSTER_MIN_VERSION` → `usage`/`themeTag` 생략, `tags:["free"]`는 **레거시 단일 필터 1개만** 부여해 기존 동작 유지.

### Pricing
- `FilterSummary.requiredCredit`: 오늘 `ACTIVE` 슬롯의 필터이며 `freeUsedToday==false` → `0`. 그 외 기본 가격.

### 성능
- 무료탭 응답은 N≤10 고정이므로 추가 페이지네이션 불필요.
- SwipeFeed 진입 시 앱은 추가 호출하지 않음(NEVER DO).

## Acceptance Criteria

- [ ] `GET /free-tab` 정상 상태 10개 반환 + `usage.rosterDate == 오늘`.
- [ ] 오늘 예약 없음 + 어제 EXPIRED 존재 → 어제 슬롯 반환 + `rosterDate == 어제`.
- [ ] 오늘/어제 모두 없음 → `filters: []`.
- [ ] 무료 사용 완료 직후 호출 → `usage.freeUsedToday == true`.
- [ ] 생성 실패로 종료된 사용자에 대해 호출 → `freeUsedToday == false`(BR-2).
- [ ] `X-App-Version` 미전달 또는 임계 미만 → `usage`/`themeTag` 없이 응답 + `tags:["free"]` 1개만 포함.
- [ ] 임계 이상 → 응답에 `usage` + 각 필터 `themeTag` 포함.
- [ ] KST 00:00 전후 경계에서 `todayKst` 값이 정확히 전환됨(타임존 테스트).
- [ ] 응답 직렬화에서 신규 필드가 선택적으로 붙더라도 구앱 DTO와 호환(계약 테스트).

## Implementation Hints

- 기존 `enrichFilters()` 흐름 재사용.
- 앱 버전 비교는 semver — 기존 helper 있으면 재사용.
