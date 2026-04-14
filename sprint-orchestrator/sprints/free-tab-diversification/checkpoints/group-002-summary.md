# Group 002 Summary: free-tab-diversification

## Scope
- Tasks: be-003 (GET /free-tab + GET /filters v2 usage + 구앱 호환), be-004 (생성 슬롯 자동 매핑 + UserFreeQuota partial unique + KST 재검증 + 롤백)
- Endpoints: `GET /free-tab`, `GET /filters` (v2), `POST /filters/:filterId/gen` (수정), `POST /__test__/free-roster/*`

## Result: PASS (Fix Loop #1 후)
- Fix loops: 1
- Evaluator verdict: Initial ISSUES (Major 2) → Fix Loop #1 PASS
- Tests: 83 suites / 679 tests

## Issues Found & Resolved
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | Major | BR-2 legacy 모델 롤백 누락 — `setContentError`가 UserFreeQuota 미정리 | `GenMemeDomainService.rollbackFreeQuotaByContentId` private helper 도입, `UserFreeQuotaRepository` 주입 (Domain→Persistence). 모든 legacy 콜백 사이트 자동 커버 (`3ff2a331`) |
| 2 | Major | 어제 폴백 filter `requiredCredit=0` 과다 노출 — UI/생성 불일치 | `RosterContext`를 `todayActiveSlots`(pricing) + `displaySlots`(themeTag) 분리. 폴백 시 pricing은 basePrice, themeTag만 유지 (`9482be57`) |
| 3 | Minor | `computeFreeUsedToday` UserFreeQuota 미사용 (content 테이블 기반) | 이월 — be-004의 UserFreeQuota와 통합 일관성 follow-up |
| 4 | Minor | Mongoose duplicate index warning (user-free-quota.schema) | 이월 |
| 5 | Minor | `/free-tab` 쿼리 사이 race window | 이월 — 문서화 권고 |
| 6 | Minor | 주석/코드 불일치 (computeFreeUsedToday line 672/682-683) | 이월 |

## Lessons for Next Group
- App은 `X-App-Version` 헤더를 모든 무료탭 관련 호출(`/free-tab`, `/filters`, `/filters/:id/gen`)에 전송 필수. 앱 빌드 버전 파싱 규칙 확인.
- `FREE_ALREADY_USED` 에러 코드(409) 수신 시 앱은 유료 confirm 시트를 열어야 함 (app-003 범위).
- 무료 사용 여부 표시는 `/free-tab.usage.freeUsedToday` 응답 기반. 앱에서 local state로 덮어쓰지 말 것.
- 폴백 응답(`rosterDate != 오늘`)에서는 `requiredCredit`이 basePrice로 내려옴 → 앱 UI는 가격 기반 배지 처리 (무료 슬롯은 requiredCredit==0 필터만).
- `slotId`류 필드는 요청 body/query에서 금지 (BR-12). 앱은 filterId만 전송.
- `themeTag` 필드 존재 시 연령대/테마 분류 UI 사용 가능, 없으면 legacy 표시.

## Files Changed (sprint branch 반영, 누적)
- Controllers: `free-tab.controller.ts`, `free-roster-test.controller.ts`, `filter.controller.ts`(수정)
- Application: `filter-creation-app.service.ts`, `filter-query-app.service.ts`, `content-generation-app.service.ts`, `free-tab-response.dto.ts`, `free-usage-state.dto.ts`, `free-already-used-error.dto.ts`, `create-meme-request.dto.ts`, `create-meme-response.dto.ts`, `filter-app.module.ts`
- Domain: `user-free-quota/` (service/module/interface/test), `gen-meme.service.ts`(수정), `gen-meme.module.ts`(수정), `deduct-credit.spec.ts`, `set-content-error.spec.ts`
- Persistence: `user-free-quota/` (schema/repo/mapper/module/test)
- Constant: `user-free-quota.constant.ts`
- Util: `check-version.ts` + test

## Commits
- `0d6e2830` — be-003 GET /free-tab + filters v2 usage + 구앱 호환 (+911/-13)
- `4985cda1` — be-004 generation slot mapping + UserFreeQuota + rollback (+1190/-30)
- `3ff2a331` — fix: Major 1 legacy setContentError → rollback UserFreeQuota
- `9482be57` — fix: Major 2 yesterday fallback pricing split (todayActiveSlots vs displaySlots)
- Merge commits: be-003/004 + fix merge
- Sprint branch HEAD: `zzem/free-tab-diversification`
