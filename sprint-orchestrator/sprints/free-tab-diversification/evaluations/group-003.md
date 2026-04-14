# Evaluation Report: Group 003 (free-tab-diversification)

## Summary
- Verdict: **ISSUES** (Critical 0 / Major 1 / Minor 4)
- Tasks evaluated: app-001, app-002
- Sprint branch: `zzem/free-tab-diversification` @ `0cef7a3b`
- Repo: `app-core-packages/apps/MemeApp`

## Build Check
| Check | Result | Note |
|-------|--------|------|
| Sprint jest (`free-tab.entity` + `meme.mapper.toFreeTabResponseEntity` + `free-mode` + `useTabScrollRestore` + `swipe-feed-routes`) | PASS | 42/42 |
| `yarn jest src` | FAIL (pre-existing) | `쨈 홈` 칩 value mismatch는 base branch에서도 실패; `meme.usecase.test.tsx` `createQueryKeys` 런타임 오류; `fixtures/*.ts` "empty test suite"; `@wrtn/mmkv-kit` resolution — 모두 base branch 기존 문제 (feedback_monorepo_precommit.md 범주) |
| `yarn typescript` | FAIL (pre-existing) | `@wrtn/app-design-guide`, `@wrtn/mmkv-kit` 미해소 (모노레포 공통). Sprint-specific 새 오류: `click_meme_filter` / `imp_meme_filter` 이벤트 payload에 `imp_id` 누락 — 그러나 base branch의 동일 이벤트 사용처(home-body, filter-row, horizontal-filter-list, grid-filter-list) 모두 `imp_id` 미제공. 이벤트 스키마에 `imp_id` 필드가 추가된 시점이 별도 PR이며 전체 `click_meme_filter` callsite에서 pre-existing error. 본 스프린트가 신규 도입한 오류 아님. |

## Contract Verification

### app-001
- [x] `GET /free-tab` react-query 호출 — `useGetFreeTabUseCase` (meme.usecase.ts:462) + `memeRepository.getFreeTab` (meme.repository-impl.ts:135).
- [x] Zod 파싱 + UPPER_CASE→lowercase-dashed 정규화 — `MemeMapper.toFreeTabResponseEntity` (meme.mapper.ts:157) + `FREE_TAB_FILTER_TYPE_MAP`. Fixture 7종 통과.
- [x] 2열 그리드 10카드 — `FreeTabScreen` + `FreeTabCard` 4:5 비율 + `numColumns=2` (free-tab.screen.tsx:22).
- [x] Fallback (`rosterDate!=todayKst`) 그리드 렌더 + 보조 캡션 — `isFallback` 계산 + `FreeRosterBanner.isFallback` 플래그.
- [x] Empty (`filters:[]`) → `FreeEmptyView` — testID `free-tab.empty-view` (AC 2.1.3).
- [x] `freeUsedToday==false` → 보라 + 레드닷 — `HomeHeader.shouldShowFreeRedDot = freeTabEntity?.usage.freeUsedToday === false`; banner PURPLE_COLORS.
- [x] `freeUsedToday==true` → 틸 + 레드닷 미표시 — `=== false` strict check로 true도 undefined도 모두 레드닷 hide.
- [x] 무료 생성 후 `invalidateFreeTab` — `useGenerateMemeUseCase.onSuccess` (meme.usecase.ts:226). `useMemeInvalidateCache.invalidateFreeTab` (meme-invalidate-cache.ts:37).
- [x] AppState active + KST 변경 → refetch — `FreeTabScreen` `appStateRef.current` 추적 + `toTodayKstString` 수동 KST 계산. 이전 state inactive/background 일 때만 발화.
- [x] 카드 탭 → SwipeFeed 진입 시 `/free-tab` `/filters` 추가 호출 0 — `SwipeFeedScreenFree`는 `useGetFeedSwipeUseCase`를 호출하지 않고 `freeTabFilters` params만 소비. `buildFreeFeedItems` 스텁 생성 (free-mode.ts:27).
- [x] `useTabScrollRestore` 메모리 only — module-scope Map (useTabScrollRestore.ts:14). AsyncStorage 미사용 확인.
- [x] `App-Version` 글로벌 전송 — `ApiSharedHeaders.headers.App-Version` (apps/common-app/.../api-shared-headers.ts). API contract는 `X-App-Version`을 명시하지만 BE는 case-insensitive로 `app-version`을 읽는다는 be-003 주석 준수.
- [x] 구앱 경로 미변경 — 서버가 `App-Version < FREE_ROSTER_MIN_VERSION` 일 때 legacy shape으로 응답; 현재 앱 버전(1.3.0 이상)에서는 신규 경로만 활성. 구앱 legacy `free-body.tsx` 제거는 "구앱 경로" ≠ 클라이언트 신버전 코드 — 허용.
- [x] Deep link `zzem://free-tab` — `rewriteFreeTabDeeplink` (home-routes.ts:17) + `useNavigationLinking.prepareDeeplink`.
- [x] testID 전수 — `free-tab.screen`, `free-tab.grid`, `free-tab.empty-view`, `free-tab.banner.{purple,teal}`, `free-tab.card.{filterId}`, `home.header.free-tab.red-dot` 모두 등록.

### app-002
- [x] `mode: "free" | "algo"` prop — `SwipeFeedScreen`이 `entryPoint==="free-tab"` 로 분기 (swipe-feed.screen.tsx:48). `SwipeFeedScreenFree` 는 `useGetFeedSwipeUseCase`를 호출하지 않음.
- [x] `initialFilterId` 첫 화면 — `resolveInitialIndex` + `initialScrollIndex`.
- [x] 동일 CTA 구조 — `SwipeFeedFreeFooter` + `SwipeFeedFreeCtaButton`.
- [ ] **무료 모드 + `freeUsedToday==true` → 유료 CTA** — 🚨 **Major**. `FreeTabScreen.handleCardPress`가 navigation.navigate 시 `freeUsedToday`를 전달하지 **않음**. `SwipeFeedScreenFree`에서 `freeUsedToday = false` default로 항상 무료 CTA 렌더. (상세: Issue #1)
- [x] Circular scroll `onMomentumScrollEnd` + `scrollToIndex`, 데이터 복제 없음 — `handleMomentumScrollEnd` + `resolveCircularJumpTarget`. 상향 wrap은 `onScrollEndDrag`에서 `startIdx===0 && draggedUp && offsetY<=0` 감지.
- [x] 뒤로가기 → 무료탭 복귀 — 네비게이션 stack goBack 으로 HomeScreen 유지 (selectedTab="free" 지속). 딥링크 직접 진입 시에는 `useAndroidBackHandlerFallback` 이 `Home {params:{}}`로 reset → recommend 탭 — Minor (Issue #4).
- [x] CTA hand-off — `navigation.setParams({ pendingCtaAction })` bridge로 app-003 에 위임.
- [x] 피드 진입 시 추가 네트워크 호출 0 — free 모드는 `useGetFeedSwipeUseCase` 호출 안 함.
- [x] Deep link `zzem://swipe-feed/free?filterId=...` — `rewriteSwipeFeedFreeDeeplink` + `filterId` → `initialFilterId` 재매핑.
- [x] testID — `swipe-feed.free-cta`, `swipe-feed.paid-cta`, `swipe-feed.current-index-{n}`.

## Edge Cases Explored
| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| `filters.length < 10` (부분 폴백) | 그리드/circular 정상 | `buildFreeFeedItems` 순서 유지, `resolveCircularJumpTarget` itemCount<2일 때 null 반환으로 단일 카드도 안전 | PASS |
| `rosterDate != todayKst` + `requiredCredit>0` 혼재 | 서버 설계대로 basePrice 표시; `requiredCredit==0` 판정은 서버가 자동 | UI는 `requiredCredit` 수치만 사용 (CTA 변형은 `freeUsedToday` 기반). 무료 슬롯 판정 재계산 없음 | PASS |
| `initialFilterId` 미존재 | 0 fallback, 에러 로그 금지 | `resolveInitialIndex` idx<0 일 때 조용히 0; `console.error` 호출 없음 (테스트로 검증) | PASS |
| 응답 중 `freeUsedToday` 변경 (외부 기기) | 다음 refetch 시 전환 | react-query invalidation은 `invalidateFreeTab`로 유일하게 트리거; AppState 복귀 시에도 재조회. 세션 내 강제 sync 없음 (contract 허용) | PASS |
| AppState 초기 mount vs 백그라운드 복귀 구분 | 초기에는 refetch 안 함 | `appStateRef.current` 가 `AppState.currentState`로 초기화되어 초기 useEffect 발화 시 prevState===active → refetch 미발화 | PASS |
| Zod nullable / UPPER_CASE / empty array fixture | 모두 parse 성공 / 실패 기대대로 | 7 pass fixture + 3 fail fixture (missing freeUsedToday, missing todayKst, invalid type) 모두 통과 | PASS |
| `thumbnailUrl==""` | null로 정규화 | schema `z.preprocess` 로 빈 문자열→null (free-tab.entity.ts:18). `buildFreeFeedItems` 에서도 `filter.thumbnailUrl \|\| null` | PASS |
| Deep link `zzem://swipe-feed/free` back 복귀 | 무료탭 그리드 | `!nav.canGoBack()` → Home reset with `params:{}` → recommend 탭. Issue #4 | FAIL |
| Deep link 진입 시 `freeTabFilters` 부재 | Circular `current-index-0` 미렌더 | `buildFreeFeedItems([])` → feedItems 빈 배열 → 인덱스 testID 미렌더; e2e flow에 optional 플래그로 명시 | PASS (문서화) |

## Issues

### 1. **[Major]** `freeUsedToday` 가 SwipeFeed 진입 route params에 포함되지 않음 — CTA 변형 오작동
- **File**: `apps/MemeApp/src/presentation/home/componenets/free-tab/free-tab.screen.tsx:96-111`
- **Expected**: 그리드 카드 탭 시 `usage.freeUsedToday`를 SwipeFeed route에 전달 → 무료 모드 CTA가 티켓/코인 정확히 분기 (AC 2.6.2).
- **Actual**: `navigation.navigate("SwipeFeed", { ... })` 에 `freeUsedToday`가 포함되지 않음. `SwipeFeedScreenFree`는 `freeUsedToday = false` default 사용 → `freeUsedToday==true` 사용자도 항상 티켓/"무료" CTA를 보게 됨.
- **Root cause**: Contract는 "Free-tab usage state (BR-13). Drives CTA icon/text branching in free mode. Passed from grid to avoid extra /free-tab call." 으로 `route.types.ts`에 `freeUsedToday?: boolean`을 정의했으나, grid→SwipeFeed 진입 경로에서 실제 주입을 누락.
- **Impact**: AC 2.6.2 미충족. 사용자가 오늘 무료 기회를 소진한 상태에서 SwipeFeed 진입 시 "무료" CTA 탭 가능 → `pendingCtaAction: {kind:"free"}` → app-003가 confirm sheet 오픈 → 서버 `POST /gen`이 409 `FREE_ALREADY_USED` 반환하는 경로로 귀결 (완전 crash는 아니지만 UX 오도).
- **Direction**: `handleCardPress`의 `navigation.navigate` 인자에 `freeUsedToday: usage.freeUsedToday` 추가. `usage`는 이미 `useGetFreeTabUseCase`로 해당 스코프에 있음.

### 2. **[Minor]** `FREE_ROSTER_MIN_VERSION` 상수가 어디서도 참조되지 않음
- **File**: `apps/MemeApp/src/domain/meme/free-tab.constants.ts`
- **Expected**: 상수가 서버 gating 경계 참고용이라면 주석으로 의도 명시 + 최소 한 곳(헤더/버전 비교)에서 사용 또는 문서화.
- **Actual**: `grep -r FREE_ROSTER_MIN_VERSION apps/MemeApp/src` → 선언부만 매칭. App-Version 헤더는 전역 ApiSharedHeaders가 주입하며, 클라이언트 코드에서 이 threshold와 비교하는 로직 없음.
- **Impact**: 기능 영향 없음(서버가 gating). 향후 개발자가 이 상수를 "어디서 쓰이는지" 혼동할 여지.
- **Direction**: 주석에 "서버 gating 참조용 상수; 클라이언트는 비교 로직 없음" 명시하거나, build-info 경고 로그 추가.

### 3. **[Minor]** Event payload `click_meme_filter`/`imp_meme_filter` 필수 `imp_id` 미제공
- **File**: `apps/MemeApp/src/presentation/home/componenets/free-tab/free-tab.screen.tsx:79,118`
- **Expected**: Event spec의 required `imp_id: string` 제공.
- **Actual**: 필드 누락 — 타입 에러 발생. 그러나 base branch의 `home-body.tsx`, `filter-row.tsx`, `grid-filter-list.tsx`, `horizontal-filter-list.tsx` 모두 동일하게 누락. 즉, free-tab은 기존 패턴을 따랐을 뿐.
- **Impact**: TypeScript 에러(모노레포 기존 범주). 런타임 영향: Mixpanel/Firebase 이벤트 payload에 `imp_id` 필드가 없어 해당 컬럼이 비어짐 (pre-existing).
- **Direction**: Event spec 변경 자체가 별도 PR에서 전체 callsite 업데이트 누락. 본 스프린트 범위 밖. sprint lead 에게 follow-up 티켓 권고.

### 4. **[Minor]** Deep link 직접 진입 후 back 시 무료탭 복귀 실패
- **File**: `apps/MemeApp/src/presentation/swipe-feed/swipe-feed.screen.tsx:267`
- **Expected**: `zzem://swipe-feed/free?filterId=X` 딥링크 진입 후 뒤로가기 → 무료탭 그리드 (AC 2.3.2).
- **Actual**: `useAndroidBackHandlerFallback(navigateToHome, !nav.canGoBack())` → `nav.reset({ routes: [{ name: "Home", params: {} }] })` → `HomeScreen`의 `resolveInitialTab(undefined)` 은 `recommend` 반환 → 추천탭 랜딩.
- **Impact**: Maestro smoke 주 경로(그리드 카드 탭→SwipeFeed→back)는 정상. 딥링크/cold start 케이스만 영향.
- **Direction**: `nav.reset` 시 `params: { tag: "free" }` 전달 (entryPoint==="free-tab" 또는 mode==="free" 일 때). 1줄 수정.

### 5. **[Minor]** `filters.findIndex` 호출이 매번 O(n) — 카드 impression 이벤트
- **File**: `apps/MemeApp/src/presentation/home/componenets/free-tab/free-tab.screen.tsx:84,123`
- **Expected**: 각 카드의 `filter_order` 를 카드 렌더 시 한 번 계산하여 전달.
- **Actual**: `handleCardPress`/`handleCardImpression`에서 `filters.findIndex(f => f.filterId === data.filterId)` — 10개 카드면 O(10) 이나 큰 roster일 때 O(N^2) impression.
- **Impact**: 현재 roster=10으로 무시할 수준. N증가 시 성능 degrade.
- **Direction**: `renderItem`에서 `index` 를 props로 전달.

## Notes
- **테스트 커버리지 양호**: Zod fixture 10종(pass7/fail3), mapper 4 case (정규화/순서/빈/fallback), free-mode 12 case (buildFreeFeedItems/resolveInitialIndex/resolveFreeCtaVariant/resolveCircularJumpTarget), useTabScrollRestore 4 case(AC 2.4.1 포함), swipe-feed-routes rewrite 4 case. 전부 PASS.
- **정적 검사**: 사전 존재하는 monorepo 타입/모듈 resolution 에러는 feedback_monorepo_precommit.md 범주로 수용.
- **Group 002 교훈 준수 확인**: `slotId` 요청 미포함 ✓; `freeUsedToday` local state 덮어쓰기 없음 ✓; 폴백 `requiredCredit` 해석은 서버가 basePrice로 결정 → 클라이언트는 수치 그대로 표시 ✓.
- **컴포넌트 분리 깔끔**: `SwipeFeedScreenAlgo` / `SwipeFeedScreenFree` 로 early switch 하여 free 모드가 algo feed API를 절대 호출하지 않음 — AC 2.2.1 "피드 진입 시 /free-tab 또는 /filters 네트워크 호출 0" 을 구조적으로 보장.

## E2E 결과 요약 (참고)
| Flow | Result |
|------|--------|
| `home-tabs.yaml` | PASS |
| `free-tab-grid.yaml` | PASS |
| `swipe-feed.yaml` | FAIL — 환경(E2E_SEED_FILTER_ID fetch 실패, access token 만료). 스프린트 코드 회귀 아님. |
| `swipe-feed-free-circular.yaml` | PASS with warning — `current-index-0` testID가 `freeTabFilters` passthrough 없는 딥링크 경로에서 렌더 안 됨(의도된 동작, 주석 명시). |

E2E는 보조 증거로 참고. 코드 레벨 평가 결과가 판정의 주 근거.

## Verdict
**ISSUES** (Critical 0 / Major 1 / Minor 4)

- Major #1 (freeUsedToday passthrough 누락) 이 AC 2.6.2를 직접적으로 위반. 1줄 수정으로 해결 가능하지만, 수정 없이 머지되면 무료 소진 사용자가 잘못된 "무료" CTA를 탭 → 서버 409 경로 유입 → UX 혼선.
- 수정 후 재평가를 권장. Minor 4건은 주 기능에 영향 없으므로 별도 follow-up.

---

## Fix Loop #1 Re-evaluation

**Date**: 2026-04-14
**Context Pressure**: Caution — Major/Critical만 검증
**Fix commit**: `d4f338e9` — `fix(free-tab): passthrough freeUsedToday to SwipeFeed navigation`
**Scope**: Major #1 단독 재검증

### 검증 결과

#### 1. `handleCardPress`의 `freeUsedToday` passthrough (Major #1 해소 확인)
- **File**: `apps/MemeApp/src/presentation/home/componenets/free-tab/free-tab.screen.tsx:113`
- **Code**:
  ```ts
  freeUsedToday: usage?.freeUsedToday ?? false,
  ```
- **Status**: ✅ 이전 평가의 기대 동작과 정확히 일치. `FreeTabScreen`이 보유한 `usage.freeUsedToday`가 `SwipeFeed` route params로 전달되어 `SwipeFeedScreenFree` 기본값(false)로 떨어지지 않음.

#### 2. `useCallback` 의존성 배열
- **File**: `free-tab.screen.tsx:116`
- **Code**: `[filters, usage?.freeUsedToday]`
- **Status**: ✅ `usage?.freeUsedToday` 포함. `freeUsedToday` 값이 변경될 때 handler가 stale closure로 고정되지 않음.

#### 3. Route 타입 일치
- **File**: `apps/MemeApp/src/shared/routes/route.types.ts:112`
- **Definition**: `freeUsedToday?: boolean;`
- **Passed value**: `boolean` (nullish fallback `?? false`로 반드시 boolean 보장)
- **Status**: ✅ 타입 일치.

#### 4. `// Why:` 주석
- **File**: `free-tab.screen.tsx:111-112`
- **Status**: ✅ clean-code.md 규칙(`// Why:` for non-obvious logic) 준수. AC 2.6.2 명시적 참조 포함.

### Build / Test

```
cd apps/MemeApp
yarn jest src/presentation/home src/presentation/swipe-feed src/shared/routes src/data/meme --passWithNoTests
```

| Suite | Result |
|------|------|
| `src/presentation/home/hooks/__tests__/useTabScrollRestore.test.tsx` | ✅ PASS |
| `src/presentation/swipe-feed/__tests__/free-mode.test.ts` | ✅ PASS |
| `src/shared/routes/__tests__/swipe-feed-routes.test.ts` | ✅ PASS |
| `src/data/meme/__tests__/meme.mapper.test.ts` | ❌ FAIL (pre-existing) |

**Pre-existing failure 분석**:
- Test: `MemeMapper.toFilterChipsEntity › 항상 첫 번째에 '쨈 홈' 칩을 추가한다`
- Expected `"쨈 홈"`, received `"추천"`.
- Blame: 이 실패는 prior commit `bd74e042` (`feat(home): app-001 free tab N-grid + banner + red dot + scroll restore`) 시점부터 존재. Fix commit `d4f338e9`는 `free-tab.screen.tsx` 1 파일만 수정했고 mapper는 건드리지 않음 → **회귀 아님**.
- Caution 모드: Minor 수준으로 기록만 (본 Fix Loop verdict에 반영하지 않음).

### Minor #2~#5 (참고)
Caution 모드이므로 미검증/기록만. 별도 follow-up 스프린트에서 처리 권장.

### Verdict

**PASS**

- Major #1 완전 해소. 1줄 + 의존성 배열 + Why 주석 모두 정확.
- 관련 테스트 3개 suite 모두 PASS (호출 관련 `swipe-feed-routes`, `free-mode`, `useTabScrollRestore`).
- `meme.mapper.test.ts` 실패는 pre-existing (fix scope 밖, feedback_monorepo_precommit.md 범주 유사).
- Fix 회귀 없음. Group 003 머지 가능 상태.
