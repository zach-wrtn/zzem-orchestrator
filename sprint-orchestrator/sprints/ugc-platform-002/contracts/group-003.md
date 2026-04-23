# Sprint Contract: Group 003 — 좋아요 + 페이백 + Deferred 정리

## Scope

- **Tasks**:
  - app-005 (LikeButton + LikeBadge) — 좋아요 카운트 실제 숫자 + 셀프 좋아요 + 훅 재배선
  - app-006 (MyProfile LikedTab) — 좋아요 탭 활성화
  - app-007 (PaybackIntroModal) — 최초 공개 1회성 안내 모달
  - app-008 (CreditHistory Payback row) — 크레딧 히스토리 PAYBACK variant
  - app-009 (Deferred items cleanup) — Phase 1 4 sub-fix (Home gear / landingTab race / Clipboard / initialContentId)
- **Target areas**:
  - `app/apps/MemeApp/src/presentation/swipe-feed/components/` (LikeButton, DoubleTapLikeOverlay 재사용)
  - `app/apps/MemeApp/src/presentation/profile/` (MyProfileScreen liked tab, ProfileGridCard-LikeBadge)
  - `app/apps/MemeApp/src/presentation/credit/componenets/` (credit-history-body.tsx PAYBACK row variant)
  - `app/apps/MemeApp/src/domain/favorite/favorite.usecase.ts` (be-004 재배선)
  - `app/apps/MemeApp/src/domain/me-contents/me-contents.usecase.ts` (isLikedPhase1 제거)
  - `app/apps/MemeApp/src/presentation/home/` (MINOR-G2-1 Home gear 제거)
  - `app/apps/MemeApp/src/presentation/profile/profile.screen.tsx` (MINOR-G2-2 landingTab race)
  - Codebase-wide `Clipboard` import 치환 (MINOR-G3-3)
  - `app/apps/MemeApp/src/presentation/swipe-feed/` (MINOR-G3-4 initialContentId fallback)
  - 신규 컴포넌트: `PaybackIntroModal` + userStorage flag
  - E2E: `payback-intro-modal.yaml` (신규), `credit-history.yaml` (확장), `my-profile-default-landing.yaml` (확장)
- **Depends on**: Group 001 (be-004 likes endpoint, payback entry) + Group 002 (SwipeFeed ownership threading pattern 재사용 가능)

## Prototype Reference

- app-005: `prototypes/app/app-005/LikeButton.spec.md` + `ProfileGridCard-LikeBadge.spec.md` + `prototype.html`
- app-006: `prototypes/app/app-006/MyProfileScreen-LikedTab.spec.md` + `prototype.html`
- app-007: `prototypes/app/app-007/PaybackIntroModal.spec.md` + `prototype.html`
- app-008: `prototypes/app/app-008/CreditHistoryRow-Payback.spec.md` + `CreditHistoryScreen-WithPayback.spec.md` + `prototype.html`
- app-009: `prototypes/app/app-009/HomeHeader-WithoutGear.spec.md` + `prototype.html` (Sub-fix 1 only; 2/3/4 logic-only)

## Done Criteria

### app-005 — Like Count + Toggle 재배선 (AC 3.1, 3.3)

- [ ] `useToggleFavoriteUseCase` **훅의 내부 구현만** be-004 endpoint 로 치환. export signature (`toggleFavorite(contentId, nextState)`) 유지. (Patch 1: Major #1)
- [ ] `nextState === true` → `POST /v2/contents/:contentId/likes`. `nextState === false` → `DELETE /v2/contents/:contentId/likes`.
- [ ] Response `LikeToggleResponse { contentId, liked, likeCount }` 파싱 — zod 필수 3 필드 (string / boolean / nonnegative int). 파싱 실패 시 cache 업데이트 skip + 기존 optimistic rollback.
- [ ] **기존 reaction endpoint 제거**: `rg "\/reactions|REACTION\.LIKE" app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' | grep -v __tests__` → 0 hit. favorite 도메인 외부에서 0 callsite.
- [ ] React Query cache 업데이트 대상 queryKey 상수: `MEME_QUERY_KEYS.feed.*`, `ME_CONTENTS_QUERY_KEYS.list('liked'|'public'|'private')`, `ME_CONTENTS_QUERY_KEYS.counts`, `USER_CONTENTS_QUERY_KEYS.list(userId)`. `invalidateQueries` 호출부 grep 으로 각 키 존재 확인. (Patch 1 + Minor m2)
- [ ] **Mapper fallback 금지 (Group 002 M1 재발 방지)**: `likeCount ?? 0`, `liked ?? false`, `userProfile.id || ""` 류 semantic-breaking fallback 금지. zod 필수 boolean/nonnegative int 강제. 파싱 실패 시 feed item 제외 (Phase 2 app-001 패턴 일관). (Patch 4: Major #4)
- [ ] grep: `rg 'likeCount\s*\?\?\s*0|liked\s*\?\?\s*false' app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' | grep -v __tests__` → 0 hit.
- [ ] **좋아요 카운트 ko-KR thousand separator** (Group 002 app-001 동일 패턴): `likeCount.toLocaleString('ko-KR')`. 1000+ 콤마, 0 포함, 축약 금지. korean-count import 0.
- [ ] LikeButton (SwipeFeed 액션 바 내): outlined ↔ filled heart 스위치, count 세로 정렬.
- [ ] ProfileGridCard-LikeBadge (그리드 카드 우하단): small heart icon + count.
- [ ] Self-like 허용 (owner === viewer 일 때도 disable 없음, likeCount +1 반영).
- [ ] Self-unlike 동작 (likeCount -1 반영).
- [ ] Optimistic update + onError rollback (기존 favorite cache 업데이트 패턴 재사용).
- [ ] DoubleTapLikeOverlay 재사용 (제스처로 좋아요 토글).
- [ ] 그리드 카드에도 좋아요 카운트 뱃지 노출 (MY + 타유저 프로필).

### app-006 — Liked Tab 활성화 (AC 3.2)

- [ ] `me-contents.usecase.ts` 의 `isLikedPhase1` 플래그 **제거** (grep `rg 'isLikedPhase1' app/apps/MemeApp/src` → 0 hit).
- [ ] `useGetMyContentsUseCase({ visibility: 'liked' })` 실제 쿼리 실행 (기존 skip 해제).
- [ ] MY profile 좋아요 탭 진입 시 실제 콘텐츠 그리드 렌더 (빈 상태는 ProfileEmptyState + "아직 좋아요한 콘텐츠가 없어요").
- [ ] 그리드 카드에 likeCount badge 표시 (app-005 와 일관).
- [ ] counts 응답 `liked` 값 탭 라벨에 반영.
- [ ] 카드 탭 → SwipeFeed `{kind:'me', visibility:'liked'}` variant 진입 지원. `useGetProfileSwipeFeedUseCase` switch 에 liked 케이스 추가. (Patch 3: Major #3)
- [ ] **Cross-variant mapper 정합 (Group 002 M4 재사용)**: 신규 liked variant 추가 후 3 진입 path 모두 동일 `meme.mapper.ts` (또는 `me-contents.mapper.ts`) 경유하여 `FeedItemEntity` 생성 확인:
   - (a) MY 3-tab (`kind:me, visibility:public|private|liked`)
   - (b) ProfileToSwipeFeed (`kind:user, userId`)
   - (c) legacy 홈 필터 (`targetId, type, entryPoint`)
   - 각 path 의 queryFn trace + `FeedItemEntity.likeCount/liked` 필드 일관.
- [ ] variant 별 **enabled gate** 필수 (rubric C12):
   - liked variant: `enabled: source.kind === 'me' && source.visibility === 'liked'`
   - public/private variant: 기존 gate 유지
   - user variant: `enabled: source.kind === 'user'`
   - legacy: `enabled: !!source.targetId`
   - 다른 variant 불필요 fire 없음 (network spy).
- [ ] Route types 확장 후 legacy 홈 variant callsite (rubric C7 v3) typecheck clean. `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.
- [ ] Liked 탭 빈 상태 → ProfileEmptyState (Phase 1 동작 보존).
- [ ] 공개/비공개 탭 회귀 없음 (`my-profile-default-landing.yaml` 통과).

### app-007 — Payback Intro Modal (AC 4.4)

- [ ] 신규 컴포넌트 `PaybackIntroModal` 생성 (BottomSheet 채택 — Phase 3 prototype SSOT).
- [ ] Content (PRD 직역):
  - Title: `"쨈 런칭 기념 프로모션 크레딧 1% 페이백"`
  - Body: `"내 콘텐츠를 다른 유저가 재생성하면, 소비한 크레딧의 1%가 나에게 적립돼요."`
  - Single CTA (primary brand): `"확인했어요"`
- [ ] Closeable only by CTA tap — backdrop dismiss 금지.
- [ ] **1회성 gate**: `userStorage` (`@wrtn/mmkv-kit`, MMKV **동기 I/O**) 에 `PAYBACK_INTRO_SHOWN: boolean` flag. 기존 codebase 패턴 재사용 — `createStorageBuilder(userStorage).boolean().build()` (참조: `shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx`, `presentation/meme/hooks/useWatermarkRemovalChecker.tsx`). (Patch 2: Major #2 — AsyncStorage 오해 해소)
- [ ] 동기 I/O 이므로 Provider preload / async race 처리 불필요. Hook 내부에서 즉시 `get()` → false (기본값) 시 1회차 노출, true 시 skip. 노출 후 `set(true)`. `undefined` 상태는 false 로 간주.
- [ ] 비로그인 시 trigger 자체 skip (authUser 존재 체크 선행).
- [ ] **Trigger primary** (단일): 생성 완료 후 자동 공개 성공 이벤트. `useGenerateMemeUseCase` onSuccess + `result.isPublished === true` 시점. (Patch 5: Minor m1)
- [ ] **Trigger secondary** (fallback only, primary 미발화 경우 대비): 게시 토글 OFF→ON 성공 시점 (app-004 `useUpdateMeContentVisibilityUseCase` onSuccess). flag === true 시 양쪽 trigger 모두 no-op. 동일 세션 중복 mount 방지는 MMKV 동기 read 로 자연 보장.
- [ ] `usePaybackIntro()` hook 또는 Provider — `show() / markShown() / hasBeenShown()`.
- [ ] Illustration: inline SVG placeholder (coin + heart).
- [ ] `usePaybackIntro()` **callsite ≥ 1 hit** (Generator / PublishToggle 첫 공개 경로) — dead-hook grep 게이트.

### app-008 — Credit History PAYBACK row (AC 4.2)

- [ ] `credit.mapper.ts` + Zod 에 `CREDIT_TRANSACTION_TYPE.PAYBACK` enum 값 추가 (be-003 호환).
- [ ] CreditHistoryRow variant 분기:
  - `transactionType === 'PAYBACK'` → `PaybackHistoryRow` (thumbnail + "크레딧 페이백" title + amount 양수)
  - 기존 타입 row 렌더 회귀 없음.
- [ ] `PaybackHistoryRow` 구조:
  - Left: content thumbnail (40×40 radius 12, 기존 `MyCreditHistoryListThumbnail.CONFIG` 일관성).
  - Center: Title "크레딧 페이백" (bold) + optional description.
  - Right: amount `+{N} 크레딧` (promotion violet color, bold).
- [ ] `CreditMapper.toCreditHistoryChipEntityCollection()` 내 '적립' chip 의 transactionType 배열에 `CREDIT_TRANSACTION_TYPE.PAYBACK` 추가. 기존 chip 카운트 (충전/차감/환불) snapshot test 회귀 없음. (Patch 7: Minor m6)
- [ ] 기존 타입 (충전/차감/환불) row 회귀 없음.

### app-009 — Deferred Items Cleanup (from ugc-platform-001)

- [ ] **Sub-fix 1 (MINOR-G2-1)** — Home header gear 제거:
  - PRD grep 근거 이미 확인 (prototypes/app/app-009 evidence) — default 제거.
  - Home header 컴포넌트에서 gear icon 제거.
  - 관련 e2e flow (`home-to-settings.yaml` 등) 이 있으면 MY 경유로 재작성.
- [ ] **Sub-fix 2 (MINOR-G2-2)** — `profile.screen.tsx` useEffect landingTab race:
  - `hasAutoLanded` flag 또는 route param override 기반 1회 sync.
  - AC 2.1 랜딩 우선순위 유지. AC 2.7 공개 탭 redirect 유지.
- [ ] **Sub-fix 3 (MINOR-G3-3)** — Clipboard 모듈 교체:
  - `yarn add @react-native-clipboard/clipboard` (monorepo workspace).
  - `rg "from 'react-native'" app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' --glob '!**/__tests__/**' --glob '!**/*.test.*' | rg 'Clipboard'` → 0 hit (production 코드 한정, scope = MemeApp/src).
  - `app-core-packages/` 의 pre-existing Clipboard 사용은 scope 외 (별도 follow-up 기록). (Patch 6: Minor m3)
  - `@react-native-clipboard/clipboard` import 치환 + iOS pod install / Android auto-linking 확인.
  - 기존 URL 복사 기능 회귀 없음 (`other-user-profile` flow).
- [ ] **Sub-fix 4 (MINOR-G3-4)** — SwipeFeed initialContentId fallback (Patch 6: Minor m4):
  - fallback 코드: `const initialIndex = list.findIndex(i => i.id === initialContentId); const effectiveIndex = initialIndex >= 0 ? initialIndex : 0;`
  - 3 케이스 모두 동작 확인:
    - (a) `list.length ≥ 1 + initialContentId 존재 match` → 기존 index 유지 (회귀 없음).
    - (b) `list.length ≥ 1 + initialContentId 없음/불일치` → effectiveIndex = 0.
    - (c) `list.length === 0` → SwipeFeed empty state (기존 fallback UI 재사용, index 접근 전 early return).
  - Unit test 또는 Evaluator trace.

## Regression Guard (Phase 1 + Group 001/002 Inherited)

- [ ] Phase 1 `my-profile-default-landing.yaml` 통과 (AC 2.1 자동 랜딩 우선순위 — Sub-fix 2 영향).
- [ ] Phase 1 `other-user-profile.yaml` 통과 (AC 7.2 URL 복사 — Sub-fix 3 Clipboard 교체).
- [ ] Group 002 Ownership threading (`isOwnOverride`) 재사용 적절 — app-006 liked 탭 카드 → SwipeFeed 진입 시 `kind: 'me', visibility: 'liked'` variant 로 자연스러움.
- [ ] Group 002 좋아요 포매터 (`toLocaleString('ko-KR')`) 일관 적용 — app-005 / app-006.
- [ ] Credit history 기존 row 렌더 회귀 없음 (Phase 1 이전 타입).
- [ ] SwipeFeed discriminated union liked variant 추가 시 legacy/me/user variant 정상 동작 (enabled gate 적용).

## Verification Method

### 공통 빌드 품질
- [ ] `cd app/apps/MemeApp && yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` — 신규 0 (baseline: lib/utils 2건 유지).
- [ ] `yarn lint` 신규 에러 0.

### Dead-hook / Dead-flag Detection (Group 001/002 Lesson #3)
- [ ] `rg 'usePaybackIntro\(' app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts'` ≥ 1 (PaybackIntroModal trigger callsite 의무).
- [ ] `rg 'isLikedPhase1' app/apps/MemeApp/src` → 0 hit (제거 확인).

### Active Evaluation Techniques

1. **Trace — 좋아요 API 재배선 (app-005)**:
   - `useToggleFavoriteUseCase` 가 POST/DELETE `/v2/contents/:id/likes` endpoint 호출 확인 (network spy or repository-impl.ts trace).
   - 기존 reaction endpoint 경로와 분리 유지 (회귀 확인).

2. **Trace — 좋아요 카운트 포맷 (app-005)**:
   - `rg 'likeCount' app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts' | grep -i 'korean'` → 0 hit (좋아요에 korean-count 금지).
   - `toLocaleString('ko-KR')` 또는 `Intl.NumberFormat` 사용.

3. **Trace — Liked Tab Enabled Gate (app-006, rubric C12)**:
   - `useGetProfileSwipeFeedUseCase` liked variant 추가 시 `enabled: source.kind === 'me' && source.visibility === 'liked'` 가드 존재.
   - 다른 variant 의 불필요 fire 없음.

4. **Trace — PaybackIntroModal 1회성 gate (app-007)**:
   - `userStorage.get/set(PAYBACK_INTRO_SHOWN)` 호출부 확인.
   - 2회차 노출 테스트: flag=true 시 show() no-op 코드 경로 확인.

5. **Trace — Payback row variant (app-008)**:
   - `transactionType === 'PAYBACK'` 분기 코드 확인.
   - Zod enum 에 PAYBACK 추가 확인.
   - 기존 변형 경로 회귀 없음.

6. **Trace — landingTab race fix (app-009 Sub-fix 2)**:
   - `hasAutoLanded` state 또는 동등 flag 도입 확인.
   - AC 2.1 공개/비공개 우선순위 seed 기반 검증.

7. **Clipboard import 전수 (app-009 Sub-fix 3)**:
   - `rg "from 'react-native'" app/apps/MemeApp/src | rg 'Clipboard'` → 0 hit.
   - `@react-native-clipboard/clipboard` import 확인.

8. **SwipeFeed initialContentId fallback (app-009 Sub-fix 4)**:
   - `list.findIndex(...) >= 0 ? ... : 0` 패턴 존재.
   - 정상 케이스 (id 존재) 기존 동작 유지.

9. **E2E Smoke Gate (phase-build §4.3.2, rubric C9)** (Patch 8: Minor m5):
   - 신규 `payback-intro-modal.yaml` 실행. Flow 상단 주석 prerequisite:
     - `clearState: true` (Maestro app reset → MMKV `PAYBACK_INTRO_SHOWN` 초기화)
     - Seed user 가 콘텐츠 1개 보유 (publish=false initial)
     - Step 1: 게시 토글 OFF→ON 또는 첫 생성 → PaybackIntroModal assertVisible
     - 2회차 노출 금지는 unit test (flag true 분기 no-op)
   - `credit-history.yaml` 확장: PAYBACK row assertVisible + "크레딧 페이백" text + thumbnail
   - `my-profile-default-landing.yaml` 확장: 좋아요 탭 진입 + empty/with-items 2 branch
   - Maestro tap 제약 인지 — assertVisible 위주

10. **Mapper fallback semantic 검증 (Group 002 M1 lesson)** (Patch 4: Major #4):
    - `rg 'likeCount\s*\?\?|liked\s*\?\?\s*false' app/apps/MemeApp/src` → 0 hit (runtime default 금지).
    - zod 필수 필드 확인: `LikeToggleResponse.schema` + `FeedItemEntity.schema` likeCount/liked 필수 여부.
    - Self-like 판정 코드 경로: `item.ownerId === myUserId` 비교가 mapper 에서 fallback (`""` / undefined) 으로 false 오판하지 않는지 trace.

## KB Pattern Injection

- **completeness-003 (route param)** — BE 호출 필드명 변경 없음 (be-004 LikeToggleResponse consume 만).
- **completeness-006 (enabled gate)** — app-006 SwipeFeed liked variant 의 queryFn 가드.
- **completeness-007 (prop threading)** — app-005 LikeButton / LikeBadge 가 FeedItemEntity 의 likeCount/liked 를 그대로 표시.
- **integration-001 (BE/FE 필드명)** — `likeCount`, `liked`, `CREDIT_TRANSACTION_TYPE.PAYBACK` 일치 검증.
- **correctness-002 (JS getter JSON 누락)** — BE 선례. FE 는 받은 응답 소비만.

## Cross-group Integration (With Group 001 + Group 002)

- app-005 ↔ be-004: LikeToggleResponse, `/v2/contents/:id/likes` 엔드포인트.
- app-006 ↔ be-004: `/v2/me/contents?visibility=liked` 활성화된 응답. counts.liked 실제 값.
- app-007 ↔ (no BE): 순수 FE + userStorage.
- app-008 ↔ be-003: CreditHistory PAYBACK transactionType 수신.
- app-005 / app-006 ownership 이 필요하면 Group 002 `isOwnOverride` 패턴 재사용 가능.

## Sign-off

- Sprint Lead draft: 2026-04-23
- Evaluator Round 1: ISSUES (Major 4 / Minor 6) — `group-003-review.md`
- Sprint Lead patches applied (Round 2 submission): 2026-04-23
  - Patches 1–4 (Major #1~4) + Patches 5~8 (Minor m1/m3/m4/m5/m6) 모두 반영
  - Minor m2 (QueryKey 상수) Patch 1 에 통합 반영
- Status: _awaiting Round 2 review_
- Evaluator approved 2026-04-23
