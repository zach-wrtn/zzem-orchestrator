# Sprint Contract: Group 001 — Follow

> Sprint Lead 초안. Evaluator 리뷰 대상. 합의 후 구현 시작.

## Scope

- **Sprint**: ugc-platform-003 (follow-up of ugc-platform-002)
- **Tasks**:
  - `be-001`: Follow 도메인 + endpoints (follow/unfollow, followers/following list, follow-state) + FollowCreatedEvent emit
  - `app-001`: FollowButton (3-state) on other-user profile + optimistic mutation
  - `app-002`: FollowerList + FollowingList screens (본인만 리스트 진입) + ProfileCountRow tap 연결
- **API Endpoints** (api-contract.yaml):
  - POST / DELETE `/v2/users/{userId}/follows`
  - GET `/v2/me/followers`
  - GET `/v2/me/following`
  - GET `/v2/users/{userId}/follow-state`

## Cross-group Integration

- **Group 002 (Block)** 가 본 그룹의 `rollbackFollowByPair(a, b)` helper 를 호출하여 차단 시 팔로우 양방향 해제. 본 그룹 be-001 은 해당 helper 를 **public export** 로 노출.
- **Group 003 (Notification)** 가 `FollowCreatedEvent` 를 consume. be-001 은 이벤트 payload 에 `{actorUserId, targetUserId, shouldNotify: boolean}` 포함 (persona target 시 shouldNotify=false).

## Done Criteria

### be-001 (Backend — Follow domain)

- [ ] UserFollow mongoose schema 생성: `{userId, targetUserId, createdAt}`. Unique index `{userId, targetUserId}`.
- [ ] Indexes: `{targetUserId: 1, createdAt: -1, _id: -1}` (followers query), `{userId: 1, createdAt: -1, _id: -1}` (following query — createdAt 역순). 가나다순 요구 시 application-level sort 또는 별도 index (UserProfile.nickname 조인 필요 — follow list mapping 시 결정).
- [ ] POST /v2/users/{userId}/follows: idempotent, self-follow 400 `SELF_FOLLOW_FORBIDDEN`, target not found 404, block 관계 시 403 `BLOCKED` (BlockService interface placeholder — be-002 에서 wire-up).
- [ ] DELETE /v2/users/{userId}/follows: idempotent, 404 USER_NOT_FOUND.
- [ ] GET /v2/me/followers: cursor paging (`_id: $lte`), 가나다순 정렬 (nickname ASC + _id ASC), 차단된 유저 제외 (Block filter placeholder).
- [ ] GET /v2/me/following: 동일.
- [ ] GET /v2/users/{userId}/follow-state: NONE/FOLLOWING/FOLLOWED_BY/MUTUAL 계산. 차단 관계 시 NONE + isBlocked=true.
- [ ] FollowCreatedEvent emit: follow 생성 성공 시 EventEmitter2 로 EVENT_TYPE.FOLLOW_CREATED emit. Persona target 시 shouldNotify=false.
- [ ] `rollbackFollowByPair(userA, userB)` helper 를 FollowDomainService 에 public 노출 — Group 002 be-002 가 호출.
- [ ] Nx unit + integration test 추가. `nx test meme-api --listTests | grep follow` 포함.

### app-001 (App — FollowButton)

- [ ] FollowButton 컴포넌트: 타 유저 프로필에서만 렌더 (본인 프로필 안 보임). 3 state text — "팔로우" (NONE/FOLLOWED_BY), "팔로잉" (FOLLOWING), "맞팔로우" (MUTUAL).
- [ ] React Query mutation: POST/DELETE `/v2/users/{userId}/follows` + optimistic update. Query key `['follow-state', userId]`.
- [ ] 403 BLOCKED 응답 시 FollowButton 언마운트 + user-profile invalidate (BlockedStateBanner 는 app-003 담당 — 본 태스크는 invalidate 만).
- [ ] UserPublicProfile `isBlocked=true` 시 FollowButton 렌더 skip.
- [ ] ProfileActionButtons 재사용 패턴. Button size/radius 는 기존 regular-button 토큰 준수.

### app-002 (App — Follower/Following List screens)

- [ ] FollowerListScreen + FollowingListScreen 생성. 본인 프로필에서만 진입. 타 유저 프로필 ProfileCountRow tap 무효 (숫자만 표시, AC 6.2).
- [ ] RootNavigator 에 `FollowerList`, `FollowingList` Stack.Screen 등록. link-screens 에 zzem://follower-list / following-list 매핑.
- [ ] List 항목: avatar + nickname + FollowButton inline state.
- [ ] useInfiniteQuery cursor paging, onEndReached → next page.
- [ ] Empty state: "아직 팔로워가 없어요" / "아직 팔로잉이 없어요".
- [ ] ProfileCountRow tap handler (본인 프로필 context 에서만 inject) — Phase 1 ProfileCountRow backward-compatible 확장.

## Verification Method

| Criterion | 검증 방법 |
|-----------|----------|
| UserFollow schema + indexes | `rg '@Schema' backend/apps/meme-api/src/persistence/user-follow` + index spec inspect |
| POST idempotent | Integration test: 동일 pair 2회 요청 → 단일 document, 양쪽 200 응답 |
| 403 BLOCKED stub | BlockService interface DI → test mock 이 block=true 반환 시 403 |
| FollowState 계산 | Unit test 4 상태 × 양방향 trace (caller→target, target→caller) |
| FollowCreatedEvent emit | EventEmitter2 mock 으로 emit 호출 검증 (persona → shouldNotify=false) |
| FE optimistic + rollback | React Query mutation onMutate / onError trace — network stub 으로 실패 시 state 복원 |
| Cursor paging | Nx integration: seed 3 following → limit=2 → page 2 list.length=1 |
| FollowButton 타 유저 only | 본인 프로필 context 에서 렌더 skip — component test |
| ProfileCountRow tap 본인만 | 본인 prop 주입 시 tap handler, 타 유저 prop 시 undefined — snapshot test |
| E2E flow 파일 | `apps/MemeApp/e2e/flows/follow-button-tap.yaml` 존재 + appId/deeplink/assertVisible 구조 grep |

### Default Verification Gates (ugc-platform-002 lessons 반영)

- [ ] **Mapper fallback 금지** (KB: completeness-008):
  - `rg 'userProfile\.id\s*\|\|\s*""|nickname\s*\|\|\s*""|\?\?\s*false|\?\?\s*0' backend/apps/meme-api/src/domain/user-follow backend/apps/meme-api/src/common/dto` → 0 hit
  - `rg 'followState\s*\?\?\s*""|\?\?\s*"NONE"' app/apps/MemeApp/src/presentation` → 0 hit
  - Zod 필수 필드 강제: FollowStateResponse 의 userId/followState/isBlocked 전부 required.
- [ ] **Dead hook/method 금지** (KB: completeness-009):
  - `rg 'rollbackFollowByPair\(' backend/apps/meme-api/src` → ≥ 2 hit (정의 + be-002 에서 사용 예약 확인 — 본 그룹 단독 검증 시 인터페이스 export 여부만 확인, callsite 는 Group 002 에서 보강)
  - `rg 'useFollowState\(|useFollowMutation\(' app/apps/MemeApp/src` → 각 ≥ 2 hit (정의 + callsite)
  - `rg 'FollowCreatedEvent|EVENT_TYPE\.FOLLOW_CREATED' backend/apps/meme-api/src` → ≥ 3 hit (enum + emitter + shouldNotify check)
- [ ] **Cross-component 전수** (KB: completeness-010):
  - ProfileCountRow 확장 backward-compat 검증: 기존 타 유저 프로필 call site (profile.screen.tsx 타 유저 path) tap handler 미전달 유지.
  - UserPublicProfile 응답에 followState + isBlocked 필드 추가 → 본 그룹 에서는 `/v2/users/{userId}/profile` 만 확장 (다른 엔드포인트는 Group 002 에서 처리).

### FE typecheck clean

- [ ] `cd app/apps/MemeApp && yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` → 신규 0 hit.

### BE cursor 규약

- [ ] `rg '_id:\s*\{\s*\$lt\s*:' backend/apps/meme-api/src/persistence/user-follow` → 0 hit (KB: correctness-004).

### Nx test 검증

- [ ] `nx test meme-api --listTests | grep -i follow` → 신규 spec 포함.
- [ ] `nx test MemeApp --listTests | grep -i follow` → FE spec 포함 (있는 경우).

## Edge Cases to Test

- Self-follow attempt → 400 SELF_FOLLOW_FORBIDDEN (BE + FE 둘 다 — FE 는 본인 프로필에 버튼 없으므로 BE 측 validation).
- 비기존 target userId → 404 USER_NOT_FOUND.
- Block 관계 존재 (caller→target 또는 target→caller) → 403 BLOCKED. (FE 는 invalidate + FollowButton 언마운트)
- 페르소나 (INTERNAL) target follow → 200 성공, event.shouldNotify=false.
- 상호 팔로우 → FollowState MUTUAL 양쪽.
- FollowerList cursor limit=1 + seed 3 → page 3 까지 정상 순회.
- 타 유저 프로필 ProfileCountRow tap 시 navigate 호출 없음 (noop).
- 본인 프로필 ProfileCountRow tap 시 FollowerList / FollowingList 진입.

## Business Rules to Validate

- AC 6.1: 팔로우 상태 3종 (팔로우/팔로잉/맞팔로우). BE FollowState enum + FE text 매핑 정확.
- AC 6.2: 팔로워/팔로잉 리스트는 본인만. 타 유저 프로필은 숫자만.
- AC 6.3: 피드 추천 부스트 signal — FollowCreatedEvent emit 으로 향후 추천 시스템 consume 가능하게 (본 그룹은 emit 만).
- AC 7.5: 페르소나 follow 가능하나 팔로우 알림 미발송 — event.shouldNotify=false.

## Regression Guard (Phase 1 + 2)

- [ ] ProfileHeader, ProfileCountRow layout 불변 (새 prop 추가 — backward-compat 유지).
- [ ] Phase 2 UserPublicProfile consumer (swipe-feed) 응답 schema 확장 tolerant (Zod 재검증).
- [ ] PaybackEventListener, Like endpoint 동작 회귀 없음 (같은 event bus 공유).
- [ ] 기존 route `zzem://profile/{userId}` 정상 동작 — AUTH_REQUIRED_PATHS 추가만.

## E2E Flows (required)

- `apps/MemeApp/e2e/flows/follow-button-tap.yaml` — zzem://profile/{seedUserId} → FollowButton assertVisible → tap → "팔로잉" assertVisible. Seed: fetch-seed-follow-target.mjs 필요.
- `apps/MemeApp/e2e/flows/my-profile-follower-list.yaml` — zzem://follower-list → seed nickname assertVisible. Seed: fetch-seed-follower-list.mjs.
- `apps/MemeApp/e2e/flows/my-profile-following-list.yaml` — zzem://following-list → seed nickname assertVisible.

## Sign-off

- Sprint Lead draft: 2026-04-23
- Self-reviewed against: KB patterns completeness-008/009/010, correctness-004, integration-002, storage primitive, E2E structure + ugc-platform-002 Lessons for Next Group (Group 003 first-try PASS 요인 반영)
- Sign-off: 2026-04-23 (Sprint Lead 자체 검증, Evaluator round 4.4 에서 본검증)
