# AC 2.5 — 세로 스와이프 진입

## 상세_게시물탭_기본 (node-id: 37180-50042)
### Design Tokens
- **Colors:**
  - `--background_primary`: #1e1e1e (dark mode bg)
  - `--background_B1F`: #090909 (post card bg)
  - `--surface_hover`: rgba(255,255,255,0.1)
  - `--surface_primary_invert`: white
  - `--outline_primary`: #313131
  - `--text_primary`: white
  - `--text_white`: white
  - `--zzem_purple/500`: #8752fa (toggle active)
  - `--icon_white`: white
  - `--surface_secondary`: #313131
  - Button bg: rgba(255,255,255,0.2)
  - BottomDimmed: gradient transparent -> rgba(0,0,0,0.5)
- **Typography:**
  - Label/Lable5-10: Pretendard Medium 10px, lineHeight 1
  - Subtitle/Subtitle3-18: Pretendard SemiBold 18px, lineHeight 1.5
  - Subtitle/Subtitle6-14: Pretendard SemiBold 14px, lineHeight 1.4
  - Body/Body7-12: Pretendard Medium 12px, lineHeight 1.5
  - Text/Text7-12: Pretendard Regular 12px, lineHeight 1.5
  - SF Pro Semibold 15.858px (status bar time)
- **Shadows:**
  - shadow_medium: DROP_SHADOW #0000001A, offset(0,0), radius 15
  - shadow_strong: DROP_SHADOW #00000033, offset(0,0), radius 20
- **Spacing:**
  - HeaderBar: px-12, py-4, h-48
  - StatusBar: px-22, pt-20, pb-17
  - BottomNav: px-12, pt-10, pb-26
  - Button area: px-16, pb-16
  - Action btn gap: 6px
  - Side btn column gap: 20px (icons), 16px (between groups)
- **Border Radius:**
  - Device frame: 40px
  - Button: 12px
  - Toggle: 12px (track), 25px (thumb)
  - Image thumbnail: 8px
  - Avatar: 999px
  - VideoProgressBar: 50px

### Component Structure
- PostCard (full-screen image with blur bg + centered image)
- TopDimmed (rotated gradient overlay)
- BottomDimmed (gradient overlay)
- VideoProgressBar (2px white bar at 60% opacity)
- HeaderBar (back arrow + volume icon)
- Noti badge ("AI가 만드는 컨텐츠예요" with ShinyFill icon, 60% opacity)
- Section_CreatorInfo (avatar 36px + name + verified badge + template name)
- Side action buttons (HeartStroke, RegenerateStroke, UploadStroke, MorehStroke, ImageThumbnail)
- Bottom buttons ("다시 생성하기" + coin 120, "게시" + toggle ON purple)
- BottomNavigation (Home, Search, My)

### Reference Code
```tsx
// Key structure - PostCard detail view (게시물탭 기본)
// Full-screen post with blur background, action buttons on right side
// Toggle ON state: bg-[var(--zzem_purple/500,#8752fa)]
// Bottom buttons: "다시 생성하기" (Coin 120) + "게시" (toggle)
// Side buttons: heart, regenerate, upload, more, thumbnail
// Icons via Code Connect: VolumeFill, HeartStroke, RegenerateStroke, UploadStroke, MorehStroke, ShinyFill
```

---

## 상세_비공개탭_진입 (node-id: 37180-50652)
### Design Tokens
- **Colors:** Same as 기본 + toggle OFF state
  - Toggle OFF track: `--surface_primary_invert` white at opacity 40%
  - Toggle OFF thumb: left-aligned (5.88%)
- **Typography:**
  - Text/Text6-14: Pretendard Regular 14px, lineHeight 1.4 (prompt text)
  - All others same as 기본
- **Spacing:**
  - Prompt text area: mask-based fade, h-48, pb-20, pt-8, w-285

### Component Structure
- Same base layout as 게시물탭_기본
- Key differences:
  - No Image_Thumbnail in side buttons
  - Toggle is OFF (left-aligned, white track at 40% opacity)
  - Button label: "프롬프트 편집하기" (instead of "다시 생성하기")
  - Section_CreatorInfo shows user "아이디" (no verified badge)
  - Prompt text visible below creator info with mask fade effect

### Reference Code
```tsx
// Key difference from 기본:
// - Toggle OFF: bg-[var(--surface_primary_invert,white)] opacity-40, thumb left-[5.88%]
// - Button: "프롬프트 편집하기" + Coin 120
// - Prompt section with mask gradient fade (48px height, text overflow masked)
// - No image thumbnail in side action buttons
// - Creator without verified badge
```

---

## 상세_좋아요탭_타유저게시물 (node-id: 37180-50405)
### Design Tokens
- **Colors:** Same as 기본
  - Post card bg blur: blur-30px, opacity-40 (different from 기본's blur-20px, opacity-80)
- **Typography:**
  - Text/Text7-12: Pretendard Regular 12px (like/regen counts)
  - All others same as 기본

### Component Structure
- Same base layout as 게시물탭_기본
- Key differences:
  - HeartFill (filled heart) instead of HeartStroke
  - Like count "88" visible under heart
  - Regen count "88" visible under regenerate
  - Single bottom button: "템플릿 사용하기" + Coin 120 (full width)
  - No toggle button
  - Image uses different blur params (blur-30, opacity-40)
  - Creator info: "쨈" with verified badge + template name

### Reference Code
```tsx
// Key differences from 기본:
// - HeartFill (filled) with count "88"
// - RegenerateStroke with count "88"
// - Single CTA: "템플릿 사용하기" + Coin 120 (full width, no toggle)
// - Post blur: blur-[30px] opacity-40 (vs blur-[20px] opacity-80)
// Icons: VolumeFill, HeartFill, RegenerateStroke, UploadStroke, MorehStroke, ShinyFill
```

---

## 상세_좋아요탭_내게시물 (node-id: 37180-50535)
### Design Tokens
- **Colors:** Same as 기본 + toggle OFF state
- **Typography:** Same as 기본

### Component Structure
- Same base layout as 게시물탭_기본
- Key differences:
  - HeartFill (filled heart) with count "88"
  - Regen count "88" visible
  - Bottom buttons: "다시 생성하기" (Coin 120) + "게시" (toggle OFF)
  - Toggle OFF state (white track 40%, thumb left-aligned)
  - Creator: "쨈" with verified badge + template name

### Reference Code
```tsx
// Key differences from 기본:
// - HeartFill with count "88", RegenerateStroke with count "88"
// - Toggle OFF: opacity-40 track, thumb left-[5.88%]
// - Same two-button layout as 기본 but with OFF toggle
// Icons: VolumeFill, HeartFill, RegenerateStroke, UploadStroke, MorehStroke, ShinyFill
```

---

## 상세_비공개탭_커스텀프롬프트_바텀시트_게시안내 (node-id: 37180-50156)
### Design Tokens
- **Colors:**
  - `--dim_secondary`: rgba(0,0,0,0.4) (overlay dim)
  - `--surface_elevated`: white (bottom sheet bg)
  - `--icon_quaternary`: #a7a7a7 (sheet handle)
  - `--text_primary` (light mode): #262626
  - `--surface_primary_invert` (light mode): #262626 (confirm button bg)
  - `--text_primary_inverted`: #f7f7f7 (confirm button text)
- **Typography:**
  - Title/Title3-18: Pretendard Bold 18px, lineHeight 1.5 (sheet title)
  - Subtitle/Subtitle3-18: Pretendard SemiBold 18px, lineHeight 1.5 (confirm button)
- **Spacing:**
  - Bottom sheet: rounded-28px, overflow-clip
  - Sheet header: px-235, py-8 (handle bar area)
  - Handle bar: w-40, h-4, rounded-40px
  - Content: py-10, px-20
  - Emoji: 70x70px
  - Action button area: p-12
  - Confirm button: h-56, px-24, py-12, rounded-16px

### Component Structure
- Overlay dim (rgba(0,0,0,0.4)) over detail view
- BottomConfirmSheet:
  - Handle bar (40px wide, 4px height, #a7a7a7)
  - Emoji (01-4표정_윙크, 70x70)
  - Title text: "커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"
  - Confirm button: "확인" (dark bg, light text, full width)
- Background: same detail view layout (dimmed)

### Reference Code
```tsx
// BottomConfirmSheet overlay pattern:
// - Dim: bg-[var(--dim_secondary,rgba(0,0,0,0.4))] flex items-center justify-end
// - Sheet: bg-[var(--surface_elevated,white)] rounded-[28px]
// - Handle: bg-[var(--icon_quaternary,#a7a7a7)] h-[4px] w-[40px] rounded-[40px]
// - Emoji: 70x70 character illustration
// - Title: Pretendard Bold 18px, text-[var(--text_primary,#262626)]
// - Button: bg-[var(--surface_primary_invert,#262626)] h-[56px] rounded-[16px]
//   text: "확인", Pretendard SemiBold 18px, text-[var(--text_primary_inverted,#f7f7f7)]
```

---

## 상세_더보기_바텀시트_메뉴 (node-id: 37180-50473)
### Design Tokens
- **Colors:**
  - `--dim_secondary`: rgba(0,0,0,0.4)
  - `--surface_elevated`: white
  - `--icon/icon_quaternary`: #a7a7a7
  - `--text_primary` (light): #262626
  - `--function_red_3`: #d92800 (신고하기 text color)
- **Typography:**
  - Body/Body4-16: Pretendard Medium 16px, lineHeight 1.5 (menu items)
- **Spacing:**
  - Sheet: rounded-28px, pb-16px
  - Menu list: px-20, py-16, gap-20px between items
  - Menu item: gap-12px (icon to text), icon 24x24

### Component Structure
- Overlay dim over detail view
- BottomConfirmSheet (menu style):
  - Handle bar
  - Menu items list (vertical, gap 20px):
    1. DownloadStroke + "다운로드" (text_primary #262626)
    2. MailSendStroke + "의견 보내기" (text_primary #262626)
    3. SirenStroke + "신고하기" (function_red_3 #d92800)
- Background: same detail view (dimmed)

### Reference Code
```tsx
// Bottom sheet menu pattern:
// - Sheet: bg-[var(--surface_elevated,white)] rounded-[28px] pb-[16px]
// - Menu items: flex gap-[12px] items-center, icon 24x24 + text
// - Items: gap-[20px] between rows
// Menu items:
//   <DownloadStroke /> "다운로드" text-[var(--text_primary,#262626)]
//   <MailSendStroke /> "의견 보내기" text-[var(--text_primary,#262626)]
//   <SirenStroke /> "신고하기" text-[var(--function_red_3,#d92800)]
// Icons: DownloadStroke, MailSendStroke, SirenStroke
```

---

## 상세_더보기_신고하기 (node-id: 37180-50452)
### Design Tokens
- **Colors (Light mode):**
  - `--background_primary`: white
  - `--text/text_primary`: #262626
  - `--surface/surface_secondary`: #f7f7f7 (textfield bg)
  - `--outline_primary` (light): #f1f1f1 (textfield border)
  - `--text_placeholder_disable`: #c5c5c5 (placeholder + disabled button text)
  - `--surface/surface_disable`: #f1f1f1 (disabled button bg)
  - `--surface_primary_invert` (light): #262626 (status bar text)
- **Typography:**
  - Subtitle/Subtitle3-18: Pretendard SemiBold 18px, lineHeight 1.5 (header title, button)
  - Body/Body6-14: Pretendard Medium 14px, lineHeight 1.4 (input label, placeholder)
  - Body/Body7-12: Pretendard Medium 12px, lineHeight 1.5 (char counter)
- **Spacing:**
  - Content area: px-16, pt-20, pb-24, gap-8
  - Textfield: px-16, py-12, rounded-16px, gap-4 internal
  - Submit button area: px-16, pt-12, pb-32
  - Submit button: h-56, rounded-16px

### Component Structure
- Light mode full screen
- HeaderBar: back arrow + centered title "신고하기"
- Content:
  - Input label: "신고 사유"
  - Textfield (multiline):
    - Placeholder: "사유를 작성해주세요. (필수)"
    - Char counter: "0/100" (right-aligned)
    - Bg: surface_secondary, border: outline_primary
  - Submit button: "신고하기" (disabled state: surface_disable bg, placeholder text color)

### Reference Code
```tsx
// Report screen (light mode):
// - HeaderBar: back + centered "신고하기"
// - Input: label "신고 사유"
// - Textfield: bg-[var(--surface/surface_secondary,#f7f7f7)]
//   border-[var(--outline_primary,#f1f1f1)] rounded-[16px] px-[16px] py-[12px]
//   placeholder: "사유를 작성해주세요. (필수)" color: var(--text_placeholder_disable,#c5c5c5)
//   counter: "0/100" right-aligned, Body7-12
// - Button disabled: bg-[var(--surface/surface_disable,#f1f1f1)]
//   text-[var(--text/text_placeholder_disable,#c5c5c5)] h-[56px] rounded-[16px]
```

---

## 상세_더보기_다운로드 (node-id: 37180-50496)
### Design Tokens
- **Colors:** Same as 게시물탭_기본 +
  - Toast bg: `--surface/surface_secondary_invert`: #f2f2f2
  - Toast text: `--text/text_primary_invert`: #090909
- **Typography:**
  - Subtitle/Subtitle4-14: Pretendard SemiBold 14px, lineHeight 1.4 (toast text)
  - All others same as 기본
- **Shadows:**
  - Toast shadow: 0px 0px 20px rgba(0,0,0,0.2)
- **Spacing:**
  - Toast: px-24, py-8, rounded-40px, centered at top-40px

### Component Structure
- Same base layout as 게시물탭_기본
- Key addition: ToastMessages overlay at top
  - Centered horizontally, top 40px
  - Rounded pill shape (40px radius)
  - Text: "앨범에 저장됐어요"
  - Bg: surface_secondary_invert #f2f2f2
  - Shadow: strong shadow
- Toggle OFF state on bottom buttons

### Reference Code
```tsx
// Toast message pattern:
// - Position: absolute, centered horizontally, top-[40px]
// - Style: bg-[var(--surface/surface_secondary_invert,#f2f2f2)]
//   rounded-[40px] px-[24px] py-[8px]
//   shadow-[0px_0px_20px_0px_rgba(0,0,0,0.2)]
// - Text: "앨범에 저장됐어요", Pretendard SemiBold 14px
//   text-[var(--text/text_primary_invert,#090909)]
```

---

## Cross-Frame Design Token Summary

### Consistent Color System (Dark Mode Post Detail)
| Token | Value | Usage |
|-------|-------|-------|
| `--background_primary` | #1e1e1e | Main dark bg |
| `--background_B1F` | #090909 | Post card bg |
| `--surface_hover` | rgba(255,255,255,0.1) | Progress bar track |
| `--surface_primary_invert` | white | Progress bar fill, toggle |
| `--outline_primary` | #313131 | Bottom nav border |
| `--text_white` | white | Button text, counts |
| `--icon_white` | white | Toggle thumb, thumbnail border |
| `--zzem_purple/500` | #8752fa | Toggle ON track |
| `--surface_secondary` | #313131 | Thumbnail placeholder |

### Consistent Color System (Light Mode Sheets/Pages)
| Token | Value | Usage |
|-------|-------|-------|
| `--dim_secondary` | rgba(0,0,0,0.4) | Bottom sheet overlay |
| `--surface_elevated` | white | Bottom sheet bg |
| `--icon_quaternary` | #a7a7a7 | Sheet handle |
| `--text_primary` | #262626 | Primary text (light) |
| `--function_red_3` | #d92800 | Report/danger text |
| `--surface_disable` | #f1f1f1 | Disabled button bg |
| `--text_placeholder_disable` | #c5c5c5 | Placeholder/disabled text |

### Shared Typography Scale
| Style | Font | Size | Weight | LineHeight |
|-------|------|------|--------|------------|
| Label/Lable5-10 | Pretendard Medium | 10px | 500 | 1.0 |
| Body/Body7-12 | Pretendard Medium | 12px | 500 | 1.5 |
| Body/Body6-14 | Pretendard Medium | 14px | 500 | 1.4 |
| Body/Body4-16 | Pretendard Medium | 16px | 500 | 1.5 |
| Text/Text7-12 | Pretendard Regular | 12px | 400 | 1.5 |
| Text/Text6-14 | Pretendard Regular | 14px | 400 | 1.4 |
| Subtitle/Subtitle6-14 | Pretendard SemiBold | 14px | 600 | 1.4 |
| Subtitle/Subtitle3-18 | Pretendard SemiBold | 18px | 600 | 1.5 |
| Title/Title3-18 | Pretendard Bold | 18px | 700 | 1.5 |

### Shared Component Patterns
- **PostCard:** Full-screen image with blur bg (blur-20/30px), centered content, top/bottom dimmed gradients
- **VideoProgressBar:** 2px white bar at 60% opacity on surface_hover track
- **Side Action Buttons:** Vertical column (28px wide), gap-20px icons, gap-16px groups, shadow_strong
- **RegularButton:** h-40, rounded-12px, bg rgba(255,255,255,0.2), SemiBold 14px white
- **Toggle:** 34x20px, rounded-12px track, 16px rounded-25px thumb, shadow on thumb
- **BottomSheet:** rounded-28px, handle 40x4px, dim overlay rgba(0,0,0,0.4)
- **Avatar_UserProfile:** 36x36px, rounded-999px, border 0.36px rgba(136,136,136,0.2)
- **ToastMessages:** Pill shape rounded-40px, shadow_strong, centered top
- **BottomNavigation:** 3 tabs (Home, Search, My), border-top 0.5px
- **HeaderBar:** h-48px, back arrow left, utility icons right

### Code Connect Icons Used
- `VolumeFill` (header)
- `HeartStroke` / `HeartFill` (like button)
- `RegenerateStroke` (regen button)
- `UploadStroke` (share button)
- `MorehStroke` (more options)
- `ShinyFill` (AI noti badge)
- `DownloadStroke` (menu item)
- `MailSendStroke` (menu item)
- `SirenStroke` (report menu item)
