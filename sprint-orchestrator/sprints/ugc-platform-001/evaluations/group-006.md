# Evaluation Report: Group 006 — Social (Block/Report/Feedback)

**Sprint**: ugc-platform-001
**Evaluator**: Evaluator Agent
**Date**: 2026-03-29
**Verdict**: **PASS**

---

## Summary

26 of 26 Done Criteria PASS. Block, Report, and Feedback features implemented correctly across BE and FE layers. Block filtering applied to correct endpoints, event emission is conditional on contentId, and FE flows (block/unblock/report/feedback) are complete.

---

## Done Criteria Evaluation

### Block

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-1 | POST /blocks → blocked=true | **PASS** | `block.controller.ts:21-33` — `@Post() @UseGuards(LibUserGuard)`, calls `blockAppService.blockUser()`. `block-domain.service.ts:22-49` — creates Block document, returns `{ targetUserId, blocked: true }`. Schema: `block.schema.ts:6-12` with unique index on `(blockerId, blockedUserId)`. |
| DC-2 | 자기 자신 차단 → 400 | **PASS** | `block-domain.service.ts:23-25` — `if (blockerId === targetUserId) throw new BadRequestException("자기 자신을 차단할 수 없습니다.")`. Also applied to unblock at line 56. |
| DC-3 | 편방향 팔로우 해제 + 카운터 | **PASS** | `block-domain.service.ts:40-45` — `followRepository.deleteByFollowerAndFollowee(blockerId, targetUserId)` deletes only A→B follow. If deleted: `decrementFollowingCount(blockerId)` and `decrementFollowerCount(targetUserId)`. B→A follow is untouched. Both counter operations use atomic `$inc` via `profile.repository.ts`. |
| DC-4 | 차단 유저 콘텐츠 필터링 (liked, published, likes/me) | **PASS** | `feed-publish-app.service.ts:88-93` — `getUserPublishedContents` filters via `blockedUserIds.has(c.userId)`. `feed-publish-app.service.ts:110-114` — `getLikedContents` (tab=liked) same filter. `like-app.service.ts:41-44` — `GET /likes/me` same filter. Own-content tabs (`tab=published`, `tab=private`) not filtered (correct — own content only). |
| DC-5 | 좋아요 DB 유지, 노출만 차단 | **PASS** | Block filtering is applied at the application layer query result level, not at DB delete. `like-app.service.ts:41-44` filters contents post-query. Like documents remain in DB. Unblock restores visibility since filter is runtime. |
| DC-6 | DELETE /blocks → blocked=false | **PASS** | `block.controller.ts:35-45` — `@Delete() @UseGuards(LibUserGuard)`. `block-domain.service.ts:54-70` — `blockRepository.deleteByBlockerAndBlocked()` hard-deletes Block document, returns `{ targetUserId, blocked: false }`. |
| DC-7 | GET /blocks/me → 차단 목록, cursor pagination | **PASS** | `block.controller.ts:47-58` — `@Get("me") @UseGuards(LibUserGuard)`, accepts `CursorRequestDto`. `block-domain.service.ts:73-101` — fetches `limit+1` for hasMore detection, builds items with `userId, nickname, profileImageUrl, blockedAt`, generates cursor from last item ID (base64 encoded). Response: `BlockedUserListResponseDto` with `data, nextCursor, hasMore`. |
| DC-8 | isBlocked wired to Block collection | **PASS** | `profile-app.service.ts:64-66` — `isBlocked = await this.blockDomainService.isBlocked(requesterId!, targetUserId)`. `block-domain.service.ts:104-107` — queries `blockRepository.findByBlockerAndBlocked()`, returns `block !== null`. Only checked when authenticated and not self. |
| DC-9 | 차단/해제 미통지 | **PASS** | No notification event emitted in `blockUser()` or `unblockUser()`. Only `logger.debug` calls. No EventEmitter usage in block domain. |
| DC-10 | 멱등: 재차단/재해제 | **PASS** | `block-domain.service.ts:33-36` — existing block check: if already blocked, returns `{ blocked: true }` without creating duplicate. `block-domain.service.ts:65` — `deleteByBlockerAndBlocked` returns null if not found, no error thrown. |
| DC-11 | 차단된 유저(B)가 차단자(A) 프로필 조회 → 정상 | **PASS** | `profile-app.service.ts:65` — `isBlocked(requesterId, targetUserId)` checks if requester (B) blocked target (A). Since B didn't block A (A blocked B), returns false. B sees normal profile. Unidirectional by design. |

### Report

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-12 | POST /reports → 201 | **PASS** | `report.controller.ts:15-27` — `@Post() @HttpCode(HttpStatus.CREATED) @UseGuards(LibUserGuard)`. Accepts `CreateReportRequestDto` with `targetUserId, reason, description, contentId?`. `report-domain.service.ts:18-19` — creates report via repository. |
| DC-13 | reason enum + description 100자 | **PASS** | `create-report.request.dto.ts:14` — `@IsEnum(REPORT_REASON)` validates enum (HARMFUL, SPAM, INAPPROPRIATE, OTHER). `create-report.request.dto.ts:19` — `@MaxLength(100)` on description. class-validator rejects >100 chars with 400. `report.schema.ts:5-10` — enum definition matches. |
| DC-14 | 신고 미통지 | **PASS** | No notification event emitted for reports. Only `content.reported` for recommendation penalty (DC-15), not user-facing notification. Logger debug only. |
| DC-15 | content.reported event (conditional on contentId) | **PASS** | `report-domain.service.ts:22-29` — `if (input.contentId)` guard. When contentId present: `eventEmitter.emit(EVENT_TYPE.CONTENT_REPORTED, { reporterId, targetUserId, contentId, reason, timestamp: new Date() })`. `event-constant.ts:19` — `CONTENT_REPORTED = "content.reported"`. When contentId absent: no emit. Payload matches contract. |
| DC-16 | DB에 reporterId + targetUserId + contentId(nullable) | **PASS** | `report.schema.ts:14-22` — `reporterId` (required ObjectId), `targetUserId` (required ObjectId), `contentId` (ObjectId, default null). Field names aligned. Nullable contentId for user-level reports. |
| DC-17 | 중복 신고 허용 | **PASS** | No unique index on `(reporterId, targetUserId)` or `(reporterId, contentId)` in `report.schema.ts:33-34`. Only indexes on `reporterId+createdAt` and `targetUserId`. Each report creates a new document. |

### Feedback

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-18 | POST /feedbacks → 201 | **PASS** | `feedback.controller.ts:15-31` — `@Post() @HttpCode(HttpStatus.CREATED) @UseGuards(LibUserGuard)`. Accepts `CreateFeedbackRequestDto` with `targetUserId, message, contentId?`. `feedback-domain.service.ts:8-15` — creates via `feedbackRepository.createOne()`. |
| DC-19 | message 300자, contentId 선택적 | **PASS** | `create-feedback-request.dto.ts:14` — `@MaxLength(300)` on message. `create-feedback-request.dto.ts:9-10` — `@IsOptional() @IsMongoId()` on contentId. class-validator rejects >300 chars with 400. |
| DC-20 | DB 적재만 | **PASS** | `feedback.schema.ts:6-18` — `Feedback` schema with `userId, targetId, contentId, text, timestamps`. No admin query endpoint exists. `feedback-domain.service.ts` only has `createFeedback()`, no read methods. |

### FE

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-21 | 더보기 메뉴: URL 복사, 차단, 신고 | **PASS** | `other-profile.screen.tsx:93-122` — `handleMoreMenu` shows bottom sheet with 3 items: "프로필 URL 복사" (icons-link-stroke), "차단하기" (icons-ban-stroke, status_negative), "신고하기" (icons-report-stroke, status_negative). |
| DC-22 | 차단 확인 바텀시트 → 차단 → BlockedProfileView | **PASS** | `other-profile.screen.tsx:65-78` — `handleBlockConfirm` calls `show()` with title "이 유저를 차단할까요?", confirm "차단하기" (warn preset) triggers `blockUser()`. `use-block-user.ts:14-17` — on success: `invalidateQueries` for userProfile, causing re-render. `other-profile.screen.tsx:130-139` — `if (profile?.isBlocked)` renders `BlockedProfileView`. |
| DC-23 | BlockedProfileView: "이 계정을 차단했어요" + 해제 버튼 | **PASS** | `blocked-profile-view.tsx:23-24` — "이 계정을 차단했어요" text. Line 30-35: `RegularButton.Solid` with label "차단 해제", `onPress={onUnblock}`, `loading={isUnblockPending}`. `use-block-user.ts:27-41` — unblock mutation invalidates userProfile query on success, restoring normal view. |
| DC-24 | 신고 시트 (사유 선택 + 100자 입력) | **PASS** | `report-sheet.tsx:21-85` — Two-step flow: `showReasonSheet()` displays 4 reason options (HARMFUL, SPAM, INAPPROPRIATE, OTHER) with "다음" button, then `showDescriptionSheet()` with `Input.TextArea maxLength={100}` and "신고하기" (warn) button. Calls `onSubmit(reason, description)`. |
| DC-25 | 의견 보내기 → FeedbackScreen (300자 + contentId) | **PASS** | `other-profile.screen.tsx:125-127` — `handleFeedback` navigates to `UserFeedback` with `{ targetUserId }`. `user-feedback.screen.tsx:22-71` — `UserFeedbackScreen` accepts `targetUserId, contentId` params. `Input.TextArea maxLength={300}`. Submit calls `sendFeedback({ message, contentId })`. `root-navigator.tsx:156-157` — route registered. |
| DC-26 | 프로필 URL 복사 → 클립보드 | **PASS** | `other-profile.screen.tsx:59-62` — `Clipboard.setString(\`https://zzem.wrtn.ai/profile/${userId}\`)`. Toast: "프로필 URL이 복사되었어요". |

---

## Verdict: **PASS**

- Critical: 0
- Major: 0
- Minor: 0

26 of 26 DCs PASS. Implementation is clean and well-structured across all layers.
