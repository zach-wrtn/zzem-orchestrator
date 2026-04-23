# be-001 · 콘텐츠 공개/비공개 토글 API

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: —

## Target

`backend/apps/meme-api/src/` 내:
- `application/me-contents/` (서비스, DTO)
- `controller/me-contents/` 또는 `controller/content/` (신규 endpoint)
- `persistence/content/content.repository.ts`
- `domain/content/content-domain.service.ts`

## Context

Phase 1 에서 `Content.isPublished: boolean` 필드와 `{ userId: 1, isPublished: 1, createdAt: -1 }` 인덱스가 이미 생성되어 있다. Phase 1 `/v2/me/contents?visibility=public` 는 `isPublished=true` 필터 동작 중. 단 토글 API 는 부재 — 공개/비공개 전환은 지금까지 불가능.

Phase 2 는 세로 스와이프 피드 하단의 "게시" 토글 (AC 1.8), 비공개 전환 확인 바텀시트 (AC 1.3), 커스텀 프롬프트 결과물 공개 차단 (AC 1.4), 기본 공개 정책 (AC 1.1) 을 위해 토글 엔드포인트가 필요하다.

## Objective

`PATCH /v2/me/contents/{contentId}/visibility` endpoint 구현. 본인 소유 검증 + custom-prompt 차단 + 공개/비공개 전환 atomic 업데이트.

## Specification

### Endpoint
- `PATCH /v2/me/contents/:contentId/visibility`
- Auth: LibUserGuard (wrtn-user-id header)
- Request body: `{ isPublished: boolean }`
- Response: 업데이트된 `ContentSummary` (api-contract.yaml 참조 — likeCount/liked/regenerateCount 포함)

### Authorization
- Content.userId 와 caller userId 일치 확인. 불일치 → 403.
- Soft-deleted (`deletedAt != null`) 콘텐츠 → 404.

### Business Rules
- Custom-prompt 콘텐츠 식별: `isCustomPrompt` 플래그 또는 컬렉션 구분. CustomPromptContent 는 공개 불가.
  - `isPublished=true` 요청 시 `409 { errorCode: "CUSTOM_PROMPT_PUBLISH_BLOCKED" }`.
- 이미 같은 상태인 토글 (멱등): 200 + 현재 상태 반환 (추가 DB 쓰기 없어도 OK).
- 공개→비공개 전환 시, 이미 지급된 페이백 크레딧은 회수하지 않는다 (비즈니스 룰 §페이백 6).
  - 즉, visibility toggle 은 payback 에 관여하지 않는다.

### Regeneration Count Seed
- 기존 `Content` 문서에 `regenerateCount: number` 필드가 없을 수 있음. 스키마 레벨에서 default=`0` 보장.
- 본 태스크는 세팅만. 증가 로직은 be-002 에서.

### Validation
- `isPublished` 필수. boolean 타입. 다른 값 → 400.
- contentId path 파라미터 ObjectId 유효성.

### Out of Scope
- 페이백 트리거 로직 (be-003 소관).
- Likes 도메인 (be-004 소관).

## Acceptance Criteria

- [ ] `PATCH /v2/me/contents/:contentId/visibility` 엔드포인트 구현. Swagger 문서화.
- [ ] 본인 소유 검증: 타 유저 콘텐츠에 토글 시도 → 403.
- [ ] Custom-prompt 콘텐츠를 `isPublished=true` 로 요청 → 409 `CUSTOM_PROMPT_PUBLISH_BLOCKED`.
- [ ] 정상 토글 (public ↔ private) 시 200 + 갱신된 ContentSummary 반환.
- [ ] 멱등 동작 (같은 상태 재요청 시 200).
- [ ] Soft-deleted 콘텐츠 → 404.
- [ ] 단위 테스트: service layer 의 각 분기 (authorized/unauthorized, custom-prompt block, not-found, idempotent).
- [ ] e2e 테스트: `apps/meme-api/e2e/` 에 `me-contents-visibility.e2e-spec.ts` 추가.
  - nx 실행 확인 필수: `nx test meme-api-e2e --listTests | grep me-contents-visibility` → 포함 (rubric C11).
- [ ] `npm run lint` / `npm run typecheck` 신규 에러 0.

## Implementation Hints

- 기존 `UpdateContentRequestDto` (`application/content/dto/update-content-request.dto.ts`) 와 충돌하지 않도록 별도 DTO (`UpdateContentVisibilityRequestDto`) 신설 권장.
- Domain service 에 `updateVisibility(userId, contentId, isPublished)` method 추가. authorization + custom-prompt check 포함.
- Repository 에는 `findByIdAndOwner(contentId, userId)` 헬퍼 검토 (기존 패턴 재사용).
- Custom-prompt 판정: `CustomPromptContent` 별도 컬렉션이면 contentId 로 resolve 시도 후 존재 여부 판정. 또는 Content 스키마의 구분 필드 (`type` / `source`) 가 있으면 활용.
- Swagger: `@ApiOperation`, `@ApiResponse`, `@ApiBody` decorator 부착.
