# Screen Spec: ErrorSheets (CreditInsufficientSheet + HarmfulImageSheet)

> Bottom sheet 2종 — 미리보기 생성 시 BE 에러(402 INSUFFICIENT_CREDIT, 422 HARMFUL_IMAGE) 응답에 대한 사용자 안내.

## Meta

```yaml
screen_name: "ErrorSheets"
screen_archetype: "modal"
modal_subtype: "sheet"
detail_state: null
task_id: "app-005"
sprint_id: "preview-feature"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
instant_save: false
parent_screen: "FilterPreview / PreviewBottomSheet (dimmed behind)"
```

## Component Tree

```
Screen [frame: 390x844]
├── ParentBackdrop [container] (div) #parent-backdrop — dimmed parent (FilterPreview/PreviewBottomSheet 잔영)
├── OverlayBackdrop [container] (div) #overlay-backdrop — rgba(0,0,0,0.4) dim
└── Sheet (data-state toggled)
    ├── CreditInsufficientSheet [bottom-sheet] (div) #credit-insufficient-sheet
    │   ├── DragHandle [decorative] (div) #ci-handle — 40x4 #A7A7A7
    │   ├── IconBadge [icon] (div) #ci-icon — coin icon (SVG)
    │   ├── TitleText [text] (h2) #ci-title — "크레딧이 다 떨어졌어요"
    │   ├── DescriptionText [text] (p) #ci-description — "충전하고 미리보기를 계속 만들어보세요"
    │   └── CTARow [container] (div) #ci-cta-row
    │       ├── DismissButton [button-secondary] (button) #ci-dismiss — "다음에"
    │       └── RechargeButton [button-primary] (button) #ci-recharge — "충전하기"
    │
    └── HarmfulImageSheet [bottom-sheet] (div) #harmful-image-sheet
        ├── DragHandle [decorative] (div) #hi-handle — 40x4 #A7A7A7
        ├── IconBadge [icon] (div) #hi-icon — warning triangle SVG (alert tone)
        ├── TitleText [text] (h2) #hi-title — "적절하지 않은 이미지를 감지했어요"
        ├── DescriptionText [text] (p) #hi-description — "다른 이미지를 선택해주세요"
        └── RetryCTA [button-primary] (button) #hi-retry — "다른 사진 선택하기"
```

### Component Details

```yaml
components:
  - name: "OverlayBackdrop"
    id: "overlay-backdrop"
    tag: "div"
    type: "container"
    position: "overlay"
    size: "full-width x full-height"
    tokens:
      fill: "rgba(0,0,0,0.4)"
    behavior:
      purpose: "modal 인지 + 부모 화면 시각 분리"
      user_action: "탭 → close sheet"
      feedback: "visual + navigation"

  - name: "CreditInsufficientSheet"
    id: "credit-insufficient-sheet"
    tag: "div"
    type: "bottom-sheet"
    position: "sticky-bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "semantic.background.normal → #FFFFFF"
      radius: "28px 28px 0 0 (top only)"
      spacing: "12px 20px 24px 20px"
    behavior:
      purpose: "402 INSUFFICIENT_CREDIT 응답 시 사용자에게 크레딧 부족 안내 + 충전 경로 제공"
      user_action: "충전하기 또는 다음에 선택"
      feedback: "navigation"
    a11y:
      role: "dialog"
      label: "크레딧 부족 안내"

  - name: "CI-IconBadge"
    id: "ci-icon"
    tag: "div"
    type: "icon"
    size: "56x56"
    tokens:
      fill: "wds.color.purple.50 → #F3EEFF (subtle brand tint)"
      radius: "999 (pill)"
    notes: "코인 모티프 SVG — 친근한 톤, 보라 브랜드 약하게 사용"

  - name: "CI-TitleText"
    id: "ci-title"
    tag: "h2"
    type: "text"
    tokens:
      text: "semantic.label.normal → #262626"
    layout:
      alignment: "center"
    a11y:
      role: "heading"

  - name: "CI-DescriptionText"
    id: "ci-description"
    tag: "p"
    type: "text"
    tokens:
      text: "semantic.label.alternative → #6B6E76"
    layout:
      alignment: "center"
    constraints:
      max_lines: 2

  - name: "CI-DismissButton"
    id: "ci-dismiss"
    tag: "button"
    type: "button-secondary"
    size: "flex(1) x 56"
    tokens:
      fill: "wds.color.neutral.100 → #F1F1F1"
      text: "semantic.label.normal → #262626"
      radius: "16px"
    a11y:
      role: "button"
      label: "다음에"

  - name: "CI-RechargeButton"
    id: "ci-recharge"
    tag: "button"
    type: "button-primary"
    size: "flex(1) x 56"
    tokens:
      fill: "wds.color.neutral.900 → #262626"
      text: "wds.color.neutral.0 → #FFFFFF"
      radius: "16px"
    a11y:
      role: "button"
      label: "충전하기"

  - name: "HarmfulImageSheet"
    id: "harmful-image-sheet"
    tag: "div"
    type: "bottom-sheet"
    position: "sticky-bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "semantic.background.normal → #FFFFFF"
      radius: "28px 28px 0 0 (top only)"
      spacing: "12px 20px 24px 20px"
    behavior:
      purpose: "422 HARMFUL_IMAGE 응답 시 사용자에게 부적절 이미지 감지 안내 + 재선택 경로 제공"
      user_action: "다른 사진 선택하기 → PreviewBottomSheet open (image empty)"
      feedback: "navigation"
    a11y:
      role: "dialog"
      label: "부적절한 이미지 감지 안내"

  - name: "HI-IconBadge"
    id: "hi-icon"
    tag: "div"
    type: "icon"
    size: "56x56"
    tokens:
      fill: "wds.color.yellow.50 → #FFF7E0 (warning tint)"
      radius: "999 (pill)"
    notes: "warning triangle SVG (yellow.500 stroke) — alert 톤, 비난 X 정보 전달"

  - name: "HI-TitleText"
    id: "hi-title"
    tag: "h2"
    type: "text"
    tokens:
      text: "semantic.label.normal → #262626"
    layout:
      alignment: "center"
    a11y:
      role: "heading"

  - name: "HI-DescriptionText"
    id: "hi-description"
    tag: "p"
    type: "text"
    tokens:
      text: "semantic.label.alternative → #6B6E76"
    layout:
      alignment: "center"
    constraints:
      max_lines: 2

  - name: "HI-RetryCTA"
    id: "hi-retry"
    tag: "button"
    type: "button-primary"
    size: "full-width x 56"
    tokens:
      fill: "wds.color.neutral.900 → #262626"
      text: "wds.color.neutral.0 → #FFFFFF"
      radius: "16px"
    behavior:
      purpose: "재시도 단일 경로 — close sheet + open PreviewBottomSheet (image empty)"
    a11y:
      role: "button"
      label: "다른 사진 선택하기"
```

## Layout Spec

```yaml
layout_spec:
  type: stacked-overlay
  viewport: 390x844
  regions:
    - id: parent-backdrop
      position: absolute-fill
      z-index: 0
      content: "dimmed parent (FilterPreview / PreviewBottomSheet 잔영 — placeholder)"
    - id: overlay-backdrop
      position: absolute-fill
      z-index: 100
      fill: "rgba(0,0,0,0.4)"
    - id: sheet
      position: sticky-bottom
      z-index: 101
      width: full
      bg: "#FFFFFF"
      radius: "28px 28px 0 0"
      padding: "12px 20px 24px 20px"
      flex-direction: column
      gap: 16px
      align-items: center
      children:
        - drag-handle (40x4, 14px below top, 16px below)
        - icon-badge (56x56, centered, 8px gap below)
        - title (h2, center, 4px gap below)
        - description (p, center, 16px gap below)
        - cta-row (full-width, gap 8px between buttons; HarmfulImage = single full-width button)
```

## States

```yaml
states:
  credit:
    description: "CreditInsufficientSheet 노출 (402 응답)"
    active: true
    visible_components: [credit-insufficient-sheet, overlay-backdrop, parent-backdrop]
    hidden_components: [harmful-image-sheet]

  harmful:
    description: "HarmfulImageSheet 노출 (422 응답)"
    visible_components: [harmful-image-sheet, overlay-backdrop, parent-backdrop]
    hidden_components: [credit-insufficient-sheet]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#overlay-backdrop"
    action: close-overlay
    transition: slide-down
    note: "모바일 표준 — backdrop 탭 시 sheet 닫힘 (modal 강제 룰 #2)"

  - trigger: tap
    target: "#ci-dismiss"
    action: close-overlay
    transition: slide-down

  - trigger: tap
    target: "#ci-recharge"
    action: navigate
    destination: "WalletScreen (out-of-scope, demo: close sheet)"
    transition: slide-left

  - trigger: tap
    target: "#hi-retry"
    action: close-overlay-and-reopen
    destination: "PreviewBottomSheet (image empty)"
    transition: slide-down → slide-up
    note: "AC 2.1.7 — close error sheet + open PreviewBottomSheet (image empty)"
```

## Visual Rules

```yaml
rules:
  - condition: "parent screen 이 dimmed 로 잔영 노출"
    effect: "사용자가 sheet 가 부모 위에 떠 있음을 인지 — modal 강제 룰 #1 (backdrop)"
    example: "FilterPreview 가 sheet 뒤로 약간 보임"

  - condition: "modal_subtype: sheet (picker/action_sheet 아님)"
    effect: "modal 강제 룰 #3 (primary 1개) 적용 — Harmful 은 single CTA, Credit 은 dual (primary + secondary)"
    example: "HarmfulImageSheet 는 [다른 사진 선택하기] 1개. CreditInsufficientSheet 는 [충전하기] primary + [다음에] secondary."

  - condition: "warning iconography 는 비난 톤이 아닌 정보 전달 톤"
    effect: "yellow.50 background + yellow.500 stroke triangle — destructive red 사용 금지"
    example: "사용자 사진을 거부하는 메시지지만 책임을 사용자에게 돌리지 않음"
```

## Labels (ko)

```yaml
labels:
  credit_insufficient:
    title: "크레딧이 다 떨어졌어요"
    description: "충전하고 미리보기를 계속 만들어보세요"
    primary_cta: "충전하기"
    secondary_cta: "다음에"
  harmful_image:
    title: "적절하지 않은 이미지를 감지했어요"
    description: "다른 이미지를 선택해주세요"
    primary_cta: "다른 사진 선택하기"
```

## Token Map

```yaml
tokens:
  background_sheet: "semantic.background.normal → #FFFFFF"
  text_title: "semantic.label.normal → #262626"
  text_description: "semantic.label.alternative → #6B6E76"
  backdrop: "rgba(0,0,0,0.4)"
  drag_handle: "wds.color.neutral.300 → #A7A7A7"
  button_primary_fill: "wds.color.neutral.900 → #262626"
  button_primary_label: "wds.color.neutral.0 → #FFFFFF"
  button_secondary_fill: "wds.color.neutral.100 → #F1F1F1"
  button_secondary_label: "semantic.label.normal → #262626"
  ci_icon_bg: "wds.color.purple.50 → #F3EEFF"
  ci_icon_fg: "wds.color.purple.500 → #8752FA"
  hi_icon_bg: "wds.color.yellow.50 → #FFF7E0"
  hi_icon_fg: "wds.color.yellow.600 → #E08800"
  sheet_radius_top: "radius.bottom-sheet → 28px"
  button_radius: "radius.cta → 16px"
```

## TestIDs (RN 구현 참조)

```
meme.harmfulImageSheet.sheet
meme.harmfulImageSheet.title
meme.harmfulImageSheet.description
meme.harmfulImageSheet.retryCta
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 13
    with_token_map: 13
    with_html_mapping: 13
    score: "26 / 26 = 1.00"
  fabrication_risk:
    inferred_fields:
      - "CreditInsufficientSheet.description (PRD 미명시 — 자연스러운 보조 카피 추가)"
      - "CreditInsufficientSheet.secondary_cta '다음에' (PRD 명시 X — modal 패턴 관례)"
    risk_level: "low"
    note: "기존 sheet 의 정확한 카피는 코드 재사용으로 결정됨 — 본 프로토타입은 시각 참조 목적의 합리적 추정"
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "9 / 9 = 1.00 (전 섹션 + Visual Rules 추가)"
  context_coverage:
    why_linked: "2 / 2 (AC 2.1.6, 2.1.7 모두 연결)"
    what_resolved: "13 / 13 (전 컴포넌트 토큰 매핑 완료)"
```

## Modal Persona Audit

```yaml
modal_force_rules:
  rule_1_backdrop_opacity: PASS  # rgba(0,0,0,0.4)
  rule_2_two_way_dismiss:
    credit: PASS  # backdrop tap + 다음에 buttons
    harmful: PASS  # backdrop tap + retry CTA closes sheet
  rule_3_primary_count:
    credit: PASS  # primary 1 (충전하기) + secondary 1 (다음에)
    harmful: PASS  # primary 1 (다른 사진 선택하기), secondary 0
  rule_4_title_or_context: PASS  # 두 sheet 모두 명확한 h2 title
```
