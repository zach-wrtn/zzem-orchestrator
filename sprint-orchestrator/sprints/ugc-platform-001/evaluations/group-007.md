# Evaluation Report: Group 007 — Notifications

**Sprint**: ugc-platform-001
**Evaluator**: Evaluator Agent
**Date**: 2026-03-29
**Verdict**: **PASS**

---

## Summary

21 of 21 Done Criteria PASS. Initial evaluation found two FE/BE endpoint mismatches (markAsRead path, settings path). Both fixed in de415ac5. Re-evaluation confirms all DCs pass.

---

## Done Criteria Evaluation

### BE — Notification CRUD

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-1 | GET /notifications → cursor pagination, latest first | **PASS** | `notification.controller.ts:19-28` — `@Get() @UseGuards(LibUserGuard)`, accepts `CursorRequestDto`. `notification-domain.service.ts:56-88` — fetches `limit+1`, returns items with `id, category, title, body, thumbnailUrl, deepLink, isRead, createdAt`. `notification.repository.ts:33-54` — sorts `{ _id: -1 }`, filters `expiresAt: { $gt: now }`. Response: `NotificationListResponseDto` with `list, nextCursor`. |
| DC-2 | POST /notifications/read → batch markAsRead | **PASS** | `notification.controller.ts:31-39` — `@Post("read")`, accepts `MarkAsReadRequestDto` with `notificationIds: string[]`. `notification.repository.ts:56-65` — `updateMany({ _id: { $in: objectIds }, userId }, { $set: { isRead: true } })`. Scoped to userId for security. |
| DC-3 | GET /notifications/unread-count | **PASS** | `notification.controller.ts:42-49` — `@Get("unread-count")`. `notification.repository.ts:67-74` — counts `{ userId, isRead: false, expiresAt: { $gt: now } }`. Returns `{ count }`. |
| DC-4 | TTL: expiresAt > now filter | **PASS** | `notification.repository.ts:17` — `expiresAt = now + 30 days`. `notification.repository.ts:41` — `findByUserWithCursor` filters `expiresAt: { $gt: now }`. `notification.repository.ts:72` — `countUnread` also filters `expiresAt: { $gt: now }`. `notification.schema.ts:38` — MongoDB TTL index `{ expiresAt: 1 }, { expireAfterSeconds: 0 }` for automatic cleanup. |

### BE — Notification Settings

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-5 | GET /notification-settings → category ON/OFF | **PASS** | `notification-setting.controller.ts:17-22` — `@Get() @UseGuards(LibUserGuard)`. `notification-setting-domain.service.ts:9-27` — `readSetting` calls `upsert(userId)` (getOrCreate). Returns `{ like, follow, credit, news }` (plus `memeNotification`). Default all ON. |
| DC-6 | PATCH /notification-settings → update | **PASS** | `notification-setting.controller.ts:24-32` — `@Patch() @UseGuards(LibUserGuard)`. `notification-setting-domain.service.ts:29-31` — `updateSetting` calls `upsert(userId, input)`. Partial update for individual categories. |

### BE — Notification Triggers

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-7 | content.liked → like notification | **PASS** | `notification-event.listener.ts:41-75` — `@OnEvent(EVENT_TYPE.CONTENT_LIKED)`. Looks up content for thumbnail, liker profile for nickname. title="좋아요", body="`${nickname}님이 회원님의 콘텐츠를 좋아합니다`", thumbnailUrl=content.thumbnail, deepLink=`/content/${contentId}`. No self-like filter — sends to content.userId regardless of who liked. Push sent via `notiService.sendPush` when created=true. |
| DC-8 | user.followed → follow notification | **PASS** | `notification-event.listener.ts:78-108` — `@OnEvent(EVENT_TYPE.USER_FOLLOWED)`. title="팔로우", body="`${nickname}님이 회원님을 팔로우했습니다`", thumbnailUrl=follower's profileImageUrl, deepLink=`/profile/${followerId}`. Recipient=followeeId. |
| DC-9 | credit.payback → credit notification (immediate) | **PASS** | `notification-event.listener.ts:111-141` — `@OnEvent(EVENT_TYPE.CREDIT_PAYBACK)`. title="크레딧 페이백", body="`회원님의 콘텐츠가 재생성되어 ${amount}크레딧이 적립되었습니다`", thumbnailUrl=content thumbnail, deepLink="/credit/history". Event-based individual delivery. |
| DC-10 | Settings check → OFF skips | **PASS** | `notification-domain.service.ts:30-41` — reads settings, maps category to boolean. `if (!categorySettingMap[params.category]) return false`. No DB save, no push when OFF. |
| DC-11 | Persona excluded | **PASS** | `notification-domain.service.ts:21-28` — `profileRepository.findByUserId(recipientUserId)`, if `recipientProfile.isPersona` → return false. Checked before settings and creation. |

### BE — Push

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-12 | Push via NotiService | **PASS** | `notification-event.listener.ts:64-66,97-99,129-131` — after `createNotification` returns true, calls `notiService.sendPush(userId, title, body, deepLink)`. `noti.service.ts:36-56` — `sendPush` posts to `NOTI_API_URL/manager-app/internal/push/send` with service="zzem", title, body, deepLink. Existing Noti infra module used. |
| DC-13 | Persona no push | **PASS** | `notification-domain.service.ts:26-28` — persona check returns false before notification creation. Event listener only calls `sendPush` when `created=true`. Persona users never receive push. |

### FE

| DC | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| DC-14 | NotificationScreen: list, infinite scroll | **PASS** | `notification.screen.tsx:24-59` — FlatList with `onEndReached`, `onEndReachedThreshold=0.5`. `use-notifications.ts:12-40` — `useInfiniteQuery`, pagination via `nextCursor`. `notification-item.tsx:49-101` — renders category icon (CATEGORY_ICON_MAP), title, body, thumbnail, time. |
| DC-15 | Unread visual distinction | **PASS** | `notification-item.tsx:73` — `bgColor={data.isRead ? undefined : "surface_secondary"}`. Unread items have a distinct background color. |
| DC-16 | Tap → markAsRead + deepLink | **PASS** | `notification-item.tsx:57-65` — on press: calls `onMarkRead(data.id)` if not read, then `handleLinking(data.deepLink)`. `use-mark-read.ts:11-12` — `mutationFn: (notificationId: string) => notificationRepository.markAsRead([notificationId])` wraps single ID into array. `notification.repository-impl.ts:19-23` — `POST ${this.prefix}/read` with `{ notificationIds }` body. Matches BE `POST /notifications/read` with `MarkAsReadRequestDto { notificationIds: string[] }`. Domain interface `notification.repository.ts:13-15` — `markAsRead(notificationIds: string[])` consistent. *(Fixed in de415ac5)* |
| DC-17 | Badge: red dot when hasUnread | **PASS** | `home-header.tsx:33` — `useGetUnreadNotificationCountUseCase()` returns `hasUnread`. `home-header.tsx:96-104` — when `hasUnread`, renders red dot (`bgColor="sred_050"`) positioned on bell icon. |
| DC-18 | Badge refresh after read | **PASS** | `use-mark-read.ts:13-19` — `onSuccess` invalidates both `NOTIFICATION_LIST_QUERY_KEY` and `notificationQueryKey.getUnreadCount()`. Badge re-queries unread count after successful markAsRead. |
| DC-19 | Settings: category toggles | **PASS** | `notification-settings-section.tsx:25-54` — renders 4 category toggles (like, follow, credit, news) with Switch components. Uses `useUpdateNotificationSettingsUseCase()`. `notification.repository-impl.ts:32-34` — `GET "/meme/v1/notification-setting"`. `notification.repository-impl.ts:41-43` — `PATCH "/meme/v1/notification-setting"`. Matches BE controller at `notification-setting` path (`notification-setting.controller.ts:11`). *(Fixed in de415ac5)* |
| DC-20 | Navigation registered | **PASS** | `root-navigator.tsx:160-163` — `<Stack.Screen name="Notifications" component={NotificationScreen} />`. |
| DC-21 | Push → invalidateQueries | **PASS** | `usePushNotificationHandler.ts:28-33` — on push message receipt, invalidates both `NOTIFICATION_LIST_QUERY_KEY` and `notificationQueryKey.getUnreadCount()`. Runs on both foreground (`onMessage`) and background-open (`onNotificationOpenedApp`). |

---

## Resolved Issues (fixed in de415ac5)

### MAJOR-1: DC-16 FE markAsRead Endpoint Mismatch — RESOLVED

**Was**: FE sent `POST /notifications/{notificationId}/read` (single ID in URL path). BE expected `POST /notifications/read` with `{ notificationIds: string[] }` body.

**Fix**: `notification.repository-impl.ts` — `markAsRead(notificationIds: string[])` now sends `POST ${prefix}/read` with `{ notificationIds }` body. Domain interface updated to `string[]`. Hook wraps single ID: `notificationRepository.markAsRead([notificationId])`.

### MAJOR-2: DC-19 FE Notification Settings Endpoint Path Mismatch — RESOLVED

**Was**: FE called `GET/PATCH /meme/v1/notifications/settings`. BE controller served at `/meme/v1/notification-setting`.

**Fix**: `notification.repository-impl.ts` — settings methods now use hardcoded `"/meme/v1/notification-setting"` path instead of `${this.prefix}/settings`.

---

## Verdict: **PASS**

- Critical: 0
- Major: 0 (2 resolved)
- Minor: 0

21 of 21 DCs pass. All issues from initial evaluation resolved in de415ac5.
