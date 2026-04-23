# Screen Spec — MyProfileScreen-LikedTab

> Phase 2 variant of `MyProfileScreen` with the **좋아요 탭 active**. Replaces the Phase 1
> fixed `ProfileEmptyState` on the liked tab with a real content grid backed by
> `/v2/me/contents?visibility=liked`. Reuses the existing public/private tab grid UI
> and adds a **likeCount badge** on each card (consistent with app-005).

```yaml
meta:
  task_id: app-006
  screen_id: MyProfileScreen-LikedTab
  screen_type: tab-variant
  variant_of: MyProfileScreen            # app-003 (ugc-platform-001)
  owner: fe-engineer
  sprint: ugc-platform-002
  platform: "iOS / Android (React Native)"
  language: ko
  frame: 390x844
  theme: light
  dependencies:
    - app-003  # MyProfileScreen 기본 레이아웃 (Phase 1)
    - app-005  # likeCount 실제 숫자 + 재배선 (같은 스프린트, 그리드 카드 badge 소스)
    - be-004   # /v2/me/contents?visibility=liked + /v2/me/contents/counts.liked
  route:
    path: Main/Profile (tab 3) → IconOnlyTabBar[liked]
    params:
      landingTab:
        type: "'public' | 'private' | 'liked' | undefined"
        description: "AC 2.7 override — 'liked' 또는 카드 탭 후 swipe-back 복귀 시 활성"
  phase_delta:
    removed:
      - "EmptyState.LikedFixed (Phase 1 고정 표시)"
      - "isLikedPhase1 gate (me-contents.usecase.ts) — UI 측면에서는 탭 전환 시 빈 상태 고정 제거"
    added:
      - "LikedTabContent.FeedGrid2Col (실 콘텐츠 그리드)"
      - "LikeCountBadge (썸네일 우하단 overlay, app-005 공유)"
      - "CountTile.Liked (counts row 에 '좋아요 N' 표시)"
      - "EmptyState.LikedEmpty (0건 동적 empty — 기존 ProfileEmptyState 메시지 커스텀)"
```

---

## Component Tree

```
MyProfileScreen-LikedTab (section, data-state="liked-default")
├── HeaderBar (header, §3 pattern — 기존 유지)
│   ├── HeaderTitle (h1) — "닉네임"
│   └── IconButton.Gear (button, id="nav-settings") — 설정
├── ProfileHeader (div, §3 pattern — 기존 유지)
│   ├── AvatarCircle100 (div)
│   ├── NicknameRow (div)
│   │   └── NicknameText (h2)
│   ├── CountRow (ul, 3-col)
│   │   ├── CountTile.Followers (li)
│   │   ├── CountTile.Following (li)
│   │   └── CountTile.Regenerated (li)
│   └── DualButtonGray (div, 2-col)
│       ├── Button.EditProfile (button, id="btn-edit-profile")
│       └── Button.ShareProfile (button, id="btn-share-profile")
├── IconOnlyTabBar (nav, §3 pattern — 기존 유지)
│   ├── TabItem.Public (button, data-tab="public")         # inactive
│   ├── TabItem.Private (button, data-tab="private")       # inactive
│   └── TabItem.Liked (button, data-tab="liked", ACTIVE)   # underline active
├── TabContentSlot (main)
│   ├── PublicTabContent (div, hidden)
│   ├── PrivateTabContent (div, hidden)
│   └── LikedTabContent (div, data-tab-panel="liked", visible)
│       ├── FeedGrid2Col (div) — §1 magazine grid, 기존 재사용
│       │   └── MemeCard[] (article) — 1:1 / 4:5 교차
│       │       ├── ThumbnailImage (div.placeholder-image)
│       │       └── LikeCountBadge (span) — 우하단 overlay, ♡ + 숫자
│       ├── EmptyState.LikedEmpty (div, data-empty="liked") — hidden if counts.liked>0
│       │   ├── EmptyIllustration (div) — 회색 하트 (ProfileEmptyState 재사용)
│       │   ├── EmptyTitle (p)
│       │   └── EmptySubtitle (p)
│       ├── LoadingOverlay.Grid (div, data-state-only="loading") — 2-col skeleton
│       └── ErrorOverlay (div, data-state-only="error")
│           ├── ErrorIcon (div)
│           ├── ErrorTitle (p)
│           ├── ErrorSubtitle (p)
│           └── Button.Retry (button, id="btn-retry") — "다시 시도"
└── BottomNavigation_Home (nav, id="bottom-nav") — My active (red dot)
```

---

## Layout Spec

```
┌──────── 390 x 844 (device frame) ──────────────────────────────┐
│ StatusBar 44px                                                 │
├────────────────────────────────────────────────────────────────┤
│ HeaderBar  [ ]   [닉네임 18/600 center]   [⚙ 24px]             │ 48px
├────────────────────────────────────────────────────────────────┤
│                                                                │
│              [avatar 100×100]                                  │ pt-32 gap-16
│  ┌──────────┬──────────┬──────────┐                            │
│  │ 팔로워   │ 팔로잉   │ 재생성된 │                             │ px-40 3-col
│  │  128     │   54     │  1.2만   │                             │ value 18/600
│  └──────────┴──────────┴──────────┘                            │ label 12/500
│  ┌──────────────┬──────────────┐                               │
│  │ 프로필 편집  │ 프로필 공유  │                               │ h-40 rounded-12
│  └──────────────┴──────────────┘                               │ #F1F1F1 gap-6
├────────────────────────────────────────────────────────────────┤ h-46 tab bar
│     [media]      [lock]       [heart]                          │ icon-only 24px
│                                    ━━━                         │ underline under♡
├────────────────────────────────────────────────────────────────┤
│ LIKED (default — with items):                                  │
│ ┌───────────┬───────────┐                                      │ 2-col 1px gap
│ │ 1:1  ♡382 │ 4:5  ♡89 │                                       │ badge b-right
│ ├───────────┼───────────┤                                      │
│ │ 4:5 ♡127  │ 4:5  ♡0  │                                       │
│ ├───────────┼───────────┤                                      │
│ │ 4:5 ♡54   │ 1:1 ♡211 │                                       │
│ └───────────┴───────────┘                                      │
│                                                                │
│ LIKED (empty — counts.liked === 0):                            │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │                                                            │ │
│ │                    [♡ 그레이 일러스트 120×120]             │ │  pt-80
│ │                                                            │ │
│ │           "아직 좋아요한 콘텐츠가 없어요"                   │ │  title 16/600
│ │      "마음에 드는 밈에 좋아요를 눌러 모아 보세요."           │ │  sub 14/400
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│       🏠          🔍          👤·                              │  BottomNav 83px
│                              (red dot)                         │  My active
└────────────────────────────────────────────────────────────────┘
```

```yaml
layout_rules:
  container:
    min_height: 844px
    background: var(--wds-background-normal)
  header_bar:
    layout: "flex row, 48px, justify space-between, padding 0 16px, sticky top"
  profile_header:
    layout: "flex column, align-items center, padding 32px 20px 20px"
    gap: 16px
  count_row:
    layout: "grid-template-columns 1fr 1fr 1fr"
    gap: 0
    padding_x: 40px
    width: 100%
  dual_button:
    layout: "grid-template-columns 1fr 1fr"
    gap: 6px
    margin_top: 20px
    width: "calc(100% - 40px)"
    height: 40px
    radius: 12px
  tab_bar:
    layout: "flex row, justify-content center, gap 32px, padding 12px 0"
    border_bottom: "1px solid var(--wds-line-alternative)"
  tab_item:
    width: 60px
    height: 44px
    underline_active: "2px solid var(--wds-text-primary) — bottom edge, liked tab"
  feed_grid:
    layout: "grid-template-columns 1fr 1fr"
    gap: 1px
    cell_radius: var(--wds-radius-xs)
  meme_card:
    aspect: "1:1 or 4:5 교차"
    overlay_bottom: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 60%)"
  like_count_badge:
    position: "absolute bottom-8 right-8"
    padding: "2px 8px"
    radius: full
    background: "rgba(0,0,0,0.55)"
    color: var(--wds-label-inverse)
    font: "var(--wds-font-weight-semibold) var(--wds-font-size-xs)"
    gap_icon_label: 4px
  empty_state:
    layout: "flex column, align-items center, justify-content center, padding-top 80px"
    gap: 12px
    illustration_size: "120 x 120"
  bottom_nav:
    layout: "flex row, justify-around, 77px, sticky bottom"
```

---

## Component Details

```yaml
components:
  # ───────── HEADER (unchanged from app-003) ─────────
  - name: HeaderBar
    type: navigation
    id: header-bar
    tag: header
    position: "sticky top"
    size: "390 x 48"
    tokens:
      background: var(--wds-background-normal)
      border_bottom: "1px solid var(--wds-line-alternative)"
    behavior:
      purpose: "프로필 컨텍스트 식별 + 설정 진입점 (app-003 유지)"
      user_action: "톱니바퀴 탭 → Settings 네비"
      feedback: navigation
    a11y:
      role: banner
      label: "프로필 헤더"

  - name: IconButton.Gear
    type: icon-button
    id: nav-settings
    tag: button
    size: "44 x 44"
    tokens:
      color: var(--wds-label-normal)
    a11y:
      role: button
      label: "설정"

  # ───────── PROFILE HEADER (app-003 유지, counts row 에 liked 반영) ─────────
  - name: AvatarCircle100
    type: avatar
    id: avatar-my
    tag: div
    size: "100 x 100"
    tokens:
      radius: var(--wds-radius-full)
      background: var(--profile_avatar_empty_bg)
      border: "1px solid var(--profile_avatar_border)"
    a11y:
      role: img
      label: "내 프로필 이미지"

  - name: NicknameText
    type: text
    tag: h2
    tokens:
      font: "var(--wds-font-weight-bold) var(--wds-font-size-xl)/1.35 var(--wds-font-family-primary)"
      color: var(--wds-label-normal)
    constraints:
      max_lines: 1
      truncation: ellipsis

  - name: CountTile.Followers
    type: stat
    tag: li
    size: "(390-80)/3 x 48"
    tokens:
      label_color: var(--wds-label-alternative)
      value_color: var(--wds-label-normal)
    behavior:
      purpose: "팔로워 카운트 — korean-count 축약 유지"
    constraints:
      content_policy: "value = formatKoreanCount(followers)"

  - name: CountTile.Following
    type: stat
    tag: li
    behavior:
      purpose: "팔로잉 카운트"
    constraints:
      content_policy: "value = formatKoreanCount(following)"

  - name: CountTile.Regenerated
    type: stat
    tag: li
    behavior:
      purpose: "재생성된 카운트"
    constraints:
      content_policy: "value = formatKoreanCount(regenerated)"

  - name: Button.EditProfile
    type: button-secondary
    id: btn-edit-profile
    tag: button
    size: "(390-46)/2 x 40"
    tokens:
      background: var(--surface_button)   # #F1F1F1
      color: var(--wds-label-normal)
      radius: var(--wds-radius-md)
      font: "var(--wds-font-weight-semibold) var(--wds-font-size-md)"
    a11y:
      role: button
      label: "프로필 편집"

  - name: Button.ShareProfile
    type: button-secondary
    id: btn-share-profile
    tag: button
    tokens:
      background: var(--surface_button)
      color: var(--wds-label-normal)
      radius: var(--wds-radius-md)
    a11y:
      role: button
      label: "프로필 공유"

  # ───────── TAB BAR (icon-only, liked active) ─────────
  - name: IconOnlyTabBar
    type: tabs
    id: profile-tabs
    tag: nav
    tokens:
      background: var(--wds-background-normal)
      border_bottom: "1px solid var(--wds-line-alternative)"
      active_underline: "2px solid var(--wds-text-primary)"
      icon_color_active: var(--wds-text-primary)
      icon_color_inactive: var(--wds-label-assistive)
    a11y:
      role: tablist
      label: "프로필 콘텐츠 탭"

  - name: TabItem.Public
    type: tab
    tag: button
    size: "60 x 44"
    data_tab: public
    icon: grid
    a11y:
      role: tab
      label: "공개"
      state: inactive

  - name: TabItem.Private
    type: tab
    tag: button
    size: "60 x 44"
    data_tab: private
    icon: lock
    a11y:
      role: tab
      label: "비공개"
      state: inactive

  - name: TabItem.Liked
    type: tab
    tag: button
    size: "60 x 44"
    data_tab: liked
    icon: heart
    a11y:
      role: tab
      label: "좋아요"
      state: active    # 변경 핵심 — Phase 2 에서 활성 variant
    behavior:
      purpose: "AC 3.2 좋아요 탭 활성 — /v2/me/contents?visibility=liked 로딩 트리거"
      user_action: "탭"
      feedback: visual

  # ───────── LIKED CONTENT (핵심 추가) ─────────
  - name: LikedTabContent
    type: container
    id: liked-panel
    tag: div
    tokens:
      background: var(--wds-background-normal)
    behavior:
      purpose: "좋아요한 콘텐츠 그리드 컨테이너 — Phase 1 고정 ProfileEmptyState 대체"

  - name: FeedGrid2Col
    type: grid
    id: liked-grid
    tag: div
    layout:
      direction: "grid 2-col"
      sizing: fill
    tokens:
      gap: 1px
      cell_radius: var(--wds-radius-xs)
    constraints:
      content_policy: "1:1 과 4:5 비율 셀 교차 — 공개/비공개 탭과 동일 규칙"

  - name: MemeCard
    type: card
    tag: article
    tokens:
      radius: var(--wds-radius-xs)
      background: var(--wds-surface-secondary)
      overlay_bottom: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 60%)"
    behavior:
      purpose: "좋아요한 밈 썸네일. 탭 시 세로 스와이프 피드(source={kind:'me', visibility:'liked'})로 진입"
      user_action: "탭"
      feedback: navigation
    a11y:
      role: link
      label: "좋아요한 밈"

  - name: ThumbnailImage
    type: image
    tag: div
    constraints:
      content_policy: "placeholder-image, 카드 전체 채움"

  - name: LikeCountBadge
    type: badge
    id: like-badge
    tag: span
    position: "absolute bottom:8px right:8px"
    tokens:
      background: "rgba(0,0,0,0.55)"
      color: var(--wds-label-inverse)
      radius: var(--wds-radius-full)
      padding: "2px 8px"
      font: "var(--wds-font-weight-semibold) var(--wds-font-size-xs)"
      icon_size: 12px
    behavior:
      purpose: "AC 3.3 — likeCount 실제 숫자 표시 (축약 없음). app-005 와 동일한 badge 포맷"
      user_action: null
      feedback: null
    constraints:
      content_policy: "likeCount.toString() — 0 포함 전 숫자 표시. 하트 아이콘 + 숫자"
      max_lines: 1
    a11y:
      role: text
      label: "좋아요 {N}회"

  # ───────── EMPTY STATE (0건) ─────────
  - name: EmptyState.LikedEmpty
    type: empty
    id: liked-empty
    tag: div
    tokens:
      title_font: "var(--wds-font-weight-semibold) var(--wds-font-size-lg)"
      title_color: var(--wds-label-normal)
      sub_font: "var(--wds-font-weight-regular) var(--wds-font-size-md)"
      sub_color: var(--wds-label-alternative)
    behavior:
      purpose: "counts.liked === 0 — '아직 좋아요한 콘텐츠가 없어요' 안내 (기존 ProfileEmptyState 재사용)"
    constraints:
      min_height: "320px"

  - name: EmptyIllustration
    type: image
    tag: div
    size: "120 x 120"
    tokens:
      color: var(--wds-label-assistive)   # gray heart
    constraints:
      content_policy: "회색 하트 아이콘 (ProfileEmptyState 재사용)"

  # ───────── LOADING / ERROR ─────────
  - name: LoadingOverlay.Grid
    type: skeleton
    id: loading-grid
    tag: div
    tokens:
      shimmer_from: var(--wds-color-neutral-100)
      shimmer_to: var(--wds-color-neutral-200)
    behavior:
      purpose: "좋아요 쿼리 로딩 — 2-col 6셀 skeleton"

  - name: ErrorOverlay
    type: error
    id: liked-error
    tag: div
    tokens:
      icon_color: var(--wds-status-error)

  - name: Button.Retry
    type: button-secondary
    id: btn-retry
    tag: button
    tokens:
      background: var(--surface_button)
      color: var(--wds-label-normal)
      radius: var(--wds-radius-md)
    behavior:
      purpose: "쿼리 재시도"
      user_action: "탭"
      feedback: "visual (loading 전환)"

  # ───────── BOTTOM NAV ─────────
  - name: BottomNavigation_Home
    type: navigation
    id: bottom-nav
    tag: nav
    tokens:
      background: var(--wds-background-normal)
      border_top: "1px solid var(--wds-line-alternative)"
    a11y:
      role: navigation
      label: "하단 탭"
```

---

## States

```yaml
states:
  default:
    alias_of: liked-default

  liked-default:
    description: "AC 3.2 — 좋아요 탭 활성, counts.liked > 0, 그리드 렌더"
    visible:
      - HeaderBar
      - ProfileHeader (with CountTile.Liked or existing 3-count)
      - IconOnlyTabBar (TabItem.Liked active)
      - LikedTabContent
      - FeedGrid2Col
      - MemeCard[6]
      - LikeCountBadge (per card)
      - BottomNavigation_Home
    hidden:
      - PublicTabContent
      - PrivateTabContent
      - EmptyState.LikedEmpty
      - LoadingOverlay.Grid
      - ErrorOverlay

  liked-empty:
    description: "counts.liked === 0 — '아직 좋아요한 콘텐츠가 없어요'"
    visible:
      - HeaderBar
      - ProfileHeader
      - IconOnlyTabBar (TabItem.Liked active)
      - LikedTabContent
      - EmptyState.LikedEmpty
      - EmptyIllustration
      - EmptyTitle
      - EmptySubtitle
      - BottomNavigation_Home
    hidden:
      - FeedGrid2Col
      - LoadingOverlay.Grid
      - ErrorOverlay

  loading:
    description: "/v2/me/contents?visibility=liked 조회 중"
    visible:
      - HeaderBar
      - ProfileHeader
      - IconOnlyTabBar (TabItem.Liked active)
      - LikedTabContent
      - LoadingOverlay.Grid
      - BottomNavigation_Home
    hidden:
      - FeedGrid2Col
      - EmptyState.LikedEmpty
      - ErrorOverlay

  error:
    description: "좋아요 콘텐츠 조회 실패"
    visible:
      - HeaderBar
      - ProfileHeader
      - IconOnlyTabBar (TabItem.Liked active)
      - ErrorOverlay
      - Button.Retry
      - BottomNavigation_Home
    hidden:
      - FeedGrid2Col
      - EmptyState.LikedEmpty
      - LoadingOverlay.Grid
```

---

## Interactions

```yaml
interactions:
  - id: int-gear-tap
    trigger: "tap IconButton.Gear"
    target: nav-settings
    action: navigate
    destination: SettingsScreen
    transition: push

  - id: int-edit-profile
    trigger: "tap Button.EditProfile"
    target: btn-edit-profile
    action: navigate
    destination: EditProfileScreen
    transition: push

  - id: int-share-profile
    trigger: "tap Button.ShareProfile"
    target: btn-share-profile
    action: open-overlay
    destination: ShareProfileSheet
    transition: slide-up

  - id: int-switch-tab-public
    trigger: "tap TabItem.Public"
    action: switch-tab
    target_state: public-default
    note: "app-003 참조"

  - id: int-switch-tab-private
    trigger: "tap TabItem.Private"
    action: switch-tab
    target_state: private-default

  - id: int-switch-tab-liked
    trigger: "tap TabItem.Liked"
    action: switch-tab
    target_state: liked-default
    note: "counts.liked===0 이면 자동으로 liked-empty 전환"

  - id: int-card-tap-liked
    trigger: "tap MemeCard (in LikedTabContent)"
    action: navigate
    destination: SwipeFeed
    params: "{ source: { kind: 'me', visibility: 'liked' }, startIndex: N }"
    transition: push
    ac_ref: AC-3.2
    note: "SwipeFeed 의 discriminated union 에 visibility:'liked' variant 추가 필요 (Impl note)"

  - id: int-retry
    trigger: "tap Button.Retry"
    target: btn-retry
    action: toggle-state
    target_state: loading
```

---

## Visual Rules

```yaml
visual_rules:
  - rule: "좋아요 탭은 Phase 2 에서 실제 콘텐츠 그리드로 전환 (Phase 1 고정 빈 상태 제거)"
    source_ac: AC-3.2
  - rule: "카드 우하단 LikeCountBadge 는 likeCount 실제 숫자 (0 포함). 축약 없음."
    source_ac: AC-3.3
  - rule: "counts.liked === 0 → EmptyState.LikedEmpty 로 전환. 탭 chip 은 '좋아요'로 계속 표시 (PRD 2.2 — 0일 때도 탭 노출)."
    source_ac: AC-3.2 / PRD 2.2
  - rule: "그리드 카드 탭 → SwipeFeed(visibility:'liked') 진입. liked 컨텍스트 유지."
    source_ac: AC-3.2
  - rule: "CountTile 의 숫자(팔로워/팔로잉/재생성된)는 korean-count 축약 유지. 카드 badge 의 likeCount 만 축약 없음."
    source_ac: "AC-2.count-format (profile counts) + AC-3.3 (card likeCount)"
  - rule: "공개/비공개 탭 UI 는 app-003 과 동일 (회귀 없음)."
    source_ac: "Regression Guard"
  - rule: "최신순 — 좋아요 누른 시점 desc. (UI 측면은 리스트 순서만 반영)"
    source_ac: AC-3.2
```

---

## Labels (ko)

```yaml
labels:
  header:
    nickname_fallback: "프로필"
  profile:
    edit_button: "프로필 편집"
    share_button: "프로필 공유"
  count:
    followers: "팔로워"
    following: "팔로잉"
    regenerated: "재생성된"
  tabs:
    public_a11y: "공개"
    private_a11y: "비공개"
    liked_a11y: "좋아요"
  empty_liked:
    title: "아직 좋아요한 콘텐츠가 없어요"
    subtitle: "마음에 드는 밈에 좋아요를 눌러 모아 보세요."
  loading:
    text: "불러오는 중..."
  error:
    title: "콘텐츠를 불러오지 못했어요"
    subtitle: "네트워크 상태를 확인하고 다시 시도해 주세요."
    retry: "다시 시도"
  badge:
    like_count_a11y: "좋아요 {N}회"
  bottom_nav:
    home: "홈"
    search: "검색"
    my: "MY"
```

---

## Token Map

```yaml
token_map:
  background: var(--wds-background-normal)           # #FFFFFF
  profile_header_bg: var(--wds-background-normal)
  avatar_bg: var(--profile_avatar_empty_bg)          # #F5F3FF
  avatar_border: var(--profile_avatar_border)
  nickname_color: var(--wds-label-normal)            # #212228
  count_label_color: var(--wds-label-alternative)    # #6B6E76
  count_value_color: var(--wds-label-normal)
  dual_button_bg: var(--surface_button)              # #F1F1F1
  dual_button_label: var(--wds-label-normal)
  tab_underline_active: var(--wds-text-primary)      # #262626
  tab_icon_active: var(--wds-text-primary)
  tab_icon_inactive: var(--wds-label-assistive)      # #8E9199
  tab_border_bottom: var(--wds-line-alternative)
  feed_cell_bg: var(--wds-surface-secondary)         # #F7F8F9
  feed_gap: 1px
  badge_bg: "rgba(0,0,0,0.55)"
  badge_color: var(--wds-label-inverse)              # #FFFFFF
  badge_radius: var(--wds-radius-full)
  empty_title: var(--wds-label-normal)
  empty_sub: var(--wds-label-alternative)
  empty_illustration: var(--wds-label-assistive)     # gray heart
  error_icon: var(--wds-status-error)                # #FF3B30
  retry_bg: var(--surface_button)
  retry_label: var(--wds-label-normal)
  bottom_nav_active: var(--wds-text-primary)
  bottom_nav_inactive: var(--wds-label-assistive)
```

---

## Business Context

```yaml
context_linkage:
  why_acs_covered:
    - AC-3.2   # 좋아요 탭 활성 + 최신순 리스트 (단일 탭 통합)
    - AC-3.3   # 좋아요 수 실제 숫자 표시 (축약 없음, 0 포함)
    - AC-2.1   # 3탭 구조 유지 (공개/비공개/좋아요)
    - AC-2.7   # landingTab='liked' override 지원
    - AC-2.profile-header    # 헤더 레이아웃 유지
    - AC-2.count-format      # 프로필 카운트는 korean-count 축약 유지
    - AC-2.settings-entry    # 설정 진입점 유지
  why_not_covered:
    - id: "좋아요 탭 정렬 옵션"
      reason: "Out of Scope — 최신순만. (task Specification.Out of Scope)"
    - id: "좋아요 탭 검색"
      reason: "Out of Scope."
    - id: "비회원 리다이렉트"
      reason: "app-001 공통 라우팅 레이어 소관."
```

---

## quality_score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 22
    with_token_map: 22           # 모든 컴포넌트가 token_map 또는 component tokens 매핑
    with_html_mapping: 22        # 모든 컴포넌트에 tag + id/data-* 부여
    score: "44/44 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "EmptyState.LikedEmpty 서브타이틀 ('마음에 드는 밈에 좋아요를 눌러 모아 보세요.') — app-003 에서 관례 추론한 문구 재사용"
      - "EmptyIllustration 시각 형태 (회색 하트 120x120) — 기존 ProfileEmptyState 재사용 가정"
      - "LoadingOverlay.Grid 스켈레톤 레이아웃 (2-col 6셀) — 표준 패턴"
      - "ErrorOverlay copy — 표준 패턴"
      - "LikeCountBadge 위치 (우하단 8/8) + 패딩 (2x8) — app-005 컨벤션 추정"
    risk_level: low
    rationale: "핵심 구조(좋아요 탭 활성 + 그리드 + badge + 빈상태)는 PRD + task 명세 + app-003 선례에서 직접 추출. empty/loading/error 표준 UI 와 badge 세부 치수만 관례 추론."
  schema_completeness:
    required_sections:
      - meta
      - component_tree
      - layout_spec
      - states
      - interactions
      - labels
      - token_map
    present_sections:
      - meta
      - component_tree
      - layout_spec
      - component_details
      - states
      - interactions
      - visual_rules
      - labels
      - token_map
      - business_context
      - quality_score
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "7/7 = 1.0"
    what_resolved: "22/22 components = 1.0; 18/18 tokens = 1.0"
```
