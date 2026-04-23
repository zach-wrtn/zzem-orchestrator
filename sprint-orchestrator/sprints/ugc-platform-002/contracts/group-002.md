# Sprint Contract: Group 002 — App 피드 인터랙션 핵심

## Scope

- **Tasks**: app-001 (SwipeFeed 액션 바), app-002 (더보기 + 삭제), app-003 (CTA 분기 + 재생성 플로우), app-004 (게시 토글 + 공개/비공개 시트 + custom-prompt 안내)
- **Target areas**:
  - `app/apps/MemeApp/src/presentation/swipe-feed/` (action bar, footer, more sheet, publish toggle)
  - `app/apps/MemeApp/src/domain/me-contents/` (UpdateVisibility useCase 신설)
  - `app/apps/MemeApp/src/data/me-contents/` (PATCH visibility repository impl)
  - `app/apps/MemeApp/src/domain/meme/` (Delete useCase + sourceContentId 전달)
  - `app/apps/MemeApp/src/shared/routes/` (route types 확장 — sourceContentId)
  - `app/apps/MemeApp/src/data/meme/meme.mapper.ts` + entities (FeedItemEntity 확장)
  - E2E flows: `swipe-feed-publish-toggle.yaml` (신규), `swipe-feed-custom-prompt-block.yaml` (신규), `swipe-feed-more-sheet.yaml` (신규), `profile-to-swipe-feed.yaml` (확장), `swipe-feed.yaml` (확장)
- **Depends on**: Group 001 PASS (be-001 visibility toggle + be-002 sourceContentId 수용 API). UI 구현은 API contract 기반이라 병행 가능하나 실제 동작 검증은 Group 001 머지 완료 후.

## Prototype Reference

각 태스크는 approved HTML 프로토타입이 있음 (Phase 3, quality 1.0 / fabrication low). 구현 시 spec.md + HTML 프로토타입을 시각 참조로 사용:
- app-001: `prototypes/app/app-001/prototype.html` + `SwipeFeedActionBar.spec.md`
- app-002: `prototypes/app/app-002/prototype.html` + `SwipeFeedMoreSheet.spec.md` + `DeleteConfirmSheet.spec.md`
- app-003: `prototypes/app/app-003/prototype.html` + `SwipeFeedCTAButton.spec.md` + `FilterDeletedErrorModal.spec.md`
- app-004: `prototypes/app/app-004/prototype.html` + `PublishToggle.spec.md` + `UnpublishConfirmSheet.spec.md`

## Done Criteria

### app-001 — SwipeFeed Action Bar
- [ ] 우측 액션 바 4 버튼 (좋아요 / 재생성 / 공유 / 더보기) 위→아래 순서 렌더.
- [ ] 좋아요 카운트: **ko-KR thousand separator** (`>= 1000` 시 `8,600`, `12,345`). 0 포함 축약 없음. **korean-count 포매터 금지** (AC 3.3 + DRIFT-01).
- [ ] 재생성 카운트: **korean-count 축약** (`8.6천`). 0 포함.
- [ ] 공유 버튼 카운트 미노출 (아이콘만).
- [ ] 댓글 버튼 미노출 (Spec-out). grep `rg -i 'comment' app/apps/MemeApp/src/presentation/swipe-feed/components/swipe-feed-actions.tsx` → 0 hit.
- [ ] `FeedItemEntity` (or 등가) 에 신규 필드: `likeCount: number`, `liked: boolean`, `regenerateCount: number`, `sourceContentId: string | null`, `isCustomPrompt: boolean`. Zod 스키마 확장.
- [ ] `meme.mapper.ts` 가 BE 응답 `ContentSummary` 의 신규 필드를 정확히 매핑 (unit test).
- [ ] `click_vertical_feed_action_btn` 이벤트의 `button_name` 에 `regenerate` 추가.
- [ ] SwipeFeed footer layout: `.sf-creator` + `.sf-footer` + `.cta-button` 구조 (app-003 canonical 참조, DRIFT-02 반영). action bar 는 footer 위 별도 레이어 (`right: 12px; bottom: 240px`).

### app-002 — More Sheet + Delete
- [ ] 더보기 버튼 탭 → `SwipeFeedMoreSheet` 노출.
- [ ] 소유자 분기 정확:
  - Me (owner === currentUser): 다운로드 / 의견 보내기 / **삭제** (destructive red).
  - Other: 다운로드 / 의견 보내기 / 신고하기 (Phase 3 placeholder — 탭 시 Toast `"곧 제공될 예정이에요"`).
- [ ] 삭제 탭 → `DeleteConfirmSheet` horizontal 2-button (취소 + 삭제).
- [ ] 삭제 확정 → BE DELETE endpoint 호출 (filter: `DELETE /v2/contents?type=filter`, custom-prompt: `DELETE /v2/custom-prompt-contents/:contentId`). contentType 분기 `item.isCustomPrompt` 기반.
- [ ] 성공 시 React Query invalidate 대상 3 키: `MEME_QUERY_KEYS.feed.*`, `ME_CONTENTS_QUERY_KEYS.list`, `ME_CONTENTS_QUERY_KEYS.counts` (meme.query-key.ts / me-contents.query-key.ts 상수 기준). `invalidateQueries` 호출부 grep 으로 각 키 존재 확인. Toast `"삭제됐어요"`. (Patch 5: Minor m3)
- [ ] `item.isCustomPrompt` 가 undefined 일 가능성 방지: Zod 스키마에서 `isCustomPrompt` 필수 boolean 강제 (app-001 매퍼). 파싱 실패 시 feed 에 포함되지 않음 (fallback 도달 불가). (Patch 5: Minor m2)
- [ ] `useDeleteMyContentUseCase()` mutation hook 신설, onSuccess 에서 cache 업데이트.
- [ ] 의견 보내기 → 기존 Feedback 화면 navigate (회귀 없음).

### app-003 — CTA 분기 + 재생성 플로우
- [ ] CTA 버튼 label 소유자 분기:
  - Me: `"다시 생성하기"`
  - Other: `"템플릿 사용하기"`
  - 크기/색상/radius 동일 (brand-primary, 56h, radius 16px).
- [ ] CTA 탭 시 이미지 선택 / FilterPreview 네비게이션 에 `sourceContentId: item.id` 전달.
- [ ] Legacy 홈 필터 직선택 경로 → `sourceContentId` 미전달 (undefined). 기존 동작 유지.
- [ ] MIXED 필터 (`MIXED_IMAGE_TO_VIDEO`, `MIXED_IMAGE_TO_IMAGE`) → 프리뷰 경유. 그 외 직진입.
- [ ] 삭제된 원본 필터 (client-side check OR BE `SOURCE_CONTENT_DELETED` 수신) → `FilterDeletedErrorModal` 노출 (단일 action "확인"). 탭 후 피드 유지 + 해당 아이템 invalidate. (Patch 1: Major #1 — UI 통일)
- [ ] `useGenerateMemeUseCase()` 최종 API 호출 body 에 `sourceContentId` 포함 (optional).
- [ ] Route types (`route.types.ts` 등) 에 `sourceContentId?: string` 추가.
- [ ] 모든 `navigation.navigate('FilterPreview', ...)` / create flow 호출부 점검 (rubric C7 v3 — 신규 param 추가).
- [ ] BE errorCode 분기 (Patch 1):
  - `SOURCE_CONTENT_DELETED` → `FilterDeletedErrorModal` (단일 action "확인") + feed invalidate. Toast 미노출 (modal 이 SSOT).
  - `SOURCE_CONTENT_NOT_PUBLIC` → Toast `"이 콘텐츠는 이제 비공개예요"` + feed invalidate (rare timing edge).

### app-004 — Publish Toggle
- [ ] 세로 스와이프 하단 `cta-footer` 내부에 `PublishToggleRow` (direction=horizontal, space-between, padding 8×4) 를 CTA 버튼 **위쪽** 에 배치. row 구조: `PublishLabel ("게시", left)` + `PublishSwitch (iOS-style 51×31, right)`. Prototype `PublishToggle.spec.md` canonical SSOT. Android Material 32×20 은 플랫폼 가드 시 보조. (Patch 2: Major #2)
- [ ] 타 유저 콘텐츠 (`isOwn === false`) 에서 `PublishToggleRow` 자체 unmount (null 렌더).
- [ ] 내 콘텐츠에만 노출 (`isOwn === true`). 타 유저 콘텐츠에서는 렌더 안 됨 (위 Patch 2 unmount 와 동일).
- [ ] Toggle 상태가 `item.isPublished` 와 동기화.
- [ ] OFF→ON (일반): 즉시 PATCH `/v2/me/contents/:id/visibility { isPublished: true }` + Toast `"공개됐어요"` + invalidate.
- [ ] OFF→ON (custom-prompt, `item.isCustomPrompt === true`): API 호출 없이 Toast `"커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"`.
- [ ] ON→OFF: `UnpublishConfirmSheet` 노출 → 확정 시 PATCH. Title: "콘텐츠를 비공개로 전환할까요?" + Description: "피드에서 사라지고 나만 볼 수 있어요. 이미 받은 페이백 크레딧은 유지돼요." Horizontal 2-button (취소 / 비공개로 전환).
- [ ] Optimistic update **필수** (UX 즉시 반영): 탭 직후 toggle 상태 즉시 전환. mutation onError 시 이전 상태로 rollback. 테스트: `rejected` mock 주입 시 최종 렌더 상태 = 이전 상태. (Patch 6: Minor m4)
- [ ] 취소 시 상태 원복 (UnpublishConfirmSheet 취소 버튼 탭 시).
- [ ] 실패 시 Toast error + 토글 원복.
- [ ] Defensive: BE 409 `CUSTOM_PROMPT_PUBLISH_BLOCKED` 수신 시 동일 안내 Toast.
- [ ] `useUpdateMeContentVisibilityUseCase()` mutation hook 신설.
- [ ] Telemetry: `click_publish_toggle` event (content_id + from_state + to_state).

## Regression Guard (Phase 1 Inherited)

- [ ] Phase 1 `profile-to-swipe-feed.yaml` flow 통과 (AC 2.5, 7.3 회귀 없음).
- [ ] Phase 1 `home-tabs.yaml`, `home-header-elements.yaml` 통과.
- [ ] Phase 1 MY Profile 3탭 (AC 2.1 / 2.7 자동 랜딩 우선순위) 회귀 없음 — `my-profile-default-landing.yaml`.
- [ ] Phase 1 `other-user-profile.yaml` (AC 7.1 / 7.2 / 7.4 handling) 회귀 없음.
- [ ] Phase 1 `profile-edit.yaml` (AC 2.4 편집) 회귀 없음.
- [ ] Phase 1 `settings-menu-full.yaml` (AC 2.8 설정) 회귀 없음.
- [ ] `korean-count` 포매터: 재생성 카운트는 축약 유지 (Phase 1 동작), 좋아요 는 축약 없음 (Phase 2 신규) — 분리 포맷 정확.
- [ ] SwipeFeed discriminated union variant: 기존 `{kind:'me',visibility}`, `{kind:'user',userId}`, legacy `{targetId,type,entryPoint}` 3개 여전히 정상 동작.

## Verification Method

### 공통 빌드 품질
- [ ] `cd app/apps/MemeApp && yarn typescript` — 신규 에러 0.
  - **FE typecheck clean 측정** (rubric C7 v3 / KB completeness-003): `yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` → 신규 0 hit.
- [ ] `yarn lint` 신규 에러 0.

### Active Evaluation Techniques

1. **Trace — Owner 분기 정확성 (app-003)**:
   - Happy path: `ownerId !== currentUserId` → "템플릿 사용하기" 렌더.
   - Edge: `ownerId === currentUserId` 시 "다시 생성하기" 렌더. 코드 trace.
   - Both variants 의 CTA 탭 후 navigate payload 에 `sourceContentId` 포함 확인.

2. **Trace — Custom-prompt Block (app-004)**:
   - Seed: `item.isCustomPrompt === true` + `isPublished === false`.
   - OFF→ON 탭 → API 호출 **없음** (mutation 미실행 trace) + 정확 Toast 문구 렌더.
   - Defensive: BE 409 수신 경로도 동일 Toast.

3. **Trace — sourceContentId Threading (app-003)**:
   - CTA 탭 → navigate → generate API body 에 sourceContentId 전달되는 전체 경로 trace (route params → useCase → repository → axios call).
   - Legacy 홈 진입 경로는 transfer 없음 verified.

4. **Trace — Count Format Separation (app-001, app-005 prerequisite)**:
   - 좋아요 `.toString()` or `Intl.NumberFormat('ko-KR')` 사용 (grep `rg 'toLocaleString.*ko-KR' | rg -i like` or `Intl.NumberFormat`).
   - 재생성 `korean-count` import/사용 (grep `rg 'koreanCount' src/presentation/swipe-feed/components/swipe-feed-actions.tsx` → hit).
   - 둘이 섞이지 않음 (좋아요에 korean-count 금지).

5. **Prop Threading Check (rubric C13)**:
   - `ownerId`, `sourceContentId`, `isCustomPrompt`, `isPublished` 가 FeedItemEntity → SwipeFeedScreen → ItemRenderer → CTA/ToggleButton 까지 prop threading. 자식이 parent state 를 추정/기본값 대체 금지.
   - Evaluator: 각 callsite 의 props 시그니처 검토.

6. **Route Params Regression (rubric C7 v3)**:
   - `route.types.ts` 의 navigation types 수정 → `rg "navigation.navigate\('(FilterPreview|CreateContent|...)'" --glob '*.tsx' --glob '*.ts'` → 전수 호출부 sourceContentId 전달 여부 확인.
   - FE typecheck `grep -v '@wrtn/'` clean.

7. **Telemetry Event Verification**:
   - `click_vertical_feed_action_btn` (app-001): button_name 에 regenerate 포함.
   - `click_publish_toggle` (app-004): event payload trace.

8. **Dead hook detection (Patch 3: Major #3 / Group 001 Lesson #3)**:
   - `rg "useUpdateMeContentVisibilityUseCase\(" app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts'` → **≥ 1 hit** (PublishToggle 컴포넌트 내).
   - `rg "useDeleteMyContentUseCase\(" app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts'` → **≥ 1 hit** (DeleteConfirmSheet 또는 더보기 sheet 핸들러 내).
   - 0 hit 시 Major — Hook 이 export 만 되고 실제 호출되지 않음 (dead method).

9. **E2E Smoke Gate (phase-build §4.3.2)**:
   - 신규 flow 3개 (`swipe-feed-publish-toggle.yaml`, `swipe-feed-custom-prompt-block.yaml`, `swipe-feed-more-sheet.yaml`) 실행.
   - 기존 Phase 1 `profile-to-swipe-feed.yaml` + `home-tabs.yaml` 회귀 실행.
   - maestro tap 제약 인지: assertVisible 까지만. 실제 확정 탭 효과는 Evaluator 코드 추적.

## KB Pattern Injection

- **completeness-003 (major, freq 2)** — Route param 타입 변경 시 callsite 전수: app-003 의 `sourceContentId` 추가 후 전수 grep.
- **completeness-007 (major)** — Prop threading: owner/custom-prompt/published flag 를 FeedItemEntity 레벨까지 threading.
- **integration-001 (critical)** — BE/FE 필드명: likeCount, liked, regenerateCount, sourceContentId, isCustomPrompt, errorCode 일치.
- **correctness-002 (critical)** — API 응답 DTO getter 금지: 본 그룹은 FE 이므로 BE 응답 매퍼에서 getter 사용 금지. Zod 매핑 시점 검증.
- **completeness-006 (major)** — Conditional path unconditional fire: app-004 visibility mutation 은 conditional (OFF→ON 일반 only 실행, custom-prompt 는 no-op). `enabled` 가드 없이 mutation 은 호출 사이트 조건 분기 필수.

### FeedItemEntity 확장 영향 범위 (Group 002 내부 전수 — Patch 4: Major #4 / Group 001 Lesson #2)

본 그룹의 entity 확장 (likeCount, liked, regenerateCount, sourceContentId, isCustomPrompt) 은 다음 **3 SwipeFeed 진입 path** 모두에서 동일 `meme.mapper.ts` 를 경유한다:

- (a) **MY profile 3-tab 진입** (`{kind:'me', visibility:'public'|'private'|'liked'}`)
- (b) **ProfileToSwipeFeed / OtherUserProfile** (`{kind:'user', userId}`)
- (c) **Legacy 홈 필터 진입** (`{targetId, type, entryPoint}`)

**Done Criterion**: 각 path 의 queryFn 이 동일 `meme.mapper.ts` 를 사용하여 5 신규 필드 제공함을 trace. 어느 path 에서도 `undefined` 필드로 인한 런타임 zod 파싱 실패 없음 (Zod 필수 boolean / number 강제).

## Cross-group Integration (With Group 001 BE)

- app-004 PATCH 호출 ↔ be-001 endpoint. errorCode `CUSTOM_PROMPT_PUBLISH_BLOCKED` 핸들링 양방향 확인.
- app-003 generate body ↔ be-002 sourceContentId 수용. `SOURCE_CONTENT_DELETED` / `SOURCE_CONTENT_NOT_PUBLIC` errorCode 핸들링.
- app-001 FeedItemEntity ↔ be-001/002/004 ContentSummary 확장 필드 일치 (zod runtime 검증).
- app-002 DELETE 호출 ↔ 기존 BE endpoint (변경 없음).

## Known Amendments (Phase 3.4 적용)

- **DRIFT-01**: AC 3.3 좋아요 카운트 ko-KR thousand separator 적용 — app-001 / app-005 / app-006 LikeBadge.
- **DRIFT-02**: SwipeFeed footer canonical (app-003 `.sf-creator` + `.sf-footer` + `.cta-button`) SSOT — app-001, app-004 참조.

## Sign-off

- Sprint Lead draft: 2026-04-23
- Evaluator Round 1: ISSUES (Major 4 / Minor 5) — `group-002-review.md`
- Sprint Lead patches applied (Round 2 submission): 2026-04-23
  - Patches 1–6 (Major #1~4 + Minor m2/m3/m4) 모두 반영
  - Minor m1 (telemetry enum source) / m5 (typecheck baseline) 는 구현자 판단 여지 OK → 자율 처리
- Status: _awaiting Round 2 review_
- Evaluator approved 2026-04-23
