# be-002 · 재생성 추적 (sourceContentId + regenerateCount)

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: be-001 (visibility toggle 의 Content schema 변경과 간접 연관)

## Target

`backend/apps/meme-api/src/` 내:
- `persistence/content/content.schema.ts` (+ `custom-prompt-content.schema.ts`)
- `application/content/dto/` 및 `application/custom-prompt/dto/` (생성 요청 DTO 확장)
- `domain/content/content-domain.service.ts`
- 기존 generate 훅 / service (content generation 입구)
- 관련 e2e

## Context

Phase 2 는 세로 스와이프 CTA "템플릿 사용하기" 경유 재생성에 대해서만 페이백을 지급한다 (AC 1.2). 홈에서 직접 필터 선택 → 생성은 재생성으로 카운트되지 않는다. 따라서 FE 가 "재생성 경유" 신호를 BE 에 전달해야 하며, 이는 생성 요청 body 의 `sourceContentId` 필드로 구현한다.

현재 `CreateCustomPromptRequest` / 일반 콘텐츠 생성 요청 DTO 모두 `sourceContentId` 필드 부재. `regenerateCount` 필드는 profile response 에서 hardcoded 0 (Phase 1 placeholder). 스키마에도 없음.

## Objective

- 콘텐츠 생성 요청에 optional `sourceContentId` 추가.
- Content / CustomPromptContent 스키마에 `sourceContentId?: ObjectId` + `regenerateCount: number` 필드 추가.
- 생성 완료 시 원본의 `regenerateCount` +1 (체인 직전 1단계만).
- 원본 유효성 검증 (공개 상태, 삭제 여부).

## Specification

### Schema (Content + CustomPromptContent)
- `sourceContentId?: ObjectId | null` — default `null`. Phase 1 legacy 문서도 null 로 인식 가능하도록.
- `regenerateCount: number` — default `0`. 인덱스는 추가하지 않음 (정렬/필터 용도 없음).

### Create DTO 확장
- 본 스프린트에서 다루는 두 계열 모두:
  - 일반 생성 (필터 기반) — 기존 `CreateContentRequestDto` 또는 동급
  - 커스텀 프롬프트 — `CreateCustomPromptRequest`
- 각 DTO 에 `sourceContentId?: string (ObjectId format)` optional 필드 추가.

### Validation (생성 시점)
- `sourceContentId` 가 존재할 때:
  - 해당 콘텐츠 조회. 존재하지 않으면 `400 { errorCode: "SOURCE_CONTENT_DELETED" }`.
  - soft-deleted → 동일 `SOURCE_CONTENT_DELETED`.
  - `isPublished=false` → `400 { errorCode: "SOURCE_CONTENT_NOT_PUBLIC" }`.
  - 이 검증은 **크레딧 차감 전**에 수행 (차감 후 실패하면 롤백 복잡성 증가).

### Regenerate Count Increment
- 생성 완료 이벤트 (기존 ContentGeneration 파이프라인의 completion hook) 에서:
  - `sourceContentId != null` 이면 해당 원본 콘텐츠에 `$inc: { regenerateCount: 1 }`.
  - 직전 1단계만: 신규 생성물의 `sourceContentId` 는 전달받은 id 그대로 기록. 원본이 자체 sourceContentId 를 갖고 있어도 transitive 추적 없음.
- Persona 제외 규칙은 본 태스크의 scope 아님 (be-003 페이백 로직에만 해당). `regenerateCount` 는 모든 재생성에 대해 증가.

### Profile Response Wiring
- `MyProfileResponseDto.regeneratedCount` 를 hardcoded 0 에서 **caller 가 소유한 모든 콘텐츠의 `regenerateCount` 합산** 으로 전환.
- `PublicProfileResponseDto.regeneratedCount` 도 동일. 타유저 프로필에서도 노출.
- 대량 유저의 경우 N+1 우려 — aggregate pipeline (group/sum) 권장. 초기에는 userId 인덱스 활용해 단일 query.

### Out of Scope
- 페이백 트리거 (be-003).
- Credit history row (be-003).

## Acceptance Criteria

- [ ] Content / CustomPromptContent 스키마에 `sourceContentId`, `regenerateCount` 필드 추가 (default 정확).
- [ ] 생성 요청 DTO (일반 + custom-prompt) 에 `sourceContentId?` 추가. Swagger 반영.
- [ ] `sourceContentId` 가 비공개/삭제된 콘텐츠일 때 400 + 정확한 `errorCode` 반환.
- [ ] 재생성 완료 시 원본의 `regenerateCount` 정확히 +1 (단일 원본에 대해).
- [ ] 체인 transitive 없음: A(src=null) → B(src=A) → C(src=B) 에서 C 생성 시 A.regenerateCount 변화 없음.
- [ ] `MyProfileResponse.regeneratedCount` 가 실제 소유 콘텐츠 합산으로 반환 (테스트 seed 로 검증).
- [ ] `PublicProfileResponse.regeneratedCount` 동일 로직.
- [ ] e2e 테스트 추가. nx 실행 목록에 포함 (`nx test meme-api-e2e --listTests | grep regenerate`) — rubric C11.
- [ ] lint / typecheck 신규 에러 0.

## Implementation Hints

- 기존 ContentGeneration 파이프라인의 완료 시점 훅 (event listener / domain service hook) 탐색 후 그 위치에 증가 로직 삽입.
- 원본 조회 는 MongoDB 단일 `findOne({ _id, deletedAt: null })` — overhead 크지 않음.
- Profile aggregation: `db.contents.aggregate([{ $match: { userId, deletedAt: null } }, { $group: { _id: null, total: { $sum: "$regenerateCount" } } }])` 패턴. UserProfileDomainService 에서 호출.
- Custom-prompt 결과물도 재생성 가능 (편집하기 CTA 로 진입) — sourceContentId 로 원본 참조하나 **페이백 대상은 아님** (be-003 에서 필터). 본 태스크는 tracking 만.
