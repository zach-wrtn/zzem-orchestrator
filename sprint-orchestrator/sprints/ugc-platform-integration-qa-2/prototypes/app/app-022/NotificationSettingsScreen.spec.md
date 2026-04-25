# Screen Spec: NotificationSettingsScreen
# Step B output. Generated from context-engine.yaml + task spec.
# Source PRD: docs/prds/ugc-platform-integration-qa-2.md (Group 003 AC-3.3 / AC-3.4)
# Figma: 37289:169429 `알림설정_토글` (canonical)

meta:
  screen_name: "NotificationSettingsScreen"
  screen_archetype: "form"   # PR #31 archetype 분류 — settings list 표준
  archetype_dogfood_case: true   # form 강제 룰 #2/#4 vs 즉시 저장 패턴 충돌
  task_id: "app-022"
  sprint_id: "ugc-platform-integration-qa-2"
  app: "ZZEM"
  platform: "iOS / Android (React Native)"
  language: "ko"
  frame: "390x844"
  theme: "light"

# ─────────────────────────────
# Component Tree
# ─────────────────────────────
component_tree: |
  NotificationSettingsScreen [frame: 390x844]
  ├── StatusBar [system] (div) #status-bar — 9:41 + 시스템 아이콘
  ├── AppHeaderBack [container] (header) #app-header
  │   ├── BackButton [icon-button] (button) #back-btn — chevron-left SVG
  │   ├── HeaderTitle [text] (h1) #header-title — "알림 설정"
  │   └── HeaderSpacer [layout] (div) — 우측 균형용 48px
  ├── BodyScroll [scroll-container] (main) #body
  │   ├── ToggleRow#push [input-row] (div) #row-push
  │   │   ├── RowText [container] (div)
  │   │   │   ├── RowTitle [text] (span) — "푸시 알림"
  │   │   │   └── RowDesc [text] (span) — "ZZEM 의 알림을 푸시로 받아요"
  │   │   ├── Switch [switch] (button[role=switch]) #switch-push
  │   │   └── RowError [feedback] (span) #error-push (hidden by default)
  │   ├── Divider [layout] (hr)
  │   ├── ToggleRow#like [input-row] (div) #row-like
  │   │   ├── RowText
  │   │   │   ├── RowTitle — "좋아요 알림"
  │   │   │   └── RowDesc — "내 게시물에 좋아요가 달리면 알려드려요"
  │   │   ├── Switch (button[role=switch]) #switch-like
  │   │   └── RowError #error-like (hidden)
  │   ├── Divider (hr)
  │   ├── ToggleRow#news [input-row] (div) #row-news
  │   │   ├── RowText
  │   │   │   ├── RowTitle — "소식 알림"
  │   │   │   └── RowDesc — "ZZEM 의 새로운 기능과 이벤트 소식을 알려드려요"
  │   │   ├── Switch (button[role=switch]) #switch-news
  │   │   └── RowError #error-news (hidden)
  │   ├── Divider (hr)
  │   └── ToggleRow#follow [input-row] (div) #row-follow
  │       ├── RowText
  │       │   ├── RowTitle — "팔로우 알림"
  │       │   └── RowDesc — "새로운 팔로워가 생기면 알려드려요"
  │       ├── Switch (button[role=switch]) #switch-follow
  │       └── RowError #error-follow (hidden)
  └── ToastHost [feedback] (div) #toast-host — 화면 하단 84px float, hidden by default
      └── SaveErrorToast [toast] (div) #toast-error — "저장에 실패했어요. 다시 시도해주세요."

# ─────────────────────────────
# Component Details (Enhanced — Component-as-Data)
# ─────────────────────────────
components:
  - name: "AppHeaderBack"
    id: "app-header"
    tag: "header"
    type: "container"
    position: "top"
    size: "full-width x 56px"
    tokens:
      fill: "var(--wds-background-normal)"
      text: "var(--wds-label-normal)"
      border-bottom: "1px solid var(--wds-line-alternative)"
      spacing: "0 8px"
    behavior:
      purpose: "타이틀 표시 + 이전 화면 복귀"
      user_action: "BackButton tap"
      feedback: "navigation"
    layout: { direction: horizontal, alignment: space-between, sizing: hug }
    a11y: { role: "banner", label: "알림 설정 헤더" }

  - name: "BackButton"
    id: "back-btn"
    tag: "button"
    type: "icon-button"
    size: "44x44"
    tokens:
      fill: "transparent"
      icon: "var(--wds-label-normal)"
    behavior:
      purpose: "이전 화면(설정 또는 알림센터)으로 돌아가기"
      user_action: "tap"
      feedback: "navigation"
    a11y: { role: "button", label: "뒤로가기" }
    constraints: { min_height: "44px", truncation: "none" }

  - name: "ToggleRow"
    id: "row-{key}"
    tag: "div"
    type: "input-row"
    position: "in-flow"
    size: "full-width x ~72px (에러 시 ~96px)"
    tokens:
      fill: "var(--wds-background-normal)"
      padding: "var(--wds-spacing-16) var(--wds-spacing-20)"
      title-color: "var(--wds-label-normal)"
      desc-color: "var(--wds-label-alternative)"
    behavior:
      purpose: "카테고리별 알림 수신 즉시 토글"
      user_action: "Switch 영역(또는 row 전체) tap"
      feedback: "visual (knob slide) + silent save (optimistic)"
    states:
      default: "Switch ON 또는 OFF (현재 서버 값)"
      saving: "Switch 옆 작은 spinner — silent indicator (optional 표시)"
      error: "Switch 이전 값 rollback + RowError 노출"
      disabled: null
      loading: null
    layout: { direction: horizontal, alignment: space-between, sizing: fill }
    a11y: { role: "group", label: "{카테고리명} 알림 설정" }
    constraints: { min_height: "64px", max_lines: 2, truncation: "ellipsis" }

  - name: "Switch"
    id: "switch-{key}"
    tag: "button"
    type: "switch"
    size: "52x32"
    tokens:
      track-on: "var(--wds-fill-brand-primary)"
      track-off: "var(--wds-color-neutral-300)"
      knob: "var(--wds-color-neutral-0)"
      radius: "var(--wds-radius-full)"
    behavior:
      purpose: "토글 상태 표시 + 즉시 저장 트리거 (PRD AC-3.4)"
      user_action: "tap → optimistic toggle → PATCH /v2/me/notification-settings"
      feedback: "visual (knob slide 200ms) + silent save"
    states:
      default: "ON: knob 우측 + track 보라 / OFF: knob 좌측 + track 그레이"
      saving: "track 약 80% opacity, 옆에 4px spinner (optional silent)"
      error: "이전 값으로 rollback (200ms 역방향 transition) + RowError 표시"
    a11y: { role: "switch", label: "{카테고리명} 알림 토글", hint: "tap 시 즉시 저장됩니다" }
    constraints: { min_height: "32px" }

  - name: "RowError"
    id: "error-{key}"
    tag: "span"
    type: "feedback"
    size: "full-row x 18px"
    tokens:
      text: "var(--wds-label-error)"
      font-size: "var(--wds-font-size-sm)"
      padding: "0 var(--wds-spacing-20) var(--wds-spacing-8)"
    behavior:
      purpose: "form persona 강제 룰 #3: error message 해당 입력 직하"
      feedback: "visual"
    states:
      default: "hidden"
      error: "visible — '저장에 실패했어요. 다시 시도해주세요.'"
    a11y: { role: "alert", label: "저장 실패" }

  - name: "Divider"
    id: "divider-{n}"
    tag: "hr"
    type: "divider"
    tokens:
      color: "var(--wds-line-alternative)"
      spacing: "0 var(--wds-spacing-20)"

  - name: "SaveErrorToast"
    id: "toast-error"
    tag: "div"
    type: "toast"
    size: "(width: 350) x 48px"
    tokens:
      fill: "var(--wds-color-neutral-900)"
      text: "var(--wds-label-inverse)"
      radius: "var(--wds-radius-md)"
      shadow: "0 4px 12px rgba(0,0,0,0.12)"
    behavior:
      purpose: "저장 실패 보조 피드백 (RowError 와 동시)"
      feedback: "visual"
    states:
      default: "hidden"
      error: "visible 2.5s fade-out"
    a11y: { role: "status", label: "저장 실패 토스트" }

# ─────────────────────────────
# Layout Spec (ASCII)
# ─────────────────────────────
layout_spec: |
  ┌─────────────────────────────────────────┐  390 x 844
  │ Status Bar                              │   44
  ├─────────────────────────────────────────┤
  │ ←  알림 설정                            │   56  (AppHeaderBack)
  ├─────────────────────────────────────────┤
  │  푸시 알림                       [● ─] │
  │  ZZEM 의 알림을 푸시로 받아요           │   72  (ToggleRow#push, ON)
  ├─────────────────────────────────────────┤
  │  좋아요 알림                     [● ─] │
  │  내 게시물에 좋아요가 달리면 알려드려요 │   72  (ToggleRow#like, ON)
  ├─────────────────────────────────────────┤
  │  소식 알림                       [─ ○] │
  │  ZZEM 의 새로운 기능과 이벤트 소식을... │   72  (ToggleRow#news, OFF)
  ├─────────────────────────────────────────┤
  │  팔로우 알림                     [● ─] │
  │  새로운 팔로워가 생기면 알려드려요      │   72  (ToggleRow#follow, ON)
  └─────────────────────────────────────────┘
  Footer: ToastHost (hidden by default), float-bottom-84px

# ─────────────────────────────
# States
# ─────────────────────────────
states:
  default:
    description: "4 토글 모두 표시. 서버 값 반영. (sample: push=ON, like=ON, news=OFF, follow=ON)"
    visible: ["app-header", "row-push", "row-like", "row-news", "row-follow"]
    hidden: ["error-push", "error-like", "error-news", "error-follow", "toast-error"]
  saving:
    description: "특정 row 토글 직후 silent saving — 시각 변화 minimal (Switch opacity 80% + 4px dot)"
    visible: ["app-header", "row-push", "row-like", "row-news", "row-follow"]
    transient: ["switch-{key}.saving"]
  error:
    description: "특정 row 저장 실패 → toggle rollback + row 직하 inline 에러 + 보조 toast"
    visible: ["app-header", "row-push", "row-like", "row-news", "row-follow", "error-push", "toast-error"]
    transient: ["toast-error"]   # 2.5s fade-out
  loading:
    description: "(N/A) — 화면 진입 시 캐시된 값 즉시 표시. 별도 loading state 불필요. (form 전용 룰 — toggles 는 client-cache-first)"
    visible: ["app-header", "row-push", "row-like", "row-news", "row-follow"]
  empty:
    description: "(N/A) — 카테고리 4개는 hardcoded constant. empty 분기 없음."

# ─────────────────────────────
# Interactions
# ─────────────────────────────
interactions:
  - id: "back"
    trigger: { selector: "#back-btn", event: "click" }
    action: "go-back"
    destination: "previous (설정 또는 알림센터)"
    transition: "slide-right"
  - id: "toggle-push"
    trigger: { selector: "#switch-push", event: "click" }
    action: "toggle-state"
    state_key: "switch-push"
    side_effect: "PATCH /v2/me/notification-settings { push: <new> } (mock)"
  - id: "toggle-like"
    trigger: { selector: "#switch-like", event: "click" }
    action: "toggle-state"
    state_key: "switch-like"
    side_effect: "PATCH /v2/me/notification-settings { like: <new> } (mock)"
  - id: "toggle-news"
    trigger: { selector: "#switch-news", event: "click" }
    action: "toggle-state"
    state_key: "switch-news"
    side_effect: "PATCH /v2/me/notification-settings { news: <new> } (mock)"
  - id: "toggle-follow"
    trigger: { selector: "#switch-follow", event: "click" }
    action: "toggle-state"
    state_key: "switch-follow"
    side_effect: "PATCH /v2/me/notification-settings { follow: <new> } (mock)"

# ─────────────────────────────
# Visual Rules
# ─────────────────────────────
visual_rules:
  - "Switch tap 시 knob slide transition 200ms ease-out (즉시 시각 반영 — optimistic)"
  - "저장 실패 시 toggle 이전 값으로 200ms 역방향 transition + RowError 표시"
  - "RowError 는 row padding 안쪽에 18px height 추가 (row 높이 64→82)"
  - "별도 'Save / 저장' primary CTA 부재 — PRD AC-3.4 의도 (form 강제 룰 #2/#4 dogfood 충돌)"
  - "본인만 진입 가능한 화면 — 다른 유저 컨텍스트 분기 없음"

# ─────────────────────────────
# Labels (ko)
# ─────────────────────────────
labels:
  ko:
    header_title: "알림 설정"
    rows:
      push:
        title: "푸시 알림"
        desc: "ZZEM 의 알림을 푸시로 받아요"
      like:
        title: "좋아요 알림"
        desc: "내 게시물에 좋아요가 달리면 알려드려요"
      news:
        title: "소식 알림"
        desc: "ZZEM 의 새로운 기능과 이벤트 소식을 알려드려요"
      follow:
        title: "팔로우 알림"
        desc: "새로운 팔로워가 생기면 알려드려요"
    error:
      row: "저장에 실패했어요. 다시 시도해주세요."
      toast: "저장에 실패했어요. 잠시 후 다시 시도해주세요."

# ─────────────────────────────
# Token Map
# ─────────────────────────────
token_map:
  bg.normal: "--wds-background-normal"
  bg.surface_secondary: "--wds-surface-secondary"
  label.normal: "--wds-label-normal"
  label.alternative: "--wds-label-alternative"
  label.assistive: "--wds-label-assistive"
  label.inverse: "--wds-label-inverse"
  label.error: "--wds-label-error"
  fill.brand: "--wds-fill-brand-primary"
  fill.error: "--wds-fill-status-error"
  switch.track_off: "--wds-color-neutral-300"
  switch.knob: "--wds-color-neutral-0"
  divider: "--wds-line-alternative"
  radius.full: "--wds-radius-full"
  radius.md: "--wds-radius-md"
  font.title: "--wds-font-size-lg / weight-semibold"
  font.desc: "--wds-font-size-sm / weight-regular"
  font.header: "--wds-font-size-xl / weight-bold"

# ─────────────────────────────
# Quality Score (Step B.5)
# ─────────────────────────────
quality_score:
  extraction_accuracy:
    total_components: 7
    with_library_match: 7   # AppHeaderBack, ToggleRow, Switch, RowError, Divider, SaveErrorToast, BackButton (모두 표준 패턴)
    with_token_map: 7
    score: "14 / 14 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "RowDesc 카피: '~ 알려드려요' 형식 — Figma 카피 미접근(MCP 권한 차단). 표준 settings UX 카피로 placeholder. Sprint Lead 확인 필요"
      - "saving state silent indicator (4px dot) — form persona 권장 룰 #2 권장(submit loading)을 toggle context 로 적용"
      - "RowError + SaveErrorToast 동시 표시 — form persona 강제 룰 #3 충족 위해 추가"
    risk_level: "low"   # PRD AC 명확 + 설정 카피만 표준 패턴 적용
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "components", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "2 / 2 = 1.0"   # AC-3.3, AC-3.4 모두 ui_impact 연결
    what_resolved: "7 / 7 = 1.0"
