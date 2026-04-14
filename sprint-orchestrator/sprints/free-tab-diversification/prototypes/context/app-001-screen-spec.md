# Screen Spec: FreeTabScreen (app-001)

## Meta

```yaml
screen_name: "FreeTabScreen"
task_id: "app-001"
sprint_id: "free-tab-diversification"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "393x852"
theme: "light"
```

## Component Tree

```
FreeTabScreen [frame: 393x852]
├── StatusBar [system] (div) #status-bar
├── AppHeader [container] (header) #app-header
│   ├── Logo [text] (span) #logo — "ZZEM"
│   └── HeaderActions [container] (div) #header-actions — credit · bell
├── HomeTabsHeader [tabs] (nav) #home-tabs
│   ├── TabRecommended [tab] (button) #tab-recommended — "추천"
│   └── TabFree [tab] (button) #tab-free — "무료" + RedDot
│       └── RedDot [badge] (span) #red-dot — 활성 무료 기회 표시
├── Body [scroll-container] (main) #body
│   ├── FreeRosterBanner [banner] (section) #free-roster-banner
│   │   ├── BannerTitle [text] (h2) #banner-title
│   │   ├── BannerDesc [text] (p) #banner-desc
│   │   └── BannerCaption [text] (p) #banner-caption — 폴백 시만 표시
│   ├── FreeGrid [grid] (ul) #free-grid — 2열, 10카드
│   │   └── FreeCard [card] (li) × 10 — 템플릿 썸네일 + 이름
│   └── FreeEmptyView [empty] (div) #free-empty — "지금은 무료 필터가 없어요"
└── BottomNav [navigation] (nav) #bottom-nav — 3탭 (홈/탐색/MY)
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 393x852
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: app-header
      sticky: top
      height: fixed(48px)
    - id: home-tabs
      sticky: top
      height: fixed(44px)
    - id: body
      scroll: vertical
      flex: 1
    - id: bottom-nav
      sticky: bottom
      height: fixed(64px)
```

## States

```yaml
states:
  default:
    description: "오늘 무료 미사용, 10카드"
    banner: purple
    red_dot: visible
    grid: 10 cards
    empty: hidden

  used-today:
    description: "오늘 무료 사용 완료"
    banner: teal
    red_dot: hidden
    grid: 10 cards
    empty: hidden

  fallback:
    description: "어제 명단 폴백"
    banner: purple
    red_dot: visible
    grid: 10 cards
    empty: hidden
    caption: "어제 선정된 무료 필터예요 · 곧 갱신돼요"

  empty:
    description: "무료 필터 없음"
    banner: purple
    red_dot: hidden
    grid: hidden
    empty: visible
    labels:
      title: "지금은 무료 필터가 없어요"
      description: "곧 새로운 무료 필터로 찾아올게요"
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#tab-recommended"
    action: toggle-state
    state_key: "tab-recommended"

  - trigger: tap
    target: "#control-state-*"
    action: toggle-state
```

## Visual Rules

```yaml
rules:
  - condition: "freeUsedToday == false"
    effect: "배너 보라 그라데이션 + 탭 레드닷 표시"
  - condition: "freeUsedToday == true"
    effect: "배너 틸 그라데이션 + 레드닷 제거"
  - condition: "rosterDate == yesterday (fallback)"
    effect: "배너 하단에 small caption 추가"
  - condition: "filters.length == 0"
    effect: "FreeEmptyView만 표시, 그리드 숨김"
```

## Labels (ko)

```yaml
labels:
  tabs: ["추천", "무료"]
  banner:
    purple_title: "오늘만 1개 무료에요"
    purple_desc: "오늘 밤이 지나면 무료 필터가 초기화돼요"
    teal_title: "내일 또 만나요"
    teal_desc: "내일 새로운 필터로 찾아올게요"
    fallback_caption: "어제 선정된 무료 필터예요 · 곧 갱신돼요"
  empty:
    title: "지금은 무료 필터가 없어요"
    description: "곧 새로운 무료 필터로 찾아올게요"
  cards:
    - "아기 — 첫 걸음"
    - "반려동물 — 산책"
    - "스튜디오 — 라이트"
    - "아기 — 낮잠"
    - "반려동물 — 간식"
    - "스튜디오 — 그라데이션"
    - "아기 — 웃음"
    - "반려동물 — 점프"
    - "스튜디오 — 네온"
    - "아기 — 목욕"
```

## Token Map

```yaml
tokens:
  background: "#FFFFFF"
  text_primary: "#262626"
  text_secondary: "#656565"
  text_tertiary: "#8a8a8a"
  divider: "#f1f1f1"
  zzem_purple_500: "#8752fa"
  zzem_purple_400: "#a788fd"
  banner_purple_gradient: "linear-gradient(135deg, #8752fa 0%, #6b3fd9 100%)"
  banner_teal_gradient: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)"
  red_dot: "#ff3b30"
  card_radius: "4px"
  font: "Pretendard"
```

## Quality Score

```yaml
quality_score:
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map"]
  fabrication_risk:
    inferred_fields: ["card thumbnail labels (mock only)"]
    risk_level: "low"
```
