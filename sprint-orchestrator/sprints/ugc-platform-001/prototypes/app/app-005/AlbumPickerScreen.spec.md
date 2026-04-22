# Screen Spec — AlbumPickerScreen

```yaml
meta:
  screen: AlbumPickerScreen
  task_id: app-005
  sprint_id: ugc-platform-001
  source_pattern: "docs/designs/component-patterns.md §5 앨범 선택 화면"
  figma_frame: "프로필편집_사진_앨범선택"
  trigger: "ImageSourceSheet → '앨범에서 선택' tap"

business_context:
  linked_ac: [AC-APP-005-3]
  purpose: "유저 갤러리에서 프로필 이미지를 선택. 3-column 썸네일 그리드 + 앨범 드롭다운."

component_tree: |
  AlbumPickerScreen (screen, 375x812, bg=white)
  ├─ StatusBar (44h)
  ├─ Header (h-48, flex row space-between, three-slot)
  │  ├─ BackButton (24px arrow, 40x40 hit)
  │  ├─ AlbumDropdown (button, flex row gap-4, center)
  │  │  ├─ Label ("최근 항목", body1 16 semibold, color label-normal)
  │  │  └─ Chevron (▼, 16x16, color label-assistive)
  │  └─ DoneTextButton ("완료", body1 16 semibold, disabled initially)
  ├─ GridScroll (flex 1, overflow-y scroll, border-top 1px line-alternative)
  │  └─ Grid (3-col, gap 2px, row height 120px)
  │     ├─ Cell[0] CameraCell (120x120, bg=#262626 dark, flex center, icon=Camera white)
  │     ├─ Cell[1..N] PhotoCell (120x120, thumbnail)
  │     │  ├─ Thumbnail (absolute fill)
  │     │  └─ CheckboxFilled (absolute top-right, 24x24, border 2px white default)
  │     └─ Cell[selected] (border 2px #8752FA inner + purple filled checkbox w/ white checkmark)
  └─ [optional SafeAreaSpacer]

layout_spec:
  frame: "390x844"
  header:
    height: 48
    layout: "space-between"
    border_bottom: "1px #F0F1F3"
  grid:
    columns: 3
    gap: "2px"
    row_height: 120
  cell:
    size: "120x120"
    camera_cell_background: "#262626"
    camera_cell_icon_color: "#FFFFFF"
    selection_border: "2px solid #8752FA"
  checkbox:
    size: "24x24"
    position: "absolute top-8 right-8"
    background_selected: "#8752FA"
    background_default: "transparent, border 2px white"

components:
  - name: BackButton
    type: icon-button
    id: "btn-album-close"
    tag: button
    size: "40x40"
    tokens:
      color: "var(--wds-label-normal)"
      icon: "ArrowshortLeft_Stroke_L (24px)"
    a11y:
      role: button
      label: "뒤로가기"

  - name: AlbumDropdown
    type: button-dropdown
    id: "btn-album-dropdown"
    tag: button
    tokens:
      gap: "var(--wds-spacing-4)"
      color: "var(--wds-label-normal)"
      font_size: "var(--wds-font-size-lg)"
      font_weight: "var(--wds-font-weight-semibold)"
    behavior:
      purpose: "앨범 목록 전환 (최근 항목 / 셀카 / 사진 / ...)"
      user_action: tap
      feedback: "dropdown list"
    a11y:
      role: button
      label: "앨범 선택"

  - name: DoneTextButton
    type: text-button
    id: "btn-album-done"
    tag: button
    tokens:
      color_enabled: "var(--wds-fill-brand-primary)"
      color_disabled: "var(--wds-label-assistive)"
      font_weight: "var(--wds-font-weight-semibold)"
    states:
      default: "disabled (no selection)"
      enabled: "1개 선택됨 → brand color"
    a11y:
      role: button
      label: "완료"

  - name: CameraCell
    type: grid-cell-action
    id: "album-cell-0"
    tag: button
    size: "120x120"
    tokens:
      background: "#262626"
      color: "#FFFFFF"
    behavior:
      purpose: "카메라 촬영 진입 (앨범 그리드 첫 셀)"
      user_action: tap
      feedback: "native camera"
    a11y:
      role: button
      label: "카메라로 촬영"

  - name: PhotoCell
    type: grid-cell
    id: "album-cell-{n}"
    tag: button
    size: "120x120"
    tokens:
      background: "placeholder gradient"
    behavior:
      purpose: "썸네일 선택"
      user_action: tap
      feedback: "border + checkbox filled"
    states:
      default: "no border, unfilled checkbox"
      selected: "2px #8752FA border inner + filled checkbox"
    a11y:
      role: button
      label: "사진 선택"

  - name: CheckboxFilled
    type: indicator
    id: "cbx-{i}"
    tag: span
    size: "24x24"
    tokens:
      background_selected: "var(--wds-fill-brand-primary)"
      background_default: "transparent"
      border_default: "2px solid white"
      color: "white"
      radius: "var(--wds-radius-full)"

states:
  default:
    visible: [CloseButton, AlbumDropdown, DoneTextButton (disabled), CameraCell, PhotoCell (x N)]
    description: "앨범 진입 시, 선택 없음"
  selected:
    visible: [PhotoCell selected with border + checkbox filled, DoneTextButton (enabled)]
    description: "1개 선택됨 → 완료 활성"
  album-dropdown-open:
    description: "앨범 목록 표시 (본 프로토타입에서는 미구현 옵션)"

interactions:
  - id: tap-close
    trigger: "CloseButton tap"
    target: "ProfileEditScreen"
    action: close-overlay
  - id: tap-dropdown
    trigger: "AlbumDropdown tap"
    target: "album list"
    action: "show album list (optional)"
  - id: tap-camera-cell
    trigger: "CameraCell tap"
    target: "CropScreen"
    action: "native camera → CropScreen"
  - id: tap-photo
    trigger: "PhotoCell tap"
    target: "self"
    action: "select photo + enable DoneTextButton"
  - id: tap-done
    trigger: "DoneTextButton tap (enabled)"
    target: "CropScreen"
    action: "navigate with selected image"

labels:
  ko:
    album_default: "최근 항목"
    done: "완료"
    a11y_close: "닫기"
    a11y_camera_cell: "카메라로 촬영"

token_map:
  header_border: "var(--wds-line-alternative)"
  grid_gap: "2px"
  grid_row: "120px"
  camera_cell_bg: "#262626"
  camera_cell_icon: "#FFFFFF"
  selection_border: "2px solid var(--selection_purple)"   # #8752FA
  checkbox_bg_selected: "var(--selection_purple)"
  checkbox_border_default: "2px solid #FFFFFF"
  done_enabled_color: "var(--wds-fill-brand-primary)"

quality_score:
  extraction_accuracy:
    total_components: 6
    with_library_match: 6
    with_token_map: 6
    score: "12/12 = 1.0"
  fabrication_risk:
    inferred_fields: ["album label '최근 항목' 관례 기본값", "DoneTextButton enabled color brand (§5 미명시)"]
    risk_level: low
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, business_context, component_tree, layout_spec, components, states, interactions, labels, token_map]
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "1/7 AC"
    what_resolved: "6/6 components"
```
