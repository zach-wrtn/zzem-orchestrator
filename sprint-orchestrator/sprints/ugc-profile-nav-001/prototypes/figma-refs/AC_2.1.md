# AC 2.1 — Profile Entry Points

## 홈_그리드피드 (node-id: 37160-76513)
### Design Tokens
- **Background**: `--background_primary` (white)
- **Text Primary**: `--text_primary` (#262626)
- **Surface Secondary**: `--surface_secondary` (#f7f7f7)
- **Text White**: `--text_white` (white)
- **Outline Primary**: `--outline_primary` (#f1f1f1)
- **Typography**:
  - Title/Title3-18: Pretendard Bold 18px / weight 700 / lineHeight 1.5
  - Subtitle/Subtitle4-16: Pretendard SemiBold 16px / weight 600 / lineHeight 1.5
  - Subtitle/Subtitle6-14: Pretendard SemiBold 14px / weight 600 / lineHeight 1.4
  - Subtitle/Subtitle7-12: Pretendard SemiBold 12px / weight 600 / lineHeight 1.5
  - Body/Body6-14: Pretendard Medium 14px / weight 500 / lineHeight 1.4
  - Body/Body7-12: Pretendard Medium 12px / weight 500 / lineHeight 1.5
  - Label/Label5-10: Pretendard Medium 10px / weight 500 / lineHeight 1.0

### Component Structure
- **Screen**: 375x812, rounded-[40px], overflow-y-auto
- **HeaderBar**: h-48, px-12, py-4 with Logo (32x32) + Coin icon + BellStroke icon
- **Contents**: flex-col, gap-12, pb-80 pt-58
  - **Menu**: horizontal row of 4 feature cards (surface_secondary bg, rounded-16)
    - Cards: "비디오 생성", "짤 생성", "짤 꾸미기", "사진 생성"
  - **Filter Cards**: horizontal scroll chips
  - **Grid Feed**: 2-column masonry layout (gap-px)
    - **Image_Thumbnail**: rounded-4, variable aspect ratios (187x187, 187x234)
      - Bottom gradient overlay: `linear-gradient(180deg, transparent 36%, rgba(19,19,19,0.2) 90%)`
      - Post Card Text: template name + profile avatar + username + like count
      - Post Card Icon: tag area + optional icon
- **BottomNavigation**: border-t-0.5 outline_primary, pb-26 pt-10 px-12
  - 3 tabs: Home (logo icon), Search, My (profile + notification dot)

### Reference Code
```tsx
import { BellStroke } from "./BellStroke"
import { ShinyecoFill } from "./ShinyecoFill"
import { ArrowshortrightStroke } from "./ArrowshortrightStroke"
import { HeartStroke } from "./HeartStroke"

// Screen: 홈_그리드피드 (37160:76513)
// Layout: background_primary, 375x812, rounded-40, overflow-y-auto
// HeaderBar: h-40, logo 32x32 + Coin icon + BellStroke + notification dot
// Menu: 4 feature cards in row, surface_secondary bg, rounded-16
// Grid: 2-column masonry, Image_Thumbnail with gradient overlay
// BottomNavigation: Home | Search | My (with dot indicator)
// Profile entry: BottomNavigation "My" tab (profile icon + dot badge)
```

---

## 탐색_그리드피드_스크롤 (node-id: 37160-77641)
### Design Tokens
- **Background**: `--background_primary` (white)
- **Text Primary**: `--text_primary` (#262626)
- **Text White**: `--text_white` (white)
- **Surface Secondary**: `--surface_secondary` (#f7f7f7)
- **Typography**:
  - Subtitle/Subtitle3-18: Pretendard SemiBold 18px / weight 600 / lineHeight 1.5
  - Subtitle/Subtitle6-14: Pretendard SemiBold 14px / weight 600 / lineHeight 1.4
  - Subtitle/Subtitle7-12: Pretendard SemiBold 12px / weight 600 / lineHeight 1.5
  - Label/Label5-10: Pretendard Medium 10px / weight 500 / lineHeight 1.0

### Component Structure
- **Screen**: 375w, rounded-40, overflow-y-auto, bg background_primary
- **Content Area**: pb-80 pt-105 (accounts for header + search bar)
- **Grid Feed** (list): 2-column layout (gap-px), rounded-24 container
  - **Image_Thumbnail**: rounded-4, variable aspect ratios
    - Gradient overlay same as home feed
    - Post Card Icon: tag + optional heart/lock icons
    - Post Card Text: template name (Subtitle6-14 white) + profile row (avatar 18x18 + username Subtitle7-12)
    - Like count with HeartStroke icon
  - Profile entry: Each thumbnail has a profile avatar (18x18, rounded-999, white border 1px) + username
- **BottomNavigation**: Same 3-tab pattern as Home

### Reference Code
```tsx
import { HeartStroke } from "./HeartStroke"

// Screen: 탐색_그리드피드_스크롤 (37160:77641)
// Layout: 375w, rounded-40, overflow-y-auto
// Grid: 2-column masonry (rounded-24 container), gap-px
// Image_Thumbnail: rounded-4, gradient overlay
//   - Post Card Text: template name + profile avatar (18x18, rounded-999) + username
//   - Like: HeartStroke icon + count (Subtitle6-14 white)
// Profile entry point: tapping user avatar/name in each post card
// BottomNavigation: Home | Search | My
```
