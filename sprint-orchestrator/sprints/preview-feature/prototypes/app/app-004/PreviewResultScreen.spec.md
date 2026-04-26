# Screen Spec: PreviewResultScreen

## Meta

```yaml
screen_name: "PreviewResultScreen"
screen_archetype: "detail"
modal_subtype: null
detail_state: "normal"
task_id: "app-004"
sprint_id: "preview-feature"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
instant_save: false
```

## Component Tree

```
Screen [frame: 390x844, fill: #000000]
├── ResultImage [image] (div) #result-image — full-bleed 9:16 placeholder gradient
├── CloseButton [icon-button] (button) #close-button — 좌상단 X overlay (반투명 backdrop)
└── BottomActionBar [container] (div) #bottom-action — sticky bottom, safe-area
    └── ProceedCTA [button-primary] (button) #proceed-cta — "이 이미지로 만들기 🪙3,860"

Modal: CancelDialog (overlay)
├── DialogBackdrop [overlay] (div) #cancel-dialog-backdrop
└── DialogCard [card] (div) #cancel-dialog
    ├── DialogTitle [text] (h2) #cancel-dialog-title — "지금 나가면 이 결과를 다시 볼 수 없어요"
    └── DialogActions [container] (div) #cancel-dialog-actions
        ├── DialogCancel [button-secondary] (button) #cancel-dialog-cancel — "취소"
        └── DialogConfirm [button-destructive] (button) #cancel-dialog-confirm — "나가기"
```

### Component Details

```yaml
components:
  - name: ResultImage
    id: result-image
    tag: div
    type: image
    position: top
    size: full-width x calc(844px - safe areas)
    tokens:
      fill: "linear-gradient (placeholder, neutral)"
      radius: "0 (full-bleed)"
    behavior:
      purpose: "i2i 결과를 9:16 비율로 노출하여 사용자가 i2v 진행 여부를 결정"
      user_action: "시각 검토"
      feedback: visual
    a11y:
      role: img
      label: "AI 생성 이미지 결과"
    constraints:
      content_policy: "워터마크 layer 없음 (BR-6). 텍스트/로고 placeholder 금지."

  - name: CloseButton
    id: close-button
    tag: button
    type: icon-button
    position: overlay
    size: 40x40
    tokens:
      fill: "rgba(0,0,0,0.4) (반투명 backdrop)"
      text: "#FFFFFF"
      radius: "full (999px)"
      spacing: "0"
    behavior:
      purpose: "결과 화면 이탈 진입점"
      user_action: "탭"
      feedback: navigation
    a11y:
      role: button
      label: "닫기"

  - name: ProceedCTA
    id: proceed-cta
    tag: button
    type: button-primary
    position: sticky-bottom
    size: full-width x 56
    tokens:
      fill: "#262626 (button.primary fill)"
      text: "#FFFFFF"
      radius: "16 (CTA)"
      spacing: "16 24 16 24"
    behavior:
      purpose: "i2v 생성 트리거 (APP-006)"
      user_action: "탭"
      feedback: navigation
    a11y:
      role: button
      label: "이 이미지로 만들기, 3,860 크레딧"

  - name: CancelDialog
    id: cancel-dialog
    tag: div
    type: card
    position: overlay
    size: 320 x wrap-content
    tokens:
      fill: "#FFFFFF"
      radius: "16"
      spacing: "24 20 16 20"
    behavior:
      purpose: "이탈 시 결과 소실 경고"
      user_action: "탭"
      feedback: visual
    a11y:
      role: dialog
      label: "결과 화면 나가기 확인"

  - name: DialogConfirm
    id: cancel-dialog-confirm
    tag: button
    type: button-primary
    position: bottom
    size: full-width x 48
    tokens:
      fill: "#262626"
      text: "#FFFFFF"
      radius: "12"
    behavior:
      purpose: "결과 폐기 확정"
      user_action: "탭"
      feedback: navigation
    a11y:
      role: button
      label: "나가기"

  - name: DialogCancel
    id: cancel-dialog-cancel
    tag: button
    type: button-secondary
    position: bottom
    size: full-width x 48
    tokens:
      fill: "#F1F1F1"
      text: "#262626"
      radius: "12"
    a11y:
      role: button
      label: "취소"
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 390x844
  background: "#000000"
  regions:
    - id: result-image
      position: absolute
      inset: "0 0 0 0"
      aspect: "9:16"
      object_fit: cover
    - id: close-button
      position: absolute
      top: "calc(env(safe-area-inset-top, 44px) + 12px)"
      left: "16px"
      size: "40x40"
      z_index: 10
    - id: bottom-action
      position: absolute
      bottom: "0"
      left: "0"
      right: "0"
      padding: "12px 20px calc(env(safe-area-inset-bottom, 34px) + 12px) 20px"
      background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))"
      z_index: 10
  overlay:
    - id: cancel-dialog-backdrop
      inset: "0 0 0 0"
      background: "rgba(0,0,0,0.5)"
      z_index: 100
    - id: cancel-dialog
      centered: true
      width: "320px"
      z_index: 101
```

## States

```yaml
states:
  default:
    description: "결과 이미지 + sticky CTA 노출"
    active: true
    visible_components: [result-image, close-button, bottom-action]
    hidden_components: [cancel-dialog-backdrop, cancel-dialog]

  cancel-dialog-open:
    description: "X 탭 후 중앙 confirm 다이얼로그 노출"
    visible_components: [result-image, close-button, bottom-action, cancel-dialog-backdrop, cancel-dialog]
    hidden_components: []
    labels:
      title: "지금 나가면 이 결과를 다시 볼 수 없어요"
      cancel: "취소"
      confirm: "나가기"

  loading:
    description: "이미지 로딩 (skeleton)"
    visible_components: [result-image, close-button, bottom-action]
    hidden_components: []

  error:
    description: "이미지 만료/실패"
    visible_components: [close-button, error-view]
    hidden_components: [result-image, bottom-action]
    labels:
      message: "이미지를 불러오지 못했어요"
      retry: "다시 시도"
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#close-button"
    action: toggle-state
    state_key: "cancel-dialog-open"

  - trigger: tap
    target: "#cancel-dialog-cancel"
    action: toggle-state
    state_key: "default"

  - trigger: tap
    target: "#cancel-dialog-confirm"
    action: toggle-state
    state_key: "default"
    side_effect: "POST /preview-contents/{contentId}/cancel + navigate.replace(FilterPreview)"

  - trigger: tap
    target: "#proceed-cta"
    action: toggle-state
    state_key: "default"
    side_effect: "POST /preview-contents/{contentId}/proceed (APP-006)"

  - trigger: tap
    target: "#cancel-dialog-backdrop"
    action: toggle-state
    state_key: "default"
```

## Visual Rules

```yaml
rules:
  - condition: "결과 이미지 표시"
    effect: "워터마크 layer 미적용"
    example: "BR-6 — 워터마크 absolute layer/overlay 없음"
  - condition: "i2vCredit 계산"
    effect: "CTA 라벨에 parent.requiredCredit - previewCredit 표시"
    example: "3,960 - 100 = 3,860"
  - condition: "CTA 위치"
    effect: "iOS home indicator 위에 항상 fully visible — safe-area-inset-bottom padding"
    example: "padding-bottom: calc(env(safe-area-inset-bottom, 34px) + 12px)"
  - condition: "CloseButton overlay"
    effect: "이미지 위에 떠 있으나 반투명 backdrop으로 가독성 보장"
    example: "rgba(0,0,0,0.4) circular fill"
```

## Labels (ko)

```yaml
labels:
  buttons:
    proceed: "이 이미지로 만들기 🪙3,860"
    dialog_cancel: "취소"
    dialog_confirm: "나가기"
  dialog:
    title: "지금 나가면 이 결과를 다시 볼 수 없어요"
  a11y:
    close: "닫기"
    image: "AI 생성 이미지 결과"
```

## Token Map

```yaml
tokens:
  screen_background: "primitive.color.neutral.1000 → #000000"
  card_fill: "wds.color.neutral.0 → #FFFFFF"
  button_primary_fill: "wds.color.neutral.900 → #262626"
  button_primary_label: "wds.color.neutral.0 → #FFFFFF"
  button_secondary_fill: "wds.color.neutral.100 → #F1F1F1"
  button_secondary_label: "wds.color.neutral.900 → #262626"
  text_primary: "semantic.label.normal → #1A1613"
  text_dim: "semantic.label.alternative → #5A544C"
  overlay_dim: "rgba(0,0,0,0.5)"
  icon_overlay_fill: "rgba(0,0,0,0.4)"
  icon_overlay_label: "wds.color.neutral.0 → #FFFFFF"
  radius_cta: "16px"
  radius_card: "16px"
  radius_button: "12px"
  radius_full: "999px"
  font_family: "Pretendard Variable"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 6
    with_token_map: 6
    with_html_mapping: 6
    score: "12 / 12"
  fabrication_risk:
    inferred_fields: ["close button overlay backdrop tone (반투명 black) — UX 관례"]
    risk_level: "low"
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7"
  context_coverage:
    why_linked: "2 / 2"
    what_resolved: "6 / 6"
```
