# Screen Spec — OtherProfileScreen-Unblocked (app-016)

```yaml
meta:
  screen: OtherProfileScreen-Unblocked
  task_id: app-016
  sprint_id: ugc-platform-integration-qa-2
  archetype: detail
  figma_frame: "37211:162146 (타유저_프로필_차단해제후)"
  figma_file: "7hozJ6Pvs09q98BxvChj08"
  app: ZZEM
  platform: "iOS / Android (React Native)"
  language: ko
  frame: "390x844"
  theme: light

business_context:
  linked_ac: [AC-2.3, AC-2.5]
  purpose: "차단 해제 직후 타유저 프로필이 정상 상태로 복원된 결과를 1-step에 검증한다 (콘텐츠 정상 + Toast 자동 dismiss)."

# ─────────────────────────────
# Component Tree
# ─────────────────────────────
component_tree: |
  OtherProfileScreen-Unblocked [frame: 390x844, archetype: detail]
  ├── StatusBar [system] (div) #status-bar — 9:41 + indicators
  ├── HeaderBar [navigation] (header) #header-bar (sticky-top z=2)
  │   ├── BackButton [icon-button] (button) #btn-back — lucide ArrowLeft 24px
  │   ├── HeaderTitle [text] (h1) #header-title — "{nickname}"
  │   └── MoreButton [icon-button] (button) #btn-more — lucide MoreVertical 24px → app-012
  ├── ProfileHero [container] (section) #profile-hero (height ≥320px)
  │   ├── Avatar [avatar] (div) #avatar — 100px circle, initial fallback
  │   ├── Nickname [text] (h2) #nickname — "memer_kim"
  │   ├── Bio [text] (p) #bio — 1-line bio (optional, hidden when empty)
  │   ├── CountRow [container] (ul) #count-row — 3 tiles
  │   │   ├── CountTile [item] (li) — 팔로워 1.2만
  │   │   ├── CountTile [item] (li) — 팔로잉 248
  │   │   └── CountTile [item] (li) — 게시물 86
  │   └── CtaRow [container] (div) #cta-row
  │       ├── FollowButton [button-primary] (button) #btn-follow — "팔로우"
  │       └── MessageButton [button-secondary] (button) #btn-message — "메시지"
  ├── ContentTabBar [navigation] (nav) #content-tabs (sticky-top below header)
  │   ├── TabPublic [tab] (button) — Grid icon, active default
  │   ├── TabPrivate [tab] (button) — Lock icon (inactive — 본인만 표시 — hidden for other-user. Visual only, disabled.)
  │   └── TabLiked [tab] (button) — Heart icon
  ├── ContentGrid [grid] (main) #content-grid — 6 cells (2-col mixed-ratio)
  │   └── MemeCard [card] (article) × 6
  │       ├── PlaceholderImage [image] (div) — gradient (kind=gradient-token)
  │       └── LikeBadge [badge] (span) — heart icon + count
  ├── BottomNav [navigation] (nav) #bottom-nav (sticky-bottom)
  │   ├── NavHome [icon-button] (button)
  │   ├── NavSearch [icon-button] (button) — active (came from search/feed)
  │   └── NavMy [icon-button] (button)
  └── Toast [feedback] (div) #toast (overlay, bottom 80px)
      └── ToastText — "memer_kim님 차단 해제했어요"

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
    a11y: { role: banner, label: "타유저 프로필 헤더" }

  - name: BackButton
    id: btn-back
    tag: button
    type: icon-button
    size: "44x44 hit, icon 24px"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "이전 화면 (prev: 더보기 시트 or feed) 으로 복귀 — detail persona 강제 룰 #2 (back 1-way)"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "뒤로가기" }

  - name: MoreButton
    id: btn-more
    tag: button
    type: icon-button
    size: "44x44 hit, icon 24px"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "더보기 메뉴 진입 (app-012 일반 더보기 메뉴) — AC 마지막 항목"
      user_action: "tap"
      feedback: open-overlay
    a11y: { role: button, label: "더보기" }

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
      purpose: "타유저 정체성 + 메타 + 핵심 액션 묶음 (detail persona 강제 룰 #1 — Hero 영역 320px+)"
    a11y: { role: region, label: "타유저 프로필 정보" }
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
      purpose: "타유저 식별 — 실 이미지 미제공시 initial 폴백"
    a11y: { role: img, label: "memer_kim 프로필 이미지" }

  - name: Nickname
    id: nickname
    tag: h2
    type: text
    tokens:
      font_size: 18
      font_weight: 700
      color: "var(--wds-label-normal)"
    a11y: { role: heading, label: "memer_kim" }
    constraints: { max_lines: 1, truncation: ellipsis }

  - name: CountRow
    id: count-row
    tag: ul
    type: container
    layout: { direction: horizontal, alignment: space-between, sizing: fill }
    behavior:
      purpose: "팔로워/팔로잉/게시물 메타 — detail persona 강제 룰 #3 (메타 4 이내, 본 화면은 3개)"
    a11y: { role: list, label: "프로필 카운트" }

  - name: CountTile
    tag: li
    type: text
    tokens:
      value_font: "18px / 600 / var(--pe-text-primary)"
      label_font: "12px / 500 / var(--pe-text-secondary)"
    a11y: { role: listitem }

  - name: FollowButton
    id: btn-follow
    tag: button
    type: button-primary
    size: "fill-1 (grid 1fr)"
    tokens:
      fill: "var(--component-button-primary-fill)"
      label: "var(--component-button-primary-label)"
      radius: "var(--wds-radius-md)"
      padding: "10px 16px"
      font: "14px / 600"
    behavior:
      purpose: "차단 해제 직후 팔로우 가능 — primary CTA (detail persona 강제 룰 #4)"
      user_action: "tap"
      feedback: "visual (label/fill 토글: '팔로우' → '팔로잉')"
    states:
      default: "label '팔로우', fill brand"
      followed: "label '팔로잉', fill secondary (--wds-surface-tertiary), label normal"
    a11y: { role: button, label: "팔로우" }

  - name: MessageButton
    id: btn-message
    tag: button
    type: button-secondary
    tokens:
      fill: "var(--wds-surface-tertiary)"
      label: "var(--wds-label-normal)"
      radius: "var(--wds-radius-md)"
      padding: "10px 16px"
      font: "14px / 600"
    behavior:
      purpose: "DM 진입 — secondary CTA (detail persona 강제 룰 #4 — secondary 0~2 중 1)"
      user_action: tap
      feedback: navigation (mock)
    a11y: { role: button, label: "메시지 보내기" }

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
      purpose: "탭 전환 (콘텐츠 인터랙션 AC) — 공개/좋아요. 비공개는 본인만 (다른 사용자 → disabled visual)."
      user_action: "tap (탭 전환)"
      feedback: visual
    a11y: { role: tablist, label: "프로필 콘텐츠 탭" }

  - name: ContentGrid
    id: content-grid
    tag: main
    type: grid
    layout: { direction: vertical, sizing: fill }
    tokens:
      fill: "var(--wds-line-alternative)"
      gap: "1px"
    behavior:
      purpose: "차단 해제 핵심 검증 신호 — 콘텐츠가 보인다 (AC-2.3)"
      user_action: "card tap → 상세 진입 (mock)"
      feedback: navigation
    a11y: { role: grid, label: "공개 콘텐츠 그리드" }

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

  - name: Toast
    id: toast
    tag: div
    type: feedback
    position: "absolute, bottom 80px, left/right 16px"
    size: "auto height"
    tokens:
      fill: "var(--wds-color-neutral-900)"
      label: "var(--wds-label-inverse)"
      radius: "var(--wds-radius-lg)"
      padding: "12px 16px"
      font: "13px / 500"
    behavior:
      purpose: "차단 해제 결과 통지 (AC-2.5) — 3s 자동 dismiss"
      user_action: passive
      feedback: visual
    states:
      default: "visible (entry 시), 3s 후 fade out → toast-dismissed"
      toast-dismissed: hidden
    a11y: { role: status, "aria-live": polite }

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
    - id: profile-hero
      type: flex-column
      align: center
      padding: "24px 20px 16px"
      gap: "16px"
      min_height: "320"
    - id: content-tabs
      sticky: top (under header+hero scroll context — visually below hero)
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
    - id: toast
      overlay: true
      bottom: "80"
      horizontal_inset: "16"

# ─────────────────────────────
# States
# ─────────────────────────────
states:
  default:
    description: "차단 해제 직후 — Toast 표시 중, 콘텐츠 정상 노출, 팔로우 button '팔로우' 라벨"
    active: true
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav, toast]
    hidden_components: []

  toast-dismissed:
    description: "Toast 자동 dismiss 후 — 정상 영구 상태"
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav]
    hidden_components: [toast]

  followed:
    description: "팔로우 button tap 후 — '팔로잉' 라벨 + secondary fill"
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav]
    hidden_components: [toast]
    extra: "FollowButton state=followed"

# ─────────────────────────────
# Interactions
# ─────────────────────────────
interactions:
  - trigger: tap
    target: "#btn-back"
    action: go-back
    destination: previous (app-015 sheet was dismissed, returning to feed/search)
    transition: "slide-right"

  - trigger: tap
    target: "#btn-more"
    action: open-overlay
    destination: "app-012 (타유저 더보기 메뉴 — 일반 메뉴, 차단 해제 후이므로 신규 차단 옵션 노출)"
    transition: "slide-up"

  - trigger: tap
    target: "#btn-follow"
    action: toggle-state
    state_key: "followed"
    note: "단일 화면 내 시각 토글 — 실 API 별도. detail persona 강제 룰 #4 — primary CTA 단일."

  - trigger: tap
    target: "#btn-message"
    action: navigate
    destination: "DMScreen (mock)"
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
    note: "Toast auto-dismiss (AC-2.5) — alert/confirm/prompt 절대 사용 금지"

# ─────────────────────────────
# Visual Rules
# ─────────────────────────────
rules:
  - condition: "state == default (entry)"
    effect: "Toast visible, 3s timer 시작"
    example: "AC-2.5 (toast 자동 dismiss)"
  - condition: "차단됨 indicator 가 DOM 에 없다"
    effect: "차단됨 안내 카드/locked overlay 미렌더 — 정상 그리드 노출"
    example: "AC-2.3 ('차단됨' 상태 indicator 제거)"
  - condition: "타유저 화면이므로 비공개 탭은 disabled (시각적으로 흐릿)"
    effect: "TabPrivate aria-disabled, 색 assistive"
    example: "본인만 비공개 가능 (전형 패턴 — Visual Rules 필터)"
  - condition: "Follow button tap"
    effect: "label '팔로우' ↔ '팔로잉' 토글 + fill brand ↔ secondary"
    example: "단일 화면 내 시각 토글"

# ─────────────────────────────
# Labels (ko)
# ─────────────────────────────
labels:
  header_title: "memer_kim"
  nickname: "memer_kim"
  bio: "밈은 진심이고 농담이고 인생이에요"
  count_row:
    - { value: "1.2만", label: "팔로워" }
    - { value: "248", label: "팔로잉" }
    - { value: "86", label: "게시물" }
  cta:
    follow_default: "팔로우"
    follow_active: "팔로잉"
    message: "메시지"
  tabs:
    - { id: "public", label: "공개" }
    - { id: "private", label: "비공개" }
    - { id: "liked", label: "좋아요" }
  toast:
    unblock: "memer_kim님 차단 해제했어요"
  bottom_nav:
    - { id: "home", label: "홈" }
    - { id: "search", label: "검색" }
    - { id: "my", label: "MY" }
  a11y:
    back: "뒤로가기"
    more: "더보기"
    follow: "팔로우"
    follow_active: "팔로잉"
    message: "메시지 보내기"
    avatar: "memer_kim 프로필 이미지"
    toast: "차단 해제 알림"

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
  btn_primary_fill:  "component-button-primary-fill → #8752FA"
  btn_primary_label: "component-button-primary-label → #FFFFFF"
  btn_radius:        "wds-radius-md → 12px"
  card_radius:       "wds-radius-xs → 4px (feed-grid 표준)"
  toast_radius:      "wds-radius-lg → 16px"
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
      - "Bio 한 줄 ('밈은 진심이고 농담이고 인생이에요') — PRD 명시 없음, 표준 detail hero 패턴 (Good Pattern 1) 충족용 관례 콘텐츠"
      - "Count tile 값 (1.2만 / 248 / 86) — Mock 표준 placeholder"
      - "팔로우 button toggle 동작 — PRD 는 '팔로우 button 활성' 만 명시, '팔로잉' 토글은 표준 패턴"
      - "Bottom nav active=search — 진입 경로가 feed/search 라는 가정"
    risk_level: "low"
    rationale: |
      모두 detail archetype 의 표준 hero 패턴 + verifier-friendly 동작 시연을 위한 관례 추가.
      비즈니스 로직 / 차단 해제 결과 자체에 대한 추론 없음.
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "business_context", "component_tree", "components", "layout_spec", "states", "interactions", "rules", "labels", "tokens", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "2 / 2 = 1.0"   # AC-2.3, AC-2.5 모두 컴포넌트/상태 연결
    what_resolved: "13 / 13 = 1.0"
```
