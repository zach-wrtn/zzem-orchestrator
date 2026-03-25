Design a mobile app screen for a Korean AI content creation app called "ZZEM" (짬).

Platform: iOS and Android (React Native)
Language: Korean (한국어) for all UI labels and text
Style: Modern, clean, minimal mobile app design
Theme: Dark theme with vibrant accent colors

---

## Screen: ProfileScreen

### Purpose
User profile with 3 tabs (게시물/비공개/좋아요). Shows profile image, nickname, follower/following/regenerated counts. Content grid in each tab. Other users see only 게시물 tab.

### Layout & Components

- **ProfileHeader**: Circular profile image (48px) on the left, nickname text beside it, 3 stat counters in a horizontal row (팔로워 / 팔로잉 / 재생성된) below or beside the nickname. Edit button and share button positioned on the right side of the header area.
- **ProfileEditButton**: Icon or text button on the right side of the header area. Navigates to profile edit screen.
- **ProfileShareButton**: Icon button next to the edit button. Triggers OS share sheet.
- **ProfileContentTabs**: 3 horizontal tabs (게시물 | 비공개 | 좋아요) below the header. Tappable and swipeable to switch between tabs.
- **ContentGrid**: 3-column square thumbnail grid layout within each tab. Scrollable vertically.
- **ContentGridItem**: Square thumbnail with like count overlay at bottom-left of each item.

### User Flow

1. MY tab navigates to own profile showing all 3 tabs
2. Switch between tabs by tapping tab labels or swiping horizontally
3. Tapping a grid item opens a vertical swipe feed scoped to the current tab's content
4. Share button triggers OS share sheet with a deeplink to the profile
5. Edit button navigates to the profile edit screen
6. When viewing another user's profile, only the 게시물 tab is shown

### Visual Rules

- Like count displays the actual number with no abbreviation (e.g., "1234" not "1.2K"), shown even when 0
- Sort order: Published and Private tabs sorted by creation date descending; Liked tab sorted by like timestamp descending
- Share generates a deeplink only, no OG image included
- Empty state messages shown when a tab has no content

### Korean Labels

- "게시물"
- "비공개"
- "좋아요"
- "팔로워"
- "팔로잉"
- "재생성된"
- "프로필 편집"
- "프로필 공유"
- "아직 게시물이 없습니다"
- "아직 비공개 콘텐츠가 없습니다"
- "아직 좋아요한 콘텐츠가 없습니다"
