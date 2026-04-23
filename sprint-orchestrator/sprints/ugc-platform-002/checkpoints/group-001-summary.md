# Group 001 Summary: ugc-platform-002

## Scope

- **Tasks**: be-001 (visibility toggle), be-002 (regeneration tracking), be-003 (payback trigger), be-004 (likes domain)
- **Endpoints**:
  - PATCH /v2/me/contents/:contentId/visibility (신규)
  - POST/DELETE /v2/contents/:contentId/likes (신규)
  - GET /v2/me/contents?visibility=liked (활성화)
  - GET /v2/me/contents/counts.liked (실제 값)
  - Content generate (확장 — sourceContentId 수용)
  - CreditHistory PAYBACK transactionType (신규 enum)
- **Event listeners (internal)**: regeneration + payback triggers on CONTENT_GENERATION_COMPLETED

## Result: PASS

- **Fix loops**: 1 회
- **Evaluator verdict (Round 2)**: PASS — Critical 0 / Major 0 / Minor 4 (non-blocking deferred)
- **Contract sign-off**: Round 2 APPROVED (patches 1~8 + Minor 반영)

## Commits (on sprint/ugc-platform-002)

| SHA | Message |
|-----|---------|
| cb702eab | feat(be-001): content visibility toggle API |
| d8... (2nd) | feat(be-002): regeneration tracking (sourceContentId + regenerateCount) |
| (3rd) | feat(be-003): payback trigger + credit history PAYBACK entry |
| (4th) | feat(be-004): likes domain (toggle + liked list + likeCount/liked in feed) |
| 9a922fa6 | feat(be-002): wire sourceContentId through generation pipeline |
| 0fdf846c | fix(be-group-001-r1): Major 1+2+3 + Minor M4 |

## Issues Found & Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | major | sourceContentId 가 Content document 에 영구 저장 안 됨 (createOne 미수용, setSourceContentId dead) | ContentRepository/CustomPromptContentRepository.createOne 에 sourceContentId ObjectId 저장 + gen-meme threading |
| 2 | major | FeedResponseDto 에 likeCount/liked/regenerateCount/sourceContentId/isCustomPrompt 0개 + FeedAppService LikeDS 미의존 | 5필드 DTO 추가 + LikeDomainService DI + resolveLikeContext 배치 호출 |
| 3 | major | Custom-prompt 생성 경로에서 sourceContentId validation 미실행 (DTO 외 참조 0) | custom-prompt-generation-app.service.ts 에 ContentDomainService DI + validateSourceContent 호출 |
| 4 | minor | me-contents-liked.e2e-spec.ts cursor 테스트 distinct liked_at 로 compound $lte 경계 버그 탐지 불가 | seed 를 동일 timestamp (1000/1000/2000ms) 로 변경 |

### Minor Deferred (non-blocking)
- M1 Like hard-delete vs schema deletedAt 불일치 (Contract 는 hard-delete 허용)
- M2 findLikedContents over-fetch → hasNext 판정 부정확 (MVP 한계, 주석 명시)
- M3 countVisibleLikedByUser O(N) round-trip (좋아요 많은 유저에서 비용)
- M5 Payback idempotency regex 비앵커 패턴 (ObjectId 고정길이라 실제 충돌 희박)
- **custom-prompt GenerationCompleted emit site**: buildGenerationCompletedEvent factory 는 존재하나 dead — Phase 2 custom-prompt 재생성 런타임 트리거는 follow-up 필요. regenerateCount 증분 + payback 트리거는 emit 사이트 활성 후 동작.

## Lessons for Next Group (Group 002 — FE 피드 인터랙션)

1. **Contract 작성 단계에서 DTO 필드 추가 vs 실제 behavior 를 명확히 분리**: Round 1 Major 3 (custom-prompt DTO 필드만 존재, behavior 미작동) 는 Contract 가 "DTO 추가" 만 언급해 구현자가 DTO 만 수정. Group 002 Contract 에서는 "필드 + 호출/매핑/invalidate 까지" 명시 필요.
2. **Cross-component 적용 범위를 Done Criteria 에 전수 명시**: Round 1 Major 2 (FeedResponseDto 가 likeCount 필드를 포함하지 않음) 는 Contract 가 "me-contents, users-public, 기존 feed" 를 언급했으나 구현자가 me-contents/users-public 만 반영. Group 002 FE 태그스크에서도 "SwipeFeed entity 확장이 어느 screen 에 영향" 을 그룹 범위로 전수 나열.
3. **Dead method / dead factory 탐지**: Round 1 Major 1 (setSourceContentId 는 존재하나 0 callsites), Major 3 (buildGenerationCompletedEvent dead factory). Evaluator V-method 에 `grep -rn '<newMethodName>' apps/` 로 callsite count 확인 필수.
4. **FE typecheck clean 측정**: rubric C7 v3 — `yarn typescript | grep -v '@wrtn/'` 으로 pre-existing cascade 와 신규 regression 구분. Group 002 에서도 동일 적용.
5. **Prototype spec 준수**: Phase 3 에서 approved 된 14 screens + 2 amendments (DRIFT-01 thousand separator, DRIFT-02 SwipeFeed footer canonical) 는 Group 002 FE 구현 SSOT.

## Files Changed (주요)

**New files**:
- `persistence/like/*` (schema, repository, module)
- `domain/like/*`
- `application/like/*`
- `controller/like/*`
- `application/me-contents/dto/update-visibility-request.dto.ts`
- `application/regeneration/*` (event listener + module)
- `application/payback/*` (event listener + module + unit test)
- `test/me-contents-visibility.e2e-spec.ts`, `test/regeneration.e2e-spec.ts`, `test/payback.e2e-spec.ts`, `test/likes.e2e-spec.ts`, `test/me-contents-liked.e2e-spec.ts`

**Modified files** (key):
- `persistence/content/*` (schema/repo/mapper/interface)
- `persistence/custom-prompt-content/*` + `persistence/custom-prompt/*`
- `persistence/credit/credit.repository.ts` + `common/constant/credit.constant.ts`
- `domain/content/content-domain.service.ts`
- `domain/credit/credit-domain.service.ts`
- `domain/gen-meme/gen-meme.service.ts` (deductCredit + generate signature + event payload)
- `application/me-contents/*` + `application/feed/*` + `application/user-profile/*` + `application/users-public/*` + `application/filter/*` + `application/custom-prompt/custom-prompt-generation-app.service.ts`
- `common/interface/content-generation-completed-event.interface.ts` (+ sourceContentId)
- `controller/me/me-contents.controller.ts`, `controller/users/users.controller.ts`, `controller/controller.module.ts`
- `app.module.ts` (RegenerationAppModule + PaybackAppModule 등록)

## Regression Guard 확인

- [x] Phase 1 `MyProfileResponse.isPersona` 유지 / `PublicProfileResponse.isPersona` 부재 유지
- [x] Phase 1 `/v2/me/contents?visibility=public` 회귀 없음
- [x] Phase 1 `/v2/users/:userId/contents` 공개 필터 유지
- [x] Phase 1 e2e spec discovery 유지
- [x] Content 생성/삭제 기존 동작 유지

## Next: Group 002 (FE 피드 인터랙션)

- Contract draft: `contracts/group-002.md` 이미 작성됨 (2026-04-23)
- 다음 단계: Evaluator contract review → FE Engineer impl → e2e smoke → Evaluator eval
