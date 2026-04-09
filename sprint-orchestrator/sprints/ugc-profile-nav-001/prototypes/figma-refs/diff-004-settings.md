# Diff Report: 004-settings-screen vs Figma AC_2.8

## Summary

Prototype: `prototypes/app/004-settings-screen/prototype.html`
Figma Ref: `figma-refs/AC_2.8.md` (node 37174-21780)

---

## 1. Layout

| # | Issue | Prototype | Figma | Severity |
|---|-------|-----------|-------|----------|
| L1 | Header height | `h-56px` | `h-48px` | major |
| L2 | Header padding | `pl-16 pr-16` | `pl-12 pr-44` (right spacer 44px) | major |
| L3 | Contents top padding | No `pt-20` on settings-list | `pt-20` after header | minor |
| L4 | Section gap | No explicit `gap-16` between sections | `gap-16` between sections inside Contents | minor |
| L5 | Settings item right padding | `pr-16` | `pr-24` (items with chevron), `pr-16` (logout area) | major |
| L6 | Screen border-radius | `0 0 12px 12px` (device frame) | `rounded-40` (40px) on screen | minor (viewer artifact) |
| L7 | Google icon gap | `gap-6px` between icon and email | `gap-4px` | minor |
| L8 | Logout button container | `position: absolute; bottom: 32px` | `px-16 pb-32 pt-16` (flow layout) | minor |

## 2. Typography

| # | Issue | Prototype | Figma | Severity |
|---|-------|-----------|-------|----------|
| T1 | Nav title weight | `font-weight: 600` (SemiBold) | SemiBold 18px -- **match** | -- |
| T2 | Nav title line-height | Not set (browser default) | `line-height: 1.5` | minor |
| T3 | Menu item line-height | `line-height: 1.4` | `line-height: 1.5` (Body4-16) | minor |
| T4 | Version number font-size | `14px` SemiBold -- matches Subtitle4-14 | **match** | -- |
| T5 | Logout button font-size | `18px` SemiBold -- matches Subtitle3-18 | **match** | -- |

## 3. Colors

| # | Issue | Prototype | Figma | Severity |
|---|-------|-----------|-------|----------|
| C1 | Text primary | `#262626` | `--text_primary` (#262626) | **match** |
| C2 | Text secondary (logout btn) | `#656565` | `--text_secondary` (#656565) | **match** |
| C3 | Text tertiary (email, version) | `#8a8a8a` | `--text_tertiary` (#8a8a8a) | **match** |
| C4 | Section divider bg | `#f7f7f7` | `--surface_secondary` (#f7f7f7) | **match** |
| C5 | Logout button bg | `#f1f1f1` | `--surface_button` (#f1f1f1) | **match** |
| C6 | Google icon border | No border on Google icon SVG | `border 0.833px --outline_primary (#f1f1f1)` | minor |
| C7 | Design token naming | Uses custom `--color-*` tokens from shared DS | Figma uses `--text_primary`, `--surface_button` etc. | minor (alignment) |

## 4. Components

| # | Issue | Prototype | Figma | Severity |
|---|-------|-----------|-------|----------|
| CO1 | Toggle switch missing | Not present. "알림 설정" has chevron instead | Figma shows "소식 알림" with toggle (purple #a788fd bg, white knob, 48x28px) | **critical** |
| CO2 | Google icon implementation | Inline SVG with colored paths, no border | Figma: 20x20 circle with 0.833px border `--outline_primary`, contains Google logo | minor |
| CO3 | Logout dialog | Present and functional | Not shown in Figma ref (may be separate) | -- (OK) |

## 5. Icons

| # | Issue | Prototype | Figma | Severity |
|---|-------|-----------|-------|----------|
| I1 | Back button icon | Generic SVG chevron-left `<path d="M15 19l-7-7 7-7"/>` | Figma specifies `ArrowshortLeft` icon | minor |
| I2 | Chevron right icon | Generic SVG chevron `<path d="M9 5l7 7-7 7"/>` | Figma specifies `ArrowshortRight` (ArrowshortrightStroke) | minor |
| I3 | Icon sizing | `22px` (icon-svg) / `18px` (icon-svg--small) | Figma back icon in `rounded-8` container; chevrons not explicitly sized | minor |

## 6. Menu Items — PRD vs Figma vs Prototype

### Three-way comparison

| Menu Item | PRD | Figma | Prototype | Status |
|-----------|-----|-------|-----------|--------|
| 프로필 편집 | Yes | No | No | PRD-only (not in settings screen) |
| 계정 (+ Google email) | No | Yes | Yes | Figma+Prototype match |
| 비밀번호 | No | Yes | Yes | Figma+Prototype match |
| 알림 설정 | Yes (as "알림설정") | No (see 소식 알림) | Yes (with chevron) | **conflict** |
| 소식 알림 (toggle) | No | Yes (with toggle) | No | **critical — missing** |
| 차단 관리 | Yes | No | Yes | PRD-only addition |
| 서비스 이용약관 | Yes | Yes ("이용약관") | Yes ("서비스 이용약관") | label mismatch (minor) |
| 개인정보 처리방침 | Yes | Yes | Yes | **match** |
| 고객센터 | No | Yes | Yes | Figma+Prototype match |
| 로그아웃 | Yes | Yes (bottom btn) | Yes (bottom btn) | **match** |
| 탈퇴 / 탈퇴하기 | Yes | Yes | Yes | **match** |
| 앱 버전 | No | Yes (1.1.1) | Yes (1.1.1) | Figma+Prototype match |

### PRD vs Figma Conflicts

1. **PRD has "프로필 편집"** — Figma settings screen does not include it (likely on profile screen, not settings).
2. **PRD has "알림설정"** — Figma has "소식 알림" with a toggle switch instead of a navigation item. Different name and different interaction pattern.
3. **PRD has "차단 관리"** — Figma does not include this item. Prototype adds it (PRD-driven).
4. **Figma has "계정", "비밀번호", "고객센터", "앱 버전"** — PRD does not list these. Prototype follows Figma here.
5. **Label difference**: PRD says "서비스이용약관", Figma says "이용약관", prototype says "서비스 이용약관".

### Section ordering

| Section | Figma Order | Prototype Order |
|---------|-------------|-----------------|
| Section 1 | 계정, 비밀번호 | 계정, 비밀번호 |
| Section 2 | 이용약관, 개인정보처리방침, 고객센터, 소식알림 | 알림설정, 차단관리 |
| Section 3 | 탈퇴하기, 앱버전 | 서비스이용약관, 개인정보처리방침, 고객센터 |
| Section 4 | -- | 탈퇴하기, 앱버전 |

Prototype has 4 sections (with extra PRD items), Figma has 3 sections. The section grouping and ordering differ significantly.

---

## Top Issues (ranked by severity)

### Critical

1. **CO1 — Missing toggle switch for "소식 알림"**: Figma shows a purple toggle (#a788fd) for notification preference. Prototype has "알림 설정" with a chevron (navigation pattern) instead. This is a fundamentally different interaction — toggle vs. navigate to sub-screen. Blocks visual fidelity and possibly AC compliance.

### Major

2. **L1 — Header height 56px vs 48px**: Navigation bar is 8px taller than Figma spec.
3. **L2 — Header padding asymmetry**: Figma uses `pl-12 pr-44` to center-align the title with back button offset. Prototype uses symmetric `px-16`.
4. **L5 — Right padding on menu items**: Items with chevrons should have `pr-24`, not `pr-16`.
5. **Menu section ordering differs from Figma**: Prototype inserts PRD-only items (알림설정, 차단관리) into Section 2, pushing Figma's legal/info items to Section 3. Creates a 4th section that Figma doesn't have.

### Minor

6. Line-height mismatches (1.4 vs 1.5 on Body4-16 items).
7. Google icon missing 0.833px border.
8. Icon assets are generic SVGs, not ArrowshortLeft/ArrowshortRight from design system.
9. Gap between Google icon and email text (6px vs 4px).
