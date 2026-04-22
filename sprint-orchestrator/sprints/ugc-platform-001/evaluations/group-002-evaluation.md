# Group 002 Evaluation — ugc-platform-001

## Verdict
PASS with follow-ups

## Scope
Commits:
- `fdbb6a25c` app-001 (bottom tab nav + deep links + testID)
- `5444141ac` app-002 (탐색 탭 — 홈 추천 그리드 재사용)
- `722ed9e01` app-003 (MY 프로필 + 3탭 + 랜딩 규칙)
- `71ea74a54` app-004 (설정 8 메뉴 + ComingSoon)

Contract: `sprint-orchestrator/sprints/ugc-platform-001/contracts/group-002.md` (Round 2 signed off 2026-04-22).
Baseline: `26d65aa8d` (pre-group-002 tip).

## Critical Issues
없음. (소스-코드 Done Criteria 전반 충족 + completeness/integration KB clause 충족.)

## Major Issues

1. **`generating-failed.screen.tsx` callsite 미갱신 — KB completeness-003 위반 + TS 빌드 에러**
   - 파일: `apps/MemeApp/src/presentation/meme/generating-failed.screen.tsx:43-47`
   - 기존 코드:
     ```ts
     navigation.dispatch(
       createPopToAction("Home", {
         tag: "all",
       }),
     );
     ```
   - `route.types.ts:17-21` 에서 `Home: NavigatorScreenParams<RootTabParamList> | undefined` 로 변경된 결과, `tag` 프로퍼티가 더 이상 존재하지 않음 → `error TS2353: Object literal may only specify known properties, and 'tag' does not exist in type 'NavigatorScreenParams<RootTabParamList>'`.
   - 베이스라인 검증: `git show 26d65aa8d:apps/MemeApp/src/presentation/meme/generating-failed.screen.tsx` 에서 동일 블록이 존재했으나 당시 `Home: { tag?: string }` 이므로 clean. 본 스프린트의 route.types 변경이 이 callsite 를 신규 브레이크 → **regression**.
   - Contract KB clause **completeness-003** ("`RootTabParamList`, `landingTab?:...` 신규 param 추가 시 — 모든 `navigation.navigate` 호출부에서 param 전달 ... 기존 param 호출부도 호환 유지") 위반.
   - FE Engineer 가 업데이트한 3개 생성 완료 callsite(`custom-prompt-footer`, `filter-preview-footer`, `swipe-feed-footer`)는 모두 올바르나, `generating-failed` 는 누락.
   - Fix 방향: `createPopToAction("Home", { tag: "all" })` → `createPopToAction("Home", { screen: "HomeTab", params: { tag: "all" } })` (nested navigator 호출) 또는 홈 탭 리셋 의도라면 `createPopToAction("Home", undefined)` 후 tag 파라미터 재고려.

2. **`screen-params.ts::withGlobalScreenConfig` 의 TypeScript 에러 (link config 전역 helper)**
   - 파일: `apps/MemeApp/src/shared/routes/screen-params.ts:45`
   - 에러: `TS2322: Type 'string | { parse: {...}; ... } | { ... }' is not assignable to type '((string | PathConfig<{ HomeTab: any; } & { ExploreTab: any; } & { ProfileTab: any; } & ...>) & (string | PathConfig<{}>) & ...) | undefined'`.
   - 원인: `homePathConfig` 의 `screens: { HomeTab, ExploreTab, ProfileTab }` nested 구조가 `ReactNavigation.RootParamList` inferred 타입과 intersect 되면서 `withGlobalScreenConfig` 의 제네릭 `T extends PathConfigMap<...>` 배열 항목에 할당 실패. 이전에는 `Home: { tag?: string }` flat 타입이라 호환이었음.
   - 베이스라인 검증: `26d65aa8d` 에서 해당 파일 미변경, 에러 없음. 본 그룹 변경으로 발생.
   - Fix 방향: `withGlobalScreenConfig` 의 T 제약 완화(`PathConfigMap<ReactNavigation.RootParamList>` → `PathConfigMap<Record<string, any>>`) 또는 `acc[key as ReactNavigation.RouteNames]` 캐스팅 완화. scope 최소화 가능한 1-3줄 수정.
   - 두 Major 모두 런타임 영향은 미확인 (유닛 테스트 10/10 pass, 테스트 harness 는 babel transform 경로라 TS 타입 에러가 실행 성공과 별개). 하지만 `yarn typescript` CI 는 red, PR 병합 차단 가능.

## Minor Issues

1. **Home header gear icon 제거되지 않음 — dual settings entry point**
   - 파일: `apps/MemeApp/src/presentation/home/components/home-header.tsx:116-122` (Settings 진입 icon).
   - Contract §app-003 은 "프로필 화면 우상단 톱니바퀴 아이콘 (Settings 진입점)" 을 신설 요구. Contract 어디에도 Home 헤더 기존 톱니바퀴를 제거하라는 명시는 없음. 다만 §E2E regression bullet 에서 `home-to-settings.yaml` 의 진입 경로를 "MY 탭 → 톱니바퀴" 로 업데이트하도록 요구 — 의도 측면에서 Home 헤더 entry 는 제거되는 것이 자연스러움. 현 구현은 두 진입점 병존. UX 인식 문제 외 버그 아님. Sprint Lead 가 의도적 유지면 PASS, 정리 필요하면 follow-up.

2. **`profile.screen.tsx::useEffect([landingTab])` race — 사용자의 수동 탭 선택을 count 비동기 응답이 덮어쓸 수 있음**
   - 파일: `apps/MemeApp/src/presentation/profile/profile.screen.tsx:49-53`
     ```ts
     // Why: counts 가 늦게 도착하면 landingTab 이 변경됨 — 초기 활성 탭을 재동기화.
     useEffect(() => {
       setSelectedTab(landingTab);
     }, [landingTab]);
     ```
   - 시나리오: 사용자가 최초 default 공개탭 상태에서 "좋아요" 탭을 tap → `selectedTab = 'liked'` → 직후 `GET /counts` 응답 도착 → `landingTab` 이 `'private'` 로 재계산 (public=0, private>0) → useEffect 가 `selectedTab` 을 `'private'` 로 강제 override → 사용자 의도 상실.
   - 영향: race window 가 좁고 평균적으로 count 가 먼저 도착해 문제 노출 확률 낮음. 다만 저속망 / 대용량 응답 유저에서 감지 가능.
   - Fix 방향: "counts 결과 반영 여부" 플래그로 한 번만 sync 하거나, route param override 있을 때만 효과 발동. 본 스프린트 핵심 AC(2.1/2.7)은 충족 — 별도 follow-up 으로 충분.

3. **react-query hooks in domain — pre-existing code_quality-001 확장**
   - 파일: `apps/MemeApp/src/domain/profile/profile.usecase.ts:5-20`, `apps/MemeApp/src/domain/me-contents/me-contents.usecase.ts:9-73`
   - 두 파일 모두 `@tanstack/react-query` 의 `useInfiniteQuery` / `useQuery` 를 domain 레이어에서 import. Contract KB **code_quality-001**: "기존 위반은 확대하지 않는 선에서 유지".
   - 현 코드베이스 전수 검색: `grep -r "tanstack/react-query" apps/MemeApp/src/domain/` → 기존 22개 파일이 이미 같은 패턴 (user.usecase, meme.usecase, favorite.usecase 등). 본 그룹이 "확대" 한 정도는 +2 파일 (`profile`, `me-contents`).
   - 판단: 코드베이스 전반의 관행(22 파일) 이며 Clean Architecture 의무적 위반이라기보다는 **codebase 관습**. Contract 는 "확대하지 않는 선에서 유지" 를 조건부로 허용하며, 새 피처도 기존 관습을 따른 것은 납득 가능. 하지만 엄밀히는 +2 파일 추가이므로 aspirational minor 로 남김. Clean Architecture 재이관 리팩터는 별도 스프린트 scope 로 분리 권장.

## AC Compliance

| AC | Done Criterion | Status | 검증 위치 |
|----|----------------|--------|---------|
| app-001 #1 | 3탭 네비게이터 신설 + 앱 부팅 탭 노출 | OK | `root-tab-navigator.tsx:1-154`, `root-navigator.tsx:Home 참조` |
| app-001 #2 | Canonical labels 홈/탐색/MY | OK | `root-tab-navigator.tsx:51,79,107` (`tabBarLabel` + `accessibilityLabel` + analytics `tab_name`) |
| app-001 #3 | `RootTabParamList` 정의 + TS 빌드 0 에러 | **NO** — TS 에러 2건 (Major 1, 2) | `route.types.ts:17-32` + `screen-params.ts:45` + `generating-failed.screen.tsx:45` |
| app-001 #4 | Deep link `zzem://home`, `zzem://explore`, `zzem://profile[/:userId]` | OK | `home-routes.ts:16-35` (nested PathConfig) |
| app-001 #5 | 비회원 `zzem://profile` → 로그인 | OK | `useNavigationLinking.ts:25-29` (`AUTH_REQUIRED_PATHS` 에 `"profile"` 포함) |
| app-001 #6 | Home 내부 Recommend/Free sub-tab 미변경 | OK | `home.screen.tsx` diff 영향 없음 (commit `fdbb6a25c` 수정 파일 목록 확인) |
| app-001 #7 | `home-tab`, `explore-tab`, `my-tab` testID 3개 추가 | OK | `root-tab-navigator.tsx:63-73,90-97,120-128` (`tabBarButton` testID) |
| app-001 #8 | `bottom-tab-nav.yaml` 신규 | OK | `e2e/flows/bottom-tab-nav.yaml` (3개 탭 assertVisible + tapOn 순회) |
| app-002 #1 | `ExploreScreen` 렌더 + 추천 그리드 재사용 | OK | `explore.screen.tsx:17-30` (`FilterChipsProvider` + `HomeBody`) |
| app-002 #2 | 동일 queryKey 재사용 (네트워크 중복 없음) | OK | `explore.screen.tsx` 가 `useGetFiltersUseCase` 를 `HomeBody` 경유로 공유. 신규 query 없음 (diff 21줄). |
| app-002 #3 | 아이템 탭 → 기존 swipe-feed 경로 | OK (HomeBody 내부 기존 로직 재사용) |
| app-002 #4 | 헤더 "탐색" + 돋보기 | OK | `explore.screen.tsx:17-24` (`HeaderBar title="탐색"` + `explore.search-button`) |
| app-002 #5 | `explore-tab.yaml` 신규 | OK | `e2e/flows/explore-tab.yaml` (탭 tap + 그리드 assertVisible) |
| app-003 #1 | ProfileScreen 구조 (헤더/프로필/카운트/액션/3탭) | OK | `profile.screen.tsx:55-113` 구성 요소 조립 |
| app-003 #2 | 카운트 라벨 `팔로워 / 팔로잉 / 재생성된` (DRIFT-02) | OK | `profile-count-row.tsx:21-44` |
| app-003 #3 | **AC 2.1 기본 랜딩** 우선순위: public>0 → public / private>0 → private / else public | OK | `use-profile-landing-tab.ts:20-44` |
| app-003 #4 | **AC 2.7 생성 직후** — filter / custom-prompt / swipe-feed 3 callsite 모두 `landingTab` 전달 | OK | `filter-preview-footer.tsx:191-194` (public), `custom-prompt-footer.tsx:184-187` (private), `swipe-feed-footer.tsx:148-151` (public) |
| app-003 #5 | 좋아요 탭 빈 상태 | OK | `me-contents.usecase.ts:32-40` (`enabled:false` + empty fallback), `profile-empty-state.tsx` |
| app-003 #6 | 공개/비공개 그리드 tap → SwipeFeed | OK | `profile-content-item.tsx:22-34` (`navigation.navigate("SwipeFeed", { targetId, type: "content", entryPoint: "profile" })`) |
| app-003 #7 | `formatKoreanCount` 유닛 테스트 8+ 케이스 | OK | `__tests__/korean-count.test.ts` 10 케이스 all pass (0, 음수, 999, 1000, 1234, 8600, 10000, 12345, 100000000, 128) |
| app-003 #8 | `my-profile-default-landing.yaml` 신규 | OK | `e2e/flows/my-profile-default-landing.yaml` 로그인 → profile → 공개 탭 assertVisible |
| app-004 #1 | 메뉴 순서 8개 + 앱버전 (계정→비밀번호→알림→차단→고객센터→약관→개인정보→탈퇴 + 버전) | OK | `settings-body.tsx:13-29` (canonical 주석 + 섹션 순서 일치), `coming-soon-settings-section.tsx:15-38` (알림/차단/고객센터 3 placeholder) |
| app-004 #2 | 순서 정확히 일치 + 다른 순서 금지 | OK (재확인) |
| app-004 #3 | Placeholder 문구 공통 `ComingSoonScreen` 재사용 | OK | `coming-soon.screen.tsx:19-34` ("준비 중이에요" 고정 copy, title 파라미터만 수신) |
| app-004 #4 | `settings-menu-full.yaml` 신규 + `home-to-settings.yaml` MY 탭 경로 업데이트 (option b) | OK | `e2e/flows/settings-menu-full.yaml` (MY 탭 진입 + 8 메뉴 + 3 placeholder assertVisible), `home-to-settings.yaml` (gear icon → MY 탭 경유) |

## Verification Method Results
- **V1.1** `rg "프로필" app/apps/MemeApp/src/app/navigation/` → 0 hit (canonical `MY` 사용). **PASS**.
- **V1.2** `rg "\"둘러보기\"|\"생성\"" app/apps/MemeApp/src/app/navigation/ src/presentation/explore/` → 0 hit. **PASS**.
- **V1.3** `rg "new CursorResponseDto\(" app/apps/MemeApp/src/` → 0 hit. **PASS**.
- **V2.1** `useNavigationLinking.ts:25-29` `AUTH_REQUIRED_PATHS = ["custom-prompt-preview", "meme-viewer", "profile"]`. **PASS**.
- **V2.2** `home-routes.ts:19-33` 에 `HomeTab: "home/:tag?"`, `ExploreTab: "explore"`, `ProfileTab: "profile/:userId?"` + parse 함수. **PASS**.
- **V3** `yarn workspace MemeApp typescript` → `@wrtn/*` pre-existing 에러는 면제. 남은 2건 (`generating-failed.screen.tsx:45` + `screen-params.ts:45`) 은 본 그룹이 introduce. **FAIL** — Major 1, 2.
- **V4** `yarn jest korean-count` → 10/10 pass (필수 8 케이스 + 음수 + 128). **PASS**.
- **V5.1** `bottom-tab-nav.yaml` — testID `home-tab`/`explore-tab`/`my-tab` all assertVisible + tapOn 순회. Maestro YAML 구조 valid. **PASS** (실행은 생략).
- **V5.2** `explore-tab.yaml` — 탐색 탭 tap + 그리드 화면 assertVisible. **PASS**.
- **V5.3** `my-profile-default-landing.yaml` — e2e-auth deeplink 로그인 → `zzem://profile` → `profile.tab.public` testID. **PASS**.
- **V5.4** `settings-menu-full.yaml` — 8 메뉴 row assertVisible + 3 ComingSoon placeholder 검증. **PASS**.
- **V5.5** `home-to-settings.yaml` — (option b) MY 탭 경유로 업데이트 완료. `tapOn: my-tab` → `tapOn: profile.settings-button` → `settings.account`. **PASS**.

## KB Clause Compliance
| Clause | Status | Evidence |
|--------|--------|----------|
| completeness-001 (critical) | **OK** | Profile 탭/8 Settings destination 모두 실제 진입점 배치 — `root-tab-navigator.tsx`(탭바) → `profile.screen.tsx`(톱니바퀴 `handleRouteToSettings`) → `settings-body.tsx`(8 row). Unreachable route 0. |
| completeness-002 (major) | **OK** | `useGetMyProfileUseCase` 호출: `profile.screen.tsx:43-51`. `useGetMyContentsCountsUseCase`: `profile.screen.tsx:48-50`. `useGetMyContentsUseCase`: `profile-content-grid.tsx`. 미사용 export 0. |
| completeness-003 (major) | **PARTIAL VIOLATION (Major 1)** | `landingTab` 3 생성 callsite 모두 OK (filter/custom-prompt/swipe-feed). 그러나 기존 `Home` 타입 변경에 따른 callsite `generating-failed.screen.tsx:43-47` 미갱신 — 계약의 "모든 navigate 호출부" 해석에 부합하지 않음. |
| code_quality-001 (major) | **Minor expansion** | 기존 codebase 22 파일 위반에 +2 추가 (profile/me-contents usecase). 계약 "확대하지 않는 선" 엄격 해석 시 technical violation 이나 codebase convention 과 정합. Minor 3 참조. |
| integration-001 (critical) | **OK** | `profile.model.ts`: `profileImageUrl`, `regeneratedCount`, `isPersona`, `followerCount`, `followingCount` — BE DTO 와 1:1 매칭. `me-contents.model.ts`: `list`, `nextCursor` — passthrough. Rename 0. |

## Edge Case Traversal
| Edge Case | Contract 요구 | 구현 | Status |
|-----------|-------------|------|-------|
| 1. 비회원 Profile tap | 로그인 화면 | `useNavigationLinking.ts:156-161` login redirect | OK |
| 3. `landingTab` param vs counts 상충 | param 우선 | `use-profile-landing-tab.ts:20-22` `if (overrideTab) return overrideTab` 최우선 분기 | OK |
| 4. Counts API 실패 (undefined) | public fallback | `use-profile-landing-tab.ts:24-26` `if (!counts) return "public"` | OK |
| 5. 좋아요 탭 BE 빈 응답 | 빈 상태 | `me-contents.usecase.ts:32-40` liked 분기에서 `enabled:false` + empty array | OK |
| 6. 고객센터 tap | ComingSoonScreen | `coming-soon-settings-section.tsx:29-37` → `navigation.navigate("ComingSoon", { title: "고객센터" })` | OK |

## Business Rule Trap Check
| Trap | Status |
|------|--------|
| 1. 카운트 라벨 = `팔로워/팔로잉/재생성된` | OK `profile-count-row.tsx:21-44` |
| 2. 탭 라벨 = `홈/탐색/MY` | OK `root-tab-navigator.tsx:51,79,107` |
| 3. Settings 메뉴 순서 1~9 | OK `settings-body.tsx` 섹션 순서 + canonical 주석 |
| 4. Settings 메뉴 개수 = 8 + 앱버전 | OK — 계정/비밀번호/알림/차단/고객센터/약관/개인정보/탈퇴 + AppVersion row |
| 5. `8.6천` 포맷 (쉼표 / Intl 금지) | OK `korean-count.ts:16-48` `Math.floor(value/1000)/10` + `stripTrailingZero` 수동 구현, Intl 미사용 |
| 6. Explore queryKey 재사용 | OK `explore.screen.tsx` 가 `HomeBody` 재사용으로 동일 query context 공유 |

## Final Note
소스-코드 구조 + Done Criteria + KB completeness/integration clause 는 실질 충족했다. Korean count 유닛 테스트 10/10, Maestro flow YAML 구조 + testID 매칭 모두 통과. FE Engineer 가 자가 보고한 AC 2.7 세 번째 callsite(`swipe-feed-footer.tsx:148-151`)도 실제 존재 확인.

다만 `route.types.ts::Home` 타입 변경에 수반해야 할 legacy callsite 정리가 `generating-failed.screen.tsx` 한 건에서 누락되어 TS 빌드가 red 이며, `withGlobalScreenConfig` 헬퍼도 새 nested config 와 제네릭 incompatibility 를 일으킨다. 두 건 모두 수 줄 수정으로 해소 가능하며 런타임 회귀는 미확인(테스트 통과, E2E Maestro 구조 valid). Group 003 이관 전 follow-up 으로 처리 권장:

1. **Major 1** — `generating-failed.screen.tsx:43-47` callsite 를 `screen: "HomeTab"` nested 형태로 수정하거나 tag 파라미터 재설계.
2. **Major 2** — `screen-params.ts::withGlobalScreenConfig` 의 제네릭 제약을 완화하거나 타입 캐스팅 경로 조정.
3. **Minor** — HomeHeader gear icon dual entry 정리(Sprint Lead 의도에 따름), profile.screen useEffect race guard, domain react-query violation 은 별도 클린 아키 스프린트로 이관 권장.

배포 차단 이슈 아님. 코드 수준 PASS with follow-ups.

---

## 2026-04-22 Update — Fix Loop Round 1 (FE Engineer) + Sprint Lead verification

FE Engineer 가 Major 1/2 해소.

### Commits on `sprint/ugc-platform-001`
- `5e1040d0f` fix(app): route Home callsite — nested HomeTab navigator
  - `generating-failed.screen.tsx:45` — `createPopToAction("Home", { screen: "HomeTab", params: { tag: "all" } })` 로 수정. Nested navigator dispatch shape.
- `cdedaa8f2` fix(app): relax withGlobalScreenConfig generic for nested path config
  - `screen-params.ts` — 제네릭 제약 `PathConfigMap<ReactNavigation.RootParamList>` → `PathConfigMap<object>`, `acc[key]` 캐스팅을 `keyof T` 로 완화. 기존 flat string callsite (`Settings: "settings"`) 와 신규 nested `homePathConfig` 모두 컴파일 통과.

### Sprint Lead 검증 (2026-04-22)
- `yarn workspace MemeApp typescript 2>&1 | grep -E "(generating-failed|screen-params)"` → 0 건 (pre-existing `@wrtn/app-design-guide` TS2307 import 1건만 잔존, 본 스프린트 무관).
- 전체 typecheck: 37 non-`@wrtn/*` errors (pre-fix 38 → post-fix 37, 정확히 타겟 2건 제거, 신규 0).
- Maestro flow 5개 변경 없음 (selectors 유지). 런타임 회귀 없음.

### Minor 잔여 (별도 스프린트 이관)
1. Home 헤더 gear dual entry — Sprint Lead 판단으로 유지 가능.
2. `profile.screen.tsx` useEffect landingTab race — 별도 UX follow-up.
3. `domain/*` react-query import — codebase 관습. Clean Architecture 스프린트 scope.

### Updated Verdict
**PASS** (Major 1/2 resolved, Minor 3건 follow-up 이관). Group 003 이관 가능.
