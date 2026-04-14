# Evaluation Report: Group 002 (free-tab-diversification)

## Summary
- Verdict: **ISSUES**
- Tasks evaluated: be-003 (`GET /free-tab`, `GET /filters` v2 usage, 구앱 호환), be-004 (생성 슬롯 자동 매핑 + UserFreeQuota partial unique + KST 재검증 + rollback)
- Severity tally: Critical 0, **Major 2**, Minor 4

## Build Check
- TypeScript (`tsc -p apps/meme-api/tsconfig.app.json --noEmit`): **PASS** (no errors)
- Tests (`npx nx test meme-api --testPathPattern=...`): **PASS** (698/698, 84 suites)
- Warning: Mongoose duplicate index `{userId:1}` on `user_free_quotas` (@Prop `index:true` + compound `userId+status+quotaDate`) — 비차단성.

## Contract Verification

### be-003 Done Criteria
- [x] `/free-tab` 200 응답 필드 (filters[] orderIndex 오름차순, usage.freeUsedToday, usage.rosterDate):
  - `filter-query-app.service.ts:144-196` → slots orderIndex 재정렬(`line 193`), FreeTabResponseDto 구조 일치.
- [x] 오늘 ACTIVE 10개 반환 + `rosterDate == todayKst`:
  - `filter-query-app.service.ts:148-149, 165` → todaySlots.length > 0 이면 rosterDate = todayKst.
- [x] 어제 EXPIRED 폴백 (read-only):
  - `line 151-159` → `findByDate` 호출 후 status==EXPIRED 필터 정렬. 상태 변경 API(expire/activate) 호출 없음.
- [x] 오늘/어제 모두 없음 → `filters: []`:
  - `line 168-170`.
- [x] `freeUsedToday` (in-progress/completed만):
  - `line 675-689` → `hasGeneratedTodayBatch`가 `status: [END, PROGRESS]`만 카운트 (`gen-meme.service.ts:1436`). BR-2 준수.
- [x] 미로그인 → `freeUsedToday=false`:
  - `line 676` guard.
- [x] `GET /filters` v2 usage + themeTag:
  - `line 81-105 (readListV2)` + `line 402-435 (enrichFilters with rosterContext)`.
- [x] 구앱 호환 (`X-App-Version` 누락/비정상/낮음):
  - `check-version.ts:57-62` (invalid semver → false) + `applyLegacySingleFreeTagConstraint` (`line 696-708`).
- [x] KST 00:00 경계:
  - `dayjs().tz(KST).startOf("day")` 사용 (`line 710-712`). 유닛 테스트 `filter-query-app.service.spec.ts:670-678`.
- [x] 응답 필드명 api-contract 일치 (신규 필드):
  - `FreeUsageStateDto {freeUsedToday, todayKst, rosterDate}` ✓
  - `FreeTabResponseDto {usage, filters}` ✓
  - `FilterResponseDto.themeTag` (`filter-response.dto.ts:161-166`) ✓

### be-004 Done Criteria
- [x] slotId body/query 무시/거절:
  - `filter.controller.ts:257-272` `assertNoSlotIdentifiers`. FORBIDDEN_KEYS = `["slotId","freeSlotId","rosterSlotId"]`.
- [x] 오늘 ACTIVE + freeUsedToday==false → 0원 + usedFreeQuota==true + 크레딧 차감 0:
  - `filter-creation-app.service.ts:86-119` (reserveFreeQuota) + `gen-meme.service.ts:1379-1413` (deductCredit: freeQuotaApplied → amount=0, event emit `usedCredit:0`).
- [x] `(userId, quotaDate)` partial unique (ACTIVE only):
  - `user-free-quota.schema.ts:47-55` partialFilterExpression `{status: ACTIVE}`.
- [x] 2번째 무료 → DB 유니크 예외 → `FREE_ALREADY_USED` + `paidPrice`:
  - `user-free-quota-domain.service.ts:104-110` (code==11000 감지) + `filter-creation-app.service.ts:104-112` (HttpException CONFLICT).
- [x] 파이프라인 실패 → UserFreeQuota 롤백 (workflow/new model):
  - `filter-creation-app.service.ts:120-136` catch + `content-generation-app.service.ts:408-419` handleError.
- [ ] 파이프라인 실패 → UserFreeQuota 롤백 (**레거시 모델**): **ISSUE (Major-1)**.
- [x] 동시 무료 시도 → 1건 성공 + 나머지 유료 폴백:
  - Partial unique index가 DB 레벨 race 차단. Test: `user-free-quota-domain.service.spec.ts:163-185`.
- [x] KST 23:59 → 00:01 재검증:
  - `filter-creation-app.service.ts:84` `resolveTodayKst()` (생성 시작 시각 기준). Test fake-clock: `user-free-quota-domain.service.spec.ts:188-215`.
- [x] 미로그인 → 무료 불가:
  - `filter.controller.ts:196-202` `@UseGuards(LibUserGuard)` — 로그인 강제.
- [x] 0원 기록 (BR-15):
  - `gen-meme.service.ts:1393-1411` — amount=0여도 `deductCredit` + 이벤트 emit `usedCredit: amount`.

## Issues

### 1. **[Major]** 레거시 모델 경로에서 생성 파이프라인 실패 시 UserFreeQuota 롤백 누락 (BR-2)
- File: `apps/meme-api/src/domain/gen-meme/gen-meme.service.ts:168-244` (setContentError) — UserFreeQuotaDomainService 참조 없음.
- Files affected: 17개의 `setContentError` 호출 지점 (`generate`, `imageGenerate`, `videoGenerate`, `finishGeneratingVideoFalAi`, `finishGeneratingVideo`, `finishGeneratingImage` 등 모든 legacy callback/polling 경로).
- Expected: AC line 44 "생성 파이프라인 실패 → 응답 에러 + UserFreeQuota 레코드 제거". BR-2 "실패 종료된 건은 포함하지 않는다" — 재시도 복원.
- Actual: 신규 workflow/new model 경로(`ContentsGenerationAppService.handleError`)는 `markQuotaFailedByContentId` 호출(line 410). 그러나 legacy `GenMemeDomainService.setContentError`에서는 Content → ERROR 전이, refund, mixpanel 추적만 수행. UserFreeQuota는 ACTIVE 유지 → 다음날까지 유저 무료 차단.
- Reproduction:
  1. 무료 로스터에 IMAGE_MODEL.FLUX_KONTEXT_PRO 또는 GEMINI_2_5_FLASH_IMAGE 기반 필터 편성 (LEGACY_MODEL_CONFIG only, `FAL_AI_MODEL_INPUT_MAP` 외 → `isNewModel(model)==false` + `isWorkflowFilter==false`).
  2. 해당 필터로 무료 생성 요청 → `filter-creation-app.service.ts:168-170`이 `genMemeDomainService.generate`로 라우팅 → `return` 후 quota contentId attach.
  3. fal-ai / fireworks / pixverse callback에서 실패 응답(`status !== "SUCCESS"` / timeout / policy block) → `setContentError` 호출 → Content ERROR + refund.
  4. UserFreeQuota ACTIVE 상태 유지.
  5. 동일 유저 재시도 → `reserveFreeQuota` → DuplicateKey → `FREE_ALREADY_USED` + 유료 가격 응답 (사용자는 실패했음에도 오늘 무료 기회 소진됨).
- Impact: 무료 로스터가 legacy 모델을 편성한 경우, 콜백 실패 시나리오에서 유저의 하루 무료 기회가 실제로 실패한 생성에 의해 소진됨. BR-2 위반. 현재 `/free-tab` 응답(content-based)은 `freeUsedToday=false`로 내려가므로 UX 불일치도 발생.
- Direction: `gen-meme.service.ts:setContentError` 서명에 `UserFreeQuotaDomainService` 주입 → Content ERROR 전이 후 `markQuotaFailedByContentId(contentId)` 호출. 또는 `GenMemeDomainService.generate` 반환 전에 `try/catch`로 감싸 상위 `FilterCreationAppService`로 에러 전파하고 그쪽 롤백 경로 활용.

### 2. **[Major]** 어제 폴백 슬롯 응답에서 `requiredCredit=0`이 내려가지만 실제 생성은 유료 (API/생성 로직 불일치)
- File: `apps/meme-api/src/application/filter/filter-query-app.service.ts:177-183, 410-421`.
- Expected: Sprint Contract line 18 "`FilterSummary.requiredCredit`: 오늘 ACTIVE 슬롯 + `freeUsedToday==false` → 0, 그 외 기본 가격." 어제 폴백은 "그 외 기본 가격".
- Actual: `readFreeTab`이 어제 EXPIRED 슬롯을 `rosterSlotMap`에 넣어 `RosterContext`로 전달 (`line 176-180`). `enrichFilters`의 `isFreeByRoster = !!rosterSlotMap.get(filter.id) == true` → `rosterBlocksFree=false` (freeUsedToday=false 가정) → `hasGeneratedToday=false` → `buildFilterResponse`가 `requiredCredit=0` 생성.
  그러나 실제 생성 경로(`filter-creation-app.service.ts:86`) `isFreeEligibleFilter(filterId, quotaDate=오늘)`는 **오늘 ACTIVE**만 조회 → 어제 폴백 filterId는 포함되지 않음 → `eligibleForFree=false` → legacy 경로로 진행. 필터에 `tags:["free"]`가 없으면 유료 차감.
- Reproduction:
  1. 오늘 스케줄러 실패로 오늘 ACTIVE 슬롯 0개, 어제 EXPIRED 슬롯만 존재.
  2. `GET /free-tab` (신규 앱) → `filters[].requiredCredit == 0`, `rosterDate == 어제` 반환.
  3. 유저가 0원 표시 확인 후 `POST /filters/:id/gen` → 서버가 유료 처리(기본 가격 차감). 응답 `priceApplied: N`.
- Impact: UI가 "0원"으로 노출된 필터에서 실제 생성 시 크레딧이 차감됨. 사용자 분쟁 위험. Contract 정의 위반.
- Direction: `readFreeTab`에서 폴백 경로(`rosterDate != todayKst`)일 때 `rosterSlotMap`을 빈 맵으로 전달 or `enrichFilters`가 `rosterDate != todayKst`면 `requiredCredit=basePrice`를 강제. 혹은 BR-13/18을 재해석 해 어제 폴백 필터도 무료 허용이면 `filter-creation-app.service.ts:isFreeEligibleFilter`를 확장. 어느 쪽으로 정하든 응답-생성 일치 필요.

### 3. **[Minor]** be-003의 `computeFreeUsedToday`가 `UserFreeQuotaDomainService.hasFreeUsedToday`를 사용하지 않음 (통합 일관성)
- File: `filter-query-app.service.ts:668-689` (주석 line 672 “be-004 UserFreeQuota 컬렉션 도입 전까지 content 기반” — 도입 후에도 content 기반 유지).
- Expected: be-004 도입 후 be-003이 UserFreeQuota를 조회해 응답/생성 로직이 단일 진실원(Single Source) 사용.
- Actual: be-003은 `hasGeneratedTodayBatch` (Content status 기반), be-004는 `UserFreeQuota` (reserveFreeQuota). Issue #1(롤백 누락)과 결합 시 UX 불일치 발생(응답 freeUsedToday=false ↔ 실제 409 FREE_ALREADY_USED).
- Impact: 현재는 두 소스가 거의 동일한 결과를 내지만, BR-2 롤백 누락 + 주석 line 682-683 (“legacy free 태그 포함” 이 실제 코드엔 미반영) 등 일관성 침식 여지.
- Direction: `computeFreeUsedToday`를 `userFreeQuotaDomainService.hasFreeUsedToday(userId, todayKst)`로 대체 + 주석 정리.

### 4. **[Minor]** `computeFreeUsedToday` 주석과 코드 불일치 (line 682-683)
- File: `filter-query-app.service.ts:682-684`.
- 주석: "legacy 'free' 태그 필터도 포함 — roster 에 없는 legacy free 필터 생성도 오늘의 무료 소진으로 본다".
- 실제: `candidateIds = new Set<string>(rosterFilterIds)` (roster만).
- 영향: 미래 코드 수정 시 오해 유발. Action: 주석 삭제 또는 의도에 맞게 legacy free filterId 수집 로직 추가.

### 5. **[Minor]** `UserFreeQuota` 스키마 `{userId: 1}` duplicate index 경고
- File: `user-free-quota.schema.ts:19, 58`.
- `@Prop({ ..., index: true })` + `schema.index({userId:1, status:1, quotaDate:1})`. Mongoose duplicate warning.
- Direction: @Prop에서 `index: true` 제거 (compound index에 이미 prefix 포함).

### 6. **[Minor]** `/free-tab` 응답 중 쿼리 2회 사이 다른 요청의 무료 소비 시 스냅샷 불일치 (문서화 권고)
- `readFreeTab`: `findActiveByDate` → `computeFreeUsedToday(hasGeneratedTodayBatch)` 두 쿼리 사이 race window. 읽기 API라 실질 영향은 적지만 Sprint Contract edge case "freeUsedToday==true 전이 후 응답 동시성 (응답 중 다른 요청이 무료 사용) → 스냅샷 일관성" 명시.
- Direction: `Promise.all` 시작-시각 기준 ± 수 ms 범위 일관성 허용 문서화 또는 단일 transaction 처리.

## Edge Cases Explored

| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| 오늘 ACTIVE 슬롯 10개 | orderIndex 오름차순 + rosterDate==오늘 | line 193 재정렬 | PASS |
| 오늘 없음 + 어제 EXPIRED | 어제 슬롯 + rosterDate==어제, read-only | `findByDate` read-only | PASS |
| 오늘/어제 모두 없음 | `filters:[]` + 200 | line 168-170 | PASS |
| Guest 유저 `/free-tab` | freeUsedToday=false, 필터 requiredCredit=0 | line 676 guard + `isFreeByRoster && !freeUsedToday` | PASS |
| `X-App-Version` 누락 | usage/themeTag 생략, legacy free 태그 1개만 | `check-version.ts:58` + `applyLegacySingleFreeTagConstraint` | PASS |
| `X-App-Version` "beta" | legacy shape | `extractVersion` regex → null → false | PASS |
| `X-App-Version` "1.2.99" | legacy shape | isSmallerVersionThan(1.2.99, 1.3.0)==true → false | PASS |
| `X-App-Version` ≥ 1.3.0 | usage + themeTag 포함 | PASS (test line 731-751) | PASS |
| DB partial unique 검증 | `(userId, quotaDate)` where ACTIVE | schema.spec.ts 통과 | PASS |
| Race: 병렬 2회 무료 insert | 1 성공 + 1 DuplicateKey | test line 163-185 | PASS |
| 2번째 무료 시도 | 409 FREE_ALREADY_USED + paidPrice | test line 264-285 | PASS |
| KST 23:59 → 00:01 | 생성 시작 시각 KST | `resolveTodayKst(Date)` + test line 188-215 | PASS |
| slotId body/query 거절 | 400 slot_identifier_not_allowed | test line 155-175 (filter.controller.spec) | PASS |
| 0원 기록 | deductCredit amount=0 + event usedCredit=0 | gen-meme.service.ts:1393-1411 | PASS |
| **레거시 모델 콜백 실패** | UserFreeQuota FAILED 롤백 | setContentError가 UserFreeQuota 미참조 | **FAIL (Issue #1)** |
| **어제 폴백 필터 생성** | UI 0원과 실제 과금 일치 | 응답 0원 ↔ 실제 basePrice 차감 | **FAIL (Issue #2)** |
| 유료 폴백에서 priceApplied 존재 | priceApplied=N (null 아님) | `CreateMemeResponse`는 non-nullable + `deductCredit`이 amount 보장 | PASS |
| themeTag 없는 필터 혼입 | 방어: scheduler assertCanAssignThemeTag | free-filter-slot-domain.service.ts:54-69 | PASS |

## Notes

- be-001/002 Group 001에서 지적된 minor 중 "Step 2 fallback이 yesterdayActive 있어도 no-op"은 여전히 유효하나 be-003 폴백 경로가 어제 EXPIRED를 직접 읽기로 처리해 사용자 영향 없음.
- 로스터 스케줄러는 이미지 단일 입력만 테마 할당(BR-4) — `filterIdsWithThemeTagAssignable` 방어 코드 존재. 운영에서 스케줄러 통과분만 오늘 ACTIVE가 되므로 themeTag 누락 필터 혼입 위험 낮음.
- `gen-meme.service.ts`의 `deductCredit`에는 legacy `filter.tags.includes("free")` 경로가 남아 있어 구앱 호환과 이중 판정이 공존. 향후 cleanup 대상(본 Group 범위 외).
- `X-App-Version` 헤더 네이밍이 controller에서 `app-version`(`@Headers("app-version")`) 사용 중. HTTP 헤더가 case-insensitive이므로 동작상 문제 없음. 통일 필요 시 별도 이슈.

## Verdict

**ISSUES** — Critical 0, Major 2 (Issue #1 BR-2 legacy rollback 누락, Issue #2 어제 폴백 필터 requiredCredit 과다 노출). Group 002를 병합/릴리스하기 전에 두 Major를 수정할 것을 권고. 나머지 Minor 4건은 기술 부채로 로그하고 이후 정리 가능.

---

## Fix Loop #1 Re-evaluation

- 평가 시각: 2026-04-14 KST
- 브랜치 HEAD: `10d8acb6` (merge: Group 002 fix loop #1)
- Fix 커밋:
  - `3ff2a331` — Major 1 legacy rollback (`gen-meme.service.ts` + `gen-meme.module.ts` + `set-content-error.spec.ts`)
  - `9482be57` — Major 2 yesterday fallback pricing (`filter-query-app.service.ts` + `filter-query-app.service.spec.ts`)

### Build Check (post-fix)
- `tsc -p apps/meme-api/tsconfig.app.json --noEmit`: **PASS** (무출력).
- `jest apps/meme-api/src --passWithNoTests`: **PASS** (83 suites, 679 tests). 원본보다 테스트 수 감소는 파일 수 변동 없음 — 이전 698 수치는 기본값(전체 프로젝트). 같은 범위(meme-api/src) 기준 679 전부 통과.

### Major 1 (BR-2 legacy rollback) — 해결 확인

- `GenMemeDomainService.setContentError` (`gen-meme.service.ts:170-261`): `atomicTransitionToError → refundByContentId → rollbackFreeQuotaByContentId → eventEmitter.emitAsync(GENERATION_STATUS_CHANGED)` 순서. 롤백은 `try/catch`로 감싸 실패해도 후속 이벤트/푸시 진행 (에러 격리).
- `rollbackFreeQuotaByContentId` (line 268-274): `userFreeQuotaRepository.findActiveByContentId(contentId)` → 존재 시 `markFailedById(quota.id)`. 비존재 시 no-op.
- `UserFreeQuotaRepository` 주입: `gen-meme.service.ts:85` constructor, 모듈은 `gen-meme.module.ts:58` `UserFreeQuotaPersistenceModule` 추가. DI 올바름.
- 레이어 규칙 준수: Domain → Persistence (`UserFreeQuotaRepository`) 경로 사용. `UserFreeQuotaDomainService` 의존 회피로 **Domain → Domain 금지 룰(`layer-rules.md:30`) 위배 회피**. 정확한 선택.
- 신규 workflow 경로(`ContentsGenerationAppService.handleError:408-419`)는 `userFreeQuotaDomainService.markQuotaFailedByContentId`를 호출하며, 내부적으로 동일하게 `findActiveByContentId + markFailedById`를 수행(`user-free-quota-domain.service.ts:129-135`). → **양쪽 동일 rollback source.** 코드 중복은 있으나 레이어 제약으로 인한 합리적 trade-off.
- 단위 테스트 `set-content-error.spec.ts:104-159`: (a) ACTIVE 존재 → FAILED 전이, (b) ACTIVE 없음 → no-op, (c) repo 실패 → warn 로그 + 후속 이벤트 지속, (d) `atomicTransitionToError=false` → 롤백 시도 없음. **4건 모두 PASS.**
- 20개 legacy `setContentError` 호출 지점(fireworks/fal-ai/pixverse/polling 등)이 모두 같은 private 메서드로 수렴 → **fix 범위 포괄.**

### Major 2 (yesterday fallback pricing) — 해결 확인

- `RosterContext` 타입 확장 (`filter-query-app.service.ts:59-62`): `todayActiveSlots`(pricing 전용) + `displaySlots?`(UI 표시 전용).
- `readFreeTab` (line 180-188): `isTodayRoster = rosterDate === todayKst`. 어제 폴백일 때 `todayActiveSlots = new Map()` (empty), `displaySlots = slotMap` (폴백 슬롯 포함).
- `enrichFilters` (line 410-447):
  - `rosterSlotMap = rosterContext?.todayActiveSlots` — pricing 판정.
  - `displaySlotMap = rosterContext?.displaySlots ?? rosterSlotMap` — themeTag 표시.
  - `isFreeByRoster = !!rosterSlot` (line 424) — pricing 맵 기준.
  - `themeTag: rosterContext ? displaySlot?.themeTag : undefined` (line 447) — display 맵 기준.
- 어제 폴백 시나리오 흐름:
  - 오늘 ACTIVE=0, 어제 EXPIRED 존재 → `rosterDate=어제` → `todayActiveSlots=Map{}`.
  - 유저의 filter(roster-only, no legacy "free" 태그) → `isFreeByRoster=false`, `isFreeFilter=false` → `requiredCredit=basePrice`.
  - `displaySlot.themeTag` 는 유지되므로 UI에서 테마 노출 보존.
- Sprint Contract 일치 확인: "오늘 ACTIVE 슬롯 + `freeUsedToday==false` → 0, 그 외 기본가" — 어제 폴백은 "그 외" → basePrice. **Contract 준수.**
- 생성 경로 정합성 확인: `filter-creation-app.service.ts:86` `isFreeEligibleFilter(filterId, todayKst)` → 오늘 ACTIVE만 조회 → 어제 폴백 filterId 미포함 → `eligibleForFree=false` → `reserveFreeQuota` 스킵 → `deductCredit`에서 `usedFreeQuota=false` → basePrice 차감. **API `requiredCredit` ↔ 실제 차감 일치.**
- 단위 테스트 `filter-query-app.service.spec.ts:597-656`: (a) 로그인 어제 EXPIRED 폴백 → `requiredCredit=50` + `themeTag=THEME_TAG.PET` 보존, (b) 게스트 어제 EXPIRED 폴백 → `requiredCredit=50`. **2건 PASS.**

### 회귀 체크

| 회귀 시나리오 | 예상 | 실제 | Status |
|--------------|------|------|--------|
| 오늘 ACTIVE + freeUsedToday=false | requiredCredit=0 | spec line 701 PASS | PASS |
| 오늘 ACTIVE + freeUsedToday=true | requiredCredit=basePrice | spec line 684 PASS | PASS |
| 오늘 ACTIVE 슬롯 orderIndex 정렬 | 오름차순 | spec line 727 PASS | PASS |
| 어제 EXPIRED 폴백 + 로그인 | requiredCredit=basePrice + themeTag 보존 | spec line 626-628 PASS | PASS |
| 어제 EXPIRED 폴백 + 게스트 | 동일하게 basePrice | spec line 655 PASS | PASS |
| 오늘/어제 모두 없음 | filters:[] | spec line 664 PASS | PASS |
| 구앱(<1.3.0) legacy shape | usage 생략, themeTag 생략, 단일 free 태그 | spec line 760-789 PASS | PASS |
| `setContentError` Content ERROR 전이 | 기존 동작 유지 | spec line 50-53 PASS | PASS |
| `setContentError` refund | 기존 동작 유지 | spec line 52 PASS | PASS |
| `setContentError` 이미 전환된 경우 refund skip | no-op 유지 | spec line 60-62 PASS | PASS |
| `setContentError` GENERATION_STATUS_CHANGED emit | 유지 | spec line 96-99 PASS | PASS |
| `setContentError` 이미 전환 → rollback 시도 없음 | no-op | spec line 154-157 PASS | PASS |
| 레거시 `filter.tags.includes("free")` + 어제 폴백 | API 0원 ↔ 생성 0원 (`usedFreeQuota=true`) | `deductCredit:1407-1416` 경로 일치 | PASS (사전 정합성 유지) |

### Fix Loop Verdict

**PASS** — Major 2건 해결 확인, 회귀 없음, 빌드/테스트 통과.

- Major 1: 중앙화된 `setContentError` 롤백 + 레이어 규칙 준수(Domain→Persistence) + 4개 단위 테스트 커버리지. 20개 legacy 콜백 사이트 모두 포괄.
- Major 2: `todayActiveSlots`/`displaySlots` 분리로 API 응답과 생성 로직 정합성 복구. Sprint Contract 일치. 2개 단위 테스트 커버리지.
- 원본 Minor 4건(#3~#6)은 fix 범위 밖으로 의도적으로 제외 (기술 부채 로그 상태 유지). Caution 압력 기준 verdict에 영향 없음.
- 추가 관찰(verdict 영향 없음): legacy 경로 롤백이 `UserFreeQuotaRepository`를 직접 호출하는 코드 중복은 Domain→Domain 금지 제약을 회피한 결과. 향후 rollback 로직을 `UserFreeQuotaRepository`의 `markFailedByContentId(contentId)` 단일 메서드로 리팩터(두 쿼리를 repo에 집약)하면 중복 제거 가능 — 본 fix loop 범위 외.

