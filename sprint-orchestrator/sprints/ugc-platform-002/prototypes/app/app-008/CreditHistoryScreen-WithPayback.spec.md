# Screen Spec: CreditHistoryScreen-WithPayback

> Screen variant — 기존 `credit-history.screen.tsx` 에 PAYBACK entry 가 혼합된 상태.
> 헤더/필터 chip bar/섹션 그룹 (date) 구조는 기존 유지. Row 변형만 추가.

## Meta

```yaml
screen_name: "CreditHistoryScreen-WithPayback"
task_id: "app-008"
sprint_id: "ugc-platform-002"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
parent_task: "app-008"
child_component_spec: "CreditHistoryRow-Payback.spec.md"
source_prd_ac: ["AC-4.2"]
```

## Business Context

```yaml
why:
  product_intent: >-
    크레딧 히스토리 화면에서 충전/차감/환불 + PAYBACK 이 혼재된 상태를 한 스크린에서 소비 가능하게 한다.
    필터 칩을 통해 '적립' (PAYBACK+recharged) 만 모아보는 부분 집합 뷰도 제공.
  linked_ac:
    - id: AC-4.2
      ui_impact: "기존 history list 에 PAYBACK row 가 분기 렌더되어야 함. 필터 chip '적립' 선택 시 PAYBACK 포함."
```

## Component Tree

```
CreditHistoryScreen [frame: 390x844]
├── StatusBar [system] (div) #status-bar — 44px (system-rendered, no content)
├── HeaderBar [container] (header) #header — 48px sticky-top
│   ├── BackButton [icon-button] (button) #btn-back — 24x24 ← arrow
│   ├── HeaderTitle [text] (h1) #header-title — "크레딧 내역" (Subtitle2 16px Semibold)
│   └── HeaderRightSpacer [container] (div) — 24x24 placeholder (balance)
├── Body [scroll-container] (main) #body
│   ├── MyCreditInfo [container] (section) #my-credit-info — 현재 보유 크레딧 카드
│   │   ├── BalanceLabel [text] (p) — "보유 크레딧"
│   │   ├── BalanceAmount [text] (p) — "{N}" (숫자)
│   │   └── ExpirationHint [text] (p) — "{N} 크레딧이 소멸 예정이에요" (optional)
│   ├── SectionDivider [divider] (div) — 8px thickness surface_secondary
│   ├── ChipBar [container] (section) #chip-bar — sticky-under-header
│   │   ├── Chip-All [chip] (button) #chip-all — "전체"
│   │   ├── Chip-Earn [chip] (button) #chip-earn — "적립" (PAYBACK + 충전 포함)
│   │   ├── Chip-Use [chip] (button) #chip-use — "사용"
│   │   └── Chip-Refund [chip] (button) #chip-refund — "환불/소멸"
│   └── HistoryList [list] (ul) #history-list
│       ├── DateSection [container] (li) #date-section-today — "오늘"
│       │   ├── DateHeader [text] (p) — "오늘 2026.04.22"
│       │   ├── Row-Recharge [row] #row-recharge — 코인 아이콘 + "10 크레딧 충전" + +10
│       │   ├── Row-Payback [row] #row-payback (variant — ref CreditHistoryRow-Payback.spec.md) — 썸네일 + "크레딧 페이백" + +1
│       │   └── Row-Used [row] #row-used — 코인 아이콘 + "밈 생성" + -1
│       └── DateSection-Yesterday [container] (li) #date-section-yesterday — "2026.04.21"
│           ├── Row-Payback-2 [row] — 썸네일 + "크레딧 페이백" + +2
│           └── Row-Refunded [row] — 코인 아이콘 + "환불" + +1
└── BottomSafeArea [container] (div) — 34px
```

### Component Details (스크린 레벨 — 기존 컴포넌트는 요약, PAYBACK 관련만 상세)

```yaml
components:
  - name: HeaderBar
    id: header
    tag: header
    type: container
    position: sticky-top
    size: "390x48"
    tokens:
      fill: "background_primary → #FFFFFF"
      border_bottom: "outline_primary → #F1F1F1 (1px)"
      padding: "0 16"
    layout: { direction: horizontal, alignment: center, sizing: fill }

  - name: ChipBar
    id: chip-bar
    tag: section
    type: list
    position: sticky-under-header
    size: "full-width x 54"
    tokens:
      fill: "background_primary → #FFFFFF"
      padding: "12 16"
      gap_horizontal: "4"
    layout: { direction: horizontal, alignment: start, sizing: fill }
    behavior:
      purpose: "적립/사용/환불 등 히스토리 필터"
      user_action: "tap → selectedChipKey 변경 → list 필터링"
      feedback: visual
    a11y: { role: tab, label: "필터 칩 바" }

  - name: Chip-Earn
    id: chip-earn
    tag: button
    type: chip
    tokens:
      fill_selected: "surface_primary_invert → #262626"
      fill_unselected: "surface_elevated → #FFFFFF"
      border_selected: "surface_primary_invert → #262626"
      border_unselected: "outline_secondary → #E4E5E9"
      text_selected: "text_primary_invert → #FFFFFF"
      text_unselected: "text_primary → #262626"
      radius: "full (9999)"
      padding: "0 10"
      height: "30"
      font: "Typo.Body6 / 12px / Medium"
    notes: "AC-4.2 — '적립' 칩 선택 시 transactionType in ['recharged','refunded','PAYBACK'] 엔트리만 렌더. 기본값: 'PAYBACK' 포함."
    behavior:
      purpose: "PAYBACK + 충전 같은 '증가' 성격 엔트리만 모아보기"
      user_action: "tap → 필터 적용"
      feedback: visual

  - name: HistoryList
    id: history-list
    tag: ul
    type: list
    position: flow
    size: "full-width x auto"
    tokens:
      gap_vertical: "0 (row padding 으로 간격 확보)"
    layout: { direction: vertical, alignment: start, sizing: fill }

  - name: DateSection
    tag: li
    type: container
    tokens:
      padding_header: "20 16 8"
      text_header: "text_secondary → #656565"
      font_header: "Typo.Body6 / 12px / Medium"
    layout: { direction: vertical, alignment: start, sizing: fill }

  - name: Row-Payback
    id: row-payback
    tag: div
    type: list-item
    variant: "PAYBACK"
    spec_ref: "CreditHistoryRow-Payback.spec.md"
    notes: "이 row 는 별도 spec 참조. 전체 리스트에서는 switch-case 분기 렌더."

  - name: Row-Recharge
    id: row-recharge
    tag: div
    type: list-item
    variant: "recharged"
    notes: "기존 row 유지 — 좌측 코인 아이콘 (40x40, radius 12, bg zzem_violet_100, 내부 coin.png 26x26), amount '+10' (zzem_violet_600)"

  - name: Row-Used
    id: row-used
    tag: div
    type: list-item
    variant: "used"
    notes: "기존 row 유지 — 좌측 코인 아이콘 (EXPIRED/RECHARGED 외 => FixedImage 내 thumbnail or null), amount '-1' (text_primary)"

  - name: Row-Refunded
    id: row-refunded
    tag: div
    type: list-item
    variant: "refunded"
    notes: "기존 row 유지 — 환불 시 silver-coin.webp + surface_tertiary bg, amount '+1' (zzem_violet_600 — isIncreasedAmount)"
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
      height: fixed(48px)
    - id: body
      scroll: vertical
      flex: 1
      children:
        - id: my-credit-info
          type: container
          padding: "16"
        - id: section-divider-8
          height: fixed(8px)
        - id: chip-bar
          sticky: under-header
          height: fixed(54px)
        - id: history-list
          type: flex-column
          gap: "0"
    - id: bottom-safe-area
      height: fixed(34px)
```

## States

```yaml
states:
  default:
    description: "혼합 리스트 (충전/차감/페이백 등)"
    active: true
    visible_components: [header, my-credit-info, chip-bar, history-list]
    hidden_components: [empty-state, skeleton-loader]
    seed_rows:
      - { variant: recharged, title: "10 크레딧 충전", amount: "+10", time: "14:32" }
      - { variant: PAYBACK, title: "크레딧 페이백", amount: "+1", time: "13:10", description: null, thumbnail: "https://…" }
      - { variant: used, title: "밈 생성", amount: "-1", time: "12:04" }

  payback-only:
    description: "'적립' 칩 또는 PAYBACK-only 필터 적용 결과 (PAYBACK 엔트리만)"
    visible_components: [header, my-credit-info, chip-bar, history-list]
    chip_selected: "chip-earn"
    seed_rows:
      - { variant: PAYBACK, title: "크레딧 페이백", amount: "+2", time: "09:15", description: "홍길동님이 재생성", thumbnail: "https://…" }
      - { variant: PAYBACK, title: "크레딧 페이백", amount: "+1", time: "08:02", description: null, thumbnail: "https://…" }

  empty:
    description: "필터 결과 or 전체 엔트리 없음"
    visible_components: [header, my-credit-info, chip-bar, empty-state]
    hidden_components: [history-list]
    labels:
      title: "내역이 없어요"
      description: "아직 크레딧 사용 내역이 없어요."

  loading:
    description: "초기 API 호출 중"
    visible_components: [header, skeleton-loader]
    hidden_components: [my-credit-info, chip-bar, history-list, empty-state]
    skeleton_rows: 6

  with-payback-entries:
    description: "default 중에서도 '오늘' 섹션에 PAYBACK row 가 1개 이상 포함된 케이스 — 시각 회귀 검증용"
    visible_components: [header, my-credit-info, chip-bar, history-list]
    assertion: "PAYBACK row 는 콘텐츠 썸네일 + zzem_violet_600 amount 로, 주변 RECHARGED/USED row 와 구별된다."
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#btn-back"
    action: go-back
    transition: slide-right

  - trigger: tap
    target: "#chip-all"
    action: switch-tab
    state_key: "selectedChipKey=all"
    note: "전체 엔트리 렌더"

  - trigger: tap
    target: "#chip-earn"
    action: switch-tab
    state_key: "selectedChipKey=earn"
    note: "PAYBACK + recharged + refunded 엔트리 렌더"

  - trigger: tap
    target: "#chip-use"
    action: switch-tab
    state_key: "selectedChipKey=use"
    note: "used 엔트리 렌더 (PAYBACK 제외)"

  - trigger: tap
    target: "#chip-refund"
    action: switch-tab
    state_key: "selectedChipKey=refund"
    note: "refunded/expired 엔트리 렌더 (PAYBACK 제외)"

  - trigger: tap
    target: "[data-row-variant='PAYBACK']"
    action: none
    note: "Phase 2 scope: no-op. Deep-link 는 OUT OF SCOPE."

  - trigger: scroll-end
    target: "#history-list"
    action: paginate
    note: "기존 cursor 기반 (base64 encoded createdAt) 페이지네이션 유지 — 회귀 없음."
```

## Visual Rules

```yaml
rules:
  - condition: "transactionType === 'PAYBACK'"
    effect: "CreditHistoryRow-Payback variant 렌더 (썸네일 + '크레딧 페이백' 타이틀 + zzem_violet_600 amount)"
    example: "썸네일 40x40 + '+1' #7040E0"
  - condition: "selectedChipKey === 'earn'"
    effect: "PAYBACK + recharged + refunded 만 렌더"
    example: "'적립' 칩 → 리스트에 - (used/expired) 제외"
  - condition: "selectedChipKey === 'use'"
    effect: "used 만 렌더 → PAYBACK row 보이지 않음"
    example: "PAYBACK 은 적립 성격이므로 제외"
  - condition: "description 존재 AND PAYBACK"
    effect: "시간 옆 세퍼레이터 + description 표시 (예: '홍길동님이 재생성')"
    example: "14:32 | 홍길동님이 재생성"
  - condition: "전체 엔트리 0"
    effect: "empty state (아이콘 + 주/부 텍스트) 렌더"
    example: "내역이 없어요"
```

## Labels (ko)

```yaml
labels:
  header:
    title: "크레딧 내역"
    back: "뒤로"
  my_credit_info:
    balance_label: "보유 크레딧"
    expiration_hint: "{N} 크레딧이 소멸 예정이에요"
  chips:
    - { key: "all", value: "전체" }
    - { key: "earn", value: "적립" }
    - { key: "use", value: "사용" }
    - { key: "refund", value: "환불/소멸" }
  date_headers:
    today: "오늘 2026.04.22"
    yesterday: "2026.04.21"
  rows:
    payback_title: "크레딧 페이백"
    recharged_title_example: "10 크레딧 충전"
    used_title_example: "밈 생성"
    refunded_title_example: "환불"
    payback_description_example: "홍길동님이 재생성"
  empty_state:
    title: "내역이 없어요"
    description: "아직 크레딧 사용 내역이 없어요."
  a11y:
    back: "뒤로 가기"
    chip_earn: "적립 필터 (페이백 포함)"
```

## Token Map

```yaml
tokens:
  background: "background_primary → #FFFFFF"
  surface_secondary: "#F7F7F7 (섹션 구분 8px 디바이더 bg)"
  header_border: "outline_primary → #F1F1F1"
  text_primary: "#262626"
  text_secondary: "#656565"
  text_tertiary: "#8A8A8A"
  chip_selected_bg: "surface_primary_invert → #262626"
  chip_selected_text: "text_primary_invert → #FFFFFF"
  chip_unselected_bg: "surface_elevated → #FFFFFF"
  chip_unselected_border: "outline_secondary → #E4E5E9"
  chip_radius: "radius.full → 9999"
  row_height: "64 (min)"
  row_padding: "12 16"
  thumbnail_radius: "radius.md → 12"
  thumbnail_fallback_bg: "zzem_violet_100 → #EBE1FF"
  amount_increase_color: "zzem_violet_600 → #7040E0  (PAYBACK amount = promotion color alias)"
  amount_default_color: "text_primary → #262626"
  font_title: "Typo.Subtitle4 / 14 / Semibold"
  font_meta: "Typo.Body7 / 11 / Regular"
  font_section_header: "Typo.Body6 / 12 / Medium"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 10
    with_token_map: 10
    with_html_mapping: 10
    score: "20 / 20 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "Chip 4종 value ('전체/적립/사용/환불/소멸') — 기존 `toCreditHistoryChipEntityCollection()` 구현체의 실제 chip 구성 BE 소스를 프로토타입에서는 단정. Fallback low risk."
      - "'적립' 칩에 PAYBACK 포함 규칙 — task 본문 '기본: 적립 칩에 포함' 에 근거."
      - "Empty state copy ('내역이 없어요') — 기존 스크린에 명시 없음. 관례적 low-risk copy."
    risk_level: low
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score", "business_context"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 (AC-4.2)"
    what_resolved: "10 / 10"
```
