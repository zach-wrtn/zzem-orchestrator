# Screen Spec: SwipeFeedScreenFreeMode

> Machine-readable 화면 명세. app-002 · SwipeFeed 무료 전용 모드 + Circular Scroll.

## Meta

```yaml
screen_name: "SwipeFeedScreenFreeMode"
task_id: "app-002"
sprint_id: "free-tab-diversification"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "393x852"
theme: "dark (full-bleed media)"
```

## Component Tree

```
Screen [frame: 393x852, vertical snap feed]
├── StatusBar [system] (div) #status-bar
├── FeedPager [vertical-snap-container] (main) #feed-pager
│   ├── FeedCard [card-full-bleed] (section) #card-1 — 첫 번째 카드(무료 CTA)
│   │   ├── CardImage [image] (div) #card-1-image — 밈 이미지 풀블리드
│   │   ├── TopGradient [overlay] (div) #card-1-top-gradient
│   │   ├── TopBar [container] (header) #card-1-top
│   │   │   ├── BackButton [icon-button] (button) #card-1-back — 뒤로 (그리드 복귀)
│   │   │   ├── ModeBadge [badge] (span) #card-1-mode-badge — "오늘의 무료"
│   │   │   └── MoreButton [icon-button] (button) #card-1-more — 더보기
│   │   ├── BottomGradient [overlay] (div) #card-1-bottom-gradient
│   │   ├── CardFooter [container] (footer) #card-1-footer
│   │   │   ├── CardTitle [text] (h2) #card-1-title — 필터 타이틀
│   │   │   ├── CardMeta [text] (p) #card-1-meta — 크리에이터 · 사용량
│   │   │   └── CTAButton [button-primary-pill] (button) #card-1-cta
│   │   │       ├── CTAIcon [icon] (span) #card-1-cta-icon — ticket or coin
│   │   │       └── CTALabel [text] (span) #card-1-cta-label — "무료" or "10"
│   │   └── PageIndicator [badge] (span) #card-1-indicator — "1 / 8"
│   ├── FeedCard [card-full-bleed] (section) #card-last — 마지막 카드 (circular hint)
│   │   ├── CardImage [image] (div) #card-last-image
│   │   ├── CircularHint [banner] (div) #card-last-circular-hint — "마지막 카드 · 다음 스와이프 → 처음으로"
│   │   ├── CardFooter [container] (footer) #card-last-footer
│   │   │   ├── CardTitle [text] (h2) #card-last-title
│   │   │   └── CTAButton [button-primary-pill] (button) #card-last-cta
│   │   └── PageIndicator [badge] (span) #card-last-indicator — "8 / 8"
│   └── SwipeAffordance [hint] (div) #swipe-affordance — 위아래 화살표 + "스와이프"
└── SwipeHint [overlay] (div) #first-time-hint — 첫 진입 가이드 (옵션)
```

### Component Details

```yaml
components:
  - name: "FeedPager"
    id: "feed-pager"
    tag: "main"
    type: "container"
    position: "top"
    size: "full-width x full-height"
    tokens:
      fill: "#000000"
    layout:
      direction: "vertical"
      alignment: "start"
      sizing: "fill"
    behavior:
      purpose: "수직 스냅 스크롤로 무료 필터 카드 탐색 (AC 2.3.1)"
      user_action: "swipe up/down"
      feedback: "navigation"
    a11y:
      role: "list"
      label: "무료 필터 피드"

  - name: "FeedCard"
    id: "card-{n}"
    tag: "section"
    type: "card"
    size: "393x852"
    tokens:
      fill: "#111111"
      radius: "0"
    layout:
      direction: "vertical"
      alignment: "space-between"
      sizing: "fill"
    a11y:
      role: "listitem"

  - name: "CardImage"
    id: "card-{n}-image"
    tag: "div"
    type: "image"
    size: "full-width x full-height"
    tokens:
      fill: "gradient(placeholder)"
    notes: "풀블리드 밈 이미지 placeholder"

  - name: "TopBar"
    id: "card-{n}-top"
    tag: "header"
    type: "container"
    position: "sticky-top"
    tokens:
      spacing: "12px 16px"
    layout:
      direction: "horizontal"
      alignment: "space-between"

  - name: "ModeBadge"
    id: "card-{n}-mode-badge"
    tag: "span"
    type: "badge"
    tokens:
      fill: "rgba(135, 82, 250, 0.9)"
      text: "#FFFFFF"
      radius: "full (999px)"
      spacing: "4px 10px"
    notes: "'오늘의 무료' 모드 인디케이터"

  - name: "CardFooter"
    id: "card-{n}-footer"
    tag: "footer"
    type: "container"
    position: "bottom"
    tokens:
      spacing: "20px 20px 32px"
    layout:
      direction: "vertical"
      alignment: "start"

  - name: "CardTitle"
    id: "card-{n}-title"
    tag: "h2"
    type: "text"
    tokens:
      text: "#FFFFFF"
    constraints:
      max_lines: 2
      truncation: "ellipsis"

  - name: "CTAButton"
    id: "card-{n}-cta"
    tag: "button"
    type: "button-primary-pill"
    size: "full-width x 56px"
    tokens:
      fill: "#FFFFFF (free) | #8752FA (paid)"
      text: "#212228 (free) | #FFFFFF (paid)"
      radius: "full"
      spacing: "16px 20px"
    behavior:
      purpose: "CTA 탭 → 확인/크레딧 바텀시트 오픈 (app-003)"
      user_action: "tap"
      feedback: "navigation"
    states:
      default: "free: 티켓+무료 / paid: 코인+가격"
    a11y:
      role: "button"
      label: "필터 사용"

  - name: "CircularHint"
    id: "card-last-circular-hint"
    tag: "div"
    type: "banner"
    position: "top"
    tokens:
      fill: "rgba(135, 82, 250, 0.92)"
      text: "#FFFFFF"
      radius: "12px"
      spacing: "10px 14px"
    notes: "마지막 카드 상단 안내 — 아래 스와이프 시 첫 카드로 순환 (AC 2.2.2)"

  - name: "PageIndicator"
    id: "card-{n}-indicator"
    tag: "span"
    type: "badge"
    tokens:
      fill: "rgba(0,0,0,0.5)"
      text: "#FFFFFF"
      radius: "full"
      spacing: "4px 10px"
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 393x852
  regions:
    - id: status-bar
      height: fixed(44px)
      overlay: true
    - id: feed-pager
      scroll: vertical-snap
      flex: 1
      children:
        - id: card
          type: flex-column
          height: fixed(852px)
          snap: mandatory
```

## States

```yaml
states:
  free-cta:
    description: "mode=free, freeUsedToday=false → 티켓+무료 CTA"
    active: true
    visible_components: [card-1, card-1-cta-free]
    hidden_components: [card-1-cta-paid, card-last, first-time-hint]
    labels:
      cta_icon: "🎟️"
      cta_text: "무료"

  paid-cta:
    description: "mode=free, freeUsedToday=true → 코인+가격 CTA (AC 2.6.2)"
    visible_components: [card-1, card-1-cta-paid]
    hidden_components: [card-1-cta-free, card-last, first-time-hint]
    labels:
      cta_icon: "🪙"
      cta_text: "10"

  last-card-circular:
    description: "마지막 카드 + circular 힌트 (AC 2.2.2)"
    visible_components: [card-last, card-last-circular-hint]
    hidden_components: [card-1]
    labels:
      hint: "마지막 카드예요 · 아래로 스와이프하면 처음으로"
      indicator: "8 / 8"
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#card-1-back"
    action: navigate-back
    destination: "FreeTabGrid"
    transition: slide-right

  - trigger: tap
    target: "#card-1-cta"
    action: open-overlay
    destination: "ConfirmBottomSheet (app-003)"
    transition: slide-up
    condition: "state == free-cta"

  - trigger: tap
    target: "#card-1-cta"
    action: open-overlay
    destination: "CreditInfoBottomSheet (app-003)"
    transition: slide-up
    condition: "state == paid-cta"

  - trigger: swipe-up
    target: "#feed-pager"
    action: snap-next
    notes: "마지막 카드에서는 circular → 첫 카드로 jumpToIndex"

  - trigger: swipe-down
    target: "#feed-pager"
    action: snap-prev
    notes: "첫 카드에서 위로 → 마지막 카드로 jumpToIndex"

  - trigger: tap
    target: ".control-panel__state-btn"
    action: toggle-state
```

## Visual Rules

```yaml
rules:
  - condition: "mode=='free' && freeUsedToday==false"
    effect: "CTA = 흰 배경 + 티켓 아이콘 + '무료'"
    example: "오늘 첫 진입 시 상단 카드 CTA"

  - condition: "mode=='free' && freeUsedToday==true"
    effect: "CTA = 브랜드 보라 배경 + 코인 아이콘 + 가격(예: 10)"
    example: "오늘 무료 1회 소진 후 재진입"

  - condition: "currentIndex == items.length - 1"
    effect: "상단에 'circular' 힌트 배너 노출, 하단 스와이프 어포던스 강조"
    example: "8번째(마지막) 카드 도달"

  - condition: "swipe boundary crossed"
    effect: "onMomentumScrollEnd → 반대편 인덱스로 jumpToIndex (끊김 없이)"
    example: "마지막에서 아래 → 0번째로 순간 이동"
```

## Labels (ko)

```yaml
labels:
  header:
    mode_badge: "오늘의 무료"
    back: "뒤로"
  body:
    card_title_1: "도파민 뿜뿜 에너지"
    card_title_2: "갬성 다크 무드"
    card_title_last: "주말 치트키"
    meta: "by @zzem_studio · 사용 1.2k"
    page_indicator: "1 / 8"
    circular_hint: "마지막 카드예요 · 아래로 스와이프하면 처음으로"
  buttons:
    cta_free: "무료"
    cta_paid: "10"
    cta_a11y_free: "티켓으로 무료 사용"
    cta_a11y_paid: "10 크레딧으로 사용"
  hints:
    swipe: "위아래로 스와이프"
```

## Token Map

```yaml
tokens:
  background_feed: "#000000"
  card_fill_placeholder: "linear-gradient(...)"
  text_on_media: "#FFFFFF"
  text_on_media_dim: "rgba(255,255,255,0.7)"
  brand_primary: "#8752FA"
  cta_free_fill: "#FFFFFF"
  cta_free_label: "#212228"
  cta_paid_fill: "#8752FA"
  cta_paid_label: "#FFFFFF"
  overlay_scrim_top: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent)"
  overlay_scrim_bottom: "linear-gradient(0deg, rgba(0,0,0,0.75), transparent)"
  badge_dark: "rgba(0,0,0,0.5)"
  radius_pill: "999px"
  radius_hint: "12px"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 14
    with_token_map: 14
    with_html_mapping: 14
    score: "28 / 28"
  fabrication_risk:
    inferred_fields: ["card titles (mock copy)", "meta creator name", "indicator count 8"]
    risk_level: "low"
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map", "rules", "quality_score"]
    score: "7 / 7"
  context_coverage:
    why_linked: "5 / 7"
    what_resolved: "14 / 14"
```
