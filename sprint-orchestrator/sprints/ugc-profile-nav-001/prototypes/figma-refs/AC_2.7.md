# AC 2.7 — 생성 후 프로필 랜딩

## MY_게시물탭_생성중 (node-id: 37172-28416)

### Design Tokens
- **Background**: `--background_primary` (white)
- **Text Primary**: `--text_primary` / `--text/text_primary` (#262626)
- **Text White**: `--text_white` (white)
- **Surface Button**: `--surface_button` (#f1f1f1)
- **Surface Secondary**: `--surface_secondary` (#f7f7f7)
- **Surface Primary Invert**: `--surface_primary_invert` (#262626)
- **Outline Primary**: `--outline_primary` (#f1f1f1)
- **Avatar Border**: rgba(136, 136, 136, 0.2)
- **Avatar BG (no data)**: #f5f3ff
- **Font**: Pretendard (SemiBold 600, Medium 500)
- **Typography**:
  - Subtitle3-18: SemiBold 18px / 1.5 (Header title)
  - Subtitle4-16: SemiBold 16px / 1.5 (Stats count, generating text)
  - Subtitle6-14: SemiBold 14px / 1.4 (Button labels, regenerate count)
  - Body7-12: Medium 12px / 1.5 (Stats labels)
  - Label5-10: Medium 10px / 1.0 (Bottom nav)
- **Spacing**: Profile section px-16 py-12, gap-16; buttons gap-6; header px-12 py-4
- **Radius**: Screen 40px, Avatar 999px, Buttons 12px, Thumbnails 4px, IconButton 8px
- **Sizes**: Profile avatar 100px, HeaderBar h-48, Button h-40, Bottom nav icon 28px, Tab h-46

### Component Structure
- Screen (375w, rounded-40)
  - Header
    - StatusBar (iOS)
    - HeaderBar: [empty IconButton] [아이디 title] [SettingStroke icon]
  - Contents
    - Section 01 (Profile area)
      - ProfileImg: Avatar_UserProfile (100x100, border rgba(136,136,136,0.2))
      - Data: 팔로워 / 팔로잉 / 재생성된 (3-column, equal flex)
      - Buttons: [프로필 편집] [프로필 공유] (flex row, gap-6, RegularButton)
    - Section 02 (Tab + Grid)
      - Tabmenu/Mytab: [MediaFill (active, underline)] [LockFill] [HeartFill]
      - 2-column masonry grid with Image_Thumbnails
        - First item: "생성중..." overlay with rotating LOGO spinner
        - Other items: normal thumbnails with gradient overlay + RegenerateStroke count
  - BottomNavigation: [Home] [Search] [My (active, dot indicator)]

### Reference Code
```tsx
// Key generating state thumbnail
<div className="aspect-[187/187] overflow-clip relative rounded-[4px] shrink-0 w-full"
  style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%), linear-gradient(90deg, rgb(247,247,247) 0%, rgb(247,247,247) 100%)" }}>
  <div className="absolute content-stretch flex flex-col gap-[8px] items-start left-[10px] top-[10px]">
    <div className="font-['Pretendard:SemiBold',sans-serif] text-[16px] text-[color:var(--text_white,white)]">
      <p className="leading-[1.5]">생성중...</p>
    </div>
  </div>
  <!-- Rotating LOGO spinner at center, -rotate-150 -->
</div>

// Profile stats section
<div className="flex items-center justify-center px-[40px]">
  <div className="flex flex-[1_0_0] flex-col items-center">
    <p className="font-['Pretendard:SemiBold'] text-[16px]">0</p>
    <p className="font-['Pretendard:Medium'] text-[12px]">팔로워</p>
  </div>
  <!-- 팔로잉, 재생성된 columns identical -->
</div>

// Action buttons
<div className="flex gap-[6px]">
  <div className="bg-[var(--surface_button,#f1f1f1)] flex-[1_0_0] h-[40px] rounded-[12px]">
    <p className="font-['Pretendard:SemiBold'] text-[14px]">프로필 편집</p>
  </div>
  <div className="bg-[var(--surface_button,#f1f1f1)] flex-[1_0_0] h-[40px] rounded-[12px]">
    <p className="font-['Pretendard:SemiBold'] text-[14px]">프로필 공유</p>
  </div>
</div>
```

---

## MY_게시물탭_생성실패 (node-id: 37172-28516)

### Design Tokens
- Same as 생성중 above, plus:
- **Background Primary 30p**: `--background_primary_30p` (rgba(255,255,255,0.3)) -- for close button on failed thumbnail

### Component Structure
- Identical to 생성중 except first thumbnail shows:
  - "생성 실패" text instead of "생성중..."
  - CancelStroke icon (X button) in top-right with semi-transparent white circle bg (24px, rounded-400)
  - No rotating spinner

### Reference Code
```tsx
// Failed state thumbnail
<div className="aspect-[187/187] overflow-clip relative rounded-[4px]"
  style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%), linear-gradient(90deg, rgb(247,247,247) 0%, rgb(247,247,247) 100%)" }}>
  <div className="absolute flex items-start justify-between left-[10px] top-[10px] w-[167px]">
    <div className="flex-[1_0_0]">
      <p className="font-['Pretendard:SemiBold'] text-[16px] text-white leading-[1.5] overflow-hidden text-ellipsis">생성 실패</p>
    </div>
    <div className="bg-[var(--background_primary_30p,rgba(255,255,255,0.3))] rounded-[400px] size-[24px]">
      <CancelStroke />
    </div>
  </div>
</div>
```

---

## MY_비공개탭_생성중 (node-id: 37172-28468)

### Design Tokens
- Same token set as 게시물탭_생성중

### Component Structure
- Same layout as 게시물탭 but with LockFill tab active (underline indicator on Lock tab)
- MediaFill tab is inactive (no underline)
- Grid shows 2 items: one generating thumbnail + one normal thumbnail (fewer items than 게시물탭)
- Generating thumbnail uses same "생성중..." overlay pattern

### Reference Code
```tsx
// Active Lock tab (비공개)
<div className="flex flex-col h-[46px] items-center justify-between overflow-clip pt-[10px] w-[120px]">
  <LockFill />
  <div className="bg-[var(--surface_primary_invert,#262626)] h-[2px] w-[60px]" /> <!-- active indicator -->
</div>
```

---

## MY_비공개탭_생성실패 (node-id: 37172-28896)

### Design Tokens
- Same as 비공개탭_생성중 plus `--background_primary_30p`

### Component Structure
- Same as 비공개탭_생성중 but first thumbnail shows "생성 실패" with CancelStroke close button
- Grid shows 2 items: one failed thumbnail + one normal thumbnail

### Reference Code
```tsx
// Failed thumbnail in private tab -- same pattern as 게시물탭_생성실패
<div className="aspect-[187/187] overflow-clip relative rounded-[4px]"
  style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%), linear-gradient(90deg, rgb(247,247,247) 0%, rgb(247,247,247) 100%)" }}>
  <div className="absolute flex items-start justify-between left-[10px] top-[10px] w-[167px]">
    <p className="font-['Pretendard:SemiBold'] text-[16px] text-white">생성 실패</p>
    <div className="bg-[rgba(255,255,255,0.3)] rounded-[400px] size-[24px]">
      <CancelStroke />
    </div>
  </div>
</div>
```
