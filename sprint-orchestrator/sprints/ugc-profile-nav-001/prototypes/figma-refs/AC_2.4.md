# AC 2.4 — 프로필 편집

## 프로필편집_메인 (node-id: 37160-79939)

### Design Tokens
- **Colors:**
  - background_primary: white
  - text_primary: #262626
  - text_secondary: #545454
  - surface_secondary: #f7f7f7
  - surface_tertiary: #e2e2e2
  - surface_disable: #f1f1f1
  - text_placeholder_disable: #c5c5c5
  - outline_primary: #f1f1f1
  - Avatar border: rgba(136,136,136,0.2)
- **Typography:**
  - Subtitle3-18: Pretendard SemiBold 18px, lineHeight 1.5 (header title)
  - Body6-14: Pretendard Medium 14px, lineHeight 1.4 (label, input text)
- **Spacing:**
  - Content padding: px-[16px]
  - Profile section: py-[12px]
  - Input label-field gap: 8px
  - Input label padding: px-[4px]
  - Textfield padding: px-[16px] py-[12px]
  - Bottom button area: pb-[32px] pt-[12px] px-[16px]
- **Sizing:**
  - Avatar: 100x100, rounded-[999px]
  - Camera icon button: 24x24, rounded-[400px], border-4 white
  - Save button: h-[56px], rounded-[16px]
  - Textfield: w-[335px], rounded-[16px]
  - Header height: 48px
  - Back icon: 24x24

### Component Structure
- HeaderBar
  - StatusBar (iOS)
  - Navigation bar (back arrow + centered title "프로필 편집")
- Contents (flex-1, scrollable)
  - Profile section
    - Avatar_UserProfile (100x100 circle with nodata placeholder)
    - CameraFill icon button (bottom-right of avatar)
  - Input section
    - Label: "닉네임"
    - Textfield: "김잼잼" (current nickname)
- Bottom Button
  - RegularButton: "저장" (disabled state: bg-surface_disable, text-placeholder_disable)

### Reference Code
```tsx
import { CameraFill } from "./CameraFill"

// Profile avatar with camera button
<div className="relative size-[100px]">
  <div className="absolute border border-[rgba(136,136,136,0.2)] rounded-[999px] size-[100px]">
    <img src={imgNodata} className="absolute size-full" />
  </div>
  <div className="absolute bg-[var(--surface_tertiary,#e2e2e2)] border-4 border-white bottom-[4px] right-[4px] rounded-[400px] size-[24px] flex items-center justify-center">
    <CameraFill />
  </div>
</div>

// Textfield
<div className="bg-[var(--surface_secondary,#f7f7f7)] border border-[var(--outline_primary,#f1f1f1)] px-[16px] py-[12px] rounded-[16px] w-[335px]">
  <p className="font-['Pretendard:Medium'] text-[14px] text-[var(--text_primary,#090909)]">김잼잼</p>
</div>

// Save button (disabled)
<div className="bg-[var(--surface_disable,#f1f1f1)] h-[56px] flex items-center justify-center rounded-[16px]">
  <p className="font-['Pretendard:SemiBold'] text-[18px] text-[var(--text_placeholder_disable,#c5c5c5)]">저장</p>
</div>
```

---

## 프로필편집_닉네임_키보드 (node-id: 37160-80000)

### Design Tokens
- Same base layout as 프로필편집_메인
- **Additional — iOS Keyboard:**
  - Background: bg-[rgba(212,212,212,0.74)] with mix-blend-luminosity
  - Key background: bg-[rgba(255,255,255,0.3)] + bg-[#333] mix-blend-plus-lighter
  - Key text: #595959, SF Compact Regular 25px
  - Return key: bg-[#08f], text-white, SF Pro Regular 19px
  - Keyboard border-radius: top corners 27px
  - Key height: 45px, key border-radius: 8.5px
  - Row gap: 6px between keys, 11px between rows

### Component Structure
- Same as 프로필편집_메인 layout
- iOS QWERTY keyboard overlay at bottom
  - 4 rows: letters, shifted letters, bottom row (ABC/space/return)
  - Emoji and Mic buttons below keyboard

### Reference Code
```tsx
// Keyboard is iOS system component - not implemented in app code
// Key insight: textfield is focused, keyboard is visible
// Same profile edit layout with keyboard overlay
```

---

## 프로필편집_닉네임_바텀시트_나가기확인 (node-id: 37160-79969)

### Design Tokens
- **Bottom Sheet (BottomConfirmSheet):**
  - bg-[var(--surface_elevated,white)]
  - rounded-[28px]
  - Handle bar: bg-[var(--icon_quaternary,#a7a7a7)], h-[4px] w-[40px], rounded-[40px]
- **Dim overlay:** bg-[var(--dim_secondary,rgba(0,0,0,0.4))]
- **Typography:**
  - Title3-18: Pretendard Bold 18px, lineHeight 1.5 (dialog title)
  - Subtitle3-18: Pretendard SemiBold 18px (button text)
- **Button colors:**
  - Cancel: bg-[var(--surface_hover,rgba(0,0,0,0.1))], text-[var(--text_secondary,#656565)]
  - Confirm: bg-[var(--surface_primary_invert,#262626)], text-[var(--text_primary_inverted,#f7f7f7)]
- **Spacing:**
  - Sheet inner padding: p-[12px] for buttons
  - Text area padding: px-[20px]
  - Button gap: 6px between cancel/confirm
  - Button height: 56px
  - Dim padding: pb-[32px] px-[12px]

### Component Structure
- Background: Profile edit screen (nickname changed to "잼잼잼", save enabled)
- Dim overlay (full screen)
- BottomConfirmSheet
  - Handle bar
  - TextArea: "수정사항이 있습니다. 그래도 나가시겠습니까?"
  - ActionButtonArea
    - Cancel button ("취소")
    - Confirm button ("확인")

### Reference Code
```tsx
// BottomConfirmSheet
<div className="bg-[var(--surface_elevated,white)] flex flex-col gap-[8px] rounded-[28px] w-full overflow-clip">
  {/* Handle */}
  <div className="flex items-center justify-center py-[8px]">
    <div className="bg-[var(--icon_quaternary,#a7a7a7)] h-[4px] w-[40px] rounded-[40px]" />
  </div>
  {/* Text */}
  <div className="px-[20px]">
    <p className="font-['Pretendard:Bold'] text-[18px] text-[var(--text_primary,#262626)]">
      수정사항이 있습니다.{'\n'}그래도 나가시겠습니까?
    </p>
  </div>
  {/* Buttons */}
  <div className="flex gap-[6px] p-[12px]">
    <div className="bg-[var(--surface_hover,rgba(0,0,0,0.1))] flex-1 h-[56px] flex items-center justify-center rounded-[16px]">
      <p className="font-['Pretendard:SemiBold'] text-[18px] text-[var(--text_secondary,#656565)]">취소</p>
    </div>
    <div className="bg-[var(--surface_primary_invert,#262626)] flex-1 h-[56px] flex items-center justify-center rounded-[16px]">
      <p className="font-['Pretendard:SemiBold'] text-[18px] text-[var(--text_primary_inverted,#f7f7f7)]">확인</p>
    </div>
  </div>
</div>
```

---

## MY_프로필_닉네임변경완료 (node-id: 37160-79937)

### Design Tokens
- **Toast message:**
  - bg-[var(--surface_secondary_invert,#171717)]
  - text-[var(--text_primary_invert,white)]
  - Subtitle6-14: Pretendard SemiBold 14px, lineHeight 1.4
  - px-[24px] py-[8px], rounded-[40px]
  - shadow_strong: 0px 0px 20px rgba(0,0,0,0.2)
  - Position: centered horizontally, top-[40px]
- **Profile section:**
  - Avatar: 100x100 with profile image (bg-[#f5f3ff] placeholder)
  - Stats (팔로워/팔로잉/재생성된): Subtitle4-16 for numbers, Body7-12 for labels
  - Buttons: "프로필 편집", "프로필 공유" — bg-surface_button(#f1f1f1), h-[40px], rounded-[12px]
  - Subtitle6-14: Pretendard SemiBold 14px for button text
- **Tab menu:**
  - Active tab indicator: bg-surface_primary_invert (#262626), h-[2px] w-[60px]
  - Tab width: 120px each, border-bottom outline_primary
  - Icons: MediaFill, LockFill, HeartFill (Code Connect)
- **Image grid:**
  - 2-column masonry layout, 1px gap
  - Thumbnail border-radius: 4px
  - Gradient overlay on thumbnails for text readability
  - Regenerate count: Subtitle6-14 white text
- **Bottom navigation:**
  - border-top: 0.5px outline_primary
  - pb-[26px] pt-[10px]
  - Label: Label5-10 Pretendard Medium 10px

### Component Structure
- Header (StatusBar + HeaderBar with 아이디 + settings icon)
- Contents
  - Profile section (avatar + stats + edit/share buttons)
  - Tab menu (미디어/비공개/좋아요)
  - 2-column image grid (masonry)
- Toast: "프로필이 변경됐어요"
- BottomNavigation (Home, Search, My)

### Reference Code
```tsx
import { SettingStroke, MediaFill, LockFill, HeartFill, RegenerateStroke } from "./icons"

// Toast message
<div className="absolute top-[40px] left-1/2 -translate-x-1/2 bg-[var(--surface_secondary_invert,#171717)] px-[24px] py-[8px] rounded-[40px] shadow-[0px_0px_20px_rgba(0,0,0,0.2)]">
  <p className="font-['Pretendard:SemiBold'] text-[14px] text-white">프로필이 변경됐어요</p>
</div>

// Profile edit/share buttons
<div className="flex gap-[6px] w-full">
  <div className="bg-[var(--surface_button,#f1f1f1)] flex-1 h-[40px] flex items-center justify-center rounded-[12px]">
    <p className="font-['Pretendard:SemiBold'] text-[14px]">프로필 편집</p>
  </div>
  <div className="bg-[var(--surface_button,#f1f1f1)] flex-1 h-[40px] flex items-center justify-center rounded-[12px]">
    <p className="font-['Pretendard:SemiBold'] text-[14px]">프로필 공유</p>
  </div>
</div>
```

---

## 프로필편집_닉네임_저장가능 (node-id: 37160-79954)

### Design Tokens
- Same layout as 프로필편집_메인
- **Save button (enabled):**
  - bg-[var(--surface_primary_invert,#262626)]
  - text-[var(--text_primary_inverted,#f7f7f7)]
  - h-[56px], rounded-[16px]
- Nickname changed to "잼잼잼"

### Component Structure
- Identical to 프로필편집_메인 except:
  - Textfield value: "잼잼잼" (modified)
  - Save button: enabled state (dark bg, light text)

### Reference Code
```tsx
// Save button (enabled state)
<div className="bg-[var(--surface_primary_invert,#262626)] flex-1 h-[56px] flex items-center justify-center rounded-[16px]">
  <p className="font-['Pretendard:SemiBold'] text-[18px] text-[var(--text_primary_inverted,#f7f7f7)]">저장</p>
</div>
```

---

## 프로필편집_사진_바텀시트_선택 (node-id: 37160-80034)

### Design Tokens
- **Bottom sheet (photo options):**
  - bg-[var(--surface_elevated,white)], rounded-[28px]
  - Handle bar: same as confirm sheet
  - List item gap: 20px, padding: px-[20px] py-[16px]
  - Icon-text gap: 12px
  - Delete text color: var(--function_red_3, #d92800)
- **Typography:**
  - Body4-16: Pretendard Medium 16px, lineHeight 1.5 (list item text)
- **Icons (Code Connect):**
  - ImageStroke — for "카메라/앨범"
  - TrashStroke — for "사진 삭제"

### Component Structure
- Background: Profile edit screen (disabled save state)
- Dim overlay
- BottomSheet (photo action options)
  - Handle bar
  - List items:
    - ImageStroke + "카메라/앨범"
    - TrashStroke + "사진 삭제" (red destructive text)

### Reference Code
```tsx
import { ImageStroke } from "./ImageStroke"
import { TrashStroke } from "./TrashStroke"

// Photo action bottom sheet
<div className="bg-[var(--surface_elevated,white)] flex flex-col rounded-[28px] pb-[16px] overflow-clip">
  <div className="flex items-center justify-center py-[8px]">
    <div className="bg-[var(--icon_quaternary,#a7a7a7)] h-[4px] w-[40px] rounded-[40px]" />
  </div>
  <div className="flex flex-col gap-[20px] px-[20px] py-[16px]">
    <div className="flex gap-[12px] items-center">
      <ImageStroke />
      <p className="font-['Pretendard:Medium'] text-[16px] text-[var(--text_primary,#262626)]">카메라/앨범</p>
    </div>
    <div className="flex gap-[12px] items-center">
      <TrashStroke />
      <p className="font-['Pretendard:Medium'] text-[16px] text-[var(--function_red_3,#d92800)]">사진 삭제</p>
    </div>
  </div>
</div>
```

---

## 프로필편집_사진_저장가능 (node-id: 37160-80066)

### Design Tokens
- Same as 프로필편집_메인 layout
- **Avatar with photo:**
  - bg-[#f5f3ff] placeholder background
  - Profile image overlay in rounded-[999px] clip
- Save button: enabled (dark bg)

### Component Structure
- Profile edit screen with custom photo loaded in avatar
- Nickname unchanged ("김잼잼")
- Save button enabled (photo changed triggers dirty state)

### Reference Code
```tsx
// Avatar with custom photo
<div className="absolute border border-[rgba(136,136,136,0.2)] rounded-[999px] size-[100px]">
  <img src={imgNodata} className="absolute size-full" /> {/* fallback */}
  <div className="absolute bg-[#f5f3ff] rounded-[999px] size-[100px] overflow-clip">
    <img src={imgImg} className="absolute size-full" width={100} height={100} />
  </div>
</div>
```

---

## 프로필편집_사진_바텀시트_나가기확인 (node-id: 37160-80081)

### Design Tokens
- Identical to 프로필편집_닉네임_바텀시트_나가기확인
- Same BottomConfirmSheet with "수정사항이 있습니다. 그래도 나가시겠습니까?"
- Same cancel/confirm button pair

### Component Structure
- Background: Profile edit screen with photo changed + save enabled
- Dim overlay
- BottomConfirmSheet (same as nickname exit confirm)

### Reference Code
```tsx
// Same BottomConfirmSheet pattern as nickname exit confirm
// See 프로필편집_닉네임_바텀시트_나가기확인 (37160-79969) for full code
```

---

## 프로필편집_사진_크롭 (node-id: 37160-80112)

### Design Tokens
- **Colors:**
  - surface_primary_invert: #262626 (bottom button + bottom bar)
  - text_primary_inverted: #f7f7f7
  - surface_white: white (crop border)
- **Typography:**
  - Subtitle3-18: Pretendard SemiBold 18px (header "크기 설정", button "완료")
- **Sizing:**
  - Crop area: full width, flex-1
  - Bottom button: h-[56px], full width, px-[105px]
  - Bottom safe area: h-[32px], bg-surface_primary_invert
  - Corner handles: 27x27 each (4 corners)

### Component Structure
- HeaderBar (back + "크기 설정" title)
- Crop area
  - Background overlay image
  - Source image
  - 4 corner resize handles (Union SVG icons)
- Fixed bottom button: "완료" (full-width dark)
- Bottom safe area bar

### Reference Code
```tsx
// Crop screen layout
<div className="bg-[var(--background_primary,white)] flex flex-col items-center overflow-clip rounded-[40px]">
  {/* Header */}
  <div className="flex h-[48px] items-center pl-[12px] pr-[44px] py-[4px] w-full">
    {/* Back button + "크기 설정" title */}
  </div>

  {/* Crop area with corner handles */}
  <div className="border border-white flex-1 flex flex-col w-full">
    <img src={imgSource} className="absolute inset-0 object-cover size-full" />
    {/* 4 corner Union handles at 27x27 */}
  </div>

  {/* Submit button */}
  <div className="bg-[var(--surface_primary_invert,#262626)] h-[56px] flex items-center justify-center w-full">
    <p className="font-['Pretendard:SemiBold'] text-[18px] text-[var(--text_primary_inverted,#f7f7f7)]">완료</p>
  </div>
  <div className="bg-[var(--surface_primary_invert,#262626)] h-[32px] w-full" />
</div>
```

---

## 프로필편집_사진_앨범선택 (node-id: 37160-80126)

### Design Tokens
- **Album picker header:**
  - Close icon: CancelStroke in bg-surface_secondary(#f7f7f7), rounded-[400px], 24x24
  - Title: "최근 항목" Subtitle4-16 + ArrowshortdownStroke dropdown
  - Done text: "완료" Subtitle6-14, text-[var(--zzem_purple/500, #8752fa)]
- **Photo grid:**
  - 3-column layout, 2px gap between cells
  - Cell height: 120px
  - First cell: camera placeholder (bg-surface_quaternary #d3d3d3, CameraFill icon)
  - Selected cell: border-2 border-[var(--zzem_purple/500, #8752fa)]
  - Select icon (default): border border-outline_secondary(#e2e2e2), rounded-[999px], 20x20
  - Select icon (active): bg-[var(--zzem_purple/500, #8752fa)], CheckStroke icon
- **Typography:**
  - Header2-32: Pretendard Bold 32px, lineHeight 1.2 (mission title, not relevant here)
  - Subtitle4-16: Pretendard SemiBold 16px
  - Subtitle6-14: Pretendard SemiBold 14px
- **Sheet:**
  - bg-surface_elevated(white), rounded-tl/tr-[12px]
  - Handle bar: bg-icon_quaternary(#a7a7a7), h-[4px] w-[40px]
- **Key color — zzem_purple/500: #8752fa**

### Component Structure
- Background: App screen (partially visible)
- OptionAlbumSection (bottom sheet, full height from top-44px)
  - Handle bar
  - Header row (close, "최근 항목" dropdown, "완료")
  - Photo grid (3 columns)
    - Camera cell (first position)
    - Photo cells with selection checkboxes
    - Selected photo: purple border + filled checkbox

### Reference Code
```tsx
import { CancelStroke, ArrowshortdownStroke, CameraFill, CheckStroke } from "./icons"

// Album header
<div className="flex gap-[8px] items-center justify-center px-[12px] py-[8px] w-full">
  <div className="bg-[var(--surface_secondary,#f7f7f7)] rounded-[400px] size-[24px] flex items-center justify-center">
    <CancelStroke />
  </div>
  <div className="flex-1 flex gap-[4px] items-center justify-center">
    <p className="font-['Pretendard:SemiBold'] text-[16px] text-[var(--text_primary,#262626)]">최근 항목</p>
    <ArrowshortdownStroke />
  </div>
  <p className="font-['Pretendard:SemiBold'] text-[14px] text-[var(--zzem_purple_500,#8752fa)]">완료</p>
</div>

// Selected photo cell
<div className="flex-1 h-[120px] overflow-clip border-2 border-[var(--zzem_purple_500,#8752fa)]">
  <img src={imgPhoto} className="absolute inset-0 object-cover size-full" />
  <div className="absolute right-[6.67px] top-[6px] bg-[var(--zzem_purple_500,#8752fa)] rounded-[999px] size-[20px]">
    <CheckStroke />
  </div>
</div>

// Unselected photo cell
<div className="flex-1 h-[120px] overflow-clip">
  <img src={imgPhoto} className="absolute inset-0 object-cover size-full" />
  <div className="absolute right-[8px] top-[8px] border border-[var(--outline_secondary,#e2e2e2)] rounded-[999px] size-[20px]" />
</div>
```
