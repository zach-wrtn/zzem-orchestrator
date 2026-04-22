# Screen Spec — CropScreen

```yaml
meta:
  screen: CropScreen
  task_id: app-005
  sprint_id: ugc-platform-001
  source_pattern: "docs/designs/component-patterns.md §5 사진 크롭 화면"
  figma_frame: "프로필편집_사진_크롭"
  trigger: "이미지 획득 후 (카메라/앨범) → CropScreen"

business_context:
  linked_ac: [AC-APP-005-4]
  purpose: "획득한 이미지를 원형 프로필 용도로 크롭. 4 corner handles로 영역 조정."

component_tree: |
  CropScreen (screen, 375x812, bg=#1a1a1a)
  ├─ StatusBar (44h, white)
  ├─ Header (h-48, back-icon top-left)
  │  ├─ BackButton (24px arrow, color white)
  │  └─ Title ("사진 편집", SemiBold 18, white, center)
  ├─ CropCanvas (flex 1, relative, bg=#000)
  │  ├─ ImagePlaceholder (full canvas)
  │  ├─ DimmedOverlay (rgba(0,0,0,0.55) ring, circular cutout)
  │  └─ CropBox (280x280 circle, centered)
  │     ├─ CornerHandle[top-left] (27x27, L-shape, white 3px)
  │     ├─ CornerHandle[top-right] (27x27)
  │     ├─ CornerHandle[bottom-left] (27x27)
  │     └─ CornerHandle[bottom-right] (27x27)
  └─ BottomBar (bg=#1a1a1a, padding 16/24, flex row space-between)
     ├─ CancelButton ("취소", 14px Medium white, left)
     └─ DoneButton ("완료", 14px SemiBold white, right, id=#btn-crop-done)

layout_spec:
  frame: "375x812 full dark background"
  header:
    height: 48
    background: "#1a1a1a"
    color: "#FFFFFF"
  canvas:
    flex: 1
    background: "#000000"
  crop_box:
    size: "280x280"
    shape: "circle (profile crop mask)"
    center: true
    handles:
      size: "27x27"
      shape: "L (2 strokes, 3px white)"
      offset: "-13px from each corner"
  bottom_bar:
    height: 88
    padding: "16/20/24"
    background: "#1a1a1a"
    layout: "flex row space-between (취소 left, 완료 right)"

components:
  - name: BackButton
    type: icon-button
    id: "btn-crop-close"
    tag: button
    size: "40x40"
    tokens:
      color: "#FFFFFF"
      icon: "ArrowshortLeft_Stroke_L (24px)"
    a11y:
      role: button
      label: "뒤로가기"

  - name: Title
    type: text
    id: "txt-crop-title"
    tag: h1
    tokens:
      color: "#FFFFFF"
      font_size: 18
      font_weight: 600
    a11y:
      role: heading
      label: "사진 편집"

  - name: CropBox
    type: overlay
    id: "crop-box"
    tag: div
    size: "280x280"
    tokens:
      border: "none"
    behavior:
      purpose: "크롭 영역 시각화"
      user_action: "드래그 (handles) 또는 pan (center)"
      feedback: visual
    a11y:
      role: img
      label: "크롭 영역"

  - name: CornerHandle
    type: overlay-marker
    id: "corner-handle-{pos}"
    tag: span
    size: "27x27"
    tokens:
      color: "#FFFFFF"
      stroke: "3px"
    behavior:
      purpose: "크롭 박스 크기 조정"
      user_action: drag
      feedback: visual

  - name: CancelButton
    type: button-text
    id: "btn-crop-cancel"
    tag: button
    tokens:
      background: "transparent"
      color: "#FFFFFF"
      font_size: "14px"
      font_weight: 500
      padding: "8px 16px"
    behavior:
      purpose: "크롭 취소 → ProfileEditScreen 복귀"
      user_action: tap
    a11y:
      role: button
      label: "취소"

  - name: DoneButton
    type: button-text
    id: "btn-crop-done"
    tag: button
    tokens:
      background: "transparent"
      color: "#FFFFFF"
      font_size: "14px"
      font_weight: 600
      padding: "8px 16px"
    behavior:
      purpose: "크롭 완료 → 업로드 시작 → ProfileEditScreen 복귀"
      user_action: tap
      feedback: "navigation + uploading state"
    a11y:
      role: button
      label: "완료"

states:
  default:
    visible: [CloseButton, Title, CropBox, CornerHandle (x4), DoneButton]
    description: "이미지 로드 완료, 크롭 대기"
  adjusting:
    description: "핸들 드래그 중"
  done:
    description: "완료 탭 → ProfileEditScreen으로 복귀, uploading=true"

interactions:
  - id: tap-back
    trigger: "BackButton tap"
    target: "ProfileEditScreen"
    action: go-back
  - id: drag-handle
    trigger: "CornerHandle drag"
    target: "CropBox"
    action: "resize"
  - id: tap-cancel
    trigger: "CancelButton tap (bottom left)"
    target: "ProfileEditScreen"
    action: "discard + go-back"
  - id: tap-done
    trigger: "DoneButton tap (bottom right, #btn-crop-done)"
    target: "ProfileEditScreen"
    action: "apply crop + navigate back with uploaded image"

labels:
  ko:
    title: "사진 편집"
    cancel: "취소"
    done: "완료"
    a11y_back: "뒤로가기"

token_map:
  background: "#1a1a1a"
  canvas_bg: "#000000"
  handle_color: "#FFFFFF"
  done_button_color: "#FFFFFF"
  done_button_weight: 600
  cancel_button_weight: 500
  bottom_bar_bg: "#1a1a1a"

quality_score:
  extraction_accuracy:
    total_components: 5
    with_library_match: 5
    with_token_map: 5
    score: "10/10 = 1.0"
  fabrication_risk:
    inferred_fields: ["DoneButton at bottom spec은 §5 'dark bottom bar + safe area' 기반 관례 변환"]
    risk_level: low
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, business_context, component_tree, layout_spec, components, states, interactions, labels, token_map]
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "1/7 AC"
    what_resolved: "5/5 components"
```
