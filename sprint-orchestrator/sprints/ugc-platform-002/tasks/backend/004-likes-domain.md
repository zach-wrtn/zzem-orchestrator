# be-004 · 좋아요 도메인 (toggle + 카운트 + 내가 좋아요한 콘텐츠)

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: —

## Target

`backend/apps/meme-api/src/` 내:
- `domain/like/` (신규)
- `persistence/like/` (신규 — Like schema + repository)
- `application/like/` (app service)
- `controller/content/` 또는 별도 `controller/like/` (endpoint)
- `application/me-contents/me-contents-app.service.ts` (VISIBILITY.LIKED placeholder 실제 로직으로 전환)
- `application/me-contents/dto/` (ContentSummary 확장)
- 관련 e2e

## Context

Phase 1 은 `/v2/me/contents?visibility=liked` 를 empty placeholder 로 두고 닫아놨다 (`me-contents-app.service.ts:26–28`). `REACTION.LIKE` enum 은 있지만 content-level feedback 용이며, UGC 좋아요 리스트와 무관. `Like` 도메인은 완전 신규.

FE 측 `useToggleFavoriteUseCase()` (domain/favorite) 는 기존 endpoint 에 바인딩되어 있으므로, 신규 API 에 맞춰 재배선 혹은 기존 endpoint 의 signature 를 확장할 수 있다. 본 태스크는 **endpoint 신설** 을 기본으로 하고, FE 측 전환은 app-005 에서 담당.

## Objective

`Like` 도메인 신설 + toggle endpoint + 내가 좋아요한 콘텐츠 리스트 조회. 각 콘텐츠 응답 DTO 에 `likeCount`, `liked` 필드 포함.

## Specification

### Schema — `Like`
- Collection: `likes`
- Fields:
  - `_id: ObjectId`
  - `userId: string` (좋아요 누른 사용자 id)
  - `contentId: ObjectId` (Content 또는 CustomPromptContent)
  - `contentType: 'filter' | 'custom-prompt'` — 혼합 피드에서 discriminator
  - `createdAt: Date`
  - `deletedAt: Date | null` (soft delete; 취소 시 soft-delete 또는 hard-delete 중 선택 — **hard-delete 권장**: 좋아요/취소 반복은 흔하고 이력 의미 낮음)
- Unique compound index: `{ userId, contentId, deletedAt: null }` (중복 방지).

### Endpoint 1 — 좋아요 추가
- `POST /v2/contents/:contentId/likes`
- Auth: LibUserGuard.
- Response: `LikeToggleResponse` (`contentId`, `liked: boolean`, `likeCount: number`).
- 이미 좋아요 상태: 200 + 현재 상태 반환 (멱등).
- 콘텐츠 없음: 404.
- Self-like 허용 (AC 3.1).

### Endpoint 2 — 좋아요 취소
- `DELETE /v2/contents/:contentId/likes`
- 좋아요 안 한 상태에서 호출: 200 + `liked: false` 반환 (멱등).

### Endpoint 3 — 좋아요 카운트 노출
- 별도 endpoint 없이 기존 `ContentSummary` / `ContentListResponse` 에 `likeCount` + `liked` 포함 (api-contract.yaml).
- 추천 피드, 프로필 피드, 타유저 피드 등 모든 피드 엔드포인트 응답에 포함.
- 축약 없음 — 실제 숫자 (AC 3.3).

### `/v2/me/contents?visibility=liked` 활성화
- 현재 empty placeholder 제거.
- 쿼리:
  ```
  Like 컬렉션에서 { userId: caller } + deletedAt: null → contentId 리스트 + liked_at(=createdAt)
  sort by liked_at DESC
  cursor: base64(liked_at + _id)  — 동일 timestamp 대비 _id 2차 정렬
  ```
- Repository 커서 쿼리: `_id: { $lte: cursorId }` **필수** (correctness-004, rubric C10).
- Content / CustomPromptContent 조회는 batch lookup (contentId 리스트 → `$in` query).
- Soft-deleted 콘텐츠 또는 비공개 전환된 타유저 콘텐츠는 응답에서 제외. Like 는 유지 (history 의미) 하되 리스트에 안 보임.
- Content 조회 결과에 `liked: true` 강제 (본 caller 가 당연히 좋아요한 상태).

### `/v2/me/contents/counts` liked 값 활성화
- 기존 hardcoded 0 → `Like` 컬렉션의 caller userId 기준 count. soft-delete / 비공개 / 삭제 콘텐츠 제외.

### Recommendation Signal
- 좋아요 이벤트 → 추천 시스템 시그널 전달 (AC 3.3 마지막 줄).
- 기존 pub-sub / event listener 패턴이 있으면 재사용. 없으면 EventBus publish (`like.created`, `like.removed`) 정도만 수행. 실제 추천 시스템 consumer 는 scope 외.

### Out of Scope
- 좋아요 알림 (Phase 3 소관).
- 좋아요 공개 노출 ("이 사람이 좋아했어요") (Phase 3 소관).
- 좋아요 cursor 쿼리 외 다른 sort (최신순만).

## Acceptance Criteria

- [ ] `Like` schema + repository + domain service 신규 추가.
- [ ] Unique index `(userId, contentId, deletedAt)` 존재.
- [ ] `POST /v2/contents/:contentId/likes` — 정상 동작 + 멱등 + 404.
- [ ] `DELETE /v2/contents/:contentId/likes` — 정상 동작 + 멱등.
- [ ] Self-like 성공 + likeCount +1 확인.
- [ ] `ContentSummary` 응답에 `likeCount`, `liked` 모든 경로 (me-contents, users-public, 기존 피드) 포함.
- [ ] `GET /v2/me/contents?visibility=liked` 실제 데이터 반환. cursor pagination with `$lte` (seed 3 like + limit 2 → page 2 list.length=1).
- [ ] `GET /v2/me/contents/counts` liked 가 실제 값.
- [ ] 비공개 전환된 타유저 콘텐츠 — liked 리스트에서 제외 확인.
- [ ] 추천 시스템 이벤트 발행 지점 확인 (unit test: EventBus spy).
- [ ] e2e 테스트 추가. nx listTests 에 포함 확인 (`likes.e2e-spec.ts` 또는 분리).
- [ ] lint / typecheck 신규 에러 0.

## Implementation Hints

- Phase 1 선례: `UserProfile` 신설 패턴 (persistence/repository/domain/application 층 분리). 동일 구조로 `Like` 도메인 구성.
- Content 존재 확인은 `ContentDomainService.findById` / `CustomPromptContentDomainService.findById` union.
- `ContentSummary` 에 `liked` 필드 채우기: batch 로 `Like` 를 조회해 `contentId → boolean` map 생성 후 매핑. N+1 회피.
- `visibility=liked` cursor: Compound 정렬이면 `{ liked_at: -1, _id: -1 }` + cursor `$lte` on both.
- 추천 시스템 시그널: meme-api 내에 기존 Kafka/EventBus 패턴 있으면 follow.
- `filter.repository.ts` 의 `$lte` 사용 패턴을 cursor 쿼리 작성 시 참조.
