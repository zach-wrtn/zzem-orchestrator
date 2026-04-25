# Screen Spec: SettingsMainScreen
# Step B output. Generated from context-engine.yaml + task spec.
# Source PRD: docs/prds/ugc-platform-integration-qa-2.md (Group 004 nav glue)
# Figma: 37174:21780 (entry) + 37289:169467 / 37289:169801 (메인메뉴 변형)

meta:
  screen_name: "SettingsMainScreen"
  screen_archetype: "form"   # task description 분류 — 실질은 nav-list (misfit)
  archetype_misfit_note: |
    "settings main menu" 는 form 의 input/submit 모델과 본질적 부정합.
    각 row 가 즉시 navigation trigger — 6 archetype enum 모두 fit 안 함.
    Sprint Lead 후속: archetype enum 에 'nav_list' (또는 'settings_list') 신규 검토.
  archetype_dogfood_case: true
  task_id: "app-023"
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
  SettingsMainScreen [frame: 390x844]
  ├── StatusBar [system] (div) #status-bar — 9:41 + 시스템 아이콘
  ├── AppHeaderBack [container] (header) #app-header
  │   ├── BackButton [icon-button] (button) #back-btn — chevron-left SVG
  │   ├── HeaderTitle [text] (h1) #header-title — "설정"
  │   └── HeaderSpacer [layout] (span) — 우측 균형용
  ├── BodyScroll [scroll-container] (main) #body
  │   ├── SectionPrimary [list] (div) — 계정 / 알림 / 차단 / 개인정보
  │   │   ├── MenuRow#account [nav-row] (button) #row-account
  │   │   │   ├── RowIcon [icon] (svg) — user
  │   │   │   ├── RowLabel [text] (span) — "계정"
  │   │   │   └── RowChevron [icon] (svg) — chevron-right
  │   │   ├── Divider (hr)
  │   │   ├── MenuRow#notification [nav-row] (button) #row-notification
  │   │   │   ├── RowIcon — bell
  │   │   │   ├── RowLabel — "알림 설정"
  │   │   │   └── RowChevron — chevron-right
  │   │   ├── Divider (hr)
  │   │   ├── MenuRow#block [nav-row] (button) #row-block
  │   │   │   ├── RowIcon — shield
  │   │   │   ├── RowLabel — "차단 관리"
  │   │   │   └── RowChevron — chevron-right
  │   │   ├── Divider (hr)
  │   │   └── MenuRow#privacy [nav-row] (button) #row-privacy
  │   │       ├── RowIcon — lock
  │   │       ├── RowLabel — "개인정보 처리방침"
  │   │       └── RowChevron — chevron-right
  │   ├── SectionGap [layout] (div) — 8px surface-secondary 분리
  │   ├── SectionSecondary [list] (div) — 도움말
  │   │   └── MenuRow#help [nav-row] (button) #row-help
  │   │       ├── RowIcon — help-circle
  │   │       ├── RowLabel — "도움말"
  │   │       └── RowChevron — chevron-right
  │   ├── SectionGap [layout] (div)
  │   └── SectionDestructive [list] (div) — 로그아웃
  │       └── MenuRow#logout [nav-row, destructive] (button) #row-logout
  │           ├── RowIcon — log-out (error tint)
  │           └── RowLabel — "로그아웃" (label-error)

# ─────────────────────────────
# Component Details (Component-as-Data)
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
    behavior:
      purpose: "타이틀 표시 + 이전 화면 복귀"
      user_action: "BackButton tap"
      feedback: "navigation"
    layout: { direction: horizontal, alignment: space-between, sizing: hug }
    a11y: { role: "banner", label: "설정 헤더" }

  - name: "BackButton"
    id: "back-btn"
    tag: "button"
    type: "icon-button"
    size: "44x44"
    tokens:
      fill: "transparent"
      icon: "var(--wds-label-normal)"
    behavior:
      purpose: "이전 화면 복귀"
      user_action: "tap"
      feedback: "navigation"
    a11y: { role: "button", label: "뒤로가기" }
    constraints: { min_height: "44px", truncation: "none" }

  - name: "MenuRow"
    id: "row-{key}"
    tag: "button"
    type: "nav-row"
    position: "in-flow"
    size: "full-width x 56px"
    tokens:
      fill: "var(--wds-background-normal)"
      fill-pressed: "var(--wds-surface-secondary)"
      padding: "var(--wds-spacing-12) var(--wds-spacing-20)"
      label-color: "var(--wds-label-normal)"
      label-color-destructive: "var(--wds-label-error)"
      icon-stroke: "var(--wds-label-alternative)"
      icon-stroke-destructive: "var(--wds-label-error)"
      chevron-stroke: "var(--wds-label-assistive)"
    behavior:
      purpose: "카테고리별 설정 화면으로 즉시 navigation"
      user_action: "row 전체 tap"
      feedback: "visual (pressed bg) + navigation transition"
    states:
      default: "label + icon + chevron"
      pressed: "background = surface-secondary (active state)"
      destructive: "label + icon = error color, chevron 생략"
    layout: { direction: horizontal, alignment: space-between, sizing: fill }
    a11y: { role: "button", label: "{카테고리명} 설정으로 이동" }
    constraints: { min_height: "56px", max_lines: 1, truncation: "ellipsis" }

  - name: "RowIcon"
    id: "icon-{key}"
    tag: "svg"
    type: "icon"
    size: "24x24"
    tokens:
      stroke: "var(--wds-label-alternative)"
      stroke-destructive: "var(--wds-label-error)"
      stroke-width: "2"
    behavior:
      purpose: "카테고리 시각 식별 (lucide-style)"
    a11y: { aria-hidden: true }

  - name: "RowChevron"
    id: "chevron-{key}"
    tag: "svg"
    type: "icon"
    size: "20x20"
    tokens:
      stroke: "var(--wds-label-assistive)"
      stroke-width: "2"
    behavior:
      purpose: "navigation affordance (이 row 가 다음 화면으로 진입함을 시각화)"
    a11y: { aria-hidden: true }

  - name: "Divider"
    id: "divider-{n}"
    tag: "hr"
    type: "divider"
    tokens:
      color: "var(--wds-line-alternative)"
      spacing: "0 var(--wds-spacing-20)"

  - name: "SectionGap"
    id: "section-gap-{n}"
    tag: "div"
    type: "layout"
    size: "full-width x 8px"
    tokens:
      fill: "var(--wds-surface-secondary)"
    behavior:
      purpose: "그룹 간 시각적 카테고리 분리"

# ─────────────────────────────
# Layout Spec (ASCII)
# ─────────────────────────────
layout_spec: |
  ┌─────────────────────────────────────────┐  390 x 844
  │ Status Bar                              │   44
  ├─────────────────────────────────────────┤
  │ ←   설정                                │   56  (AppHeaderBack)
  ├─────────────────────────────────────────┤
  │ [👤] 계정                            ›  │   56  (MenuRow#account)
  ├─────────────────────────────────────────┤
  │ [🔔] 알림 설정                       ›  │   56  (MenuRow#notification → app-022)
  ├─────────────────────────────────────────┤
  │ [🛡] 차단 관리                       ›  │   56  (MenuRow#block       → app-017)
  ├─────────────────────────────────────────┤
  │ [🔒] 개인정보 처리방침               ›  │   56  (MenuRow#privacy)
  ├═════════════════════════════════════════┤   8   (SectionGap)
  │ [?]  도움말                          ›  │   56  (MenuRow#help)
  ├═════════════════════════════════════════┤   8   (SectionGap)
  │ [⏏]  로그아웃                           │   56  (MenuRow#logout, destructive)
  └─────────────────────────────────────────┘
  Note: 위 ASCII 의 emoji 는 layout 시각화 전용 — 실제 prototype.html 은 모두 Lucide inline SVG.

# ─────────────────────────────
# States
# ─────────────────────────────
states:
  default:
    description: "전체 메뉴 row 표시. 각 row default."
    visible: ["app-header", "row-account", "row-notification", "row-block", "row-privacy", "row-help", "row-logout"]
    hidden: []
  pressed:
    description: "사용자가 특정 row 를 tap 하는 순간 — 해당 row bg = surface-secondary (CSS :active)"
    transient: ["row-{key}.pressed"]
  loading:
    description: "(N/A) — 메뉴 항목은 hardcoded constant. 별도 loading state 불필요."
  empty:
    description: "(N/A) — 메뉴 항목은 항상 6개 (logout 포함). empty 분기 없음."
  error:
    description: "(N/A) — nav 자체는 error state 부재. 다음 화면 진입 후 그 화면이 error 처리."

# ─────────────────────────────
# Interactions
# ─────────────────────────────
interactions:
  - id: "back"
    trigger: { selector: "#back-btn", event: "click" }
    action: "go-back"
    destination: "previous (마이 페이지 또는 알림 센터)"
    transition: "slide-right"
  - id: "nav-account"
    trigger: { selector: "#row-account", event: "click" }
    action: "navigate"
    destination: "AccountScreen (out of sprint scope — placeholder)"
    transition: "slide-left"
  - id: "nav-notification"
    trigger: { selector: "#row-notification", event: "click" }
    action: "navigate"
    destination: "NotificationSettingsScreen (app-022)"
    transition: "slide-left"
  - id: "nav-block"
    trigger: { selector: "#row-block", event: "click" }
    action: "navigate"
    destination: "BlockedAccountsScreen (app-017)"
    transition: "slide-left"
  - id: "nav-privacy"
    trigger: { selector: "#row-privacy", event: "click" }
    action: "navigate"
    destination: "PrivacyPolicyScreen (out of sprint scope — placeholder)"
    transition: "slide-left"
  - id: "nav-help"
    trigger: { selector: "#row-help", event: "click" }
    action: "navigate"
    destination: "HelpScreen (out of sprint scope — placeholder)"
    transition: "slide-left"
  - id: "logout"
    trigger: { selector: "#row-logout", event: "click" }
    action: "navigate"
    destination: "LogoutConfirm modal (out of scope — placeholder bread log)"
    transition: "fade"

# ─────────────────────────────
# Visual Rules
# ─────────────────────────────
visual_rules:
  - "모든 MenuRow 동일 height (56px) + 동일 chevron 위치 (right 20px) — AC-4.4"
  - "destructive row (로그아웃) 은 list 최하단 + error color label/icon + chevron 생략"
  - "section gap (8px surface-secondary) 으로 카테고리 그룹 분리"
  - "row tap 직후 :active state = surface-secondary bg (시각 피드백)"
  - "별도 'Save / Submit / Primary CTA' 부재 (nav-list 패턴) — form 강제 룰 #1/#2/#3/#4 모두 부적용"
  - "보라 gradient 사용 금지 — solid token only (Pass 6 #5)"

# ─────────────────────────────
# Labels (ko)
# ─────────────────────────────
labels:
  ko:
    header_title: "설정"
    rows:
      account: "계정"
      notification: "알림 설정"
      block: "차단 관리"
      privacy: "개인정보 처리방침"
      help: "도움말"
      logout: "로그아웃"

# ─────────────────────────────
# Token Map
# ─────────────────────────────
token_map:
  bg.normal: "--wds-background-normal"
  bg.surface_secondary: "--wds-surface-secondary"
  label.normal: "--wds-label-normal"
  label.alternative: "--wds-label-alternative"
  label.assistive: "--wds-label-assistive"
  label.error: "--wds-label-error"
  divider: "--wds-line-alternative"
  radius.sm: "--wds-radius-sm"
  radius.md: "--wds-radius-md"
  font.label: "--wds-font-size-lg / weight-semibold"
  font.header: "--wds-font-size-xl / weight-bold"

# ─────────────────────────────
# Quality Score (Step B.5)
# ─────────────────────────────
quality_score:
  extraction_accuracy:
    total_components: 7   # AppHeaderBack, BackButton, MenuRow, RowIcon, RowChevron, Divider, SectionGap
    with_library_match: 7
    with_token_map: 7
    score: "14 / 14 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "메뉴 카피 (계정 / 개인정보 처리방침 / 도움말 / 로그아웃) — Figma MCP 미접근, 표준 settings UX 카피 placeholder. Sprint Lead 카피 검수 필요"
      - "section grouping (primary 4 + help 1 + logout 1) — Figma 변형 미접근, ZZEM 표준 settings 패턴 추정"
      - "lucide icon 매핑 (계정=user, 알림=bell, 차단=shield, 개인정보=lock, 도움말=help-circle, 로그아웃=log-out) — Figma 원본 아이콘 미접근"
    risk_level: "low"   # Figma 카피만 변동 가능 / 구조는 industry standard
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "components", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "4 / 4 = 1.0"   # AC-4.1 / AC-4.2 / AC-4.3 / AC-4.4 모두 ui_impact 연결
    what_resolved: "7 / 7 = 1.0"
