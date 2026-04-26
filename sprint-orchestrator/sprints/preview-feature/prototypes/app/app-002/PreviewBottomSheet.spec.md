# Screen Spec: PreviewBottomSheet

> Machine-readable 화면 명세 — APP-002 / preview-feature sprint.

## Meta

```yaml
screen_name: "PreviewBottomSheet"
screen_archetype: "modal"
modal_subtype: "sheet"
task_id: "app-002"
sprint_id: "preview-feature"
app: "ZZEM / MemeApp"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
mode: "simple"  # 간략 모드 — variants/preview gate skipped
```

## Component Tree

```
ParentContext [scrim] (section) #FilterPreviewParent
└── (dimmed FilterPreview behind backdrop — visual context only)

PreviewBottomSheet [overlay-content] (section) #PreviewBottomSheet
├── Backdrop [scrim] (div) #backdrop — rgba(0,0,0,0.50)
└── Sheet [container] (div) #sheet
    ├── Handle [drag-handle] (div) #handle — 40x4 #A7A7A7, top-center
    ├── HeaderBlock [container] (header) #sheet-header
    │   ├── Title [text] (h2) #sheet-title — "결과물 미리보기"
    │   └── Description [text] (p) #sheet-description — "결과물을 미리 확인한 뒤 비디오를 만들 수 있어요"
    ├── ImageAttachZone [container] (div) #image-attach-zone
    │   ├── ZoneEmpty [container] (button) [data-state="ImageEmpty"] #image-zone-empty
    │   │   ├── PlusIcon [icon] (span) #plus-icon — "+"
    │   │   └── ZoneLabel [text] (span) #zone-label — "사진 첨부"
    │   └── ZoneSelected [container] (div) [data-state="ImageSelected","InFlight"] #image-zone-selected
    │       ├── Thumbnail [image] (div) #thumbnail — selected user image
    │       └── RemoveBadge [icon-button] (button) #image-remove-button — "×" badge top-right
    └── PreviewCTAButton [button-primary] (button) #preview-cta
        ├── default state (ImageEmpty): disabled — "미리보기 🪙100"
        ├── active state (ImageSelected): enabled — "미리보기 🪙100"
        └── loading state (InFlight): aria-busy — spinner + "미리보기 중…"
```

### Component Details

```yaml
components:
  - name: "FilterPreviewParent"
    id: "FilterPreviewParent"
    tag: "section"
    type: "container"
    position: "fullscreen"
    size: "full-width"
    tokens:
      fill: "wds-background-normal"
      text: "wds-label-normal"
    notes: "Sheet open 시 dimmed backdrop 위치. 시각 콘텍스트 전달용 (실 콘텐츠 mock)."

  - name: "Backdrop"
    id: "backdrop"
    tag: "div"
    type: "scrim"
    position: "overlay"
    size: "full-width"
    tokens:
      fill: "wds-background-dimmed (rgba(0,0,0,0.50))"
    behavior:
      purpose: "부모 화면을 시각적으로 분리하고, 외부 탭으로 sheet 닫기"
      user_action: "tap"
      feedback: "navigation (close-overlay)"
    a11y:
      role: "presentation"
      label: "오버레이 닫기"

  - name: "Sheet"
    id: "sheet"
    tag: "div"
    type: "bottom-sheet"
    position: "sticky-bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "component-bottom-sheet-fill (#FFFFFF)"
      radius: "3xl (28px) — 상단만"
      spacing: "20 20 28 20"
    layout:
      direction: "vertical"
      alignment: "start"
      sizing: "hug"

  - name: "Handle"
    id: "handle"
    tag: "div"
    type: "divider"
    position: "top"
    size: "40x4"
    tokens:
      fill: "component-bottom-sheet-handle (#A7A7A7)"
      radius: "full"
    a11y:
      role: "presentation"
      label: "드래그 핸들"

  - name: "Title"
    id: "sheet-title"
    tag: "h2"
    type: "text"
    tokens:
      text: "wds-label-normal"
      spacing: "0 0 6 0"
    a11y:
      role: "heading"
      label: "결과물 미리보기"

  - name: "Description"
    id: "sheet-description"
    tag: "p"
    type: "text"
    tokens:
      text: "wds-label-alternative"
      spacing: "0 0 20 0"
    constraints:
      max_lines: 2

  - name: "ImageAttachZone"
    id: "image-attach-zone"
    tag: "div"
    type: "container"
    size: "full-width x 160"
    tokens:
      radius: "lg (16px)"
      spacing: "0 0 20 0"
    behavior:
      purpose: "이미지 1장 선택 진입점 / selected 시 thumbnail 표시"
      user_action: "tap (empty) / tap-X (remove)"
      feedback: "visual"

  - name: "ZoneEmpty"
    id: "image-zone-empty"
    tag: "button"
    type: "container"
    size: "full-width x 160"
    tokens:
      fill: "component-image-zone-fill (#F7F8F9)"
      border: "1.5 dashed component-image-zone-border (#A7A7A7)"
      radius: "lg"
      text: "wds-label-assistive"
    states:
      default: "dashed border + [+] icon + label"
      disabled: null
    a11y:
      role: "button"
      label: "사진 첨부"

  - name: "ZoneSelected"
    id: "image-zone-selected"
    tag: "div"
    type: "container"
    size: "full-width x 160"
    tokens:
      fill: "wds-surface-tertiary"
      radius: "lg"
    a11y:
      role: "img"
      label: "선택된 사진 미리보기"

  - name: "RemoveBadge"
    id: "image-remove-button"
    tag: "button"
    type: "icon-button"
    position: "absolute (top-right)"
    size: "28x28"
    tokens:
      fill: "wds-color-neutral-900 (with 0.85 alpha)"
      text: "wds-label-inverse"
      radius: "full"
    behavior:
      purpose: "선택된 이미지 제거 → ImageEmpty 상태로 복귀"
      user_action: "tap"
      feedback: "visual + state-toggle"
    a11y:
      role: "button"
      label: "이미지 제거"

  - name: "PreviewCTAButton"
    id: "preview-cta"
    tag: "button"
    type: "button-primary"
    position: "bottom"
    size: "full-width x 56"
    tokens:
      fill: "component-button-primary-fill (#262626)"
      text: "component-button-primary-label"
      radius: "lg (16px)"
      spacing: "16 20"
    states:
      default: "fill #262626 + label inverse — enabled (ImageSelected 시)"
      disabled: "fill #F0F1F3 + label #B5B8BF (ImageEmpty 시)"
      loading: "spinner inline + 텍스트 hidden, aria-busy=true (InFlight 시)"
    behavior:
      purpose: "이미지 1장과 함께 미리보기 API 호출 트리거 (POST /filters/:id/preview)"
      user_action: "tap"
      feedback: "visual (loading) + navigation (PreviewLoading 진입)"
    a11y:
      role: "button"
      label: "미리보기 (코인 100)"
```

## Layout Spec

```yaml
layout_spec:
  type: overlay-stack
  viewport: 390x844
  regions:
    - id: FilterPreviewParent
      position: fullscreen
      role: dimmed-context
    - id: backdrop
      position: overlay
      z: 100
      fill: rgba(0,0,0,0.50)
    - id: sheet
      position: sticky-bottom
      z: 101
      width: 100%
      radius: "28px 28px 0 0"
      padding: "12px 20px 28px"
      children:
        - id: handle
          align: center
          margin-bottom: 14px
        - id: sheet-header
          type: flex-column
          gap: 6px
          margin-bottom: 20px
        - id: image-attach-zone
          type: stack
          height: 160px
          margin-bottom: 20px
        - id: preview-cta
          type: full-width
          height: 56px
```

## States

```yaml
states:
  ImageEmpty:
    description: "Sheet open, 이미지 미선택. CTA disabled."
    active: true
    visible_components: [image-zone-empty, preview-cta]
    hidden_components: [image-zone-selected]
    cta_state: "disabled"

  ImageSelected:
    description: "이미지 1장 선택 완료. 썸네일 + X 표시. CTA enabled."
    visible_components: [image-zone-selected, preview-cta]
    hidden_components: [image-zone-empty]
    cta_state: "enabled"

  InFlight:
    description: "CTA 탭 → API in-flight. 버튼 spinner, 입력 차단."
    visible_components: [image-zone-selected, preview-cta]
    hidden_components: [image-zone-empty]
    cta_state: "loading"

  # Standard states (modal subset)
  default: { aliases_to: ImageEmpty }
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#image-zone-empty"
    action: toggle-state
    state_key: "ImageSelected"
    note: "프로토타입에서는 picker 호출 대신 즉시 selected 상태로 전이 (mock)"

  - trigger: tap
    target: "#image-remove-button"
    action: toggle-state
    state_key: "ImageEmpty"

  - trigger: tap
    target: "#preview-cta"
    action: toggle-state
    state_key: "InFlight"
    guard: "currentState == ImageSelected"
    note: "InFlight 진입 후 mock 1.4s 뒤 close-overlay (실제 앱은 navigate to PreviewLoading)"

  - trigger: tap
    target: "#backdrop"
    action: close-overlay
    transition: slide-down
    note: "외부 탭 → sheet 닫기 (modal #2 — 닫기 2-way)"
```

## Visual Rules

```yaml
rules:
  - condition: "이미지 미선택"
    effect: "CTA disabled (fill #F0F1F3, label #B5B8BF). dashed border zone + [+] icon."
  - condition: "이미지 선택됨"
    effect: "CTA enabled (fill #262626). 썸네일 + 우상단 X 28x28."
  - condition: "CTA 탭 → in-flight"
    effect: "버튼 라벨 hidden, spinner 표시, aria-busy=true. 외부 탭/X 비활성."
  - condition: "Sheet open"
    effect: "부모 화면 dimmed (rgba(0,0,0,0.50))."
```

## Labels (ko)

```yaml
labels:
  sheet:
    title: "결과물 미리보기"
    description: "결과물을 미리 확인한 뒤 비디오를 만들 수 있어요"
  image_zone:
    empty_label: "사진 첨부"
    empty_hint: "정면 얼굴이 잘 보이는 사진을 선택해 주세요"
  buttons:
    cta_default: "미리보기"
    cta_coin: "🪙 100"
    cta_loading: "미리보기 중…"
  a11y:
    remove_image: "이미지 제거"
    backdrop_close: "닫기"
```

## Token Map

```yaml
tokens:
  background:                 "wds-background-elevated-alternative → #FFFFFF"
  backdrop:                   "rgba(0,0,0,0.50)"
  title_text:                 "wds-label-normal → #212228"
  description_text:           "wds-label-alternative → #6B6E76"
  image_zone_fill:            "wds-surface-secondary → #F7F8F9"
  image_zone_border_dashed:   "wds-line-strong → #A7A7A7 (1.5px dashed)"
  image_zone_radius:          "lg → 16px"
  zone_label_text:            "wds-label-assistive → #8E9199"
  cta_enabled_fill:           "component-button-primary-fill → #262626"
  cta_enabled_label:          "component-button-primary-label → #FFFFFF"
  cta_disabled_fill:          "component-button-primary-disabled-fill → #F0F1F3"
  cta_disabled_label:         "component-button-primary-disabled-label → #B5B8BF"
  cta_radius:                 "lg → 16px"
  sheet_radius_top:           "3xl → 28px"
  handle_fill:                "component-bottom-sheet-handle → #A7A7A7"
  remove_badge_fill:          "wds-color-neutral-900 (rgba 0.85)"
  remove_badge_label:         "wds-label-inverse → #FFFFFF"
```

## Persona Compliance (modal · sheet)

```yaml
modal_persona:
  rule_1_backdrop_opacity: passed       # rgba(0,0,0,0.50) ≥ 0.4
  rule_2_close_2way: passed             # backdrop tap + (선택 시) X 버튼
  rule_3_primary_count: passed          # primary 1 (CTA) + secondary 0
  rule_4_title_or_context: passed       # h2 "결과물 미리보기"
  recommended_1_bottom_sheet: passed
  recommended_2_drag_handle: passed
  recommended_4_cancel_row: n/a         # subtype=sheet, picker 아님
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 11
    with_token_map: 11
    with_html_mapping: 11
    score: "22 / 22 = 1.00"
  fabrication_risk:
    inferred_fields:
      - "description copy ('결과물을 미리 확인한 뒤 비디오를 만들 수 있어요') — task spec 의 '부연 설명' 가이드 기반으로 합리적으로 작성 (지시 허용)"
      - "empty_hint copy — UX 보강용 (프로토타입 한정, 옵션)"
    risk_level: "low"
  schema_completeness:
    required_sections: ["meta","component_tree","layout_spec","states","interactions","labels","token_map"]
    present_sections:  ["meta","component_tree","layout_spec","states","interactions","labels","token_map","visual_rules","persona_compliance"]
    score: "9 / 7 (extras included)"
  context_coverage:
    why_linked: "3 / 3 ACs (2.1.2, 2.1.3, 2.1.4)"
    what_resolved: "all tokens resolved from docs/designs/foundations + components"
```
