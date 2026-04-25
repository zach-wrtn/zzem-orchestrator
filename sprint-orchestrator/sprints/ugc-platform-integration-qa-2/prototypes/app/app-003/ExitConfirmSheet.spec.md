# Screen Spec: ExitConfirmSheet

> Machine-readable 화면 명세 — app-003 / 프로필편집_닉네임_바텀시트_나가기확인.
> archetype: **modal** (exit-confirm bottom sheet).

## Meta

```yaml
screen_name: "ExitConfirmSheet"
screen_archetype: "modal"
task_id: "app-003"
sprint_id: "ugc-platform-integration-qa-2"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"   # iPhone 14 Pro frame (Figma source 375x812 → 390x844 normalize)
theme: "light"
figma_frame: "37160:79969"
parent_screen: "app-001 (프로필편집_메인) — dirty (닉네임 변경 후) 상태"
```

## Component Tree

```
ExitConfirmSheet [overlay-frame: 390x844]
├── ParentSurface [container] (div) #parent-edit-form — 시각 컨텍스트 (app-001 dirty 캡처)
│   ├── ParentStatusBar (div)
│   ├── ParentHeader (header) — back + title "프로필 편집" (인터랙션 비활성)
│   ├── ParentProfile (section) — avatar 100x100 + camera badge
│   ├── ParentInputSection (section) — 닉네임 라벨 + filled input "까망콩 V2" (dirty)
│   └── ParentBottomAction (div) — '저장' button (active 상태)
└── Backdrop [feedback] (div) #backdrop — opacity 0.50, full screen, tap → close
    └── BottomSheet [container] (section) #exit-confirm-sheet — bottom anchored, slide-up
        ├── DragHandle [feedback] (div) #drag-handle — 40x4 pill (modal 권장 룰 #2)
        ├── Title [text] (h2) #sheet-title — "변경 사항이 저장되지 않습니다" (강제 룰 #4)
        ├── Description [text] (p) #sheet-desc — "정말 나가시겠어요?"
        └── ButtonPair [container] (div) #button-pair
            ├── KeepEditingButton [button-secondary-ghost] (button) #keep-btn — "계속 편집"
            └── ExitButton [button-primary-destructive] (button) #exit-btn — "나가기" (destructive)
```

### Component Details

```yaml
components:
  - name: "ParentSurface"
    id: "parent-edit-form"
    tag: "div"
    type: "container"
    position: "absolute"
    size: "full-width x full-height"
    tokens:
      fill: "wds.background.normal (#FFFFFF)"
    behavior:
      purpose: "modal 외부 시각 컨텍스트 — 사용자가 무엇을 편집 중이었는지 환기"
      user_action: null
      feedback: null
    a11y:
      role: "presentation"
      label: null
      hint: "modal open 시 aria-hidden=true, pointer-events none"

  - name: "Backdrop"
    id: "backdrop"
    tag: "div"
    type: "container"
    position: "overlay"
    size: "full-width x full-height"
    tokens:
      fill: "wds.background.dimmed (rgba(0,0,0,0.50))"
    behavior:
      purpose: "modal 인지 + 부모 화면 시각 분리 (modal archetype 강제 룰 #1)"
      user_action: "외부 영역 tap → 시트 dismiss (강제 룰 #2 (b))"
      feedback: "navigation"
    a11y:
      role: "presentation"
      label: "나가기확인 바텀시트 외부 영역. 탭하면 닫혀요."

  - name: "BottomSheet"
    id: "exit-confirm-sheet"
    tag: "section"
    type: "bottom-sheet"
    position: "bottom"
    size: "full-width x wrap-content (~190px)"
    tokens:
      fill: "component.bottom-sheet.fill (#FFFFFF)"
      radius: "xl 20px (top-only)"
      spacing: "padding 12 20 24 20 (top: handle 영역, bottom: safe area)"
    behavior:
      purpose: "변경분 폐기 직전 사용자 의도 확인 (단일 결정)"
      user_action: "결정 (계속 편집 / 나가기) 또는 무시 (backdrop)"
      feedback: "visual"
    a11y:
      role: "dialog"
      label: "변경 사항 나가기 확인"
    layout:
      direction: "vertical"
      alignment: "center"
      sizing: "hug"

  - name: "DragHandle"
    id: "drag-handle"
    tag: "div"
    type: "feedback"
    position: "top"
    size: "40x4"
    tokens:
      fill: "component.bottom-sheet.handle (#D1D3D8)"
      radius: "full 9999"
    behavior:
      purpose: "시트임을 시각적으로 알림 (modal 권장 룰 #2)"
      user_action: "drag-down (선택적, decorative)"
      feedback: "visual"
    a11y:
      role: "presentation"

  - name: "Title"
    id: "sheet-title"
    tag: "h2"
    type: "text"
    position: "center"
    size: "wrap-content"
    tokens:
      text: "wds.label.normal (#212228)"
      font_size: "wds.font.size.xl (18px)"
      font_weight: "wds.font.weight.bold (700)"
      spacing: "margin-top 16, margin-bottom 4"
    behavior:
      purpose: "modal 콘텍스트 명확화 (modal archetype 강제 룰 #4)"
    a11y:
      role: "heading"
      label: "변경 사항이 저장되지 않습니다"
    constraints:
      max_lines: 2
      truncation: "ellipsis"

  - name: "Description"
    id: "sheet-desc"
    tag: "p"
    type: "text"
    position: "center"
    size: "wrap-content"
    tokens:
      text: "wds.label.alternative (#6B6E76)"
      font_size: "wds.font.size.md (14px)"
      font_weight: "wds.font.weight.regular (400)"
      spacing: "margin-bottom 20"
    behavior:
      purpose: "title 보조 — 액션 명확화 (선택지 환기)"
    a11y:
      role: "text"
      label: "정말 나가시겠어요?"

  - name: "ButtonPair"
    id: "button-pair"
    tag: "div"
    type: "container"
    position: "bottom"
    size: "full-width"
    tokens:
      spacing: "gap 8, margin-top 0"
    layout:
      direction: "horizontal"
      alignment: "space-between"
      sizing: "fill"

  - name: "KeepEditingButton"
    id: "keep-btn"
    tag: "button"
    type: "button-secondary-ghost"
    size: "flex 1 x 56"
    tokens:
      fill: "component.button.secondary.ghost.fill (transparent) + outline wds.line.normal"
      text: "component.button.secondary.ghost.label (#6B6E76)"
      radius: "md 12"
    behavior:
      purpose: "modal archetype 강제 룰 #2 (a) — 명시적 cancel + 강제 룰 #3 secondary"
      user_action: "tap → dismiss + 편집 form 상태 보존"
      feedback: "navigation"
    states:
      default: "outline ghost, label #6B6E76"
      hover: "fill wds.surface.secondary (#F7F8F9)"
    a11y:
      role: "button"
      label: "계속 편집"
      hint: "탭하면 바텀시트가 닫히고 편집을 이어서 할 수 있어요."

  - name: "ExitButton"
    id: "exit-btn"
    tag: "button"
    type: "button-primary-destructive"
    size: "flex 1 x 56"
    tokens:
      fill: "component.button.destructive.fill (#FF3B30)"
      text: "component.button.destructive.label (#FFFFFF)"
      radius: "md 12"
    behavior:
      purpose: "destructive primary action — 변경 폐기 + pop (modal archetype 강제 룰 #3 primary)"
      user_action: "tap → 부모 화면 pop + dirty state 폐기"
      feedback: "navigation"
    states:
      default: "fill #FF3B30, label #FFFFFF, '나가기'"
      pressed: "fill #E0241A (--component-button-destructive-fill-pressed)"
    a11y:
      role: "button"
      label: "나가기"
      hint: "탭하면 변경 사항이 폐기되고 이전 화면으로 돌아가요."
```

## Layout Spec

```yaml
layout_spec:
  type: overlay
  viewport: 390x844
  regions:
    - id: parent-edit-form
      position: absolute
      inset: 0
      type: flex-column
      note: "app-001 dirty 상태 시각 컨텍스트. modal open 시 aria-hidden + pointer-events none."
    - id: backdrop
      position: absolute
      inset: 0
      bg: "rgba(0,0,0,0.50)"
      z_index: 100
    - id: exit-confirm-sheet
      position: absolute
      anchor: bottom
      width: full
      max_height: "40% of viewport (~190px hug)"
      type: flex-column
      align: center
      padding: "12 20 24 20"
      gap: 0
      z_index: 101
      children:
        - id: drag-handle
          align: center
        - id: sheet-title
          align: center
          margin_top: 16
          margin_bottom: 4
        - id: sheet-desc
          align: center
          margin_bottom: 20
        - id: button-pair
          width: full
          type: flex-row
          gap: 8
```

## States

```yaml
states:
  open:
    description: "기본 — 시트 노출, 모든 인터랙션 활성"
    active: true
    visible_components: [parent-edit-form, backdrop, exit-confirm-sheet, drag-handle, sheet-title, sheet-desc, button-pair, keep-btn, exit-btn]
    hidden_components: []

  dismissing:
    description: "닫힘 애니메이션 — 시트 sliding down + backdrop fade-out (시각 데모용)"
    visible_components: [parent-edit-form]
    hidden_components: [backdrop, exit-confirm-sheet]
    note: "실 구현에서는 modal unmount. 데모에서는 setState('open') 으로 즉시 복원."
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#backdrop"
    action: close-overlay
    transition: fade
    note: "modal archetype 강제 룰 #2 (b) — 외부 backdrop tap close. 편집 form 상태 보존."

  - trigger: tap
    target: "#keep-btn"
    action: close-overlay
    transition: slide-down
    note: "modal archetype 강제 룰 #2 (a) + 강제 룰 #3 secondary — '계속 편집'. 편집 form 상태 보존."

  - trigger: tap
    target: "#exit-btn"
    action: navigate
    destination: "이전 화면 (MY 프로필)"
    transition: slide-down + pop
    note: "destructive primary — 변경분 폐기 + 부모 화면 pop. 데모에서는 toast + setState('open') 복원."

  - trigger: keydown
    target: "document"
    key: "Escape"
    action: close-overlay
    transition: fade
    note: "보조 channel — 강제 룰 #2 외 추가 a11y nicety."
```

## Visual Rules

```yaml
rules:
  - condition: "modal open 시"
    effect: "ParentSurface 의 모든 button/input pointer-events:none + aria-hidden=true"
    example: "back 버튼 / nickname input / 저장 버튼 모두 비활성"
  - condition: "버튼 좌/우 순서"
    effect: "좌측 secondary ('계속 편집') + 우측 destructive primary ('나가기'). iOS HIG 표준 (destructive 우측)."
  - condition: "Title 두 줄 vs 한 줄"
    effect: "기본 한 줄. 텍스트 길이가 폭 초과 시 두 줄까지 wrap (max-lines 2 + ellipsis)."
  - condition: "Figma 원문 단일 텍스트 vs spec 의 title+desc 분리"
    effect: |
      Figma frame 37160:79969 의 텍스트 노드는 단일 ('수정사항이 있습니다. 그래도 나가시겠습니까?').
      본 spec 은 task description 의 명확한 콘텍스트 패턴 (title 강조 + desc 보조) 채택.
      정확 카피는 intent.md 게이트 후 결정.
```

## Labels (ko)

```yaml
labels:
  sheet:
    title: "변경 사항이 저장되지 않습니다"
    desc: "정말 나가시겠어요?"
  buttons:
    keep: "계속 편집"
    exit: "나가기"
  parent:
    header_title: "프로필 편집"
    nickname_label: "닉네임"
    nickname_value: "까망콩 V2"
    save: "저장"
  a11y:
    backdrop: "나가기확인 바텀시트 외부 영역. 탭하면 닫혀요."
    sheet_dialog: "변경 사항 나가기 확인"
    keep_hint: "탭하면 바텀시트가 닫히고 편집을 이어서 할 수 있어요."
    exit_hint: "탭하면 변경 사항이 폐기되고 이전 화면으로 돌아가요."
```

## Token Map

```yaml
tokens:
  backdrop:               "wds.background.dimmed → rgba(0,0,0,0.50)"
  sheet_fill:             "component.bottom-sheet.fill → #FFFFFF"
  sheet_radius_top:       "wds.radius.xl → 20px"
  handle_fill:            "component.bottom-sheet.handle → #D1D3D8"
  title_text:             "wds.label.normal → #212228"
  title_font_size:        "wds.font.size.xl → 18px"
  title_font_weight:      "wds.font.weight.bold → 700"
  desc_text:              "wds.label.alternative → #6B6E76"
  desc_font_size:         "wds.font.size.md → 14px"
  keep_fill:              "component.button.secondary.ghost.fill → transparent (outline wds.line.normal #E4E5E9)"
  keep_label:             "component.button.secondary.ghost.label → #6B6E76"
  exit_fill:              "component.button.destructive.fill → #FF3B30"
  exit_label:             "component.button.destructive.label → #FFFFFF"
  exit_pressed:           "component.button.destructive.fill-pressed → #E0241A"
  button_radius:          "component.button.radius → 12px"
  parent_avatar_fill:     "pe-avatar-empty-bg → #F5F3FF (alias)"
  parent_avatar_border:   "pe-avatar-border → rgba(136,136,136,0.2)"
  parent_avatar_icon:     "wds.color.purple.400 → #A17BFF"
  parent_input_fill:      "pe-input-fill → #F7F7F7"
  parent_input_border:    "pe-input-border → #F1F1F1"
  parent_save_active:     "pe-save-active → #262626"
  parent_save_label:      "pe-save-active-label → #FFFFFF"
  parent_text_primary:    "pe-text-primary → #262626"
  parent_text_tertiary:   "pe-text-tertiary → #8A8A8A"
  parent_camera_badge:    "pe-camera-badge-fill → #E2E2E2"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 10
    with_token_map: 10
    with_html_mapping: 10
    score: "20 / 20 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "Title vs Description 분리 (Figma 단일 텍스트 → spec 두 줄 분리)"
      - "Title 카피 '변경 사항이 저장되지 않습니다' (Figma 원문은 '수정사항이 있습니다. 그래도 나가시겠습니까?')"
      - "Description '정말 나가시겠어요?' 별도 추가 (Figma 단일 텍스트에서 분리)"
    risk_level: "low"
    note: |
      task description prompt 의 명확한 카피 ('변경 사항이 저장되지 않습니다' + '계속 편집' / '나가기')
      를 따랐고, Figma frame 의 단일 텍스트 ('수정사항이 있습니다. 그래도 나가시겠습니까?') 와
      카피가 다름. 정확 카피는 intent.md 게이트로 Sprint Lead 확정 필요.
      구조는 Figma frame 과 일치 (DragHandle + 텍스트 + 2-button row 1:1).
  schema_completeness:
    required_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "9 / 7 (모든 required + visual_rules + quality_score 추가)"
  context_coverage:
    why_linked: "3 / 3 (AC-1.4, AC-1.4.a, AC-1.4.b 모두 ui_impact 매핑됨)"
    what_resolved: "10 / 10 컴포넌트 모두 토큰 매핑 완료"
```
