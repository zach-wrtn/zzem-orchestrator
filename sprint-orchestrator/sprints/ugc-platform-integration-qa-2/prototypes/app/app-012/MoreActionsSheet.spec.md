# Screen Spec: MoreActionsSheet

> Machine-readable 화면 명세 — app-012 / 타유저_더보기메뉴 (action sheet).
> archetype: **modal** (action sheet bottom-sheet — picker exception 적용).

## Meta

```yaml
screen_name: "MoreActionsSheet"
screen_archetype: "modal"
task_id: "app-012"
sprint_id: "ugc-platform-integration-qa-2"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
figma_frame: "37211:162175"
references:
  - "app-013 (BlockConfirmSheet — modal persona 패턴)"
  - "app-005 (사진선택 — picker exception bottom sheet)"
```

## Component Tree

```
MoreActionsSheet [overlay-frame: 390x844]
└── Backdrop [feedback] (div) #backdrop — opacity 0.50, full screen, tap → close
    └── BottomSheet [container] (section) #more-actions-sheet — bottom anchored, slide-up
        ├── DragHandle [feedback] (div) #drag-handle — pill, top center (modal 권장 룰 #2)
        └── ActionList [container] (ul) #action-list
            ├── ActionRow [list-item] (li) #action-copy — link icon + "프로필 URL 복사" (neutral)
            ├── Divider [container] (hr) — between rows
            ├── ActionRow [list-item] (li) #action-block — ban icon + "차단하기" (destructive)
            ├── Divider [container] (hr) — between rows
            └── ActionRow [list-item] (li) #action-report — flag icon + "신고하기" (destructive)
```

### Component Details

```yaml
components:
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
      user_action: "외부 영역 tap → 시트 dismiss"
      feedback: "navigation"
    a11y:
      role: "presentation"
      label: "더보기 메뉴 외부 영역. 탭하면 닫힙니다."

  - name: "BottomSheet"
    id: "more-actions-sheet"
    tag: "section"
    type: "bottom-sheet"
    position: "bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "component.bottom-sheet.fill (#FFFFFF)"
      radius: "xl 20px (top-only)"
      spacing: "padding 12 0 24 0 (top: handle, bottom: safe area; rows full-bleed)"
    behavior:
      purpose: "타유저 프로필 액션 진입점 (URL 복사 / 차단 / 신고)"
      user_action: "옵션 선택 또는 dismiss"
      feedback: "visual"
    a11y:
      role: "dialog"
      label: "더보기 메뉴"
    layout:
      direction: "vertical"
      alignment: "stretch"
      sizing: "hug"

  - name: "DragHandle"
    id: "drag-handle"
    tag: "div"
    type: "feedback"
    position: "top"
    size: "36x4"
    tokens:
      fill: "component.bottom-sheet.handle (#D1D3D8)"
      radius: "full 9999"
    behavior:
      purpose: "시트임을 시각적으로 알림 (modal 권장 룰 #2)"
    a11y:
      role: "presentation"

  - name: "ActionList"
    id: "action-list"
    tag: "ul"
    type: "list"
    position: "below handle"
    size: "full-width"
    tokens:
      spacing: "padding-top 12, padding-bottom 0"
    layout:
      direction: "vertical"
      alignment: "stretch"
      sizing: "fill"

  - name: "ActionRow (Copy URL)"
    id: "action-copy"
    tag: "li"
    type: "list-item"
    position: "list[0]"
    size: "full-width x 56"
    tokens:
      fill: "transparent (component.action-row.fill)"
      label: "wds.label.normal (#212228)"
      icon: "wds.label.normal (#212228)"
      spacing: "padding 16 20, gap 12 (icon → text)"
    behavior:
      purpose: "타유저 프로필 URL 클립보드 복사"
      user_action: "tap → copy + toast '링크가 복사되었어요' + dismiss"
      feedback: "visual + toast"
    states:
      default: "icon + label neutral"
      pressed: "background --wds-surface-secondary"
    a11y:
      role: "button"
      label: "프로필 URL 복사"
    layout:
      direction: "horizontal"
      alignment: "start"

  - name: "ActionRow (Block)"
    id: "action-block"
    tag: "li"
    type: "list-item"
    position: "list[1]"
    size: "full-width x 56"
    tokens:
      fill: "transparent"
      label: "semantic.label.error (#FF3B30)"
      icon: "semantic.label.error (#FF3B30)"
      spacing: "padding 16 20, gap 12"
    behavior:
      purpose: "차단 진입 — app-013 차단확인 modal 로 이동"
      user_action: "tap → close current sheet + open BlockConfirmSheet (app-013)"
      feedback: "navigation"
    states:
      default: "icon + label error red"
      pressed: "background --wds-surface-secondary"
    a11y:
      role: "button"
      label: "차단하기"

  - name: "ActionRow (Report)"
    id: "action-report"
    tag: "li"
    type: "list-item"
    position: "list[2]"
    size: "full-width x 56"
    tokens:
      fill: "transparent"
      label: "semantic.label.error (#FF3B30)"
      icon: "semantic.label.error (#FF3B30)"
      spacing: "padding 16 20, gap 12"
    behavior:
      purpose: "신고 진입 (스프린트 OUT OF SCOPE — 토스트만)"
      user_action: "tap → toast '신고 기능은 곧 제공돼요' + dismiss"
      feedback: "toast"
    states:
      default: "icon + label error red"
      pressed: "background --wds-surface-secondary"
      disabled: "활성화 — 단 후속 동작은 mock"
    a11y:
      role: "button"
      label: "신고하기"

  - name: "RowDivider"
    id: "row-divider"
    tag: "hr"
    type: "divider"
    size: "full-width x 1"
    tokens:
      fill: "wds.line.alternative (#F0F1F3)"
      spacing: "margin 0 20"
    behavior:
      purpose: "옵션 간 시각 분리"
    a11y:
      role: "presentation"
```

## Layout Spec

```yaml
layout_spec:
  type: overlay
  viewport: 390x844
  regions:
    - id: backdrop
      position: absolute
      inset: 0
      bg: "rgba(0,0,0,0.50)"
    - id: more-actions-sheet
      position: absolute
      anchor: bottom
      width: full
      max_height: "60% of viewport"
      type: flex-column
      padding: "12 0 24 0"
      gap: 0
      children:
        - id: drag-handle
          align: center
          margin_bottom: 4
        - id: action-list
          width: full
          type: flex-column
          children:
            - id: action-copy
              height: 56
              padding: "16 20"
            - id: row-divider-1
              height: 1
              margin: "0 20"
            - id: action-block
              height: 56
              padding: "16 20"
            - id: row-divider-2
              height: 1
              margin: "0 20"
            - id: action-report
              height: 56
              padding: "16 20"
```

## States

```yaml
states:
  open:
    description: "기본 — 시트 노출, 모든 옵션 활성"
    active: true
    visible_components: [backdrop, more-actions-sheet, drag-handle, action-list, action-copy, action-block, action-report]
    hidden_components: []

  copying:
    description: "URL 복사 직후 — 토스트 노출"
    visible_components: [backdrop, more-actions-sheet, drag-handle, action-list]
    transient: true
    note: "토스트 → 1.4s 자동 dismiss"

  dismissed:
    description: "닫힘 (시각 데모용 — 시트 sliding down + backdrop fade-out)"
    visible_components: []
    hidden_components: [backdrop, more-actions-sheet]

  block-transition:
    description: "차단하기 tap 직후 — 시트 슬라이드 다운 + 차단확인 modal 진입 토스트"
    visible_components: [backdrop, more-actions-sheet]
    transient: true
    note: "실 구현에서는 navigation push/replace; 데모에서는 토스트로 표현"
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#backdrop"
    action: close-overlay
    transition: fade
    note: "modal archetype 강제 룰 #2 (b) — 외부 backdrop tap close"

  - trigger: tap
    target: "#action-copy"
    action: toggle-state
    state_key: "copying"
    note: "URL 복사 + 토스트 + 1.4s 후 dismiss (modal 강제 룰 #2 (a) channel)"

  - trigger: tap
    target: "#action-block"
    action: navigate
    destination: "app-013 (BlockConfirmSheet)"
    transition: replace-overlay
    note: "현재 시트 dismiss → 차단확인 modal open"

  - trigger: tap
    target: "#action-report"
    action: toggle-state
    state_key: "copying"
    note: "OUT OF SCOPE — 토스트 '신고 기능은 곧 제공돼요' + dismiss"

  - trigger: keydown(Escape)
    target: "document"
    action: close-overlay
    transition: slide-down
    note: "a11y nicety — ESC close"
```

## Visual Rules

```yaml
rules:
  - condition: "ActionRow type 가 destructive (block / report)"
    effect: "label + icon color = semantic.label.error (#FF3B30)"
    example: "차단하기 빨간 텍스트 + ban 아이콘 빨간"
  - condition: "ActionRow type 이 neutral (copy)"
    effect: "label + icon color = wds.label.normal (#212228)"
    example: "프로필 URL 복사 검은 텍스트 + link 아이콘 검은"
  - condition: "Modal 강제 룰 #3 picker exception"
    effect: "버튼 hierarchy primary 1 + secondary 0-1 룰을 list 형태 옵션으로 대체. 각 옵션이 picker entry 역할 (app-005 패턴 동일)."
    example: "primary CTA 없음. 3-row picker."
```

## Labels (ko)

```yaml
labels:
  actions:
    copy: "프로필 URL 복사"
    block: "차단하기"
    report: "신고하기"
  toasts:
    copied: "링크가 복사되었어요"
    block_navigate: "차단 확인으로 이동합니다"
    report_oos: "신고 기능은 곧 제공돼요"
  a11y:
    backdrop: "더보기 메뉴 외부 영역. 탭하면 닫힙니다."
    sheet: "더보기 메뉴"
```

## Token Map

```yaml
tokens:
  backdrop:           "wds.background.dimmed → rgba(0,0,0,0.50)"
  sheet_fill:         "component.bottom-sheet.fill → #FFFFFF"
  sheet_radius_top:   "wds.radius.xl → 20px"
  handle_fill:        "component.bottom-sheet.handle → #D1D3D8"
  row_label_neutral:  "wds.label.normal → #212228"
  row_label_destructive: "wds.label.error → #FF3B30"
  row_icon_neutral:   "wds.label.normal → #212228"
  row_icon_destructive: "wds.label.error → #FF3B30"
  row_pressed_fill:   "wds.surface.secondary → #F7F8F9"
  divider_fill:       "wds.line.alternative → #F0F1F3"
  toast_fill:         "wds.color.neutral.900 → #212228"
  toast_label:        "wds.label.inverse → #FFFFFF"
```

## Picker Exception Documentation (modal archetype 강제 룰 #3 회피)

```yaml
exception:
  rule: "modal archetype 강제 룰 #3 — Primary CTA 1 + secondary 0-1"
  applied_alternative: "picker exception (app-005 사진선택 패턴 동일)"
  rationale: |
    Action sheet 형태의 더보기 메뉴는 사용자가 N개 옵션 중 하나를 picker 처럼 선택하는 패턴이며,
    confirm 류 modal 의 single decision 패턴과 다르다. 옵션 자체가 결정 항목이므로
    primary/secondary 분류가 의미 없다. app-005 사진선택 (사진찍기 / 갤러리에서 선택) 과
    동일한 picker exception 으로 처리한다.
  validation:
    - "각 row 가 명확한 단일 action 트리거 (시각 위계 평등)"
    - "destructive 액션 (block/report) 는 color 로 위계 표시 (red label)"
    - "Backdrop tap 으로 의도 없는 dismiss 가능 (close 2-way 충족)"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 8
    with_token_map: 8
    with_html_mapping: 8
    score: "16 / 16 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "toasts.copied / report_oos 한국어 카피 (PRD task spec 의 '신고는 OUT OF SCOPE 표시 only' 키워드를 토스트 메시지로 구체화)"
      - "URL 복사 옵션 (Figma 에 명시된 '프로필 URL 복사' — task spec 에는 명시 안됨, Figma frame 우선)"
    risk_level: "low"
    note: |
      Figma frame 37211:162175 에는 3개 옵션 (프로필 URL 복사 / 차단하기 / 신고하기) 이 명시.
      task spec 은 '차단 / 신고 / 취소' 로 다르게 적힘 — Figma 가 canonical 이므로 Figma 우선 채택.
      취소 row 대신 backdrop/ESC 로 close (모바일 표준).
  schema_completeness:
    required_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "picker_exception", "quality_score"]
    score: "10 / 7"
  context_coverage:
    why_linked: "1 / 1 (AC-2.1 차단 진입점 — ui_impact 매핑 완료)"
    what_resolved: "8 / 8 컴포넌트 모두 토큰 매핑 완료"
```
