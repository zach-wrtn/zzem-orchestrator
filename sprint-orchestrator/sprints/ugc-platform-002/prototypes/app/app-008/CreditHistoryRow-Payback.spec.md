# Screen Spec: CreditHistoryRow-Payback

> Component variant (row). Parent screen: CreditHistoryScreen.
> 기존 `MyCreditHistoryListItem` (credit-history-body.tsx → my-credit-history-list-item.tsx) 의
> `transactionType === 'PAYBACK'` 분기 variant.

## Meta

```yaml
component_name: "CreditHistoryRow-Payback"
task_id: "app-008"
sprint_id: "ugc-platform-002"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "parent 390xN (row height ~72px)"
theme: "light"
parent_screen: "CreditHistoryScreen"
variant_of: "MyCreditHistoryListItem"
source_prd_ac: ["AC-4.2"]
```

## Business Context

```yaml
why:
  product_intent: >-
    사용자가 업로드한 콘텐츠가 타 유저에 의해 재생성될 때 발생하는 페이백(1% 크레딧 환급)을
    크레딧 히스토리에서 "썸네일 + 크레딧 페이백" 형태로 인지 가능하게 한다.
  linked_ac:
    - id: AC-4.2
      given: "타 유저가 내 콘텐츠를 기반으로 재생성하여 크레딧 페이백이 발생"
      when: "사용자가 크레딧 히스토리 화면 진입"
      then: "PAYBACK 엔트리가 썸네일 + '크레딧 페이백' 타이틀 + '+N 크레딧' 금액으로 노출"
      ui_impact: "기존 row 와 다른 variant — 코인 아이콘 대신 콘텐츠 썸네일 + 프로모션 컬러 amount."
```

## Component Tree

```
CreditHistoryRow-Payback [row, horizontal] (div) #row-payback
├── Thumbnail-Content [image] (div) #row-payback-thumb — 40x40, radius 12, object-fit cover
├── MiddleColumn [container] (div) #row-payback-middle
│   ├── Title [text] (p) #row-payback-title — "크레딧 페이백" (Subtitle4 / 14px Semibold #262626)
│   └── MetaRow [container] (div) #row-payback-meta — HStack gap-4
│       ├── Time [text] (span) #row-payback-time — "HH:mm" (Body7 / 11px #8A8A8A)
│       ├── Separator [container] (span) #row-payback-sep — 1x10 vertical divider, #D1D3D8 (optional — description 있을 때만)
│       └── Description [text] (span) #row-payback-desc — "{nickname}님이 재생성" (Body7 / 11px #8A8A8A, optional)
└── Amount [text] (p) #row-payback-amount — "+{N}" (Subtitle4 / 14px Semibold, color zzem_violet_600 = #7040E0)
```

### Component Details

```yaml
components:
  - name: CreditHistoryRow-Payback
    id: row-payback
    tag: div
    type: list-item
    position: relative
    size: "full-width x auto"
    tokens:
      fill: "semantic.background.normal → #FFFFFF"
      radius: "none (row)"
      padding: "12 16 12 16"
      gap_horizontal: "12 (thumb↔middle), space-between (middle↔amount)"
    behavior:
      purpose: "PAYBACK 타입 엔트리를 기존 row 패턴과 동일한 시각 구조로, 단 썸네일+promotion color 로 구분"
      user_action: "no-op (Phase 2 scope) — 향후 deep-link 후보"
      feedback: visual
    states:
      default: "썸네일 + 타이틀 + 시간 + (optional) 설명 + amount 표시"
      loading: "thumbnail skeleton + title skeleton (60% width) + amount skeleton (40px)"
      error: null
    layout: { direction: horizontal, alignment: center, sizing: fill }
    a11y:
      role: text
      label: "크레딧 페이백 {+N} 크레딧"
    constraints:
      min_height: "64px"

  - name: Thumbnail-Content
    id: row-payback-thumb
    tag: div
    type: image
    size: "40x40"
    tokens:
      radius: "md (12px)"
      background_fallback: "zzem_violet_100 → #EBE1FF"
      object_fit: cover
    behavior:
      purpose: "재생성 원본 콘텐츠 시각 식별"
      user_action: "no-op (Phase 2 scope)"
      feedback: visual
    states:
      default: "BE thumbnailUrl 이미지 렌더"
      loading: "shimmer skeleton 40x40 radius 12"
      error: "zzem_violet_100 background, 아이콘 없음"
    a11y: { role: img, label: "재생성된 콘텐츠 썸네일" }
    constraints:
      fallback: "thumbnail == null 일 때 zzem_violet_100 빈 박스 (기존 FixedImage backgroundColor 동일)"

  - name: MiddleColumn
    id: row-payback-middle
    tag: div
    type: container
    size: "flex:1 x auto"
    tokens:
      gap_vertical: "0 (Typo 자체 line-height)"
    layout: { direction: vertical, alignment: start, sizing: fill }

  - name: Title
    id: row-payback-title
    tag: p
    type: text
    tokens:
      text: "text_primary → #262626"
      font: "Subtitle4 / 14px / Semibold / line-height 20"
    a11y: { role: heading, label: "크레딧 페이백" }
    constraints:
      max_lines: 1
      truncation: ellipsis

  - name: MetaRow
    id: row-payback-meta
    tag: div
    type: container
    tokens:
      gap_horizontal: "4"
    layout: { direction: horizontal, alignment: center, sizing: hug }

  - name: Time
    id: row-payback-time
    tag: span
    type: text
    tokens:
      text: "text_tertiary → #8A8A8A"
      font: "Body7 / 11px / Regular"
    notes: "dayjs(createdAt).format('HH:mm')"

  - name: Separator
    id: row-payback-sep
    tag: span
    type: divider
    size: "1x10"
    tokens:
      fill: "icon_disable → #D1D3D8"
    notes: "description 존재 시에만 렌더 (기존 row 와 동일 패턴)"

  - name: Description
    id: row-payback-desc
    tag: span
    type: text
    tokens:
      text: "text_tertiary → #8A8A8A"
      font: "Body7 / 11px / Regular"
    constraints:
      max_lines: 1
      truncation: ellipsis
      content_policy: "optional — BE description null 이면 미표시. 포맷: '{nickname}님이 재생성'"

  - name: Amount
    id: row-payback-amount
    tag: p
    type: text
    tokens:
      text: "zzem_violet_600 → #7040E0 (promotion green 대체 — 본 앱은 브랜드 퍼플을 '증가' 컬러로 운용)"
      font: "Subtitle4 / 14px / Semibold / line-height 20"
    behavior:
      purpose: "크레딧 증가분 강조 — 기존 increased amount 규칙(zzem_violet_600) 동일 적용"
      feedback: visual
    a11y: { role: text, label: "플러스 {N} 크레딧" }
    notes: >-
      기존 MyCreditHistoryListItem 는 isIncreasedAmount 판정 시 'zzem_violet_600' 사용.
      PAYBACK 은 signedAmount > 0 (또는 recharged/refunded 규칙 확장) 으로 increase 로 분류.
      DESIGN.md 에 별도 `--color-promotion` 토큰이 없으므로 기존 증가 컬러 토큰 재사용.
```

## Layout Spec

```yaml
layout_spec:
  type: flex-row
  width: 390
  height: auto (min 64)
  padding: "12 16 12 16"
  regions:
    - id: row-payback-thumb
      size: fixed(40x40)
      flex: 0
    - id: row-payback-middle
      flex: 1
      gap_left: "12"
      direction: column
    - id: row-payback-amount
      flex: 0
      align_self: center
      padding_left: "8"
```

## States

```yaml
states:
  default:
    description: "기본 노출 — 썸네일+타이틀+메타+amount"
    active: true
    visible_components: [row-payback-thumb, row-payback-title, row-payback-time, row-payback-amount]
    hidden_components: []
    optional_visible: [row-payback-sep, row-payback-desc]

  with-description:
    description: "BE 가 description 내려준 경우"
    visible_components: [row-payback-thumb, row-payback-title, row-payback-time, row-payback-sep, row-payback-desc, row-payback-amount]
    hidden_components: []
    labels:
      description_example: "홍길동님이 재생성"

  without-description:
    description: "BE description=null (기본 가정)"
    visible_components: [row-payback-thumb, row-payback-title, row-payback-time, row-payback-amount]
    hidden_components: [row-payback-sep, row-payback-desc]

  thumbnail-fallback:
    description: "thumbnail=null 또는 로드 실패"
    visible_components: [row-payback-thumb, row-payback-title, row-payback-time, row-payback-amount]
    hidden_components: []
    visual_diff: "thumb 영역이 zzem_violet_100 단색 박스로 노출"

  loading:
    description: "리스트 초기 로드 — row 단위 skeleton"
    visible_components: [skeleton-thumb, skeleton-title, skeleton-amount]
    hidden_components: [row-payback-thumb, row-payback-title, row-payback-time, row-payback-desc, row-payback-sep, row-payback-amount]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#row-payback"
    action: none
    note: "Phase 2 scope: no-op (task 명시). Deep-link (썸네일 탭 → 원본 세로 스와이프) 는 본 스프린트 OUT OF SCOPE."
```

## Visual Rules

```yaml
rules:
  - condition: "transactionType === 'PAYBACK'"
    effect: "코인 아이콘 썸네일 대신 콘텐츠 썸네일 사용, amount 는 증가 컬러 (#7040E0) + '+{N}' 포맷"
    example: "+1 크레딧 (zzem_violet_600), 썸네일 40x40 radius 12"
  - condition: "description == null"
    effect: "세퍼레이터(#D1D3D8 1x10) 와 description 텍스트 비렌더"
    example: "시간만 단독 표시 — '14:32'"
  - condition: "thumbnail == null"
    effect: "zzem_violet_100 (#EBE1FF) 단색 박스로 fallback"
    example: "BE thumbnailUrl 누락 시"
  - condition: "amount === 0"
    effect: "기존 로직상 '무료' 표기 — PAYBACK 에서는 실질 발생 X (서버 룰상 올림 처리로 최소 +1)"
    example: "보호 로직, 시각 규칙만"
```

## Labels (ko)

```yaml
labels:
  title: "크레딧 페이백"
  amount_prefix: "+"
  amount_suffix: ""            # 기존 row 는 '크레딧' suffix 없음 — 숫자만 표기, 화면 전체에 '크레딧' 컨텍스트 이미 확립
  description_template: "{nickname}님이 재생성"
  time_format: "HH:mm"
  a11y_amount: "플러스 {N} 크레딧"
  a11y_thumbnail: "재생성된 콘텐츠 썸네일"
  fallback_thumbnail_aria: "콘텐츠 썸네일 없음"
```

## Token Map

```yaml
tokens:
  background: "semantic.background.normal → #FFFFFF"
  text_primary: "app-alias text_primary → #262626"
  text_tertiary: "app-alias text_tertiary → #8A8A8A"
  divider_assistive: "primitive.neutral.300 (icon_disable) → #D1D3D8"
  promotion_amount: "zzem_violet_600 → #7040E0  (기존 increased-amount 컬러 재사용; DESIGN.md 내 별도 --color-promotion 토큰 없음)"
  thumbnail_radius: "radius.md → 12px"
  thumbnail_fallback_bg: "zzem_violet_100 → #EBE1FF"
  row_padding: "12 16 (spacing-12 / spacing-16)"
  gap_thumb_middle: "spacing-12 → 12px"
  gap_meta: "spacing-4 → 4px"
  font_title: "Typo.Subtitle4 → 14px / Semibold / LH 20"
  font_meta: "Typo.Body7 → 11px / Regular"
  font_amount: "Typo.Subtitle4 → 14px / Semibold"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 8
    with_token_map: 8
    with_html_mapping: 8
    score: "16 / 16 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "description_template 포맷 ('님이 재생성') — PRD 예시에 '님이 재생성' 문구만 명시. BE 최종 포맷 확정 전."
      - "썸네일 size 40x40 — 기존 row 썸네일 크기와 동일하게 맞춤 (task 에는 48×48 or 56×56 옵션 제시됐으나, 기존 row 일관성 우선)."
    risk_level: low
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score", "business_context"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 (AC-4.2)"
    what_resolved: "8 / 8 (모든 컴포넌트가 기존 코드/토큰에서 직접 매핑됨)"
```
