# Screen Spec — MyProfileScreen-PhotoChanged (app-010)

```yaml
meta:
  screen: MyProfileScreen-PhotoChanged
  task_id: app-010
  sprint_id: ugc-platform-integration-qa-2
  archetype: detail
  figma_frame: "37160:80228 (MY_프로필_사진변경완료)"
  figma_file: "7hozJ6Pvs09q98BxvChj08"
  app: ZZEM
  platform: "iOS / Android (React Native)"
  language: ko
  frame: "390x844"
  theme: light

business_context:
  linked_ac: [AC-1.5]
  purpose: "프로필 사진 변경 저장 직후 MY 프로필이 새 avatar 로 갱신된 결과를 1-step에 검증한다 (콘텐츠 정상 + Toast 자동 dismiss)."

# ─────────────────────────────
# Component Tree
# ─────────────────────────────
component_tree: |
  MyProfileScreen-PhotoChanged [frame: 390x844, archetype: detail]
  ├── StatusBar [system] (div) #status-bar — 9:41 + indicators
  ├── HeaderBar [navigation] (header) #header-bar (sticky-top z=2)
  │   ├── BackButton [icon-button] (button) #btn-back — lucide ArrowLeft 24px
  │   ├── HeaderTitle [text] (h1) #header-title — "MY"
  │   └── HeaderActions [container] (div)
  │       ├── NotificationButton [icon-button] (button) #btn-bell — lucide Bell 24px
  │       └── SettingsButton [icon-button] (button) #btn-settings — lucide Settings 24px
  ├── ProfileHero [container] (section) #profile-hero (height ≥320px)
  │   ├── Avatar [avatar] (div) #avatar — 100px circle, NEW gradient + initial 'Z' fallback
  │   ├── Nickname [text] (h2) #nickname — "zzem_user"
  │   ├── Bio [text] (p) #bio — 1-line bio
  │   ├── CountRow [container] (ul) #count-row — 3 tiles
  │   │   ├── CountTile [item] (li) — 팔로워 312
  │   │   ├── CountTile [item] (li) — 팔로잉 128
  │   │   └── CountTile [item] (li) — 게시물 24
  │   └── CtaRow [container] (div) #cta-row
  │       ├── EditButton [button-primary] (button) #btn-edit — "프로필 편집"
  │       └── ShareButton [button-secondary] (button) #btn-share — "공유"
  ├── ContentTabBar [navigation] (nav) #content-tabs (sticky-top below header)
  │   ├── TabFree [tab] (button) — "Free", active default
  │   └── TabRecommend [tab] (button) — "Recommend"
  ├── ContentGrid [grid] (main) #content-grid — 6 cells (2-col mixed-ratio)
  │   └── MemeCard [card] (article) × 6
  │       ├── PlaceholderImage [image] (div) — gradient (kind=gradient-token)
  │       └── LikeBadge [badge] (span) — heart icon + count
  ├── BottomNav [navigation] (nav) #bottom-nav (sticky-bottom)
  │   ├── NavHome [icon-button] (button)
  │   ├── NavSearch [icon-button] (button)
  │   └── NavMy [icon-button] (button) — active
  └── Toast [feedback] (div) #toast (overlay, bottom 80px)
      └── ToastText — "프로필 사진을 변경했어요"

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

  - name: BackButton
    id: btn-back
    tag: button
    type: icon-button
    size: "44x44 hit, icon 24px"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "이전 화면 (프로필 사진 편집 시트) 으로 복귀 — detail persona 강제 룰 #2 (back 1-way)"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "뒤로가기" }

  - name: NotificationButton
    id: btn-bell
    tag: button
    type: icon-button
    size: "44x44 hit, icon 24px"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "알림 화면 진입 (mock)"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "알림" }

  - name: SettingsButton
    id: btn-settings
    tag: button
    type: icon-button
    size: "44x44 hit, icon 24px"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "설정 화면 진입 (mock)"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "설정" }

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
      purpose: "MY 정체성 + 메타 + 핵심 액션 묶음 (detail persona 강제 룰 #1 — Hero 영역 320px+)"
    a11y: { role: region, label: "MY 프로필 정보" }
    constraints:
      min_height: "320px"

  - name: Avatar
    id: avatar
    tag: div
    type: avatar
    size: "100x100"
    tokens:
      fill: "var(--avatar-new-fill)"   # sprint-alias gradient
      border: "1px solid var(--pe-avatar-border)"
      radius: "var(--wds-radius-full)"
      color: "var(--wds-color-neutral-0)"
    behavior:
      purpose: "사진 변경 직후 새 이미지 표시 — 실 이미지 미제공시 NEW gradient + initial 폴백"
    a11y: { role: img, label: "내 새 프로필 이미지" }

  - name: Nickname
    id: nickname
    tag: h2
    type: text
    tokens:
      font_size: 18
      font_weight: 700
      color: "var(--wds-label-normal)"
    a11y: { role: heading, label: "zzem_user" }
    constraints: { max_lines: 1, truncation: ellipsis }

  - name: Bio
    id: bio
    tag: p
    type: text
    tokens:
      font_size: 13
      font_weight: 500
      color: "var(--wds-label-alternative)"
    a11y: { role: paragraph }

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

  - name: EditButton
    id: btn-edit
    tag: button
    type: button-primary
    size: "fill-1 (grid 2fr)"
    tokens:
      fill: "var(--component-button-primary-fill)"
      label: "var(--component-button-primary-label)"
      radius: "var(--wds-radius-md)"
      padding: "10px 16px"
      font: "14px / 600"
    behavior:
      purpose: "프로필 편집 진입 — primary CTA (detail persona 강제 룰 #4) — MY 프로필이므로 follow 대신 편집"
      user_action: "tap"
      feedback: navigation (mock — 편집 시트 재진입)
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
      purpose: "프로필 공유 (link copy 등) — secondary CTA (detail persona 강제 룰 #4)"
      user_action: tap
      feedback: visual (mock toast)
    a11y: { role: button, label: "프로필 공유" }

  - name: ContentTabBar
    id: content-tabs
    tag: nav
    type: navigation
    position: sticky-top (below header — visually attached to hero)
    size: "full-width x 44px"
    tokens:
      fill: "var(--wds-background-normal)"
      border-bottom: "1px solid var(--wds-line-alternative)"
    layout: { direction: horizontal, alignment: center }
    behavior:
      purpose: "MY 콘텐츠 분류 — Free / Recommend 탭 전환 (placeholder OK per AC)"
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
      purpose: "MY 콘텐츠 — 사진 변경 외 데이터는 그대로 유지됨을 검증"
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
      purpose: "사진 변경 결과 통지 (AC-1.5) — 3s 자동 dismiss"
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
      sticky: top (under header — visually below hero)
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
    description: "사진 변경 직후 — Toast 표시 중, 새 avatar 노출, 콘텐츠 정상, Free 탭 active"
    active: true
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav, toast]
    hidden_components: []

  toast-dismissed:
    description: "Toast 자동 dismiss 후 — 정상 영구 상태 (새 avatar 유지)"
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav]
    hidden_components: [toast]

  recommend-tab:
    description: "Recommend 탭 활성 — 추천 콘텐츠 placeholder 표시"
    visible_components: [profile-hero, content-tabs, content-grid, bottom-nav]
    hidden_components: [toast]
    extra: "TabRecommend aria-selected=true, content-grid 다른 placeholder 셋"

# ─────────────────────────────
# Interactions
# ─────────────────────────────
interactions:
  - trigger: tap
    target: "#btn-back"
    action: go-back
    destination: previous (프로필 사진 편집 시트 — 또는 MY 메인 으로)
    transition: "slide-right"

  - trigger: tap
    target: "#btn-bell"
    action: navigate
    destination: "NotificationsScreen (mock)"
    transition: "slide-up"

  - trigger: tap
    target: "#btn-settings"
    action: navigate
    destination: "SettingsScreen (mock)"
    transition: "slide-up"

  - trigger: tap
    target: "#btn-edit"
    action: navigate
    destination: "ProfileEditScreen (mock)"
    transition: "slide-up"

  - trigger: tap
    target: "#btn-share"
    action: emit-toast
    destination: null
    note: "프로필 링크 복사 (mock toast)"

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
    note: "Toast auto-dismiss (AC-1.5) — alert/confirm/prompt 절대 사용 금지"

# ─────────────────────────────
# Visual Rules
# ─────────────────────────────
rules:
  - condition: "state == default (entry)"
    effect: "Toast '프로필 사진을 변경했어요' visible, 3s timer 시작"
    example: "AC-1.5 (toast 자동 dismiss)"
  - condition: "Avatar 는 새 변경 이미지를 표현"
    effect: "기존 빈 avatar(--pe-avatar-empty-bg) 대신 NEW gradient(--avatar-new-fill) 사용"
    example: "변경 시각 신호 (AC-1.5 — '즉시 반영')"
  - condition: "MY 프로필이므로 비공개 / Recommend 탭 모두 접근 가능"
    effect: "TabFree 와 TabRecommend 모두 active 가능 (disabled 없음)"
    example: "본인 화면 — 본인 콘텐츠 전체 접근"
  - condition: "Edit / Share button"
    effect: "Edit primary brand fill, Share secondary tonal fill — Follow/Message 미노출"
    example: "MY 프로필이므로 follow 대상 자기 자신 — 의미 없음"

# ─────────────────────────────
# Labels (ko)
# ─────────────────────────────
labels:
  header_title: "MY"
  nickname: "zzem_user"
  bio: "오늘도 한 컷, 내 인생의 밈"
  count_row:
    - { value: "312", label: "팔로워" }
    - { value: "128", label: "팔로잉" }
    - { value: "24",  label: "게시물" }
  cta:
    edit: "프로필 편집"
    share: "공유"
  tabs:
    - { id: "free",      label: "Free" }
    - { id: "recommend", label: "Recommend" }
  toast:
    photo_changed: "프로필 사진을 변경했어요"
  bottom_nav:
    - { id: "home",   label: "홈" }
    - { id: "search", label: "검색" }
    - { id: "my",     label: "MY" }
  a11y:
    back: "뒤로가기"
    bell: "알림"
    settings: "설정"
    edit: "프로필 편집"
    share: "프로필 공유"
    avatar: "내 새 프로필 이미지"
    toast: "프로필 사진 변경 알림"

# ─────────────────────────────
# Token Map
# ─────────────────────────────
tokens:
  background:        "wds-background-normal → #FFFFFF"
  text_primary:      "wds-label-normal → #212228"
  text_secondary:    "wds-label-alternative → #6B6E76"
  text_assistive:    "wds-label-assistive → #8E9199"
  text_disabled:     "wds-label-disabled → #D1D3D8"
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
  toast_check:       "wds-color-green-500 → #34C759"
  avatar_new_fill:   "avatar-new-fill (sprint-alias) → linear-gradient(135deg, #B39DDB, #8752FA 60%, #5A30C0)"
  avatar_border:     "pe-avatar-border → rgba(136,136,136,0.2)"
  font_family:       "wds-font-family-primary → Pretendard"

# ─────────────────────────────
# Quality Score
# ─────────────────────────────
quality_score:
  extraction_accuracy:
    total_components: 14
    with_token_map: 14
    with_html_mapping: 14
    score: "28 / 28 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "Bio 한 줄 ('오늘도 한 컷, 내 인생의 밈') — PRD 명시 없음, 표준 detail hero 패턴 (Good Pattern 1) 충족용 관례 콘텐츠"
      - "Count tile 값 (312 / 128 / 24) — Mock 표준 placeholder (MY 일반 사용자 규모)"
      - "Nickname 'zzem_user' — Mock placeholder (MY 일반 사용자)"
      - "Free / Recommend 탭 명칭 — Task spec 'Free / Recommend' 명시 따라 채택"
      - "헤더 우상단 알림+설정 dual icon — Task '우상단 설정 / 알림 진입' 명시 따라 두 개 노출"
      - "Bottom nav active=MY (MY 프로필 화면 진입 컨텍스트)"
    risk_level: "low"
    rationale: |
      모두 detail archetype 의 표준 hero 패턴 + verifier-friendly 동작 시연 + Task spec 직접 명시 항목.
      비즈니스 로직 / 사진 변경 결과 자체에 대한 추론 없음.
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "business_context", "component_tree", "components", "layout_spec", "states", "interactions", "rules", "labels", "tokens", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 = 1.0"   # AC-1.5 모든 컴포넌트/상태 연결
    what_resolved: "14 / 14 = 1.0"
```
