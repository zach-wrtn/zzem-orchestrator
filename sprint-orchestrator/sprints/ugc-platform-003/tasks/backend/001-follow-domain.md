# be-001 · Follow 도메인 (POST/DELETE follows + follower·following list + follow-state)

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: none
- **Task ID**: be-001

## Target

`backend/apps/meme-api/src/` 내 신규 생성:
- `domain/user-follow/` — `user-follow-domain.service.ts`, `user-follow-app.service.ts`, `user-follow.module.ts`
- `persistence/user-follow/` — `user-follow.schema.ts`, `user-follow.repository.ts`
- `controller/user-follow/` — `user-follow.controller.ts` (`/v2/users/:userId/follows`, `/v2/me/followers`, `/v2/me/following`, `/v2/users/:userId/follow-state`)
- `common/constant/event-constant.ts` — `EVENT_TYPE.FOLLOW_CREATED` 추가
- `application/user-follow/` — `FollowCreatedEvent` payload DTO
- 관련 e2e spec

## Context

PRD US6 (AC 6.1, 6.2, 6.3) — 타 유저 팔로우/언팔로우, 팔로워/팔로잉 리스트, follow-state 계산. 본 태스크는 Follow 도메인 기반을 만들되, Group 002 의 Block 도메인과는 **interface-level 분리** 를 유지한다 (be-002 의 block 상태가 follow 흐름에 side-effect 를 주므로 Block Service 인터페이스 placeholder 를 주입해두고, Group 002 에서 실제 구현과 wire-up).

Group 003 의 Notification Listener 가 `FollowCreatedEvent` 를 consume 할 예정이므로, 본 태스크는 event emit 까지만 수행하고 notification persistence 는 범위 외.

**API Contract SSOT**: `sprint-orchestrator/sprints/ugc-platform-003/contracts/api-contract.yaml` — `/v2/users/{userId}/follows`, `/v2/me/followers`, `/v2/me/following`, `/v2/users/{userId}/follow-state`, `FollowStateResponse`, `FollowUserItem`, `FollowUserListResponse`, `UserPublicSummary`, `CursorResponse`.

## Objective

Follow 도메인의 persistence/도메인 서비스/HTTP controller 를 구현하여 컨트랙트의 4개 엔드포인트를 만족하고, `FollowCreatedEvent` 를 emit 한다. Block 연동은 interface placeholder 로 stub 처리한다.

## Specification

### 스키마 — `UserFollow`

- 필드: `userId: string` (follower), `targetUserId: string` (followee), `createdAt: Date` (BaseSchema 제공), `_id` (BaseSchema 제공).
- `BaseSchema` (`common/persistence/base.schema.ts`) 상속. `createdAt`, `updatedAt`, `deletedAt` 규약 준수.
- 인덱스:
  - Compound unique: `{ userId: 1, targetUserId: 1 }` (+ `partialFilterExpression: { deletedAt: null }` — soft-delete 호환, `like.schema.ts` 패턴 재사용).
  - followers 조회용: `{ targetUserId: 1, createdAt: -1, _id: -1 }`.
  - following 조회용 (nickname ASC 가 요구되나 nickname 은 UserProfile 측에 위치 → 정렬 전략은 아래 "Cursor Pagination" 절 참조): `{ userId: 1, _id: 1 }` 기본 + 필요 시 aggregate lookup 에서 nickname sort.

### 컨트롤러 + 라우팅

- `POST /v2/users/:userId/follows` → `followUser(caller, targetUserId) → FollowStateResponse` (idempotent).
- `DELETE /v2/users/:userId/follows` → `unfollowUser(caller, targetUserId) → FollowStateResponse` (idempotent).
- `GET /v2/me/followers?cursor&limit` → `listMyFollowers(caller, cursor, limit) → FollowUserListResponse`.
- `GET /v2/me/following?cursor&limit` → `listMyFollowing(caller, cursor, limit) → FollowUserListResponse`.
- `GET /v2/users/:userId/follow-state` → `getFollowState(caller, targetUserId) → FollowStateResponse`.

### 비즈니스 룰

- **Self-follow 금지**: `caller === targetUserId` → 400 `SELF_FOLLOW_FORBIDDEN`.
- **Blocked**: Block Service interface 주입. 본 태스크에서는 stub impl (항상 `isBlocked=false` 반환). Group 002 에서 실제 impl 로 교체. interface contract:
  ```
  interface UserBlockQuery {
    isBlockedEitherDirection(userA: string, userB: string): Promise<boolean>;
  }
  ```
- **USER_NOT_FOUND**: target UserProfile 존재 확인 → 없으면 404.
- **페르소나 허용**: `UserProfile.type === USER_PROFILE_TYPE.INTERNAL` 인 target 도 follow 가능. 단, `FollowCreatedEvent` payload 에 `shouldNotify: false` 플래그 포함 (Group 003 listener 가 skip).
- **Idempotent**:
  - `POST` — 이미 active 한 `UserFollow` 존재 시 레코드 생성하지 않고 200 + 현재 state 반환.
  - `DELETE` — 존재하지 않거나 이미 soft-delete 된 경우 200 + NONE/FOLLOWED_BY 반환.

### Follow State 계산

`getFollowState(caller, target) → { userId: target, followState, isBlocked }`:
- `isBlocked = await UserBlockQuery.isBlockedEitherDirection(caller, target)`.
- `isBlocked === true` → `{ followState: 'NONE', isBlocked: true }`.
- 그렇지 않으면 양방향 조회:
  - `ab = UserFollow.exists({ userId: caller, targetUserId: target, deletedAt: null })`
  - `ba = UserFollow.exists({ userId: target, targetUserId: caller, deletedAt: null })`
  - `(ab, ba) → followState`: (F, F)=NONE, (T, F)=FOLLOWING, (F, T)=FOLLOWED_BY, (T, T)=MUTUAL.
- 단일 쿼리 (`$or` + aggregation) 로 RTT 최소화 권장.

### 이벤트

- `EVENT_TYPE.FOLLOW_CREATED` enum 추가 (`common/constant/event-constant.ts`).
- `FollowCreatedEvent` payload:
  ```
  {
    actorUserId: string;     // caller
    targetUserId: string;    // followee
    followId: string;        // UserFollow._id
    shouldNotify: boolean;   // target.type === INTERNAL 이면 false
    createdAt: Date;
  }
  ```
- Emit 지점: `POST /v2/users/:userId/follows` 의 도메인 서비스 **신규 레코드 생성 성공 시** (idempotent 재호출 시 emit 금지 — 중복 알림 방지).
- Listener 구현은 본 태스크 범위 외 (Group 003). `@OnEvent(EVENT_TYPE.FOLLOW_CREATED)` 참조 패턴은 `application/generation-cost/generation-cost-event.listener.ts`.

### Cursor Pagination

- Followers list (`/v2/me/followers`) — 정렬: `nickname ASC, _id ASC` (가나다순, AC 6.2).
  - `UserFollow.targetUserId = caller` match → `UserProfile` lookup → `nickname` ASC sort.
  - Aggregation pipeline: `$match → $lookup(UserProfile) → $sort({nickname:1, _id:1}) → $skip/$limit` 대신 cursor 방식.
  - Cursor compound: `{ nickname, _id }`. 쿼리: `{ $or: [{ nickname: { $gt: cursor.nickname } }, { nickname: cursor.nickname, _id: { $gte: cursor.id } }] }`.
  - **$lte / $gte** 사용 (exclusive $lt/$gt 금지 — C10 rubric). Compound cursor 는 tiebreaker 에서 `$gte`, primary 에서 `$gt` 조합이 표준이나 _id tie 는 **$gte** 로 처리 (중복 방지는 `skip(1)` 로 해결).
  - 실제 구현은 `like.repository.ts` 의 `findMyLikesWithCursor` compound cursor 패턴을 **그대로 재사용**.
- Following list (`/v2/me/following`) — 위와 대칭 (userId = caller match).
- 차단된 관계 (`isBlockedEitherDirection`) 유저는 리스트에서 제외. 본 태스크에서는 Block stub 반환값이 항상 false 이므로 필터 로직 코드 경로만 삽입 (Group 002 에서 실제 필터 동작).

### 응답 매핑

- `FollowUserItem`: `UserPublicSummary` + `followState` (각 항목의 caller→target 기준).
  - N+1 방지: 리스트 후 `followState` 를 bulk 조회 (`UserFollow.find({ userId: caller, targetUserId: { $in: ids } })` 와 역방향 `UserFollow.find({ targetUserId: caller, userId: { $in: ids } })`).
- **Mapper fallback 금지**: `nickname`, `userId`, `followState`, `isBlocked` 는 Zod required. `userProfile.id || ""` 류 금지 (C08 rubric).

## Acceptance Criteria

- [ ] `POST /v2/users/:userId/follows` — 정상 200 + `FollowStateResponse` (followState=FOLLOWING 또는 MUTUAL).
- [ ] `POST` self-follow → 400 `SELF_FOLLOW_FORBIDDEN`.
- [ ] `POST` 이미 팔로우 중 → 200 + 동일 state. `UserFollow` collection count 증가 0. `FollowCreatedEvent` emit 0회.
- [ ] `POST` 신규 생성 시 `FollowCreatedEvent` 정확히 1회 emit. payload 에 `actorUserId`, `targetUserId`, `followId`, `shouldNotify`, `createdAt` 포함.
- [ ] 페르소나 target (`UserProfile.type === INTERNAL`) → follow 성공 + event emit, 단 `shouldNotify=false`.
- [ ] `POST`/`DELETE` — target 미존재 → 404 `USER_NOT_FOUND`.
- [ ] `DELETE` idempotent — 미follow 상태에서 호출 시 200 + NONE/FOLLOWED_BY.
- [ ] `DELETE` 재호출 시 soft-delete 적용 확인 (`deletedAt != null`). 동일 (userId, targetUserId) 로 재 follow 가능 (compound unique partialFilterExpression 동작).
- [ ] `GET /v2/me/followers` — 가나다순 (nickname ASC) 정렬 + cursor pagination 정상 동작. 1페이지 20개 default, `limit` param 동작.
- [ ] `GET /v2/me/following` — 동일.
- [ ] `GET /v2/users/:userId/follow-state` — (NONE, FOLLOWING, FOLLOWED_BY, MUTUAL) 4가지 케이스 seed 후 각각 검증.
- [ ] Block Service interface stub 주입 확인 — `UserBlockQuery.isBlockedEitherDirection` 호출 지점 존재. Group 002 에서 실제 impl 교체 가능한 DI wiring (module provider token).
- [ ] **grep 게이트 (Mapper fallback 금지, C08)**: `rg 'followState\s*\?\?\s*|isBlocked\s*\?\?\s*false|userProfile\.id\s*\|\|\s*""' apps/meme-api/src/domain/user-follow apps/meme-api/src/persistence/user-follow apps/meme-api/src/controller/user-follow` → 0 hit.
- [ ] **grep 게이트 (Cursor $lt 금지, C10)**: `rg '_id:\s*\{\s*\$lt\s*:' apps/meme-api/src/persistence/user-follow` → 0 hit.
- [ ] **grep 게이트 (Dead hook/method, C09)**: 신규 서비스 method (`followUser`, `unfollowUser`, `listMyFollowers`, `listMyFollowing`, `getFollowState`) 각각 `rg '<name>\(' apps/meme-api/src` → ≥ 2 hit (정의 + 컨트롤러 callsite).
- [ ] **신규 필드/상태 적용 범위 전수 (C10)**: `FollowCreatedEvent` consumer 는 Group 003 listener 만 (본 태스크 범위 밖). 본 태스크에서 `FollowCreatedEvent` 참조 위치: (1) EVENT_TYPE enum, (2) event payload DTO 정의, (3) `user-follow-app.service.ts` emit 호출. 이 3 곳 외 추가 참조 금지.
- [ ] e2e 테스트: follow → follow-state=FOLLOWING, 쌍방 follow → MUTUAL, unfollow → NONE, 페르소나 follow → event emit w/ shouldNotify=false. nx listTests 포함.
- [ ] `nx run meme-api:lint` / `nx run meme-api:typecheck` / `nx run meme-api:test` 신규 에러 0.
- [ ] **Regression**: ugc-platform-001 (profile, nav) + ugc-platform-002 (feed interaction, payback, like) 기능 회귀 없음. 변경된 공유 컴포넌트는 전수 나열:
  - `common/constant/event-constant.ts` (enum 값 추가만, 기존 값 불변).
  - `common/persistence/base.schema.ts` 변경 없음.
  - UserProfile / Content / Credit 도메인 schema·controller 변경 없음.

## Implementation Hints

- **Compound cursor 구현**: `persistence/like/like.repository.ts` 의 `findMyLikesWithCursor` 를 정확한 참조로 삼고 구조를 그대로 복제 (base64 cursor encode/decode + `$or` 조합).
- **Soft-delete + unique 인덱스**: `persistence/like/like.schema.ts` 의 `partialFilterExpression: { deletedAt: null }` 패턴 재사용.
- **Cursor DTO**: `common/dto/cursor-request.dto.ts`, `cursor-response.dto.ts` 재사용.
- **페르소나 판정**: `domain/user-profile/user-profile-domain.service.ts` 의 type 체크 헬퍼 재사용. 상수는 `common/constant/user-profile.constant.ts::USER_PROFILE_TYPE.INTERNAL`.
- **이벤트**: `EventEmitter2` + `@OnEvent(EVENT_TYPE.FOLLOW_CREATED)` 패턴. 기존 `application/generation-cost/generation-cost-event.listener.ts` 와 동일 스타일.
- **Block interface placeholder**: NestJS DI token (`const USER_BLOCK_QUERY = Symbol('USER_BLOCK_QUERY')`) + stub provider. 본 태스크는 stub, Group 002 에서 실제 impl 로 override.
- **N+1 방지**: follow-state bulk 조회 시 Map 으로 id→state resolve.
- **$lte rule (C10)**: cursor tiebreaker 에서 `{_id: { $gte: cursorId }}` 로 작성. `$lt` 는 금지.
- **Mapper fallback (C08)**: Zod schema 로 response shape 강제, `.parse()` 사용. nullable 필드 (예: `profileImageUrl`) 는 `z.string().nullable()` 로 명시.

## Out of Scope

- Block 도메인 실제 구현 (be-002).
- Notification persistence / push 발송 (Group 003).
- 추천 시스템 signal emit 이외의 가중치 로직 (AC 6.3 backend 측은 signal 까지만, 추천 팀 담당).
- 페이백/크레딧 관련 변경.
- i18n / 다국어 카피.

## Regression Guard

- `common/constant/event-constant.ts` — enum **값 추가만**, 기존 값 순서·철자·숫자 보존.
- `BaseSchema`, `UserProfile`, `Content`, `Credit`, `Like` 도메인 schema 변경 금지.
- 기존 Like/Profile/Credit controller path 변경 금지.
- Regression AC: ugc-platform-001/002 의 e2e (my-profile, other-user-profile, like, payback) 전원 green 유지. CI 에서 `nx affected:test` 로 미회귀 증명.
