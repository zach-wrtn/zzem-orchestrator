# AC 7.1 — 타 유저 프로필

## 타유저_프로필_팔로우전 (node-id: 37160-78423)

### Design Tokens
- **Background**: `--background_primary` (white)
- **Text Primary**: `--text_primary` / `--text/text_primary` (#262626)
- **Text White**: `--text_white` (white)
- **Surface Secondary**: `--surface_secondary` (#f7f7f7)
- **Surface Primary Invert**: `--surface_primary_invert` (#262626)
- **Outline Primary**: `--outline_primary` (#f1f1f1)
- **Avatar Border**: rgba(136, 136, 136, 0.2)
- **Avatar BG**: #f5f3ff
- **Font**: Pretendard (SemiBold 600, Medium 500)
- **Typography**:
  - Subtitle3-18: SemiBold 18px / 1.5 (Header title)
  - Subtitle4-16: SemiBold 16px / 1.5 (Stats count)
  - Subtitle6-14: SemiBold 14px / 1.4 (Regenerate count)
  - Body7-12: Medium 12px / 1.5 (Stats labels)
  - Label5-10: Medium 10px / 1.0 (Bottom nav)
- **Spacing**: Profile section px-16 pt-12 pb-24 gap-16
- **Radius**: Screen 40px, Avatar 999px, Thumbnails 4px
- **Gradient overlay on thumbnails**: linear-gradient from transparent to rgba(19,19,19,0.2)

### Component Structure
- Screen (375w, rounded-40, overflow scroll)
  - Header
    - StatusBar (iOS)
    - HeaderBar: [empty back button 32x32] [아이디 + emoji_neutral_fill 14px] [MorehStroke icon]
  - Contents
    - Section 01 (Profile area, NO action buttons unlike MY profile)
      - ProfileImg: Avatar_UserProfile (100x100, no nodata layer -- only data layer)
      - Data: 팔로워 / 팔로잉 / 재생성된 (3-column, same as MY)
      - NO buttons (프로필 편집/공유 absent)
      - NO tab menu (게시물/비공개/좋아요 tabs absent)
    - Section 02 (Grid only, direct grid without tabs)
      - 2-column masonry grid with Image_Thumbnails
      - Standard thumbnail with gradient overlay + RegenerateStroke count
  - BottomNavigation: [Home] [Search] [My (with dot)]

### Key Differences from MY Profile
- Header: uses MorehStroke (more menu) instead of SettingStroke
- Header: shows emoji_neutral_fill badge next to username
- No "프로필 편집" / "프로필 공유" buttons
- No tab menu (게시물/비공개/좋아요)
- Direct grid view without tab navigation

### Reference Code
```tsx
// Other user header with emoji badge
<div className="flex gap-[4px] items-center">
  <p className="font-['Pretendard:SemiBold'] text-[18px] text-center">아이디</p>
  <div className="size-[14px]">
    <img src={imgEmojiNeutralFill} /> {/* emoji badge */}
  </div>
</div>
<div className="flex items-center">
  <MorehStroke /> {/* more menu instead of settings */}
</div>

// No buttons, no tabs -- grid directly after stats
```

---

## 타유저_프로필_맞팔로우 (node-id: 37160-78425)

### Design Tokens
- Same as 팔로우전

### Component Structure
- Identical layout to 팔로우전
- Difference is in follow state (맞팔로우 = mutual follow)
- Note: The follow button state is not directly visible in the grid-only layout from Figma -- this frame represents the screen appearance when both users follow each other

### Reference Code
```tsx
// Same structure as 팔로우전 -- mutual follow state
// Follow state indicated by context, not visible UI difference in grid view
```

---

## 타유저_프로필_팔로잉 (node-id: 37160-78427)

### Design Tokens
- Same as 팔로우전

### Component Structure
- Identical layout to 팔로우전
- Represents the state where the current user is following this other user
- Grid content and layout remain the same

### Reference Code
```tsx
// Same structure as 팔로우전 -- following state
```

---

## 타유저_프로필URL복사 (node-id: 37160-80879)

### Design Tokens
- Same as 팔로우전, plus:
- **Surface Secondary Invert**: `--surface/surface_secondary_invert` (#171717) -- toast bg
- **Text Primary Invert**: `--text/text_primary_invert` (white) -- toast text
- **Shadow Strong**: `shadow_strong` -- drop-shadow(0px 0px 20px rgba(0,0,0,0.2))
- **Subtitle4-14**: SemiBold 14px / 1.4 (toast message text)

### Component Structure
- Same base layout as 타유저_프로필
- **Toast overlay** at top (absolute positioned):
  - Centered horizontally, top-40px
  - Dark pill-shaped toast: bg #171717, rounded-40, px-24 py-8
  - Shadow: 0px 0px 20px rgba(0,0,0,0.2)
  - Text: "프로필 링크를 클립보드에 복사했어요" (SemiBold 14px, white)

### Reference Code
```tsx
// Toast message component
<div className="-translate-x-1/2 absolute left-1/2 top-[40px]
  bg-[var(--surface/surface_secondary_invert,#171717)]
  flex items-center justify-center
  px-[24px] py-[8px] rounded-[40px]
  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.2)]">
  <p className="font-['Pretendard:SemiBold'] text-[14px] text-white text-center whitespace-nowrap leading-[1.4]">
    프로필 링크를 클립보드에 복사했어요
  </p>
</div>
```

---

## 타유저_더보기메뉴 (node-id: 37160-80881)

### Design Tokens
- Same as 팔로우전, plus:
- **Dim Secondary**: `--dim_secondary` (rgba(0,0,0,0.4)) -- overlay backdrop
- **Surface Elevated**: `--surface_elevated` (white) -- bottom sheet bg
- **Icon Quaternary**: `--icon/icon_quaternary` (#c5c5c5) -- bottom sheet handle
- **Body4-16**: Medium 16px / 1.5 (menu item text)

### Component Structure
- Same base layout as 타유저_프로필
- **Bottom sheet overlay** (full screen dim):
  - Dim backdrop: rgba(0,0,0,0.4), rounded-40
  - BottomConfirmSheet: white bg, rounded-28, pb-16
    - Handle bar: 40w x 4h, rounded-40, bg #c5c5c5, centered px-235 py-8
    - Menu list:
      - Item: [LinkStroke icon] + "프로필 URL 복사" (Medium 16px, gap-12, px-20 py-16)

### Reference Code
```tsx
// Bottom sheet more menu
<div className="absolute bg-[rgba(0,0,0,0.4)] flex flex-col items-center justify-end
  h-[812px] w-[375px] px-[12px] py-[32px] rounded-[40px]">
  <div className="bg-[var(--surface_elevated,white)] rounded-[28px] w-[351px] pb-[16px]">
    {/* Handle */}
    <div className="flex items-center justify-center py-[8px]">
      <div className="bg-[var(--icon/icon_quaternary,#c5c5c5)] h-[4px] rounded-[40px] w-[40px]" />
    </div>
    {/* Menu item */}
    <div className="flex gap-[12px] items-center px-[20px] py-[16px]">
      <LinkStroke />
      <p className="font-['Pretendard:Medium'] text-[16px] flex-[1_0_0]">
        프로필 URL 복사
      </p>
    </div>
  </div>
</div>
```
