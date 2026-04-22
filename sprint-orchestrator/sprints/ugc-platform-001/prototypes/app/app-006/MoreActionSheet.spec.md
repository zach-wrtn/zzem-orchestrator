# Screen Spec: MoreActionSheet

## Meta

```yaml
screen_name: "MoreActionSheet"
task_id: "app-006"
sprint_id: "ugc-platform-001"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844 (overlay)"
theme: "light"
parent_screen: "OtherUserProfileScreen"
overlay_type: "bottom-sheet"
```

## Component Tree

```
MoreActionSheet [overlay, slide-up]
├── OverlayBackdrop [overlay] (div) #overlay-backdrop — rgba(0,0,0,0.4)
└── SheetContainer [container] (div) #sheet-more — rounded-top-28, bg-white
    ├── SheetHandle [container] (div) — 36x4, bg #a7a7a7, mt-10
    ├── MenuList [list] (ul)
    │   └── MenuItem-CopyUrl [button] (li) #btn-copy-url — py-16, px-20, gap-12
    │       ├── MenuIcon [icon] (span) — 🔗 (24x24)
    │       └── MenuLabel [text] (span) — "프로필 URL 복사" (16px Medium #262626)
    └── CancelButton [button] (button) #btn-cancel-sheet — py-16 full-width, border-top 1px #f1f1f1, "취소" (16px Medium #262626)
```

### Component Details

```yaml
components:
  - name: OverlayBackdrop
    id: overlay-backdrop
    tag: div
    type: container
    position: overlay
    size: "full"
    tokens:
      fill: "primitive.background.dimmed → rgba(0,0,0,0.40)"
    behavior:
      purpose: "ActionSheet 바깥 탭 감지"
      user_action: "tap → sheet 닫기"
      feedback: visual
    a11y: { role: button, label: "닫기 영역" }

  - name: SheetContainer
    id: sheet-more
    tag: div
    type: bottom-sheet
    position: sticky-bottom
    size: 390x-auto
    tokens:
      fill: "component.sheet.fill → #FFFFFF"
      radius: "28 top only (top-left/top-right 28, bottom 0)"
      padding_bottom: "20 + safe-area"
    layout: { direction: vertical, alignment: start, sizing: fill }
    a11y: { role: dialog, label: "더보기 메뉴" }

  - name: SheetHandle
    tag: div
    type: container
    size: 36x4
    tokens:
      fill: "#a7a7a7 (sheet-handle)"
      radius: "full"
      margin: "10 auto 8 (mt-10)"
    layout: { direction: horizontal, alignment: center, sizing: hug }
    a11y: { role: img, label: "시트 그래버" }

  - name: MenuList
    tag: ul
    type: list
    size: "full-width"
    layout: { direction: vertical, alignment: start, sizing: fill }

  - name: MenuItem-CopyUrl
    id: btn-copy-url
    tag: button
    type: list
    size: "full-width"
    tokens:
      fill: "transparent (pressed: rgba(0,0,0,0.05))"
      text: "#262626"
      spacing: "16 20 (py-16 px-20)"
      gap: "12"
    layout: { direction: horizontal, alignment: start, sizing: fill }
    behavior:
      purpose: "프로필 URL을 Clipboard에 복사"
      user_action: "tap → copy + close-sheet + toast"
      feedback: "haptic + toast"
    a11y: { role: button, label: "프로필 URL 복사" }
    states:
      default: "아이콘 + 라벨 가시"
      pressed: "fill: rgba(0,0,0,0.05)"
      disabled: null
    children:
      - MenuIcon (24x24, 🔗)
      - MenuLabel (16px Medium / 1.5 #262626)

  - name: CancelButton
    id: btn-cancel-sheet
    tag: button
    type: sheet-cancel
    size: full-width
    tokens:
      fill: "transparent"
      text: "#262626"
      spacing: "16 20"
      border_top: "1px #F1F1F1"
      font: "16px Medium / 1.5"
    behavior:
      purpose: "ActionSheet 닫기"
      user_action: "tap → close-overlay"
      feedback: visual
    a11y: { role: button, label: "취소" }
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 390x-auto
  regions:
    - id: overlay-backdrop
      position: absolute
      inset: "0"
      z-index: 100
    - id: sheet-more
      position: absolute
      bottom: 0
      width: 390
      z-index: 101
      children:
        - id: sheet-handle
          alignment: center
          margin: "10 auto 8"
        - id: menu-list
          padding: "4 0 0"
        - id: btn-cancel-sheet
          width: "full"
          border_top: "1px #F1F1F1"
          padding: "16 20"
          bottom-safe-area: "20px"
```

## States

```yaml
states:
  default:
    description: "ActionSheet 닫힘 (hidden)"
    active: true
    visible_components: []
    hidden_components: [overlay-backdrop, sheet-more]

  open:
    description: "ActionSheet 열림 (slide-up + backdrop fade-in)"
    visible_components: [overlay-backdrop, sheet-more, sheet-handle, menu-list, btn-copy-url, btn-cancel-sheet]
    hidden_components: []

  pressed:
    description: "메뉴 아이템 탭 직전 (press state)"
    visible_components: [overlay-backdrop, sheet-more, btn-copy-url(pressed)]
    hidden_components: []
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#overlay-backdrop"
    action: close-overlay
    transition: slide-down

  - trigger: tap
    target: "#btn-copy-url"
    action: copy-to-clipboard-and-toast
    value: "zzem://profile/{userId}"
    side_effects:
      - "Clipboard.setString('zzem://profile/{userId}')"
      - "close ActionSheet"
      - "show url-copied-toast on parent screen"
    transition: slide-down
    state_key: "url-copied-toast"

  - trigger: tap
    target: "#btn-cancel-sheet"
    action: close-overlay
    transition: slide-down
```

## Visual Rules

```yaml
rules:
  - condition: "타 유저 프로필 ActionSheet"
    effect: "'프로필 URL 복사' 메뉴만 노출"
    example: "차단/신고/팔로우 메뉴는 추가 금지 (PRD 3 소관)"
  - condition: "복사 성공"
    effect: "ActionSheet 즉시 닫히고, 부모 스크린에 토스트 2초 노출"
    example: "slide-down + toast fade-in 동시 트리거"
  - condition: "시트 높이"
    effect: "콘텐츠 wrap-content, max 80% viewport"
    example: "단일 아이템이므로 ~150px"
  - condition: "취소 버튼 스타일"
    effect: "회색 배경 대신 border-top divider로 구분"
    example: "border-top: 1px #F1F1F1, transparent bg, text 16px Medium #262626"
```

## Labels (ko)

```yaml
labels:
  menu:
    copy_url: "프로필 URL 복사"
  actions:
    cancel: "취소"
```

## Token Map

```yaml
tokens:
  backdrop: "primitive.background.dimmed → rgba(0,0,0,0.4)"
  sheet_fill: "component.sheet.fill → #FFFFFF"
  sheet_radius: "28px (top-left, top-right)"
  handle_fill: "#a7a7a7 (sheet-handle)"
  handle_size: "36x4, mt-10"
  handle_radius: "full"
  item_text: "#262626"
  item_font: "16px Medium / 1.5"
  item_padding: "py-16 px-20"
  item_gap: "12px (icon ↔ label)"
  cancel_fill: "transparent"
  cancel_text: "#262626"
  cancel_font: "16px Medium / 1.5"
  cancel_padding: "py-16"
  cancel_border_top: "1px #F1F1F1"
  pressed_fill: "rgba(0,0,0,0.05)"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 8
    with_token_map: 8
    with_html_mapping: 8
    score: "16 / 16 = 1.00"
  fabrication_risk:
    inferred_fields:
      - "CancelButton 존재 — iOS ActionSheet 관례 (PRD 명시 없음)"
      - "SheetHandle (grabber) — BottomSheet 관례 (PRD 명시 없음)"
      - "🔗 link 이모지 아이콘 — 디자인 시스템에 확정 아이콘 없음"
    risk_level: "low"
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, component_tree, component_details, layout_spec, states, interactions, visual_rules, labels, token_map, quality_score]
    score: "10 / 7 (초과 충족)"
  context_coverage:
    why_linked: "2 / 2 (AC-3, AC-4)"
    what_resolved: "8 / 8"
```
