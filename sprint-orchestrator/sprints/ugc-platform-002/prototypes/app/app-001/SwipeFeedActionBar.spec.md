# Screen Spec: SwipeFeedActionBar

> Component-level spec (not a full new screen). 세로 스와이프(SwipeFeed) 우측 고정 액션 바.
> 본 프로토타입은 SwipeFeed 화면 프레임 안에 액션 바가 overlay된 in-context 뷰를 제공한다.

## Meta

```yaml
screen_name: "SwipeFeedActionBar"
task_id: "app-001"
sprint_id: "ugc-platform-002"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "dark-over-image (image 위 overlay)"
scope: "component + in-context frame"
depends_on:
  - be-002 (regenerateCount 필드)
  - be-004 (likeCount / liked 필드)
  - app-002 (MoreSheet — 더보기 탭 시 오픈)
target_code:
  - app/apps/MemeApp/src/presentation/swipe-feed/components/swipe-feed-actions.tsx
  - app/apps/MemeApp/src/data/meme/meme.mapper.ts
```

## Component Tree

```
SwipeFeedScreen [frame: 390x844]            ← in-context 프레임 (본 태스크 scope는 action bar)
├── StatusBar [system] (div) #status-bar
├── SwipeCard [scroll-container] (main) #swipe-card
│   ├── BackgroundImage [image] (div) #bg-image — 카드 전체 배경 (placeholder)
│   ├── TopFade [decoration] (div) #top-fade — 상단 dark gradient
│   ├── BottomFade [decoration] (div) #bottom-fade — 하단 dark gradient
│   ├── CreatorRow [container] (div) #creator-row — 좌하단: 아바타 + 크리에이터명 + 필터 타이틀
│   │   ├── CreatorAvatar [avatar] (div) #creator-avatar — 28x28 rounded-full
│   │   ├── CreatorName [text] (span) #creator-name — "@김잼잼"
│   │   └── FilterTitle [text] (p) #filter-title — "오늘의 기분 필터"
│   ├── CTAButton [button-primary] (button) #cta-button — "이 필터로 만들기" (app-003 scope, 참고용)
│   └── SwipeFeedActionBar [container] (aside) #action-bar   ← 본 태스크 핵심
│       ├── LikeButton [icon-button] (button) #btn-like
│       │   ├── LikeIcon [icon] (span) #icon-like — heart-stroke (default) / heart-fill + #FE2B54 (liked)
│       │   └── LikeCountLabel [text] (span) #count-like — 실제 숫자 (예: "8600")
│       ├── RegenerateCountButton [icon-button] (button) #btn-regenerate
│       │   ├── RegenerateIcon [icon] (span) #icon-regenerate — refresh/rotate-arrow
│       │   └── RegenerateCountLabel [text] (span) #count-regenerate — korean-count (예: "8.6천")
│       ├── ShareButton [icon-button] (button) #btn-share
│       │   └── ShareIcon [icon] (span) #icon-share — upload/share icon (NO count label)
│       └── MoreButton [icon-button] (button) #btn-more
│           └── MoreIcon [icon] (span) #icon-more — horizontal-dots (···)
└── BottomNav [navigation] (nav) #bottom-nav — 3탭 (Home/Search/My), 참고용
```

### Component Details

```yaml
components:
  - name: SwipeFeedActionBar
    id: action-bar
    tag: aside
    type: container
    position: overlay (absolute, right-edge, bottom-stacked)
    size: 48x(fit-content)
    tokens:
      fill: "transparent"
      spacing: "gap: 16"
    layout:
      direction: vertical
      alignment: center
      sizing: hug
    behavior:
      purpose: "세로 스와이프 카드 위에서 좋아요/재생성/공유/더보기 액션을 한 손으로 수행"
      user_action: "tap (개별 버튼)"
      feedback: "visual (아이콘 상태 변화) + navigation (overlay open) + haptic (like tap)"
    constraints:
      min_height: null
      positioning: "right: 12px, bottom: 120px (bottom-nav + CTA 영역 위)"
    note: "기존 swipe-feed-actions.tsx VStack gap=16 구조 계승. 추가는 RegenerateCountButton 1개."

  - name: LikeButton
    id: btn-like
    tag: button
    type: icon-button
    size: 44x(auto)
    tokens:
      fill: "transparent"
      text: "primitive.neutral-0 → #FFFFFF"
      text_liked: "#FE2B54 (swipe-feed-actions.tsx 실측)"
      radius: "sm (8)"
      spacing: "padding: 8; gap: 4 (icon↔label)"
    behavior:
      purpose: "현재 카드를 좋아요 토글"
      user_action: "tap → onLikeToggle() + trackAction('like')"
      feedback: "visual (heart fill + color) + haptic"
    states:
      default: "heart-stroke (white)"
      liked: "heart-fill (#FE2B54)"
      disabled: null
      loading: null
      error: null
    layout:
      direction: vertical
      alignment: center
      sizing: hug
    a11y:
      role: button
      label: "좋아요"
      hint: "이 콘텐츠를 좋아요 하거나 취소해요"
    constraints:
      min_height: "44px (tappable area)"
      max_lines: 1
      truncation: none
      content_policy: "카운트는 실제 숫자 (AC 3.3). 0도 표시."

  - name: LikeCountLabel
    id: count-like
    tag: span
    type: text
    tokens:
      text: "semantic.label.inverse → #FFFFFF (opacity 0.9)"
      typography: "SemiBold 12/1.4"
    content_rule: "String(likeCount) — no abbreviation. 0 포함."
    example_values: ["0", "42", "8600", "12345"]
    a11y:
      role: text
      label: "좋아요 수"

  - name: RegenerateCountButton
    id: btn-regenerate
    tag: button
    type: icon-button
    size: 44x(auto)
    tokens:
      fill: "transparent"
      text: "primitive.neutral-0 → #FFFFFF"
      radius: "sm (8)"
      spacing: "padding: 8; gap: 4"
    behavior:
      purpose: "이 콘텐츠의 재생성 횟수 노출 (읽기 전용)"
      user_action: "tap (본 스프린트 scope 외 — 추후 재생성 상세로 네비게이션 가능)"
      feedback: "visual (press state), 본 태스크는 no-op"
    states:
      default: "regenerate-stroke (white) + 카운트 라벨"
      disabled: null
      loading: null
      error: null
    layout:
      direction: vertical
      alignment: center
      sizing: hug
    a11y:
      role: button
      label: "재생성 횟수"
      hint: "이 콘텐츠가 재생성된 횟수"
    constraints:
      min_height: "44px"
      max_lines: 1
      truncation: none
      content_policy: "formatKoreanCount(regenerateCount). 0도 표시 ('0')."

  - name: RegenerateCountLabel
    id: count-regenerate
    tag: span
    type: text
    tokens:
      text: "semantic.label.inverse → #FFFFFF (opacity 0.9)"
      typography: "SemiBold 12/1.4"
    content_rule: "formatKoreanCount(regenerateCount) — 축약 포맷."
    example_values: ["0", "42", "8.6천", "1.2만"]
    a11y:
      role: text
      label: "재생성 수"

  - name: ShareButton
    id: btn-share
    tag: button
    type: icon-button
    size: 44x44
    tokens:
      fill: "transparent"
      text: "primitive.neutral-0 → #FFFFFF"
      radius: "sm (8)"
      spacing: "padding: 8"
    behavior:
      purpose: "OS 공유 시트 오픈"
      user_action: "tap → shareLink() + trackAction('share')"
      feedback: "navigation (OS share sheet)"
    states:
      default: "upload-stroke (white). 카운트 라벨 없음."
      disabled: null
      loading: null
      error: null
    layout:
      direction: vertical
      alignment: center
      sizing: fixed
    a11y:
      role: button
      label: "공유"
      hint: "이 콘텐츠를 공유해요"
    constraints:
      min_height: "44px"
      content_policy: "카운트 미노출 (AC 1.7.share)."

  - name: MoreButton
    id: btn-more
    tag: button
    type: icon-button
    size: 44x44
    tokens:
      fill: "transparent"
      text: "primitive.neutral-0 → #FFFFFF"
      radius: "sm (8)"
      spacing: "padding: 8"
    behavior:
      purpose: "더보기 액션 시트 오픈 (app-002)"
      user_action: "tap → open-overlay(MoreSheet)"
      feedback: "navigation (bottom sheet slide-up)"
    states:
      default: "more-h-stroke (···, white)"
      disabled: null
      loading: null
      error: null
    layout:
      direction: vertical
      alignment: center
      sizing: fixed
    a11y:
      role: button
      label: "더보기"
      hint: "추가 액션을 열어요"
    constraints:
      min_height: "44px"

  # (CommentButton 명시적 미포함 — AC-1.7.no-comment per Spec-out)
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column (SwipeFeedScreen) + absolute-overlay (ActionBar)
  viewport: 390x844
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: swipe-card
      flex: 1
      scroll: vertical (snap, 1 card per viewport)
      stacking_context: relative
      children:
        - id: bg-image
          position: absolute
          inset: 0
        - id: top-fade
          position: absolute
          top: 0, left: 0, right: 0
          height: 120
        - id: bottom-fade
          position: absolute
          bottom: 0, left: 0, right: 0
          height: 240
        - id: creator-row
          position: absolute
          left: 16, bottom: 136
          layout: "flex-row gap-8 align-center"
        - id: cta-button
          position: absolute
          left: 16, right: 76, bottom: 88
          height: 48
        - id: action-bar
          position: absolute
          right: 12, bottom: 120
          layout: "flex-column gap-16 align-center"
          children:
            - id: btn-like        (icon+count vertical stack)
            - id: btn-regenerate  (icon+count vertical stack)
            - id: btn-share       (icon only)
            - id: btn-more        (icon only)
    - id: bottom-nav
      sticky: bottom
      height: fixed(64px)
```

### Action Bar Ordering (위 → 아래)
```
┌──┐
│❤│  LikeButton        (icon 28 + count label "8600")
│──│  gap-16
│⟳ │  RegenerateCount   (icon 28 + count label "8.6천")
│──│  gap-16
│↑ │  ShareButton       (icon only, no count)
│──│  gap-16
│···│  MoreButton         (icon only)
└──┘
```

## States

```yaml
states:
  default:
    description: "기본 상태 — liked=false, likeCount=8600, regenerateCount=8600, isGuest=false"
    active: true
    visible_components: [btn-like, btn-regenerate, btn-share, btn-more]
    labels:
      like_count: "8600"
      regenerate_count: "8.6천"

  liked:
    description: "좋아요 활성 — 하트 #FE2B54 + fill 아이콘"
    visible_components: [btn-like, btn-regenerate, btn-share, btn-more]
    component_overrides:
      btn-like:
        icon: "heart-fill"
        color: "#FE2B54"
    labels:
      like_count: "8601"
      regenerate_count: "8.6천"

  zero-counts:
    description: "likeCount=0, regenerateCount=0 — 둘 다 '0' 표시"
    visible_components: [btn-like, btn-regenerate, btn-share, btn-more]
    labels:
      like_count: "0"
      regenerate_count: "0"

  high-counts:
    description: "축약 포맷 검증 — likeCount=12345 그대로, regenerateCount=12345 → '1.2만'"
    visible_components: [btn-like, btn-regenerate, btn-share, btn-more]
    labels:
      like_count: "12345"
      regenerate_count: "1.2만"

  guest:
    description: "비로그인 — LikeButton 숨김 (기존 swipe-feed-actions.tsx 동작 유지)"
    visible_components: [btn-regenerate, btn-share, btn-more]
    hidden_components: [btn-like]

  # loading/error 는 액션 바 단독으로는 별도 상태 없음 (카드 레벨에서 관리)
  loading:
    description: "피드 카드 로딩 중 — 액션 바는 lazy render, 여기서는 hidden"
    visible_components: []
    hidden_components: [action-bar]
  error:
    description: "피드 카드 에러 — 액션 바 hidden"
    visible_components: []
    hidden_components: [action-bar]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#btn-like"
    action: toggle-state
    state_key: "liked"
    side_effects:
      - "trackAction('like') — click_vertical_feed_action_btn"
      - "onLikeToggle() — be-004 endpoint (app-005에서 재배선)"
    feedback: "visual + haptic"

  - trigger: tap
    target: "#btn-regenerate"
    action: none
    note: "본 스프린트 scope: no-op (읽기 전용 카운트). trackAction('regenerate') 트래킹만 wiring."
    side_effects:
      - "trackAction('regenerate')"

  - trigger: tap
    target: "#btn-share"
    action: open-os-share
    destination: "OS Share Sheet"
    transition: slide-up
    side_effects:
      - "trackAction('share')"
      - "shareLink({ contentId, filterName, filterUrl, ogImageUrl, contentType })"

  - trigger: tap
    target: "#btn-more"
    action: open-overlay
    destination: "MoreSheet (app-002)"
    transition: slide-up
    side_effects:
      - "trackAction('more') — 기존 event"
```

## Visual Rules

```yaml
rules:
  - condition: "item.liked === true"
    effect: "LikeButton 아이콘 → heart-fill, 색 → #FE2B54"
    example: "탭 후 빨간 채움 하트"
  - condition: "item.liked === false"
    effect: "LikeButton 아이콘 → heart-stroke, 색 → white"
    example: "기본 흰색 라인 하트"
  - condition: "item.likeCount, item.regenerateCount 렌더"
    effect: "likeCount=toString, regenerateCount=formatKoreanCount. 0 포함 항상 노출."
    example: "8600 → '8600' / '8.6천'"
  - condition: "공유 버튼"
    effect: "카운트 라벨 미노출"
    example: "아이콘만"
  - condition: "isGuest === true"
    effect: "LikeButton 렌더 생략"
    example: "비로그인 사용자에게는 하트 버튼 없음"
  - condition: "댓글 버튼"
    effect: "렌더 금지 (Spec-out)"
    example: "Phase 2 에도 댓글 UI 없음"
```

## Labels (ko)

```yaml
labels:
  buttons:
    like_a11y: "좋아요"
    regenerate_a11y: "재생성 횟수"
    share_a11y: "공유"
    more_a11y: "더보기"
  counts:
    like_default: "8600"       # AC 3.3 직접 숫자
    like_liked: "8601"
    like_zero: "0"
    like_high: "12345"
    regenerate_default: "8.6천"   # korean-count 축약
    regenerate_zero: "0"
    regenerate_high: "1.2만"
  context_frame:
    creator_name: "@김잼잼"
    filter_title: "오늘의 기분 필터"
    cta_text: "이 필터로 만들기"
    # (CTA 는 app-003 scope, in-context 프레임 구성용 플레이스홀더)
```

## Token Map

```yaml
tokens:
  # Action bar 는 이미지 위 overlay이므로 white 계열 주사용
  icon_default: "primitive.neutral-0 → #FFFFFF"
  count_label: "semantic.label.inverse → #FFFFFF (opacity 0.9)"
  like_active: "#FE2B54 (swipe-feed-actions.tsx 실측; 디자인 시스템 --wds-color-red-500 #FF3B30 와 별개로 기존 fill 컬러 유지)"
  bottom_fade: "semantic.background.dimmed → rgba(0,0,0,0.40) — linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)"
  button_press: "semantic.interaction.pressed → rgba(0,0,0,0.10)"
  radius_button: "wds-radius-sm → 8px"
  spacing_icon_label: "wds-spacing-4 → 4px"
  spacing_button_gap: "wds-spacing-16 → 16px"
  typography_count: "SemiBold 12px / line-height 1.4 (matches component-patterns.md §1 feed card 좋아요 카운트)"
  icon_size: "28x28 (swipe-feed-actions.tsx CONFIG.iconSize)"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 6            # ActionBar, Like, Regenerate, Share, More, + CountLabels(2) — primary 6
    with_library_match: 5          # Like/Share/More/ActionBar/CountLabel — §1 feed card pattern
    with_token_map: 6              # 모두 token map 연결
    score: "11/12 → 0.92"
  fabrication_risk:
    inferred_fields:
      - "액션 바 bottom offset 120px (기존 swipe-feed-actions.tsx 에 하드코딩된 위치 아닌 overlay 관례)"
      - "in-context 프레임의 CreatorRow / CTAButton placeholder (app-003 scope)"
      - "aria labels 한국어 문구"
    risk_level: "low"
    rationale: "모든 핵심 구조는 기존 swipe-feed-actions.tsx + task spec + component-patterns.md §1 에서 직접 추출. 인컨텍스트 프레임 요소는 표준 UI 관례."
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map"]
    score: "8/7 → 1.0 (전 필수 + visual_rules 추가)"
  context_coverage:
    why_linked: "6/6 (AC-1.7, 1.7.like-count, 1.7.regen-count, 1.7.share, 1.7.more, 1.7.no-comment 모두 컴포넌트에 매핑됨)"
    what_resolved: "7/7 (icon/count token/button radius/spacing/typography/fill/like-active)"
```
