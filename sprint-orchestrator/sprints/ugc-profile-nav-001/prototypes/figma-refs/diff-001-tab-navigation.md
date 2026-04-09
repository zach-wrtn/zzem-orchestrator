# Diff Report: 001-tab-navigation Prototype vs Figma Design

**Date**: 2026-04-09
**Prototype**: `prototypes/app/001-tab-navigation/prototype.html`
**Figma refs**: AC_2.1, AC_2.2, AC_2.5

---

## 1. Layout

### 1.1 Device Frame Size
- **Prototype**: 390x844 (iPhone 14 Pro)
- **Figma**: 375x812 (iPhone X/11), rounded-40px
- **Severity**: major
- **Note**: Figma specifies 375w with rounded-40px device frame. Prototype uses 390w with 12px border-radius on bottom only.

### 1.2 Home Header Bar Height
- **Prototype**: h-48px (matches `--component-header-height`)
- **Figma**: h-48 with px-12 py-4
- **Severity**: minor
- **Note**: Prototype uses px-16 padding vs Figma px-12.

### 1.3 Home Contents Padding
- **Prototype**: No explicit pb-80 pt-58 on contents area
- **Figma**: Contents flex-col, gap-12, pb-80 pt-58
- **Severity**: minor

### 1.4 Profile Section Padding
- **Prototype**: padding 16px top 12px (`--spacing-4` / `--spacing-3`)
- **Figma**: px-16 py-12 gap-16
- **Severity**: minor — gap-16 between profile elements not explicitly set (prototype uses gap-12)

### 1.5 Profile Tab Width
- **Prototype**: flex: 1 (equal distribution), h-44px
- **Figma**: each tab w-120, h-46, px-20
- **Severity**: major
- **Note**: Figma specifies fixed w-120 per tab and h-46. Prototype uses flex-1 equal split and h-44.

### 1.6 Bottom Navigation Spacing
- **Prototype**: padding 10px 12px 26px 12px (matches Figma)
- **Figma**: pt-10 pb-26 px-12
- **Severity**: none (correct)

### 1.7 Explore Grid Container
- **Prototype**: No outer border-radius on grid container
- **Figma**: Grid feed has rounded-24 container wrapping the 2-column layout
- **Severity**: major

---

## 2. Typography

### 2.1 Masonry Card Title Line Height
- **Prototype**: line-height 1.3
- **Figma**: Subtitle6-14 — lineHeight 1.4
- **Severity**: minor

### 2.2 Masonry Card Username Font Weight
- **Prototype**: font-weight 400 (regular)
- **Figma**: Subtitle7-12 SemiBold (weight 600)
- **Severity**: major
- **Note**: Card username in explore feed should be Subtitle7-12 SemiBold, not regular.

### 2.3 Home Category Chips Font Size
- **Prototype**: 13px
- **Figma**: No direct chip spec in AC_2.1 but filter cards use Subtitle6-14 (14px SemiBold)
- **Severity**: minor

### 2.4 Empty State Text Style
- **Prototype**: font-size 14px, font-weight 400 (regular), color #8a8a8a, opacity 0.8
- **Figma**: Text6-14 Regular, text_tertiary #8a8a8a, opacity 80%
- **Severity**: none (correct)

### 2.5 Profile Stats Label
- **Prototype**: font-size 12px, weight 500 (medium)
- **Figma**: Body7-12 Medium (weight 500)
- **Severity**: none (correct)

---

## 3. Colors

### 3.1 Masonry Card Gradient Overlay
- **Prototype**: `linear-gradient(transparent, rgba(0,0,0,0.55))`
- **Figma**: `linear-gradient(180deg, transparent 36%, rgba(19,19,19,0.2) 90%)`
- **Severity**: critical
- **Note**: Prototype overlay is significantly darker (0.55 opacity black vs 0.2 opacity at 90%). This makes text more readable but doesn't match the subtle Figma design.

### 3.2 Home Header Logo
- **Prototype**: Text "ZZEM" in brand purple (#8752FA)
- **Figma**: Logo 32x32 image asset (not text)
- **Severity**: major
- **Note**: Figma uses a 32x32 logo image, not a text logotype.

### 3.3 Home Header Coin Icon
- **Prototype**: Generic clock-like SVG icon for credit display
- **Figma**: Dedicated Coin icon (ShinyecoFill import)
- **Severity**: major

### 3.4 Avatar Fallback Background
- **Prototype**: background #f1f1f1 (fill-neutral)
- **Figma**: Avatar fallback bg #f5f3ff (light purple tint)
- **Severity**: minor

### 3.5 Private Grid Lock Overlay
- **Prototype**: Full-card overlay rgba(0,0,0,0.3) with centered large lock icon
- **Figma**: LockFill icon in top-right area only, no full overlay
- **Severity**: major
- **Note**: Figma shows a small lock icon in the top-right corner, not a full dark overlay.

---

## 4. Components

### 4.1 Home Menu Section (4 Feature Cards)
- **Prototype**: Horizontal chip/pill buttons ("비디오 생성", "이미지 생성", etc.)
- **Figma**: 4 rectangular feature cards (surface_secondary bg, rounded-16) with labels "비디오 생성", "짤 생성", "짤 꾸미기", "사진 생성"
- **Severity**: critical
- **Note**: Figma shows rounded-16 rectangular cards, not pill chips. Also the labels differ: "이미지 생성" vs "사진 생성", missing "짤 생성" and "짤 꾸미기".

### 4.2 Profile Posts Tab — RegenerateStroke Icon
- **Prototype**: Generic refresh/reload SVG icon for regen count
- **Figma**: RegenerateStroke (Code Connect named icon)
- **Severity**: minor — functionally equivalent but not matching the exact icon asset.

### 4.3 Profile Tab Icons — Fill vs Stroke State
- **Prototype**: All profile tab icons use stroke variants only; active tab is differentiated only by color + underline
- **Figma**: Active tab uses Fill variants (MediaFill, LockFill, HeartFill), inactive tabs use stroke
- **Severity**: critical
- **Note**: Figma explicitly imports MediaFill/LockFill/HeartFill for active state. Prototype only toggles color, never swaps to filled icon variant.

### 4.4 Vertical Feed Detail View Structure
- **Prototype**: Simple vertical scroll with gradient backgrounds, left-side captions, right-side heart/comment/share actions
- **Figma (AC 2.5)**: Full PostCard with blur background, TopDimmed/BottomDimmed gradients, VideoProgressBar, HeaderBar (back + volume), Noti badge, Section_CreatorInfo (avatar 36px + verified badge), side action column (HeartStroke, RegenerateStroke, UploadStroke, MorehStroke, ImageThumbnail), bottom buttons ("다시 생성하기" + coin, "게시" toggle)
- **Severity**: critical
- **Note**: The vertical feed detail screen is drastically different from Figma. Missing: volume icon, AI noti badge, creator info section, regenerate/upload/more buttons, bottom CTA buttons with toggle, VideoProgressBar, image blur background pattern. This is the most significant structural gap.

### 4.5 Bottom Sheet Components Missing
- **Prototype**: Not implemented
- **Figma**: Multiple bottom sheet variants:
  - 게시 안내 bottom sheet (emoji + title + confirm button)
  - 더보기 menu sheet (download, feedback, report items)
  - 신고하기 full screen (report form with textfield)
  - 다운로드 toast message
- **Severity**: critical
- **Note**: All overlay/sheet interactions from AC 2.5 are missing.

### 4.6 Explore Search Bar
- **Prototype**: Centered title "탐색" only
- **Figma**: Search bar area (content area pt-105 implies header + search bar)
- **Severity**: major
- **Note**: Figma explore screen has a search bar that accounts for pt-105 content top padding.

---

## 5. Icons

### 5.1 Home Header — BellStroke
- **Prototype**: Generic bell SVG
- **Figma**: BellStroke (Code Connect)
- **Severity**: minor (visually similar)

### 5.2 Profile Header — SettingStroke
- **Prototype**: Generic gear/cog SVG
- **Figma**: SettingStroke (Code Connect)
- **Severity**: minor (visually similar)

### 5.3 Bottom Nav — Home Icon
- **Prototype**: House with "Z" text inside
- **Figma**: ZZEM-specific logo icon
- **Severity**: major — should use the brand-specific home icon asset

### 5.4 Detail View — Missing Icons
- **Prototype**: N/A (simplified detail)
- **Figma**: VolumeFill, HeartStroke/HeartFill, RegenerateStroke, UploadStroke, MorehStroke, ShinyFill, DownloadStroke, MailSendStroke, SirenStroke
- **Severity**: critical (part of missing detail view)

---

## 6. Interactions

### 6.1 Tab Swipe Gesture
- **Prototype**: Tap-only tab switching
- **Figma**: Implies horizontal swipe between tabs (tab indicator animation expected)
- **Severity**: minor

### 6.2 Masonry Card -> Detail Transition
- **Prototype**: Slide-left transition to a simplified vertical feed
- **Figma**: Vertical swipe entry into full-screen PostCard detail view
- **Severity**: critical (destination screen is wrong — see 4.4)

### 6.3 Detail View Side Button Interactions
- **Prototype**: Not implemented
- **Figma**: Heart toggle (stroke/fill), regenerate action, upload/share, more options -> bottom sheet
- **Severity**: critical

### 6.4 Toggle ON/OFF Interaction
- **Prototype**: Not implemented
- **Figma**: Toggle for "게시" button — ON: purple #8752fa track, OFF: white 40% opacity track
- **Severity**: critical

### 6.5 Profile Avatar/Username Tap -> Profile Navigation
- **Prototype**: Not implemented (no tap handler on avatar/username in feed cards)
- **Figma**: Tapping user avatar/name in explore feed navigates to that user's profile
- **Severity**: major

---

## 7. States

### 7.1 Per-Tab Empty States
- **Prototype**: Liked tab shows "아직 게시물이 없어요". Posts/private tabs have no empty state wired per-tab.
- **Figma**: Each tab has its own empty state message:
  - 게시물탭: "아직 게시물이 없어요"
  - 비공개탭: "아직 비공개한 게시물이 없어요"
  - 좋아요탭: "아직 좋아요한 게시물이 없어요"
- **Severity**: major
- **Note**: Only the liked tab has an empty state; posts and private tabs show content always with no toggle to empty.

### 7.2 Detail View Toggle States
- **Prototype**: Not implemented
- **Figma**: Toggle ON (게시물탭_기본) vs Toggle OFF (비공개탭_진입, 좋아요탭_내게시물)
- **Severity**: critical

### 7.3 Detail View Variants by Tab Origin
- **Prototype**: Single generic vertical feed for all entry points
- **Figma**: 4 distinct detail variants:
  - 게시물탭_기본: "다시 생성하기" + "게시" toggle ON
  - 비공개탭_진입: "프롬프트 편집하기" + "게시" toggle OFF, prompt text visible
  - 좋아요탭_타유저: "템플릿 사용하기" single CTA, HeartFill
  - 좋아요탭_내게시물: "다시 생성하기" + "게시" toggle OFF, HeartFill
- **Severity**: critical

### 7.4 Toast Message State
- **Prototype**: Not implemented
- **Figma**: Download toast "앨범에 저장됐어요" — pill shape, rounded-40px, shadow, centered top
- **Severity**: major

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 8 |
| Major    | 10 |
| Minor    | 8 |

### Top Critical Issues
1. **Detail view (AC 2.5) is fundamentally incomplete** — Missing PostCard structure, blur bg, side actions, bottom CTAs, toggle, VideoProgressBar, AI badge, creator info (4.4, 6.2-6.4, 7.2-7.3)
2. **Profile tab active icons use stroke instead of fill** — Should swap to MediaFill/LockFill/HeartFill (4.3)
3. **Home menu cards are wrong component type** — Chips instead of rounded-16 rectangular feature cards with different labels (4.1)
4. **Bottom sheet interactions entirely missing** — 게시안내, 더보기 menu, 신고하기 form, toast (4.5)
5. **Masonry card gradient overlay too dark** — 0.55 black vs Figma's 0.2 at 90% (3.1)
