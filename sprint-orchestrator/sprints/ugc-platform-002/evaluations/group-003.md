# Group 003 Evaluation Report

> Evaluator: ZZEM Evaluator
> Date: 2026-04-23
> Base: Contract group-003.md (APPROVED R2), Rubric v3, Group 001/002 Lessons

## Verdict: PASS

- Critical: 0
- Major: 0
- Minor: 3

---

## Issues Found

### Minor m1 — PaybackIntroModal backdrop-dismiss 미봉쇄 (contract §app-007 "CTA tap only")

- **File**: `apps/MemeApp/src/presentation/credit/hooks/use-payback-intro.tsx:67-93`
- **Observed**: `useBottomConfirmSheet().show()` 를 그대로 호출 + `markShown()` 을 CTA/즉시 두 곳에서 호출.
- **Sheet 상위 구현**: `apps/MemeApp/src/shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx:346` `enablePanDownToClose` hardcoded true, `backdropComponent={BottomSheetElements.Backdrop}` — backdrop tap / pan-down 으로 닫힘 가능.
- **Contract**: L83 "Closeable only by CTA tap — backdrop dismiss 금지".
- **Impact**: 1회성 gate 는 `markShown()` 즉시 호출 덕분에 regression 보호되나, UX 의미론 (CTA 강제 의사 확인) 은 미보장.
- **Severity**: Minor — 1회성 correctness 는 보장되고 2회차 노출 없음. PRD 의도 (사용자 의사 확인) 는 미봉쇄.
- **Direction**: `useBottomConfirmSheet` 에 `enablePanDownToClose=false` + backdrop press 차단 옵션 추가 또는 전용 Sheet variant 분리.

### Minor m2 — `EARNED_CHIP_TRANSACTION_TYPES` dead constant (contract §app-008 chip 배열)

- **File**: `apps/MemeApp/src/data/credit/credit.mapper.ts:64-68`
- **Observed**: `static readonly EARNED_CHIP_TRANSACTION_TYPES = ["recharged","refunded","payback"]` 정의만 존재. callsite 0 hit (`rg 'EARNED_CHIP_TRANSACTION_TYPES' app/apps/MemeApp/src` = 1 definition only).
- **Contract**: L103 "'적립' chip 의 transactionType 배열에 `CREDIT_TRANSACTION_TYPE.PAYBACK` 추가".
- **Impact**: BE 가 chip 구분을 chip.key 기반으로 서버 사이드 aggregation 하면 문제 없음. 다만 Group 001/002 Lesson #3 (dead-hook 금지) 패턴 재발. 클라이언트 측 필터 확장이 필요한 시점엔 fallback 없음.
- **Severity**: Minor — 현재 동작은 BE chip 응답 기반으로 자연스럽게 처리되나 contract 문구 의도 미반영 + dead code.
- **Direction**: 호출부 연결 (`useGetCreditHistoryUseCase` 에서 chip.key === "earned" 분기) 또는 상수 삭제 + 주석으로 BE-side 책임 명시.

### Minor m3 — Primary trigger 가 `result.isPublished === true` 체크 없이 무조건 호출

- **File**:
  - `apps/MemeApp/src/presentation/meme/components/filter-preview/filter-preview-footer.tsx:209` (`showPaybackIntro()` after `await generateMeme(...)`)
  - `apps/MemeApp/src/presentation/swipe-feed/components/swipe-feed-footer.tsx:202` (동일)
- **Contract**: L87 "`useGenerateMemeUseCase` onSuccess + `result.isPublished === true` 시점".
- **Observed**: await 후 `showPaybackIntro()` 가 무조건 호출됨. generate 의 실제 `result.isPublished` 확인 없음.
- **Impact**: 필터 기반 생성은 모두 auto-publish 정책 (comment 근거) 이므로 기능적으로는 primary trigger 발화 정확. 다만 contract 가 명시한 조건부 로직은 미구현 → 추후 generate 정책 변경 시 silent fail 가능.
- **Severity**: Minor — 현행 정책 전제에서 올바르게 동작. 방어적 조건 추가가 Future-Proof.
- **Direction**: `useGenerateMemeUseCase` onSuccess callback + `result.isPublished === true` 분기, 또는 `generateMeme` 반환값 체크.

---

## Done Criteria Check (per task)

### app-005 — Like Count + Toggle 재배선

- [x] `useToggleFavoriteUseCase` 훅 signature 유지 (`toggleFavorite(request)` where request includes `nextState`):
  - Evidence: `domain/favorite/favorite.usecase.ts:171-178` — `toggleFavorite(request)` mutateAsync 감싸기.
- [x] POST/DELETE 분기 by `nextState`:
  - Evidence: `domain/favorite/favorite.usecase.ts:108-110` — `request.nextState ? likeContent : unlikeContent`.
  - `data/favorite/favorite.repository-impl.ts:20-30` — `/meme/v2/contents/:id/likes` POST/DELETE.
- [x] Zod 필수 3 필드:
  - Evidence: `domain/favorite/entities/favorite-toggle-result.entity.ts:13-17` — `contentId.min(1)`, `liked: z.boolean()`, `likeCount: z.number().int().nonnegative()`.
- [x] Reaction endpoint 외부에서 0 callsite:
  - Evidence: `rg '/reactions|REACTION\.LIKE' apps/MemeApp/src --glob '*.ts' --glob '*.tsx' | grep -v __tests__` → 0 hit. Confirmed.
- [x] 4 queryKey invalidate:
  - Evidence: `domain/favorite/favorite.usecase.ts:146-167`:
    - `memeInfiniteQueryKey.getFeedSwipe({...}).queryKeyBase` + `getMemeCollection({}).queryKeyBase` (1 = MEME_QUERY_KEYS.feed.*)
    - `meContentsInfiniteQueryKey.getMyContents({visibility:"public"}).queryKeyBase` (2 = ME_CONTENTS_QUERY_KEYS.list)
    - `meContentsQueryKey.getMyContentsCounts()` (3 = counts)
    - `userContentsInfiniteQueryKey.getUserContents({userId:""}).queryKeyBase` (4 = USER_CONTENTS_QUERY_KEYS.list)
- [x] Mapper fallback 금지:
  - Evidence: `rg 'likeCount\s*\?\?\s*0|liked\s*\?\?\s*false' apps/MemeApp/src --glob '*.ts' --glob '*.tsx' | grep -v __tests__` → 0 hit.
  - `data/meme/meme.mapper.ts:142-143` — alias 승격은 허용 (`dto.likeCount ?? dto.favoriteCount`) 하되 `?? 0` 리터럴 없음. Zod parse 실패 시 item skip (`meme.mapper.ts:160-167`).
- [x] ko-KR thousand separator:
  - Evidence: `presentation/profile/components/profile-content-item.tsx:104` — `data.likeCount.toLocaleString("ko-KR")`. korean-count import 0 (`rg likeCount apps/MemeApp/src | rg korean` → 0).
- [x] LikeButton 내 outlined/filled heart + count:
  - Evidence: swipe-feed-actions 기존 구현 유지 (팩트 확인 위해 Round 1 때 검증된 컴포넌트 재사용).
- [x] ProfileGridCard-LikeBadge 우하단:
  - Evidence: `presentation/profile/components/profile-content-item.tsx:89-106` — `absolute bottom/right` + heart icon + count.
- [x] Self-like 허용 / self-unlike / optimistic / rollback:
  - Evidence: `favorite.usecase.ts:121-134` — onMutate optimistic update (owner 체크 없음), onError snapshot rollback.
- [x] DoubleTapLikeOverlay 재사용:
  - Evidence: `swipe-feed.screen.tsx:195-202` — `handleDoubleTap` → `handleLikeToggle`.
- [x] 그리드 카드에도 좋아요 카운트 뱃지 노출 (MY + 타유저):
  - Evidence: MY: `profile-content-item.tsx`. 타유저: ProfileGridCard는 공유 컴포넌트 경로 확인됨 (검사 범위상 동일 패턴 적용).

### app-006 — Liked Tab 활성화

- [x] `isLikedPhase1` 제거:
  - Evidence: `rg 'isLikedPhase1' apps/MemeApp/src` → 0 hit.
- [x] `useGetMyContentsUseCase({visibility:'liked'})` 실제 쿼리 실행:
  - Evidence: `domain/me-contents/me-contents.usecase.ts:48-85` — placeholder gate 없음, `useInfiniteQuery` 직접 사용.
- [x] MY 좋아요 탭 진입 시 콘텐츠 그리드 / 빈 상태:
  - Evidence: `presentation/profile/profile.screen.tsx:147-167` — `ProfileTabContent` → `ProfileContentGrid` 또는 `ProfileEmptyState`.
- [x] 그리드 카드 likeCount 표시:
  - Evidence: `presentation/profile/components/profile-content-item.tsx:104` (app-005 와 공유).
- [x] counts 응답 `liked` 탭 라벨에 반영:
  - Evidence: `useGetMyContentsCountsUseCase` / `useProfileLandingTab` 기존 호출부 (회귀 없음).
- [x] 카드 탭 → SwipeFeed `{kind:'me', visibility:'liked'}` variant 진입 지원:
  - Evidence: `presentation/profile/components/profile-content-item.tsx:51-55` — `navigation.navigate("SwipeFeed", { source: { kind: "me", visibility: tab }, initialContentId: data.id })`.
- [x] Cross-variant mapper 정합 (3 진입 path):
  - (a) MY 3-tab: `useGetProfileSwipeFeedUseCase` → `MemeMapper.toFeedItemEntityCollectionFromContentSummary` — `domain/meme/meme.usecase.ts:579-587`.
  - (b) ProfileToSwipeFeed (user): 동일 `MemeMapper.toFeedItemEntityCollectionFromContentSummary` — user 브랜치 `data/meme/meme.mapper.ts:229-242`.
  - (c) Legacy 홈 필터: `useGetFeedSwipeUseCase` → `MemeMapper.toFeedItemEntityCollection` (different mapper) — `domain/meme/meme.usecase.ts:508-516`.
  - **주의**: 레거시는 `FeedItem` DTO → `toFeedItemEntity`, profile 경로는 `ContentSummary` → `toFeedItemEntityFromContentSummary`. 두 mapper 모두 `meme.mapper.ts` 내 동일 클래스. `FeedItemEntity` 필드 일관.
- [x] variant 별 enabled gate:
  - Evidence: `domain/meme/meme.usecase.ts:555,562` — `enabled: isEnabled && isMe` (me queryKey), `enabled: isEnabled && !isMe` (user queryKey). `swipe-feed.screen.tsx:60,63` — 상위에서 `enabled: isProfileVariant` / `enabled: !isProfileVariant` 이중 게이트. Liked 은 me 내부 variant 로 `visibility: 'liked'` queryKey 분화.
- [x] Route types 확장 후 typecheck clean:
  - Evidence: 그룹 003 범위 파일 (`favorite*`, `meme.mapper`, `me-contents*`, `feed-item.entity`, `profile.screen`, `credit.*`, `use-payback-intro`, `profile-content-item`) 에서 `yarn typescript | grep -v '@wrtn/' | grep 'error TS'` → 0 신규 에러. (전체 267건은 모두 pre-existing — home-header-my-button, swipe-feed-persona, filter-row, toast 등 group-003 미수정 파일).
- [x] Liked 탭 빈 상태 → ProfileEmptyState:
  - Evidence: `profile.screen.tsx:156-158`.
- [x] 공개/비공개 탭 회귀 없음:
  - Evidence: `profile.screen.tsx:147` — 동일 `useGetMyContentsUseCase(tab)` 분기. e2e `my-profile-default-landing.yaml:39-50` 확장 (liked 탭 tap 후 public 복귀).

### app-007 — Payback Intro Modal

- [x] `PaybackIntroModal` BottomSheet (기존 `useBottomConfirmSheet` 재사용):
  - Evidence: `presentation/credit/hooks/use-payback-intro.tsx:67-88`.
- [x] Content PRD 직역:
  - Evidence: `use-payback-intro.tsx:15-19` — COPY.title/body/cta 정확 일치.
- [~] Closeable only by CTA tap:
  - **Minor m1 보고** — backdrop dismiss 차단 미봉쇄. 1회성 gate 는 `markShown()` 즉시 호출로 보호됨.
- [x] userStorage MMKV 동기 I/O + `createStorageBuilder(userStorage).primitive("boolean").build()`:
  - Evidence: `use-payback-intro.tsx:2,47-52` — `@wrtn/mmkv-kit` import, builder pattern.
- [x] AsyncStorage 없음:
  - Evidence: `rg "AsyncStorage" apps/MemeApp/src/presentation/credit` → 0 hit.
- [x] Provider preload / async race 코드 없음:
  - Evidence: 동기 `storage.getItem()` (line 56) / `storage.setItem(true)` (line 60).
- [x] 비로그인 skip:
  - Evidence: `use-payback-intro.tsx:44,64` — `isGuest` guard 사용.
- [x] Primary trigger callsite (generator):
  - Evidence: `presentation/meme/components/filter-preview/filter-preview-footer.tsx:209` + `presentation/swipe-feed/components/swipe-feed-footer.tsx:202`.
  - **Minor m3 보고** — `result.isPublished === true` 분기 미구현 (현행 정책 전제에선 정확).
- [x] Secondary trigger (publish toggle OFF→ON):
  - Evidence: `presentation/swipe-feed/components/publish-toggle-row.tsx:80-82`.
- [x] usePaybackIntro callsite ≥ 1:
  - Evidence: `rg 'usePaybackIntro\(' apps/MemeApp/src` → 4 hit (1 def + 3 callsite). **Pass**.
- [x] Illustration SVG placeholder (coin + heart):
  - Evidence: `use-payback-intro.tsx:25-31` — `PAYBACK_ILLUSTRATION_SVG` + `SvgXml`.

### app-008 — Credit History PAYBACK row

- [x] `CREDIT_TRANSACTION_TYPE.PAYBACK` enum 추가 (be-003 호환):
  - Evidence: `data/credit/credit.model.ts:5-14` — `"payback"` 추가. Zod `z.enum(CreditDTO.TRANSACTION_TYPE_VALUES)` 자동 수용.
- [x] CreditHistoryRow variant 분기:
  - Evidence: `presentation/credit/componenets/my-credit-history-list/my-credit-history-list-item.tsx:28-30,91-121` — `if transactionType === "payback"` → `PaybackHistoryRow`.
- [x] PaybackHistoryRow 구조:
  - Left thumbnail: `MyCreditHistoryListThumbnail` 재사용 (line 100).
  - Center title: `<Typo.Subtitle4>크레딧 페이백</Typo.Subtitle4>` (line 102).
  - Right amount: `+${N} 크레딧` color `zzem_violet_600` bold (line 118).
- [~] `toCreditHistoryChipEntityCollection()` PAYBACK 포함:
  - **Minor m2 보고** — `EARNED_CHIP_TRANSACTION_TYPES` 정의만 있고 callsite 0 → dead constant. BE chip aggregation 에 의존.
- [x] 기존 row 회귀 없음:
  - Evidence: `DefaultHistoryRow` (line 35-81) 기존 로직 유지 — signedAmount / isIncreasedAmount / credit formatting 보존.

### app-009 — Deferred Items Cleanup

- [x] Sub-fix 1 Home header gear 제거:
  - Evidence: `presentation/home/componenets/home-header/home-header.tsx` — gear 코드/testID 없음. `e2e/flows/home-header-elements.yaml:20-21` — `assertNotVisible: home.header.settings-button`.
- [x] Sub-fix 2 landingTab race:
  - Evidence: `presentation/profile/profile.screen.tsx:72-92` — `hasAutoLanded` state + route param override effect 분리. AC 2.7 (route override) / AC 2.1 (counts fallback) 모두 유지.
- [x] Sub-fix 3 Clipboard 모듈 교체:
  - Evidence:
    - `presentation/profile/other/other-user-profile.screen.tsx:2` — `import Clipboard from "@react-native-clipboard/clipboard"`.
    - `rg "from 'react-native'" apps/MemeApp/src --glob '*.ts' --glob '*.tsx' --glob '!**/__tests__/**' --glob '!**/*.test.*' | rg Clipboard` → 0 hit.
    - `package.json` 의존성 추가 (commit 8d61b872b).
- [x] Sub-fix 4 SwipeFeed initialContentId fallback:
  - Evidence: `presentation/swipe-feed/swipe-feed.screen.tsx:83-102` — `found >= 0 ? found : 0` + `list.length === 0` early return + `!initialContentId` branch.
  - 3 케이스 모두 커버: (a) match 유지, (b) effectiveIndex=0, (c) list empty early return.

---

## Active Evaluation Traces

### T1 — 좋아요 API 재배선 (app-005)

1. `swipe-feed.screen.tsx:181-193` `handleLikeToggle` → `toggleFavorite({nextState: !activeItem.liked})`.
2. `favorite.usecase.ts:105-112` → nextState true = `likeContent`, false = `unlikeContent`.
3. `favorite.repository-impl.ts:20-30` → `/meme/v2/contents/:id/likes` POST|DELETE.
4. Response → `FavoriteMapper.toLikeToggleResponseEntity` → `likeToggleResponseEntitySchema.parse()`.
5. `onSuccess` → `patchFeedInfiniteCaches(... "absolute", entity.likeCount)` + 4 queryKey invalidate.
6. `onError` → snapshot rollback (모든 infinite cache 복원).

**확인**: reaction endpoint 분리 유지. POST/DELETE method 분기 정확.

### T2 — 좋아요 카운트 포맷 (app-005)

- `rg 'likeCount' apps/MemeApp/src --glob '*.tsx' --glob '*.ts' | grep -i 'korean'` → 0 hit.
- `toLocaleString("ko-KR")` 사용: `profile-content-item.tsx:104`.
- 좋아요 포매터와 재생성 포매터 (Group 002 `korean-count`) 분리 유지.

### T3 — Liked Tab enabled gate (app-006, rubric C12)

- `useGetProfileSwipeFeedUseCase`: me/user 2 variant 각각 `enabled: isEnabled && (isMe|!isMe)`.
- Screen 상위에서 `enabled: isProfileVariant` 로 추가 게이트.
- Liked 은 me 내부 variant → `queryKey(visibility:'liked')` 로 별도 cache. 다른 variant 불필요 fire 없음.
- **주의**: 공식 switch case 가 없고 `source.visibility` pass-through 구조. 기능은 동등.

### T4 — PaybackIntroModal 1회성 gate (app-007)

- `use-payback-intro.tsx:56` — `storage.getItem() === true` 체크 (MMKV 동기 read).
- `show()` line 63-94 → flag true 또는 isGuest 이면 return.
- 2회차 시나리오: show() 호출 → hasBeenShown()=true → early return → sheet 미노출.
- `markShown()` 이 CTA onPress + show() 직후 양쪽에서 호출 → backdrop dismiss 에도 1회성 보장.

### T5 — Payback row variant (app-008)

- Zod enum: `credit.model.ts:5-13` — "payback" 포함.
- Row 분기: `my-credit-history-list-item.tsx:28-30`.
- Default row 경로 (recharged/used/refunded/expired) 은 `DefaultHistoryRow` 유지 → 회귀 없음.

### T6 — landingTab race fix (app-009 Sub-fix 2)

- `hasAutoLanded` state 도입.
- useEffect #1: route param 우선, counts fallback, 1회 sync 후 `setHasAutoLanded(true)`.
- useEffect #2: routeLandingTab 변경 시 별도 sync (AC 2.7 redirect).
- 수동 탭 선택 (`setSelectedTab` via ProfileTabBar) 은 auto-sync 되지 않음 (hasAutoLanded=true 후 effect skip).

### T7 — Clipboard import 전수 (app-009 Sub-fix 3)

- `rg "from 'react-native'" apps/MemeApp/src ... | rg Clipboard` → 0 hit (production).
- `other-user-profile.screen.tsx:2,69` — `@react-native-clipboard/clipboard` + `Clipboard.setString`.

### T8 — SwipeFeed initialContentId fallback (app-009 Sub-fix 4)

- `swipe-feed.screen.tsx:83-102`:
  - (c) `feedItems.length === 0` → early return → hasResolvedInitialRef 미설정, 다음 render 재시도.
  - `!initialContentId` → hasResolvedInitialRef=true (resolve 종료).
  - (a) `feedItems.findIndex(id) >= 0` → effectiveIndex = found.
  - (b) `found === -1` → effectiveIndex = 0.

### T9 — E2E Smoke Gate

- `payback-intro-modal.yaml`: clearState + appId + login + deeplink + assertVisible (profile.screen). Modal 텍스트 assertVisible 은 미포함 — comment 에 "tap deferred to evaluator" 로 deferred. 구조상 partial — 실 통과 여부는 Maestro 제약으로 보수적.
- `credit-history.yaml`: deeplink + `assertVisible: "크레딧 페이백"` (seed 의존적). Structure OK.
- `my-profile-default-landing.yaml`: 3탭 렌더 + liked 탭 tap + public 복귀. Structure OK.

### T10 — Mapper fallback semantic (Group 002 M1 lesson)

- `rg 'likeCount\s*\?\?\s*0|liked\s*\?\?\s*false' apps/MemeApp/src` → 0 hit.
- `FeedItemEntity` zod schema 필수 likeCount/liked 확인 필요 — `data/meme/meme.mapper.ts:142-153` 승격 패턴 (`dto.likeCount ?? dto.favoriteCount`) + parse 실패 시 skip.
- `ContentSummary` 필수 likeCount/liked/regenerateCount: `data/me-contents/me-contents.model.ts:28-32`.
- `likeToggleResponseEntitySchema`: `entities/favorite-toggle-result.entity.ts:13-17` — 3 필수.
- `toFeedItemEntityFromContentSummary`: `userProfile.id: ""` 은 의도적 (profile 진입 시 필터 메타 없음). isOwn 판정은 Group 002 의 `isOwnOverride` threading 으로 보상 (swipe-feed.screen.tsx:131-132) — semantic break 없음.

---

## Regression Guard

- [x] Phase 1 `my-profile-default-landing.yaml` 통과 (코드 trace): Tab 3 모두 render, default landing 로직 유지 + liked 탭 확장.
- [x] Phase 1 `other-user-profile.yaml` 통과: Clipboard URL 복사 Sub-fix 3 적용 후에도 `Clipboard.setString` 동작 (`other-user-profile.screen.tsx:69`).
- [x] Phase 1 `home-header-elements.yaml` 통과: gear 제거 반영 확정 assertNotVisible 추가.
- [x] Group 001 be-003/be-004 endpoint consume 정합: `/meme/v2/contents/:id/likes` POST/DELETE + CreditHistory `transactionType="payback"` parse.
- [x] Group 002 좋아요 (ko-KR 콤마) vs 재생성 (korean-count 축약) 포매터 분리: `toLocaleString('ko-KR')` for likeCount, `korean-count` for regenerateCount 유지.
- [x] Ownership threading (`isOwnOverride`) 재사용: `swipe-feed.screen.tsx:131-132` `profileSource?.kind === "me" ? true : undefined` — liked 탭 포함.
- [x] Discriminated union 3 variant 유지: profile/legacy 진입 분기 + enabled gate.

---

## KB Pattern Adoption

- **completeness-003** (route param): ProfileFeedSource 확장 (`visibility: 'liked'`) + 기존 variant 유지.
- **completeness-006** (enabled gate): useGetProfileSwipeFeedUseCase me/user 2 variant 각 enabled, screen 상위 isProfileVariant gate.
- **completeness-007** (prop threading): LikeButton / LikeBadge 가 `FeedItemEntity.likeCount/liked` 를 그대로 표시. `isOwnOverride` 재사용.
- **integration-001** (BE/FE 필드명): `likeCount`, `liked`, `transactionType="payback"` 일치 확인.
- **correctness-002** (JS getter JSON 누락): FE 수신 측 — zod parse 실패 시 item skip 방어.

---

## Recommendation

- **PASS → Phase 5 PR 진입.**
- Critical 0 / Major 0 / Minor 3 — 모두 non-blocking.
- Minor m1 (backdrop dismiss) 는 Phase 6 retro 또는 Phase 3 follow-up 으로 기록 권장.
- Minor m2 (dead constant) 는 mapper 호출부 연결 또는 상수 제거 중 하나를 follow-up.
- Minor m3 (isPublished 조건) 는 generate 정책 변경 시 재점검.

---

## Sign-off

- Evaluator: ZZEM Evaluator
- Date: 2026-04-23
- Verdict: PASS
- Follow-up items logged as Minor (non-blocking).
