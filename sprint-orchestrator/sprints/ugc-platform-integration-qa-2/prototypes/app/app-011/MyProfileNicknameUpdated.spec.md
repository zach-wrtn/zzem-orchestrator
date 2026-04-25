# Screen Spec — MyProfileNicknameUpdated (app-011)

```yaml
meta:
  screen: MyProfileNicknameUpdated
  task_id: app-011
  sprint_id: ugc-platform-integration-qa-2
  archetype: detail
  figma_frame: "37160:79937 (MY_프로필_닉네임변경완료)"
  figma_file: "7hozJ6Pvs09q98BxvChj08"
  app: ZZEM
  platform: "iOS / Android (React Native)"
  language: ko
  frame: "390x844"
  theme: light
  sibling_pattern: "app-016 OtherProfileScreen-Unblocked (detail archetype, profile hero + tab + grid + toast)"

business_context:
  linked_ac: [AC-1.5a, AC-1.5b, AC-1.5c]
  purpose: "닉네임 변경 직후 MY 프로필 화면이 새 닉네임으로 즉시 갱신되었음을 1-step 으로 검증한다 (Toast + hero 라벨 동시)."

# ─────────────────────────────
# Component Tree
# ─────────────────────────────
component_tree: |
  MyProfileNicknameUpdated [frame: 390x844, archetype: detail]
  ├── StatusBar [system] (div) #status-bar — 9:41 + indicators
  ├── HeaderBar [navigation] (header) #header-bar (sticky-top z=2)
  │   ├── HeaderSpacer [spacer] (div) — 좌측 비움 (MY root, no back)
  │   ├── HeaderTitle [text] (h1) #header-title — "{newNickname}"
  │   └── SettingsButton [icon-button] (button) #btn-settings — lucide Settings 24px
  ├── Toast [feedback] (div) #toast (overlay top, below header)
  │   └── ToastText — "닉네임을 변경했어요"
  ├── ProfileHero [container] (section) #profile-hero (height ≥320px)
  │   ├── Avatar [avatar] (div) #avatar — 100px circle, initial fallback (보존)
  │   ├── Nickname [text] (h2) #nickname — "{newNickname}" (NEW VALUE)
  │   ├── CountRow [container] (ul) #count-row — 3 tiles
  │   │   ├── CountTile [item] (li) — 팔로워 0 (보존)
  │   │   ├── CountTile [item] (li) — 팔로잉 0 (보존)
  │   │   └── CountTile [item] (li) — 재생성받 0 (보존)
  │   └── CtaRow [container] (div) #cta-row
  │       ├── EditButton [button-secondary] (button) #btn-edit — "프로필 편집"
  │       └── ShareButton [button-secondary] (button) #btn-share — "프로필 공유"
  ├── ContentTabBar [navigation] (nav) #content-tabs (sticky-top below header)
  │   ├── TabPublic [tab] (button) — Grid icon, active default
  │   ├── TabPrivate [tab] (button) — Lock icon (MY 본인이므로 enabled)
  │   └── TabLiked [tab] (button) — Heart icon
  ├── ContentGrid [grid] (main) #content-grid — 6 cells (2-col mixed-ratio, 보존)
  │   └── MemeCard [card] (article) × 6
  │       ├── PlaceholderImage [image] (div) — gradient (kind=gradient-token)
  │       └── LikeBadge [badge] (span) — heart icon + count
  └── BottomNav [navigation] (nav) #bottom-nav (sticky-bottom)
      ├── NavHome [icon-button] (button)
      ├── NavSearch [icon-button] (button)
      └── NavMy [icon-button] (button) — active (현재 컨텍스트)

# ─────────────────────────────
# Component Details (Component-as-Data)
# ─────────────────────────────
components:
  - name: HeaderBar
    id: header-bar
    tag: header
    type: navigation
    position: sticky-top
    size: "390x48"
    tokens:
      fill: "var(--wds-background-normal)"
      border-bottom: "1px solid var(--wds-line-alternative)"
      spacing: "0 8px"
    layout: { direction: horizontal, alignment: space-between, sizing: hug }
    a11y: { role: banner, label: "MY 프로필 헤더" }

  - name: SettingsButton
    id: btn-settings
    tag: button
    type: icon-button
    size: "44x44 hit, icon 24px"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "MY 프로필 설정 진입 — root 화면 우상단 단일 진입점"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "설정" }

  - name: Toast
    id: toast
    tag: div
    type: feedback
    position: "absolute, top 100px (status-bar+header 아래), centered pill"
    size: "auto height"
    tokens:
      fill: "var(--wds-color-neutral-900)"
      label: "var(--wds-label-inverse)"
      radius: "var(--wds-radius-full)"
      padding: "10px 20px"
      font: "13px / 500"
    behavior:
      purpose: "닉네임 변경 결과 통지 (AC-1.5b) — 3s 자동 dismiss"
      user_action: passive
      feedback: visual
    states:
      default: "visible (entry 시), 3s 후 fade out → toast-dismissed"
      toast-dismissed: hidden
    a11y: { role: status, "aria-live": polite }

  - name: ProfileHero
    id: profile-hero
    tag: section
    type: container
    position: in-flow (top-of-body)
    size: "full-width x ≥320px"
    tokens:
      fill: "var(--wds-background-normal)"
      spacing: "24px 20px 16px"
      gap: "16px"
    layout: { direction: vertical, alignment: center, sizing: hug }
    behavior:
      purpose: "MY 프로필 정체성 + 메타 + 액션 묶음 (detail persona 강제 룰 #1 — Hero ≥320px)"
    a11y: { role: region, label: "MY 프로필 정보" }
    constraints:
      min_height: "320px"

  - name: Avatar
    id: avatar
    tag: div
    type: avatar
    size: "100x100"
    tokens:
      fill: "var(--pe-avatar-empty-bg)"
      border: "1px solid var(--pe-avatar-border)"
      radius: "var(--wds-radius-full)"
      color: "var(--wds-color-purple-500)"
    behavior:
      purpose: "MY 사용자 식별 — 닉네임 변경 직후에도 avatar 보존 (AC-1.5c)"
    a11y: { role: img, label: "내 프로필 이미지" }

  - name: Nickname
    id: nickname
    tag: h2
    type: text
    tokens:
      font_size: 18
      font_weight: 700
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "새 닉네임 즉시 반영 (AC-1.5a) — hero 시각 앵커 핵심"
    a11y: { role: heading, label: "{newNickname}" }
    constraints: { max_lines: 1, truncation: ellipsis }

  - name: CountRow
    id: count-row
    tag: ul
    type: container
    layout: { direction: horizontal, alignment: space-between, sizing: fill }
    behavior:
      purpose: "팔로워/팔로잉/재생성받 메타 — detail persona 강제 룰 #3 (메타 4 이내, 본 화면 3개)"
    a11y: { role: list, label: "내 프로필 카운트" }

  - name: CountTile
    tag: li
    type: text
    tokens:
      value_font: "18px / 600 / var(--pe-text-primary)"
      label_font: "12px / 500 / var(--pe-text-secondary)"
    a11y: { role: listitem }

  - name: EditButton
    id: btn-edit
    tag: button
    type: button-secondary
    size: "fill-1 (grid 1fr)"
    tokens:
      fill: "var(--wds-surface-tertiary)"
      label: "var(--wds-label-normal)"
      radius: "var(--wds-radius-md)"
      padding: "10px 16px"
      font: "14px / 600"
    behavior:
      purpose: "프로필 편집 재진입 — secondary CTA (detail persona 강제 룰 #4 — secondary 0~2 중 1)"
      user_action: tap
      feedback: navigation
    a11y: { role: button, label: "프로필 편집" }

  - name: ShareButton
    id: btn-share
    tag: button
    type: button-secondary
    tokens:
      fill: "var(--wds-surface-tertiary)"
      label: "var(--wds-label-normal)"
      radius: "var(--wds-radius-md)"
      padding: "10px 16px"
      font: "14px / 600"
    behavior:
      purpose: "프로필 공유 — secondary CTA (detail persona 강제 룰 #4 — secondary 0~2 중 2)"
      user_action: tap
      feedback: navigation (mock)
    a11y: { role: button, label: "프로필 공유" }

  - name: ContentTabBar
    id: content-tabs
    tag: nav
    type: navigation
    position: sticky-top (below header)
    size: "full-width x 44px"
    tokens:
      fill: "var(--wds-background-normal)"
      border-bottom: "1px solid var(--wds-line-alternative)"
    layout: { direction: horizontal, alignment: center }
    behavior:
      purpose: "탭 전환 (콘텐츠 인터랙션 AC) — 공개/비공개/좋아요. MY 본인이므로 비공개 enabled."
      user_action: "tap (탭 전환)"
      feedback: visual
    a11y: { role: tablist, label: "내 프로필 콘텐츠 탭" }

  - name: ContentGrid
    id: content-grid
    tag: main
    type: grid
    layout: { direction: vertical, sizing: fill }
    tokens:
      fill: "var(--wds-line-alternative)"
      gap: "1px"
    behavior:
      purpose: "콘텐츠 보존 검증 (AC-1.5c) — 닉네임 변경과 무관하게 그리드 유지"
      user_action: "card tap → 상세 진입 (mock)"
      feedback: navigation
    a11y: { role: grid, label: "내 콘텐츠 그리드" }

  - name: MemeCard
    tag: article
    type: card
    size: "1:1 또는 4:5 mix"
    tokens:
      radius: "var(--wds-radius-xs)"
      fill: "var(--wds-surface-secondary)"
    a11y: { role: gridcell, label: "콘텐츠 항목" }
    constraints: { truncation: none }

  - name: BottomNav
    id: bottom-nav
    tag: nav
    type: navigation
    position: sticky-bottom
    size: "full-width x 64px"
    tokens:
      fill: "var(--wds-background-normal)"
      border-top: "0.5px solid var(--wds-line-alternative)"
    a11y: { role: navigation, label: "주 내비게이션" }

# ─────────────────────────────
# Layout Spec
# ─────────────────────────────
layout_spec:
  type: flex-column
  viewport: "390x844"
  regions:
    - id: status-bar
      height: "fixed(44)"
    - id: header-bar
      sticky: top
      height: "fixed(48)"
    - id: toast
      overlay: true
      top: "100"   # status(44) + header(48) + 8 inset
      horizontal: center
      visibility: state-driven
    - id: profile-hero
      type: flex-column
      align: center
      padding: "24px 20px 16px"
      gap: "16px"
      min_height: "320"
    - id: content-tabs
      sticky: top (under header — visually below hero in scroll context)
      height: "fixed(44)"
    - id: content-grid
      type: grid
      columns: 2
      gap: "1px"
      flex: 1
      scroll: vertical
    - id: bottom-nav
      sticky: bottom
      height: "fixed(64)"

# ─────────────────────────────
# States
# ─────────────────────────────
states:
  default:
    description: "닉네임 변경 직후 — Toast 표시 중, hero 새 닉네임 노출, avatar/통계/그리드 보존"
    active: true
    visible_components: [toast, profile-hero, content-tabs, content-grid, bottom-nav]
    hidden_components: []

  toast-dismissed:
    description: "Toast 자동 dismiss 후 — 정상 영구 상태 (새 닉네임 영구 표시)"
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav]
    hidden_components: [toast]

  tab-private:
    description: "비공개 탭 활성 — MY 본인이므로 접근 가능"
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav]
    hidden_components: [toast]
    extra: "TabPrivate aria-selected=true"

# ─────────────────────────────
# Interactions
# ─────────────────────────────
interactions:
  - trigger: tap
    target: "#btn-settings"
    action: navigate
    destination: "SettingsScreen (mock)"
    transition: "slide-left"

  - trigger: tap
    target: "#btn-edit"
    action: navigate
    destination: "ProfileEditScreen (app-001 류 mock)"
    transition: "slide-up"

  - trigger: tap
    target: "#btn-share"
    action: navigate
    destination: "ShareSheet (mock)"
    transition: "slide-up"

  - trigger: tap
    target: ".tab-item"
    action: switch-tab
    destination: null
    transition: none

  - trigger: tap
    target: ".meme-card"
    action: navigate
    destination: "ContentDetail (mock)"
    transition: "slide-up"

  - trigger: tap
    target: ".bottom-nav__item"
    action: switch-tab
    destination: null
    transition: none

  - trigger: auto
    target: "#toast"
    action: toggle-state
    state_key: "toast-dismissed"
    timing: "3000ms after default state enter"
    note: "Toast auto-dismiss (AC-1.5b) — alert/confirm/prompt 절대 사용 금지"

# ─────────────────────────────
# Visual Rules
# ─────────────────────────────
rules:
  - condition: "state == default (entry)"
    effect: "Toast visible top, 3s timer 시작"
    example: "AC-1.5b (toast 자동 dismiss)"
  - condition: "Hero nickname 표시"
    effect: "새 닉네임 값으로 라벨 = '{newNickname}' (변경 전 값과 다름이 시각적으로 확인 가능)"
    example: "AC-1.5a (새 닉네임 hero 즉시 반영)"
  - condition: "Avatar / count-row / content-grid 데이터"
    effect: "변경 전 값 그대로 유지 — 시각적 변경 0건"
    example: "AC-1.5c (avatar/통계 보존)"
  - condition: "MY 프로필이므로 비공개 탭 enabled"
    effect: "TabPrivate 클릭 가능, 색 normal"
    example: "본인만 비공개 가능 (본인 케이스)"

# ─────────────────────────────
# Labels (ko)
# ─────────────────────────────
labels:
  header_title: "maezzi"     # new nickname mock — Figma 'a이디' 자리 대체
  nickname: "maezzi"
  count_row:
    - { value: "0", label: "팔로워" }
    - { value: "0", label: "팔로잉" }
    - { value: "0", label: "재생성받" }
  cta:
    edit: "프로필 편집"
    share: "프로필 공유"
  tabs:
    - { id: "public", label: "공개" }
    - { id: "private", label: "비공개" }
    - { id: "liked", label: "좋아요" }
  toast:
    nickname_updated: "닉네임을 변경했어요"
  bottom_nav:
    - { id: "home", label: "홈" }
    - { id: "search", label: "검색" }
    - { id: "my", label: "MY" }
  a11y:
    settings: "설정"
    edit: "프로필 편집"
    share: "프로필 공유"
    avatar: "내 프로필 이미지"
    toast: "닉네임 변경 알림"

# ─────────────────────────────
# Token Map
# ─────────────────────────────
tokens:
  background:        "wds-background-normal → #FFFFFF"
  text_primary:      "wds-label-normal → #212228"
  text_secondary:    "wds-label-alternative → #6B6E76"
  text_assistive:    "wds-label-assistive → #8E9199"
  text_inverse:      "wds-label-inverse → #FFFFFF"
  surface_secondary: "wds-surface-secondary → #F7F8F9"
  surface_tertiary:  "wds-surface-tertiary → #F0F1F3"
  divider_weak:      "wds-line-alternative → #F0F1F3"
  divider_normal:    "wds-line-normal → #E4E5E9"
  brand_primary:     "wds-fill-brand-primary → #8752FA"
  btn_radius:        "wds-radius-md → 12px"
  card_radius:       "wds-radius-xs → 4px (feed-grid 표준)"
  toast_pill_radius: "wds-radius-full → 9999px (top pill 형태)"
  toast_fill:        "wds-color-neutral-900 → #212228"
  avatar_fill:       "pe-avatar-empty-bg → #F5F3FF"
  avatar_border:     "pe-avatar-border → rgba(136,136,136,0.2)"
  font_family:       "wds-font-family-primary → Pretendard"

# ─────────────────────────────
# Quality Score
# ─────────────────────────────
quality_score:
  extraction_accuracy:
    total_components: 13
    with_token_map: 13
    with_html_mapping: 13
    score: "26 / 26 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "newNickname mock 값 'maezzi' — Figma frame 의 가상 라벨 자리 (a이디) 를 영문 닉네임으로 대체. 한국어 닉네임도 가능 (Sprint Lead 결정)."
      - "Count tile 값 0/0/0 — Figma 시사 (신규/리셋 상태). 변경 전후 동일 보존만 검증되면 OK."
      - "Tab '재생성받' 라벨 — Figma 가독성 한계로 추정. 실제는 '게시물' 일 수도 있음 (gate Q)."
      - "BottomNav 3-tab variant (홈/검색/MY) — Figma 시사. 표준 5-tab 과 다른 simplified variant."
    risk_level: "low"
    rationale: |
      모두 detail archetype 의 표준 hero 패턴 + sibling app-016 답습. 비즈니스 로직 / 닉네임 변경 결과 자체에 대한 추론 없음.
      Figma 라벨 가독성으로 인한 mock 라벨만 추정.
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "business_context", "component_tree", "components", "layout_spec", "states", "interactions", "rules", "labels", "tokens", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "3 / 3 = 1.0"   # AC-1.5a, AC-1.5b, AC-1.5c 모두 컴포넌트/상태 연결
    what_resolved: "13 / 13 = 1.0"
```
