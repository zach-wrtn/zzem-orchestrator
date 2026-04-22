# Group 003 Contract Review — Round 1

> Reviewer: Evaluator teammate · Date: 2026-04-22 · Scope: `contracts/group-003.md`
> Mode: Read-only review against PRD amendments + task AC + Group 002 merged code + API contract + e2e-flow-plan.

## Verdict

**APPROVE with revisions** — 1 Critical, 3 Major, 2 Minor. The `source?` design, ground rules, and KB mapping are sound, but one SwipeFeed design inversion (Critical) and two thread-through gaps (Major) must be resolved before FE dispatch, otherwise the app-008 navigate callsites will not typecheck and regress `swipe-feed.yaml`.

## Issues (by severity)

### Critical

1. **SwipeFeed route param redesign is incomplete — existing `targetId` / `type` / `entryPoint` are REQUIRED, not optional, so adding `source?` alone breaks backward compat.**
   - Evidence: `app/apps/MemeApp/src/shared/routes/route.types.ts:130-135` declares `SwipeFeed: { targetId: string; type: MemeDTO.FeedContentType; initialIndex?: number; entryPoint: "grid_feed"|"filter_preview"|"profile" }`. All three non-`initialIndex` fields are required.
   - Evidence: `useGetFeedSwipeUseCase(targetId, type)` in `app/apps/MemeApp/src/domain/meme/meme.usecase.ts:452-492` is the only feed query — it is filter/content-target scoped; there is **no "recommendation pool"** queryFn today. The contract's assumption (`group-003.md:66` "`source === undefined` → 기존 추천 쿼리 (회귀 금지)") does not match reality — the undefined-source path today still requires a `targetId`.
   - Evidence: existing callsites (`filter-list-item.tsx:32-36`, `trending-filter-section-item.tsx:31-36`, `profile-content-item.tsx:26-30`) always pass `{ targetId, type, entryPoint }`.
   - Impact: Done Criterion `group-003.md:66` ("source === undefined → 기존 추천 쿼리") and Ground Rule 5 (`group-003.md:21` "기존 홈 경로는 source 미전달 시 기존 동작 유지") are factually incorrect as written. Existing `swipe-feed.yaml` passes `targetId` + `entryPoint=filter_preview`, not a "추천 풀" parameter set.
   - Direction: Contract must either (a) make `targetId` / `type` / `entryPoint` **optional when `source` is provided** via a discriminated union at the type level, or (b) describe a param shape that makes `source` coexist with the legacy triple. Pick one explicitly in Ground Rule 5 (or a new Ground Rule 5a). Add Done Criterion: "legacy callsites (`filter-list-item.tsx:32`, `trending-filter-section-item.tsx:31`) MUST remain untouched; SwipeFeed screen must branch on `source ?? legacyPath`". Also clarify that **`profile-content-item.tsx` is the only legacy callsite being migrated** — the other two are out of scope.

### Major

2. **`profile-content-item.tsx` does not know the current tab — contract Done Criterion for app-008 requires `visibility: currentTab` but no thread-through is called out.**
   - Evidence: `profile-content-item.tsx:13-17` signature is `{ data: MeContentEntity, width }`; no `tab` prop. Parent `profile-content-grid.tsx:16-19, 79` is `{ items, onEndReached }` — also no `tab` prop. The tab is only known in `profile.screen.tsx:103-118`'s `ProfileTabContent`.
   - Contract reference: `group-003.md:73` specifies `{ source: { kind: 'me', visibility: currentTab }, initialContentId: item.id }` but never specifies how `currentTab` reaches the item.
   - Impact: FE Engineer may add prop drilling inconsistently (e.g. mixing 'liked' into the payload even though Ground Rule 6 forbids it). Without an explicit Done Criterion, "currentTab === 'liked' ⇒ onPress disabled" (Trap 6, `group-003.md:124`) can silently regress.
   - Direction: Add a Done Criterion: "ProfileContentGrid and ProfileContentItem must receive `tab: 'public' | 'private'` (narrowed from ProfileLandingTab, excluding 'liked'), threaded from `ProfileTabContent`. Item onPress must only fire when tab ∈ {public, private}." Cite Ground Rule 6 explicitly in that criterion.

3. **`useShareMyProfile` callsite is ambiguous — contract says "button exists" but doesn't state whether Group 002 already wired it.**
   - Evidence: `profile-action-buttons.tsx:31-36` has a "프로필 공유" button with `testID={TestIds.profile.shareButton}` and an `onPressShare` prop. `profile.screen.tsx:64-66` passes `handlePressShare = () => { /* app-007 에서 연결 */ }` — the handler is intentionally empty.
   - Contract reference: `group-003.md:57` says "`profile.screen.tsx::profile-action-buttons.tsx` 의 '프로필 공유' 버튼 onPress → `useShareMyProfile()` 호출" — correct intent, but it does not explicitly say **do not** add a second button, nor call out that the handler body in `profile.screen.tsx:64-66` is the exact edit site.
   - Impact: Engineer could re-interpret "onPress → `useShareMyProfile()`" as "pass the hook's return directly to `onPressShare`", conflating a hook invocation with a handler. Also `myUserId` must come from `useGetMyProfileUseCase` — not stated.
   - Direction: Add a Done Criterion: "Edit site is `profile.screen.tsx:64-66` `handlePressShare`; body must call `useShareMyProfile()` (returning `(userId: string) => void` or auto-bound) or `shareApp(buildProfileShareUrl(myProfile.id))` where `myProfile.id` comes from `useGetMyProfileUseCase`. No new button, no second share hook." Also explicitly mark `onPressShare` prop contract as unchanged.

4. **e2e-flow-plan shows 3 new flows for Group 003, but `other-user-profile.yaml` also absorbs AC 7.2 / 7.3 — contract V5 only lists 3 flows and doesn't reconcile the plan's "Extend" vs "New" distinction.**
   - Evidence: `e2e-flow-plan.md:56-57` marks 7.2 as **Extend** (`other-user-profile.yaml`) and 7.3 as **New** (`profile-to-swipe-feed.yaml` 확장 or `other-user-to-swipe-feed.yaml`).
   - Contract reference: `group-003.md:100-103` lists exactly three flows (`profile-edit`, `other-user-profile`, `profile-to-swipe-feed`) — aligning with plan `:73-75`. But AC 7.3 (타유저 그리드 → SwipeFeed with `{kind:'user'}`) is not explicitly claimed by either `other-user-profile.yaml` or `profile-to-swipe-feed.yaml` in the contract. The plan's "확장 또는 `other-user-to-swipe-feed.yaml`" is ambiguous.
   - Impact: Group 003 smoke gate could pass while AC 7.3 has no Maestro coverage.
   - Direction: Pin AC 7.3 to `profile-to-swipe-feed.yaml` (extend with a `{kind:'user'}` assertion) OR add a 4th flow. Cite the plan line in V5.

### Minor

5. **Ground Rule 2 ambiguity on tab-bar reuse — current `profile-tab-bar.tsx` is hard-coded 3 tab.**
   - Evidence: `profile-tab-bar.tsx:33-55` hard-codes `TAB_SPECS` array with 3 entries (public / private / liked). The `tabs` prop does not exist. The comment at `:30-32` explicitly frames this as tab-bar for "tabs.{public,private,liked}".
   - Contract reference: `group-003.md:18` says "재사용 시 `tabs` prop 로 파라미터화하거나 별도 `OtherUserTabBar` 신설 중 택일 (FE Engineer 판단)".
   - Evaluator recommendation: **Prefer a separate `OtherUserTabBar` (or a slim header-bar with a single label)**. Parametrizing the existing tab-bar would require generic-izing `TAB_SPECS`, refactoring `TestIds.profile.tabs.*`, and loosening `ProfileLandingTab` — larger blast radius than the one-tab shortcut. Contract is fine letting FE choose, but should add a recommendation line ("Evaluator 권장: 최소 변경 — `OtherUserTabBar` 신설") to guide the judgment call.

6. **Edge Case 6 authentication footnote is mostly correct but `AUTH_REQUIRED_PATHS` file path is wrong.**
   - Evidence: `group-003.md:113` cites `"useNavigationLinking.ts::AUTH_REQUIRED_PATHS"` — but there are **two** files named `useNavigationLinking.ts`. The one with `AUTH_REQUIRED_PATHS` is `app/apps/MemeApp/src/app/navigation/useNavigationLinking.ts:25-29`, not `shared/routes/useNavigationLinking.ts` (which is a different helper). Edge case check is accurate (userId path is open), but the cite is loose.
   - Direction: Replace with `app/navigation/useNavigationLinking.ts:25-29`.

## Missing / Checked AC Coverage

| Task AC | Source | Contract Done Criterion | Status |
|---|---|---|---|
| app-005 AC1 (라우트 등록 + deeplink 진입) | `005:57` | `group-003.md:30` | Covered — but see Critical #1 implications on `linkScreens` (need `ProfileEdit: "profile/edit"` entry in `link-screens.ts`; not explicitly stated) |
| app-005 AC2 (presigned upload + fileUuid PATCH) | `005:58` | `group-003.md:33-36` | Covered |
| app-005 AC3 (닉네임 1/21자 저장 비활성) | `005:59` | `group-003.md:32`, `:39` | Covered |
| app-005 AC4 (저장 성공 invalidate) | `005:60` | `group-003.md:36` | Covered |
| app-005 AC5 (Maestro `profile-edit.yaml`) | `005:61` | `group-003.md:38` | Covered |
| app-005 AC6 (typecheck 0) | `005:62` | V3 `group-003.md:96` | Covered |
| app-006 AC1 (`zzem://profile/:userId` → OtherUserProfile) | `006:46` | `group-003.md:43` | Covered (route exists in `home-routes.ts:26-33` as ProfileTab param; but **contract conflates** "랜딩만 연결" with Group 002 routing — in fact, `/profile/:userId` currently lands on MY ProfileScreen, not OtherUserProfileScreen. Engineer must add a gate in `ProfileScreen` or register a separate screen.) |
| app-006 AC2 (게시물 단일 탭) | `006:47` | `group-003.md:46`, Ground Rule 2 | Covered |
| app-006 AC3 (URL 복사) | `006:48` | `group-003.md:44` | Covered |
| app-006 AC4 (공개 콘텐츠 그리드 cursor) | `006:49` | `group-003.md:47` | Covered |
| app-006 AC5 (404 에러 화면) | `006:50` | `group-003.md:49` | Covered |
| app-006 AC6 (Maestro `other-user-profile.yaml`) | `006:51` | `group-003.md:51` | Covered |
| app-007 AC1 ("프로필 공유" → OS 시트 + deeplink) | `007:41` | `group-003.md:56-57` | Covered with caveat (Major #3 — handler site not pinned) |
| app-007 AC2 (OG image / attachment 미사용) | `007:42` | `group-003.md:55`, Ground Rule 4 | Covered |
| app-007 AC3 (취소 시 에러 없음) | `007:43` | `group-003.md:58` | Covered (also `useNativeShare.ts:22-29` already swallows "User did not share") |
| app-007 AC4 (`useShareMyProfile` 실제 호출) | `007:44` | `group-003.md:57`, V1.4 | Covered with caveat (Major #3) |
| app-008 AC1 (me/public → SwipeFeed 본인 공개) | `008:52` | `group-003.md:67-68` | Covered but see Critical #1 |
| app-008 AC2 (me/private → SwipeFeed 본인 비공개) | `008:53` | `group-003.md:68` | Covered but see Critical #1 |
| app-008 AC3 (user/:id → SwipeFeed 타유저) | `008:54` | `group-003.md:69` | Covered with Major #4 caveat |
| app-008 AC4 (홈/추천 회귀 없음) | `008:55` | `group-003.md:75`, Regression Guard `:131` | **Gap — Critical #1.** Contract assumes `source === undefined` triggers "추천 쿼리" but no such queryFn exists. |
| app-008 AC5 (Maestro `profile-to-swipe-feed.yaml`) | `008:56` | `group-003.md:76` | Covered |

## Ground Rule Consistency Checks

- **GR 1 (count labels 3 canonical)** — Matches `profile-count-row.tsx:21-44` and DRIFT-02. OK.
- **GR 2 (단일 탭)** — Matches task AC. OK; see Minor #5 for reuse judgment guidance.
- **GR 3 (URL 복사 단일 항목)** — Matches task AC + PRD Phase 3 scope. OK.
- **GR 4 (공유 URL 순수 딥링크)** — Matches task AC + `useNativeShare.ts:17-20` capability. OK.
- **GR 5 (source union)** — Inconsistent with current SwipeFeed param shape. See Critical #1.
- **GR 6 (좋아요 탭 진입 없음)** — Enforceable only if `currentTab` threads to the item. See Major #2.
- **GR 7 (닉네임 FE 선제 차단)** — Matches api-contract `UpdateProfileRequest.nickname` minLength=2 maxLength=20 (`api-contract.yaml:292-295`). OK.
- **GR 8 (Settings 진입점 금지)** — Matches Group 002 checkpoint (`group-002-summary.md:32` — Settings 계정 섹션은 placeholder 유지). OK.

## Business Rule Traps

- Trap 2 (single tab), 3 (single URL 복사), 4 (순수 deeplink), 7 (length 2-20), 8 (no Settings entry) — all match source of truth.
- Trap 5 (source union) — verification language is fine, but blocked by Critical #1.
- Trap 6 (좋아요 탭 진입 없음) — "Group 002 현황: 좋아요 탭 empty state — item render 0 이므로 자연 비활성" is factually correct (`profile.screen.tsx:111-113` returns ProfileEmptyState when `contents.length === 0`), so "명시적 조건 추가는 옵셔널" holds. But see Major #2 — the risk surface is when Phase 2 adds liked items; minimal defensive cost now (FE Engineer can add a tab-gated onPress).

## Regression Guard

- `swipe-feed.yaml` (`e2e/flows/swipe-feed.yaml:13`) uses `zzem://swipe-feed/${E2E_SEED_FILTER_ID}?entryPoint=filter_preview`, which provides `targetId + entryPoint` but no `source`. Combined with Critical #1, the regression guard is only valid if the route param redesign keeps legacy params intact.
- Group 002 5 flow regression list in contract `group-003.md:130` is fine.

## Sign-off recommendation

**Revise before FE dispatch.** Resolve Critical #1 + Major #2/#3/#4 in a Round 2 contract edit (≤ 30 min). Minor #5/#6 optional but recommended for clarity. Once revisions are in place, Evaluator will return **APPROVE** and FE Engineer may pick up `group-003` tasks.

## Round 2

> Reviewer: Evaluator teammate · Date: 2026-04-22 · Scope: `contracts/group-003.md` Round 2 Patches section + canonical edits.
> Mode: Verification of 7 Sprint Lead patches against Round 1 Critical/Major/Minor issues.

### Verdict

**APPROVE** — all 7 patches resolve their target Round 1 issues cleanly. No residual gaps. FE Engineer 착수 허가.

### Per-patch Verification

1. **Patch 1 / Critical #1 (SwipeFeed discriminated union)** — RESOLVED. Ground Rule 5 (`group-003.md:21-30`) replaces `source?` single-shape design with a proper TypeScript discriminated union: legacy variant `{ targetId; type; initialIndex?; entryPoint }` + new profile variant `{ source; initialContentId? }`. Legacy callsites `filter-list-item.tsx:32` + `trending-filter-section-item.tsx:31` explicitly fenced "건드리지 않음" (line 30). app-008 Done Criterion `group-003.md:77` cites `"source" in params` narrowing; `group-003.md:82` calls out `createProfileFeedQuery(source)` factory; `group-003.md:78` pins legacy variant to "기존 queryFn 유지 … 회귀 0". Regression for `swipe-feed.yaml` now covered by design (legacy variant untouched).
2. **Patch 2 / Major #2 (tab prop threading)** — RESOLVED. app-008 Done Criterion `group-003.md:85` adds explicit requirement: `ProfileContentGrid` + `ProfileContentItem` accept `tab: 'public' | 'private'` prop, threaded from `ProfileTabContent` (`profile.screen.tsx:103-118`). `tab === 'liked'` blocks Grid render. onPress fires only when `tab ∈ {'public','private'}`, prop-gated. Ground Rule 6 cited in criterion.
3. **Patch 3 / Major #3 (useShareMyProfile pinned site)** — RESOLVED. app-007 Done Criterion `group-003.md:68-69` pins `profile.screen.tsx:64-66 handlePressShare` as exact edit site; `useGetMyProfileUseCase` named for `myProfile.id` derivation; `buildProfileShareUrl(myProfile.id)` composition stated; prohibitions explicit — "신규 버튼 추가 금지, 두번째 share hook 금지, `onPressShare` prop 인터페이스 미변경".
4. **Patch 4 / Major #4 (AC 7.3 Maestro coverage)** — RESOLVED. V5 (`group-003.md:116-117`) pins AC 7.3 into `profile-to-swipe-feed.yaml` (타유저 → SwipeFeed with `{kind:'user'}` source + first content id 일치 검증); AC 7.2 URL 복사 토스트 assert pinned into `other-user-profile.yaml`. e2e-flow-plan `:56`/`:57` lines cited. No 4th flow introduced — extension route chosen per plan.
5. **Patch 5 / Minor #5 (tab-bar recommendation)** — RESOLVED. app-006 Done Criterion `group-003.md:58` explicitly recommends `OtherUserTabBar` or inline single-tab headerbar neurosurgically, with rationale (blast radius 최소화, TestIds.profile.tabs.* / ProfileLandingTab 미수정). FE Engineer has clear guidance instead of open judgment.
6. **Patch 6 / Minor #6 (useNavigationLinking path cite)** — RESOLVED. Edge Case 6 (`group-003.md:127`) cites `app/apps/MemeApp/src/app/navigation/useNavigationLinking.ts:25-29`. Correct file (the app-side variant with `AUTH_REQUIRED_PATHS`), correct line range.
7. **Bonus / app-006 landing branching** — RESOLVED. Done Criterion `group-003.md:53-55` now explicit: `profile.screen.tsx` branches on `route.params?.userId !== myUserId` → `navigation.replace('OtherUserProfile', { userId })`. `OtherUserProfile` registered as new Profile/Root stack screen. "`home-routes.ts` 는 수정 불필요" stated verbatim. Alternative (home-routes parse branching) preserved as fallback with linking-config caveat.

### Residual Gaps

None. All Round 1 issues closed with contract-level citations. Minor observation: Regression Guard section (`group-003.md:145-147`) already reflects the new design (legacy 2 callsites untouched, `profile-content-item.tsx` as the sole migration target) — no further edits needed.

### Sign-off

- Evaluator Round 2 re-review: **APPROVE**.
- FE Engineer 착수 허가 — `group-003.md` is the canonical contract for app-005/006/007/008. Task files (`tasks/app/005-008`) subordinate to Ground Rules 1-8 where conflict arises.
- Sprint Lead may flip `group-003.md:164` Round 2 sign-off checkbox.
