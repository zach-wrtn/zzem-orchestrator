# Sprint Contract: Group 001 — Backend Foundation

## Scope

- **Tasks**: be-001 (visibility toggle), be-002 (regeneration tracking), be-003 (payback trigger), be-004 (likes domain)
- **Endpoints**:
  - PATCH `/v2/me/contents/:contentId/visibility` (신규)
  - POST `/v2/contents/:contentId/likes` (신규)
  - DELETE `/v2/contents/:contentId/likes` (신규)
  - GET `/v2/me/contents?visibility=liked` (Phase 1 placeholder → 실제)
  - GET `/v2/me/contents/counts` (liked 실제 값)
  - Content generation endpoint (기존, sourceContentId 필드 확장)
  - Credit history (기존, PAYBACK transaction type 추가)
- **Event Listeners**: ContentGeneration complete → regenerateCount increment + payback trigger (internal)

## Done Criteria

### be-001 — Visibility Toggle
- [ ] `PATCH /v2/me/contents/:contentId/visibility` 엔드포인트 구현 + Swagger.
- [ ] `isPublished` 누락 또는 비-boolean 타입 → 400 (validation, Minor M2).
- [ ] 본인 소유 검증: 타 유저 콘텐츠 → 403.
- [ ] Custom-prompt 콘텐츠 `isPublished=true` 요청 → 409 `{ errorCode: "CUSTOM_PROMPT_PUBLISH_BLOCKED" }`.
- [ ] 정상 토글 (public ↔ private) → 200 + 갱신된 `ContentSummary` 응답.
- [ ] 멱등 (같은 상태 재요청 → 200 + 응답 body 의 `isPublished` 값이 요청과 동일. 외부 관찰 가능 criterion 만 검증 — Minor M1).
- [ ] Soft-deleted → 404.
- [ ] 응답 `ContentSummary` 에 Phase 2 신규 필드 (`likeCount`, `liked`, `regenerateCount`, `sourceContentId`, `isCustomPrompt`) 포함 — api-contract.yaml 일치.

### be-002 — Regeneration Tracking
- [ ] Content / CustomPromptContent 스키마에 `sourceContentId?: ObjectId`, `regenerateCount: number (default 0)` 필드 추가.
- [ ] 일반 + custom-prompt 생성 요청 DTO 에 `sourceContentId?: string` optional 필드 추가 + Swagger.
- [ ] `sourceContentId` 가 존재하지 않는 id (non-existent) 또는 soft-deleted 된 Content/CustomPromptContent 대상 → 400 `SOURCE_CONTENT_DELETED`. (Patch 1: Major #1 — 의미 명확화)
- [ ] `sourceContentId` 가 `isPublished=false` → 400 `SOURCE_CONTENT_NOT_PUBLIC`.
- [ ] 재생성 완료 이벤트 시 원본 `regenerateCount` +1 (정확히 1, 체인 transitive 없음). MongoDB `$inc` atomic operator 권장 (race-safe).
- [ ] `MyProfileResponse.regeneratedCount` / `PublicProfileResponse.regeneratedCount` 가 `userId=caller, deletedAt=null` 조건의 소유 콘텐츠 `regenerateCount` 합산 (공개/비공개 무관, soft-delete 제외). hardcoded 0 탈출. (Patch 5: Major #5 — aggregation 범위)

### be-003 — Payback Trigger
- [ ] 재생성 이벤트 (sourceContentId 있음) 시 페이백 크레딧 = `Math.ceil(creditUsed * PAYBACK_RATE)` 계산 (env `PAYBACK_RATE`, default 0.01).
  - **`creditUsed` SSOT**: ContentGeneration 완료 이벤트 payload 필드. 부재 시 `CreditProductPlanDomainService.getConsumedCredit(contentId)` 단일 경로 참조 — 둘 중 하나를 구현 시점에 확정. V-method 에 payload trace 증거 필수. (Patch 2: Major #2)
- [ ] 페르소나 (`UserProfile.type === 'INTERNAL'`) 원본 → skip (CreditHistory 미생성).
- [ ] Self-regeneration (caller === content.userId) → skip. (판정 순서: persona-skip OR self-skip 중 어느 것이 먼저 걸려도 최종 결과 동일하므로 구현 순서 자유)
- [ ] CreditHistory 엔트리: `title = "크레딧 페이백"`, `thumbnailUrl = 원본 Content.thumbnailUrl` (SSOT: 원본. task 003-* 라인 49 의 "재생성 결과물" 대안 해석은 무시), `amount = 페이백 크레딧`, `transactionType = PAYBACK`, `source = PROMOTION`. (Patch 3: Major #3)
- [ ] Idempotency: 동일 `(newContentId, sourceContentId)` tuple 조합 → 중복 적립 없음. CreditDetailHistory 에 이미 PAYBACK 엔트리 존재 시 skip. V-method: 동일 generation 이벤트 2회 dispatch → CreditHistory count === 1. (Patch 4: Major #4)
- [ ] Payback 실패가 `regenerateCount` 를 롤백시키지 않음 (regenerateCount 는 source of truth, payback 은 best-effort).
- [ ] 공개→비공개 전환 시 CreditWallet 회수 없음 (negative test).
- [ ] 공개 콘텐츠 삭제 후 CreditWallet 회수 없음.
- [ ] Custom-prompt 콘텐츠를 source 로 한 재생성 → 페이백 대상 아님 (be-002 validation 으로 1차 차단).

### be-004 — Likes Domain
- [ ] `Like` schema + repository + domain service 신규 추가.
- [ ] Unique compound index `{ userId, contentId, deletedAt: null }` 존재.
- [ ] `POST /v2/contents/:contentId/likes` — 정상 동작 + 멱등 + 404 (content not found).
- [ ] `DELETE /v2/contents/:contentId/likes` — 정상 동작 + 멱등.
- [ ] Self-like 성공 + likeCount +1.
- [ ] 응답 `LikeToggleResponse` (`contentId`, `liked`, `likeCount`) api-contract 일치.
- [ ] Self-unlike → `likeCount -1` (Minor M6).
- [ ] Soft-deleted content 에 like toggle 시도 (POST or DELETE) → 404 (Minor M5).
- [ ] `ContentSummary.likeCount` (실제 숫자), `liked` (caller 기준) 모든 피드 엔드포인트 응답에 포함 (me-contents, users-public, 기존 feed).
- [ ] `GET /v2/me/contents?visibility=liked` 실제 데이터 반환. Cursor compound `(liked_at DESC, _id DESC)` 정렬 + `$lte` (rubric C10 compound case). V-method: seed 3 like (중 2개 동일 liked_at) + limit 2 → page 2 `list.length === 1`, `nextCursor === null`. (Patch 6: Major #6)
- [ ] `GET /v2/me/contents/counts.liked` === `GET /v2/me/contents?visibility=liked` 전체 페이지 합계 (consistency invariant). V-method seed: 3 like + 1 unpublish (원본 비공개 전환) + 1 delete (원본 삭제) → `counts.liked === 1`. (Patch 7: Major #7)
- [ ] 비공개 전환/삭제 콘텐츠 → liked 리스트에서 제외, Like 레코드 유지.
- [ ] 추천 시스템 이벤트 publish: `EventBus.publish` 호출 존재 + `eventName` 이 `like.created` / `like.removed` 중 하나 + `contentId` payload 포함. 실제 consumer 는 scope 외. (Minor M7)

## Regression Guard (Phase 1 Inherited)

- [ ] Phase 1 `MyProfileResponse.isPersona` 유지, `PublicProfileResponse.isPersona` 부재 유지 (AC 7.5).
  - `rg '\bisPersona\b' apps/meme-api/src/application/me-users/dto/public-profile-response.dto.ts` → 0 hit.
  - `/v2/me/profile` e2e snapshot 에 `isPersona` 필드 존재 확인.
- [ ] Phase 1 `/v2/me/contents?visibility=public` 동작 회귀 없음 (Phase 1 e2e spec 통과).
- [ ] Phase 1 `/v2/users/:userId/contents` 응답에 `isPublished=true` 필터 유지: `rg 'isPublished.*true' apps/meme-api/src/persistence/content/` 에서 기존 repository 쿼리 유지 확인.
- [ ] Phase 1 `/v2/me/contents/counts` 응답 구조 (public/private/liked 필드) 유지 — OpenAPI schema 불변 assertion.
- [ ] 기존 콘텐츠 생성 / 삭제 엔드포인트 동작 회귀 없음.
- [ ] Phase 1 e2e spec (me-contents, me-profile, users-public) `nx test meme-api-e2e --listTests` 에 포함 유지 (Phase 1 Round 1 regression 재현 방지). (Patch 8)

## Verification Method

### 공통 빌드 품질
- [ ] `yarn lint` 신규 에러 0.
- [ ] `yarn typescript` 신규 에러 0 (pre-existing cascade 제외).
- [ ] **nx e2e harness 검증 (rubric C11 / KB completeness-005)**:
  - `nx test meme-api-e2e --listTests | grep -E "(visibility|regenerate|payback|likes)"` → 신규 e2e-spec 파일 전수 포함.
  - 단순 파일 존재 ≠ 실행됨. listTests 증거 필수.
- [ ] **Cursor $lte 의무 (rubric C10 / KB correctness-004)**:
  - `rg '_id:\s*\{\s*\$lt\s*:' apps/meme-api/src/persistence/` → 신규 hit 0.
  - 신규 cursor 쿼리 (be-004 likes list) 는 반드시 `$lte` 사용.

### Active Evaluation Techniques

0. **Trace — Chain Transitive (be-002, Minor M3)**:
   - Seed: A(src=null) → B(src=A) → C(src=B) regenerate 완료.
   - Assert: `A.regenerateCount === 1` (변화 없음), `B.regenerateCount === 1`, `C.regenerateCount === 0`.
   - transitive 증분 금지 검증.

1. **Trace Execution — 페이백 계산 수식**:
   - Test seed: persona owner + regular user regenerates with 100 credits used.
   - Expected CreditHistory entry: amount = `ceil(100 * 0.01)` = 1 크레딧, transactionType=PAYBACK.
   - Evaluator 직접 수식 trace (코드 라인 인용).

2. **Trace — Persona Skip**:
   - Test seed: INTERNAL user owns content. Regular user regenerates.
   - Expected: CreditHistory 쿼리 결과 0건 (persona 에게 지급 없음).
   - Evaluator: IF 분기 코드 경로 확인 + 실제 CreditHistory 조회.

3. **Trace — Self-regeneration Skip**:
   - Test seed: user A owns content. User A regenerates own content.
   - Expected: regenerateCount +1 되나 CreditHistory 엔트리 0건 (self-pay 방지).

4. **Trace — Custom-prompt Block**:
   - Test seed: 본인 소유 custom-prompt content.
   - PATCH visibility `{ isPublished: true }` → 409 errorCode=CUSTOM_PROMPT_PUBLISH_BLOCKED.

5. **Trace — Like Idempotency**:
   - POST likes 2회 연속 → 2회차 200 + likeCount 변화 없음.
   - DELETE likes (좋아요 안한 상태) → 200 + liked=false.

6. **Cursor Pagination Edge**:
   - Seed: 3 liked contents. limit=2 → page 2 응답 `list.length === 1`, `nextCursor === null`.
   - `$lte` 사용 검증 — `$lt` 사용 시 page 2 에서 마지막 아이템 누락.

7. **Type Diff**:
   - `MyProfileResponse` vs `PublicProfileResponse` — `isPersona` 필드 diff 유지 확인.

8. **Deadhook / Dead Endpoint Check**:
   - `POST /v2/contents/:id/likes` — 최소 be-004 unit test 에서 호출 확인.
   - Payback event listener — unit test 에서 event dispatch → CreditHistory 생성 확인.

## Cross-task Integration

- **be-001 ↔ be-002**: `isCustomPrompt` 판정 로직 공유 (Content 스키마 or 별도 컬렉션). be-001 의 custom-prompt block + be-002 의 sourceContentId validation 양쪽에서 일관 사용.
- **be-002 ↔ be-003**: ContentGeneration 완료 훅 공유. regenerateCount 증가 (be-002) + payback trigger (be-003) 같은 이벤트 리스너 내 처리 권장 (atomicity).
- **be-004 ↔ be-001/002**: `ContentSummary` DTO 확장 (likeCount, liked, regenerateCount, sourceContentId, isCustomPrompt) — 공통 mapper 경유.

## KB Pattern Injection

다음 KB 패턴이 본 contract 에 자동 반영됨:

- **correctness-001 (critical)**: Cursor DTO 이중 래핑 금지 → be-004 likes list controller 는 service 반환 그대로.
- **correctness-004 (major, freq 2)**: Cursor 쿼리 `$lte` 의무 → be-004 repository 의 liked cursor.
- **completeness-003 (major, freq 2)**: Route param 타입 변경 시 callsite 전수 → 본 그룹 BE only 이라 해당 적음. 단 응답 DTO 필드 추가 시 기존 consumer 영향도 확인.
- **completeness-005 (major)**: nx e2e testMatch discovery → 신규 4 spec 모두 listTests 증거 필수.
- **integration-001 (critical)**: BE/FE 필드명 일치 → `likeCount`, `liked`, `regenerateCount`, `sourceContentId`, `isCustomPrompt`, `errorCode` 모두 api-contract 일치.
- **code_quality-001 (major)**: Domain 레이어 react-query import — BE 라 해당 적음. 도메인 순수성 유지.

## Sign-off

- Sprint Lead draft: 2026-04-23
- Evaluator Round 1: ISSUES (Major 7 / Minor 8) — `group-001-review.md`
- Sprint Lead patches applied (Round 2 submission): 2026-04-23
  - Patches 1–8 (Major #1~7 + Regression 구체화) + Patches covering Minor M1/M2/M3/M5/M6/M7
- Evaluator approved 2026-04-23
- Status: APPROVED — Phase 5 구현 진입 가능
