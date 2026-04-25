# Screen Spec: UnblockConfirmSheet

> Machine-readable 화면 명세 — app-018 / 차단관리_바텀시트_해제확인.
> archetype: **modal** (confirm bottom sheet, sibling of app-013 BlockConfirmSheet).
> 본 화면은 차단관리 리스트 (app-017) → "해제" tap → 단일 사용자 해제 confirm.

## Meta

```yaml
screen_name: "UnblockConfirmSheet"
screen_archetype: "modal"
task_id: "app-018"
sprint_id: "ugc-platform-integration-qa-2"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
figma_frame: "37290:170093"
sibling_pattern: "app-013 BlockConfirmSheet (차단확인) — 동일 confirm 시트 패턴, 색상/카피 반전"
```

## Component Tree

```
UnblockConfirmSheet [overlay-frame: 390x844]
└── Backdrop [feedback] (div) #backdrop — opacity 0.50, full screen, tap → close (modal 강제 룰 #1, #2 (b))
    └── BottomSheet [container] (section) #unblock-confirm-sheet — bottom anchored, slide-up
        ├── DragHandle [feedback] (div) #drag-handle — pill, top center (modal 권장 룰 #2)
        ├── CloseButton [icon-button] (button) #close-btn — X 우상단 absolute (modal 강제 룰 #2 (a))
        ├── ProfileImage [avatar] (div) #profile-image — 100x100 circle, center (해제 대상)
        ├── Title [text] (h1) #sheet-title — "@아이디님 차단을 해제하시겠어요?"
        ├── InfoRowList [container] (ul) #info-rows
        │   ├── InfoRow [list-item] (li) #info-row-1 — unlock icon + 콘텐츠 다시 보임
        │   └── InfoRow [list-item] (li) #info-row-2 — eye icon + 활동 다시 공개
        └── ButtonPair [container] (div) #button-pair
            ├── CancelButton [button-secondary] (button) #cancel-btn — "취소" (ghost) (강제 룰 #3 secondary)
            └── UnblockButton [button-primary-brand] (button) #unblock-btn — "차단 해제하기" (brand color, neutral primary — destructive 아님)
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
      label: "차단해제 바텀시트 외부 영역. 탭하면 닫힙니다."

  - name: "BottomSheet"
    id: "unblock-confirm-sheet"
    tag: "section"
    type: "bottom-sheet"
    position: "bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "component.bottom-sheet.fill (#FFFFFF)"
      radius: "xl 20px (top-only)"
      spacing: "padding 12 20 24 20 (top: handle 영역, bottom: safe area)"
    behavior:
      purpose: "차단 해제 의도 확인 + 실수 해제 방지 (1 step confirm — AC-2.5)"
      user_action: "결정 (해제 / 취소) 또는 무시 (X / backdrop)"
      feedback: "visual"
    a11y:
      role: "dialog"
      label: "차단 해제 확인"
    layout:
      direction: "vertical"
      alignment: "center"
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
      user_action: "drag-down (선택적, decorative)"
      feedback: "visual"
    a11y:
      role: "presentation"

  - name: "CloseButton"
    id: "close-btn"
    tag: "button"
    type: "icon-button"
    position: "top-right (absolute)"
    size: "32x32"
    tokens:
      fill: "transparent"
      text: "wds.label.alternative (#6B6E76)"
    behavior:
      purpose: "명시적 close trigger — modal archetype 강제 룰 #2 (a) channel"
      user_action: "tap → 시트 dismiss"
      feedback: "navigation"
    a11y:
      role: "button"
      label: "닫기"

  - name: "ProfileImage"
    id: "profile-image"
    tag: "div"
    type: "avatar"
    position: "center"
    size: "100x100"
    tokens:
      fill: "component.avatar.fill (#D1D3D8)"
      radius: "full 9999"
      border: "component.avatar.ring (#E4E5E9, 2px)"
    behavior:
      purpose: "어떤 사용자의 차단을 해제하는지 시각 식별"
      user_action: null
      feedback: null
    a11y:
      role: "img"
      label: "차단 해제 대상 사용자 프로필 사진"
    constraints:
      min_height: "100px"

  - name: "Title"
    id: "sheet-title"
    tag: "h1"
    type: "text"
    position: "center"
    size: "wrap-content"
    tokens:
      text: "wds.label.normal (#212228)"
      spacing: "margin-top 16, margin-bottom 24"
    behavior:
      purpose: "modal 콘텍스트 명확화 (modal archetype 강제 룰 #4) — 닉네임 인터폴레이션"
    a11y:
      role: "heading"
      label: "{nickname}님 차단을 해제하시겠어요?"
    constraints:
      max_lines: 2
      truncation: "ellipsis"

  - name: "InfoRowList"
    id: "info-rows"
    tag: "ul"
    type: "list"
    position: "center"
    size: "full-width"
    tokens:
      fill: "wds.surface.secondary (#F7F8F9)"
      radius: "lg 16"
      spacing: "padding 16, gap 16"
    layout:
      direction: "vertical"
      alignment: "start"
      sizing: "fill"

  - name: "InfoRow (item)"
    id: "info-row-N"
    tag: "li"
    type: "container"
    size: "full-width x wrap-content"
    tokens:
      spacing: "gap 12 (icon → text)"
    behavior:
      purpose: "차단 해제의 결과 안내 (1-2 row — 안내 간소화)"
    layout:
      direction: "horizontal"
      alignment: "start"
    children:
      - "InfoIcon (40x40 circle, --component-info-icon-brand-fill (#EBE1FF), lucide SVG inline — unlock / eye)"
      - "InfoText (title bold + desc assistive, vertical stack)"

  - name: "ButtonPair"
    id: "button-pair"
    tag: "div"
    type: "container"
    position: "bottom"
    size: "full-width"
    tokens:
      spacing: "gap 8, margin-top 24"
    layout:
      direction: "horizontal"
      alignment: "space-between"
      sizing: "fill"

  - name: "CancelButton"
    id: "cancel-btn"
    tag: "button"
    type: "button-secondary"
    size: "flex 1 x 56"
    tokens:
      fill: "component.button.secondary.ghost.fill (transparent) + outline wds.line.normal"
      text: "component.button.secondary.ghost.label (#6B6E76)"
      radius: "md 12"
    behavior:
      purpose: "modal archetype 강제 룰 #2 (a) — 명시적 cancel + 강제 룰 #3 secondary"
      user_action: "tap → dismiss + 리스트 유지"
      feedback: "navigation"
    states:
      default: "outline ghost, label #6B6E76"
      disabled: "loading state 시 opacity 0.4 + pointer-events none"
    a11y:
      role: "button"
      label: "취소"

  - name: "UnblockButton"
    id: "unblock-btn"
    tag: "button"
    type: "button-primary-brand"
    size: "flex 1 x 56"
    tokens:
      fill: "component.button.primary.fill (#8752FA — brand purple)"
      text: "component.button.primary.label (#FFFFFF)"
      radius: "md 12"
    behavior:
      purpose: "primary action — 차단 해제 확정 (modal archetype 강제 룰 #3 primary). brand color (neutral) 사용 — 해제는 destructive 가 아니라 회복 액션"
      user_action: "tap → DELETE /v2/users/{userId}/block → app-019"
      feedback: "navigation"
    states:
      default: "fill #8752FA, label #FFFFFF, '차단 해제하기'"
      loading: "spinner + label '해제 중…' + pointer-events none"
      pressed: "fill #7040E0 (--wds-fill-brand-strong)"
    a11y:
      role: "button"
      label: "차단 해제하기"
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
    - id: bottom-sheet
      position: absolute
      anchor: bottom
      width: full
      max_height: "80% of viewport"
      type: flex-column
      padding: "12 20 24 20"
      gap: 0
      children:
        - id: drag-handle
          align: center
          margin_bottom: 8
        - id: close-btn
          position: absolute
          top: 12
          right: 12
        - id: profile-image
          align: center
          margin_top: 16
        - id: sheet-title
          align: center
          margin_top: 16
          margin_bottom: 24
        - id: info-rows
          width: full
          margin_bottom: 24
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
    visible_components: [backdrop, bottom-sheet, drag-handle, close-btn, profile-image, sheet-title, info-rows, button-pair]
    hidden_components: []
    label_overrides:
      unblock_btn: "차단 해제하기"

  loading:
    description: "차단 해제 진행 중 — 모든 close trigger 비활성, primary 버튼 spinner"
    visible_components: [backdrop, bottom-sheet, drag-handle, close-btn, profile-image, sheet-title, info-rows, button-pair]
    hidden_components: []
    label_overrides:
      unblock_btn: "해제 중…"
    interaction_overrides:
      backdrop: "disabled (pointer-events none)"
      close-btn: "disabled (opacity 0.4)"
      cancel-btn: "disabled (opacity 0.4)"
      unblock-btn: "loading spinner"

  dismissed:
    description: "닫힘 (시각 데모용 — 시트 sliding down + backdrop fade-out)"
    visible_components: []
    hidden_components: [backdrop, bottom-sheet]
    note: "실 구현에서는 modal unmount + 부모 리스트 (app-017) 유지. 데모에서는 빈 상태로 표시."
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#backdrop"
    action: close-overlay
    transition: fade
    note: "modal archetype 강제 룰 #2 (b) — 외부 backdrop tap close. 리스트 유지."

  - trigger: tap
    target: "#close-btn"
    action: close-overlay
    transition: slide-down
    note: "modal archetype 강제 룰 #2 (a) — 명시적 X close"

  - trigger: tap
    target: "#cancel-btn"
    action: close-overlay
    transition: slide-down
    note: "secondary 버튼 — modal archetype 강제 룰 #3 secondary 1개. 리스트 유지."

  - trigger: tap
    target: "#unblock-btn"
    action: toggle-state
    state_key: "loading"
    note: "DELETE /v2/users/{userId}/block 진행 (mock — 1.5s)"

  - trigger: api-success
    target: "#unblock-btn"
    action: navigate
    destination: "app-019 (차단관리_해제완료)"
    transition: fade
```

## Visual Rules

```yaml
rules:
  - condition: "닉네임 존재"
    effect: "Title '@{nickname}님 차단을 해제하시겠어요?'"
    example: "@zzem_user_123님 차단을 해제하시겠어요?"
  - condition: "프로필 이미지 url 없음"
    effect: "단일 색 원 + 닉네임 첫 글자"
    example: "Z (background #D1D3D8)"
  - condition: "loading state"
    effect: "차단 해제하기 버튼 → spinner + '해제 중…' + 모든 close 비활성"
    example: "race condition 방지 — 사용자가 다른 인터랙션을 시도해도 무반응"
  - condition: "primary 색상 결정"
    effect: "destructive (#FF3B30) 가 아닌 brand (#8752FA) — 해제는 회복 액션 (검열·차단 강화 아님). 사용자 부정적 인지 회피."
    example: "app-013 차단 confirm 은 destructive 빨강. app-018 해제 confirm 은 brand 보라."
```

## Labels (ko)

```yaml
labels:
  sheet:
    title: "@zzem_user_123님 차단을\n해제하시겠어요?"
  info_rows:
    - title: "이 사용자의 콘텐츠가 다시 보여요"
      desc: "피드, 댓글, 프로필을 다시 볼 수 있어요"
    - title: "내 활동도 이 사용자에게 다시 보여요"
      desc: "내가 올린 콘텐츠를 이 사용자가 볼 수 있어요"
  buttons:
    cancel: "취소"
    unblock: "차단 해제하기"
    unblock_loading: "해제 중…"
  a11y:
    close: "닫기"
    backdrop: "차단해제 바텀시트 외부 영역. 탭하면 닫힙니다."
    profile: "차단 해제 대상 사용자 프로필 사진"
```

## Token Map

```yaml
tokens:
  backdrop:           "wds.background.dimmed → rgba(0,0,0,0.50)"
  sheet_fill:         "component.bottom-sheet.fill → #FFFFFF"
  sheet_radius_top:   "wds.radius.xl → 20px"
  handle_fill:        "component.bottom-sheet.handle → #D1D3D8"
  title_text:         "wds.label.normal → #212228"
  info_section_fill:  "wds.surface.secondary → #F7F8F9"
  info_icon_fill:     "wds.fill-brand-weak → #EBE1FF (해제 = brand 회복 톤)"
  info_icon_color:    "wds.fill-brand-primary → #8752FA"
  info_title_text:    "wds.label.normal → #212228"
  info_desc_text:     "wds.label.assistive → #8E9199"
  cancel_fill:        "component.button.secondary.ghost.fill → transparent (outline wds.line.normal #E4E5E9)"
  cancel_label:       "component.button.secondary.ghost.label → #6B6E76"
  unblock_fill:       "component.button.primary.fill → #8752FA (brand — neutral primary)"
  unblock_label:      "component.button.primary.label → #FFFFFF"
  unblock_pressed:    "wds.fill-brand-strong → #7040E0"
  button_radius:      "component.button.radius → 12px"
  avatar_fill:        "component.avatar.fill → #D1D3D8"
  avatar_ring:        "component.avatar.ring → #E4E5E9"
  close_text:         "wds.label.alternative → #6B6E76"
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
      - "info_rows[*].title/desc 한국어 카피 (PRD 는 '안내 1-2 row' 만 명시 — sibling app-013 의 '콘텐츠 숨김 / 활동 비공개' 카피를 반전한 '다시 보여요 / 다시 공개' 로 추론)"
      - "Title 정확 카피 — 사용자 prompt 의 '@아이디님 차단을 해제하시겠어요?' 채택. PRD/Figma 의 정확 카피 대조 필요"
    risk_level: "low"
    note: |
      태스크 spec 'Primary "차단 해제하기" + Secondary "취소"' + 사용자 prompt 의 카피
      ("@아이디님 차단을 해제하시겠어요?") 를 따름. info row 카피는 sibling app-013 의
      반전 — Figma 37290:170093 frame 의 텍스트 노드 대조 검증 필요 (intent.md gate).
  schema_completeness:
    required_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections:
      ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "9 / 7 (required + visual_rules + quality_score 추가)"
  context_coverage:
    why_linked: "2 / 2 (AC-2.4 차단관리 일괄 해제 + AC-2.5 confirm 1 step — 모두 ui_impact 있음)"
    what_resolved: "10 / 10 컴포넌트 모두 토큰 매핑 완료"
```
