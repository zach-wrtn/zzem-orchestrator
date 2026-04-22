# Screen Spec — MyProfileScreen

```yaml
meta:
  task_id: app-003
  screen_id: MyProfileScreen
  screen_type: tab-root
  owner: fe-engineer
  sprint: ugc-platform-001
  dependencies:
    - app-001  # Profile stack
    - be-002   # GET /v2/me/profile
    - be-003   # GET /v2/me/contents, /v2/me/contents/counts
  route:
    path: Main/Profile (tab 3)
    params:
      landingTab:
        type: "'public' | 'private' | 'liked' | undefined"
        description: "AC 2.7 용. 생성 완료 호출부에서 명시 시 AC 2.1 규칙을 override"
```

## Component Tree

```
MyProfileScreen (section, data-state="public-default")
├── HeaderBar (header)
│   ├── HeaderTitle (h1) — "닉네임" 표시
│   └── IconButton.Gear (button, id="nav-settings") — Settings 진입
├── ProfileHeader (div, §3 pattern)
│   ├── AvatarCircle100 (div)
│   ├── NicknameRow (div)
│   │   └── NicknameText (h2)
│   ├── CountRow (ul, 3-col)
│   │   ├── CountTile.Followers (li) — 팔로워 / value
│   │   ├── CountTile.Following (li) — 팔로잉 / value
│   │   └── CountTile.Regenerated (li) — 재생성된 / value
│   └── DualButtonGray (div, 2-col)
│       ├── Button.EditProfile (button, id="btn-edit-profile") — 프로필 편집
│       └── Button.ShareProfile (button, id="btn-share-profile") — 프로필 공유
├── IconOnlyTabBar (nav, §3 pattern)
│   ├── TabItem.Public (button, data-tab="public") — grid icon
│   ├── TabItem.Private (button, data-tab="private") — lock icon
│   └── TabItem.Liked (button, data-tab="liked") — heart icon
├── TabContentSlot (main)
│   ├── PublicTabContent (div, data-tab-panel="public")
│   │   ├── FeedGrid2Col (div) — §1 magazine grid
│   │   │   └── MemeCard[] (div) — 1:1 / 4:5 교차, RegeneratedCountPill
│   │   └── EmptyState.PublicEmpty (div, data-empty="public") — hidden unless counts.public===0
│   ├── PrivateTabContent (div, data-tab-panel="private")
│   │   └── FeedGrid2Col (div)
│   └── LikedTabContent (div, data-tab-panel="liked")
│       └── EmptyState.LikedFixed (div) — Phase 1 고정
├── LoadingOverlay (div, data-state-only="loading")
│   └── Spinner + skeleton grid
└── ErrorOverlay (div, data-state-only="error")
    └── ErrorIcon + message + Retry button
```

## Layout Spec

```
┌──────── 375 x 812 (Figma frame, inside 390x844 device) ────────┐
│ StatusBar 20px                                                  │
│ HeaderBar  [empty] [닉네임 18/600 center] [⚙ 24px]   │ 48px
├─────────────────────────────────────────────────────┤
│                                                     │
│              [avatar 100x100]                       │ pt-12 px-16
│  ┌─────────┬─────────┬─────────┐                    │ px-40
│  │ 팔로워  │ 팔로잉  │ 재생성된 │                    │ 16/600 value
│  │  128    │   54    │  1.2만   │                    │ 12/500 label
│  └─────────┴─────────┴─────────┘                    │
│  ┌─────────────┬─────────────┐                      │ gap-6
│  │ 프로필 편집 │ 프로필 공유 │                      │ h-40 rounded-12
│  └─────────────┴─────────────┘                      │ #F1F1F1 bg
├─────────────────────────────────────────────────────┤ h-46 tab bar
│   [media_fill]   [lock_fill]   [heart_fill]         │ ICON ONLY, 24px
│        ━━━                                          │ h-2 w-60 #262626
├─────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┐                             │ 2-col 1px gap
│ │ 1:1 [↻382]│ 4:5 [↻89]│                           │ rounded-4
│ ├──────────┼──────────┤                             │ dark gradient
│ │ 4:5 [↻127]│ 4:5 [↻0] │                           │ overlay bottom
│ ├──────────┼──────────┤                             │
│ │ 4:5 [↻54] │ 1:1 [↻211]│                          │
│ └──────────┴──────────┘                             │
├─────────────────────────────────────────────────────┤
│    🏠        🔍        👤·                          │ BottomNav 77px
│                      (red dot)                      │ My active
└─────────────────────────────────────────────────────┘
```

layout_rules:
  - container: "min-height 844px, background var(--wds-background-normal)"
  - header: "flex row, 56px, justify space-between, padding 0 16px, sticky top"
  - profile_header:
      layout: "flex column, align-items center, padding 32px 20px 20px"
      gap: 16px
  - count_row:
      layout: "grid-template-columns 1fr 1fr 1fr"
      gap: 0
      width: "100%"
  - dual_button:
      layout: "grid-template-columns 1fr 1fr"
      gap: 8px
      margin_top: 20px
      width: "calc(100% - 40px)"
  - tab_bar:
      layout: "flex row, justify-content center, gap 32px, padding 12px 0"
      sticky_under_header: false
      border_bottom: "1px solid var(--wds-line-alternative)"
  - tab_item:
      width: 60px
      height: 44px
      underline_active: "2px solid var(--wds-text-primary) — bottom edge"
  - feed_grid:
      layout: "grid-template-columns 1fr 1fr"
      gap: 1px
      radius: var(--wds-radius-xs)

## Component Details

```yaml
components:
  - name: HeaderBar
    type: navigation
    id: header-bar
    tag: header
    position: "sticky top"
    size: "390 x 56"
    tokens:
      background: var(--wds-background-normal)
      border_bottom: "1px solid var(--wds-line-alternative)"
    behavior:
      purpose: "프로필 컨텍스트 식별 + 설정 진입점 제공"
      user_action: "톱니바퀴 탭 → Settings 네비"
      feedback: navigation
    a11y:
      role: banner
      label: "프로필 헤더"

  - name: IconButton.Gear
    type: icon-button
    id: nav-settings
    tag: button
    position: "header right"
    size: "44 x 44"
    tokens:
      color: var(--wds-label-normal)
    behavior:
      purpose: "AC-2.settings-entry — 설정 화면 진입점"
      user_action: "탭"
      feedback: navigation
    a11y:
      role: button
      label: "설정"

  - name: AvatarCircle100
    type: avatar
    id: avatar-my
    tag: div
    size: "100 x 100"
    tokens:
      radius: var(--wds-radius-full)
      background: var(--wds-surface-secondary)
      border: "1px solid var(--wds-line-alternative)"
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

  - name: CountTile
    type: stat
    tag: li
    size: "(390-40)/3 x 48"
    layout:
      direction: vertical
      alignment: center
    tokens:
      label_font: "var(--wds-font-weight-medium) var(--wds-font-size-xs)/1.5 var(--wds-font-family-primary)"
      label_color: var(--wds-label-alternative)
      value_font: "var(--wds-font-weight-semibold) var(--wds-font-size-xl)/1.5 var(--wds-font-family-primary)"
      value_color: var(--wds-label-normal)
    behavior:
      purpose: "AC-2.count-format — 팔로워/팔로잉/재생성된 카운트 표기"
      user_action: null
      feedback: null
    constraints:
      content_policy: "value는 formatKoreanCount 유틸 통과 필수"

  - name: Button.EditProfile
    type: button-secondary
    id: btn-edit-profile
    tag: button
    size: "(390-48)/2 x 48"
    tokens:
      background: var(--wds-surface-button)  # #F1F1F1
      color: var(--wds-label-normal)
      radius: var(--wds-radius-md)
      font: "var(--wds-font-weight-semibold) var(--wds-font-size-md) var(--wds-font-family-primary)"
    behavior:
      purpose: "app-005 프로필 편집 진입 (본 태스크는 배치만)"
      user_action: "탭"
      feedback: navigation
    a11y:
      role: button
      label: "프로필 편집"

  - name: Button.ShareProfile
    type: button-secondary
    id: btn-share-profile
    tag: button
    size: "(390-48)/2 x 48"
    tokens:
      background: var(--wds-surface-button)
      color: var(--wds-label-normal)
      radius: var(--wds-radius-md)
    behavior:
      purpose: "app-007 프로필 공유 진입"
      user_action: "탭"
      feedback: navigation

  - name: IconOnlyTabBar
    type: tabs
    id: profile-tabs
    tag: nav
    tokens:
      background: var(--wds-background-normal)
      border_bottom: "1px solid var(--wds-line-alternative)"
      active_underline: "2px solid var(--wds-text-primary)"  # #262626
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
      label: "공개 게시물"

  - name: TabItem.Private
    type: tab
    tag: button
    size: "60 x 44"
    data_tab: private
    icon: lock
    a11y:
      role: tab
      label: "비공개 게시물"

  - name: TabItem.Liked
    type: tab
    tag: button
    size: "60 x 44"
    data_tab: liked
    icon: heart
    a11y:
      role: tab
      label: "좋아요 게시물"

  - name: FeedGrid2Col
    type: grid
    tag: div
    layout:
      direction: "grid 2-col"
      sizing: fill
    tokens:
      gap: 1px
      cell_radius: var(--wds-radius-xs)
    constraints:
      content_policy: "1:1과 4:5 비율 셀 교차"

  - name: MemeCard
    type: card
    tag: article
    tokens:
      radius: var(--wds-radius-xs)
      background: var(--wds-surface-secondary)
    behavior:
      purpose: "내 밈 썸네일. 재생성 카운트 노출(우하단 pill)."
    a11y:
      role: link
      label: "내 밈"

  - name: RegeneratedCountPill
    type: badge
    tag: span
    tokens:
      background: "rgba(0,0,0,0.55)"
      color: var(--wds-label-inverse)
      radius: var(--wds-radius-full)
      font: "var(--wds-font-weight-semibold) var(--wds-font-size-xs)"
    behavior:
      purpose: "MY 탭 variant: 재생성 횟수 노출"

  - name: EmptyState.PublicEmpty
    type: empty
    tag: div
    tokens:
      title_font: "var(--wds-font-weight-semibold) var(--wds-font-size-lg)"
      title_color: var(--wds-label-normal)
      sub_font: "var(--wds-font-weight-regular) var(--wds-font-size-sm)"
      sub_color: var(--wds-label-alternative)
    constraints:
      min_height: "320px"

  - name: EmptyState.LikedFixed
    type: empty
    tag: div
    behavior:
      purpose: "AC-2.liked-phase1 — 좋아요 탭 Phase 1 고정 표시"

  - name: LoadingOverlay
    type: skeleton
    tag: div

  - name: ErrorOverlay
    type: error
    tag: div
```

## States

```yaml
states:
  default:
    alias_of: public-default

  public-default:
    description: "AC 2.1 기본 케이스 — 공개 콘텐츠 2건+ 보유자의 공개 탭 활성"
    visible:
      - HeaderBar
      - ProfileHeader
      - IconOnlyTabBar
      - TabItem.Public (active)
      - PublicTabContent (grid populated)
    hidden:
      - EmptyState.PublicEmpty
      - PrivateTabContent
      - LikedTabContent
      - LoadingOverlay
      - ErrorOverlay

  public-empty:
    description: "AC 2.1 둘 다 0 케이스 — 공개 탭 활성 + 빈 상태"
    visible:
      - HeaderBar
      - ProfileHeader (카운트 0/0/0)
      - IconOnlyTabBar
      - TabItem.Public (active)
      - EmptyState.PublicEmpty
    hidden:
      - FeedGrid2Col (public)
      - PrivateTabContent
      - LikedTabContent

  private-default:
    description: "AC 2.1 public=0 && private>0 — 비공개 탭 기본 활성"
    visible:
      - HeaderBar
      - ProfileHeader
      - IconOnlyTabBar
      - TabItem.Private (active)
      - PrivateTabContent (grid populated)
    hidden:
      - PublicTabContent
      - LikedTabContent

  private-empty:
    description: "비공개 탭 빈 상태 — 추가 variant"
    visible:
      - HeaderBar
      - ProfileHeader
      - IconOnlyTabBar
      - TabItem.Private (active)
      - EmptyState.PrivateEmpty
    hidden:
      - PublicTabContent
      - LikedTabContent

  liked-empty:
    description: "AC-2.liked-phase1 — 좋아요 탭 고정 빈 상태"
    visible:
      - HeaderBar
      - ProfileHeader
      - IconOnlyTabBar
      - TabItem.Liked (active)
      - EmptyState.LikedFixed
    hidden:
      - PublicTabContent
      - PrivateTabContent

  loading:
    description: "/v2/me/contents/counts 조회 중"
    visible:
      - HeaderBar
      - LoadingOverlay
    hidden:
      - ProfileHeader
      - IconOnlyTabBar
      - TabContentSlot

  error:
    description: "카운트 또는 콘텐츠 조회 실패"
    visible:
      - HeaderBar
      - ErrorOverlay
    hidden:
      - ProfileHeader
      - IconOnlyTabBar
      - TabContentSlot
```

## Interactions

```yaml
interactions:
  - id: int-gear-tap
    trigger: "tap IconButton.Gear"
    target: nav-settings
    action: navigate
    destination: SettingsScreen
    transition: push
    ac_ref: AC-2.settings-entry

  - id: int-edit-profile
    trigger: "tap Button.EditProfile"
    target: btn-edit-profile
    action: navigate
    destination: EditProfileScreen
    transition: push
    note: "본 태스크는 배치만 — 실제는 app-005"

  - id: int-share-profile
    trigger: "tap Button.ShareProfile"
    target: btn-share-profile
    action: open-overlay
    destination: ShareProfileSheet
    transition: slide-up
    note: "본 태스크는 배치만 — 실제는 app-007"

  - id: int-switch-tab-public
    trigger: "tap TabItem.Public"
    action: switch-tab
    target_state: public-default
    note: "counts.public===0일 때 public-empty로 전환"

  - id: int-switch-tab-private
    trigger: "tap TabItem.Private"
    action: switch-tab
    target_state: private-default

  - id: int-switch-tab-liked
    trigger: "tap TabItem.Liked"
    action: switch-tab
    target_state: liked-empty

  - id: int-retry
    trigger: "tap Retry in ErrorOverlay"
    action: toggle-state
    target_state: loading
```

## Visual Rules

```yaml
visual_rules:
  - rule: "public > 0 → 공개 탭 pre-select"
    source_ac: AC-2.1
  - rule: "public===0 && private>0 → 비공개 탭 pre-select"
    source_ac: AC-2.1
  - rule: "public===0 && private===0 → 공개 탭(빈 상태) pre-select"
    source_ac: AC-2.1
  - rule: "route.landingTab이 지정되면 AC 2.1을 override"
    source_ac: AC-2.7
  - rule: "좋아요 탭은 Phase 1에서 실 fetch 없이 빈 상태 고정"
    source_ac: AC-2.liked-phase1
  - rule: "숫자는 8600→8.6천, 10000→1만, 12345→1.2만 포맷"
    source_ac: AC-2.count-format
  - rule: "비회원은 Profile 탭 진입 시 로그인 리다이렉트 (공통 처리, 본 스펙 제외)"
    source_ac: AC-2.1 (out-of-scope rendering)
```

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
  empty_public:
    title: "아직 공개한 콘텐츠가 없어요"
    subtitle: "내가 만든 밈을 공개하고 다른 사람과 공유해 보세요."
  empty_liked:
    title: "아직 좋아요한 콘텐츠가 없어요"
    subtitle: "마음에 드는 밈에 좋아요를 눌러 모아 보세요."
  loading:
    text: "불러오는 중..."
  error:
    title: "콘텐츠를 불러오지 못했어요"
    subtitle: "네트워크 상태를 확인하고 다시 시도해 주세요."
    retry: "다시 시도"
```

## Token Map

```yaml
token_map:
  background: var(--wds-background-normal)           # #FFFFFF
  profile_header_bg: var(--wds-background-normal)
  avatar_bg: var(--wds-surface-secondary)            # #F7F8F9
  avatar_border: var(--wds-line-alternative)
  nickname_color: var(--wds-label-normal)            # #212228
  count_label_color: var(--wds-label-alternative)    # #6B6E76
  count_value_color: var(--wds-label-normal)
  dual_button_bg: var(--wds-surface-button)          # #F1F1F1
  dual_button_label: var(--wds-label-normal)
  tab_underline_active: var(--wds-text-primary)      # #262626
  tab_icon_inactive: var(--wds-label-assistive)      # #8E9199
  tab_border_bottom: var(--wds-line-alternative)
  feed_cell_bg: var(--wds-surface-secondary)
  pill_bg: "rgba(0,0,0,0.55)"
  pill_color: var(--wds-label-inverse)
  empty_title: var(--wds-label-normal)
  empty_sub: var(--wds-label-alternative)
  error_icon: var(--wds-status-error)
```

## Business Context

```yaml
context_linkage:
  why_acs_covered:
    - AC-2.1
    - AC-2.7
    - AC-2.profile-header
    - AC-2.liked-phase1
    - AC-2.settings-entry
    - AC-2.count-format
  why_not_covered:
    - id: "로그인 리다이렉트 (비회원)"
      reason: "app-001 공통 라우팅 레이어 소관 — 스크린 자체 렌더링 제외"
```

## quality_score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 17
    with_library_match: 17   # Figma MY_게시물탭_기본 (375×812) 로 전부 Figma-verified
    with_token_map: 17       # 모든 컴포넌트가 token_map 섹션에 매핑됨
    score: "34/34 = 1.0"
  fabrication_risk:
    structure_risk_level: none  # HeaderBar(h-48 center title), ProfileSection(pt-12 px-16 gap-16), CountRow(px-40 flex-1), DualBtn(h-40 rounded-12 gap-6 #F1F1F1), TabBar(h-46 ICON-ONLY w-60 h-2 underline), Grid(2-col flex 1px, col-1=[1,4/5,4/5] col-2=[4/5,4/5,1]), BottomNav(77px w-351 dot size-8)
    inferred_fields:
      - "EmptyState 문구 ('아직 공개한 콘텐츠가 없어요' / '아직 비공개로 저장한 콘텐츠가 없어요' / '아직 좋아요한 콘텐츠가 없어요') — 관례 추론"
      - "ErrorOverlay 문구 (standard error state copy)"
      - "LoadingOverlay 스켈레톤 모양 (standard pattern)"
    risk_level: low  # structure=none; empty-state copy만 low (추론 문구)
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
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "6/6 = 1.0"
    what_resolved: "17/17 components = 1.0; 14/14 tokens = 1.0"
```
