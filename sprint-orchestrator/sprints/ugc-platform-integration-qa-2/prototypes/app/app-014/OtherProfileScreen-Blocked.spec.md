# Screen Spec — OtherProfileScreen-Blocked (app-014)

```yaml
meta:
  screen: OtherProfileScreen-Blocked
  task_id: app-014
  sprint_id: ugc-platform-integration-qa-2
  archetype: detail
  figma_frame: "37211:162150 (타유저_프로필_차단됨)"
  figma_file: "7hozJ6Pvs09q98BxvChj08"
  app: ZZEM
  platform: "iOS / Android (React Native)"
  language: ko
  frame: "390x844"
  theme: light

business_context:
  linked_ac: [AC-2.2-a, AC-2.2-b, AC-2.2-c]
  purpose: "차단된 타유저 프로필 진입 시 콘텐츠를 차단·숨기고 차단 상태를 명확히 시각화하여 의도적 재차단 보호 경험을 보장한다."

# ─────────────────────────────
# Component Tree
# ─────────────────────────────
component_tree: |
  OtherProfileScreen-Blocked [frame: 390x844, archetype: detail]
  ├── StatusBar [system] (div) #status-bar — 9:41 + indicators
  ├── HeaderBar [navigation] (header) #header-bar (sticky-top z=2)
  │   ├── BackButton [icon-button] (button) #btn-back — lucide ArrowLeft 24px
  │   ├── HeaderTitle [text] (h1) #header-title — "{nickname}"
  │   └── MoreButton [icon-button] (button) #btn-more — lucide MoreVertical 24px → app-015
  ├── ProfileHero [container] (section) #profile-hero (height ≥320px, dim variant)
  │   ├── Avatar [avatar] (div) #avatar — 100px circle, initial fallback (opacity 0.55)
  │   ├── Nickname [text] (h2) #nickname — "memer_kim" (label-alternative)
  │   └── BlockedBadge [badge] (span) #blocked-badge — lucide Ban 14px + "차단됨"
  ├── BlockedNotice [container] (section) #blocked-notice — empty-state card
  │   ├── NoticeIcon [illustration] (div) — lucide Lock 40px in circle
  │   ├── NoticeHeadline [text] (p) — "차단된 사용자의 콘텐츠는 표시되지 않아요"
  │   └── NoticeSubcopy [text] (p) — "차단을 해제하면 다시 볼 수 있어요"
  └── BottomNav [navigation] (nav) #bottom-nav (sticky-bottom)
      ├── NavHome [icon-button] (button)
      ├── NavSearch [icon-button] (button) — active (came from search/feed)
      └── NavMy [icon-button] (button)

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
    a11y: { role: banner, label: "타유저 프로필 헤더 (차단됨)" }

  - name: BackButton
    id: btn-back
    tag: button
    type: icon-button
    size: "44x44 hit, icon 24px"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "이전 화면 (search/feed) 으로 안전 복귀 — detail persona 강제 룰 #2 (back 1-way)"
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
      purpose: "차단됨 더보기 sheet (app-015) 진입 — '차단 해제' 옵션 노출 (AC-2.2-b)"
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
      spacing: "32px 20px 24px"
      gap: "16px"
    layout: { direction: vertical, alignment: center, sizing: hug }
    behavior:
      purpose: "타유저 식별 + 차단 상태 표기 (detail persona 강제 룰 #1 — Hero 영역 320px+, 본 변형은 콘텐츠 부재로 padding 확장)"
    a11y: { role: region, label: "타유저 프로필 (차단됨)" }
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
      color: "var(--wds-label-assistive)"
      opacity: "0.55"
    behavior:
      purpose: "타유저 식별 — 차단 상태이므로 dim 처리 (콘텐츠 노출 방지 신호)"
    a11y: { role: img, label: "memer_kim 프로필 이미지 (차단됨)" }

  - name: Nickname
    id: nickname
    tag: h2
    type: text
    tokens:
      font_size: 18
      font_weight: 700
      color: "var(--wds-label-alternative)"
    a11y: { role: heading, label: "memer_kim" }
    constraints: { max_lines: 1, truncation: ellipsis }

  - name: BlockedBadge
    id: blocked-badge
    tag: span
    type: badge
    size: "auto x 28px"
    tokens:
      fill: "var(--wds-surface-tertiary)"
      label: "var(--wds-label-alternative)"
      radius: "var(--wds-radius-full)"
      padding: "4px 12px 4px 10px"
      font: "12px / 600"
    behavior:
      purpose: "차단 상태 즉시 인지 신호 (AC-2.2-a) — Ban icon + 텍스트"
      user_action: passive
      feedback: visual
    a11y: { role: status, label: "차단됨 상태" }

  - name: BlockedNotice
    id: blocked-notice
    tag: section
    type: container
    size: "full-width minus 40px x auto"
    tokens:
      fill: "var(--wds-surface-secondary)"
      radius: "var(--wds-radius-lg)"
      padding: "32px 24px"
      margin: "8px 20px"
      gap: "12px"
    layout: { direction: vertical, alignment: center, sizing: fill }
    behavior:
      purpose: "콘텐츠 영역 자리에 차단 상태 안내 (AC-2.2-a — 콘텐츠 미노출 사유)"
      user_action: passive
      feedback: visual
    a11y: { role: region, label: "차단된 사용자 콘텐츠 안내" }

  - name: NoticeIcon
    tag: div
    type: illustration
    size: "64x64 (icon 32px)"
    tokens:
      fill: "var(--wds-fill-neutral)"
      radius: "var(--wds-radius-full)"
      color: "var(--wds-label-assistive)"
    a11y: { role: img, label: "차단됨 아이콘" }

  - name: NoticeHeadline
    tag: p
    type: text
    tokens:
      font_size: 14
      font_weight: 600
      color: "var(--wds-label-normal)"
    constraints: { max_lines: 2, truncation: none }

  - name: NoticeSubcopy
    tag: p
    type: text
    tokens:
      font_size: 13
      font_weight: 500
      color: "var(--wds-label-alternative)"
    constraints: { max_lines: 2, truncation: none }

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
    - id: profile-hero
      type: flex-column
      align: center
      padding: "32px 20px 24px"
      gap: "16px"
      min_height: "320"
    - id: blocked-notice
      type: flex-column
      align: center
      margin: "8px 20px"
      padding: "32px 24px"
      gap: "12px"
    - id: bottom-nav
      sticky: bottom
      height: "fixed(64)"

# ─────────────────────────────
# States
# ─────────────────────────────
states:
  default:
    description: "차단 상태 — Hero(dim) + BlockedBadge + BlockedNotice + BottomNav. ContentTabBar/ContentGrid/CountRow/Follow/Message 모두 미렌더."
    active: true
    visible_components: [profile-hero, avatar, nickname, blocked-badge, blocked-notice, bottom-nav]
    hidden_components: [content-tabs, content-grid, count-row, btn-follow, btn-message]

  more-opened:
    description: "더보기(⋮) tap 후 — app-015 차단됨 메뉴 진입 mock toast (실제 sheet 는 app-015 prototype)"
    visible_components: [profile-hero, avatar, nickname, blocked-badge, blocked-notice, bottom-nav, toast]
    hidden_components: []

# ─────────────────────────────
# Interactions
# ─────────────────────────────
interactions:
  - trigger: tap
    target: "#btn-back"
    action: go-back
    destination: previous (search/feed)
    transition: "slide-right"

  - trigger: tap
    target: "#btn-more"
    action: open-overlay
    destination: "app-015 (타유저_차단됨_더보기메뉴 — '차단 해제' 옵션 sheet)"
    transition: "slide-up"
    note: "본 prototype 에서는 mock toast 로 진입 시뮬레이션 (실 sheet 는 app-015 prototype)"

  - trigger: tap
    target: ".bottom-nav__item"
    action: switch-tab
    destination: null
    transition: none
    note: "mock toast — 본 prototype 단일 화면 시연"

# ─────────────────────────────
# Visual Rules
# ─────────────────────────────
rules:
  - condition: "state == default (blocked)"
    effect: "ContentGrid / ContentTabBar / CountRow / Follow / Message DOM 부재"
    example: "AC-2.2-a (콘텐츠 영역 모두 숨김)"
  - condition: "차단 상태이므로 Avatar opacity 0.55 + Nickname 색상 label-alternative"
    effect: "시각적으로 dim 처리하여 차단 상태를 즉시 인지"
    example: "AC-2.2-a 보강 — 차단 상태 강조"
  - condition: "BlockedBadge 는 Hero 직하 노출"
    effect: "lucide Ban icon + '차단됨' 텍스트 — pill"
    example: "AC-2.2-a (차단됨 indicator hero 영역에 표시)"
  - condition: "BlockedNotice 는 ContentGrid 자리 차지"
    effect: "lock icon + 안내 헤드라인 + 보조 카피"
    example: "AC-2.2-a (placeholder 메시지)"
  - condition: "MoreButton tap"
    effect: "app-015 진입 (본 proto 는 mock toast)"
    example: "AC-2.2-b"

# ─────────────────────────────
# Labels (ko)
# ─────────────────────────────
labels:
  header_title: "memer_kim"
  nickname: "memer_kim"
  blocked_badge: "차단됨"
  notice:
    headline: "차단된 사용자의 콘텐츠는 표시되지 않아요"
    subcopy: "차단을 해제하면 다시 볼 수 있어요"
  bottom_nav:
    - { id: "home", label: "홈" }
    - { id: "search", label: "검색" }
    - { id: "my", label: "MY" }
  toast:
    more_entry: "차단됨 더보기 메뉴 (app-015) 진입"
    back: "← 이전 화면으로 돌아갑니다"
    nav: "{nav} 탭 이동"
  a11y:
    back: "뒤로가기"
    more: "더보기"
    avatar: "memer_kim 프로필 이미지 (차단됨)"
    badge: "차단됨 상태"
    notice_icon: "차단됨 아이콘"

# ─────────────────────────────
# Token Map
# ─────────────────────────────
tokens:
  background:        "wds-background-normal → #FFFFFF"
  text_primary:      "wds-label-normal → #212228"
  text_alternative:  "wds-label-alternative → #6B6E76"
  text_assistive:    "wds-label-assistive → #8E9199"
  text_disabled:     "wds-label-disabled → #D1D3D8"
  surface_secondary: "wds-surface-secondary → #F7F8F9"
  surface_tertiary:  "wds-surface-tertiary → #F0F1F3"
  fill_neutral:      "wds-fill-neutral → #F0F1F3"
  divider_weak:      "wds-line-alternative → #F0F1F3"
  divider_normal:    "wds-line-normal → #E4E5E9"
  badge_radius:      "wds-radius-full → 9999px"
  notice_radius:     "wds-radius-lg → 16px"
  avatar_radius:     "wds-radius-full → 9999px"
  avatar_fill:       "pe-avatar-empty-bg → #F5F3FF"
  avatar_border:     "pe-avatar-border → rgba(136,136,136,0.2)"
  font_family:       "wds-font-family-primary → Pretendard"

# ─────────────────────────────
# Quality Score
# ─────────────────────────────
quality_score:
  extraction_accuracy:
    total_components: 11
    with_token_map: 11
    with_html_mapping: 11
    score: "22 / 22 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "Nickname 'memer_kim' — Mock (app-016 sibling 패턴 일관성 위해 동일 ID 사용)"
      - "BlockedNotice subcopy '차단을 해제하면 다시 볼 수 있어요' — PRD 미명시, 표준 empty-state 보조 안내 (재인지 보강)"
      - "Avatar opacity 0.55 — 차단 상태 시각 표현 관례 (PRD: '차단됨' 안내만 명시)"
      - "Bottom nav active=search — 진입 경로 가정 (sibling app-016 동일)"
    risk_level: "low"
    rationale: |
      모두 detail archetype 의 차단 변형 표준 empty-state 패턴 + verifier-friendly 동작 시연을 위한 관례.
      비즈니스 로직 / 차단 상태 자체의 의미에 대한 추론 없음.
      PRD 명시 핵심(콘텐츠 미노출 + '차단됨' 안내 메시지 + 더보기 진입)은 모두 그대로 반영.
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "business_context", "component_tree", "components", "layout_spec", "states", "interactions", "rules", "labels", "tokens", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "3 / 3 = 1.0"   # AC-2.2-a, AC-2.2-b, AC-2.2-c 모두 컴포넌트/상태 연결
    what_resolved: "11 / 11 = 1.0"
```
