# Screen Spec: PreviewLoadingScreen

> Machine-readable 화면 명세. `app-003` — i2i preview 생성 중 풀스크린 로딩 + 이탈 확인 dialog.

## Meta

```yaml
screen_name: "PreviewLoadingScreen"
screen_archetype: "detail"
modal_subtype: null
detail_state: "unavailable"  # 콘텐츠 생성 중 — interactivity 제한 (X close 만 가능)
task_id: "app-003"
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
Screen [frame: 390x844, archetype: detail/unavailable]
├── StatusBar [system] (div) #status-bar
├── CloseButton [icon-button] (button) #close-button — 좌상단 X (이탈 트리거)
├── LoadingHero [container] (section) #loading-hero — 중앙 정렬 spinner + 라벨
│   ├── Spinner [animated-icon] (div) #loading-spinner — ZzemLoading 스타일 회전 링
│   └── LoadingLabel [text] (p) #loading-label — "미리보기 만드는중..."
└── CancelDialogOverlay [modal-overlay] (div) #cancel-dialog-overlay — state: cancel-dialog-open
    ├── Backdrop [overlay-backdrop] (div) #cancel-dialog-backdrop
    └── CancelDialog [dialog] (div) #cancel-dialog — modal_subtype: dialog
        ├── DialogTitle [text] (p) #cancel-dialog-title — 이탈 경고 카피
        ├── DialogActions [container] (div) #cancel-dialog-actions
        │   ├── DialogCancelBtn [button-secondary] (button) #cancel-dialog-cancel — "취소"
        │   └── DialogConfirmBtn [button-destructive] (button) #cancel-dialog-confirm — "나가기"
```

### Component Details

```yaml
components:
  - name: "CloseButton"
    id: "close-button"
    tag: "button"
    type: "icon-button"
    position: "top"
    size: "44x44"
    tokens:
      fill: "transparent"
      text: "semantic.label.normal"
      radius: "full"
      spacing: "10 10 10 10"
    behavior:
      purpose: "사용자가 preview 생성 중에 이탈하고자 할 때 진입점"
      user_action: "tap"
      feedback: "navigation (open-overlay → cancel dialog)"
    states:
      default: "X 글리프, 라벨 색"
      disabled: null
      loading: null
      error: null
    a11y:
      role: "button"
      label: "닫기"

  - name: "Spinner"
    id: "loading-spinner"
    tag: "div"
    type: "animated-icon"
    position: "center"
    size: "72x72"
    tokens:
      fill: "var(--color-brand-primary)"
      border: "transparent"
      radius: "full"
    behavior:
      purpose: "fal.ai i2i 작업이 진행 중임을 시각적으로 표시 (진행률 없음)"
      user_action: "none — passive"
      feedback: "visual (rotating ring)"
    states:
      default: "회전 애니메이션 1.1s linear infinite"
      loading: "default와 동일 — 화면 자체가 loading"
    a11y:
      role: "progressbar"
      label: "미리보기 생성 중"

  - name: "LoadingLabel"
    id: "loading-label"
    tag: "p"
    type: "text"
    position: "center"
    size: "wrap-content"
    tokens:
      text: "semantic.label.alternative"
    behavior:
      purpose: "현재 무엇이 진행 중인지 한 줄로 안내"
      user_action: "none"
      feedback: "visual"
    a11y:
      role: "text"
      label: "미리보기 만드는중"

  - name: "CancelDialog"
    id: "cancel-dialog"
    tag: "div"
    type: "dialog"
    position: "center"
    size: "320x-"
    tokens:
      fill: "semantic.background.normal"
      radius: "lg (16px)"
      spacing: "24 20 16 20"
    behavior:
      purpose: "preview 이탈 확인 — 환불 없음 안내"
      user_action: "tap one of two buttons or backdrop"
      feedback: "navigation"
    a11y:
      role: "dialog"
      label: "이탈 확인"

  - name: "DialogCancelBtn"
    id: "cancel-dialog-cancel"
    tag: "button"
    type: "button-secondary"
    size: "full-width-half"
    tokens:
      fill: "component.button.secondary.fill"
      text: "component.button.secondary.label"
      radius: "md (12px)"
      spacing: "14 16 14 16"
    behavior:
      purpose: "이탈 취소 — dialog 닫고 로딩 유지"
      user_action: "tap"
      feedback: "navigation (close-overlay)"
    a11y:
      role: "button"
      label: "취소"

  - name: "DialogConfirmBtn"
    id: "cancel-dialog-confirm"
    tag: "button"
    type: "button-destructive"
    size: "full-width-half"
    tokens:
      fill: "semantic.fill.destructive"
      text: "neutral.0"
      radius: "md (12px)"
      spacing: "14 16 14 16"
    behavior:
      purpose: "preview 이탈 + cancel API 호출"
      user_action: "tap"
      feedback: "navigation (FilterPreview replace)"
    a11y:
      role: "button"
      label: "나가기"
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 390x844
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: close-button
      position: absolute
      top: 52px
      left: 12px
    - id: loading-hero
      position: absolute
      inset: "0 0 0 0"
      display: flex
      direction: column
      align: center
      justify: center
      gap: 24px
    - id: cancel-dialog-overlay
      position: absolute
      inset: "0 0 0 0"
      display: flex
      align: center
      justify: center
      visibility: state-controlled
```

## States

```yaml
states:
  default:
    description: "preview 생성 중 — spinner + label 만 표시, X 활성"
    active: true
    visible_components: [status-bar, close-button, loading-hero]
    hidden_components: [cancel-dialog-overlay]

  cancel-dialog-open:
    description: "X 탭 후 이탈 확인 dialog 노출"
    visible_components: [status-bar, close-button, loading-hero, cancel-dialog-overlay]
    hidden_components: []
    labels:
      title: "지금 나가면 작업이 취소되고, 사용한 크레딧은 환불되지 않아요. 정말 나가시겠어요?"
      cancel: "취소"
      confirm: "나가기"
```

> 이 화면은 archetype=detail/unavailable 이므로 추가 loading/error/empty state 를 별도 정의하지 않음 — 화면 자체가 loading state. FAILED 분기는 toast 후 FilterPreview 복귀(다른 화면)이므로 본 spec 범위 밖.

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
    action: navigate
    destination: "FilterPreview"
    transition: fade
    side_effect: "POST /preview-contents/{contentId}/cancel"

  - trigger: tap
    target: "#cancel-dialog-backdrop"
    action: toggle-state
    state_key: "default"

  - trigger: server-event
    source: "Content.status === DONE"
    action: navigate
    destination: "PreviewResultScreen"
    transition: fade

  - trigger: server-event
    source: "Content.status === FAILED"
    action: navigate
    destination: "FilterPreview"
    transition: fade
    side_effect: "toast 표시"
```

## Visual Rules

```yaml
rules:
  - condition: "preview 생성 중"
    effect: "X 외 모든 인터랙션 차단"
    example: "터치 가능한 다른 컨트롤 미노출 — detail_state: unavailable"

  - condition: "Content.status === DONE 콜백 도착"
    effect: "자동으로 PreviewResultScreen 으로 navigate.replace"
    example: "사용자 액션 없이 화면 전환"

  - condition: "X 탭 → cancel-dialog-open"
    effect: "backdrop opacity 0.4+, dialog 중앙, 스피너 계속 회전"
    example: "사용자가 [취소] 시 즉시 default 복귀"

  - condition: "[나가기] 탭"
    effect: "destructive(red) 색으로 영구적 결정 신호"
    example: "환불 없음 — 강한 시각적 경고"
```

## Labels (ko)

```yaml
labels:
  loading:
    label: "미리보기 만드는중..."
  cancel_dialog:
    title: "지금 나가면 작업이 취소되고, 사용한 크레딧은 환불되지 않아요. 정말 나가시겠어요?"
    cancel: "취소"
    confirm: "나가기"
  a11y:
    close_button: "닫기"
    spinner: "미리보기 생성 중"
```

## Token Map

```yaml
tokens:
  background: "semantic.background.normal → #FFFFFF"
  text_primary: "semantic.label.normal → #262626"
  text_secondary: "semantic.label.alternative → #6B6E76"
  text_assistive: "semantic.label.assistive → #8E9199"
  brand: "wds.color.purple.500 → #8752FA"
  brand_soft: "wds.color.purple.100 → #EFE8FE"
  destructive: "wds.color.red.600 → #D92800"
  button_secondary_fill: "component.button.secondary.fill → #F1F1F1"
  button_secondary_label: "component.button.secondary.label → #262626"
  radius_md: "12px"
  radius_lg: "16px"
  radius_full: "9999px"
  spinner_size: "72px"
  spinner_thickness: "6px"
  motion_spinner: "1.1s linear infinite"
  motion_dialog_in: "spring-handoff 320ms"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 6
    with_token_map: 6
    with_html_mapping: 6
    score: "12/12 = 1.0"
  fabrication_risk:
    inferred_fields: ["spinner thickness/size 수치"]
    risk_level: "low"
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "2/2"  # AC 2.1.8, 2.1.9 모두 UI 매핑됨
    what_resolved: "6/6"
```
