# be-003 · /v2/me/contents — 가시성 필터 & 카운트

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: be-001 (스키마)

## Target

`backend/apps/meme-api/src/controller/content/`, `application/content/`, `domain/content/`.

## Context

MY 프로필은 3탭(공개/비공개/좋아요)으로 콘텐츠를 구분한다. FE는 진입 시 어느 탭이 디폴트인지 결정하기 위해 카운트가 필요하며(AC 2.1), 각 탭은 커서 기반 무한 스크롤로 로드한다. 기존 `GET /v2/contents` 엔드포인트가 콘텐츠 리스트를 반환하지만 가시성 개념이 없다.

레포 CLAUDE.md 필수 스킬 준수: `cursor-pagination`, `nestjs-architecture`, `testing-patterns`.

## Objective

본인 콘텐츠를 가시성 카테고리(public / private / liked)로 필터링해 제공하는 리스트 엔드포인트와, 탭 배지용 카운트 엔드포인트를 제공한다.

## Specification

### Endpoints (api-contract.yaml SSOT)
- `GET /v2/me/contents?visibility=<Visibility>&cursor&limit` → `ContentListResponse`
- `GET /v2/me/contents/counts` → `ContentCountsResponse`

### Behavior
- `visibility=public`: 본인 + `isPublished=true` + 미삭제. 정렬 `createdAt desc`.
- `visibility=private`: 본인 + `isPublished=false` + 미삭제. 정렬 `createdAt desc`.
- `visibility=liked`: **Phase 1은 항상 빈 결과** (`list: []`, `nextCursor: null`). 좋아요 기능은 Phase 2. 400/501이 아닌 200 + 빈 페이지로 응답.
- 카운트 엔드포인트: 동일 조건으로 `countDocuments`. `liked`는 항상 0.
- 커서 스키마: 기존 `CursorResponseDto` 구조 (`list`, `nextCursor`) 그대로 사용. Controller는 Service 반환값을 **재래핑하지 않는다**.
- `ContentSummary` 필드: id / thumbnailUrl / isPublished / createdAt / status. 썸네일은 기존 content 스키마의 대표 이미지 URL(구현 판단).

### KB Contract Clauses
- correctness-001 (critical): Controller에서 CursorResponseDto 재래핑 금지. Service가 완성해 반환하면 그대로 passthrough. 통합 테스트에서 `nextCursor` 존재 검증 필수.
- correctness-002 (critical): DTO getter 금지.
- integration-001 (critical): 배열 필드는 `list` (기존 convention과 일치).

### Tests
- 단위: Domain Service의 visibility → filter predicate 매핑 케이스별 검증.
- E2E: 공개 2건 + 비공개 3건을 시드한 유저의 응답에서 list 길이 / `isPublished` 필터 / `nextCursor` 유지 검증. Liked 호출 시 빈 리스트.

## Acceptance Criteria

- [ ] `GET /v2/me/contents?visibility=public`이 본인의 `isPublished=true` 콘텐츠만 반환.
- [ ] `visibility=private`이 본인의 `isPublished=false` 콘텐츠만 반환.
- [ ] `visibility=liked` 호출 시 200 + `{ list: [], nextCursor: null }`.
- [ ] Controller에 CursorResponseDto 재래핑 코드 없음(정적 검사 또는 리뷰).
- [ ] `limit=2` + 공개 3건 조건에서 응답 `list.length=2` + `nextCursor != null`. 다음 페이지 조회 시 나머지 1건 + `nextCursor=null`.
- [ ] `GET /v2/me/contents/counts` 응답이 `{ public: N, private: M, liked: 0 }` 구조와 정확히 일치.
- [ ] E2E 테스트 통과. lint/typecheck 신규 에러 0.

## Implementation Hints

- 참조: `backend/apps/meme-api/src/common/dto/cursor-request.dto.ts`, `cursor-response.dto.ts`.
- 참조: `backend/apps/meme-api/src/controller/content/content.controller.ts`의 기존 list 엔드포인트.
- `Visibility` enum은 controller layer에 도입. 도메인 레이어는 필요 최소 predicate만 받도록.
