Design a mobile app screen for a Korean AI content creation app called "ZZEM" (짬).

Platform: iOS and Android (React Native)
Language: Korean (한국어) for all UI labels and text
Style: Modern, clean, minimal mobile app design
Theme: Dark theme with vibrant accent colors

---

## Screen: NotificationListScreen

**Purpose:** Notification center displaying all notification items. Categories include like, credit, news, and follow. Unread items are visually distinct from read items.

**Components:**
- **NotificationItem:** Row with icon/thumbnail, title, body text, relative timestamp, and read/unread state
  - Unread items: background highlight or unread dot indicator
  - Read items: default/muted styling
- **Category grouping or filtering:** Optional category tabs or filter (like, credit, news, follow)
- **Infinite scroll pagination:** Cursor-based, loads more items on scroll
- **UnreadBadge:** Small red dot on the MY tab icon in the tab bar (shown when unread count > 0)
- **Empty state:** Centered message when no notifications exist

**User Flow:**
1. MY tab shows red dot badge when unread notifications > 0
2. Open notification center → list loads with cursor pagination
3. Each item displays: icon/thumbnail + title + body + relative timestamp
4. Unread items shown with background highlight or dot indicator
5. Tap an item → mark as read + navigate to target via deeplink
6. Scroll down → load more notifications (infinite scroll)

**Notification Types:**
- **Like notifications:** Individual (one per like event)
- **Follow notifications:** Individual, delivered immediately
- **Credit payback notifications:** Batched

**Visual Rules:**
- Retention: 1 month (server managed — stale items do not appear)
- Unread items have a distinct visual treatment (highlight background or dot)
- Relative timestamps displayed (방금 전, N분 전, N시간 전, N일 전)
- Smooth infinite scroll with loading indicator at bottom

**Korean Labels:**
- Screen title: "알림"
- Categories: "좋아요 알림", "크레딧 알림", "소식", "팔로우 알림"
- Timestamps: "방금 전", "분 전", "시간 전", "일 전"
- Empty state: "알림이 없습니다"

---

## Screen: NotificationSettingsScreen

**Purpose:** Settings screen for toggling notification categories ON or OFF.

**Components:**
- **Setting rows:** Each row contains a category name and a toggle switch
  - 좋아요 알림 (Like notifications)
  - 크레딧 알림 (Credit notifications)
  - 소식 알림 (News notifications)
  - 팔로우 알림 (Follow notifications)

**User Flow:**
1. Navigate to Settings → Notification settings
2. Screen loads current toggle states via GET /notifications/settings
3. Toggle any category ON or OFF → PUT /notifications/settings to save

**Visual Rules:**
- Each row is a full-width cell with label on the left and toggle switch on the right
- Toggle switches use the app's accent color for the ON state
- Clean, simple list layout

**Korean Labels:**
- Screen title: "알림 설정"
- Toggle labels: "좋아요 알림", "크레딧 알림", "소식 알림", "팔로우 알림"
