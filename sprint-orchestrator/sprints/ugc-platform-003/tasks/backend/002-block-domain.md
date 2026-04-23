# be-002 · 유저 차단 도메인 + Feed/Profile block filter cross-wire

- **Group**: 002
- **Owner**: be-engineer
- **Depends on**: be-001 (UserFollow cleanup helper cross-wire)

## Target

`backend/apps/meme-api/src/` 내:
- 신규 `domain/user-block/` (UserBlockDomainService, BlockRelationService)
- 신규 `persistence/user-block/` (user-block.schema.ts, user-block.repository.ts)
- 신규 `controller/user-block/` (user-block.controller.ts + DTO)
- `domain/user-follow/` — 기존 UserFollow 도메인에 `rollbackFollowByPair(a, b)` helper 연결 (be-001 작업물 재사용). 차단 transaction 내 호출.
- `persistence/content/content.repository.ts` — feed aggregation / profile content aggregation 에 block filter predicate 주입.
- `domain/user-profile/user-profile-domain.service.ts` — `UserPublicProfile` 응답에 `isBlocked` 단방향 필드 추가 + FollowState 차단 시 NONE + isBlocked=true 처리.
- 관련 e2e / integration tests

## Context

AC 7.2 (차단), 7.3 (차단 시 팔로우 양방향 해제), 7.4 (차단 유저 콘텐츠 feed 제외 + 프로필 비노출), 7.6 (차단 해제 — 팔로우 자동 복원 안 함).

기존 `domain/user-report/` 는 "필터 신고" (광고/이모티콘 등 reason-enum 기반) 이며, 본 태스크의 UserBlock 과 무관. 혼동 방지를 위해 별도 도메인 `user-block` 으로 신규 생성.

Phase 2 에서 이미 feed/profile/like 엔드포인트가 구축되어 있으므로, 본 태스크는 "block filter predicate" 를 **전 엔드포인트 전수 반영** 하는 것이 핵심. cross-path cleanup 표준화 (integration-002): 팔로우 양방향 해제는 단일 helper (`rollbackFollowByPair`) 로 일원화.

## Objective

양방향 독립 UserBlock 관계 도입 + 차단 시 즉시 UserFollow 양방향 해제 + feed/profile/likes 전 경로에 block filter AND 병합 적용 + 차단 해제 시 UserFollow 복원 없음.

## Specification

### Schema — UserBlock
- Fields: `userId: ObjectId` (차단한 주체), `blockedUserId: ObjectId` (차단 대상), `createdAt: Date`.
- **Unique compound index**: `{ userId: 1, blockedUserId: 1 }` (동일 pair 중복 차단 방지 — idempotent).
- **List index**: `{ userId: 1, createdAt: -1, _id: -1 }` (GET /v2/me/blocks cursor pagination, correctness-004 준수 `_id: { $lte: cursorId }` 규칙).
- Self-reference 금지: `userId !== blockedUserId` validator (400 SELF_BLOCK_FORBIDDEN).

### Endpoints (from contract SSOT)

#### POST `/v2/users/{userId}/blocks`
- Path param `userId`: 차단 대상 유저 id.
- Caller: 인증된 유저 (= JWT subject).
- Validation: target 존재 확인 (404 USER_NOT_FOUND). self-block 거부 (400 SELF_BLOCK_FORBIDDEN).
- Transaction 내 순차:
  1. `UserBlock.upsert({ userId: callerId, blockedUserId: targetId })` — idempotent. 이미 존재 시 createdAt 갱신 없이 기존 row 유지.
  2. `rollbackFollowByPair(callerId, targetId)` helper 호출 → `UserFollow.deleteMany({ $or: [{ userId: callerId, followedUserId: targetId }, { userId: targetId, followedUserId: callerId }] })`.
  3. (선택) follow counter 감소는 be-001 helper 내부 책임 — 본 태스크는 helper 호출만.
- 응답: 200 OK, body `{ isBlocked: true }`.
- **알림 발송 없음** (AC 7.2 미통지 원칙). UserFollowDeletedEvent 등 이벤트 emit 금지.

#### DELETE `/v2/users/{userId}/blocks`
- `UserBlock.deleteOne({ userId: callerId, blockedUserId: targetId })` — deletedCount 0 이어도 200 (idempotent).
- **UserFollow 복원 안 함** (AC 7.6). 어떤 follow 관련 write 도 수행 금지.
- 응답: 200 OK, body `{ isBlocked: false }`.

#### GET `/v2/me/blocks`
- Cursor pagination: `_id: { $lte: cursorId }` (correctness-004 grep 게이트).
- Sort: `{ createdAt: -1, _id: -1 }`.
- 응답 item: `{ userId, nickname, avatarUrl, blockedAt }`. Join via UserProfile lookup.
- Empty list 허용 (200 + `{ items: [], nextCursor: null }`).

### Cross-path block filter (integration-002 전수 반영)

`BlockRelationService.getBlockedPairs(callerId)` → 두 집합 resolve:
- `blockedByMe`: `UserBlock.find({ userId: callerId }).distinct('blockedUserId')`.
- `blockingMe`: `UserBlock.find({ blockedUserId: callerId }).distinct('userId')`.
- 합집합 = `hiddenUserIds`.

Feed / content 쿼리 predicate: `userId: { $nin: hiddenUserIds }` AND 병합. 양방향 은닉 (내가 차단한 유저 + 나를 차단한 유저 모두 콘텐츠 노출 제외).

**영향 엔드포인트 전수 나열** (cross-component 전수 명시, completeness-010):
1. `/v2/feed` (메인 swipe-feed) — block 필터 AND.
2. `/v2/users/{userId}/contents` (타 유저 콘텐츠 목록) — target 이 hiddenUserIds 에 포함되면 USER_NOT_FOUND-like 응답 불변? → **차단 관계 시 빈 list + 404 아님**. 단, target == blockedByMe 인 경우 FE 는 BlockedProfileState 로 대체 렌더 (app-003 책임).
3. `/v2/me/contents` (본인 콘텐츠) — **제외 대상 아님** (본인 콘텐츠는 block 과 무관, 불변).
4. `/v2/me/likes` (본인이 좋아요한 콘텐츠) — 좋아요 대상 콘텐츠 ownerUserId 가 hiddenUserIds 에 포함되면 item 제외.
5. `/v2/users/{userId}/likes` — 동일 규칙 (liked 콘텐츠 owner block 필터).
6. Phase 2 기존 swipe-feed aggregation 경로 (`content.repository.ts` 내 feed predicate builder) — 단일 진입점이 있다면 해당 지점에 predicate inject. 없다면 각 aggregation pipeline 에 전수 주입.

**"모든 feed" 같은 표현 금지**. 위 6개 경로 명시.

### Profile 응답 — isBlocked 필드

`UserPublicProfile` DTO 에 `isBlocked: boolean` 추가.
- **단방향 의미**: `callerId → targetId` 방향만. (`UserBlock.exists({ userId: callerId, blockedUserId: targetId })`).
- `blockingMe` (나를 차단한 상대) 는 isBlocked 에 반영 안 함 — 대신 profile 자체가 USER_NOT_FOUND 로 응답? → **아니오**. FE 는 blockingMe 케이스를 "일반 프로필" 으로 렌더하되 content list 가 비어있는 상태로 나타나야 함 (상대방이 내가 차단당했음을 알 수 없도록). 본 태스크는 isBlocked=false 반환 (단방향), content list 는 block filter 로 빈 값.
- `FollowState`: 차단 관계 존재 시 (caller→target 또는 target→caller) **follow 은 이미 삭제된 상태**이므로 자연스럽게 NONE. 별도 override 불필요. isBlocked=true 플래그만 추가.

### Errors
- 404 `USER_NOT_FOUND` (target 존재 X).
- 400 `SELF_BLOCK_FORBIDDEN` (self-block).
- 401 (미인증) — 기존 auth guard.
- INTERNAL 타입 유저 차단 허용? → PRD 명시 없음. **허용** (페르소나 차단 UX 제한은 FE 측 책임, 본 태스크는 BE 관대 처리).

### Events
- **이벤트 emit 없음**. UserBlockedEvent / UserUnblockedEvent 발행하지 않음 (AC 7.2 미통지). 추천 패널티 등 side effect 는 본 스프린트 범위 외.

## Acceptance Criteria

- [ ] POST `/v2/users/{userId}/blocks`: 신규 차단 생성 + UserFollow 양방향 즉시 삭제 (AC 7.3) — transaction rollback 시 둘 다 원복 검증.
- [ ] 중복 POST: idempotent 200 (unique index 위반 흡수).
- [ ] Self-block: 400 SELF_BLOCK_FORBIDDEN.
- [ ] Target 미존재: 404 USER_NOT_FOUND.
- [ ] DELETE `/v2/users/{userId}/blocks`: 삭제 + **UserFollow 복원 없음** (AC 7.6) — negative test (DELETE 후 UserFollow.find 0 hit).
- [ ] DELETE 존재하지 않는 block: idempotent 200.
- [ ] GET `/v2/me/blocks`: blockedAt DESC + cursor `$lte` (grep `_id:\s*{\s*\$lte:` → hit, `_id:\s*{\s*\$lt:` → 0 hit).
- [ ] Feed block filter: 6개 엔드포인트 전수 회귀 — /v2/feed, /v2/users/{userId}/contents, /v2/me/contents (영향 없음 확인), /v2/me/likes, /v2/users/{userId}/likes, Phase 2 swipe-feed path. 각각 독립 integration test.
- [ ] 양방향 은닉: A 가 B 차단 시, B 의 /v2/feed 에서도 A 콘텐츠 미노출 (nB ← blockingMe 집합 포함).
- [ ] UserPublicProfile.isBlocked 단방향: A→B 차단 시 A 가 B 프로필 조회하면 isBlocked=true. 역방향 (B 가 A 조회) isBlocked=false.
- [ ] Phase 1 profile (AC 1.x) + Phase 2 like/visibility/feed (AC 2.x/3.x) **회귀 없음** — 기존 e2e 그대로 통과.
- [ ] Mapper fallback 금지 (completeness-008): 신규 UserBlock DTO 에 `?? 0 / ?? false / || ""` 0 hit. Zod 필수 필드 강제.
- [ ] Dead hook 금지 (completeness-009): 신규 service 메서드 (`blockUser`, `unblockUser`, `listBlocks`, `rollbackFollowByPair`, `getBlockedPairs`) 각각 호출처 ≥ 2 hit (controller + test).
- [ ] Cross-component 전수 (completeness-010): 위 6개 엔드포인트 명시 — "모든 feed" 표현 금지.
- [ ] Cross-feed block filter test: A 차단 후 B 의 모든 read path (feed/likes/profile contents) 에서 A 콘텐츠 0 hit 검증.
- [ ] lint / typecheck 신규 에러 0.
- [ ] nx listTests 에 신규 테스트 포함 확인.

## Implementation Hints

- 기존 `domain/like/` 구조 템플릿 참고 (domain-service + repository + schema 3-layer).
- `rollbackFollowByPair` helper 는 be-001 에서 이미 생성 예정 (cross-wire). be-001 미완 시 본 태스크 내 stub + TODO 마커, 단 동일 helper 명으로 최종 병합.
- `BlockRelationService.getBlockedPairs` 는 request-scoped cache 권장 (동일 request 내 여러 aggregation 이 호출).
- Feed aggregation 의 predicate inject 는 기존 `buildFeedQuery(callerId)` / `buildUserContentsQuery()` 류 진입점에 옵션 파라미터 추가. 전수 호출처 grep: `rg 'buildFeedQuery|buildUserContentsQuery|aggregateFeed' src/` → 모두 block filter 경유 확인.
- Transaction: MongoDB transaction session 사용. 기존 `likeAtomic` / unlike 패턴 (like.repository.ts) 참조.
- UserProfile INTERNAL 판정: `apps/meme-api/src/domain/user-profile/user-profile-domain.service.ts` 참조 (본 태스크는 INTERNAL 도 차단 허용 — FE 제한).
- Cursor pagination: grep 게이트 `rg '_id:\s*{\s*\$lte' apps/meme-api/src/domain/user-block src/persistence/user-block → ≥ 1 hit`, `rg '_id:\s*{\s*\$lt[^e]' → 0 hit`.

## Out of Scope

- 추천 패널티 (content.repository recommend score) — 별도 태스크.
- 차단 유저의 push notification 억제 (알림 도메인이 block 조회) — 본 태스크는 feed/profile read path 만 다룸.
- 관리자 강제 unblock API.
- Phase 2 swipe-feed 알고리즘 변경 (점수 재계산 등).

## Regression Guard

- Phase 1 AC (프로필 조회/수정): UserPublicProfile DTO 에 isBlocked 필드 추가 외 breaking change 없음. 기존 필드 유지.
- Phase 2 AC 2.x (좋아요): like.repository 변경 없음. `/v2/me/likes` 쿼리에 block filter predicate 추가만 — 기존 like 기록 조회 동작 동일.
- Phase 2 AC 3.x (visibility): isPublished 필터 로직 불변. block filter 는 AND 병합 (기존 필터와 충돌 없음).
- Phase 2 swipe-feed: feed aggregation 의 기존 predicate (isPublished, regenerate 가중치 등) 은 모두 유지. block predicate 는 추가 AND 조건.
- UserFollow 도메인: 기존 follow/unfollow 엔드포인트 동작 불변. helper `rollbackFollowByPair` 는 신규 export — 기존 메서드 signature 변경 금지.
