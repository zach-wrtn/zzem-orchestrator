# Group 001 Evaluation Report

> Evaluator: ZZEM Sprint Team Evaluator
> Date: 2026-04-23
> Base: Contract group-001.md (Round 2 APPROVED), Rubric v3 (C1–C13)
> Commits evaluated: cb702eab (be-001) + b1435d12 (be-002) + f37d65cf (be-003) + 6f9e7a22 (be-004) + 9a922fa6 (be-002 wiring)

## Verdict: ISSUES

- Critical: 0
- Major: 3
- Minor: 5

Core functional surfaces (visibility toggle, likes CRUD, regeneration increment, payback trigger) trace correctly against Contract Done Criteria. However, two AC violations are present in data/feed surfaces that would ship broken FE state, plus one custom-prompt validation gap.

## Issues Found

### Critical (기능 불가)
없음.

### Major (AC 미충족 / 회귀)

| # | Severity | Area | Issue | Evidence (file:line) | Fix Suggestion |
|---|---------|------|-------|----------------------|----------------|
| 1 | major | be-002 | 새 Content 생성 시 `sourceContentId` 가 DB 에 **영구 저장되지 않음**. 이벤트 payload 에는 전파되나 Content document 자체에는 null 로 남아 `ContentSummary.sourceContentId` 가 항상 null 반환. api-contract `ContentSummary.sourceContentId` AC 위반. | `apps/meme-api/src/persistence/content/content.repository.ts:123-135` (`createOne` — `sourceContentId` 미입력), `apps/meme-api/src/domain/gen-meme/gen-meme.service.ts:328-337` + `apps/meme-api/src/application/filter/content-generation-app.service.ts:172-191` (caller 가 전달하지 않음). `setSourceContentId` 메서드는 `content-domain.service.ts:73` 에 존재하나 **호출되는 곳이 전혀 없음** (dead method — `grep -rn setSourceContentId` 결과 1 hit). | `createOne` 의 input 타입 확장(`sourceContentId?: string`), gen-meme.service L328 / createContentWithStatus L172 에 sourceContentId 전달. 또는 `setSourceContentId` 를 `startGeneration` / `generate` 직후 호출. |
| 2 | major | be-004 | `FeedResponseDto` (grid/swipe feed 공용 응답)에 `likeCount` / `liked` / `regenerateCount` / `sourceContentId` / `isCustomPrompt` 필드가 **하나도 없음**. Contract §be-004 "`ContentSummary.likeCount` (실제 숫자), `liked` (caller 기준) 모든 피드 엔드포인트 응답에 포함 (me-contents, users-public, 기존 feed)" 명문 위반. | `apps/meme-api/src/application/feed/dto/feed-response.ts:41-170` — 필드 전수 검토, Phase 2 신규 필드 전혀 없음. `grep -rn 'LikeDomainService\|resolveLikeContext' apps/meme-api/src/application/feed/feed-app.service.ts` → 0 hit (feed 서비스가 LikeDomain 을 의존하지 않음). | `FeedAppService` 에 `LikeDomainService` 주입 → `resolveLikeContext(callerUserId, contentIds)` 배치 호출, `FeedResponseDto` 에 `likeCount/liked/regenerateCount/sourceContentId/isCustomPrompt` 필드 추가. grid/swipe 양쪽 response 생성 경로에 주입. |
| 3 | major | be-002 | Custom-prompt 생성 경로에서 `sourceContentId` validation 이 **전혀 실행되지 않음**. DTO `CreateCustomPromptRequest.sourceContentId` 필드는 정의됨(`create-custom-prompt-request.dto.ts:144`)이나 `apps/meme-api/src/application/custom-prompt/` 내부에서 `sourceContentId` 참조는 단 1회(DTO 자체) — 실제 service/factory/listener 가 읽지 않는다 (`grep -rn 'sourceContentId' apps/meme-api/src/application/custom-prompt/` → 1 hit). | `grep` 결과 + Sprint Lead 커밋 (9a922fa6) 본인 명시: "Custom-prompt path: buildGenerationCompletedEvent factory 는 존재하나 custom-prompt flow 에서 실제 emit 사이트 미발견 (dead factory)." Contract §be-002 "일반 + custom-prompt 생성 요청 DTO 에 sourceContentId?: string optional 필드 추가 + Swagger" 는 DTO 만 아닌 동작도 포함. | Custom-prompt request handler 에 `contentDomainService.validateSourceContent(sourceContentId)` 호출 + 완료 이벤트 emit 시 payload 에 포함. 본 group 범위에서는 최소 validation 만 연결. |

### Minor (코드 품질)

| # | Area | Issue | Evidence |
|---|------|-------|----------|
| M1 | be-004 | `LikeSchema` 에 `deletedAt` prop 이 정의되고 `partialFilterExpression` unique index 도 걸려있으나, 실제 `deleteByUserAndContent` (like.repository.ts:64-73) 는 `deleteOne` — **hard-delete**. 스키마 hint 와 실동작 불일치 → soft-delete 의도가 없다면 `deletedAt` 필드/index 제거, 있다면 `updateOne({deletedAt: new Date()})` 로 전환. Contract 는 hard-delete 허용하므로 blocking 아님. | `apps/meme-api/src/persistence/like/like.schema.ts:31-45` vs `apps/meme-api/src/persistence/like/like.repository.ts:64-73`. |
| M2 | be-004 | `findMyLikesWithCursor` 에서 over-fetch → app 레이어 `findLikedContents` 가 private/deleted content 를 후필터링. 필터링된 items 수만큼 list 길이가 `limit` 보다 작아질 수 있으며, `hasNext = summaries.length > limit` 판정이 실제 DB 진행 상황을 반영 못함. 페이지 중간에 다수 드롭 시 "next page 가 비어 보이는" 현상 가능. 주석에 명시됨 (MVP 한계 인정). | `apps/meme-api/src/application/me-contents/me-contents-app.service.ts:101`, `apps/meme-api/src/domain/like/like-domain.service.ts:117-195`. |
| M3 | be-004 | `countVisibleLikedByUser` 가 `findMyLikesWithCursor(userId, 1_000_000, null)` 후 per-like Content 쿼리 loop — O(N) round-trip. 좋아요 수가 많은 유저에서 비싼 쿼리. Aggregate pipeline 으로 1 round-trip 변환 여지. | `apps/meme-api/src/domain/like/like-domain.service.ts:204-220`. |
| M4 | be-004 | `me-contents-liked.e2e-spec.ts` Patch 6 검증 케이스에서 3 likes 를 **모두 distinct createdAt** (1000/2000/3000ms) 로 seed. Contract V-method #6 는 "동일 liked_at 2건 + limit 1 → page 2 list.length === 1" 을 요구하여 `_id: $lte` compound 경계 검증 필요. 현재 테스트로는 `$lt` 로 버그가 있어도 탐지 못함. 코드 자체는 올바른 compound cursor 이나 자가검증 구멍. | `apps/meme-api/test/me-contents-liked.e2e-spec.ts:103-125`. |
| M5 | be-003 | Payback idempotency lookup `findOnePaybackHistoryByNewContentId` 가 `$regex` 비앵커 패턴 (`description: { $regex: 'newContentId=${newContentId}' }`). newContentId 가 다른 id 의 접두사가 될 수 있을 때 오탐 위험 (ObjectId 는 고정길이 24자라 실제 충돌은 희박하나 방어적). Regex special char escape + `^...$` 앵커 권장. | `apps/meme-api/src/persistence/credit/credit.repository.ts:136-140`. |

## Done Criteria Check (Sprint Contract)

### be-001 Visibility Toggle
- [x] PATCH 엔드포인트 + Swagger: `me-contents.controller.ts:62-75` + `@ApiBody`, `@ApiResponse(403/404/409)` 명세. VERIFIED.
- [x] 400 validation: `update-visibility-request.dto.ts:14-16` `@IsDefined` + `@IsBoolean` + e2e `me-contents-visibility.e2e-spec.ts:89-105` (2 case 통과). VERIFIED.
- [x] 403 본인 소유 검증: `me-contents-app.service.ts:165-167` `ForbiddenException` + e2e L107-124. VERIFIED.
- [x] 409 CUSTOM_PROMPT_PUBLISH_BLOCKED: `me-contents-app.service.ts:148-155` + e2e L135-148 (`errorCode` 검증). VERIFIED.
- [x] 200 + ContentSummary 갱신: `me-contents-app.service.ts:169-180` + e2e L150-164. VERIFIED.
- [x] 멱등 (동일 상태 재요청): `findOneAndUpdate` 는 매칭된 doc 반환 → e2e L166-174. VERIFIED.
- [x] 404 soft-deleted: `findByIdNotDeleted` 가 null 반환 → NotFound. e2e L126-133. VERIFIED.
- [x] ContentSummary Phase 2 신규 필드: `content-summary.dto.ts:11-37` 전필드 + e2e L159-163 (`likeCount/liked/regenerateCount/sourceContentId/isCustomPrompt` 응답 포함). VERIFIED.

### be-002 Regeneration Tracking
- [x] 스키마 신규 필드: `content.schema.ts:83-91` + `custom-prompt-content.schema.ts:62,68`. VERIFIED.
- [x] 생성 DTO `sourceContentId`: `create-meme-request.dto.ts:65-71` + `create-custom-prompt-request.dto.ts:138-144`. VERIFIED.
- [x] 400 SOURCE_CONTENT_DELETED / NOT_PUBLIC: `content-domain.service.ts:45-67` + filter-creation-app.service.ts:65-67 호출. VERIFIED.
- [x] 원본 regenerateCount +1 (atomic `$inc`): `content.repository.ts:281-286` + `regeneration-event.listener.ts:29-65`. VERIFIED.
- [x] 체인 transitive 없음: listener 에서 원본만 조회해 `incrementRegenerateCount` 후 return — e2e `regeneration.e2e-spec.ts:101-138` (A=1, B=1, C=0). VERIFIED.
- [x] MyProfile/PublicProfile regeneratedCount 실값: `sumRegenerateCountByUser` aggregation (`content.repository.ts:292-300`) + UsersPublicAppService.getPublicProfile L36, UserProfileAppService.getMyProfile L26. VERIFIED.
- [✗] **Major #1** 새 Content 에 `sourceContentId` 영구 저장 안됨 — 이슈 섹션 참조.
- [✗] **Major #3** custom-prompt 경로 validation/emit 미연결 — 이슈 섹션 참조.

### be-003 Payback Trigger
- [x] `Math.ceil(usedCredit * PAYBACK_RATE)`: `payback-event.listener.ts:62-64` + unit test `payback-event.listener.spec.ts:83-106` (100×0.01=1, 50×0.01→1, env 0.05→5). VERIFIED.
- [x] Persona(INTERNAL) skip: `payback-event.listener.ts:54-58` + unit test L68-81. VERIFIED.
- [x] Self-regeneration skip: `payback-event.listener.ts:48-51` + unit test L56-66. VERIFIED.
- [x] CreditHistory 엔트리 (title/thumbnail/amount/type/source): `credit-domain.service.ts:171-181` (PAYBACK + PROMOTION + fullDescription). VERIFIED.
- [x] Idempotency (`findOnePaybackHistoryByNewContentId`): `credit-domain.service.ts:144-156`. VERIFIED.
- [x] Payback 실패 swallow (`try/catch` at listener L80-88) → regenerateCount 롤백 금지 유지. VERIFIED.
- [x] 공개→비공개/삭제 시 wallet 회수 없음: `updateVisibility` repository 에는 credit 호출 없음 (별도 회수 로직 부재). VERIFIED.
- [x] Custom-prompt 원본 skip: `payback-event.listener.ts:41-44` (filter 에만 존재 시만 진행, 없으면 return). VERIFIED.

### be-004 Likes
- [x] Like schema/repository/domain service: `like.schema.ts` + `like.repository.ts` + `like-domain.service.ts`. VERIFIED.
- [x] Unique compound index: `like.schema.ts:39-45` (partialFilterExpression). VERIFIED.
- [x] POST/DELETE 엔드포인트 + 멱등 + 404: `like.controller.ts` + `like-domain.service.ts:50-89` + e2e `likes.e2e-spec.ts:99-162`. VERIFIED.
- [x] Self-like + likeCount +1: e2e L107-116 (own content, likeCount=1). VERIFIED.
- [x] LikeToggleResponse 스키마: `like-toggle-response.dto.ts:7-15`. VERIFIED.
- [x] Self-unlike likeCount -1: e2e L132-144. VERIFIED.
- [x] Soft-deleted 404: `like-domain.service.ts:222-230` (resolveContentType 이 `findByIdNotDeleted` 반환 → exists=false) + e2e L155-161. VERIFIED.
- [✗] **Major #2** ContentSummary.likeCount/liked 모든 피드 엔드포인트 — `/v2/feeds/*` 에 미포함.
- [x] /v2/me/contents?visibility=liked cursor compound + `$lte`: `like.repository.ts:129-155` (createdAt $lt OR equal-createdAt + _id $lte). KB correctness-004 준수. VERIFIED (단 M4 테스트 커버리지 부족).
- [x] counts.liked invariant: `countVisibleLikedByUser` + e2e `me-contents-liked.e2e-spec.ts:127-154` (3 like + 1 unpublish + 1 delete → 1). VERIFIED.
- [x] 비공개/삭제 → list 제외, Like 레코드 유지: `like-domain.service.ts:128-143`. VERIFIED.
- [x] EventBus.publish `like.created` / `like.removed`: `like-domain.service.ts:60,84` + e2e L163-193 (emit spy). VERIFIED.

## Active Evaluation Traces

### Trace 0 — Chain Transitive (be-002)
**Seed**: A(src=null) B(src=A) C(src=B).
**Expected**: A=1, B=1, C=0.
**Observed**: `regeneration.e2e-spec.ts:101-138` explicit assertion + code `regeneration-event.listener.ts:30-56` (source 한 단계만 inc, 체인 없음).
**Verdict**: PASS.

### Trace 1 — 페이백 계산 수식 (be-003)
**Expected**: `ceil(100 * 0.01) = 1`, env override 동작.
**Observed**: `payback-event.listener.ts:62-64` `Math.ceil(usedCredit * paybackRate)` + unit test `payback-event.listener.spec.ts:83-122` (1 credit), L124-140 (env 0.05→5).
**Verdict**: PASS.

### Trace 2 — Persona Skip (be-003)
**IF 분기**: `payback-event.listener.ts:54-58` `if (ownerProfile.type === INTERNAL) return;` — grantPayback 미호출.
**Unit Evidence**: `payback-event.listener.spec.ts:68-81`.
**Verdict**: PASS.

### Trace 3 — Self-regeneration Skip (be-003)
**IF 분기**: `payback-event.listener.ts:48-51` `if (source.userId === event.userId) return;`. grantPayback 미호출.
**Unit Evidence**: `payback-event.listener.spec.ts:56-66`.
**Verdict**: PASS.

### Trace 4 — Custom-prompt Publish Block (be-001)
**Flow**: request `{isPublished: true}` → `me-contents-app.service.ts:148-155` `existsByIdNotDeleted` 확인 → `ConflictException` with `errorCode: "CUSTOM_PROMPT_PUBLISH_BLOCKED"`.
**E2E**: `me-contents-visibility.e2e-spec.ts:135-148` (409 + errorCode 확인).
**Verdict**: PASS.

### Trace 5 — Like Idempotency (be-004)
**POST 멱등**: `like-domain.service.ts:56-66` — 이미 존재 시 create skip + dup-key catch. E2E L118-130 (2회 POST → likeCount=1 유지).
**DELETE 멱등**: `like-domain.service.ts:82-88` — deletedCount 0 이어도 정상 응답. E2E L146-153.
**Verdict**: PASS.

### Trace 6 — Cursor Compound Edge (be-004)
**코드**: `like.repository.ts:144-147` — `$or: [ {createdAt: $lt cursorDate}, {createdAt: cursorDate, _id: $lte cursorId} ]`. Compound cursor 정확 구현 (KB correctness-004).
**Test gap** (M4): e2e 는 distinct createdAt 3건만 seed — 동일 liked_at 경계 누락 검증 없음.
**Verdict**: PASS (code) / PARTIAL (test coverage — Minor M4).

### Trace 7 — Counts Consistency (be-004)
**Invariant**: 3 like + 1 unpublish + 1 delete → counts.liked = 1.
**E2E**: `me-contents-liked.e2e-spec.ts:127-154` 검증 + counts endpoint L141-145 = 1, list endpoint L147-152 length=1.
**Verdict**: PASS.

### Trace 8 — Type Diff (Regression 7.5)
**MyProfileResponse**: `my-profile-response.dto.ts:39-40,54` (`isPersona!` + from() 세팅).
**PublicProfileResponse**: `public-profile-response.dto.ts` (전파일) — `isPersona` 필드 부재 확인 (`grep \bisPersona\b` 0 hit).
**Verdict**: PASS.

### Trace 9 — Dead Endpoint Check (be-004)
**Registration**: `LikeControllerModule` imported in `controller.module.ts:53`. `LikeController` declared in `like-controller.module.ts:10`. DI chain: `LikeAppModule` → `LikeDomainModule` → `LikePersistenceModule`.
**Verdict**: PASS — 라우트 등록 유효.

### Trace 10 — BE/FE 필드명 (integration-001)
**ContentSummary**: api-contract.yaml L269-308 vs `content-summary.dto.ts:11-37` 1:1 (id, thumbnailUrl, isPublished, createdAt, status, likeCount, liked, regenerateCount, sourceContentId, isCustomPrompt).
**LikeToggleResponse**: `like-toggle-response.dto.ts` (`contentId/liked/likeCount`) vs api-contract match.
**Verdict**: PASS — 단 **Major #2** 로 인해 FeedResponseDto 는 본 규칙을 아예 따르지 않음 (ContentSummary 가 아닌 별개 DTO 라 "다른 피드 DTO" 영역).

### Trace 11 — Cursor 이중 래핑 (correctness-001)
**like.controller.ts**: service 반환 그대로 passthrough, `new CursorResponseDto(...)` 재래핑 없음.
**like-app.service.ts**: 단일 객체 반환.
**me-contents liked**: `me-contents-app.service.ts:110-115` 은 dto 생성 후 list/nextCursor override — wrapper 가 **ContentListResponseDto** 자체 이나 controller 는 dto 자체를 그대로 return — 이중 래핑 아님.
**Verdict**: PASS.

## Regression Guard
- [x] AC 7.5 isPersona: `public-profile-response.dto.ts` 에 `isPersona` 부재, my-profile-response.dto.ts 에 존재. `grep -rn '\bisPersona\b' apps/meme-api/src/application/users-public/dto/public-profile-response.dto.ts` → 0 hit. (Note: Contract 명시 경로 `application/me-users/...` 는 오타 — 실제 디렉토리는 `application/users-public/...`. 내용 검증 PASS.)
- [x] Phase 1 `/v2/me/contents?visibility=public`: repository filter 유지 (`findByUserAndVisibilityWithCursor` L208-235 with `isPublished: true`). e2e `me-contents.e2e-spec.ts` 유지.
- [x] Phase 1 `/v2/users/:userId/contents` isPublished=true 필터: `findPublicByUserWithCursor` (content.repository.ts:314-316) → filter `{ published: true }` → 필터 유지.
- [x] counts 응답 구조 (public/private/liked): `content-counts-response.dto.ts` + service 그대로 유지.
- [x] 기존 생성/삭제 엔드포인트: 건드리지 않음 (filter-creation-app.service 는 sourceContentId 선택적 확장만).
- [x] Phase 1 e2e spec listTests 포함: `me-contents.e2e-spec.ts`, `me-profile.e2e-spec.ts`, `users-public.e2e-spec.ts` 파일 존재 + testRegex `.e2e-spec.ts$` (jest-e2e.json:5). VERIFIED.

## KB Pattern Adoption
- [x] **C10 / correctness-004** Cursor `$lte`: `like.repository.ts:146` (compound `_id: $lte`). 신규 `$lt` on `_id` 0건 (grep 결과 기존 phase 1 코드 2건은 pre-existing).
- [x] **C11 / completeness-005** nx e2e testMatch discovery: 4 신규 `*.e2e-spec.ts` 파일이 `testRegex` 매칭됨. `jest-e2e.json:5` 확인. Phase 1 spec 도 포함 유지.
- [x] **C12 / completeness-006** Enabled gate (BE 대응 낮음): payback IF 분기 (persona/self/custom-prompt/non-positive) 일관 적용 확인.
- [~] **C13 / completeness-007** Prop threading: sourceContentId request → service → event payload 까지는 OK. 단 **Content document 영구 저장**까지는 threading 실패 (Major #1). Custom-prompt path 도 threading 미완성 (Major #3).
- [x] **correctness-001** Cursor 이중 래핑 금지: Trace 11 확인.
- [x] **integration-001** BE/FE 필드명: ContentSummary / LikeToggleResponse 일치. 단 FeedResponseDto 는 ContentSummary 확장 범위에서 이탈 (Major #2).

## Recommendation

**ISSUES → fix loop**. Group 002 진입 전 아래 3개 Major 해소 필수.

1. **Major #1 (be-002)**: `ContentRepository.createOne` 에 `sourceContentId` 전달하도록 input 확장 + gen-meme.service.ts / content-generation-app.service.ts callsite 2곳 수정. `setSourceContentId` 를 활용하거나 create 시점에 임베드.
2. **Major #2 (be-004)**: `FeedAppService` 에 `LikeDomainService` 주입, `FeedResponseDto` 에 likeCount/liked/regenerateCount/sourceContentId/isCustomPrompt 5필드 추가 + grid/swipe 응답 생성부에 populate.
3. **Major #3 (be-002)**: custom-prompt 생성 flow 에서 `validateSourceContent` 호출 + 완료 이벤트 emit 시 sourceContentId payload 포함.

Minor (M1–M5) 는 Group 002 이후 별도 타스크로 처리 가능하나, M4 (cursor 동일 liked_at 테스트) 는 fix loop 중 추가 권장.

## Sign-off

Date: 2026-04-23
Evaluator: ZZEM Sprint Team Evaluator
Status: ISSUES (Critical 0 / Major 3 / Minor 5) — fix loop → Re-evaluation 필요.

---

## Round 2 Re-evaluation (fix loop 1)

> Date: 2026-04-22
> Commit: `0fdf846c fix(ugc-platform-002/be-group-001-r1): Major 1+2+3 + Minor M4`
> Files touched: 12 files (+120 / -7)
> Scope: Round 1 Major 1–3 + Minor M4 fix 확인만. Pressure: Caution.

### Fix Verification

| Issue | Round 1 | Fix Result | Verdict |
|-------|---------|------------|---------|
| Major 1 (sourceContentId 영구 저장) | ISSUES | resolved | ✓ |
| Major 2 (FeedResponseDto + LikeDomainService) | ISSUES | resolved | ✓ |
| Major 3 (custom-prompt validation) | ISSUES | resolved | ✓ |
| Minor M4 (cursor 동일 liked_at seed) | deferred | resolved | ✓ |

### Evidence (code citations)

**Major 1 — sourceContentId 영구 저장**
- `apps/meme-api/src/persistence/content/content.repository.ts:133-137` — `createOne` 에 `...(data.sourceContentId ? { sourceContentId: new Types.ObjectId(data.sourceContentId) } : {})` 추가. ObjectId 변환 저장 확인.
- `apps/meme-api/src/persistence/custom-prompt/custom-prompt-content.repository.ts:24-25` — `CustomPromptContent createDto` 에 `sourceContentId: input.sourceContentId ?? null` 저장. `CreateCustomPromptContentInput` (custom-prompt.interface.ts:87-88) 에 필드 추가.
- `apps/meme-api/src/domain/content/interface/content.interface.ts:38-39` — `CreateContentInput.sourceContentId?: string | null` 확장.
- Threading trace:
  - `apps/meme-api/src/domain/gen-meme/gen-meme.service.ts:337-338` — `createContent({..., sourceContentId: sourceContentId ?? null})` passthrough.
  - `apps/meme-api/src/application/filter/content-generation-app.service.ts:81,168-182` — `createContentWithStatus(... sourceContentId)` 시그니처 확장 + 호출시 전달.
- 결과: `ContentSummary.sourceContentId` 가 실제 ObjectId string 반환 가능 경로 확보.

**Major 2 — FeedResponseDto + LikeDomainService 주입**
- `apps/meme-api/src/application/feed/dto/feed-response.ts:147-184,206-210` — 5 신규 필드 (`likeCount / liked / regenerateCount / sourceContentId / isCustomPrompt`) + Swagger `@ApiProperty` + 생성자 초기화 (default 0 / false / null).
- `apps/meme-api/src/application/feed/feed-app.module.ts:9,21` — `LikeDomainModule` import 추가.
- `apps/meme-api/src/application/feed/feed-app.service.ts:12,68-69` — `LikeDomainService` DI 주입.
- `apps/meme-api/src/application/feed/feed-app.service.ts:391-395` — `Promise.all` 에 `this.likeDomainService.resolveLikeContext(userId ?? "", targetIds)` 배치 호출.
- `apps/meme-api/src/application/feed/feed-app.service.ts:498-506` — CONTENT item mapper 에 5필드 주입 (`likeCount: likeContext.counts.get(id) ?? 0`, `liked: likeContext.likedSet.has(id)`, `regenerateCount: content.regenerateCount ?? 0`, `sourceContentId: content.sourceContentId ?? null`, `isCustomPrompt: false`).
- `apps/meme-api/src/application/feed/feed-app.service.ts:272-278` — FILTER item 은 semantics 없어 기본값 (0/false/null) 주입 — 명시적이고 안전.
- DI 검증: `like-domain.module.ts:18-19` `exports: [LikeDomainService]`, `resolveLikeContext(userId, contentIds): { counts, likedSet }` 시그니처 (line 94-106) 일치.

**Major 3 — Custom-prompt validation 연결**
- `apps/meme-api/src/application/custom-prompt/custom-prompt-generation-app.service.ts:17,80` — `ContentDomainService` import + DI 주입.
- `apps/meme-api/src/application/custom-prompt/custom-prompt-generation-app.service.ts:106-112` — `startGeneration` 진입 직후 `if (request.sourceContentId) await this.contentDomainService.validateSourceContent(...)` 호출. `reserveGenerationSlotOrThrow` 보다 앞서 실행되어 slot 낭비 없음.
- `validateSourceContent` (content-domain.service.ts:45-67) 는 Major 1 에서 이미 검증된 공용 메서드 — `SOURCE_CONTENT_DELETED` (404-not-found or deleted) / `SOURCE_CONTENT_NOT_PUBLIC` (isPublished=false) BadRequestException 동일 에러 코드 반환.
- `sourceContentId` threading: line 149 `createContentInternal(..., request.sourceContentId ?? null)` → line 179,191-195 `customPromptDomainService.createContent({ ..., sourceContentId })`.
- DI wiring: `custom-prompt-app.module.ts:32` `ContentDomainModule` import 확인 (`content-domain.module.ts:8-9` `exports: [ContentDomainService]`).
- Caveat: generation-completed event emit site 는 dead factory 로 남음 (커밋 메시지 자인) — 별도 follow-up 로 분리. 이번 Contract §be-002 의 "validation 동작" AC 는 충족.

**Minor M4 — e2e cursor 동일 liked_at seed 보강**
- `apps/meme-api/test/me-contents-liked.e2e-spec.ts:103-113` — seed 변경: `seedLike(c1, 1000) / seedLike(c2, 1000) / seedLike(c3, 2000)`. 동일 `liked_at` 2건 + 상이 1건 구성으로 compound cursor `$lte` 경계 검증 가능. test 이름도 "(2 at same liked_at)" 으로 업데이트.

### Typecheck Regression Guard
- `yarn tsc --noEmit -p apps/meme-api/tsconfig.app.json 2>&1 | grep 'error TS' | grep -vE '(Argument of type .Model<|Model<.* is not assignable|InjectModel|filter-admin|pino-logger)'` → **0 lines** (신규 에러 없음).

### Minor Observations (non-blocking, 기록만)

- (info) Custom-prompt `generationCompleted` event emit site 는 여전히 dead factory (커밋 메시지 명시) — 본 Group 범위 밖의 구조적 리팩터 필요.
- (info) Major 2 FILTER item 의 5 필드 default (0/false/null) 는 FE/api-contract 모두에 `ContentSummary` semantics 무관성을 명시적으로 표현. 안전.
- Round 1 Minor M1/M2/M3/M5 는 이번 Round 범위 밖 — deferred 유지.

### Final Verdict: **PASS**

- 3 Major 전부 resolved. Minor M4 도 resolved.
- 신규 typecheck 회귀 없음.
- Pressure Caution: Critical/Major 잔여 없음 → verdict 영향 없음.

### Recommendation

- **PASS → Phase 4 Group 002 Contract 리뷰 즉시 진행.**
- Follow-up (non-blocking, Group 002 이후 처리 권장):
  - Custom-prompt `generationCompleted` event emit 사이트 복원 (dead factory 정리).
  - Minor M1 (Like hard-delete vs `deletedAt` hint 불일치) 정리.
  - Minor M2/M3 (liked cursor over-fetch, countVisibleLikedByUser O(N) round-trip) 는 좋아요 수 스케일 커질 때 성능 기로.
  - Minor M5 (payback regex anchor) 방어적 보강.

## Sign-off (Round 2)

Date: 2026-04-22
Evaluator: ZZEM Sprint Team Evaluator
Status: **PASS** (Critical 0 / Major 0 / Minor 4 잔여 — non-blocking). Group 001 완료 → Group 002 진입 가능.
