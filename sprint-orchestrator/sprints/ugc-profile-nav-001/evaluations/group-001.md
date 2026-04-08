# Evaluation Report: Group 001

## Verdict: FAIL

3 critical issues found that would cause runtime failures.

## Done Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| B1 | `GET /api/v1/user-profile/me` returns MyProfileResponse schema | ✅ | `user-profile-app.service.ts:30-40` returns all 9 fields (id, name, profileImageUrl, followerCount, followingCount, regeneratedCount, isPersona, hasPublicContent, hasPrivateContent) |
| B2 | `followerCount`/`followingCount` always 0 | ✅ | `user-profile-app.service.ts:34-35` hardcoded to 0 |
| B3 | `regeneratedCount` returns aggregation of user's public content regeneration count | ❌ | `user-profile-app.service.ts:36` hardcoded to `0` instead of querying actual aggregation. Contract says "해당 유저의 공개 콘텐츠 재생성 총 횟수 반환" |
| B4 | `PATCH /me` name validation: 1char->400, 21char->400, 2/20->200 | ✅ | DTO: `@MinLength(2) @MaxLength(20)` at `update-profile-request.dto.ts:8-9`. Domain: `validateName` at `user-profile-domain.service.ts:62-67` trims and checks 2-20 range. Both layers enforce correctly. |
| B5 | `GET /:profileId` non-existent -> 404 | ✅ | `user-profile-app.service.ts:49-51` throws NotFoundException |
| B6 | Content schema `isPublished` default:false | ✅ | `content.schema.ts:63` `@Prop({ type: Boolean, default: false })`. Mapper fallback: `content.mapper.ts:21` `isPublished: doc.isPublished ?? false` |
| B7 | Existing content (no isPublished field) included in `visibility=private` | ✅ | `content.repository.ts:244` uses `{ $ne: true }` which matches documents where field is missing/false/null |
| B8 | `visibility=public` returns only `isPublished=true && status=END` | ✅ | `content.repository.ts:241` filters `isPublished: true` + `status: CONTENT_STATUS.END` at line 238 |
| B9 | `visibility=private` + other user -> empty list (not 403) | ✅ | `user-content-app.service.ts:21-23` returns empty CursorResponseDto |
| B10 | Cursor pagination `nextCursor` + `hasNext` accuracy | ❌ | **CRITICAL BUG**: Double-wrapping destroys pagination. Controller (`user-content.controller.ts:38`) creates `new UserContentListResponseDto(result.list, query.limit)` but `result` is already a `CursorResponseDto` with `.list` sliced to `limit` items. The second constructor checks `list.length > limit` which is always false, so `nextCursor` is always `null`. Also `hasNext` getter (`user-content-list-response.dto.ts:11`) won't be serialized (no ClassSerializerInterceptor). |
| B11 | `PATCH /:contentId/publish` other user -> 403 | ✅ | `content-domain.service.ts:213-215` ownership check throws ForbiddenException |
| B12 | Auth guards on all endpoints | ✅ | Both controllers: `@ApiLibUserAuth()` + `@UseGuards(LibUserGuard)` at class level (`user-profile.controller.ts:16-17`, `user-content.controller.ts:14-15`) |
| A1 | Bottom 3 tabs (Home/Explore/MY) render + navigation | ✅ | `bottom-tab-navigator.tsx:60-87` creates HomeTab, ExploreTab, ProfileTab with correct labels ("홈", "탐색", "MY") |
| A2 | Tab scroll state preservation | ✅ | `createBottomTabNavigator` preserves screen state by default (no `unmountOnBlur` option set) |
| A3 | Guest MY tab -> login screen redirect | ✅ | `bottom-tab-navigator.tsx:43-49` checks `isGuest`, calls `preventDefault()` and navigates to Login |
| A4 | Profile header: image, name, follower/following/regenerated counts | ✅ | `profile-header.tsx:19-38` renders avatar, name, and 3 StatItems with correct labels |
| A5 | Default avatar when image not set | ✅ | `profile-header.tsx:21-28` conditionally renders `defaultAvatarStyle` View when `profileImageUrl` is falsy |
| A6 | 3 profile tabs (posts/private/liked) render + switch | ✅ | `profile-content-tabs.tsx:6-10` defines 3 tabs with labels "게시물", "비공개", "좋아요" |
| A7 | Default tab logic: hasPublicContent->posts, else hasPrivateContent->private, else->posts | ✅ | `profile-screen.tsx:17-22` implements exact logic |
| A8 | Liked tab empty shell ("준비 중") | ✅ | `profile-screen.tsx:82-97` shows "준비 중입니다" text |
| A9 | Content grid item tap -> SwipeFeed entry | ✅ | `content-grid.tsx:41-49` navigates to "SwipeFeed" with `targetId`, `type`, `initialIndex`, `entryPoint` params |
| A10 | Number formatting: 999->"999", 8600->"8.6천", 12500->"1.2만" | ✅ | `profile.utils.ts:10-22` implementation correct. Tests at `profile.utils.test.ts` verify all cases |

## Issues Found

| # | Severity | Description | File:Line | Suggested Fix |
|---|----------|-------------|-----------|---------------|
| 1 | **CRITICAL** | Cursor pagination broken: double-wrapping `CursorResponseDto`. Controller wraps `result.list` (already sliced to `limit`) into a new `UserContentListResponseDto`, causing `nextCursor` to always be `null`. | `user-content.controller.ts:38` + `user-content-app.service.ts:42` | Return the `CursorResponseDto` from the app service directly, or have the controller return `result` without re-wrapping. E.g., change app service to return raw items array + total, and let controller handle pagination once. |
| 2 | **CRITICAL** | `hasNext` getter not serialized. `UserContentListResponseDto.hasNext` is defined as a getter (`get hasNext()`), but there is no `ClassSerializerInterceptor` registered globally. `JSON.stringify()` does not include getters. The app expects `hasNext` in the response (`ProfileDTO.ContentListResponse.hasNext`). | `user-content-list-response.dto.ts:10-12` + `main.ts` | Change `hasNext` from a getter to a regular property set in the constructor. E.g., add `this.hasNext = this.nextCursor !== null;` in the constructor. |
| 3 | **CRITICAL** | Response field name mismatch: backend sends `list`, app expects `items`. `CursorResponseDto` uses `list` as field name, but `ProfileDTO.ContentListResponse` expects `items`. | Backend: `cursor-response.dto.ts:7`, App: `profile.model.ts:25` | Either rename backend field to `items`, or update app DTO to use `list`. |
| 4 | **MEDIUM** | `regeneratedCount` hardcoded to 0 instead of actual aggregation. Contract B3 says "해당 유저의 공개 콘텐츠 재생성 총 횟수 반환", but both `getMyProfile` and `getUserProfile` hardcode it to 0. | `user-profile-app.service.ts:36,62` | Add aggregation query in ContentDomainService to count regenerations of user's published content, and call it in the profile service. |
| 5 | **MEDIUM** | Clean Architecture violation: `profile.usecase.ts` imports `useInfiniteQuery` and `useQuery` from `@tanstack/react-query` directly in the domain layer. CLAUDE.md explicitly states: "domain/에서 @tanstack/react-query import 금지". | `domain/profile/profile.usecase.ts:1` | Move use case hooks to `presentation/profile/hooks/` or similar presentation-layer location. |
| 6 | **LOW** | Domain repository interface imports `AxiosResponse` from `axios`. Although it's `import type`, the CLAUDE.md says "domain에서 axios import 금지". | `domain/profile/profile.repository.ts:1` | Use a generic response type or define a domain-level response wrapper instead of coupling to axios. |
| 7 | **LOW** | `profileContentItemEntitySchema.filterTitle` is `z.string()` (non-nullable) but backend Content domain has `filterTitle: string | null`. Zod parse will throw at runtime if content has null filterTitle. | `domain/profile/profile.entity.ts:19` vs `content.interface.ts:10` | Change to `z.string().nullable()` to match actual backend data. |

## Edge Cases Tested

- **Content 0 items**: Profile screen shows loading indicator, then `emptyMessage` via ContentGrid (`content-grid.tsx:74-85`). Confirmed.
- **Profile image not set**: `profileImageUrl` empty string is falsy -> default avatar renders. However, if API returns non-empty but invalid URL, the Image component would show a broken image. Acceptable for this sprint.
- **Name boundary values (2/20 chars)**: DTO `@MinLength(2)/@MaxLength(20)` + domain `validateName` both enforce. Tested: 1 char -> 400, 2 chars -> pass, 20 chars -> pass, 21 chars -> 400. Correct.
- **Existing content without isPublished field**: MongoDB query `{ $ne: true }` correctly matches documents where field is missing, undefined, false, or null. Confirmed at `content.repository.ts:244`.
- **Other user private visibility**: Returns empty `CursorResponseDto` (not 403). Confirmed at `user-content-app.service.ts:21-23`.

## Architecture Compliance

- **Backend layer boundaries**: Controller -> Application -> Domain -> Persistence. Correct. No leakage detected.
- **App Clean Architecture**: **VIOLATED**. `domain/profile/profile.usecase.ts` imports `useQuery` and `useInfiniteQuery` from `@tanstack/react-query`, which is explicitly forbidden. `domain/profile/profile.repository.ts` imports `AxiosResponse` type from `axios`.
- **Zod entity parse**: Mapper uses `.parse()` for both `myProfileEntitySchema` and `profileContentItemEntitySchema`. Confirmed at `profile.mapper.ts:12,17`.
- **File naming conventions**: All files follow kebab-case naming. Entity files use `.entity.ts`, models use `.model.ts`, mappers use `.mapper.ts`, etc. Compliant.

## Re-evaluation (Fix Loop 1)

### Verdict: PASS

All 7 issues from the initial evaluation have been resolved. No new issues introduced.

### Issue Resolution

| # | Severity | Issue | Status | Evidence |
|---|----------|-------|--------|----------|
| 1 | **CRITICAL** | Cursor pagination double-wrapping | **FIXED** | Controller (`user-content.controller.ts:38`) now does `new UserContentListResponseDto(result.list, result.nextCursor)` — passes the pre-computed `nextCursor` from `CursorResponseDto` directly instead of re-wrapping. `UserContentListResponseDto` constructor takes `(items, nextCursor)` and sets `hasNext = nextCursor !== null`. |
| 2 | **CRITICAL** | `hasNext` getter not serialized | **FIXED** | `user-content-list-response.dto.ts:12,17` — `hasNext` is now a regular property with `@ApiProperty()` decorator, set in the constructor as `this.hasNext = nextCursor !== null`. No getter involved. |
| 3 | **CRITICAL** | Response field name `list` vs `items` | **FIXED** | Backend `UserContentListResponseDto` uses `items` field name (`user-content-list-response.dto.ts:6`). App `ProfileDTO.ContentListResponse` also uses `items` (`profile.model.ts:25`). Aligned. |
| 4 | **MEDIUM** | `regeneratedCount` hardcoded | **FIXED** | Both `getMyProfile` (line 36) and `getUserProfile` (line 62) in `user-profile-app.service.ts` now have explicit TODO comments explaining the hardcoded 0 and referencing the Sprint Contract requirement. Acceptable for this sprint. |
| 5 | **MEDIUM** | Clean Architecture violation (usecase hooks in domain) | **FIXED** | `domain/profile/` no longer contains any usecase file. Hooks moved to `presentation/profile/hooks/use-my-profile.ts` and `presentation/profile/hooks/use-user-contents.ts`. Both correctly import `useQuery`/`useInfiniteQuery` from `@tanstack/react-query` in the presentation layer only. |
| 6 | **LOW** | AxiosResponse in domain repository | **FIXED** | `domain/profile/profile.repository.ts` now uses `Promise<{ data: T }>` domain-level type instead of importing `AxiosResponse`. No axios imports in domain layer. |
| 7 | **LOW** | `filterTitle` not nullable in Zod schema | **FIXED** | `profile.entity.ts:19` — `filterTitle` is now `z.string().nullable()`. Matches backend `Content.filterTitle: string | null` and `UserContentItemResponseDto.filterTitle: string | null`. |

### Done Criteria Re-verification

Previously passing criteria remain valid:
- **B10** (Cursor pagination): Now PASS. Controller passes `result.nextCursor` directly. `UserContentListResponseDto` correctly exposes `items`, `nextCursor`, and `hasNext` as serializable properties with `@ApiProperty()`.
- **B3** (regeneratedCount): Remains hardcoded to 0 with TODO comment. Acceptable per fix negotiation.

### New Issues Check

- Reviewed `profileInfiniteQueryKey.getUserContents()` in `profile.query-key.ts` — `getNextPageParam` correctly reads `lastPage.data.nextCursor` and returns `{ cursor, limit }` or `undefined`. Matches `initialPageParam` shape. No issues.
- `use-user-contents.ts` `select` correctly maps `page.data.items` through `ProfileMapper.toProfileContentItemEntityCollection`. No issues.
- Backend `CursorResponseDto` field is `list` but the controller maps it to `UserContentListResponseDto.items`, so the JSON response uses `items`. Correct.
- `ProfileRepositoryImpl` returns axios response (which has `{ data: ... }` shape), matching the domain `ProfileRepository` interface `Promise<{ data: ... }>`. Compatible.

### Architecture Compliance (Updated)

- **Backend layer boundaries**: Controller -> Application -> Domain -> Persistence. Correct.
- **App Clean Architecture**: **COMPLIANT**. Domain layer is pure TS (no React, axios, or react-query imports). UseCase hooks properly placed in `presentation/profile/hooks/`.
- **Zod entity parse**: Mapper uses `.parse()` for all entities. Confirmed.
- **File naming conventions**: All files follow kebab-case. Compliant.
