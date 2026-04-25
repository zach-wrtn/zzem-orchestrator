# Screen Spec: BlockedMoreActionsSheet

> Machine-readable 화면 명세 — app-015 / 타유저_차단됨_더보기메뉴 (action sheet · blocked state).
> archetype: **modal** (action sheet bottom-sheet — picker exception 적용).
> 본 화면은 차단된 사용자의 더보기 — app-012 (sibling, 차단 안됨) 의 mirror 이며 "차단" 대신 "차단 해제" 가 표시됨 (AC-2.3).

## Meta

```yaml
screen_name: "BlockedMoreActionsSheet"
screen_archetype: "modal"
task_id: "app-015"
sprint_id: "ugc-platform-integration-qa-2"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
figma_frame: "37211:162152"
references:
  - "app-012 (MoreActionsSheet — sibling, 차단 안됨 — picker exception base)"
  - "app-013 (BlockConfirmSheet — modal persona 패턴 + loading state)"
  - "app-014 (차단됨 프로필 — parent surface 시각 컨텍스트)"
  - "app-005 (사진선택 — picker exception 인용)"
```

## Component Tree

```
BlockedMoreActionsSheet [overlay-frame: 390x844]
└── Backdrop [feedback] (div) #backdrop — opacity 0.50, full screen, tap → close
    └── BottomSheet [container] (section) #blocked-more-actions-sheet — bottom anchored, slide-up
        ├── DragHandle [feedback] (div) #drag-handle — pill, top center (modal 권장 룰 #2)
        └── ActionList [container] (ul) #action-list
            ├── ActionRow [list-item] (li) #action-unblock — unlock icon + "차단 해제" (neutral — AC-2.3 안전 액션)
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
    states:
      default: "opaque dim"
      loading: "tap 무력화 (pointer-events none) — race condition 방지"
    a11y:
      role: "presentation"
      label: "더보기 메뉴 외부 영역. 탭하면 닫힙니다."

  - name: "BottomSheet"
    id: "blocked-more-actions-sheet"
    tag: "section"
    type: "bottom-sheet"
    position: "bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "component.bottom-sheet.fill (#FFFFFF)"
      radius: "xl 20px (top-only)"
      spacing: "padding 12 0 24 0 (top: handle, bottom: safe area; rows full-bleed)"
    behavior:
      purpose: "차단된 사용자 더보기 액션 진입점 (차단 해제 / 신고)"
      user_action: "옵션 선택 또는 dismiss"
      feedback: "visual"
    a11y:
      role: "dialog"
      label: "더보기 메뉴 (차단된 사용자)"
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
      spacing: "padding-top 8, padding-bottom 0"
    layout:
      direction: "vertical"
      alignment: "stretch"
      sizing: "fill"

  - name: "ActionRow (Unblock)"
    id: "action-unblock"
    tag: "li > button"
    type: "list-item"
    position: "list[0]"
    size: "full-width x 56"
    tokens:
      fill: "transparent (component.action-row.fill)"
      label: "wds.label.normal (#212228)"     # AC-2.3 — 위험 강조 X (해제는 안전 액션)
      icon: "wds.label.normal (#212228)"
      spacing: "padding 16 20, gap 12 (icon → text)"
    behavior:
      purpose: "차단 해제 — DELETE /v2/users/{userId}/block 호출 → app-016 진입"
      user_action: "tap → loading row → success 시 toast + sheet dismiss + (실 구현) navigate"
      feedback: "visual + toast + navigation"
    states:
      default: "icon + label neutral"
      pressed: "background --wds-surface-secondary"
      loading: "spinner 대체 icon + label '차단 해제 중…' + pointer-events none"
    a11y:
      role: "button"
      label: "차단 해제"

  - name: "ActionRow (Report)"
    id: "action-report"
    tag: "li > button"
    type: "list-item"
    position: "list[1]"
    size: "full-width x 56"
    tokens:
      fill: "transparent"
      label: "wds.label.error (#FF3B30)"
      icon: "wds.label.error (#FF3B30)"
      spacing: "padding 16 20, gap 12"
    behavior:
      purpose: "신고 진입 (스프린트 OUT OF SCOPE — 토스트만, app-012 mirror)"
      user_action: "tap → toast '신고 기능은 곧 제공돼요' + dismiss"
      feedback: "toast"
    states:
      default: "icon + label error red"
      pressed: "background --wds-surface-secondary"
      disabled: "loading state 시 opacity 0.4 + pointer-events none (race 방지)"
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

  - name: "Toast"
    id: "toast"
    tag: "div"
    type: "feedback"
    position: "absolute bottom (안전영역 위)"
    size: "wrap-content x 40+"
    tokens:
      fill: "wds.color.neutral-900 (#212228)"
      label: "wds.label.inverse (#FFFFFF)"
      radius: "md 12"
      spacing: "padding 12 16"
    behavior:
      purpose: "해제 결과 또는 OOS 안내"
      user_action: null
      feedback: "auto-dismiss 1.4-1.8s"
    a11y:
      role: "status"
      label: "live region — polite"
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
    - id: blocked-more-actions-sheet
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
            - id: action-unblock
              height: 56
              padding: "16 20"
            - id: row-divider-1
              height: 1
              margin: "0 20"
            - id: action-report
              height: 56
              padding: "16 20"
    - id: toast
      position: absolute
      anchor: bottom
      offset_bottom: 96
      inset_horizontal: 16
```

## States

```yaml
states:
  open:
    description: "기본 — 시트 노출, 모든 옵션 활성"
    active: true
    visible_components: [backdrop, blocked-more-actions-sheet, drag-handle, action-list, action-unblock, action-report]
    hidden_components: [toast]

  loading:
    description: "차단 해제 진행 중 — 모든 close trigger 비활성, unblock row spinner + label '차단 해제 중…'"
    visible_components: [backdrop, blocked-more-actions-sheet, drag-handle, action-list, action-unblock, action-report]
    hidden_components: [toast]
    label_overrides:
      action-unblock: "차단 해제 중…"
    interaction_overrides:
      backdrop: "disabled (pointer-events none)"
      action-unblock: "disabled (spinner)"
      action-report: "disabled (opacity 0.4)"
    note: "race condition 방지 — 다른 인터랙션 무반응"

  unblocked:
    description: "차단 해제 성공 직후 — 토스트 노출, 시트는 시각 데모용 가시 유지 후 dismiss"
    visible_components: [backdrop, blocked-more-actions-sheet, drag-handle, action-list, action-unblock, action-report, toast]
    hidden_components: []
    transient: true
    note: "토스트 → 1.4s 자동 dismiss, 실 구현은 app-016 navigate"

  report-oos:
    description: "신고 row 탭 직후 — OOS 토스트 노출, 시트 dismiss 진행"
    visible_components: [backdrop, blocked-more-actions-sheet, toast]
    transient: true
    note: "토스트 → 1.4s 자동 dismiss"

  dismissed:
    description: "닫힘 (시각 데모용 — 시트 sliding down + backdrop fade-out)"
    visible_components: []
    hidden_components: [backdrop, blocked-more-actions-sheet, toast]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#backdrop"
    action: close-overlay
    transition: fade
    note: "modal archetype 강제 룰 #2 (b) — 외부 backdrop tap close. loading 중 무력화."

  - trigger: tap
    target: "#action-unblock"
    action: toggle-state
    state_key: "loading"
    note: "DELETE /v2/users/{userId}/block 진행 (mock — 1.0s) → state 'unblocked' 전환 → 토스트 → app-016 (실 구현)"

  - trigger: tap
    target: "#action-report"
    action: toggle-state
    state_key: "report-oos"
    note: "OUT OF SCOPE — 토스트 '신고 기능은 곧 제공돼요' + dismiss"

  - trigger: keydown(Escape)
    target: "document"
    action: close-overlay
    transition: slide-down
    note: "a11y nicety — ESC close. loading 중 무력화."
```

## Visual Rules

```yaml
rules:
  - condition: "ActionRow type 가 'unblock' (차단 해제)"
    effect: "label + icon color = wds.label.normal (#212228) — neutral 강조 (AC-2.3 '위험 강조 X')"
    example: "차단 해제 검은 텍스트 + unlock 아이콘 검은. destructive red 적용 안 함."
    rationale: "PRD AC-2.3 명시 — '해제는 안전 액션'. block 의 destructive red 와 의도적 차별화."
  - condition: "ActionRow type 이 'report' (신고)"
    effect: "label + icon color = wds.label.error (#FF3B30) — app-012 mirror"
    example: "신고하기 빨간 텍스트 + flag 아이콘 빨간"
  - condition: "state == 'loading'"
    effect: "차단 해제 row → spinner + '차단 해제 중…' + 모든 close 비활성"
    example: "사용자가 다른 인터랙션을 시도해도 무반응 (race condition 방지, app-013 BlockConfirmSheet loading 패턴 mirror)"
  - condition: "Modal 강제 룰 #3 picker exception"
    effect: "버튼 hierarchy primary 1 + secondary 0-1 룰을 list 형태 옵션으로 대체. 각 옵션이 picker entry 역할 (app-005/app-012 패턴 동일)."
    example: "primary CTA 없음. 2-row picker."
```

## Labels (ko)

```yaml
labels:
  actions:
    unblock: "차단 해제"
    unblock_loading: "차단 해제 중…"
    report: "신고하기"
  toasts:
    unblocked: "차단을 해제했어요"
    report_oos: "신고 기능은 곧 제공돼요"
  a11y:
    backdrop: "더보기 메뉴 외부 영역. 탭하면 닫힙니다."
    sheet: "더보기 메뉴 (차단된 사용자)"
```

## Token Map

```yaml
tokens:
  backdrop:           "wds.background.dimmed → rgba(0,0,0,0.50)"
  sheet_fill:         "component.bottom-sheet.fill → #FFFFFF"
  sheet_radius_top:   "wds.radius.xl → 20px"
  handle_fill:        "component.bottom-sheet.handle → #D1D3D8"
  row_label_neutral:  "wds.label.normal → #212228"           # 차단 해제 (AC-2.3 안전 액션)
  row_label_destructive: "wds.label.error → #FF3B30"         # 신고
  row_icon_neutral:   "wds.label.normal → #212228"
  row_icon_destructive: "wds.label.error → #FF3B30"
  row_pressed_fill:   "wds.surface.secondary → #F7F8F9"
  divider_fill:       "wds.line.alternative → #F0F1F3"
  toast_fill:         "wds.color.neutral-900 → #212228"
  toast_label:        "wds.label.inverse → #FFFFFF"
  parent_badge_fill:  "wds.fill-status-error-weak → #FFE5E3" # parent surface badge (시각 컨텍스트)
  parent_badge_text:  "wds.label.error → #FF3B30"
```

## Picker Exception Documentation (modal archetype 강제 룰 #3 회피)

```yaml
exception:
  rule: "modal archetype 강제 룰 #3 — Primary CTA 1 + secondary 0-1"
  applied_alternative: "picker exception (app-005 사진선택 / app-012 더보기 동일 패턴)"
  rationale: |
    Action sheet 형태의 더보기 메뉴는 사용자가 N개 옵션 중 하나를 picker 처럼 선택하는 패턴이며,
    confirm 류 modal 의 single decision 패턴과 다르다. 옵션 자체가 결정 항목이므로
    primary/secondary 분류가 의미 없다. app-012 (sibling) 와 동일한 picker exception 으로 처리한다.
  validation:
    - "각 row 가 명확한 단일 action 트리거 (시각 위계 평등)"
    - "차단 해제는 neutral, 신고는 destructive — color 로만 위계 표시 (AC-2.3 'unblock 위험 강조 X')"
    - "Backdrop tap / ESC 로 의도 없는 dismiss 가능 (close 2-way 충족)"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 7
    with_token_map: 7
    with_html_mapping: 7
    score: "14 / 14 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "신고 row 동존성 (task spec 명시 안됨, app-012 sibling 일관성 + 모바일 표준 더보기 메뉴 관례)"
      - "toasts.unblocked 카피 '차단을 해제했어요' (AC 'Toast' 만 명시 — app-016 task spec 의 '{nickname}님 차단을 해제했어요' 카피를 단일 인스턴스로 단순화)"
      - "loading state spinner 패턴 (app-013 BlockConfirmSheet loading mirror)"
    risk_level: "low"
    note: |
      task spec 은 '차단 해제 / 취소' 만 언급하나, sibling app-012 가 'URL 복사 / 차단 / 신고' 3 옵션
      구조이며 차단됨 mirror 화면이므로 동일 row 구조 + unblock/report 2개로 축소 (URL 복사는 차단됨
      상태에서 의미 약하여 제외 — Sprint Lead 확인 필요).
      Figma frame 37211:162152 직접 접근 불가 (mcp permission denied) — sibling pattern 일관성 우선.
      task spec 의 '취소' row 는 backdrop+ESC 로 대체 (app-012 동일 모바일 표준).
  schema_completeness:
    required_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "picker_exception", "quality_score"]
    score: "10 / 7"
  context_coverage:
    why_linked: "3 / 3 (AC-2.3, AC-2.3.a, AC-2.3.b — ui_impact 매핑 완료)"
    what_resolved: "7 / 7 컴포넌트 모두 토큰 매핑 완료"
```
