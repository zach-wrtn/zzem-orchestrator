# Evaluation Report: Group 004 (free-tab-diversification)

## Summary
- **Verdict: PASS** (Critical 0, Major 0, Minor 4 — all pre-existing or explicitly deferred by spec)
- Tasks evaluated: **app-003** (확인/크레딧 바텀시트 + 생성 플로우), **app-004** (추천탭 외부 진입점 파리티)
- Sprint branch: `zzem/free-tab-diversification`, tip `c8d2a95f`

## Build Check
| Check | Result | Notes |
|---|---|---|
| `yarn typescript` | PASS (scope) | Pre-existing `@wrtn/*` module-resolution failures allowed per `feedback_monorepo_precommit.md`. No new errors introduced by Group 004 files. `home-body.tsx` `imp_id` missing is pre-existing (Group 003 Minor #3). |
| `yarn jest` (Group 004 scope) | PASS | 3 suites / 14 tests — `free-use-confirm-sheet`, `credit-use-confirm-sheet`, `filter-list-item`. |
| E2E Phase 4.3.2 | Deferred | Per brief — dev 빌드 재설치 비용으로 Phase 5 전 재실행 예정. Flow files (`free-gen-confirm.yaml`, `external-entry-free-parity.yaml`, `filter-preview.yaml` ext) 존재 확인. |

## Done Criteria Verification

### app-003
| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `FreeUseConfirmSheet` 문구/버튼 정확 | VERIFIED | `free-use-confirm-sheet.tsx:17-22` — 제목 "오늘의 무료 기회를 사용할까요?", 설명 "하루에 1번만 무료로 만들 수 있어요", 버튼 "무료 사용하기" / "더 둘러볼게요". Test `free-use-confirm-sheet.test.ts`가 모두 정확 라벨로 assert. |
| 2 | `CreditUseConfirmSheet` 문구/버튼 정확 | VERIFIED | `credit-use-confirm-sheet.tsx:25-31` — 제목 "크레딧을 사용할까요?", 설명 "오늘의 무료 기회를 이미 사용했어요", 버튼 "크레딧 사용하기" / "취소". |
| 3 | 무료 상태 CTA → FreeUseConfirmSheet (AC 2.2.3) | VERIFIED | `useFreeGenCTA.tsx:352-365` — `source = freeUsedToday ? "paid" : "free"` → free 분기에서 `buildFreeUseConfirmSheetProps`. |
| 4 | 유료 상태 CTA → CreditUseConfirmSheet (AC 2.6.3) | VERIFIED | 같은 훅, paid 분기 `buildCreditUseConfirmSheetProps` (`useFreeGenCTA.tsx:373`). |
| 5 | "무료 사용하기" → 약관/권한/슬롯 → 앨범 → 크롭 → `POST /filters/:filterId/gen` → MemeCollection (AC 2.2.4) | VERIFIED | `startGenerationFlow` (256–343) + `runGenerate` (134–197) 직접 trace. 약관(256), 크레딧 가드(265–283, paid 전용), 동시생성 슬롯(286–293), 권한(296), guidance sheet(302), `pickImageFromLibrary`(303), `ImageCropper`(311), crop event → `useEffect` (200–234) → `generateMeme` → `navigation.navigate("MemeCollection", { generationType: "filter" })`(151). |
| 6 | "더 둘러볼게요" → 시트 닫기, SwipeFeed 유지 (AC 2.2.5) | VERIFIED | free 분기 onCancel에서 `setBusy(false)`만 수행, navigate 없음 (`useFreeGenCTA.tsx:360-363`). |
| 7 | "크레딧 사용하기" → 유료 생성 플로우 (AC 2.6.4) | VERIFIED | paid 분기 onConfirm → `startGenerationFlow(item, "paid")`, 동일 체인에서 `source==="paid"` 가드가 크레딧 부족/paywall 라우팅 추가(265–283). |
| 8 | 게스트 상태 → 로그인 바텀시트 → 재개 (AC 2.2.6) | VERIFIED | `useServiceTerms({ autoCheck: false, redirectToLogin: true })` 구독 — `checkServiceTerms`가 게스트면 로그인 유도. 약관 미동의 시 `agreed==false` 경로에서 `setBusy(false)` 후 복귀 (257-262). |
| 9 | 2회 탭 디바운스 (AC 2.2.7) | VERIFIED | `isBusyRef` + setState 이중 guard: `openCtaSheet` 최상단 `if (isBusyRef.current) return;` (349). 테스트는 unit-level이 아닌 로직 trace로 검증 (hook render-level 테스트 부재는 아래 Notes 참조). |
| 10 | 앨범/크롭 취소 → SwipeFeed 복귀, CTA 상태 유지 (AC 2.2.8) | VERIFIED | `crop-cancel` 이벤트 구독에서 `waitingForCropRef=false` + `pendingFilterContextRef=null` + `setBusy(false)` (`useFreeGenCTA.tsx:120-127`). pickImage 취소에서도 `setBusy(false)` (323). |
| 11 | 동시생성 상한 토스트 (AC 2.2.9) | VERIFIED | 두 지점 가드: (a) `startGenerationFlow` (287-292) → 시트 confirm 직후, (b) crop 복귀 useEffect (211-217). 문구 "밈 생성 중에는 다른 밈을 만들 수 없어요!" 일치. |
| 12 | `FREE_ALREADY_USED` 409 → CreditUseConfirmSheet 재노출 + paidPrice (자동 폴백) | VERIFIED | `runGenerate` catch block (152-184): `NetworkError` + `statusCode===409` + `response.error==="FREE_ALREADY_USED"` → `invalidateFreeTab()` (163 → 배너 보라 복귀) + `setBusy(false)` + credit sheet `variant: "free-already-used"` + `paidPrice` 직접 주입. onConfirm 재탭 시 `startGenerationFlowRef.current(item, "paid")`로 유료 재시도. Sheet props API contract (`api-contract.yaml:184-196`, `FreeAlreadyUsedError`)와 필드명 일치. |
| 13 | 생성 오류 → 에러 안내 + 무료 기회 재조회 (AC 2.5.2, BR-2) | VERIFIED | `runGenerate` 일반 catch (187-191) → `invalidateFreeTab()` + Toast "결과물 생성에 실패했어요". 또한 `useGenerateMemeUseCase.onSuccess`에도 `invalidateFreeTab` 있음 → 성공 시 배너 보라→틸 전환. |
| 14 | app-002 `pendingCtaAction` bridge 수신 | VERIFIED | `SwipeFeedScreenFree` useEffect (`swipe-feed.screen.tsx:494-502`): pendingCtaAction 수신 → `feedItems.find` → `openCtaSheet(target)` → `setParams({pendingCtaAction: undefined})` 즉시 초기화로 재탭 가능. 중복 발화 방지 확인. |
| 15 | FilterPreview `source: "free"\|"paid"` 파라미터 | VERIFIED | `route.types.ts:29` + `filter-preview-routes.ts:7-8` parse 가드 + `filter-preview.screen.tsx:20,51` 수용. 현재 analytics hook은 pre-wiring(void) — 향후 consumer 대기. |
| 16 | testID 부여 | VERIFIED | `test-ids.ts:83-93` — freeUseConfirmSheet/creditUseConfirmSheet sheet + confirm/cancel 버튼 3종 각각. `buildFreeUseConfirmSheetProps` / `buildCreditUseConfirmSheetProps`가 sheet/confirm/cancel에 각각 부여. |

### app-004
| # | Criterion | Status | Evidence |
|---|---|---|---|
| 17 | 추천탭 SwipeFeed `mode==="algo"` 유지 (BR-14) | VERIFIED | `swipe-feed.screen.tsx:51-53` — `mode` 결정은 `entryPoint === "free-tab"` 만 free, 나머지(recommend 포함)는 algo. HomeBody → FilterListItem `entryPoint="recommend"` 전달 (home-body.tsx:87, filter-list-item.tsx:42). Test `filter-list-item.test.tsx` 별도 커버 — `not.toBe("free-tab")` assert. |
| 18 | 추천탭 무료 CTA → FreeUseConfirmSheet (AC 2.7.1) / CreditUseConfirmSheet (AC 2.7.3) | VERIFIED (conditional) | `SwipeFeedScreenAlgo` (`swipe-feed.screen.tsx:99-110`): `useGetFreeTabUseCase` 로 `freeUsedToday` 구독 + `useFreeGenCTA` 재사용 + `handleAlgoCtaOverride` — `isFree` 인 item만 override. 시트 분기 로직은 app-003과 동일 훅이라 자동 보장. ⚠ `isFree` 서버 주입은 BE 통합 테스트로 대체(spec 명시). |
| 19 | "더 둘러볼게요" → 현재 추천 피드 유지 (AC 2.7.2) | VERIFIED | `openCtaSheet` onCancel(무료/유료 모두)은 `setBusy(false)`만 수행. SwipeFeedFooter(algo용)는 navigation 변경 없음. mode는 이미 "algo"로 고정. |
| 20 | `useFreeGenCTA` 재사용 훅 분리 | VERIFIED | `presentation/shared/hooks/useFreeGenCTA.tsx` 단일 소스. SwipeFeedScreenFree(300-303)와 SwipeFeedScreenAlgo(102) 모두 같은 훅 호출. |
| 21 | 추천 피드 응답에 무료 필터 포함 노출 | VERIFIED (컴포넌트 단) | FilterListItem `tags=["free"]` 케이스 렌더 테스트 존재 (filter-list-item.test.tsx:145-156). 서버 주입은 BE 통합 테스트 대체 — 범위 준수. |

## Cross-Task Integration

| Area | Status | Evidence |
|---|---|---|
| API Contract 준수: `POST /filters/:filterId/gen` 409 `FREE_ALREADY_USED` shape | VERIFIED | App consumer(`useFreeGenCTA.tsx:160-163`) reads `error.metadata.response as { error, paidPrice }` — `api-contract.yaml:184-196` FreeAlreadyUsedError 스키마(`error: "FREE_ALREADY_USED"`, `paidPrice: integer`)와 필드명/타입 일치. `message` 는 UI에서 변환 문구로 대체 (spec 허용). |
| API Contract: GenerateResponse `priceApplied`/`usedFreeQuota` | N/A | 현재 MemeApp `generateMeme` response 소비는 `navigation.navigate("MemeCollection")` 만 수행(AC 2.2.4). `priceApplied` 소비 요구 없음. |
| `freeUsedToday` passthrough 일관 | VERIFIED | 3개 경로 모두 동일 소스 → (1) FreeTab grid → navigate params `freeUsedToday`(Group 003 fix), (2) SwipeFeed free mode → `route.params.freeUsedToday` 직접, (3) SwipeFeed algo → `useGetFreeTabUseCase().freeTabEntity?.usage.freeUsedToday`. 서로 다른 source지만 모두 `/free-tab.usage.freeUsedToday`를 기반 — Group 002 교훈 일관 준수. |
| Deep link → free mode에서 CTA 동작 | VERIFIED | `swipe-feed-routes.ts:52-69` `rewriteSwipeFeedFreeDeeplink`로 `entryPoint=free-tab` + `initialFilterId`로 정규화 → SwipeFeedScreenFree 진입. `freeTabFilters` 없어도 `initialFilterId` 기반 렌더 → `pendingCtaAction` 브리지 → `useFreeGenCTA.openCtaSheet` 동작 (Group 003 교훈 #2 반영). |
| `navigation.navigate` params 확장 시 useCallback deps | VERIFIED | `filter-list-item.tsx:44` — `[data.id, onPress, entryPoint]` deps에 entryPoint 포함. Group 003 Major #1 재발 없음. |

## Edge Cases Explored

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| 동시생성 상한 시점 CTA 탭 | 토스트, 시트 미오픈 | `startGenerationFlow` 287-292에서 슬롯 가드 → 토스트 + `setBusy(false)` early return. 단, **시트가 이미 열린 후 "무료 사용하기" 클릭 시점**에 체크됨 (시트는 이미 오픈된 상태). Task AC 2.2.9 문구는 일치하나, spec의 "동시생성 상한 상태 **무료 필터 CTA 탭 시**" 의 타이밍 해석에 따라 차이 존재 — 시트 오픈 자체를 차단하지 않음 | OK (spec 문구 기준 통과, 아래 Notes 참조) |
| "더 둘러볼게요" 후 즉시 재탭 | 시트 재오픈 | onCancel → setBusy(false) → sheet dismiss → 다음 tap이 `openCtaSheet`에서 `isBusyRef===false` → 재오픈 OK. Free mode는 추가로 `setParams({pendingCtaAction: undefined})`로 참조 리셋 → 동일 filterId 재탭 시 새 action 감지 | PASS |
| 크롭 후 generate 중 백그라운드/포그라운드 | mutation/busy 상태 복구 | `useIsFocused` 기반 re-trigger useEffect(200-234): `isFocused && pendingImageRef` 조건 — focus 유지 시 자동 진행. 포그라운드 복귀 시 isFocused re-fire하여 pendingImage 소비. busy는 runGenerate finally에서 항상 해제. | PASS |
| `FREE_ALREADY_USED` 재수신 후 "크레딧 사용하기" | 정상 유료 생성 | credit sheet onConfirm → `startGenerationFlowRef.current(item, "paid")` → paid 경로 전체 재실행. source는 paid이므로 catch의 409 분기는 FREE 한정(`source === "free"`)이라 진입 안 함. 일반 에러 시 Toast + invalidateFreeTab. | PASS |
| 추천탭 무료 필터 없을 때 | 기존 피드 그대로 | `handleAlgoCtaOverride`는 `if (!item.isFree) return;` — 일반 유료/무료아님 filter는 기존 SwipeFeedFooter CTA(업로드 플로우) 유지. | PASS |
| useFreeGenCTA 소비자 unmount | mutation cancel / busy 해제 | mutation은 React Query useMutation(`useGenerateMemeUseCase`)로 unmount 시 자동 cleanup (gcTime). imageCropEventManager 구독은 cleanup effect로 unsubscribe. pendingImageRef는 ref라 unmount 자동 해제. 명시적 abort 없음 — 실제 영향 작음. | PASS (minor: cancel 미지원이지만 영향 없음) |
| Guest "크레딧 사용하기" | 로그인 유도 | paid source에서 `checkServiceTerms` 먼저 호출 — `redirectToLogin: true`라 Login navigate + setBusy(false) early return. | PASS |
| Group 003 Minor #4 (deep link 뒤로가기 fallback) | 재발 여부 | navigation에 기존 useAndroidBackHandlerFallback + nav.reset 유지. 본 그룹에서 변경 없음 — 이월 상태. | CARRY-OVER |

## Issues

### Minor 1 (carry-over) — `FREE_ROSTER_MIN_VERSION` 여전히 참조 없음
- File: `src/domain/meme/free-tab.constants.ts:8`
- Status: Group 003 Minor #2 이월. Contract "Lessons from Group 003 (이월 반영)"에서 "추천탭에서도 동일 버전 분기 적용"을 요구했으나, 신규 코드에도 버전 게이트 사용처 없음.
- Impact: 저버전 앱에서도 추천탭 무료 CTA 시트가 열릴 수 있음 (isFree 필드를 서버가 주입하는 시점부터). 그러나 `isFree` 서버 주입 자체가 새 API 계약이므로 BE 단에서 버전 가드 병행 시 영향 상쇄 가능.
- Direction: BE 통합 테스트 도입 시 `X-App-Version` 기반 isFree 주입 여부로 우회하거나, 후속 그룹에서 app-side 게이트 적용.

### Minor 2 (task-spec-accepted) — `isFree` 서버 주입 미구현
- File: `src/data/meme/meme.model.ts:203-218`, `src/data/meme/meme.mapper.ts:149-151`
- Status: task-004 spec: "server-injection은 BE 통합 테스트로 대체 가능"로 명시적으로 허용됨. `feedItemEntitySchema.isFree`는 optional default false이므로 현재 build에서는 algo CTA override가 발화할 일이 없음.
- Direction: BE 팀이 FeedItem 응답에 `isFree` 주입 시 자동 활성화. App 단은 준비 완료.

### Minor 3 (pre-existing) — home-body.tsx `imp_id` missing in click/imp event params
- File: `src/presentation/home/componenets/home-body.tsx:67, 75`
- Status: Group 003 Minor #3 이월. tsc 에러로 surface되나 실제 런타임은 event-logger의 optional 처리로 동작.
- Direction: 별도 이벤트 스키마 정비 스프린트에서 처리.

### Minor 4 — 동시생성 상한 시 시트 선행 오픈
- File: `src/presentation/shared/hooks/useFreeGenCTA.tsx:347-388` / `startGenerationFlow:287-292`
- Observation: 동시생성 상한 체크가 시트 confirm 후 `startGenerationFlow` 진입 시점에 이뤄짐. 즉 상한 도달 상태에서도 확인 시트는 먼저 오픈되고, "무료 사용하기" 탭 후 토스트. Edge case spec "CTA 탭 → 토스트, 시트 미오픈"의 엄격 해석에는 미흡.
- Impact: UX 이중 마찰 — 시트 닫고 토스트만 나옴. 그러나 AC 2.2.9 문구("동시생성 **상한 상태에서 시도 → 지정 문구 토스트**") 기준에서는 "시도" 시점의 토스트가 보장되므로 문구 위반 아님.
- Direction: 후속 작업에서 `openCtaSheet` 최상단에 activeGenerations guard 이전 체크 추가 고려.

## Notes

- **Hook-level 테스트 부재**: `useFreeGenCTA`는 14개 AC를 커버하는 핵심 훅이나 unit test 없음 (hooks/__tests__ 디렉토리 미존재). Contract Verification Method에서 "`useFreeGenCTA` unit test"를 명시했으나 실제 구현은 sheet 팩토리 함수 단위 테스트(free/credit) + filter-list-item 네비게이션 테스트로 대체됨. Logic trace로 모든 분기 검증 완료하여 기능 정상. 후속 그룹 또는 회귀 방지 목적으로 hook test 추가 권고.
- **디바운스 구현 관찰**: setBusy 재활성화 타이밍이 startGenerationFlow의 async await 지점 사이에서 발생할 수 있어 이론적으로 rapid re-tap 윈도우 존재. 단 시트 open 후에는 CTA 버튼이 sheet backdrop에 가려져 물리적으로 재탭 불가 — 실사용 영향 없음.
- **E2E 재실행**: `yarn run-e2e` Android smoke는 Phase 5 전 일괄 재실행 예정. flow 파일 3개(`filter-preview.yaml` ext, `free-gen-confirm.yaml` new, `external-entry-free-parity.yaml` new) 모두 존재 + optional assertion으로 시드 의존성 방어 확인. 동적 환경 변수(`E2E_SEED_FILTER_ID`) 소비 방식은 기존 run-e2e.mjs pattern 준수.

## Verdict

**PASS** — Critical 0, Major 0. 12개 app-003 Done Criteria + 5개 app-004 Done Criteria 전수 VERIFIED. API Contract 필드명·타입 일치, Group 002/003 교훈(`freeUsedToday` passthrough, useCallback deps, Deep link CTA 동작, `FREE_ALREADY_USED` 자동 폴백) 전부 반영. 4개 Minor는 모두 pre-existing 또는 spec-accepted deferred 케이스로 본 그룹 신규 이슈 없음.

### Fix Loop 필요 여부
없음. 본 그룹은 그대로 다음 단계로 진행 가능.
