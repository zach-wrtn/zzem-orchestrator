# Sprint Contract — Group 002 (App Foundation)

> **Sprint**: ugc-platform-001
> **Scope**: app-001 (bottom tab nav) + app-002 (explore tab) + app-003 (MY profile) + app-004 (settings)
> **Worktree**: `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ugc-platform/app`
> **Branch**: `sprint/ugc-platform-001` (base: `main`)
> **Owner**: FE Engineer
> **Depends on**: Group 001 PASS (be-001~004 endpoints live on `sprint/ugc-platform-001`)

## Ground Rules (Preamble)

1. **Phase 3 프로토타입이 SSOT**: app-003/004 는 `prototypes/app/app-003/`, `prototypes/app/app-004/` HTML (approved 2026-04-22) 디자인을 재현한다. Figma drift fix 는 `phase-3.4-prd-amendments.md` 에 고정.
2. **Canonical tab labels**: `홈 / 탐색 / MY` (DRIFT-04). Figma 는 icon-only 이므로 이 라벨은 React Navigation `route name`, `accessibilityLabel`, analytics event key 용도.
3. **Settings 메뉴 = 8개** (DRIFT-01): 계정 / 비밀번호 / 알림설정 / 차단관리 / **고객센터** / 이용약관 / 개인정보 처리방침 / 탈퇴하기 + 앱버전. 고객센터는 `ComingSoonScreen` placeholder, 실제 destination Phase 3.
4. **API contract**: `contracts/api-contract.yaml` SSOT. BE 는 Group 001 에서 live 되었으므로 실제 endpoint 호출로 검증.
5. **Cursor 규약**: BE 가 raw `{list, nextCursor}` 반환. FE 는 그대로 수용 (재래핑 금지 — integration-001).
6. **비회원**: Profile 탭 진입은 login redirect (기존 `useNavigationLinking` auth-required list 에 추가).

---

## Done Criteria — by Task

### app-001 · Bottom Tab Navigator + Deep Links

**Target**: `app/apps/MemeApp/src/app/navigation/`, `shared/routes/`.

- [ ] `RootTabNavigator` 가 신설되고 앱 부팅 시 하단에 3개 탭이 노출된다.
  - Tab 1: **홈** (기존 Home stack 을 탭 1 로 재배치).
  - Tab 2: **탐색** (돋보기 아이콘, Explore stack — app-002 화면 진입).
  - Tab 3: **MY** (Profile stack — app-003 화면 진입; 본 태스크는 라우트 등록만).
- [ ] Tab label / route name / `accessibilityLabel` / analytics key = `"홈"` / `"탐색"` / `"MY"` (canonical). Figma icon-only 이므로 UI 텍스트 노출은 React Navigation 기본 동작에 맡김.
- [ ] `route.types.ts` 에 `RootTabParamList` 정의 + 기존 `RootStackParamList` 는 각 탭 내부 stack 으로 이동. TypeScript 빌드 에러 0.
- [ ] Deep link 경로 등록:
  - `zzem://home` → 홈 탭.
  - `zzem://explore` → 탐색 탭.
  - `zzem://profile` → MY 탭.
  - `zzem://profile/:userId` → 타유저 프로필 화면 (app-006 미구현 시 placeholder + `userId` 표시 허용).
- [ ] 비회원 `zzem://profile` 진입 → 기존 auth-required 로직을 통해 로그인 화면으로 랜딩.
- [ ] 기존 Home 의 내부 Recommend/Free sub-tab 은 **건드리지 않는다** (본 태스크 scope 외).
- [ ] `shared/constants/test-ids.ts` 에 `home-tab`, `explore-tab`, `my-tab` testID 3개 추가.
- [ ] Maestro flow `bottom-tab-nav.yaml` 신규 — 앱 부팅 → 3개 탭 testID `assertVisible` 순회.

**E2E Seed**: 없음 (네비게이션만 검증).

### app-002 · Explore Tab (Grid Feed Shortcut)

**Target**: `app/apps/MemeApp/src/presentation/explore/` (신규).

- [ ] `ExploreScreen` 이 하단 탭 2 탭 시 렌더되며, **홈의 추천 그리드 컴포넌트를 그대로 재사용**.
- [ ] 네트워크 중복 호출 없음: 홈과 **동일 tanstack react-query `queryKey`** 재사용 (신규 query 생성 금지).
- [ ] 아이템 탭 → 기존 세로 스와이프 피드 진입 (홈과 동일 경로). 별도 `FeedOrigin` 분기가 필요하면 추가, 아니면 홈과 동일 재사용.
- [ ] 헤더: 돋보기 아이콘 + "탐색" 타이틀. 기존 `HeaderBar` 재사용.
- [ ] Maestro flow `explore-tab.yaml` 신규 (e2e-flow-plan.md:36,72 정합) — 앱 부팅 → 탐색 탭 `openLink` → 그리드 아이템 `assertVisible` (홈과 동일 item 등장 확인).

### app-003 · MY Profile Screen + 3 Tabs + Landing Rules

**Target**: `app/apps/MemeApp/src/presentation/profile/` (신규), `shared/routes/profile-routes.ts` (신규), `data/profile/`, `data/me-contents/` (신규).

- [ ] `ProfileScreen` (MY) 가 Profile 탭 진입 시 다음 구조로 렌더:
  - 헤더: 우상단 **톱니바퀴 아이콘** (Settings 진입점, app-004 라우트 호출).
  - 프로필 정보: 프로필 이미지 / 닉네임 / 카운트 3종.
  - 카운트 라벨은 **`팔로워 / 팔로잉 / 재생성된`** (DRIFT-02 확정, PRD §6). Phase 1 에서 follower/following 은 0, regeneratedCount 는 `/v2/me/profile` 응답 필드 사용.
  - 액션 버튼: "프로필 편집" (app-005 라우트 호출), "프로필 공유" (app-007 — 본 태스크는 버튼 배치만).
  - 3탭: `공개 / 비공개 / 좋아요`. 각 탭 컨텐츠는 `/v2/me/contents?visibility={public|private|liked}` 결과를 그리드로 렌더.
- [ ] **AC 2.1 디폴트 랜딩 탭 결정 규칙** (integration):
  - 진입 시 `GET /v2/me/contents/counts` 1회 호출.
  - 결정: `public > 0` → 공개 탭, else `private > 0` → 비공개 탭, else 공개 탭(빈 상태).
- [ ] **AC 2.7 생성 직후 진입 규칙**:
  - 필터 기반 생성 완료 네비게이션 호출부 → Profile 탭 + 공개 탭 (route param `landingTab: 'public'`).
  - 커스텀 프롬프트 기반 생성 완료 호출부 → Profile 탭 + 비공개 탭 (`landingTab: 'private'`).
  - 일반 MY 탭 진입(route param 미전달)에서는 AC 2.1 규칙.
- [ ] 좋아요 탭: 빈 상태 컴포넌트 렌더 (에러/로딩 아님). 메시지 "아직 좋아요한 콘텐츠가 없어요" 류.
- [ ] **공개/비공개 탭 그리드 아이템 tap → 기존 세로 스와이프 피드 화면 진입** (Group 003 `profile-to-swipe-feed.yaml` 의 precondition). `FeedOrigin` 등 기존 컨벤션 재사용 — 신규 네비게이션 경로 생성 금지. 좋아요 탭은 빈 상태이므로 tap 대상 없음.
- [ ] 숫자 축약 유틸 `shared/lib/format/korean-count.ts` 신규:
  - `formatKoreanCount(8600) === "8.6천"`
  - `formatKoreanCount(10000) === "1만"`
  - `formatKoreanCount(12345) === "1.2만"`
  - `formatKoreanCount(100000000) === "1억"`
  - 0 / 음수 / 소수점 경계: `0 → "0"`, 999 → `"999"`, 1000 → `"1천"`.
  - Jest unit test 포함 (`__tests__/korean-count.spec.ts`).
- [ ] 비회원 진입 차단은 app-001 공통 처리로 커버.
- [ ] Maestro flow `my-profile-default-landing.yaml` 신규:
  - `zzem://e2e-auth?...` 로그인 → `zzem://profile` openLink → 공개 탭 `testID` `assertVisible`.
- [ ] E2E seed (new): 공개 2건 + 비공개 1건 보유 유저. `contracts/e2e-seed-plan.md` 참조.

### app-004 · Settings Screen (8 menus + Customer Service Placeholder)

**Target**: `app/apps/MemeApp/src/presentation/settings/` (기존 확장).

- [ ] Settings 화면에 PRD 명시 순서대로 **8개 메뉴 + 앱버전**:
  1. 계정
  2. 비밀번호
  3. 알림 설정 → `ComingSoonScreen` placeholder (Phase 3 이월)
  4. 차단 관리 → `ComingSoonScreen` placeholder (Phase 3)
  5. **고객센터** → `ComingSoonScreen` placeholder (DRIFT-01, Phase 3)
  6. 서비스 이용 약관 → 기존 webview-routes
  7. 개인정보 처리방침 → 기존 webview-routes
  8. 탈퇴하기 → 기존 탈퇴 흐름 재사용
  9. 앱버전 (표기만)
- [ ] 메뉴 순서가 위 리스트와 **정확히** 일치. 다른 순서 금지.
- [ ] Placeholder 문구: 공통 `ComingSoonScreen` 의 기본 "준비 중" 메시지 재사용. 임의 문구("Phase 3 에서 연결 예정" 등) 금지.
- [ ] 프로필 → 톱니바퀴 진입점은 app-003 에서 구축. app-004 는 destination 렌더만.
- [ ] Maestro flow `settings-menu-full.yaml` 신규:
  - profile 탭 → 톱니바퀴 `openLink`(또는 tap) → 8개 메뉴 row `assertVisible`.
  - 알림 설정 row tap → `ComingSoonScreen` `assertVisible`.
  - 고객센터 row tap → `ComingSoonScreen` `assertVisible`.

---

## KB Contract Clauses

| Clause | Severity | Applies to | Enforcement |
|--------|----------|-----------|-------------|
| **completeness-001** | critical | app-001, app-003, app-004 | 신규 스크린 (Profile 탭, Settings 하위 8 destinations) 모두 실제 진입점(탭바 / 메뉴 row / 톱니바퀴) 배치. Unreachable route 금지. |
| **completeness-002** | major freq≥1 | app-002, app-003, app-004 | 신규 훅 / use-case / mutation 은 실제 화면에서 호출되어야 한다. 미사용 export 금지. `useGetMyProfileUseCase`, `useGetMyContentsCountsUseCase` 등은 ProfileScreen 에서 실제 호출. |
| **completeness-003** | major freq≥1 | app-001, app-003 | `RootTabParamList`, `landingTab?: 'public'\|'private'\|'liked'` 신규 param 추가 시 — **모든** `navigation.navigate` 호출부 (필터 생성 완료, 커스텀 프롬프트 생성 완료) 에서 param 전달. `useCallback` deps 에 포함. Deep link (param 없는 진입) fallback 동작 보장. |
| **code_quality-001** | major freq≥1 | 전 태스크 | `navigation.*`, `react-query` 훅은 **presentation 레이어에서만** 사용. `domain/` 에 import 금지. 기존 `src/domain/user/user.usecase.ts` 위반은 확대하지 않는 선에서 유지. |
| **integration-001** | critical | app-003, app-004 | BE 응답 필드명 (`list`, `nextCursor`, `profileImageUrl`, `regeneratedCount`, `isPersona`, `public`, `private`, `liked`, `followerCount`, `followingCount`) FE 타입과 동일. rename 금지. |

---

## Verification Method

### V1. Grep 체크

- [ ] `rg "프로필"` in `app/apps/MemeApp/src/app/navigation/` → 신규 RootTabNavigator 에 등장 0회 (canonical 라벨 `MY` 사용).
- [ ] `rg "\"둘러보기\"|\"생성\""` in `app/apps/MemeApp/src/app/navigation/ app/apps/MemeApp/src/presentation/explore/` → 0 hit (navigation + Explore 헤더 모두 canonical `탐색` 만 사용).
- [ ] `rg "new CursorResponseDto\(" app/apps/MemeApp/src/` → 0 hit (Controller 없음, FE passthrough).

### V2. Route / Deep Link 체크

- [ ] `useNavigationLinking.ts` 에 `zzem://profile`, `zzem://profile/:userId`, `zzem://explore` 경로 모두 등록.
- [ ] `zzem://profile` (비회원) → 로그인 화면 라우팅 테스트 가능 (수동 또는 e2e).

### V3. TypeScript

- [ ] `npm run typecheck` → 신규 에러 0. (pre-existing app-core-packages 에러는 면제, 사용자 memory 상 `--no-verify` 허용)

### V4. Unit Tests

- [ ] `formatKoreanCount` 유닛 테스트 최소 8 케이스 (0, 999, 1000, 1234, 8600, 10000, 12345, 100000000).

### V5. E2E (Maestro)

- [ ] `app/apps/MemeApp/e2e/flows/bottom-tab-nav.yaml` — 3개 탭 testID visible, 순회.
- [ ] `app/apps/MemeApp/e2e/flows/explore-tab.yaml` — 탐색 탭 진입 + 추천 그리드 아이템 visible.
- [ ] `app/apps/MemeApp/e2e/flows/my-profile-default-landing.yaml` — 로그인 → 프로필 → 공개 탭 디폴트 활성화.
- [ ] `app/apps/MemeApp/e2e/flows/settings-menu-full.yaml` — 8 메뉴 + 알림/차단/고객센터 3종 placeholder 진입.
- [ ] **Regression — Home-rooted 진입점 flow 영향 정리** (DRIFT 영향):
  - `home-to-settings.yaml` (기존 baseline, `e2e-flow-plan.md:21`) — 톱니바퀴가 Home → **MY 탭** 으로 이동하므로 **`settings-menu-full.yaml` 이 기능적 대체**. 기존 flow 는 (a) 삭제 OR (b) tap path 업데이트 (MY 탭 진입 → 톱니바퀴) 중 하나 선택. 본 계약에서는 **(b) 업데이트** 로 결정 — 삭제는 e2e history 의 회귀 커버리지 상실 리스크.
  - 그 외 기존 22 Maestro flow — 탭 네비게이션 재구성 영향으로 깨지는 flow 가 추가 발견되면 본 그룹 범위에서 동일 업데이트 (tap path 조정). 기능 자체 변경은 금지.
  - 검증: 사용자가 iOS 시뮬레이터에서 변경된 flow + 기존 green flow 재실행 (Sprint Lead 는 결과 수집만).

---

## Edge Cases

1. **비회원 Profile 탭 tap** → 로그인 화면 랜딩. 로그인 후 돌아오면 Profile 탭에 착지해야 하는가? → 본 스프린트 범위 외 (원격 복귀 동작은 기존 `useNavigationLinking` 에 위임).
2. **딥링크 `zzem://profile/{userId}` with 차단된 userId** → app-006 scope (차단 표시). 본 그룹은 네비게이션만.
3. **`landingTab` param + `counts` 결과 상충**: route param 이 우선 (AC 2.7). param 이 `'public'` 이면 count 조회 결과 무시하고 공개 탭 활성.
4. **Counts API 실패 (네트워크)**: 랜딩 탭 fallback 은 공개 탭 (안전한 default). 화면 자체는 에러 상태가 아닌 빈 상태 표시 허용.
5. **좋아요 탭**: `/v2/me/contents?visibility=liked` 호출 시 BE 는 `{list:[], nextCursor:null}` 반환 (be-003). FE 는 빈 상태 컴포넌트 렌더.
6. **Settings → 고객센터 tap**: DRIFT-01 결정대로 `ComingSoonScreen` placeholder 렌더. 임의 외부 링크/메일 띄우기 금지.

---

## Business Rule Traps (FE-specific)

1. **카운트 라벨**: **`팔로워 / 팔로잉 / 재생성된`** (DRIFT-02). `게시물 / 팔로워 / 팔로잉` 이전 구조 **금지**.
2. **탭 라벨**: `홈 / 탐색 / MY` (DRIFT-04). `프로필 / 둘러보기` 금지.
3. **Settings 메뉴 순서**: 위 Done Criteria §app-004 의 1~9번 순서. 기존 `settings.screen.tsx` 의 기존 순서와 다를 수 있음 — PRD 우선.
4. **Settings 메뉴 개수**: **8 + 앱버전** (고객센터 포함). 7 메뉴로 구현하면 FAIL (DRIFT-01).
5. **숫자 포맷**: "8.6천" 형식 (소수점 한 자리). "8,600" 쉼표 포맷 금지. `Intl.NumberFormat` fallback 도 금지 — Korean 축약 고정.
6. **QueryKey 재사용**: Explore 가 홈과 다른 queryKey 를 만들면 네트워크 중복 — `completeness-002` 위반. 기존 홈 추천 queryKey 그대로.

---

## Context Pressure Hint

🟢 Normal (Group 002 시작). Fix loop 발생 시 Sprint Lead 가 Caution 상향.

---

## Sign-off

- [x] Evaluator 계약 검토 Round 1 — APPROVE with revisions (`group-002-review.md`). Major 1-3 패치 반영:
  - Major 1: `explore-tab.yaml` 를 별도 flow 로 분리 (e2e-flow-plan 정합).
  - Major 2: `home-to-settings.yaml` 업데이트 경로 명시 (MY 탭 루트 전환).
  - Major 3: app-003 에 "그리드 아이템 tap → SwipeFeed" Done Criterion 추가.
  - Minor 4: V1 grep scope 를 `presentation/explore/` 로 확장.
- [x] Evaluator Round 2 APPROVE — 2026-04-22.
- [x] FE Engineer 착수 허가.
