# Design System — ZZEM (MemeApp)

> Reverse-extracted from `wds-tokens/`, `@wrtn/app-design-guide`, and MemeApp implementation.
> Format: [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 9-section structure.
> Last updated: 2026-04-07

---

## 1. Visual Theme & Atmosphere

ZZEM은 모바일 네이티브 크리에이터 앱이다. 시각적 성격은 다음 관찰에서 도출된다:

**보라빛 크리에이티브 에너지** — 브랜드 색상이 purple/violet 계열(`#8752FA` light, `#A17BFF` dark)이며, 인터랙티브 요소(선택, 활성, CTA)에 집중 배치된다. 보조 색상 없이 단일 브랜드 컬러로 앱 전체의 액센트를 통일한다.
<!-- 근거: wds-tokens/primitive/color.json purple.500, component/button.json primary.fill, component/navigation.json bottom-bar.icon-active -->

**절제된 플랫 엘리베이션** — 그림자 시스템이 단일 값(`useShadow`: offset 8, blur 11, opacity 6~25%)으로 통일되어 있고, elevation xl(blur 32)은 dialog에만 사용된다. 전반적으로 플랫에 가까운 표면 위에 미세한 lift만 부여하는 방식이다.
<!-- 근거: wds-tokens/primitive/elevation.json (xs~xl), MemeApp useShadow.ts 단일 shadow -->

**부드러운 라운딩, 과하지 않은 곡선** — 주력 radius가 12~16px이며, pill shape(9999)는 chip·badge·switch처럼 명확한 의미적 구분이 필요한 소형 요소에만 사용된다. 카드와 컨테이너는 16px, 입력 필드는 12px로 일관된다.
<!-- 근거: wds-tokens/primitive/spacing.json radius scale, component/card.json radius=lg(16), component/input.json radius=md(12) -->

**정밀한 26단계 그레이스케일** — neutral 팔레트가 0(white)부터 1000(black)까지 26단계로 세분화되어 있어, 배경·표면·라인·텍스트의 명암 위계를 미세하게 조절한다. 순수 블랙(#000000) 대신 neutral.900(`#212228`)을 기본 텍스트로 사용한다.
<!-- 근거: app-design-guide/palette.ts brand_gray scale (005~990), semantic/light.json label.normal = neutral.900 -->

**Pretendard 단일 서체, 한글 최적화** — 전체 앱이 Pretendard 하나의 폰트 패밀리(Regular 400 / Medium 500 / SemiBold 600 / Bold 700)로 운영된다. 가독성 중심의 산세리프로, 장식적 요소 없이 정보 전달에 집중한다.
<!-- 근거: wds-tokens/primitive/typography.json font-family.primary = Pretendard -->

**서포터 컬러 시스템** — 사용자별로 red/blue/gray/pink/yellow 5가지 서포터 컬러 모드를 지원하며, 배경·표면·아이콘·텍스트에 tint를 적용한다. 브랜드 violet과 독립적으로 작동하는 개인화 레이어다.
<!-- 근거: app-design-guide/supporter-color.ts, theme.types.ts SupporterColorMode -->

---

## 2. Color Palette & Roles

### Brand
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `purple.500` | `#8752FA` | — | Primary brand, CTA, active states |
| `purple.400` | `#A17BFF` | — | Dark mode brand primary |
| `purple.600` | `#7040E0` | — | Hover/pressed on brand |
| `purple.50` | `#F5F0FF` | — | Brand tint surface (chip selected bg) |
| `purple.950` | `#1E0D50` | — | Dark mode brand-weak |

### Semantic (Light → Dark)
| Role | Light Token → Hex | Dark Token → Hex |
|------|-------------------|------------------|
| **Background** | `neutral.0` → `#FFFFFF` | `neutral.950` → `#141517` |
| **Background elevated** | `neutral.0` → `#FFFFFF` | `neutral.900` → `#212228` |
| **Surface primary** | `neutral.0` → `#FFFFFF` | `neutral.900` → `#212228` |
| **Surface secondary** | `neutral.50` → `#F7F8F9` | `neutral.800` → `#35373E` |
| **Label normal** | `neutral.900` → `#212228` | `neutral.100` → `#F0F1F3` |
| **Label alternative** | `neutral.600` → `#6B6E76` | `neutral.400` → `#B5B8BF` |
| **Label assistive** | `neutral.500` → `#8E9199` | `neutral.500` → `#8E9199` |
| **Label brand** | `purple.500` → `#8752FA` | `purple.400` → `#A17BFF` |
| **Line normal** | `neutral.200` → `#E4E5E9` | `neutral.700` → `#4D5058` |
| **Fill brand-primary** | `purple.500` → `#8752FA` | `purple.400` → `#A17BFF` |
| **Fill neutral-primary** | `neutral.900` → `#212228` | `neutral.0` → `#FFFFFF` |

### Status
| Status | Light | Dark |
|--------|-------|------|
| Error | `red.500` → `#FF3B30` | `red.400` → `#FF6B63` |
| Success | `green.500` → `#34C759` | `green.400` → `#4DD672` |
| Warning | `yellow.500` → `#FFCC00` | `yellow.400` → `#FFD840` |
| Info | `blue.500` → `#007AFF` | `blue.400` → `#409CFF` |

### Interaction
| State | Light | Dark |
|-------|-------|------|
| Hover | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.05)` |
| Pressed | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.10)` |
| Focused | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.12)` |

### Social Login
| Brand | Hex |
|-------|-----|
| Kakao | `#FEE500` |
| Naver | `#03C75A` |
| Google | `#4285F4` |
| Apple (light) | `#000000` |
| Apple (dark) | `#FFFFFF` |

---

## 3. Typography Rules

### Font Family
- **Primary**: Pretendard (Bold / SemiBold / Medium / Regular)
- **Fallback**: SF Pro Display, system sans-serif

### Hierarchy

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **H1** | 40px | Bold (700) | 48px (1.2) | 최상위 제목 |
| **H2** | 36px | Bold (700) | 43px (1.19) | 주요 제목 |
| **H3** | 28px | Bold (700) | 34px (1.21) | 섹션 제목 |
| **Title1** | 24px | Bold (700) | 36px (1.5) | 페이지 타이틀 |
| **Title2** | 20px | Bold (700) | 30px (1.5) | 카드 타이틀 |
| **Title3** | 18px | Bold (700) | 27px (1.5) | 서브 타이틀 |
| **Title4** | 16px | Bold (700) | 24px (1.5) | 리스트 타이틀 |
| **Subtitle4** | 16px | SemiBold (600) | 24px (1.5) | 버튼 라벨 (가장 빈번) |
| **Body1** | 16px | Medium (500) | 24px (1.5) | 본문 (강조) |
| **Body2** | 16px | Regular (400) | 24px (1.5) | 본문 (기본) |
| **Body3** | 14px | Medium (500) | 20px (1.4) | 보조 본문 (강조) |
| **Body4** | 14px | Regular (400) | 20px (1.4) | 보조 본문 |
| **Caption1** | 13px | Medium (500) | 20px (1.5) | 캡션 (강조) |
| **Caption2** | 12px | Regular (400) | 18px (1.5) | 캡션 |
| **Label1** | 20px | SemiBold (600) | 20px (1.0) | 대형 라벨 |
| **Label3** | 14px | SemiBold (600) | 14px (1.0) | 기본 라벨 |
| **Label5** | 10px | SemiBold (600) | 10px (1.0) | 소형 태그 |

### Font Scale
앱은 3단계 글꼴 크기 조절을 지원한다: `small` (기본) / `medium` / `large`.

### Principles
- **인라인 fontSize 금지** — 모든 텍스트는 Typo 컴포넌트(`Typo.Subtitle4`, `Typo.Body6` 등)를 통해 적용
- **weight 분업**: Bold = 제목, SemiBold = 버튼/라벨, Medium = 강조 본문, Regular = 일반 본문
- **가장 빈번한 스케일**: `Subtitle4`(16px SemiBold) > `Body6`(14px Medium) > `Body7`(14px Regular)

---

## 4. Component Stylings

### Button

| Variant | Fill | Label | Radius | Height (L/M/S) |
|---------|------|-------|--------|-----------------|
| **Primary** | `fill.brand-primary` (#8752FA) | `label.inverse` (#FFF) | `radius.lg` (16px) | 48/44/34 |
| **Secondary** | `fill.neutral-secondary` (#F0F1F3) | `label.normal` (#212228) | `radius.lg` (16px) | 48/44/34 |
| **Ghost** | transparent | `label.normal` (#212228) | `radius.lg` (16px) | 48/44/34 |
| **Destructive** | `status.error` (#FF3B30) | `label.inverse` (#FFF) | `radius.lg` (16px) | 48/44/34 |

- Hover: `fill.brand-strong` (#7040E0) / Disabled: `fill.disabled` (#E4E5E9)
- Padding: horizontal 24px, gap 8px
- Height는 paddingVertical이 아닌 **고정 height**로 지정

### Card
- Fill: `surface.primary` (#FFF)
- Border: `line.alternative` (#F0F1F3)
- Radius: `radius.lg` (16px)
- Padding: 16px, gap: 12px
- Elevation: `elevation.sm` (0 2 8, rgba(0,0,0,0.08))

### Input (TextField)
- Fill: `surface.secondary` (#F7F8F9)
- Fill focused: `surface.primary` (#FFF)
- Border focused: `line.focused` (#212228)
- Border error: `status.error` (#FF3B30)
- Placeholder: `label.assistive` (#8E9199)
- Radius: `radius.md` (12px)
- Height: 48px, padding: 16px horizontal, 12px vertical

### Chip
- Fill: `surface.secondary` (#F7F8F9)
- Fill selected: `fill.brand-weak` (#F5F0FF)
- Label selected: `label.brand` (#8752FA)
- Border selected: `line.brand` (#8752FA)
- Radius: `radius.full` (9999px) — pill shape
- Height: 32px, padding: 12px horizontal

### Bottom Sheet
- Fill: `background.elevated` (#FFF light / #212228 dark)
- Dimmed: `background.dimmed` (rgba(0,0,0,0.40))
- Radius: `radius.xl` (20px) — top corners only
- Padding: 20px
- Handle: 32×4px, `line.normal` color

### Dialog
- Fill: `background.elevated`
- Radius: `radius.xl` (20px)
- Padding: 24px
- Elevation: `elevation.xl` (0 16 32, rgba(0,0,0,0.20))

### Navigation
| Part | Property | Value |
|------|----------|-------|
| **Top bar** | height | 48px |
| **Top bar** | fill | `background.normal` |
| **Bottom bar** | height | 56px |
| **Bottom bar** | icon active | `fill.brand-primary` (#8752FA) |
| **Bottom bar** | icon inactive | `label.assistive` (#8E9199) |
| **Bottom bar** | divider | `line.alternative` |

### Badge
- Radius: 9999px (pill)
- Padding: 2px vertical, 8px horizontal
- Background: theme-injected color

### Switch
- Size: 48×28px, thumb padding 2px
- ON: `zzem_violet_500` (#8752FA)
- OFF: `icon_quaternary`
- Radius: 9999px

---

## 5. Layout Principles

### Spacing Scale (4px base)

```
0  1  2  4  6  8  10  12  16  20  24  28  32  40  48  56  64  80
```

### Common Patterns (코드 빈도 기반)

| Pattern | Value | Usage |
|---------|-------|-------|
| Screen horizontal padding | 16px | 대부분의 화면 좌우 여백 |
| Container padding | 16px horizontal, 12px vertical | 카드, 리스트 아이템 |
| Element gap | 8px | 요소 간 기본 간격 (가장 빈번) |
| Icon-text gap | 4px | 버튼 내 아이콘과 텍스트 |
| Section gap | 20~24px | 섹션 간 구분 |
| Large spacing | 32~40px | 페이지 헤더 아래, 주요 구분 |

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | 체크박스 |
| `sm` | 8px | 소형 컴포넌트, 태그 |
| `md` | 12px | 입력 필드, 중형 컴포넌트 |
| `lg` | 16px | 카드, 버튼, 컨테이너 (주력) |
| `xl` | 20px | 바텀시트, 다이얼로그 |
| `2xl` | 24px | 특수 용도 |
| `full` | 9999px | Chip, Badge, Switch (pill) |

### Grid
- 2열 그리드: `gap: 8px`, container padding 16px
- 카드 aspectRatio: 1.25 (가로 > 세로)

### Touch Targets
- 최소 44px (medium button height)
- 권장 48px (large button, input height)

---

## 6. Depth & Elevation

### Shadow Levels

| Level | Token | Y | Blur | Spread | Color | Usage |
|-------|-------|---|------|--------|-------|-------|
| **None** | `none` | 0 | 0 | 0 | transparent | 배경, 인라인 요소 |
| **XS** | `xs` | 1 | 2 | 0 | `rgba(0,0,0,0.05)` | 미세한 구분 |
| **SM** | `sm` | 2 | 8 | 0 | `rgba(0,0,0,0.08)` | 카드 기본 |
| **MD** | `md` | 4 | 16 | 0 | `rgba(0,0,0,0.12)` | 플로팅 요소 |
| **LG** | `lg` | 8 | 24 | 0 | `rgba(0,0,0,0.16)` | 드롭다운, 팝오버 |
| **XL** | `xl` | 16 | 32 | 0 | `rgba(0,0,0,0.20)` | 다이얼로그 전용 |

### App-Level Shadow (`useShadow` Hook)

MemeApp은 모든 elevated surface에 **단일 shadow 규격**을 적용한다:

```
iOS:     shadowColor: #00000010, offset: {0, 8}, opacity: 1, radius: 11
Android: shadowColor: #00000040, elevation: 17
```

이 값은 토큰의 `sm`~`md` 사이에 해당하며, 앱 전체에서 일관된 떠 있는 느낌을 부여한다.

### Opacity Scale

| Value | Usage |
|-------|-------|
| `1.0` | Active, selected |
| `0.8` | 강조된 오버레이 |
| `0.6~0.7` | 반투명 오버레이 |
| `0.4` | Disabled, dimmed (가장 빈번한 비활성 상태) |
| `0.05~0.12` | Interaction hover/pressed/focused |

### Philosophy
- **Single shadow model**: 컴포넌트마다 다른 그림자를 만들지 않는다. `useShadow()` 하나로 통일.
- **Neutral shadows only**: 그림자 색상에 브랜드 컬러를 섞지 않는다. 항상 검정 기반 rgba.
- **Flat-leaning**: 대부분의 표면이 elevation none~sm. 강한 그림자(lg, xl)는 모달/다이얼로그에만 사용.

---

## 7. Do's and Don'ts

### Do

- **Theme key로만 색상 참조** — `theme["zzem_violet_500"]`, `theme["surface_secondary"]`. hex 하드코딩 금지.
  <!-- 근거: MemeApp 전체에서 inline hex 0건, theme key 참조 100% -->
- **Typo 컴포넌트로 텍스트 스타일링** — `<Typo.Subtitle4>`, `<Typo.Body6>`. inline fontSize/fontWeight 금지.
  <!-- 근거: Typo 사용 150+ instances, inline fontSize 0건 -->
- **`useShadow()` 훅으로 그림자 적용** — 카드, 버튼, 플로팅 요소 모두 동일한 shadow.
  <!-- 근거: useShadow.ts 단일 정의, 커스텀 shadow 0건 -->
- **선택 상태는 violet 계열** — `zzem_violet_500`(활성), `zzem_violet_600`(pressed), `zzem_violet_100`(tint bg).
  <!-- 근거: switch.styles.ts, chip 토큰, navigation bottom-bar 모두 동일 패턴 -->
- **비활성 상태는 opacity 0.4** — 선택/미선택 토글에서 일관된 dimming 값.
  <!-- 근거: badge, switch, list item 등에서 opacity 0.4 패턴 반복 -->
- **버튼 높이는 고정 height** — padding으로 높이를 결정하지 않고, height: 48/44/34px 직접 지정.
  <!-- 근거: regular-button.tsx height preset map -->
- **`surface_secondary`를 기본 카드/컨테이너 배경** — primary가 아닌 secondary가 기본.
  <!-- 근거: 코드 내 surface_secondary 사용 빈도 1위 (20+ instances) -->
- **gap으로 자식 요소 간격 조절** — margin이 아닌 flex gap 사용. 기본 8px, icon-text 4px.
  <!-- 근거: gap: 8 (22 instances), gap: 4 (7 instances) -->

### Don't

- **hex 값을 인라인으로 사용하지 않는다** — 다크 모드 전환이 깨진다.
- **새로운 shadow variant를 만들지 않는다** — 항상 `useShadow()` 또는 토큰의 `elevation.*` 사용.
- **elevation xl을 일반 카드에 사용하지 않는다** — xl(blur 32)은 dialog 전용. 카드는 sm(blur 8).
  <!-- 근거: component/sheet.json dialog만 elevation.xl 참조 -->
- **borderRadius < 8px를 컨테이너에 사용하지 않는다** — 4px는 checkbox 전용 예외. 컨테이너 최소 12px.
  <!-- 근거: radius scale에서 xs(4) → sm(8) → md(12), 코드 내 4px는 checkbox만 -->
- **pure black(#000000)을 텍스트에 사용하지 않는다** — 항상 `neutral.900`(#212228) 이상. label.strong만 neutral.1000 사용.
  <!-- 근거: semantic/light.json label.normal = neutral.900, label.strong = neutral.1000 -->
- **opacity 0.5를 사용하지 않는다** — disabled는 0.4, ambient overlay는 0.6~0.7. 0.5는 어중간하다.
  <!-- 근거: MemeApp 코드 내 opacity 0.5 사용 0건, 0.4 빈번 -->
- **pill radius(9999)를 카드나 버튼에 사용하지 않는다** — pill은 chip, badge, switch 전용.
  <!-- 근거: 9999 사용처: badge.styles.ts, switch.styles.ts, chip 토큰 — 모두 소형 요소 -->
- **Bold(700)를 본문 텍스트에 사용하지 않는다** — Bold는 제목(H1~Title4) 전용. 본문 강조는 Medium(500).
  <!-- 근거: typography.json body는 medium/regular, bold는 heading/title만 -->

---

## 8. Motion & Interaction

### Duration
| Token | Value | Usage |
|-------|-------|-------|
| `fast` | 150ms | 토글, 호버, 마이크로 인터랙션 |
| `normal` | 250ms | 화면 전환, 상태 변경 |
| `slow` | 350ms | 바텀시트 진입, 복잡한 애니메이션 |

### Easing
| Token | Curve | Usage |
|-------|-------|-------|
| `standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | 기본 전환 |
| `decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | 진입 애니메이션 (바텀시트 올라옴) |
| `accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | 퇴장 애니메이션 (바텀시트 내려감) |

### Interaction States
| State | Visual Feedback |
|-------|----------------|
| Default | 기본 토큰 색상 |
| Hover | `interaction.hover` overlay (+5% opacity) |
| Pressed | `interaction.pressed` overlay (+10% opacity) |
| Focused | `interaction.focused` overlay (+12% opacity) |
| Selected | Brand color swap (`violet_500/600`) |
| Disabled | `fill.disabled` + `label.disabled` + opacity 0.4 |

### Navigation Patterns
- 화면 전환: slide-left (push), slide-right (pop)
- 바텀시트: slide-up (decelerate), slide-down (accelerate)
- 탭 전환: fade 또는 즉시 교체
- 오버레이: fade-in dimmed background + slide-up content

---

## 9. Agent Prompt Guide

### Quick Color Reference (Light Mode)
```
Brand primary:    #8752FA (purple.500)
Background:       #FFFFFF (neutral.0)
Surface primary:  #FFFFFF (neutral.0)
Surface secondary:#F7F8F9 (neutral.50)
Text primary:     #212228 (neutral.900)
Text secondary:   #6B6E76 (neutral.600)
Text assistive:   #8E9199 (neutral.500)
Line normal:      #E4E5E9 (neutral.200)
Error:            #FF3B30 (red.500)
Success:          #34C759 (green.500)
```

### Component Prompt Examples

**Primary Button:**
"height 48px, background #8752FA, text white, font Pretendard SemiBold 16px, borderRadius 16px, padding horizontal 24px. Hover: #7040E0. Disabled: background #E4E5E9, text #D1D3D8."

**Card:**
"background #FFFFFF, border 1px solid #F0F1F3, borderRadius 16px, padding 16px, gap 12px. Shadow: 0 2px 8px rgba(0,0,0,0.08). Title: Pretendard Bold 16px #212228. Body: Pretendard Regular 14px #6B6E76."

**Input Field:**
"background #F7F8F9, borderRadius 12px, height 48px, padding 16px horizontal 12px vertical. Focused: background #FFFFFF, border 1px solid #212228. Error: border 1px solid #FF3B30. Placeholder: #8E9199."

**Chip (Selected):**
"background #F5F0FF, border 1px solid #8752FA, text #8752FA, borderRadius 9999px, height 32px, padding horizontal 12px."

**Bottom Sheet:**
"background #FFFFFF (elevated), borderRadius top 20px, padding 20px. Dimmed: rgba(0,0,0,0.40). Handle: 32×4px centered, color #E4E5E9."

### Iteration Guide
1. 모든 색상은 theme key로 참조 — hex는 프로토타입에서만 사용, 프로덕션 코드에서는 금지
2. 텍스트는 반드시 Typo 컴포넌트 — fontSize를 직접 지정하지 않음
3. 그림자는 `useShadow()` 하나 — 커스텀 shadow를 만들지 않음
4. 선택 상태 = violet, 비선택 = neutral, 비활성 = opacity 0.4
5. 컨테이너 radius: 카드 16px, 입력 12px, 바텀시트/다이얼로그 20px, pill 9999px
6. 기본 간격: 요소 간 8px, icon-text 4px, 화면 좌우 16px
7. 버튼 높이 고정: Large 48 / Medium 44 / Small 34
8. Dark mode: neutral.900(#212228)이 배경, neutral.100(#F0F1F3)이 텍스트 — 반전 구조
