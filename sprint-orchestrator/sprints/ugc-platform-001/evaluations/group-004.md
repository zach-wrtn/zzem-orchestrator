# Evaluation Report: Group 004 — Follow

**Sprint**: ugc-platform-001
**Evaluator**: Evaluator Agent
**Date**: 2026-03-28
**Verdict**: **PASS**

---

## Summary

21 of 21 Done Criteria PASS. Two post-merge fixes applied: cursor-based pagination (5aa25a2f) and response field rename `list` → `data` (ba0c6a95). All BE/FE contracts now aligned.

---

## Done Criteria Evaluation

### BE — Follow/Unfollow

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-1 | POST /follows → 팔로우 생성 + followStatus + 카운터 반환 | **PASS** | `follow.controller.ts:21-34` — `@Post() @UseGuards(LibUserGuard)`, passes `userId` + `body.targetUserId` to `followAppService.follow()`. `follow-domain.service.ts:16-63` — creates follow, increments both profiles atomically, returns `{ targetUserId, followStatus, followerCount, followingCount }`. `FollowResultResponseDto` matches shape. |
| DC-2 | 자기 자신 팔로우 시 400 | **PASS** | `follow-domain.service.ts:18-20` — `if (followerId === targetUserId) throw new BadRequestException("자기 자신을 팔로우할 수 없습니다.")`. Same check in `unfollow()` at line 68-70. |
| DC-3 | 이미 팔로우 중 → 멱등 반환 | **PASS** | `follow-domain.service.ts:29-37` — `const existing = await this.followRepository.findByFollowerAndFollowee(...)`, if exists, returns current status without creating duplicate. No error thrown. |
| DC-4 | DELETE /follows → 언팔로우 + 멱등 | **PASS** | `follow.controller.ts:36-49` — `@Delete() @UseGuards(LibUserGuard)`. `follow-domain.service.ts:79-88` — `deleteByFollowerAndFollowee` returns null if not found → returns current status without error (idempotent). |
| DC-8 | GET /follows/status/:targetUserId → 4-way followStatus | **PASS** | `follow-domain.service.ts:112-122` — `calculateFollowStatus()` does bidirectional `findByFollowerAndFollowee` via `Promise.all`, returns `"mutual"` / `"following"` / `"follower"` / `"none"`. `follow.controller.ts:75-85` — `@Get("status/:targetUserId")`. `FollowStatusResponseDto` has enum `["none", "following", "follower", "mutual"]`. |
| DC-9 | Atomic $inc/$dec on both profiles | **PASS** | `follow-domain.service.ts:46-47` — `incrementFollowingCount(followerId)` + `incrementFollowerCount(targetUserId)`. `profile.repository.ts:35-38` — `$inc: { followerCount: 1 }`, line 44-47 — `$inc: { followerCount: -1 }`, line 53-56 — `$inc: { followingCount: 1 }`, line 62-65 — `$inc: { followingCount: -1 }`. All use `findOneAndUpdate` with atomic `$inc`. |
| DC-10 | EventEmitter events | **PASS** | `follow-domain.service.ts:50-54` — `this.eventEmitter.emit(EVENT_TYPE.USER_FOLLOWED, { followerId, followeeId: targetUserId, timestamp: new Date() })`. Line 95-99 — `USER_UNFOLLOWED` with same payload shape. `event-constant.ts:15-16` — `USER_FOLLOWED = "user.followed"`, `USER_UNFOLLOWED = "user.unfollowed"`. Matches contract. |
| DC-11 | 페르소나 계정 팔로우 허용 | **PASS** | `follow-domain.service.ts` — no `isPersona` check in `follow()` or `unfollow()`. Any valid profile (persona or not) is followable. |
| DC-12 | 인증 없이 POST /follows → 401 | **PASS** | `follow.controller.ts:22` — `@UseGuards(LibUserGuard)` on POST, line 37 on DELETE, line 53 on GET followers, line 64 on GET followings, line 77 on GET status. All endpoints require auth. |
| DC-13 | 존재하지 않는 targetUserId → 404 | **PASS** | `follow-domain.service.ts:23-26` — `const targetProfile = await this.profileRepository.findByUserId(targetUserId); if (!targetProfile) throw new NotFoundException("유저를 찾을 수 없습니다.")`. Same check in `unfollow()` at line 73-76. |

### BE — Follower/Following Lists

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-5 | GET /follows/me/followers → 가나다순, cursor pagination, followStatus | **PASS** | `follow.controller.ts:51-61` — `@Get("me/followers")` with `FollowListRequestDto` (cursor → base64 decoded offset, limit). `follow.repository.ts:65-110` — `findFollowersWithProfile()` aggregation: `$match` → `$lookup` profiles → `$unwind` → `$sort nickname:1` → `.collation({ locale: "ko" })` → `$skip/$limit`. `follow-domain.service.ts:126-136` — resolves `followStatus` for each item. Response: `{ data, nextCursor }` with base64-encoded offset cursor (fixed in 5aa25a2f + ba0c6a95). |
| DC-6 | GET /follows/me/followings → same | **PASS** | `follow.repository.ts:113-158` — `findFollowingsWithProfile()` identical pattern with followerId/followeeId swapped. `.collation({ locale: "ko" })` confirmed. |
| DC-7 | 각 항목에 userId, nickname, profileImageUrl, followStatus | **PASS** | `follow.repository.ts:98-105` — `$project` outputs `followId, userId, nickname, profileImageUrl, isPersona, createdAt`. `follow-domain.service.ts:151-169` — `resolveFollowStatuses` maps to `IFollowUserItem { userId, nickname, profileImageUrl, isPersona, followStatus }`. `FollowUserItemResponseDto` includes all 5 fields. |

### FE — FollowButton & Toggle

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-14 | FollowButton: status → label/style | **PASS** | `follow-button.tsx:4-12` — `FOLLOW_BUTTON_CONFIG`: `none→"팔로우"(action_primary)`, `following→"팔로잉"(action_secondary)`, `follower→"팔로우"(action_primary)`, `mutual→"맞팔로우"(action_secondary)`. Matches contract exactly. |
| DC-15 | Optimistic toggle + rollback + invalidateQueries | **PASS** | `use-toggle-follow.ts:13-24` — `getNextFollowStatus`: `none→following`, `following→none`, `follower→mutual`, `mutual→follower`. `onMutate` (line 48-51): saves prev, sets new status optimistically. `onError` (line 53-60): rollback to `context.prev` + Toast error. `onSuccess` (line 62-81): syncs with server response, invalidates `profileQueryKey.getMyProfile()`, `followQueryKey.userProfile(targetUserId)`, `followQueryKey.myFollowers()`, `followQueryKey.myFollowings()`. |
| DC-21 | 프로필 카운터 invalidateQueries | **PASS** | Same as DC-15 onSuccess — `profileQueryKey.getMyProfile()` and `followQueryKey.userProfile(targetUserId)` invalidated. |

### FE — Follow Lists & Navigation

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-16 | 팔로워 카운트 탭 → FollowerListScreen | **PASS** | `profile.screen.tsx:59-60` — `handlePressFollowers` → `navigation.navigate("FollowerList")`. `root-navigator.tsx:145-146` — `<Stack.Screen name="FollowerList" component={FollowerListScreen} />`. |
| DC-17 | 팔로잉 카운트 탭 → FollowingListScreen | **PASS** | `profile.screen.tsx:63-64` — `handlePressFollowings` → `navigation.navigate("FollowingList")`. `root-navigator.tsx:149-150` — `<Stack.Screen name="FollowingList" component={FollowingListScreen} />`. |
| DC-18 | 팔로워/팔로잉 목록 가나다순 + FollowButton | **PASS** | **Sorting**: BE confirmed 가나다순 (DC-5/DC-6). **FollowButton**: `follow-user-item.tsx:23-26` — each item uses `useToggleFollow` → renders `FollowButton`. **Pagination**: BE now returns `{ data, nextCursor }` (fixed in 5aa25a2f + ba0c6a95). FE `use-follow-list.ts:25,55` reads `page.data.data` — aligned with BE field `data`. `getNextPageParam` reads `nextCursor` — aligned. Infinite scroll works correctly. |
| DC-19 | 목록에서 유저 탭 → OtherProfileScreen | **PASS** | `follower-list.screen.tsx:15-17` — `handlePressProfile` → `navigation.navigate("OtherProfile", { userId })`. Same pattern in `following-list.screen.tsx:15-17`. `follow-user-item.tsx:30-34` — `HStack.Pressable onPress={() => onPressProfile(item.userId)`. |

### FE — OtherProfileScreen

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-20 | OtherProfileScreen 최소 구현 | **PASS** | `other-profile.screen.tsx:20-114` — Profile header with avatar (line 42-56), nickname (line 58-62), followerCount/followingCount/regeneratedCount display (line 64-89), `FollowButton` (line 98-101), `ProfileContentGrid` for published contents (line 104-109). Counters are plain `Typo` text — not tappable (no `Pressable` wrapper). `use-other-profile.ts:13-22` — `useGetUserProfileUseCase` fetches `GET /profiles/:userId`. `use-other-profile.ts:24-52` — `useGetUserPublishedContentsUseCase` fetches `GET /contents/:userId/published`. `root-navigator.tsx:141-142` — registered as `OtherProfile`. |

---

## Clean Architecture Compliance (FE)

| Check | Result |
|-------|--------|
| `domain/follow/` imports | Pure TS only (`zod`). No React, axios, or react-query. **PASS** |
| `data/follow/` imports | `ApiInstance`, `apiUtils`, domain types. No react-query hooks. **PASS** |
| `presentation/follow/` hooks | `useQuery`/`useMutation` only in hooks. Screens delegate to hooks. **PASS** |
| Mapper uses Zod `.parse()` | `follow.mapper.ts:17,22,28,33` — all 4 mappers use `.parse()`. **PASS** |

---

## Resolved Issues

### MAJOR-1 (RESOLVED): BE/FE Pagination Contract Mismatch

- **Original issue**: BE used offset pagination (`{ list, total, hasMore }`), FE expected cursor pagination (`{ data, nextCursor, hasMore }`)
- **Fix 1** (5aa25a2f): Changed BE to cursor-based pagination with base64-encoded offset cursor, returning `nextCursor`
- **Fix 2** (ba0c6a95): Renamed BE response field `list` → `data` to match FE DTO
- **Status**: Fully resolved. BE response `{ data, nextCursor }` now matches FE `FollowDTO.FollowListResponse`

---

## Verdict: **PASS**

- Critical: 0
- Major: 0
- Minor: 0

21 of 21 DCs pass. All BE/FE contracts aligned after two post-merge fixes.
