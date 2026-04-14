# Sprint Contract: Group 002 (free-tab-diversification)

## Scope
- Tasks: be-003 (`GET /free-tab`, `GET /filters` v2 usage 블록, 구앱 호환), be-004 (생성 시 슬롯 자동 매핑 + DB 유니크 1일1회 + KST 재검증)
- Endpoints: `GET /free-tab`, `GET /filters` (v2), `POST /filters/:filterId/gen` (수정), `POST /__test__/free-roster/*`

## Done Criteria

### be-003
- [ ] `GET /free-tab` 200 응답: `filters[]`(orderIndex 오름차순) + `usage.freeUsedToday` + `usage.rosterDate` 필드 존재.
- [ ] 오늘 ACTIVE 슬롯 존재 시 해당 10개 반환 + `usage.rosterDate == 오늘 KST`.
- [ ] 오늘 예약/활성 없음 + 어제 EXPIRED 존재 → 어제 슬롯 반환 + `rosterDate == 어제` (폴백은 읽기 전용, 상태 변경 금지).
- [ ] 오늘/어제 모두 없음 → `filters: []` + HTTP 200 (빈 상태 트리거).
- [ ] `usage.freeUsedToday`: 오늘 KST 범위 사용자 무료 생성 "완료 or 진행중" 시 true. 실패 종료된 건은 false(BR-2).
- [ ] 미로그인 → `freeUsedToday: false`, 정상 응답.
- [ ] `GET /filters` v2: 상단 `usage` 블록 + 각 `FilterSummary.themeTag`(기존 필드 보존).
- [ ] `X-App-Version < FREE_ROSTER_MIN_VERSION` 또는 헤더 누락 → `usage`/`themeTag` 생략, `tags:["free"]`는 레거시 단일 필터 1개만 부여 (구앱 파싱 에러 금지, 계약 테스트로 증명).
- [ ] `FilterSummary.requiredCredit`: 오늘 ACTIVE 슬롯 + `freeUsedToday==false` → 0, 그 외 기본 가격.
- [ ] KST 00:00 경계 테스트: `todayKst` 값이 정확히 전환 (유닛/통합 테스트).
- [ ] 응답 필드명이 `contracts/api-contract.yaml`과 정확히 일치 (KB: integration-001 원칙).

### be-004
- [ ] `POST /filters/:filterId/gen` 경로에서 앱이 slotId를 body/query로 보내도 무시/거절 (NEVER DO).
- [ ] 오늘 ACTIVE 슬롯 + `hasFreeUsedToday(userId)==false` → `priceApplied == 0`, `usedFreeQuota == true`, 크레딧 차감 0.
- [ ] `UserFreeQuota` 컬렉션: `(userId, quotaDate)` partial unique index (ACTIVE 상태에만) — DB `collection.indexes()` 검증 가능.
- [ ] 무료 사용 직후 두 번째 무료 시도 → DB 유니크 예외 포착 → `FREE_ALREADY_USED` 에러 코드 + `paidPrice` 반환 (유료 폴백).
- [ ] 생성 파이프라인 실패 → 에러 응답 + UserFreeQuota 레코드 제거(롤백) → 동일 유저 재요청 시 무료 적용 복원(BR-2).
- [ ] 동일 유저 동시 무료 시도(여러 기기) → 1건만 성공, 나머지 유료 폴백 (DB 유니크가 race 차단, AC 2.6.5).
- [ ] 23:59 시작 → 00:01 완료 경우, 생성 시점 KST 날짜로 재검증 수행 (AC 2.2.10).
- [ ] 미로그인 → 무료 적용 불가(기존 인증 체인 유지).
- [ ] 0원 처리 시 크레딧 차감 로그/분석 이벤트에 0 기록 (BR-15 미위배).

## Verification Method
- **`/free-tab` 응답 shape**: integration test + contract test (api-contract.yaml 대조).
- **폴백 경로**: 시나리오 3종 seed (오늘 ACTIVE / 어제 EXPIRED만 / 전무) → 응답 verify.
- **`freeUsedToday` 로직**: UserFreeQuota 상태별 seed(in-progress/completed/failed) → true/false 판정.
- **구앱 호환**: `X-App-Version` 미전달 / 낮은 버전 / 높은 버전 3케이스 → 응답 shape diff 테스트.
- **DB 유니크**: Mongoose `collection.indexes()`에서 partialFilterExpression 확인. 중복 insert MongoServerError 검증.
- **무료 소진 감지**: 무료 1회 + 2회 호출 시나리오 → 2번째가 FREE_ALREADY_USED + 유료 가격.
- **롤백**: 생성 파이프라인 실패 mock → UserFreeQuota 제거 검증 + 재시도 성공 검증.
- **KST 경계**: clock mock(dayjs mock or fake timer)으로 23:59 시작 / 00:01 완료 시뮬레이션.
- **동시성**: 동일 userId 병렬 2회 insert → 1 성공 + 1 duplicate key error 검증.

## Edge Cases (Evaluator 탐색 필수)
- `X-App-Version` 비정상 값 ("beta", null, invalid semver) → 보수적으로 legacy shape 반환.
- ACTIVE 슬롯에 themeTag 없는 필터가 섞여 있는 경우(마이그레이션 미적용) → 스케줄러 필터링에 의존. 방어 코드 유무.
- `requiredCredit` 계산에서 `freeUsedToday==true` 전이 후 응답 동시성 (응답 중 다른 요청이 무료 사용) → 스냅샷 일관성.
- 유료 폴백 경로에서도 `priceApplied` 값이 존재하는지 (null 금지).
- 생성 파이프라인 실패 정의(HTTP 5xx vs 외부 API timeout vs 응답 거부) 각각 롤백 동작.

## Lessons from Group 001 (이월 반영)
- `recentlyRostered`와 슬롯 조회는 KST-day 기준 — `/free-tab` 응답의 `rosterDate`도 KST day(YYYY-MM-DD) 직렬화.
- themeTag는 서버 내부 전용(BR-12)이지만 `FilterSummary.themeTag`로 노출은 허용됨 (API contract 명시).
- Slack webhook 미설정은 log-only. 운영 투입 전 env 체크리스트 필요 (본 Contract 범위 밖, 운영 작업).

## Sign-off
- Sprint Lead 자체 서명(2026-04-14): Evaluator가 직전 group-001 PASS, 본 Contract는 task spec과 api-contract.yaml에서 직접 파생되어 이견 여지 최소. 구현 중 이견 발생 시 Evaluator fix loop에서 교정.
