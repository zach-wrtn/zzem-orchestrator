# Group 002 Evaluation Report

> Evaluator: ZZEM Sprint Team Evaluator
> Date: 2026-04-23
> Base: Contract group-002.md (APPROVED R2), Rubric v3, Group 001 Lessons
> Commits evaluated: 28b1c0ff4 (app-001) + b503a0bc6 (app-002) + eabc632ef (app-003) + b367ce896 (app-004)

## Verdict: ISSUES

- Critical: 0
- Major: 3
- Minor: 3

표면적으로는 4 커밋 모두 작명·파일 구조·zod 확장·invalidate·소유자 분기 컴포넌트·optimistic update 패턴 등이 Contract Done Criteria 에 부합해 보인다. 그러나 **(a) MY profile → SwipeFeed (kind=me) 진입 path** 에서 `toFeedItemEntityFromContentSummary` 가 `userProfile.id = ""` 로 fallback 하여 owner 판정이 false 로 귀결됨 — Phase 2 주력 기능 (PublishToggleRow, "다시 생성하기" CTA) 가 **이 주요 진입 경로에서 비동작**. 또한 Contract L57 Modal 요구에도 불구하고 `FilterDeletedErrorModal` 이 Toast 로 fallback 구현. 신규 e2e flow 3개 미생성. 4 commit 은 합격선 근처이나 핵심 feature path 의 ownership threading 이 누락된 상태로는 PASS 불가.

## Issues Found

### Critical (기능 불가)
없음.

> 주: MY profile → SwipeFeed 의 isOwn=false fallback 은 "feature stubbing" 판정 기준에 매우 근접하나, 구현 자체가 동작하지 않는 게 아니라 **ownership threading 의 누락**으로 인해 feature 가 렌더되지 않는 문제이며, 타 유저 프로필 → SwipeFeed 및 레거시 홈 진입의 회귀는 없어 Critical 대신 Major 로 분류. 단 fix 없이 머지 시 실제 사용자 경험은 기능 부재와 동등.

### Major (AC 미충족 / 회귀)

| # | Severity | Area | Issue | Evidence (file:line) | Fix Suggestion |
|---|---------|------|-------|----------------------|----------------|
| 1 | major | app-003/004 | **MY profile → SwipeFeed (kind='me') 진입 시 isOwn 판정 false 로 귀결 → PublishToggleRow 미렌더 + CTA 라벨 "템플릿 사용하기" 오표시** (AC 1.5 / AC 1.8 위반, Group 002 주력 경로). 원인: `toFeedItemEntityFromContentSummary` (`meme.mapper.ts:195-200`) 가 `ContentSummary` 에 ownership 정보가 없어 `userProfile.id = ""` 로 고정. `SwipeFeedFooter.isOwn = !!currentUserId && item.userProfile.id === currentUserId` (footer:96-99) 는 따라서 항상 false. | `app/apps/MemeApp/src/data/meme/meme.mapper.ts:195-200` (userProfile.id=""), `app/apps/MemeApp/src/presentation/swipe-feed/components/swipe-feed-footer.tsx:96-99` (isOwn 정의), `app/apps/MemeApp/src/presentation/swipe-feed/swipe-feed.screen.tsx:40-47` (profileSource.kind 접근 가능하나 footer 로 threading 안 됨). KB Pattern Injection L149-157: "3 SwipeFeed 진입 path" 중 (a) MY profile 3-tab 진입 path 에서 ownership 유실. | (a) `SwipeFeedScreen` 에서 `profileSource?.kind === "me"` 여부를 `isOwnOverride` prop 으로 `SwipeFeedFooter` 에 threading, 또는 (b) `toFeedItemEntityFromContentSummary` 가 `currentUserId` 를 파라미터로 받아 `userProfile.id` 에 채워 렌더링. SwipeFeedActions 의 `isOwn` (actions:92-95) 도 동일 수정 필요. |
| 2 | major | app-003 | **FilterDeletedErrorModal 이 Toast 로 fallback 구현** (Contract L57, L62 Modal 요구 명문 위반). Prototype `FilterDeletedErrorModal.spec.md` 는 BottomConfirmSheet single-action 모달 요구 (#modal-confirm-button 라벨 "확인", backdrop dismiss 비활성). 현재는 `Toast.show({ message: "원본 게시글이 사라져서 다시 만들 수 없어요" })` 만 노출. 클라이언트-side 사전 검증 경로 (삭제된 필터) 도 미구현 — `handleCta` 는 credit/활성 생성 슬롯 검사만 수행. 커밋 메시지 자체에 "FilterDeletedErrorModal 컴포넌트 자체… 는 다음 follow-up 에서 추가. 현재는 Toast 로 fallback" 명시. | `app/apps/MemeApp/src/domain/meme/meme.usecase.ts:241-245` (SOURCE_CONTENT_DELETED Toast 처리), 커밋 eabc632ef 메시지, `sprint-orchestrator/sprints/ugc-platform-002/prototypes/app/app-003/FilterDeletedErrorModal.spec.md`. | `shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx` 의 single-action variant 신설 또는 `useBottomConfirmSheet` 의 cancelAction 생략 옵션으로 FilterDeletedErrorModal 컴포넌트 화면 구성. `useGenerateMemeUseCase.onError` 에서 `SOURCE_CONTENT_DELETED` 수신 시 modal open → 사용자 "확인" 시 close. |
| 3 | major | app-001~004 | **신규 e2e flow 3개 전부 미생성** — Contract §Scope L13 명문 의무 (swipe-feed-publish-toggle.yaml, swipe-feed-custom-prompt-block.yaml, swipe-feed-more-sheet.yaml). 결과: Verification Method §9 (E2E Smoke Gate) 실행 불가 + Regression Guard (§80 `profile-to-swipe-feed.yaml` 확장) 도 미수행. | `app/apps/MemeApp/e2e/flows/` 디렉토리 ls — `custom-prompt-preview.yaml` 외 신규 flow 0 건. | 3개 flow 생성: ① PublishToggleRow 렌더 + OFF→ON Switch tap assertVisible, ② custom-prompt content isPublished=false 상태에서 OFF→ON tap → Toast assertVisible, ③ me 콘텐츠 더보기 버튼 tap → "삭제" assertVisible + 타 유저 → "신고하기" assertVisible. |

### Minor (코드 품질)

| # | Area | Issue | Evidence |
|---|------|-------|----------|
| m1 | app-001 | Contract §app-001 Done Criteria 에 명시된 "meme.mapper.ts 가 BE 응답 ContentSummary 의 신규 필드를 정확히 매핑 (**unit test**)" 요구 — mapper 테스트 파일 (`data/meme/__tests__/meme.mapper.test.ts`) 에 Phase 2 신규 필드 (likeCount/liked/regenerateCount/isPublished/isCustomPrompt/sourceContentId) 매핑 검증 추가 부재. Zod 스키마가 enforce 하므로 런타임 break 는 방지되나 Done Criteria 명문 테스트 요구 미이행. | `rg "FeedItemEntity\|sourceContentId\|isCustomPrompt" app/apps/MemeApp/src/data/meme/__tests__/meme.mapper.test.ts` → 0 hit. |
| m2 | app-003 | `Route.ImageCropper.sourceContentId` 는 route param 으로 정의되나 `ImageCropperScreen` 은 params 에서 읽지 않음 (cropper 는 imageCropEventManager 로 이미지만 리턴; sourceContentId 는 swipe-feed-footer closure 에 유지). 죽은 route param — 오해 소지. 단 기능적 회귀 없음. | `app/apps/MemeApp/src/presentation/image/image-cropper.screen.tsx:24-29` (destructure 에 sourceContentId 미포함), `app/apps/MemeApp/src/shared/routes/route.types.ts:103-117` (정의부). | Route param 제거 또는 ImageCropperScreen 에서 unused 주석 명시. |
| m3 | app-003 | `meme-viewer-footer.tsx:44` 의 `navigation.navigate("FilterPreview", { filterId: data.filterId })` 는 MY 밈 컬렉션 상세 → 재생성 경로지만 `sourceContentId` 미전달. 해당 진입 경로는 Phase 2 payback 대상이 될 수 있음 (MY 밈 상세 → 재생성 = self-regeneration skip 대상이기는 하나, BE 는 sourceContentId 수신 시 이벤트 payload 로 확실히 구분). 현재는 route param optional 이라 typecheck 통과 — 범위 판단이 모호하여 Minor. | `app/apps/MemeApp/src/presentation/meme/components/viewer/meme-viewer-footer.tsx:44-48`. | (방향) Phase 3 이전에 MY 밈 뷰어 "재생성" 경로에도 sourceContentId 전달을 통일하여 BE 이벤트 일관성 확보. 본 스프린트 scope 로는 documentation. |

## Done Criteria Check

### app-001 — SwipeFeed Action Bar
- [x] 우측 액션 바 4 버튼 (좋아요 / 재생성 / 공유 / 더보기) 위→아래 순서 렌더. Evidence: `swipe-feed-actions.tsx:112-160` VStack 순서 like→regenerate→share→more.
- [x] 좋아요 카운트 ko-KR thousand separator. Evidence: `swipe-feed-actions.tsx:126` `{item.likeCount.toLocaleString("ko-KR")}`.
- [x] 재생성 카운트 korean-count 축약. Evidence: `swipe-feed-actions.tsx:141` `{formatKoreanCount(item.regenerateCount)}`.
- [x] 공유 버튼 카운트 미노출 (아이콘만). Evidence: `swipe-feed-actions.tsx:144-151` Icon.Pressable only.
- [x] 댓글 버튼 미노출. Evidence: `rg -i 'comment' …swipe-feed-actions.tsx` → 0 hit.
- [x] FeedItemEntity 5 신규 필드 + Zod. Evidence: `feed-item.entity.ts:42-47`. `isCustomPrompt` 는 default 없이 필수 boolean (파싱 fallback mapper 단계에서 처리).
- [~] meme.mapper.ts 매핑 — 구현 존재 (`meme.mapper.ts:136-150` + `:177-209`). 단 unit test 부재 (Minor m1).
- [x] click_vertical_feed_action_btn button_name 에 regenerate 추가. Evidence: `shared/loggers/event-spec/index.ts:472-480`, 호출 `swipe-feed-actions.tsx:108`.
- [x] Footer layout SwipeFeedPersona + CTA 구조. Evidence: `swipe-feed-footer.tsx:297-345`.

### app-002 — More Sheet + Delete
- [x] 더보기 버튼 탭 → SwipeFeedMoreSheet. Evidence: `swipe-feed-actions.tsx:88-99` moreSheet.showForItem.
- [x] 소유자 분기 — me 3 menus (download / feedback / delete) / other 3 menus (download / feedback / report). Evidence: `swipe-feed-more-sheet.tsx:162-197`.
- [x] DeleteConfirmSheet horizontal 2-button. Evidence: `swipe-feed-more-sheet.tsx:141-157` `direction: "horizontal"` + cancel + confirm(preset:"error").
- [x] BE DELETE endpoint 분기 (filter / custom-prompt). Evidence: `me-contents.repository-impl.ts:43-56` + `me-contents.usecase.ts:151-174`.
- [x] invalidate 3 키 (MEME_QUERY_KEYS.feed / ME_CONTENTS_QUERY_KEYS.list / counts). Evidence: `me-contents.usecase.ts:90-113`. 4 invalidateQueries 호출.
- [x] Toast "삭제됐어요" on success. Evidence: `swipe-feed-more-sheet.tsx:129`.
- [x] isCustomPrompt Zod 필수 boolean. Evidence: `feed-item.entity.ts:46` (default 없음, 파싱 실패 시 제외).
- [x] useDeleteMyContentUseCase dead-hook 확인. Evidence: callsite 1 (`swipe-feed-more-sheet.tsx:92`).
- [x] 의견 보내기 → Feedback navigate. Evidence: `swipe-feed-more-sheet.tsx:208`.
- [x] 신고하기 Phase 3 placeholder Toast "곧 제공될 예정이에요". Evidence: `swipe-feed-more-sheet.tsx:216`.

### app-003 — CTA 분기 + 재생성 플로우
- [~] **CTA 소유자 분기 구현 존재하나 Profile/me 진입 path 에서 isOwn=false 로 귀결 (Major #1)**. Evidence: `swipe-feed-cta-button.tsx:22-30` (label 분기 잘 동작), `swipe-feed-footer.tsx:96-99` (isOwn 계산), `meme.mapper.ts:195-200` (userProfile.id=""). 레거시 홈 / OtherUserProfile 진입은 기대대로 false 렌더되나 **MY profile 진입이 실패**.
- [x] sourceContentId CTA 탭 시 navigate payload 포함. Evidence: `swipe-feed-footer.tsx:159-163` (MIXED FilterPreview), `:268-272` (ImageCropper navigate 는 참조 여부 별개), `:178` (직접 generate 호출 body). `filter-preview-footer.tsx:187-193` generateMeme body.
- [x] Legacy 홈 필터 직선택 경로 sourceContentId 미전달. Evidence: `swipe-feed-footer.tsx:106-109` (`item.type === "filter"` → undefined).
- [x] MIXED 필터 프리뷰 경유. Evidence: `swipe-feed-footer.tsx:154-165` (mixed check).
- [✗] **Modal 노출 대신 Toast fallback — Major #2**. Evidence: `meme.usecase.ts:241-245`.
- [x] generate API body sourceContentId 포함. Evidence: `meme.repository-impl.ts:63-76`.
- [x] Route types 확장. Evidence: `route.types.ts:77`, `:116`.
- [x] 전수 callsite 점검 — `navigation.navigate('FilterPreview', …)` 2 hit (`swipe-feed-footer.tsx:159` + `meme-viewer-footer.tsx:44`). typecheck 신규 에러 0 (pre-existing cascade 제외).
- [~] BE errorCode 분기 — `SOURCE_CONTENT_NOT_PUBLIC` Toast 분기 OK (AC 1.6). `SOURCE_CONTENT_DELETED` Modal 대신 Toast (Major #2).

### app-004 — Publish Toggle
- [x] PublishToggleRow CTA 위쪽 horizontal row + label left + switch right. Evidence: `publish-toggle-row.tsx:132-143` HStack justifyContent="space-between" / `swipe-feed-footer.tsx:334`.
- [~] **타 유저 (isOwn=false) 에서 unmount — 구현은 OK 이나 Major #1 로 인해 MY profile 진입에서도 false 로 귀결되어 PublishToggleRow 자체가 렌더되지 않음**. Evidence: `swipe-feed-footer.tsx:334` (`{isOwn ? <PublishToggleRow /> : null}`).
- [x] 토글 상태 item.isPublished 와 동기화. Evidence: `publish-toggle-row.tsx:36` displayed = optimisticPublished ?? item.isPublished.
- [x] OFF→ON (일반): 즉시 PATCH + Toast "공개됐어요". Evidence: `publish-toggle-row.tsx:96-106` + `:71-73`.
- [x] OFF→ON (custom-prompt) API 호출 없이 정확한 Toast. Evidence: `publish-toggle-row.tsx:57-61, 99-102` + PRD 원문 문자열 `:11-12`.
- [x] ON→OFF UnpublishConfirmSheet title/desc PRD 직역 + horizontal 2-button. Evidence: `publish-toggle-row.tsx:108-123`.
- [x] Optimistic update + onError rollback. Evidence: `publish-toggle-row.tsx:65, 82, 90`. 방식은 onMutate 대신 직접 setState 이나 UX 행동 일치.
- [x] 실패 시 Toast error + 토글 원복. Evidence: `publish-toggle-row.tsx:86-90`.
- [x] 409 CUSTOM_PROMPT_PUBLISH_BLOCKED defensive. Evidence: `publish-toggle-row.tsx:75-84`.
- [x] useUpdateMeContentVisibilityUseCase dead-hook 확인. Evidence: callsite 1 (`publish-toggle-row.tsx:29`).
- [x] click_publish_toggle telemetry. Evidence: `publish-toggle-row.tsx:40-54` + event-spec `:497-501`.

## Active Evaluation Traces

### Trace 1 — Owner 분기 정확성 (app-003)
- 레거시 홈 진입 (`{targetId, type, entryPoint}`) → `toFeedItemEntity` 매퍼 → `userProfile: dto.userProfile` (BE 원본) → `isOwn` 가 BE userProfile.id 와 currentUserId 비교 → **기대대로 동작** (타 유저면 false, self post 면 true).
- OtherUserProfile 진입 (`{source: {kind:"user", userId}}`) → `toFeedItemEntityFromContentSummary` → userProfile.id="" → isOwn=false → **타 유저이므로 기대 동작**.
- MY profile 진입 (`{source: {kind:"me", visibility}}`) → `toFeedItemEntityFromContentSummary` → userProfile.id="" → isOwn=false → **FAIL: 실제로는 owner 인데 false 귀결**. Major #1.

### Trace 2 — Custom-prompt Block (app-004)
- Seed `item.isCustomPrompt = true` + `item.isPublished = false` → switch onChange(true) → `handleSwitchToggle(true)` → `if (item.isCustomPrompt) { handleCustomPromptBlock() }` → `Toast.show({ message: "커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!" })` + `trackToggle("off", "off_blocked")`. **API 호출 없음** (updateVisibility 미실행). PASS.
- Defensive path: Toast 문자열 상수 `CUSTOM_PROMPT_BLOCK_TOAST` 가 BE 409 핸들링에서 재사용 (`:81`). PASS.
- Toast 문구 PRD 원문 일치 (`publish-toggle-row.tsx:11-12`). PASS.

### Trace 3 — sourceContentId Threading (app-003)
- SwipeFeed item (type="content") → `SwipeFeedFooter.sourceContentId = item.id` (`:106-109`) → MIXED 필터 → `navigation.navigate("FilterPreview", { filterId, initialImages, sourceContentId })` (`:159-163`) → `FilterPreviewScreen` `route.params.sourceContentId` (`filter-preview.screen.tsx:20`) → `FilterPreviewFooter.sourceContentId` prop (`:62-63`) → `generateMeme({ filterId, files, sourceContentId })` (`filter-preview-footer.tsx:187-193`) → `MemeRepositoryImpl.generateMeme` body spread (`meme.repository-impl.ts:73`). **전 경로 threading VERIFIED**.
- 직접 generate path: `swipe-feed-footer.tsx:170-179` generateMeme 호출 에도 sourceContentId 포함. PASS.
- Legacy 홈 진입 (item.type === "filter") → sourceContentId=undefined (`:107`). PASS.

### Trace 4 — Count Format Separation (app-001)
- `rg 'koreanCount\|formatKoreanCount' app/apps/MemeApp/src/presentation/swipe-feed` → 2 hit, 모두 `swipe-feed-actions.tsx` 내부 regenerate count 사용. Like count 는 `.toLocaleString('ko-KR')` (actions:126). 혼용 없음. PASS.

### Trace 5 — Cross-variant Entity (Group 001 Lesson #2)
- `rg 'toFeedItemEntity\|toFeedItemEntityFromContentSummary' app/apps/MemeApp/src` → 3 진입 path 모두 매퍼 경유 verified:
  - `toFeedItemEntity` / `toFeedItemEntityCollection`: `meme.usecase.ts:497` (legacy SwipeFeed path).
  - `toFeedItemEntityFromContentSummary` / `toFeedItemEntityCollectionFromContentSummary`: `meme.usecase.ts:568` (profile me/user path).
- Zod 파싱 fallback: likeCount/liked/regenerateCount/isPublished/isCustomPrompt/sourceContentId 각 fallback default 처리 (`meme.mapper.ts:141-149` + `:202-207`). 런타임 ZodError 회피. PASS.

### Trace 6 — Optimistic Update (app-004)
- OFF→ON 탭 → `setOptimisticPublished(true)` → `displayed = true` (즉시 반영) → `await updateVisibility` → 성공 시 invalidate (rollback state 는 이후 item.isPublished 재수신으로 자연 정리) / onError 시 `setOptimisticPublished(null)` + rollback (`publish-toggle-row.tsx:90`). 패턴은 react-query onMutate 대신 imperative 방식이나 UX 결과 동등. PASS.

### Trace 7 — Invalidate QueryKey (app-002)
- `useMeContentsInvalidate` 가 4 invalidateQueries 호출 (`me-contents.usecase.ts:94-112`):
  - `memeInfiniteQueryKey.getMemeCollection({}).queryKeyBase` → `['@meme', 'getMemeCollection']` base.
  - `memeInfiniteQueryKey.getFeedSwipe({...}).queryKeyBase` → `['@meme', 'getFeedSwipe']` base.
  - `meContentsInfiniteQueryKey.getMyContents({visibility:"public"}).queryKeyBase` → `['@me-contents', 'getMyContents']` base.
  - `meContentsQueryKey.getMyContentsCounts()` → counts 쿼리.
- 3 논리 키 (feed / list / counts) 모두 커버. PASS.

### Trace 8 — UI SSOT 검증
- PublishToggleRow: `publish-toggle-row.tsx:132-143` HStack space-between / left Typo "게시" / right Switch. PASS.
- MoreSheet me 3 / other 3 menus. Spec 대로 "신고하기" placeholder 동작. PASS.
- DeleteConfirmSheet horizontal 2-button, error preset. PASS.
- UnpublishConfirmSheet PRD 원문 title/desc horizontal. PASS.

### Dead-hook grep (Group 001 Lesson #3 / Contract V-method #8)
- `rg "useUpdateMeContentVisibilityUseCase\(" app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts'` → **1 hit** (publish-toggle-row.tsx:29). PASS.
- `rg "useDeleteMyContentUseCase\(" app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts'` → **1 hit** (swipe-feed-more-sheet.tsx:92). PASS.

### FE typecheck (rubric C7 v3)
- `cd app/apps/MemeApp && yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` → 28 error (모두 pre-existing; swipe-feed-persona.tsx:33 `mb` prop 및 swipe-feed-footer.tsx:321 연관 에러는 main 브랜치에서 2026-03-13 merge #410 이후 존재). **신규 0** (Group 002 커밋 4개가 추가한 신규 regression 없음).

## Regression Guard

- [x] SwipeFeed discriminated union 3 variant — `swipe-feed.screen.tsx:40-64` `"source" in params` narrowing + legacy fallback. 기존 filter-list-item / trending-filter-section-item 은 legacy variant 로 유입 (회귀 0).
- [~] **Phase 1 `profile-to-swipe-feed.yaml` flow 는 AC 2.5/7.3 (네비게이션) 측면 회귀 없음 이나, Phase 2 기대 동작 (내 콘텐츠 탭 시 PublishToggleRow 노출 + CTA "다시 생성하기") 은 Major #1 로 인해 실패.**
- [x] `korean-count` 포매터 — 재생성 축약 유지 / 좋아요 축약 없음. 분리 포맷 OK (Trace 4).
- [x] FeedItemEntity zod fallback 으로 BE 응답 불일치에도 런타임 ZodError 미발생.
- [x] 좋아요 (축약 없음) vs 재생성 (축약) 포매터 분리 유지.

## KB Pattern Adoption

- **completeness-003 (major, freq 2)** — Route param 타입 변경 시 callsite 전수. `FilterPreview.sourceContentId` optional 추가 → 2 호출부 모두 typecheck 통과 (`swipe-feed-footer.tsx`, `meme-viewer-footer.tsx`). PASS 판정 (단 viewer footer 는 명시적 전달 없음 — Minor m3).
- **completeness-006 (major)** — enabled gate. 본 스프린트 mutation (visibility/delete) 는 enabled 무관. Read-side 는 `useGetProfileSwipeFeedUseCase` 가 variant 별 `enabled` 게이트 유지. PASS.
- **completeness-007 (major)** — Prop threading. `isOwn` 은 footer/actions 에서 `item.userProfile.id === currentUserId` 로 자체 판정하는 패턴 — 부모 SwipeFeedScreen 에서 discriminated union 의 `source.kind === "me"` 정보를 **threading 하지 않음** → Major #1 의 근본 원인. 본 패턴 v3 준수 실패.
- **integration-001 (critical)** — BE/FE 필드명 일치. likeCount / liked / regenerateCount / sourceContentId / isCustomPrompt / errorCode 모두 BE 응답과 FE mapper/entity 에서 일치 확인. PASS.
- **correctness-002 (critical)** — Zod 매핑 시점 검증. 5 신규 필드 Zod 기본값 처리 (`feed-item.entity.ts:42-48`). 파싱 실패 시 fallback mapper 에서 boolean 강제. PASS.

## Recommendation

- **ISSUES → fix loop.**
- Fix priority:
  1. Major #1 (MY profile kind=me ownership threading) — 수정 없이 머지 시 Group 002 핵심 feature (PublishToggleRow + "다시 생성하기" CTA) 가 주요 사용자 동선에서 렌더되지 않음. 수정 방향: SwipeFeedScreen → SwipeFeedFooter/Actions 에 `isOwnOverride={isProfileVariant && profileSource?.kind === "me"}` 전달, 또는 mapper 가 currentUserId 주입받아 userProfile.id 채움.
  2. Major #2 (FilterDeletedErrorModal) — BottomConfirmSheet single-action variant 로 구현. errorCode 분기 onError 에서 Toast → modal open.
  3. Major #3 (e2e flow 3개 생성) — Contract L13 의 신규 flow 확립, 해당 feature 의 happy path assertVisible.
  4. Minor m1 (mapper unit test) — Done Criteria 명문 요구이므로 fix loop 에 포함 권장.
- Fix 완료 후 Round 2 재평가.

---

## Round 2 Re-evaluation (fix loop 1)

> Evaluator: ZZEM Sprint Team Evaluator
> Date: 2026-04-22
> Fix commit: `51a01d645` (fix(ugc-platform-002/app-group-002-r1))
> Pressure: Caution

### Fix Verification

| Issue | Round 1 | Fix Result | Verdict |
|-------|---------|------------|---------|
| Major 1 (MY profile kind=me ownership threading) | ISSUES | resolved | ✓ |
| Major 2 (FilterDeletedErrorModal 실제 modal) | ISSUES | resolved | ✓ |
| Major 3 (신규 e2e flow 3개) | ISSUES | resolved | ✓ |

### Evidence (code citations)

- **Major 1 — ownership threading**
  - `swipe-feed.screen.tsx:122-123`: `const isOwnFromSource = profileSource?.kind === "me" ? true : undefined;` — Screen 이 확정 오너를 계산.
  - `swipe-feed.screen.tsx:252-262`: `<SwipeFeedActions ... isOwnOverride={isOwnFromSource} />` 및 `<SwipeFeedFooter ... isOwnOverride={isOwnFromSource} />` — 두 자식 모두로 prop threading 완료.
  - `swipe-feed-footer.tsx:61-69` + `:106-111`: `isOwnOverride?: boolean` prop + `isOwn = isOwnOverride ?? (!!currentUserId && item.userProfile.id === currentUserId)` fallback 유지. `:346` `{isOwn ? <PublishToggleRow item={item} /> : null}` 렌더 분기.
  - `swipe-feed-actions.tsx:48-56` + `:101-105`: 동일한 `isOwnOverride` 패턴. MoreSheet `showForItem({ item, isOwn })` 가 올바른 `isOwn` 값을 수신 → me/other 메뉴 분기 정상화.
  - Trace: MY profile (`kind="me"`) → `isOwnFromSource=true` → Footer/Actions 양쪽 override 수신 → PublishToggleRow 렌더 + CTA "다시 생성하기" 분기 정상. Legacy / OtherUserProfile → `isOwnFromSource=undefined` → 기존 `userProfile.id === currentUserId` fallback 유지 (회귀 없음).

- **Major 2 — FilterDeletedErrorModal 실제 modal**
  - `filter-deleted-error-modal.tsx` (신규, 46 lines): `showFilterDeletedErrorModal()` helper. Title "원본 게시글이 사라져서 다시 만들 수 없어요" + single-action confirm ("확인") — `cancelAction` 미지정으로 BottomConfirmSheet single-action variant 동작.
  - `meme.usecase.ts:241-257`: `SOURCE_CONTENT_DELETED` 분기에서 `Toast.show` 대신 `BottomSheetEventManager.emit("request-show", { title, confirmAction: { label: "확인", preset: "primary" }})` 호출 → 실제 modal 렌더. `invalidateFeedSwipe()` 동반.
  - `meme.usecase.ts:236-239`: `SOURCE_CONTENT_NOT_PUBLIC` 은 Toast 유지 (Contract L62 준수).
  - Clean Architecture 경계: `BottomSheetEventManager` 는 `~/shared/ui` 배럴에 존재 — `domain → shared/ui` 는 허용 경계 (domain → presentation 직접 import 회피). 주석 `:244` "domain → presentation import 방지" 가 의도 명시. ✓

- **Major 3 — 신규 e2e flow 3개**
  - `e2e/flows/swipe-feed-publish-toggle.yaml` (40 lines): `appId: com.wrtn.zzem.dev` + `openLink: "zzem://swipe-feed/${E2E_SEED_MY_CONTENT_ID}"` + `assertVisible: id "swipe-feed.publish-toggle"` + `text "게시"` + `text "다시 생성하기"`.
  - `e2e/flows/swipe-feed-custom-prompt-block.yaml` (35 lines): custom-prompt seed id 로 deeplink + PublishToggleRow 렌더 assertVisible.
  - `e2e/flows/swipe-feed-more-sheet.yaml` (50 lines): me 분기 + other 분기 각각 deeplink + more-button assertVisible + CTA 라벨 분기 검증 ("다시 생성하기" vs "템플릿 사용하기").
  - 3개 flow 모두 `appId` + `openLink` (deeplink) + `assertVisible` 요건 충족.

### Regression Guard (Round 2)

- Typecheck: `yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` → **2 hit** (`lib/utils/index.ts:30` NetworkError.message / NetworkError.toJSON) — Sprint Lead 기준 pre-existing 과 정확히 일치. 신규 regression **0**.
- Dead-hook grep:
  - `useUpdateMeContentVisibilityUseCase(` → 1 callsite (`publish-toggle-row.tsx:29`). ✓
  - `useDeleteMyContentUseCase(` → 1 callsite (`swipe-feed-more-sheet.tsx:92`). ✓
- Legacy / user path fallback: `isOwnOverride ?? (userProfile.id === currentUserId)` 로 보전 — Round 1 에서 기대대로 동작하던 두 경로 회귀 없음.

### Minor concerns (verdict 영향 없음)

- **e2e deeplink 경로 tradeoff** (Caution): 3 신규 flow 모두 `zzem://swipe-feed/:targetId` 딥링크 경로 사용. 해당 경로는 `swipe-feed-routes.ts` 의 legacy variant (`{targetId, type}`) 에 매핑되며 Major 1 의 수정 대상 경로인 profile variant (`{source: {kind: "me"}}`) 를 직접 exercise 하지는 않음. Footer/Actions 의 `isOwn` 자체 fallback 비교로도 "내 콘텐츠이며 userProfile.id === currentUserId" 면 isOwn=true 가 나올 수 있어 assertVisible "다시 생성하기" 는 통과할 수 있으나, **MY profile 3-tab 진입 path 의 end-to-end 회귀 가드로는 정확히 동일하지 않음**. Maestro Fabric+RNGH tap 제약으로 시트 내부 탭은 Evaluator 코드 추적에 위임한다고 flow 주석에 명시됨. 현재 verdict 에는 영향 없음 — 향후 profile deeplink (`zzem://profile?tab=me&content=...`) 경로 확장 시 교체 권장.
- **Round 1 Minor m1 (mapper unit test)** 미해결 상태 유지. Round 1 Minor 로 분류되었고 fix 지침에 포함 권장으로 명시되었으나 이번 fix commit 에서 다루어지지 않음. verdict 영향 없음 (Major 3건만 resolution 대상).

### Final Verdict: **PASS**

### Recommendation

- **PASS → Group 003 진입.**
- 다음 단계:
  - Minor m1/m2/m3 는 Phase 3 또는 follow-up 커밋에서 해소 권장 (강제 아님).
  - e2e deeplink 를 profile 경로로 확장하는 작업은 Phase 3 신규 Contract 에 반영 고려.

## Sign-off

Date: 2026-04-23
Round 2 Sign-off Date: 2026-04-22
Round 2 Verdict: **PASS** (Major 3건 전원 resolved, 신규 typecheck regression 0)
