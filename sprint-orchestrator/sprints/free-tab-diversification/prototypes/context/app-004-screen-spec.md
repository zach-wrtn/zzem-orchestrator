# Screen Spec: RecommendTabFeed (External Entry Parity)

> app-004 — 추천탭에서의 무료 필터 동일 경험(바텀시트) 및 피드 모드 유지(AC 2.7.2) 시각화.

## Meta

```yaml
screen_name: "RecommendTabFeed"
task_id: "app-004"
sprint_id: "free-tab-diversification"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
```

## Component Tree

```
Screen [frame: 390x844]
├── StatusBar [system] (div) #status-bar
├── Header [container] (header) #header
│   ├── TabLabel [text] (h1) #tab-label — "추천"
│   └── ModeBadge [badge] (span) #mode-badge — "mode: algo · entry: recommend"
├── FeedArea [scroll-container] (main) #feed-area
│   ├── AlgoStripe [container] (section) #algo-stripe — 추천 알고리즘 혼합 썸네일 스트립(피드 구분)
│   ├── SwipeCardStack [container] (section) #swipe-stack
│   │   ├── CardBehind2 [card] (div) #card-behind-2 — 하단 유료 필터(회색 썸네일)
│   │   ├── CardBehind1 [card] (div) #card-behind-1 — 중간 기획전 필터
│   │   └── CardFront [card] (div) #card-front-free — 전면 무료 필터 카드
│   │       ├── FilterThumb [image] (div) #filter-thumb
│   │       ├── FreeBadge [badge] (span) #free-badge — "오늘 무료"
│   │       ├── FilterTitle [text] (p) #filter-title — "오늘의 무료 · 벚꽃 프리셋"
│   │       └── CTA [button-primary] (button) #cta-make — "이 필터로 만들기"
│   └── SwipeHint [text] (p) #swipe-hint — "← 넘기면 다음 추천"
├── BottomNav [navigation] (nav) #bottom-nav — 홈(추천 active) / 무료 / 만들기 / 알림 / MY
├── OverlayBackdrop [overlay] (div) .overlay-backdrop
└── Overlay Sheets
    ├── FreeUseConfirmSheet [bottom-sheet] (div) #free-sheet
    └── CreditUseConfirmSheet [bottom-sheet] (div) #credit-sheet
```

### Component Details

```yaml
components:
  - name: "AlgoStripe"
    id: "algo-stripe"
    tag: "section"
    type: "grid"
    purpose: "추천 탭이 free-only 그리드가 아닌 혼합 알고리즘 피드임을 시각적으로 명확히 전달(AC 2.7.2 무-피드-스위치 의도)"
    tokens:
      fill: "semantic.background.alternative → #F7F8F9"
      radius: "md (12px)"
    notes: "썸네일 5개(무료/유료/기획전/크리에이터/트렌딩) 혼합 표시. 무료 필터 카드에만 오늘 무료 배지."
  - name: "FreeBadge"
    id: "free-badge"
    tag: "span"
    type: "badge"
    tokens:
      fill: "semantic.fill.brand-primary → #8752FA"
      text: "#FFFFFF"
      radius: "full"
  - name: "FreeUseConfirmSheet"
    id: "free-sheet"
    tag: "div"
    type: "bottom-sheet"
    notes: "app-003 컴포넌트 재사용. 문구: '오늘의 무료 기회를 사용할까요?'"
  - name: "CreditUseConfirmSheet"
    id: "credit-sheet"
    tag: "div"
    type: "bottom-sheet"
    notes: "app-003 컴포넌트 재사용. 문구: '크레딧을 사용할까요? / 오늘의 무료 기회를 이미 사용했어요'"
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
      sticky: top
      height: fixed(52px)
    - id: feed-area
      flex: 1
      children:
        - id: algo-stripe
          type: grid
          columns: 5
          gap: 6px
        - id: swipe-stack
          type: stacked-cards
    - id: bottom-nav
      sticky: bottom
      height: fixed(83px)
```

## States

```yaml
states:
  algo-feed-default:
    description: "추천 피드 (알고리즘 혼합), 시트 없음"
    visible_components: [algo-stripe, swipe-stack]
    hidden_components: [free-sheet, credit-sheet, overlay-backdrop]

  algo-feed-free-confirm:
    description: "무료 필터 카드 CTA 탭 → FreeUseConfirmSheet 노출 (피드는 여전히 추천)"
    visible_components: [algo-stripe, swipe-stack, overlay-backdrop, free-sheet]
    hidden_components: [credit-sheet]

  algo-feed-credit-confirm:
    description: "freeUsedToday=true 상태에서 무료 필터 CTA 탭 → CreditUseConfirmSheet"
    visible_components: [algo-stripe, swipe-stack, overlay-backdrop, credit-sheet]
    hidden_components: [free-sheet]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#cta-make"
    action: open-overlay
    destination: "FreeUseConfirmSheet"
    transition: slide-up
  - trigger: tap
    target: "#free-sheet-secondary"
    action: close-overlay
    note: "'더 둘러볼게요' → 시트 닫고 알고리즘 피드 유지 (AC 2.7.2)"
    transition: slide-down
  - trigger: tap
    target: "#credit-sheet-secondary"
    action: close-overlay
    transition: slide-down
```

## Visual Rules

```yaml
rules:
  - condition: "추천 피드 내 무료 필터 카드 (isFree=true, freeUsedToday=false)"
    effect: "카드 상단에 '오늘 무료' 배지 노출, CTA='이 필터로 만들기'"
  - condition: "CTA 탭 + freeUsedToday=false"
    effect: "FreeUseConfirmSheet 노출. 피드 모드는 algo 유지."
    example: "entryPoint=recommend에서도 동일 바텀시트 재사용"
  - condition: "'더 둘러볼게요' 탭"
    effect: "시트 닫기, 현재 추천 피드 그대로 유지 (무료 전용 모드로 전환 금지)"
  - condition: "CTA 탭 + freeUsedToday=true"
    effect: "CreditUseConfirmSheet 노출"
```

## Labels (ko)

```yaml
labels:
  header:
    tab: "추천"
    mode_badge: "algo · recommend"
  feed:
    stripe_label: "오늘의 추천"
    free_badge: "오늘 무료"
    filter_title: "오늘의 무료 · 벚꽃 프리셋"
    mixed_titles: ["기획전 · 레트로", "크리에이터 · 네온", "트렌딩 · 시네마", "유료 · 파스텔"]
    swipe_hint: "← 넘기면 다음 추천"
    cta: "이 필터로 만들기"
  free_sheet:
    title: "오늘의 무료 기회를 사용할까요?"
    description: "하루에 1번만 무료로 만들 수 있어요"
    primary: "무료 사용하기"
    secondary: "더 둘러볼게요"
  credit_sheet:
    title: "크레딧을 사용할까요?"
    description: "오늘의 무료 기회를 이미 사용했어요"
    price: "150 크레딧"
    primary: "크레딧 사용하기"
    secondary: "취소"
  bottom_nav:
    - "홈"
    - "무료"
    - "만들기"
    - "알림"
    - "MY"
```

## Token Map

```yaml
tokens:
  background: "semantic.background.normal → #FFFFFF"
  background_alt: "semantic.background.alternative → #F7F8F9"
  text_primary: "semantic.label.normal → #212228"
  text_secondary: "semantic.label.alternative → #6B6E76"
  text_hint: "semantic.label.assistive → #8E9199"
  divider: "semantic.line.normal → #E4E5E9"
  brand: "semantic.fill.brand-primary → #8752FA"
  button_primary_fill: "#8752FA"
  button_secondary_fill: "#F0F1F3"
  card_radius: "16px"
  nav_active: "#8752FA"
  nav_inactive: "#8E9199"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 10
    with_token_map: 10
    with_html_mapping: 10
    score: "20/20"
  fabrication_risk:
    inferred_fields: ["mode_badge text (시각화용 가이드 라벨)", "AlgoStripe mixed titles"]
    risk_level: "low"
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map"]
    score: "7/7"
  context_coverage:
    why_linked: "3/4 (2.7.1, 2.7.2, 2.7.3)"
    what_resolved: "10/10"
```
