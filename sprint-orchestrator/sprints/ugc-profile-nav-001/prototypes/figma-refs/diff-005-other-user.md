# Diff Report: 005-other-user-profile vs Figma

> Prototype: `app/005-other-user-profile/prototype.html`
> Figma refs: `AC_7.1.md` (Other User Profile), `AC_2.7.md` (Post-Generation Landing)
> Generated: 2026-04-09

---

## 1. Layout

| # | Area | Prototype | Figma | Severity |
|---|------|-----------|-------|----------|
| L1 | Device frame width | 390px | 375px (Screen rounded-40) | major |
| L2 | Device frame height | 844px | 812px | minor |
| L3 | Screen border-radius | 0 0 12px 12px (frame chrome only) | rounded-40 (40px on screen itself) | major |
| L4 | Profile section padding | pt-24 px-16 pb-16, gap-12 | pt-12 px-16 pb-24, gap-16 | major |
| L5 | Stats section padding | gap-32, py-12 | px-40 with flex-1 columns (no gap spec; uses equal flex) | major |
| L6 | Header padding | 0 16px | px-12 py-4 (AC_2.7 ref) | minor |
| L7 | Masonry gap | 1px | Not specified (Figma uses standard gap between thumbnails) | minor |
| L8 | Bottom sheet outer padding | No px/py on sheet container | px-12 py-32 on the overlay wrapper | major |
| L9 | Bottom sheet border-radius | 16px 16px 0 0 | rounded-28 | major |
| L10 | Bottom sheet pb | pb-34 | pb-16 | minor |

---

## 2. Typography

| # | Area | Prototype | Figma | Severity |
|---|------|-----------|-------|----------|
| T1 | Profile nickname weight | font-weight: 700 (Bold) | SemiBold 600 (Subtitle3-18) | minor |
| T2 | Stats value weight | font-weight: 700 (Bold) | SemiBold 600 (Subtitle4-16) | minor |
| T3 | Stats label color | --color-label-tertiary (#8A8A8A) | Body7-12 uses --text_primary or similar; Figma does not specify tertiary for stats labels | minor |
| T4 | Bottom nav label size | 10px font-weight: 500 | Label5-10: Medium 10px / line-height 1.0 -- matches | OK |
| T5 | Toast text | 13px font-weight: 500 | SemiBold 14px / 1.4 (Subtitle4-14) | major |
| T6 | Toast text content | "프로필 URL이 복사되었습니다" | "프로필 링크를 클립보드에 복사했어요" | critical |
| T7 | Bottom sheet menu text gap | gap-16 | gap-12 | minor |
| T8 | Bottom sheet menu text font-weight | normal (unset) | Medium 500 (Body4-16) | minor |
| T9 | Generating text style | 12px font-weight: 600, color: #656565 | SemiBold 16px, color: white, leading 1.5 | critical |
| T10 | Header title line-height | unset (default) | 1.5 (Subtitle3-18) | minor |

---

## 3. Colors

| # | Area | Prototype | Figma | Severity |
|---|------|-----------|-------|----------|
| C1 | Avatar background | --color-fill-neutral (#F0F1F3) fallback | #f5f3ff (Avatar BG token) | minor |
| C2 | Avatar border | none | rgba(136, 136, 136, 0.2) border | major |
| C3 | Header border-bottom | 1px solid #E2E2E2 | Not specified in Figma (outline_primary is #f1f1f1) | minor |
| C4 | Generating overlay bg | rgba(255, 255, 255, 0.65) white overlay | linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 100%) + #f7f7f7 base | critical |
| C5 | Toast background | #333 | #171717 (surface_secondary_invert) | major |
| C6 | Toast shadow | none | drop-shadow(0px 0px 20px rgba(0,0,0,0.2)) | major |
| C7 | Bottom sheet handle color | --color-outline-secondary (#E2E2E2) | #c5c5c5 (icon_quaternary) | minor |
| C8 | Dim overlay | rgba(0, 0, 0, 0.4) | rgba(0, 0, 0, 0.4) -- matches | OK |
| C9 | Thumbnail gradient overlay | none (no gradient on normal thumbnails) | linear-gradient from transparent to rgba(19,19,19,0.2) | major |
| C10 | Regen count badge bg | rgba(0, 0, 0, 0.55) pill | Figma shows RegenerateStroke icon + count within gradient area (no separate pill badge) | major |

---

## 4. Components

| # | Area | Prototype | Figma | Severity |
|---|------|-----------|-------|----------|
| CP1 | Other user tabs | Single "게시물" tab with underline visible | NO tab menu at all (grid directly after stats) | critical |
| CP2 | Profile nickname display | Shows nickname below avatar as separate element | Figma has no separate nickname below avatar; username is in header only | major |
| CP3 | MY profile "프로필 공유" button | Missing -- only "프로필 편집" shown | Two buttons: "프로필 편집" + "프로필 공유" side by side, gap-6 | critical |
| CP4 | MY profile tabs icons | Text labels ("게시물", "비공개", "좋아요") | Icon-based: MediaFill, LockFill, HeartFill with active underline indicator | major |
| CP5 | Tab height | 44px | 46px (h-46) | minor |
| CP6 | Tab active indicator width | left:16px right:16px (dynamic) | Fixed w-60px centered | minor |
| CP7 | "생성 실패" state | Not implemented | Thumbnail with "생성 실패" text + CancelStroke (X) close button with rgba(255,255,255,0.3) bg | critical |
| CP8 | Bottom sheet extra menu items | "사용자 차단", "신고하기", "취소" | Only "프로필 URL 복사" (single item) | major |
| CP9 | Bottom nav labels | No text labels shown | Home/Search/My with Label5-10 text labels | minor |
| CP10 | Bottom nav dot indicator | 8px purple dot | Figma shows dot indicator on My tab -- similar but needs verification | minor |

---

## 5. Icons

| # | Area | Prototype | Figma | Severity |
|---|------|-----------|-------|----------|
| I1 | Header more icon | Unicode ellipsis "..." (U+22EF) | MorehStroke SVG icon (horizontal dots) | major |
| I2 | Header emoji badge | Blue checkmark/verified SVG | emoji_neutral_fill 14px (neutral face emoji badge) | critical |
| I3 | Back button icon | Unicode left arrow (U+2190) | Empty 32x32 IconButton (back arrow icon) | minor |
| I4 | Settings icon (MY) | Unicode gear (U+2699) | SettingStroke SVG icon | major |
| I5 | Bottom sheet link icon | Unicode chain link emoji (U+1F517) | LinkStroke SVG icon | minor |
| I6 | Regen icon on thumbnails | Custom rotate SVG | RegenerateStroke icon (from design system) | minor |
| I7 | Generating spinner | Clock circle SVG with pulse animation | Rotating LOGO spinner at center, -rotate-150 | major |
| I8 | Back button size | 24x24 | 32x32 | minor |

---

## 6. States (Other User Profile Variants)

| # | Area | Prototype | Figma | Severity |
|---|------|-----------|-------|----------|
| S1 | Follow states | Not implemented (no follow UI) | 3 variants: 팔로우전, 맞팔로우, 팔로잉 (same layout, different context) | minor (PRD 3 scope) |
| S2 | URL copy toast position | bottom: 100px, centered | top: 40px, centered horizontally | critical |
| S3 | Toast shape | border-radius: 8px (radius-sm) | rounded-40 pill shape with px-24 py-8 | major |
| S4 | Toast padding | 10px 20px | px-24 py-8 | minor |
| S5 | More menu trigger | Navigates to separate screen | Should be overlay on same screen (bottom sheet over profile) | major |

---

## 7. Generating States (MY Profile Context)

| # | Area | Prototype | Figma | Severity |
|---|------|-----------|-------|----------|
| G1 | Generating thumbnail visual | White semi-transparent overlay with clock icon + "생성중..." in gray 12px | Dark gradient top overlay on #f7f7f7 base, white "생성중..." text in 16px SemiBold at top-left (10,10) | critical |
| G2 | Generating thumbnail layout | Centered column layout (icon + text) | Text at absolute top-left (10px, 10px), spinner at center | critical |
| G3 | "생성 실패" thumbnail | Not implemented at all | "생성 실패" text top-left + CancelStroke X button top-right in 24px circle with 30% white bg | critical |
| G4 | Generating thumbnail aspect | Variable height placeholders | aspect-[187/187] (square) | major |
| G5 | MY profile button border | border: 1px solid #E2E2E2 | No border; bg: surface_button (#f1f1f1), rounded-12 | minor |
| G6 | MY profile button radius | 8px (radius-sm) | 12px (rounded-12) | minor |
| G7 | Private tab active indicator | CSS pseudo-element underline | 2px height, w-60px, bg surface_primary_invert (#262626) | minor |

---

## Summary: Critical Issues (10)

1. **CP1** -- Other user profile shows a "게시물" tab, but Figma has NO tabs (grid directly after stats)
2. **CP3** -- MY profile missing "프로필 공유" button (only "프로필 편집" present)
3. **CP7/G3** -- "생성 실패" (generation failed) state is completely unimplemented
4. **G1/G2** -- "생성중" thumbnail uses wrong visual treatment (white overlay + centered gray text vs. dark gradient + white top-left text + LOGO spinner)
5. **I2** -- Verified checkmark badge used instead of emoji_neutral_fill (wrong icon entirely)
6. **T6** -- Toast copy message text is wrong string
7. **S2** -- Toast positioned at bottom instead of top
8. **C4** -- Generating overlay color scheme inverted (white overlay vs dark gradient)
9. **T9** -- Generating text wrong size (12px gray vs 16px white)
10. **C9** -- Normal thumbnails missing gradient overlay per Figma spec

---

## Top 5 Fixes by Impact

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | Remove tab from other-user profile | Delete `<div class="profile-tabs">` and show grid directly after stats |
| P0 | Implement "생성 실패" state | Add failed thumbnail with "생성 실패" text + CancelStroke X button |
| P0 | Fix generating thumbnail treatment | Change to dark gradient overlay, white 16px text at top-left, LOGO spinner |
| P0 | Replace verified badge with emoji_neutral_fill | Use neutral face emoji SVG (14px) instead of blue checkmark |
| P1 | Add missing "프로필 공유" button | Add second button next to "프로필 편집" in MY profile |
