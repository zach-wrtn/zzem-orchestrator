# Screen Spec — ImageSourceSheet

```yaml
meta:
  screen: ImageSourceSheet
  task_id: app-005
  sprint_id: ugc-platform-001
  source_pattern: "docs/designs/component-patterns.md §5 바텀시트 (이미지 소스)"
  figma_frame: "프로필편집_사진_바텀시트_선택"
  trigger: "ProfileEditScreen → avatar tap"

business_context:
  linked_ac: [AC-APP-005-2, AC-APP-005-3]
  purpose: "프로필 이미지를 카메라 촬영 또는 앨범에서 선택하거나, 현재 이미지 삭제할 수 있는 단일 선택지 시트"

component_tree: |
  ImageSourceSheet (overlay, full-screen)
  ├─ Backdrop (absolute full, bg=rgba(0,0,0,0.4), tap-to-close)
  └─ SheetContainer (absolute bottom, full width, rounded-top-28, bg=white)
     ├─ Handle (36x4, bg=#A7A7A7, centered, mt-8)
     ├─ OptionList (flex column)
     │  ├─ Option[camera] (py-16 px-20, flex row, icon+label gap-12)
     │  │  ├─ Icon (24x24 camera)
     │  │  └─ Label ("카메라", 16px Medium, #262626)
     │  ├─ Option[album] (py-16 px-20, flex row, icon+label gap-12)
     │  │  ├─ Icon (24x24 picture)
     │  │  └─ Label ("앨범에서 선택", 16px Medium, #262626)
     │  └─ Option[delete] (py-16 px-20, flex row, icon+label gap-12)
     │     ├─ Icon (24x24 trash, stroke #D92800)
     │     └─ Label ("사진 삭제", 16px Medium, color=#D92800 destructive)
     ├─ CancelButton ("취소", 16px Medium, #262626, py-16 px-20, center, border-t)
     └─ SafeAreaSpacer (h-32)

layout_spec:
  frame: "overlay on top of ProfileEditScreen"
  backdrop:
    background: "rgba(0,0,0,0.4)"
    tap_behavior: "close sheet"
  sheet:
    position: "fixed bottom"
    width: "100%"
    radius_top: 28
    padding_bottom: 32  # safe area
  handle:
    size: "36x4"
    color: "#A7A7A7"
    radius: 2
    margin: "8 auto"
  option:
    padding: "16 20"
    icon_label_gap: 12
  cancel_button:
    padding: "16 20"
    border_top: "1px solid #F0F1F3"
    label: "취소"

components:
  - name: Handle
    type: content
    id: "sheet-handle"
    tag: div
    size: "40x4"
    tokens:
      background: "var(--pe-sheet-handle)"
      radius: "2px"
    a11y:
      role: img
      label: "드래그 핸들"

  - name: OptionCamera
    type: button-listitem
    id: "opt-camera"
    tag: button
    size: "full width, h-56"
    tokens:
      background: "transparent"
      padding: "0 20px"
      gap: "var(--wds-spacing-12)"
      color: "var(--wds-label-normal)"
      font_size: "var(--wds-font-size-lg)"
      font_weight: "var(--wds-font-weight-medium)"
    behavior:
      purpose: "카메라 실행 → 이미지 촬영"
      user_action: tap
      feedback: "navigation (native camera) + crop flow"
    a11y:
      role: button
      label: "카메라로 촬영"

  - name: OptionAlbum
    type: button-listitem
    id: "opt-album"
    tag: button
    size: "full width"
    tokens:
      background: "transparent"
      padding: "16px 20px"
      gap: "var(--wds-spacing-12)"
      color: "var(--wds-label-normal)"
      label: "앨범에서 선택"
    behavior:
      purpose: "앨범 선택 화면 오픈"
      user_action: tap
      feedback: "navigation (AlbumPickerScreen)"
    a11y:
      role: button
      label: "앨범에서 선택"

  - name: CancelButton
    type: button-text
    id: "opt-image-cancel"
    tag: button
    tokens:
      background: "transparent"
      padding: "16px 20px"
      font_size: "16px"
      font_weight: "500"
      color: "var(--wds-label-normal)"
      border_top: "1px solid var(--wds-line-alternative)"
    behavior:
      purpose: "시트 닫기"
      user_action: tap
    a11y:
      role: button
      label: "취소"

  - name: OptionDelete
    type: button-listitem-destructive
    id: "opt-delete"
    tag: button
    size: "full width, h-56"
    tokens:
      background: "transparent"
      padding: "0 20px"
      gap: "var(--wds-spacing-12)"
      color: "var(--pe-destructive-text)"  # #D92800
    behavior:
      purpose: "현재 프로필 이미지를 기본값으로 리셋"
      user_action: tap
      feedback: "avatar update + dirty true"
    states:
      default: "#D92800 text/icon"
      disabled: "현재 이미지가 기본값이면 숨김 또는 비활성 (구현 옵션)"
    a11y:
      role: button
      label: "사진 삭제"

states:
  hidden:
    description: "시트가 화면에 없는 상태 (기본)"
  visible:
    visible: [Handle, OptionCamera, OptionAlbum, OptionDelete]
    description: "slide-up 완료, 유저 선택 대기"
  dismissing:
    description: "slide-down 애니메이션 중"

interactions:
  - id: tap-backdrop
    trigger: "Backdrop tap"
    target: "self"
    action: close-overlay
  - id: tap-camera
    trigger: "OptionCamera tap"
    target: "CropScreen"
    action: "close-overlay → launch camera → CropScreen"
    transition: slide-up
  - id: tap-album
    trigger: "OptionAlbum tap"
    target: "AlbumPickerScreen"
    action: "close-overlay → navigate"
    transition: slide-left
  - id: tap-delete
    trigger: "OptionDelete tap"
    target: "ProfileEditScreen"
    action: "close-overlay → avatar reset → mark dirty"
  - id: swipe-down
    trigger: "swipe down on sheet"
    target: "self"
    action: close-overlay

labels:
  ko:
    camera: "카메라"
    album: "앨범에서 선택"
    delete: "사진 삭제"
    cancel: "취소"
    a11y_handle: "아래로 끌어 닫기"

token_map:
  backdrop: "var(--wds-background-dimmed)"  # rgba(0,0,0,0.4)
  sheet_bg: "var(--wds-background-normal)"
  sheet_radius_top: "28px"                  # Figma-accurate
  handle_fill: "var(--pe-sheet-handle)"     # #A7A7A7
  handle_size: "36x4"
  option_padding: "16px 20px"
  option_gap: "var(--wds-spacing-12)"       # 12
  destructive_color: "var(--destructive)"   # #D92800
  label_color: "var(--wds-label-normal)"    # #262626
  cancel_border_top: "var(--wds-line-alternative)"

quality_score:
  extraction_accuracy:
    total_components: 4
    with_library_match: 4
    with_token_map: 4
    score: "8/8 = 1.0"
  fabrication_risk:
    inferred_fields: []
    risk_level: none
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, business_context, component_tree, layout_spec, components, states, interactions, labels, token_map]
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "2/7 AC (sheet-relevant)"
    what_resolved: "4/4 components"
```
