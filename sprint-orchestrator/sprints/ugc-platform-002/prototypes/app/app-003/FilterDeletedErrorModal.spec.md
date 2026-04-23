# Screen Spec: FilterDeletedErrorModal

> Machine-readable 모달 명세. 원본 필터가 서버에서 삭제되었을 때 재생성/템플릿 사용 시도 진입점에 표시되는 단일 액션 에러 모달.

## Meta

```yaml
screen_name: "FilterDeletedErrorModal"
task_id: "app-003"
sprint_id: "ugc-platform-002"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"  # 모달 서페이스(일반 흰 바텀시트 또는 센터 alert)
parent_screen: "SwipeFeedDetailView"
component_role: "overlay (BottomConfirmSheet single-action variant or RNAlert)"
```

## Component Tree

```
FilterDeletedErrorModal [overlay] (section) #filter-deleted-error-modal
├── Backdrop [overlay] (div) #modal-backdrop — dim rgba(0,0,0,0.4)
└── Sheet [container] (div) #modal-sheet — BottomConfirmSheet 단일 액션 버전
    ├── Handle [indicator] (div) #modal-handle — 40x4, #a7a7a7 (상단 중앙)
    ├── TextBlock [container] (div) #modal-text-block
    │   └── Title [text] (h2) #modal-title — "원본 게시글이 사라져서 다시 만들 수 없어요"
    └── ActionBar [container] (div) #modal-action-bar
        └── ConfirmButton [button-primary] (button) #modal-confirm-button — "확인" (단일)
```

### Component Details

```yaml
components:
  - name: "FilterDeletedErrorModal"
    id: "filter-deleted-error-modal"
    tag: "section"
    type: "bottom-sheet"
    position: "overlay"
    size: "full-width x auto"
    tokens:
      fill: "var(--wds-surface-primary) → #FFFFFF (§10 surface_elevated)"
      radius: "28 28 0 0 (top corners only)"
      spacing: "24 24 34 24"  # padding (bottom 34 = safe area)
    layout:
      direction: "vertical"
      alignment: "center"
      sizing: "fill"
    behavior:
      purpose: "AC 1.6 — 원본 필터가 삭제되어 재생성/템플릿 사용이 불가할 때, 사용자에게 사실을 알리고 피드로 복귀시키는 단일 액션 에러 모달."
      user_action: "탭 '확인' → 모달 닫기 → 피드 유지 (네비게이션 없음)"
      feedback: "navigation (close-overlay)"
    states:
      default: "표시: 제목 + 확인 버튼"
      disabled: null
      loading: null
      error: null
    a11y:
      role: "dialog"
      label: "원본 게시글이 사라져서 다시 만들 수 없어요"
      hint: "확인 버튼을 눌러 피드로 돌아갑니다"

  - name: "Backdrop"
    id: "modal-backdrop"
    tag: "div"
    type: "container"
    position: "overlay"
    size: "full-width x full-height"
    tokens:
      fill: "var(--wds-background-dimmed) → rgba(0,0,0,0.40)"
    behavior:
      purpose: "모달 강조를 위한 딤 오버레이. 탭 시 기본 닫힘 비활성화(단일 액션 강제)."
      user_action: "탭 → noop (의도적으로 확인 버튼만 유효화)"
      feedback: "visual"
    notes: "Task 사양: 단일 액션 모달. backdrop dismiss 비활성화 권장."

  - name: "Sheet"
    id: "modal-sheet"
    tag: "div"
    type: "container"
    position: "sticky-bottom"
    size: "full-width x auto"
    tokens:
      fill: "var(--wds-surface-primary) → #FFFFFF"
      radius: "28 28 0 0"
      spacing: "16 24 34 24"
    layout:
      direction: "vertical"
      alignment: "center"
      sizing: "fill"
    notes: "§10 Bottom Sheet 기본 구조 — handle + content + action."

  - name: "Handle"
    id: "modal-handle"
    tag: "div"
    type: "divider"
    position: "top"
    size: "40x4"
    tokens:
      fill: "var(--pe-sheet-handle) → #A7A7A7"
      radius: "full (2px)"
      spacing: "0 auto 16 auto"  # 중앙 정렬, 아래 16 gap
    notes: "§5, §10 공통 바텀시트 핸들"

  - name: "TextBlock"
    id: "modal-text-block"
    tag: "div"
    type: "container"
    size: "full-width x auto"
    tokens:
      spacing: "8 0 24 0"
    layout:
      direction: "vertical"
      alignment: "center"
      sizing: "fill"
    children:
      - Title

  - name: "Title"
    id: "modal-title"
    tag: "h2"
    type: "text"
    size: "full-width x auto"
    tokens:
      text: "var(--wds-label-normal) → #212228"
    layout:
      direction: "horizontal"
      alignment: "center"
      sizing: "fill"
    constraints:
      max_lines: 2
      truncation: "none"
      content_policy: "고정 문구 (한국어). 변수 치환 없음."
    a11y:
      role: "heading"
      label: "원본 게시글이 사라져서 다시 만들 수 없어요"
    notes: |
      Typography: Subtitle3-18 (SemiBold 600, 18px, line-height 1.5) — §typography-scale.
      텍스트 정렬: center.

  - name: "ActionBar"
    id: "modal-action-bar"
    tag: "div"
    type: "container"
    position: "bottom"
    size: "full-width x 56"
    tokens:
      spacing: "0 0 0 0"
    layout:
      direction: "horizontal"
      alignment: "center"
      sizing: "fill"
    children:
      - ConfirmButton

  - name: "ConfirmButton"
    id: "modal-confirm-button"
    tag: "button"
    type: "button-primary"
    position: "bottom"
    size: "full-width x 56"
    tokens:
      fill: "var(--pe-confirm-btn) → #262626 (§5 확인 버튼 활성 bg)"
      text: "var(--pe-save-active-label) → #FFFFFF"
      border: "none"
      radius: "lg (16px)"
    behavior:
      purpose: "단일 액션 — 모달 닫기 + 피드 유지."
      user_action: "탭 → closeOverlay() → 피드 상태 유지, 네비게이션 없음"
      feedback: "navigation"
    states:
      default: "배경 #262626, 라벨 흰색"
      pressed: "opacity 0.85"
      disabled: null
    a11y:
      role: "button"
      label: "확인"
      hint: "모달을 닫고 피드로 돌아갑니다"
    constraints:
      min_height: "56px"
      max_lines: 1
    notes: |
      Task: "단일 action 모달, 라벨 '확인'".
      Component-patterns §10 Confirm Sheet 규격을 단일 버튼으로 축소 적용.
      Typography: Subtitle4-16 (SemiBold 600, 16px).
```

## Layout Spec

```yaml
layout_spec:
  type: overlay-bottom-sheet
  viewport: 390x844
  regions:
    - id: modal-backdrop
      overlay: true
      position: fixed
      inset: 0
      z-index: 100
      background: "rgba(0,0,0,0.40)"
    - id: modal-sheet
      sticky: bottom
      position: absolute
      height: fixed(auto)
      min-height: "200px"
      background: "#FFFFFF"
      radius: "28px 28px 0 0"
      padding: "16px 24px 34px 24px"
      z-index: 101
      children:
        - id: modal-handle
          width: 40
          height: 4
          margin: "0 auto 16px auto"
          background: "#A7A7A7"
          radius: "full"
        - id: modal-text-block
          type: flex-column
          align: center
          padding: "8px 0 24px 0"
          children:
            - id: modal-title
              text-align: center
              font: "SemiBold 18px/1.5"
        - id: modal-action-bar
          type: flex-row
          align: center
          children:
            - id: modal-confirm-button
              width: full
              height: 56
              radius: 16
              background: "#262626"
              text-color: "#FFFFFF"
              font: "SemiBold 16px"
```

## States

```yaml
states:
  default:
    description: "모달 표시 (유일 상태)"
    active: true
    visible_components: [modal-backdrop, modal-sheet, modal-handle, modal-title, modal-confirm-button]
    hidden_components: []
    labels:
      title: "원본 게시글이 사라져서 다시 만들 수 없어요"
      confirm: "확인"

  entering:
    description: "slide-up 진입 애니메이션"
    active: false
    visible_components: [modal-backdrop, modal-sheet]
    hidden_components: []
    transition: "slide-up 300ms ease-out + backdrop fade-in 200ms"

  exiting:
    description: "확인 탭 → slide-down 닫힘"
    active: false
    visible_components: []
    hidden_components: [modal-backdrop, modal-sheet]
    transition: "slide-down 250ms ease-in + backdrop fade-out 200ms"

  loading: null  # 모달 자체는 loading 없음
  empty: null
  error: null
```

## Interactions

```yaml
interactions:
  - trigger: mount
    target: "#filter-deleted-error-modal"
    action: open-overlay
    transition: slide-up
    notes: "SwipeFeedCTAButton.handleCta() 에서 filter invalid 판정 시 자동 오픈"

  - trigger: tap
    target: "#modal-confirm-button"
    action: close-overlay
    transition: slide-down
    notes: "피드 유지 — 추가 네비게이션 없음"

  - trigger: tap
    target: "#modal-backdrop"
    action: noop
    notes: |
      단일 액션 강제. 백드롭 탭으로는 닫히지 않도록 권장.
      접근성 보강: 하드웨어 back(Android) 은 close-overlay 허용(관례).

  - trigger: hardware-back
    target: "window"
    action: close-overlay
    transition: slide-down
    notes: "Android 하드웨어 백버튼 대응 (관례 — 웹 프로토타입에서는 생략)"
```

## Visual Rules

```yaml
rules:
  - condition: "handleCta() 시 원본 필터 GET 결과가 404 또는 deleted_at != null"
    effect: "FilterDeletedErrorModal 오픈"
    example: "A 유저의 커스텀 필터로 생성된 콘텐츠 → A가 필터 삭제 → B 유저가 스와이프 피드에서 CTA 탭"

  - condition: "모달 표시 중"
    effect: "배경 피드 dim + 탭 불가"
    example: "backdrop이 세로 스와이프/사이드 액션 모두 차단"

  - condition: "확인 탭 후"
    effect: "피드 상태 유지 — 현재 item 그대로 노출, 다른 화면 이동 없음"
    example: "task.md Context: '원본 필터가 삭제된 경우 → 모달 노출 → 취소 시 피드 유지'"

  - condition: "BE가 별도로 SOURCE_CONTENT_DELETED 응답"
    effect: "피드에서 해당 item invalidate + 동일 모달 재사용 가능"
    example: "task.md: 'SOURCE_CONTENT_DELETED: 피드에서 해당 아이템 invalidate + 모달'"
```

## Labels (ko)

```yaml
labels:
  modal:
    title: "원본 게시글이 사라져서 다시 만들 수 없어요"
  buttons:
    confirm: "확인"
  a11y:
    dialog: "원본 게시글이 사라져서 다시 만들 수 없어요. 확인 버튼을 눌러 피드로 돌아갑니다."
    confirm_button: "확인"
```

## Token Map

```yaml
tokens:
  backdrop: "semantic.background.dimmed → rgba(0,0,0,0.40)"
  sheet_fill: "semantic.surface.primary → #FFFFFF (§10 surface_elevated)"
  sheet_radius: "28px top corners (§10 bottom-sheet radius)"
  sheet_padding: "16px 24px 34px 24px (safe-area bottom 34)"
  handle_fill: "#A7A7A7 (pe-sheet-handle)"
  handle_size: "40x4 radius-full"
  title_text: "semantic.label.normal → #212228"
  title_typography: "Subtitle3-18 (SemiBold 18px / 1.5)"
  confirm_fill: "#262626 (pe-confirm-btn = surface_primary_invert)"
  confirm_label: "#FFFFFF (pe-save-active-label)"
  confirm_radius: "radius.lg → 16px"
  confirm_height: "56px"
  confirm_typography: "Subtitle4-16 (SemiBold 16px / 1.5)"
  z_backdrop: 100
  z_sheet: 101
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 7
    with_token_map: 7
    with_html_mapping: 7
    score: "14 / 14 = 1.00"
  fabrication_risk:
    inferred_fields:
      - "핸들 바 노출 — Task에는 '단일 action 모달'만 명시. §10 바텀시트 패턴 관례 적용(low risk)."
      - "backdrop dismiss noop — 단일 액션 UX 보호를 위한 관례 해석(low risk)."
      - "확인 버튼 스타일로 #262626 사용 — component-patterns §10 Confirm Sheet 규약 준수"
    risk_level: "low"
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, component_tree, layout_spec, states, interactions, visual_rules, labels, token_map, quality_score]
    score: "9 / 7"
  context_coverage:
    why_linked: "1 / 1 AC (AC 1.6 삭제된 필터 에러 모달)"
    what_resolved: "7 / 7 (모든 토큰 tokens.css + component-patterns §10에서 해결)"
```
