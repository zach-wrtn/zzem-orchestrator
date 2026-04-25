# Screen Spec: NotificationsEmptyScreen

> Machine-readable 화면 명세 — DE Step B 산출물.
> task: app-021 / Group 003 / 첫 empty_state persona 검증.

## Meta

```yaml
screen_name: "NotificationsEmptyScreen"
screen_archetype: "empty_state"
task_id: "app-021"
sprint_id: "ugc-platform-integration-qa-2"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
figma_frame: "37211:167434"
figma_file: "7hozJ6Pvs09q98BxvChj08"
```

## Component Tree

```
Screen [frame: 390x844]
├── StatusBar [system] (div) #status-bar
├── Header [container] (header) #header
│   ├── BackButton [icon-button] (button) #header-back — chevron-left, navigate back
│   ├── HeaderTitle [text] (h1) #header-title — "알림"
│   └── SettingsAction [text-button] (button) #header-settings — "설정" → app-022 navigate
├── Body [scroll-container] (main) #body
│   ├── NotificationsOffNotice [container] (section) #notice-off — 조건부 (OS 권한 denied 시)
│   │   ├── NoticeIcon [icon] (span) #notice-off-icon — bell-off 20px
│   │   ├── NoticeLabel [text] (span) #notice-off-label — "휴대폰의 앱 알림이 꺼져있어요"
│   │   └── NoticeAction [text-button] (button) #notice-off-action — "알림 켜기" (brand color)
│   └── EmptyStateView [container] (section) #empty-state — 시각 중앙
│       ├── EmptyAnchor [icon-container] (div) #empty-anchor — 96px brand-weak fill 원
│       │   └── EmptyAnchorIcon [icon] (svg) #empty-anchor-icon — bell-off 48px brand stroke
│       ├── EmptyHeadline [text] (h2) #empty-headline — "조용한 하루네요"
│       ├── EmptyBody [text] (p) #empty-body — "친구를 팔로우하면 좋아요·소식·새 팔로워 알림을 받아볼 수 있어요."
│       └── EmptyPrimaryCTA [button-primary] (button) #empty-cta — "친구 찾기" → 검색 탭 navigate
└── BottomNav [navigation] (nav) #bottom-nav — 5탭 (홈, 검색, 만들기, 알림(active), MY)
```

### Component Details

```yaml
components:
  - name: "BackButton"
    id: "header-back"
    tag: "button"
    type: "icon-button"
    position: "header-left"
    size: "32x32"
    tokens:
      fill: "transparent"
      text: "wds.label.normal"
      radius: "none"
    behavior:
      purpose: "이전 화면(설정 또는 홈)으로 복귀"
      user_action: "tap"
      feedback: "navigation"
    a11y:
      role: "button"
      label: "뒤로 가기"

  - name: "HeaderTitle"
    id: "header-title"
    tag: "h1"
    type: "text"
    position: "header-center"
    size: "wrap-content"
    tokens:
      text: "wds.label.normal"
      font_size: "wds.font.size.lg (16px)"
      font_weight: "wds.font.weight.bold (700)"
    a11y:
      role: "heading"
      label: "알림"

  - name: "SettingsAction"
    id: "header-settings"
    tag: "button"
    type: "text-button"
    position: "header-right"
    size: "wrap-content"
    tokens:
      text: "wds.label.normal"
      font_size: "wds.font.size.md (14px)"
      font_weight: "wds.font.weight.medium (500)"
    behavior:
      purpose: "알림 설정 진입점 (app-022 알림설정_토글)"
      user_action: "tap"
      feedback: "navigation"
    a11y:
      role: "button"
      label: "알림 설정"

  - name: "NotificationsOffNotice"
    id: "notice-off"
    tag: "section"
    type: "container"
    position: "body-top"
    size: "full-width minus 32px"
    tokens:
      fill: "component.notice.fill (var(--component-notice-fill))"
      radius: "component.notice.radius (12px)"
      spacing: "14 16"
    states:
      default: "표시 (OS 권한 denied 가정)"
      hidden: "OS 권한 granted 시 숨김"
    behavior:
      purpose: "OS 알림 권한이 꺼졌을 때 사용자에게 알리고 한 tap 으로 시스템 설정 진입"
    a11y:
      role: "region"
      label: "휴대폰 알림 비활성화 안내"

  - name: "NoticeIcon"
    id: "notice-off-icon"
    tag: "span"
    type: "icon"
    size: "20x20"
    tokens:
      text: "component.notice.icon"
    notes: "Lucide bell-off (Figma: notifications_off)"

  - name: "NoticeLabel"
    id: "notice-off-label"
    tag: "span"
    type: "text"
    tokens:
      text: "component.notice.label"
      font_size: "wds.font.size.sm (13px)"
      font_weight: "wds.font.weight.medium (500)"

  - name: "NoticeAction"
    id: "notice-off-action"
    tag: "button"
    type: "text-button"
    tokens:
      fill: "transparent"
      text: "component.notice.action (brand)"
      font_size: "wds.font.size.sm (13px)"
      font_weight: "wds.font.weight.semibold (600)"
    behavior:
      purpose: "OS 시스템 설정의 알림 권한 화면으로 deeplink"
      user_action: "tap"
      feedback: "navigation"
    a11y:
      role: "button"
      label: "휴대폰 알림 켜기"

  - name: "EmptyAnchor"
    id: "empty-anchor"
    tag: "div"
    type: "icon-container"
    position: "center"
    size: "96x96"
    tokens:
      fill: "component.empty.icon.fill (brand-weak #F5F0FF)"
      radius: "wds.radius.full"
    layout:
      direction: "vertical"
      alignment: "center"
      sizing: "fixed"
    notes: "empty_state persona 강제 룰 #1 — 시각 앵커 80px+ 충족 (96px)"

  - name: "EmptyAnchorIcon"
    id: "empty-anchor-icon"
    tag: "svg"
    type: "icon"
    size: "48x48"
    tokens:
      text: "component.empty.icon.color (brand)"
    notes: "Lucide bell-off, stroke-width 1.75"

  - name: "EmptyHeadline"
    id: "empty-headline"
    tag: "h2"
    type: "text"
    tokens:
      text: "wds.label.normal"
      font_size: "wds.font.size.lg (16px)"
      font_weight: "wds.font.weight.bold (700)"
    a11y:
      role: "heading"
      label: "조용한 하루네요"
    constraints:
      max_lines: 1
      truncation: "none"
    notes: "empty_state persona 강제 룰 #2 (≤3 문장) 및 #4 (부정 어조 금지) 충족"

  - name: "EmptyBody"
    id: "empty-body"
    tag: "p"
    type: "text"
    tokens:
      text: "wds.label.alternative"
      font_size: "wds.font.size.md (14px)"
      font_weight: "wds.font.weight.regular (400)"
    constraints:
      max_lines: 2
      truncation: "none"
    notes: "행동 유도형 본문 — '친구를 팔로우하면 ... 받아볼 수 있어요'"

  - name: "EmptyPrimaryCTA"
    id: "empty-cta"
    tag: "button"
    type: "button-primary"
    position: "below-body"
    size: "wrap-content (min 160px)"
    tokens:
      fill: "component.button.primary.fill (brand)"
      text: "component.button.primary.label (white)"
      radius: "wds.radius.lg (16px)"
      spacing: "12 24"
    behavior:
      purpose: "알림이 비어있는 상황을 해결할 다음 행동 제시 — 친구 찾기로 활동 시작 유도"
      user_action: "tap"
      feedback: "navigation"
    a11y:
      role: "button"
      label: "친구 찾기"
    notes: "empty_state persona 강제 룰 #3 — single primary CTA"

  - name: "BottomNav"
    id: "bottom-nav"
    tag: "nav"
    type: "navigation"
    position: "sticky-bottom"
    size: "full-width x 64px"
    tokens:
      fill: "wds.background.normal"
      border: "wds.line.alternative (top 0.5px)"
    notes: "5탭 — 알림 탭 active"
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 390x844
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: header
      height: fixed(48px)
      type: flex-row
      alignment: space-between
      padding: "0 12px"
    - id: body
      flex: 1
      scroll: vertical
      padding-bottom: 64px
      type: flex-column
      children:
        - id: notice-off
          margin: "16px 16px 0"
          type: flex-row
          alignment: space-between
          gap: 8px
          padding: "14px 16px"
        - id: empty-state
          flex: 1
          type: flex-column
          alignment: center
          justify: center
          padding: "32px 24px"
          gap: 16px
    - id: bottom-nav
      sticky: bottom
      height: fixed(64px)
```

## States

```yaml
states:
  default:
    description: "OS 권한 denied + items.length == 0 (PRD AC-3.2 + 시스템 안내 동시)"
    active: true
    visible_components: [header, notice-off, empty-state, bottom-nav]
    hidden_components: []

  permission-granted:
    description: "OS 권한 granted + items.length == 0 (시스템 안내 숨김, empty_state 만)"
    visible_components: [header, empty-state, bottom-nav]
    hidden_components: [notice-off]

  loading:
    description: "초기 로드 중 (skeleton notice + skeleton empty 영역)"
    visible_components: [header, loading-skeleton, bottom-nav]
    hidden_components: [notice-off, empty-state]

  error:
    description: "알림 fetch 실패"
    visible_components: [header, error-view, bottom-nav]
    hidden_components: [notice-off, empty-state]
    labels:
      message: "알림을 불러오지 못했어요"
      retry: "다시 시도"
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#header-back"
    action: go-back
    transition: slide-right

  - trigger: tap
    target: "#header-settings"
    action: navigate
    destination: "NotificationSettingsScreen (app-022)"
    transition: slide-left

  - trigger: tap
    target: "#notice-off-action"
    action: navigate
    destination: "OS-system-notification-settings (deeplink)"
    transition: none
    notes: "프로토타입에서는 toast 로 의도 표현"

  - trigger: tap
    target: "#empty-cta"
    action: navigate
    destination: "SearchTab (친구 찾기)"
    transition: cross-fade

  - trigger: tap
    target: "#nav-home"
    action: switch-tab
    destination: "HomeTab"

  - trigger: tap
    target: "#nav-search"
    action: switch-tab
    destination: "SearchTab"

  - trigger: tap
    target: "#nav-create"
    action: switch-tab
    destination: "CreateTab"

  - trigger: tap
    target: "#nav-my"
    action: switch-tab
    destination: "MyTab"
```

## Visual Rules

```yaml
rules:
  - condition: "OS notification permission == denied"
    effect: "NotificationsOffNotice 표시"
    example: "사용자가 iOS 설정에서 ZZEM 알림을 OFF 한 상태로 진입"

  - condition: "OS notification permission == granted AND items.length == 0"
    effect: "NotificationsOffNotice 숨김, EmptyStateView 만 표시"
    example: "권한은 있으나 알림 0건"

  - condition: "EmptyStateView 위치"
    effect: "body 의 NotificationsOffNotice 아래 영역의 정중앙 (vertical + horizontal)"
    example: "notice 표시 시 약간 하단 치우침 가능, 그래도 시각적 중앙 의도"
```

## Labels (ko)

```yaml
labels:
  header:
    title: "알림"
    back_a11y: "뒤로 가기"
    settings: "설정"
  notice_off:
    label: "휴대폰의 앱 알림이 꺼져있어요"
    action: "알림 켜기"
  empty_state:
    headline: "조용한 하루네요"
    body: "친구를 팔로우하면 좋아요·소식·새 팔로워 알림을 받아볼 수 있어요."
    cta: "친구 찾기"
  bottom_nav:
    - "홈"
    - "검색"
    - "만들기"
    - "알림"
    - "MY"
  toast:
    notice_action: "휴대폰 설정 → 알림에서 ZZEM 을 켜주세요"
    cta_action: "친구 찾기로 이동합니다"
  error:
    message: "알림을 불러오지 못했어요"
    retry: "다시 시도"
```

## Token Map

```yaml
tokens:
  background:           "wds.background.normal → #FFFFFF"
  text_primary:         "wds.label.normal → #212228"
  text_secondary:       "wds.label.alternative → #6B6E76"
  text_hint:            "wds.label.assistive → #8E9199"
  divider:              "wds.line.alternative → #F0F1F3"
  brand:                "wds.fill.brand-primary → #8752FA"
  brand_weak:           "wds.fill.brand-weak → #F5F0FF"
  notice_fill:          "component.notice.fill → #F7F8F9 (surface-secondary)"
  notice_label:         "component.notice.label → #212228"
  notice_icon:          "component.notice.icon → #6B6E76"
  notice_action:        "component.notice.action → #8752FA"
  notice_radius:        "component.notice.radius → 12px"
  empty_icon_fill:      "component.empty.icon.fill → #F5F0FF (brand-weak)"
  empty_icon_color:     "component.empty.icon.color → #8752FA"
  empty_icon_size:      "component.empty.icon.size → 96px"
  button_primary_fill:  "component.button.primary.fill → #8752FA"
  button_primary_label: "component.button.primary.label → #FFFFFF"
  button_radius:        "wds.radius.lg → 16px"
  font_family:          "wds.font.family.primary → Pretendard, -apple-system, ..."
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 13
    with_token_map: 13
    with_html_mapping: 13
    score: "26 / 26 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "EmptyAnchor (96px bell-off icon container) — Figma 에 부재. empty_state persona 강제 룰 #1 충족용"
      - "EmptyHeadline 카피 '조용한 하루네요' — Figma 카피 '아직 도착한 알림이 없어요' 의 부정 어조 회피 (persona 강제 룰 #4 vs PRD '카피 그대로' 충돌)"
      - "EmptyBody 카피 '친구를 팔로우하면 ... 받아볼 수 있어요' — Figma 에 부재. persona 강제 룰 #2 본문 1-2 문장 충족용"
      - "EmptyPrimaryCTA '친구 찾기' — Figma 에 부재. persona 강제 룰 #3 single primary CTA 충족용"
    risk_level: "medium"
    rationale: |
      Figma 단일 frame 이 시각 앵커 / body / primary CTA 를 모두 누락. PRD 'Figma 카피 그대로' 룰과
      empty_state persona 강제 룰 4개가 충돌 — DE 가 persona 우선으로 판단하여 추론. Sprint Lead 게이트 필수.
  schema_completeness:
    required_sections:
      - "meta"
      - "component_tree"
      - "layout_spec"
      - "states"
      - "interactions"
      - "labels"
      - "token_map"
    present_sections:
      - "meta"
      - "component_tree"
      - "layout_spec"
      - "states"
      - "interactions"
      - "visual_rules"
      - "labels"
      - "token_map"
      - "quality_score"
    score: "7 / 7 = 1.0 (+ 2 optional)"
  context_coverage:
    why_linked: "2 / 2 = 1.0 (AC-3.2 → empty-state, AC-3.2-system-alert → notice-off)"
    what_resolved: "13 / 13 components mapped to tokens + components_needed"
```
