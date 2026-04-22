# Screen Spec: OtherUserProfileScreen

## Meta

```yaml
screen_name: "OtherUserProfileScreen"
task_id: "app-006"
sprint_id: "ugc-platform-001"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
depends_on: ["app-001 deeplink", "be-004 /v2/users/:userId/*"]
deeplink: "zzem://profile/:userId"
nav_call: "navigation.navigate('OtherUserProfile', { userId })"
```

## Component Tree

```
OtherUserProfileScreen [frame: 390x844]
├── StatusBar [system] (div) #status-bar
├── HeaderBar [container] (header) #header-bar — 48px, px-12, py-4, sticky-top
│   ├── BackButton [icon-button] (button) #btn-back — 32x32, p-4, rounded-8 (inferred: Figma slot is empty, but prototype needs nav)
│   ├── HeaderTitleGroup [container] (span) #header-title-group — 아이디 + emoji inline
│   │   ├── Nickname [text] (span) #header-nickname — "김잼잼"
│   │   └── NicknameEmoji [icon] (span) #header-nickname-emoji — emoji_neutral_fill 14px (😐)
│   └── MoreButton [icon-button] (button) #btn-more — 32x32, more_h_stroke (⋯)
├── Body [scroll-container] (main) #body
│   ├── ProfileSection [container] (section) #profile-section-default — pt-12 pb-24 px-16, gap-16
│   │   ├── Avatar [avatar] (div) #avatar — 100x100, rounded-999, border 1px rgba(136,136,136,0.2), bg #f5f3ff
│   │   └── CountRow [container] (ul) — 3열 균등 분할 (팔로워/팔로잉/재생성된)
│   │       ├── CountTile-Followers [list-item] (li) #count-followers
│   │       │   ├── CountValue [text] (span) — "8.6천" (16px SemiBold)
│   │       │   └── CountLabel [text] (span) — "팔로워" (12px Medium)
│   │       ├── CountTile-Following [list-item] (li) #count-following
│   │       │   ├── CountValue [text] (span) — "142"
│   │       │   └── CountLabel [text] (span) — "팔로잉"
│   │       └── CountTile-Regenerated [list-item] (li) #count-regenerated
│   │           ├── CountValue [text] (span) — "1.4천"
│   │           └── CountLabel [text] (span) — "재생성된"
│   │   (NO nickname/bio text — header already shows id)
│   │   (NO action buttons row — Phase 1 scope: 팔로우/편집/공유 금지)
│   ├── FeedGrid [grid] (section) #feed-grid — 2열, 1px gap (NO tab bar above)
│   │   ├── FeedGridItem [button] #feed-item-{N} — aspect 187/187 또는 187/234
│   │   │   ├── Thumbnail [image] (div) — gradient placeholder
│   │   │   ├── Overlay [decoration] (div) — 하단 dark gradient
│   │   │   └── RegenPill [badge] (span) — 재생성 count, bottom-left
│   │   └── ... (6개 기본)
│   ├── SkeletonGrid [skeleton] (section) #skeleton-grid — (loading 상태)
│   └── EmptyStateView [container] (section) #empty-state — (empty-no-posts 상태)
│       ├── EmptyIcon [icon] (div) — 🖼️
│       ├── EmptyTitle [text] (p) — "아직 업로드한 콘텐츠가 없어요"
│       └── EmptyDescription [text] (p) — "이 사용자가 콘텐츠를 공개하면 여기에 표시돼요"
├── BottomNav [nav] (nav) #bottom-nav — 64px, Home/Search/My (notification dot on My)
├── ErrorStateView [container] (section) #error-state — (error-not-found 상태, 전체 대체)
│   ├── StatusBar (내장)
│   ├── HeaderBar (back only, more placeholder)
│   ├── ErrorIcon [icon] (div) — 🔍
│   ├── ErrorTitle [text] (h2) — "사용자를 찾을 수 없어요"
│   ├── ErrorDescription [text] (p) — "존재하지 않거나 비공개된 프로필이에요"
│   └── BackCTA [button-secondary] (button) #error-back-cta — "돌아가기"
├── OverlayBackdrop [overlay] (div) #overlay-backdrop — more-action-sheet 용
├── MoreActionSheet [container] (div) #sheet-more — see MoreActionSheet.spec.md
│   ├── Handle [decoration] — 36x4 bg #a7a7a7
│   ├── MenuItem [button] #btn-copy-url — 🔗 "프로필 URL 복사"
│   └── CancelButton [button] #btn-cancel-sheet — border-top 1px #f1f1f1, "취소"
└── Toast [feedback] (div) #toast-url-copied — url-copied-toast 상태 시 visible
```

### Component Details

```yaml
components:
  - name: HeaderBar
    id: header-bar
    tag: header
    type: container
    position: sticky-top
    size: 390x48
    tokens:
      fill: "semantic.background.normal → #FFFFFF"
      spacing: "4 12"
    layout: { direction: horizontal, alignment: space-between, sizing: fill }
    a11y: { role: "navigation", label: "상단 내비게이션" }
    note: "Figma: h-48, px-12, py-4 (no border-bottom on this frame)"

  - name: BackButton
    id: btn-back
    tag: button
    type: icon-button
    size: 32x32
    tokens:
      padding: "4"
      radius: "8"
      text: "semantic.label.normal → #212228"
    behavior:
      purpose: "이전 화면으로 복귀"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "뒤로 가기" }
    states:
      default: "svg ← 아이콘, label.normal"
    note: "INFERRED: Figma frame renders an empty IconButton placeholder at this slot. Added actual back button for standalone prototype navigation."

  - name: HeaderTitleGroup
    id: header-title-group
    tag: span
    type: container
    tokens:
      gap: "4"
    layout: { direction: horizontal, alignment: center, sizing: hug }

  - name: HeaderNickname
    id: header-nickname
    tag: span
    type: text
    tokens:
      text: "semantic.label.normal → #212228"
      typography: "subtitle.subtitle3 semibold 16/1.4"
    value: "김잼잼"
    constraints: { max_lines: 1, truncation: ellipsis }

  - name: HeaderNicknameEmoji
    id: header-nickname-emoji
    tag: span
    type: icon
    size: 14x14
    content: "emoji_neutral_fill → 😐"
    a11y: { role: img, label: null }

  - name: MoreButton
    id: btn-more
    tag: button
    type: icon-button
    size: 32x32
    tokens:
      padding: "4"
      radius: "8"
      text: "semantic.label.normal → #212228"
    behavior:
      purpose: "프로필 관련 더보기 액션 오픈"
      user_action: "tap → ActionSheet 열기"
      feedback: visual
    a11y: { role: button, label: "더보기 메뉴 열기" }
    states:
      default: "more_h_stroke (수평 3점)"

  - name: Avatar
    id: avatar
    tag: div
    type: avatar
    size: 100x100
    tokens:
      fill: "#f5f3ff (Figma avatar bg)"
      border: "1px rgba(136,136,136,0.2)"
      radius: "full (999)"
    behavior:
      purpose: "유저 식별 시각화"
      user_action: null
      feedback: null
    a11y: { role: img, label: "프로필 이미지" }
    states:
      default: "원형 이미지 또는 이니셜 placeholder"
      loading: "원형 skeleton"

  - name: CountRow
    id: count-row
    tag: ul
    type: container
    size: 358x-auto
    tokens:
      padding: "0"
    layout: { direction: horizontal, alignment: stretch, sizing: fill }
    note: "3 tiles: 팔로워 / 팔로잉 / 재생성된 (SAME as MY profile — NOT 게시물/팔로워/팔로잉)"

  - name: CountTile
    id: count-followers | count-following | count-regenerated
    tag: li
    type: container
    tokens:
      gap: "2"
    layout: { direction: vertical, alignment: center, sizing: fill }
    children:
      - CountValue (span, 16px SemiBold, label.normal)
      - CountLabel (span, 12px Medium, label.alternative)
    a11y: { role: text, label: "카운트 타일" }

  - name: FeedGrid
    id: feed-grid
    tag: div
    type: grid
    size: 390x-auto
    tokens:
      gap: "1px"
      fill: "semantic.background.normal → #FFFFFF"
    layout: { direction: vertical, alignment: start, sizing: fill }
    constraints:
      columns: 2
      aspect_ratios: ["1:1", "4:5"]
      item_radius: "4px"

  - name: FeedGridItem
    id: "feed-item-{N}"
    tag: button
    type: container
    tokens:
      fill: "semantic.fill.neutral-secondary → #F0F1F3"
      radius: "xs (4)"
    behavior:
      purpose: "그리드 아이템 탭 → SwipeFeed(타유저) 진입"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "게시물 썸네일" }

  - name: EmptyStateView
    id: empty-state
    tag: section
    type: container
    size: 390x-auto
    tokens:
      spacing: "48 24"
    layout: { direction: vertical, alignment: center, sizing: fill }
    children:
      - EmptyIcon (64x64, label.assistive)
      - EmptyTitle (subtitle3, label.normal)
      - EmptyDescription (caption1, label.alternative)

  - name: ErrorStateView
    id: error-state
    tag: section
    type: container
    size: 390x844
    tokens:
      fill: "semantic.background.normal"
      spacing: "24"
    layout: { direction: vertical, alignment: center, sizing: fill }
    children:
      - ErrorIcon (64x64)
      - ErrorTitle (subtitle2, label.normal)
      - ErrorDescription (body4, label.alternative)
      - BackCTA (button-secondary)

  - name: Toast
    id: toast
    tag: div
    type: feedback
    position: overlay
    size: wrap-content
    tokens:
      fill: "semantic.fill.neutral-primary → #212228"
      text: "semantic.label.inverse → #FFFFFF"
      radius: "md (12)"
      spacing: "12 16"
    behavior:
      purpose: "URL 복사 성공 알림"
      user_action: null
      feedback: visual
    states:
      default: "hidden"
      url-copied-toast: "visible, 2s 후 fade-out"
    a11y: { role: status, label: "프로필 URL이 복사되었습니다" }
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 390x844
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: header-bar
      sticky: top
      height: fixed(48px)
      padding: "4 12"
    - id: body
      scroll: vertical
      flex: 1
      padding_bottom: "64px (for bottom-nav)"
      children:
        - id: profile-section-default
          type: flex-column
          alignment: center
          padding: "12 16 24"
          gap: "16px"
          note: "NO tab-bar after this. Grid renders directly."
        - id: feed-grid
          type: css-grid
          columns: 2
          gap: "1px"
          aspect_ratios: ["187/187", "187/234"]
        - id: skeleton-grid
          type: css-grid
          columns: 2
          gap: "1px"
        - id: empty-state
          type: flex-column
          alignment: center
          padding: "64 24 48"
          gap: "12px"
    - id: bottom-nav
      absolute: bottom
      height: fixed(64px)
      z-index: 15
    - id: error-state
      absolute: fill-parent
      z-index: 50
    - id: overlay-backdrop
      absolute: fill-parent
      z-index: 100
    - id: sheet-more
      absolute: bottom
      z-index: 101
    - id: toast-url-copied
      absolute: bottom
      offset: "88px from bottom (above bottom-nav)"
      z-index: 200
```

## States

```yaml
states:
  default:
    description: "공개 프로필 정상 렌더"
    active: true
    visible_components: [header-bar, profile-section-default, feed-grid, bottom-nav]
    hidden_components: [empty-state, skeleton-grid, error-state, overlay-backdrop, sheet-more, toast-url-copied]

  loading:
    description: "프로필/콘텐츠 로딩 중"
    visible_components: [header-bar(skeleton-title), profile-section-loading, skeleton-grid, bottom-nav]
    hidden_components: [profile-section-default, feed-grid, empty-state, error-state, toast-url-copied]
    labels:
      skeleton_note: "헤더 닉네임/아바타/카운트/그리드 모두 shimmer"

  empty-no-posts:
    description: "공개 콘텐츠 0개"
    visible_components: [header-bar, profile-section-default, empty-state, bottom-nav]
    hidden_components: [feed-grid, skeleton-grid, error-state, toast-url-copied]
    labels:
      title: "아직 업로드한 콘텐츠가 없어요"
      description: "이 사용자가 콘텐츠를 공개하면 여기에 표시돼요"

  error-not-found:
    description: "userId 404 — 존재하지 않음"
    visible_components: [error-state (내장 header-bar + body + CTA)]
    hidden_components: [profile-section-default, feed-grid, bottom-nav, toast-url-copied]
    labels:
      title: "사용자를 찾을 수 없어요"
      description: "존재하지 않거나 비공개된 프로필이에요"
      cta: "돌아가기"

  more-action-sheet:
    description: "더보기 ActionSheet 오픈"
    visible_components: [header-bar, profile-section-default, feed-grid, bottom-nav, overlay-backdrop, sheet-more]
    hidden_components: [empty-state, skeleton-grid, error-state, toast-url-copied]

  url-copied-toast:
    description: "URL 복사 후 토스트 노출 (2초)"
    visible_components: [header-bar, profile-section-default, feed-grid, bottom-nav, toast-url-copied]
    hidden_components: [overlay-backdrop, sheet-more, empty-state, skeleton-grid, error-state]
    labels:
      toast: "프로필 URL이 복사되었어요"
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#btn-back"
    action: go-back
    destination: null
    transition: slide-right

  - trigger: tap
    target: "#btn-more"
    action: open-overlay
    destination: "sheet-more"
    transition: slide-up

  - trigger: tap
    target: "#overlay-backdrop"
    action: close-overlay
    transition: slide-down

  - trigger: tap
    target: "button[id^='feed-item-']"
    action: navigate
    destination: "OtherUserSwipeFeed (app-008)"
    transition: slide-up
    note: "그리드 아이템 탭 → SwipeFeed 진입 (탭 바 없음)"

  - trigger: tap
    target: "#error-back-cta"
    action: go-back
    destination: null
    transition: slide-right

  - trigger: tap
    target: "#btn-copy-url"
    action: copy-to-clipboard-and-toast
    value: "zzem://profile/{userId}"
    destination: "toast-url-copied"
    transition: fade
    state_key: "url-copied-toast"
    auto_dismiss_ms: 2000

  - trigger: tap
    target: "#btn-cancel-sheet"
    action: close-overlay
    transition: slide-down
```

## Visual Rules

```yaml
rules:
  - condition: "타 유저 프로필"
    effect: "편집/공유/팔로우 버튼 노출하지 않는다 (Phase 1 scope)"
    example: "프로필 섹션은 아바타 + 카운트만"
  - condition: "타 유저 프로필"
    effect: "탭 바를 렌더하지 않는다 (Figma-accurate)"
    example: "카운트 row 아래 곧바로 feed-grid"
  - condition: "타 유저 프로필"
    effect: "닉네임/바이오 텍스트를 프로필 섹션에 노출하지 않는다"
    example: "헤더에 이미 id가 표시됨 — 중복 금지"
  - condition: "카운트 row 구성"
    effect: "3 타일을 팔로워 | 팔로잉 | 재생성된으로 렌더한다 (MY 프로필과 동일)"
    example: "게시물 count 노출 금지 (Figma는 재생성된 노출)"
  - condition: "⋯ 더보기 ActionSheet"
    effect: "프로필 URL 복사 메뉴만 노출. 차단/신고/팔로우 금지 (PRD 3)"
    example: "메뉴 1개 + 취소 버튼"
  - condition: "userId 404"
    effect: "에러 상태 컴포넌트로 전환 (프로필/그리드/하단탭 숨김)"
    example: "error-state 섹션 전체 폴백"
  - condition: "공개 콘텐츠 0개"
    effect: "empty-state 컴포넌트를 그리드 자리에 표시"
    example: "프로필 헤더/카운트는 유지, 그리드는 숨김"
  - condition: "URL 복사 직후"
    effect: "토스트 2초 노출 후 fade-out"
    example: "bottom-nav 위 24px — bottom: 88px"
```

## Labels (ko)

```yaml
labels:
  header:
    nickname_example: "김잼잼"
    nickname_emoji: "😐 (emoji_neutral_fill)"
    back: "뒤로 가기"
    more: "더보기"
  profile:
    counts:
      followers_label: "팔로워"
      following_label: "팔로잉"
      regenerated_label: "재생성된"
  empty_state:
    title: "아직 업로드한 콘텐츠가 없어요"
    description: "이 사용자가 콘텐츠를 공개하면 여기에 표시돼요"
  error_state:
    title: "사용자를 찾을 수 없어요"
    description: "존재하지 않거나 비공개된 프로필이에요"
    cta: "돌아가기"
  toast:
    url_copied: "프로필 URL이 복사되었어요"
  action_sheet:
    copy_url: "프로필 URL 복사"
    cancel: "취소"
```

## Token Map

```yaml
tokens:
  background: "semantic.background.normal → #FFFFFF"
  text_primary: "semantic.label.normal → #212228"
  text_secondary: "semantic.label.alternative → #6B6E76"
  text_hint: "semantic.label.assistive → #8E9199"
  text_inverse: "semantic.label.inverse → #FFFFFF"
  divider: "semantic.line.alternative → #F0F1F3"
  sheet_divider: "#F1F1F1 (between menu and cancel)"
  sheet_handle: "#a7a7a7"
  brand: "semantic.fill.brand-primary → #8752FA"
  fill_neutral: "semantic.fill.neutral-secondary → #F0F1F3"
  fill_neutral_primary: "semantic.fill.neutral-primary → #212228 (toast bg)"
  avatar_bg: "#f5f3ff"
  avatar_border: "1px rgba(136,136,136,0.2)"
  avatar_radius: "radius.full → 9999px"
  header_icon_btn: "size 32, padding 4, radius 8"
  grid_item_radius: "0 (flush grid)"
  grid_aspect_1_1: "187/187"
  grid_aspect_4_5: "187/234"
  grid_gradient_overlay: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)"
  sheet_radius: "radius.28 → 28px"
  toast_radius: "radius.md → 12px"
  font_family: "Pretendard, -apple-system, SF Pro Display, sans-serif"
  font_header_nickname: "subtitle3 semibold 16/1.4"
  font_count_value: "16px semibold / 1.4"
  font_count_label: "12px medium / 1.4"
  font_body: "body.body4 regular 14/1.4"
  font_caption: "caption.caption1 medium 13/1.5"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 18
    with_token_map: 18
    with_html_mapping: 18
    score: "36 / 36 = 1.00"
  fabrication_risk:
    inferred_fields:
      - "empty_state 텍스트 (PRD에 직접 문구 없음 — 관례적 카피)"
      - "error_state 텍스트 (PRD에 직접 문구 없음 — 관례적 카피)"
      - "toast 문구 '프로필 URL이 복사되었어요' (관례)"
    risk_level: "low"
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, component_tree, component_details, layout_spec, states, interactions, visual_rules, labels, token_map, quality_score]
    score: "10 / 7 (초과 충족)"
  context_coverage:
    why_linked: "7 / 7"
    what_resolved: "18 / 18"
```
