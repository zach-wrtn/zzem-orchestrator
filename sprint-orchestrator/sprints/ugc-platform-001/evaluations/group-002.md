# Evaluation Report: Group 002 — Feed Publish

**Sprint**: ugc-platform-001
**Evaluator**: Evaluator Agent
**Date**: 2026-03-28
**Verdict**: **PASS**

---

## Summary

21 of 21 Done Criteria PASS. Initial evaluation found 1 Critical (DC-10: new content defaulted to private). Fixed in commit 9ba2c539 — `CreateContentInput` now includes `isPublished`/`isCustomPrompt`, filter content creation explicitly sets `isPublished: true`. Re-evaluation confirms fix is correct.

---

## Done Criteria Evaluation

### BE — Toggle Visibility

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-1 | PATCH visibility → 공개 전환 + 200 | **PASS** | `feed-publish.controller.ts` → `feed-publish-app.service.ts:toggleVisibility` → domain `updateVisibility` sets `isPublished=true`. Returns `ContentVisibilityResponseDto` with 200. |
| DC-2 | 커스텀 프롬프트 → 400 | **PASS** | `feed-publish-domain.service.ts:26` — `if (input.isPublished && content.isCustomPrompt)` → `BadRequestException`. |
| DC-3 | 타인 콘텐츠 → 403 | **PASS** | `feed-publish-domain.service.ts` — owner check `content.userId !== input.userId` → `ForbiddenException`. |
| DC-4 | 최초 공개 paybackInfo 반환 | **PASS** | Domain: `isFirstPublish = isPublished && publishedAt === null`. `updateVisibility` sets `publishedAt` only on first publish. App service: returns `PaybackInfoDto` with `PAYBACK_RATE=0.01` when `isFirstPublish=true`, `null` otherwise. `publishedAt` preserved on unpublish (not cleared). |
| DC-21 | 삭제/미존재 contentId → 404 | **PASS** | Domain: `findById` → `NotFoundException` when content not found. Soft-deleted content filtered by `deletedAt: null` in repository queries. |

### BE — Content List APIs

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-5 | GET /contents/me?tab=published | **PASS** | `feed-publish-app.service.ts` routes `tab=published` → `findPublishedByUser` → `findPublishedByUserWithCursor` (filter: `isPublished:true, deletedAt:null`, sort: `_id:-1`). Cursor pagination with limit+1 for `hasMore`. `toFeedContentItems` fetches profile for `owner` field (userId, nickname, profileImageUrl, isPersona). |
| DC-6 | GET /contents/me?tab=private | **PASS** | Routes `tab=private` → `findPrivateByUser` → `findPrivateByUserWithCursor` (filter: `isPublished:false, deletedAt:null`, sort: `_id:-1`). Same cursor pattern. |
| DC-7 | GET /contents/me?tab=liked → 빈 목록 허용 | **PASS** | `feed-publish-app.service.ts:65` — else branch returns `new FeedContentListResponseDto([], limit)` with comment referencing DC-7 and Group 003. |
| DC-8 | GET /contents/{userId}/published | **PASS** | `feed-publish.controller.ts` uses `OptionalUserGuard`. App service: `toFeedContentItems` defaults `isLiked=false` for unauthenticated. Owner field populated from profile. |
| DC-11 | 비인증 PATCH visibility → 401 | **PASS** | Controller uses `@UseGuards(LibUserGuard)` on `toggleVisibility`. |

### BE — Schema & Defaults

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-9 | 스키마 default isPublished=false | **PASS** | `content.schema.ts:64` — `@Prop({ type: Boolean, default: false }) isPublished: boolean`. Mapper: `isPublished ?? false`. Existing content defaults to private. |
| DC-10 | 새 콘텐츠 생성 시 isPublished=true 기본값 | **PASS** (fixed) | **Fix (9ba2c539)**: `CreateContentInput` now includes `isPublished?: boolean` and `isCustomPrompt?: boolean`. `ContentRepository.createOne` passes `isPublished: data.isPublished ?? false`. `content-generation-app.service.ts:createContentWithStatus` explicitly sets `isPublished: true, isCustomPrompt: false` for standard filter content. Custom prompt content uses separate path where schema default `false` applies. Only one call site sets `isPublished: true` — confirmed correct. |

### FE — Profile Tabs & Grid

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-12 | 프로필 공개 탭 그리드 | **PASS** | `use-my-contents.ts` — `useInfiniteQuery` with tab-based queryKey. `profile-content-grid.tsx` — `FlatList` with `numColumns={3}`. Tab=published calls `/contents/me?tab=published`. |
| DC-13 | 프로필 비공개 탭 그리드 | **PASS** | Same hook with `tab=private`. Same grid component. |
| DC-14 | 탭 아이템 → SwipeFeed 진입 | **PASS** | `profile-content-grid.tsx` — onPress navigates to `SwipeFeed` with `{targetId, type:"content", initialIndex, entryPoint:"profile", isPublished, isCustomPrompt}`. SwipeFeed receives params and uses tab-specific API. |
| DC-20 | 무한 스크롤 | **PASS** | `use-my-contents.ts` — `useInfiniteQuery` with `getNextPageParam` from `nextCursor`. `onEndReached` calls `fetchNextPage`. `PAGE_LIMIT=20`. |

### FE — Swipe Feed Publish Toggle

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-15 | 내 콘텐츠 → 게시 토글 표시 | **PASS** | `swipe-feed-actions.tsx` — renders `PublishToggle` when `isOwner` (ternary operator). `swipe-feed.screen.tsx` computes `isOwner` from `profile.userId === activeItem.userProfile.id`. |
| DC-16 | OFF→ON: 즉시 공개 + 실패 롤백 | **PASS** | `use-toggle-visibility.ts` — `!isPublished` → immediate `setIsPublished(true)` + `mutate(true)`. `onError` → revert state + Toast error. No confirmation for publish. |
| DC-17 | ON→OFF: 확인 바텀시트 → 비공개 + 실패 롤백 | **PASS** | `publish-toggle.tsx` — uses `useBottomConfirmSheet` for unpublish. `use-toggle-visibility.ts` — `isPublished` → `onConfirmUnpublish(proceed)`. `onError` → revert + Toast. |
| DC-18 | 커스텀 프롬프트 → 안내 메시지 | **PASS** | `use-toggle-visibility.ts` — `isCustomPrompt` → `Toast("커스텀 프롬프트 콘텐츠는 공개할 수 없습니다")`. No mutation fired. |
| DC-19 | CTA 텍스트 분기 | **PASS** | `swipe-feed-cta-button.tsx:20` — `label = "템플릿 사용하기"` (default for non-owner). `swipe-feed-footer.tsx:297` — `label={isOwner ? "다시 생성하기" : undefined}` (owner gets "다시 생성하기"). |

### Clean Architecture Check

| Check | Result |
|-------|--------|
| FE domain/ prohibited imports | **PASS** — No react, react-native, axios, @tanstack/react-query imports in domain layer |
| BE layer boundaries | **PASS** — Controller → Application → Domain → Persistence direction maintained |

---

## Issue History

| # | Severity | DC | Description | Resolution |
|---|----------|----|-------------|------------|
| 1 | ~~Critical~~ | DC-10 | New content defaulted to `isPublished=false` | Fixed in 9ba2c539: `CreateContentInput` extended with `isPublished`/`isCustomPrompt`, filter creation sets `isPublished: true` |

---

## Verdict: **PASS**

**Critical: 0 | Major: 0 | Minor: 0**

All 21 Done Criteria verified. DC-10 fix confirmed correct — standard filter content now created with `isPublished: true`, custom prompt content defaults to `false` via schema default. No remaining issues.
