# AC 2.2 — Profile Structure and Tabs

## MY_게시물탭_기본 (node-id: 37160-78421)
### Design Tokens
- **Background**: `--background_primary` (white)
- **Text Primary**: `--text/text_primary` (#262626)
- **Text White**: `--text_white` (white)
- **Surface Button**: `--surface_button` (#f1f1f1)
- **Surface Secondary**: `--surface_secondary` (#f7f7f7)
- **Surface Primary Invert**: `--surface_primary_invert` (#262626)
- **Outline Primary**: `--outline_primary` (#f1f1f1)
- **Avatar Border**: rgba(136, 136, 136, 0.2)
- **Avatar Fallback BG**: #f5f3ff
- **Typography**:
  - Subtitle/Subtitle3-18: Pretendard SemiBold 18px / weight 600 / lineHeight 1.5
  - Subtitle/Subtitle4-16: Pretendard SemiBold 16px / weight 600 / lineHeight 1.5
  - Subtitle/Subtitle6-14: Pretendard SemiBold 14px / weight 600 / lineHeight 1.4
  - Body/Body7-12: Pretendard Medium 12px / weight 500 / lineHeight 1.5
  - Label/Label5-10: Pretendard Medium 10px / weight 500 / lineHeight 1.0

### Component Structure
- **Header**: StatusBar + HeaderBar (h-48, px-12)
  - Center: "아이디" (Subtitle3-18)
  - Right: SettingStroke icon (p-4, rounded-8)
- **Profile Section** (01): px-16, py-12, gap-16
  - **ProfileImg**: 100x100, rounded-999, border 1px rgba(136,136,136,0.2)
    - nodata state + data state (bg #f5f3ff)
  - **Stats Row** (Data): px-40, 3 equal columns (flex-1)
    - Count: Subtitle4-16 SemiBold
    - Label: Body7-12 Medium ("팔로워", "팔로잉", "재생성된")
  - **Action Buttons**: 2 equal buttons, gap-6
    - RegularButton: h-40, surface_button bg, rounded-12, px-28 py-12
    - Labels: "프로필 편집", "프로필 공유" (Subtitle6-14)
- **Tab Section** (02): flex-1, overflow-y-auto
  - **Tabmenu/Mytab**: 3 tabs, each w-120, h-46, px-20
    - Active tab: underline 2px (surface_primary_invert), icon with MediaFill/LockFill/HeartFill
    - Icons: MediaFill (게시물), LockFill (비공개), HeartFill (좋아요)
  - **Grid**: 2-column masonry (gap-px)
    - Image_Thumbnail: rounded-4, variable aspect (187x187 or 187x234)
    - Gradient overlay: same bottom gradient
    - Post Card: tag + like count (RegenerateStroke icon)

### Reference Code
```tsx
import { SettingStroke } from "./SettingStroke"
import { MediaFill } from "./MediaFill"
import { LockFill } from "./LockFill"
import { HeartFill } from "./HeartFill"
import { RegenerateStroke } from "./RegenerateStroke"

// Screen: MY_게시물탭_기본 (37160:78421)
// Header: "아이디" center + SettingStroke right
// Profile: Avatar 100x100 rounded-999
// Stats: 팔로워 | 팔로잉 | 재생성된 (3-col flex)
// Buttons: "프로필 편집" | "프로필 공유" (h-40, rounded-12, surface_button)
// Tabs: MediaFill(active) | LockFill | HeartFill
// Active indicator: 2px bar, surface_primary_invert
// Grid: 2-col masonry, Image_Thumbnail + gradient + RegenerateStroke count
```

---

## MY_게시물탭_노데이터 (node-id: 37160-78429)
### Design Tokens
- Same as MY_게시물탭_기본 plus:
  - **Text Tertiary**: `--text_tertiary` (#8a8a8a)
  - Text/Text6-14: Pretendard Regular 14px / weight 400 / lineHeight 1.4

### Component Structure
- Identical Header + Profile + Stats + Buttons + Tabs as 게시물탭_기본
- **Empty State**: centered text "아직 게시물이 없어요"
  - Font: Text6-14 Regular, text_tertiary (#8a8a8a), opacity 80%
  - Position: centered in remaining space

### Reference Code
```tsx
import { SettingStroke } from "./SettingStroke"
import { MediaFill } from "./MediaFill"
import { LockFill } from "./LockFill"
import { HeartFill } from "./HeartFill"

// Screen: MY_게시물탭_노데이터 (37160:78429)
// Same layout as 게시물탭_기본
// Empty state: "아직 게시물이 없어요"
//   text_tertiary #8a8a8a, opacity 0.8, Text6-14 Regular, centered
```

---

## MY_비공개탭_피드있음 (node-id: 37160-78484)
### Design Tokens
- Same as MY_게시물탭_기본

### Component Structure
- Identical Header + Profile + Stats + Buttons
- **Tabs**: LockFill is now the active tab (underline indicator)
  - MediaFill (inactive) | LockFill (active, underline) | HeartFill (inactive)
- **Grid**: 2-column layout with private posts
  - Image_Thumbnail: each card shows LockFill icon in top-right area
  - Like count with RegenerateStroke icon
  - Gradient overlay same pattern

### Reference Code
```tsx
import { SettingStroke } from "./SettingStroke"
import { MediaFill } from "./MediaFill"
import { LockFill } from "./LockFill"
import { HeartFill } from "./HeartFill"
import { RegenerateStroke } from "./RegenerateStroke"

// Screen: MY_비공개탭_피드있음 (37160:78484)
// Active tab: LockFill (비공개) with underline indicator
// Grid: 2-col, each thumbnail has LockFill icon overlay (top-right)
// Post Card: RegenerateStroke + like count
```

---

## MY_비공개탭_노데이터 (node-id: 37160-78480)
### Design Tokens
- Same as MY_게시물탭_노데이터

### Component Structure
- Identical Header + Profile + Stats + Buttons
- **Tabs**: LockFill active tab with underline
- **Empty State**: "아직 비공개한 게시물이 없어요"
  - Text6-14 Regular, text_tertiary (#8a8a8a), opacity 80%

### Reference Code
```tsx
import { SettingStroke } from "./SettingStroke"
import { MediaFill } from "./MediaFill"
import { LockFill } from "./LockFill"
import { HeartFill } from "./HeartFill"

// Screen: MY_비공개탭_노데이터 (37160:78480)
// Active tab: LockFill with underline
// Empty state: "아직 비공개한 게시물이 없어요"
//   text_tertiary #8a8a8a, opacity 0.8, centered
```

---

## MY_좋아요탭_피드있음 (node-id: 37160-78478)
### Design Tokens
- Same as MY_게시물탭_기본 plus:
  - Subtitle/Subtitle7-12: Pretendard SemiBold 12px / weight 600 / lineHeight 1.5

### Component Structure
- Identical Header + Profile + Stats + Buttons
- **Tabs**: HeartFill is the active tab (underline indicator)
  - MediaFill (inactive) | LockFill (inactive) | HeartFill (active, underline)
- **Grid**: 2-column masonry with liked posts
  - Image_Thumbnail: standard layout (no lock icon)
  - Post Card Text includes: template name + profile avatar (18x18) + username + like count
  - HeartStroke icon for like indicator
  - RegenerateStroke for regeneration count

### Reference Code
```tsx
import { SettingStroke } from "./SettingStroke"
import { MediaFill } from "./MediaFill"
import { LockFill } from "./LockFill"
import { HeartFill } from "./HeartFill"
import { HeartStroke } from "./HeartStroke"
import { RegenerateStroke } from "./RegenerateStroke"

// Screen: MY_좋아요탭_피드있음 (37160:78478)
// Active tab: HeartFill (좋아요) with underline indicator
// Grid: 2-col masonry, posts show other users' content
// Post Card: template name + profile (18x18) + username + HeartStroke + count
```

---

## MY_좋아요탭_노데이터 (node-id: 37160-78482)
### Design Tokens
- Same as MY_게시물탭_노데이터

### Component Structure
- Identical Header + Profile + Stats + Buttons
- **Tabs**: HeartFill active tab with underline
- **Empty State**: "아직 좋아요한 게시물이 없어요"
  - Text6-14 Regular, text_tertiary (#8a8a8a), opacity 80%

### Reference Code
```tsx
import { SettingStroke } from "./SettingStroke"
import { MediaFill } from "./MediaFill"
import { LockFill } from "./LockFill"
import { HeartFill } from "./HeartFill"

// Screen: MY_좋아요탭_노데이터 (37160:78482)
// Active tab: HeartFill with underline
// Empty state: "아직 좋아요한 게시물이 없어요"
//   text_tertiary #8a8a8a, opacity 0.8, centered
```
