# Figma-Prototype Diff Report: 003-profile-edit

**Date**: 2026-04-09
**Prototype**: `prototypes/app/003-profile-edit/prototype.html`
**Figma Refs**: `AC_2.3.md`, `AC_2.4.md`

---

## 1. Layout

### 1.1 Content padding mismatch
- **Prototype**: `padding: 32px 24px 120px` (px-24)
- **Figma**: `px-[16px]` content padding
- **Severity**: major — content area is 8px wider inset than Figma spec

### 1.2 Profile section vertical padding missing
- **Prototype**: No explicit py on profile section; uses `gap: 32px` between avatar and nickname sections
- **Figma**: Profile section `py-[12px]`; input label-field gap `8px`; input label padding `px-[4px]`
- **Severity**: minor — spacing proportions differ slightly

### 1.3 Save button bar padding
- **Prototype**: `padding: 12px 24px` with safe-area-inset-bottom
- **Figma**: `pb-[32px] pt-[12px] px-[16px]`
- **Severity**: major — bottom padding should be 32px not 12px; horizontal padding should be 16px not 24px

### 1.4 Nav bar height
- **Prototype**: `height: 56px`
- **Figma**: `height: 48px`
- **Severity**: minor — 8px taller than spec

### 1.5 Bottom sheet option padding/gap
- **Prototype**: `padding: 14px 24px; gap: 16px` with 40x40 icon circle container
- **Figma**: `px-[20px] py-[16px]; gap: 12px` (icon-text gap), `gap: 20px` (between items), no icon circle container
- **Severity**: major — bottom sheet items have extra icon circle wrapper not in Figma; Figma shows bare icons inline

---

## 2. Typography

### 2.1 Save button font size
- **Prototype**: `font-size: 16px` (var(--font-size-body1))
- **Figma**: `text-[18px]` (Subtitle3-18, Pretendard SemiBold 18px)
- **Severity**: major — save button text 2px too small

### 2.2 Nickname label font spec
- **Prototype**: `font-size: 14px; font-weight: 500` (Body2, Medium) — matches
- **Figma**: Body6-14, Pretendard Medium 14px, lineHeight 1.4
- **Severity**: minor — line-height not explicitly set (browser default ~1.2 vs 1.4)

### 2.3 Bottom sheet option text weight
- **Prototype**: `font-weight: 400` (Regular)
- **Figma**: Pretendard Medium 16px (Body4-16)
- **Severity**: minor — should be Medium (500) not Regular (400)

---

## 3. Colors

### 3.1 Save button enabled state uses brand purple instead of dark
- **Prototype**: `background: #8752FA` (brand primary / purple)
- **Figma**: `bg-[var(--surface_primary_invert, #262626)]` (dark/black)
- **Severity**: critical — Figma shows dark (#262626) save button, prototype shows purple (#8752FA). This is a fundamental color mismatch for the primary CTA.

### 3.2 Save button disabled state label color
- **Prototype**: `color: #C1C4CC` (--color-label-disabled)
- **Figma**: `text-[var(--text_placeholder_disable, #c5c5c5)]`
- **Severity**: minor — close but not exact (#C1C4CC vs #c5c5c5)

### 3.3 Avatar border missing
- **Prototype**: No border on avatar circle
- **Figma**: `border border-[rgba(136,136,136,0.2)]` on avatar
- **Severity**: minor — subtle border missing

### 3.4 Avatar edit badge color
- **Prototype**: `background: #262626` (dark)
- **Figma**: `bg-[var(--surface_tertiary, #e2e2e2)]` (light gray), with white border-4, size 24x24
- **Severity**: major — camera badge should be light gray (#e2e2e2) not dark (#262626)

### 3.5 Nickname input style (underline vs filled box)
- **Prototype**: Transparent background with bottom border only (underline style)
- **Figma**: `bg-[var(--surface_secondary, #f7f7f7)]` with `border border-[var(--outline_primary, #f1f1f1)]` and `rounded-[16px]` — filled rounded textfield
- **Severity**: critical — completely different input component style. Figma shows a filled rounded box; prototype shows an underline input.

### 3.6 Delete option color
- **Prototype**: `color: #FF3B30` (iOS system red)
- **Figma**: `var(--function_red_3, #d92800)`
- **Severity**: minor — different red shade (#FF3B30 vs #d92800)

### 3.7 Toast background and position
- **Prototype**: `bottom: 100px; background: rgba(33,34,40,0.9)`
- **Figma**: `top-[40px]; bg-[var(--surface_secondary_invert, #171717)]`; solid dark; `rounded-[40px]`
- **Severity**: major — toast is at bottom in prototype but should be at top. Background should be solid #171717, not semi-transparent.

### 3.8 Bottom sheet handle bar color
- **Prototype**: `background: var(--color-line-normal)` (#E4E5E9)
- **Figma**: `bg-[var(--icon_quaternary, #a7a7a7)]`
- **Severity**: minor — handle bar is lighter than Figma spec

### 3.9 Bottom sheet border-radius
- **Prototype**: `border-radius: 24px 24px 0 0`
- **Figma**: `rounded-[28px]`
- **Severity**: minor — 4px difference in corner radius

---

## 4. Components

### 4.1 Missing: Exit confirm bottom sheet (BottomConfirmSheet)
- **Prototype**: No confirm dialog when pressing back with unsaved changes
- **Figma**: Full BottomConfirmSheet with dim overlay, handle bar, message "수정사항이 있습니다. 그래도 나가시겠습니까?", cancel/confirm buttons
- **Severity**: critical — blocks AC. Unsaved changes exit flow entirely missing.

### 4.2 Missing: Photo crop screen (프로필편집_사진_크롭)
- **Prototype**: No crop screen at all
- **Figma**: Full crop screen with header "크기 설정", crop area with 4 corner handles, "완료" button, dark bottom bar
- **Severity**: critical — blocks AC. Photo crop flow entirely missing.

### 4.3 Missing: Album selection screen (프로필편집_사진_앨범선택)
- **Prototype**: Camera/album option just shows a toast (mock); no album picker
- **Figma**: Full OptionAlbumSection bottom sheet with 3-column photo grid, camera cell, selection checkboxes with purple highlight, header with close/dropdown/done
- **Severity**: critical — blocks AC. Album selection flow entirely missing.

### 4.4 Missing: Nickname save-enabled state
- **Prototype**: Only shows disabled, validation-error, and saving states. No enabled save button state when nickname is modified.
- **Figma**: "프로필편집_닉네임_저장가능" shows enabled save button (dark bg #262626, light text #f7f7f7) when nickname changes
- **Severity**: critical — blocks AC. Users cannot see or tap an enabled save button.

### 4.5 Missing: Profile change success toast on MY profile screen
- **Prototype**: Toast says "저장되었습니다" positioned at bottom of edit screen
- **Figma**: Toast "프로필이 변경됐어요" shown on MY profile page (not edit page), positioned at top
- **Severity**: major — toast context and text are wrong

### 4.6 Textfield component structure wrong
- **Prototype**: `<input>` element with underline border style
- **Figma**: `<div>` container with `bg-surface_secondary`, `border outline_primary`, `rounded-[16px]`, `px-[16px] py-[12px]` — a filled box-style field with `w-[335px]`
- **Severity**: critical (duplicate of 3.5) — structural component mismatch

### 4.7 Avatar edit badge size
- **Prototype**: 30x30 with border-2
- **Figma**: 24x24 with border-4
- **Severity**: minor — 6px larger, border 2px thinner

---

## 5. Icons

### 5.1 Camera badge icon — stroke vs fill
- **Prototype**: Uses a stroke-style camera SVG (outline)
- **Figma**: `CameraFill` (filled icon per Code Connect)
- **Severity**: major — wrong icon variant; should be filled, not stroked

### 5.2 Bottom sheet icons wrapped in circle containers
- **Prototype**: Icons wrapped in 40x40 circle containers with gray background
- **Figma**: `ImageStroke` and `TrashStroke` rendered inline with no wrapper, just `gap-[12px]` to text
- **Severity**: major — extra visual elements not in Figma design

### 5.3 Back arrow icon style
- **Prototype**: Custom chevron SVG
- **Figma**: Implies Code Connect back arrow (24x24), but no named icon specified
- **Severity**: minor — functionally correct, visual match uncertain

---

## 6. Interactions

### 6.1 Missing: Dirty state detection for save button enable
- **Prototype**: Save button is always disabled in default state; no JS to detect nickname change and enable save
- **Figma**: Save button enables when nickname or photo changes (two separate states documented)
- **Severity**: critical — core edit flow broken; save button never becomes clickable

### 6.2 Missing: Back button with unsaved changes triggers confirm sheet
- **Prototype**: Back button navigates immediately with no check
- **Figma**: Back with unsaved changes opens BottomConfirmSheet
- **Severity**: critical (duplicate of 4.1)

### 6.3 Missing: Keyboard overlay state
- **Prototype**: No keyboard simulation on nickname focus
- **Figma**: "프로필편집_닉네임_키보드" shows iOS keyboard overlay when textfield is focused
- **Severity**: minor — keyboard is OS-level, but prototype could show a visual state

### 6.4 Missing: Photo change triggers dirty state
- **Prototype**: Camera/album and delete photo just show toast
- **Figma**: Photo change enables save button (프로필편집_사진_저장가능)
- **Severity**: major — photo edit flow doesn't connect to save state

---

## 7. States

### 7.1 Missing: Save enabled state (nickname changed)
- **Prototype**: States available — default, validation-error, saving
- **Figma**: 프로필편집_닉네임_저장가능 — save button dark (#262626) when nickname modified
- **Severity**: critical

### 7.2 Missing: Save enabled state (photo changed)
- **Prototype**: Not present
- **Figma**: 프로필편집_사진_저장가능 — save enabled after photo swap
- **Severity**: critical

### 7.3 Missing: Exit confirm dialog state
- **Prototype**: Not present
- **Figma**: 프로필편집_닉네임_바텀시트_나가기확인 and 프로필편집_사진_바텀시트_나가기확인
- **Severity**: critical

### 7.4 Missing: Photo crop state
- **Prototype**: Not present
- **Figma**: 프로필편집_사진_크롭 — full crop screen
- **Severity**: critical

### 7.5 Missing: Album selection state
- **Prototype**: Not present
- **Figma**: 프로필편집_사진_앨범선택 — album picker with 3-column grid
- **Severity**: critical

### 7.6 Toast text and position mismatch
- **Prototype**: "저장되었습니다" at bottom
- **Figma**: "프로필이 변경됐어요" at top-40px on MY profile screen
- **Severity**: major

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 11    |
| Major    | 10    |
| Minor    | 11    |
| **Total** | **32** |

### Top 5 Critical Issues (AC Blockers)

1. **Save button never enables** — No dirty-state detection; save stays disabled forever (6.1, 7.1, 7.2)
2. **Textfield is underline instead of filled box** — Completely wrong input component style (3.5, 4.6)
3. **Exit confirm sheet missing** — No unsaved-changes guard on back navigation (4.1, 7.3)
4. **Photo crop screen missing** — Entire crop flow absent (4.2, 7.4)
5. **Album selection screen missing** — Entire album picker flow absent (4.3, 7.5)
