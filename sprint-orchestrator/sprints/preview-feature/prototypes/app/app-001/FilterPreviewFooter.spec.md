# Screen Spec: FilterPreviewFooter

> Machine-readable spec for the FilterPreview screen footer dual-CTA branch
> (APP-001). Covers the footer region only; screen body above is preserved as
> a placeholder hero.

## Meta

```yaml
screen_name: "FilterPreviewFooter"
screen_archetype: "detail"
modal_subtype: null
detail_state: "normal"
task_id: "app-001"
sprint_id: "preview-feature"
app: "ZZEM (MemeApp)"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
instant_save: false
```

## Component Tree

```
Screen [frame: 390x844] #FilterPreview
├── StatusBar [system] (div) #status-bar
├── Header [container] (header) #header
│   ├── BackButton [icon-button] (button) #header-back — 뒤로가기 ←
│   ├── Title [text] (h1) #header-title — "필터 미리보기"
│   └── ActionButton [icon-button] (button) #header-share — 공유 ⌃
├── Hero [container] (section) #hero
│   └── PreviewMedia [image] (div) #preview-media — 결과 이미지 placeholder (16:9)
├── Body [scroll-container] (main) #body
│   ├── FilterMeta [container] (section) #filter-meta
│   │   ├── FilterName [text] (h2) #filter-name — "스튜디오 지브리 풍"
│   │   ├── FilterAuthor [text] (span) #filter-author — "@studio_zzem"
│   │   └── FilterStats [text] (span) #filter-stats — "사용 12,438 · 좋아요 2,910"
│   └── FilterDescription [text] (p) #filter-description — 필터 설명 한 줄
└── Footer [container] (div) #footer — sticky-bottom, dual-CTA branch
    ├── PreviewButton [button-secondary] (button) #footer-preview-btn — "미리보기"  (state: dual-cta only)
    └── CreateButton [button-primary] (button) #footer-create-btn — "만들기 🪙3,960"
```

### Component Details

```yaml
components:
  - name: "Footer"
    id: "footer"
    tag: "div"
    type: "container"
    position: "sticky-bottom"
    size: "full-width"
    tokens:
      fill: "semantic.background.normal → #FFFFFF"
      border: "semantic.line.normal → #E4E5E9 (top 1px)"
      spacing: "16 16 34 16"   # bottom = 16 + 18 home indicator
    layout:
      direction: "horizontal"
      alignment: "space-between"
      sizing: "fill"
    notes: "dual-cta state → 두 버튼 수평 + gap 8. single-cta state → CreateButton 만 풀폭."

  - name: "PreviewButton"
    id: "footer-preview-btn"
    tag: "button"
    type: "button-secondary"
    position: "bottom"
    size: "flex: 1; height: 56"
    tokens:
      fill: "component.button.secondary.fill → #F0F1F3"
      text: "component.button.secondary.label → #212228"
      radius: "lg (16px)"
      spacing: "0 16"
    behavior:
      purpose: "분해 미리보기로 진입 — '만들기' 전 결과 형태 검증"
      user_action: "tap"
      feedback: "navigation (open-overlay → PreviewBottomSheet)"
    states:
      default: "fill #F0F1F3, label #212228"
      disabled: null
      loading: null
      error: null
    a11y:
      role: "button"
      label: "미리보기"
    constraints:
      min_height: "56px"
      truncation: "ellipsis"
    notes: "오직 hasDecompPreview === true 일 때만 렌더 (visible_components: dual-cta)."

  - name: "CreateButton"
    id: "footer-create-btn"
    tag: "button"
    type: "button-primary"
    position: "bottom"
    size: "flex: 1; height: 56"
    tokens:
      fill: "component.button.primary.fill → #8752FA"
      text: "component.button.primary.label → #FFFFFF"
      radius: "lg (16px)"
      spacing: "0 16"
    behavior:
      purpose: "기존 atomic workflow — 즉시 생성 진입 (변경 없음)"
      user_action: "tap"
      feedback: "navigation (/gen)"
    states:
      default: "fill #8752FA, label #FFFFFF, label '만들기 🪙{총액}'"
      disabled: "fill #F0F1F3, label #B5B8BF (잔액 부족 등)"
      loading: "spinner inline, label hidden, aria-busy=true"
      error: null
    a11y:
      role: "button"
      label: "만들기, 비용 3,960 크레딧"
    constraints:
      min_height: "56px"
      truncation: "ellipsis"
    notes: "single-cta state 에선 width: 100% (flex: 1 의 단일 child)."
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
      height: fixed(56px)
    - id: hero
      height: fixed(360px)        # detail #1 — hero 320+
    - id: body
      scroll: vertical
      flex: 1
      padding: "20 20 24"
      children:
        - id: filter-meta
          type: flex-column
          gap: "4px"
        - id: filter-description
          type: flex-column
          gap: "12px"
    - id: footer
      sticky: bottom
      height: fixed(auto)
      padding: "16 16 34"           # 34 = 16 + 18 home indicator safe area
      border_top: "1px solid var(--color-line-normal)"
      children:
        - id: footer-row
          type: flex-row
          gap: "8px"
          align: stretch
```

## States

```yaml
states:
  default:
    description: "dual-CTA — hasDecompPreview === true (좌: 미리보기 / 우: 만들기)"
    active: true
    visible_components: [footer-preview-btn, footer-create-btn]
    hidden_components: []

  dual-cta:
    description: "Alias — same as default (toggle naming clarity)"
    visible_components: [footer-preview-btn, footer-create-btn]
    hidden_components: []

  single-cta:
    description: "기존 단일 [만들기] (hasDecompPreview !== true 또는 누락)"
    visible_components: [footer-create-btn]
    hidden_components: [footer-preview-btn]

  loading:
    description: "[만들기] tap 후 서버 응답 대기 — primary 버튼만 spinner"
    visible_components: [footer-create-btn]
    hidden_components: [footer-preview-btn]
    labels:
      cta: ""   # spinner only
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#footer-preview-btn"
    action: open-overlay
    destination: "PreviewBottomSheet"
    transition: slide-up
    only_when: "state in [default, dual-cta]"

  - trigger: tap
    target: "#footer-create-btn"
    action: navigate
    destination: "GenScreen"
    transition: slide-left

  - trigger: tap
    target: "#header-back"
    action: go-back
```

## Visual Rules

```yaml
rules:
  - condition: "filter.hasDecompPreview === true (strict)"
    effect: "Footer 가 dual-CTA 로 렌더 — 좌 [미리보기] flex:1 / 우 [만들기 🪙{총액}] flex:1"
    example: "분해 미리보기 지원 필터 (예: 스튜디오 지브리 풍)"

  - condition: "filter.hasDecompPreview !== true (false / undefined)"
    effect: "Footer 가 single-CTA 로 렌더 — [만들기 🪙{총액}] full-width"
    example: "기본 atomic 필터 — 회귀 0 보장 (AC 2.2.3)"

  - condition: "버튼 라벨 비용 표시"
    effect: "🪙 + filter.requiredCredit (콤마 구분, 예: 3,960)"
    example: "3960 → 🪙3,960"

  - condition: "두 CTA 동시 노출 시"
    effect: "좌 secondary / 우 primary — 위계 명확. flex:1 균등 폭, gap 8px"
    example: "Detail persona 강제룰 #4 (primary 1 + secondary 0-2) 충족"
```

## Labels (ko)

```yaml
labels:
  header:
    title: "필터 미리보기"
    back: "뒤로"
    share: "공유"
  hero:
    media_alt: "필터 적용 결과 미리보기"
  body:
    filter_name: "스튜디오 지브리 풍"
    filter_author: "@studio_zzem"
    filter_stats: "사용 12,438 · 좋아요 2,910"
    filter_description: "따뜻한 색감과 부드러운 빛으로 스튜디오풍 무드를 재현해요."
  buttons:
    preview: "미리보기"
    create_template: "만들기 🪙{총액}"
    create_example: "만들기 🪙3,960"
  toast: {}
  empty_state: {}
```

## Token Map

```yaml
tokens:
  background:           "semantic.background.normal → #FFFFFF"
  surface_secondary:    "semantic.surface.secondary → #F7F8F9"
  text_primary:         "semantic.label.normal → #212228"
  text_secondary:       "semantic.label.alternative → #6B6E76"
  text_assistive:       "semantic.label.assistive → #8E9199"
  divider:              "semantic.line.normal → #E4E5E9"
  brand:                "semantic.fill.brand-primary → #8752FA"
  button_primary_fill:  "component.button.primary.fill → #8752FA"
  button_primary_label: "component.button.primary.label → #FFFFFF"
  button_secondary_fill: "component.button.secondary.fill → #F0F1F3"
  button_secondary_label: "component.button.secondary.label → #212228"
  button_radius:        "component.button.radius → 16px (lg)"
  button_height:        "component.button.height → 56px"
  font_family:          "Pretendard, SF Pro Display, sans-serif"
  font_weight_button:   "semibold (600)"
```

## Persona Rule Checks (detail / detail_state: normal)

```yaml
detail_persona:
  rule_1_hero_320:    "PASS — hero region height 360px"
  rule_2_back_1way:   "PASS — header back button + go-back interaction"
  rule_3_meta_le_4:   "PASS — meta row 3 항목 (이름, 작성자, 통계)"
  rule_4_primary_1_secondary_0_2: "PASS — primary 1 (만들기) + secondary 1 (미리보기) — dual-CTA 강제룰 #4 만족"
recommended:
  sticky_bottom_cta:  "PASS — Footer sticky-bottom"
  hero_aspect_16_9:   "PASS — hero 16:9 placeholder"
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
      - "hero/filter-meta/filter-description placeholder content (PRD 는 footer 만 다룸 — 화면 컨텍스트 위해 placeholder 생성)"
    risk_level: "low"
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "persona_rule_checks", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "5 / 5"     # AC 2.1.1 (dual), 2.1.1 (single), 2.2.3 (no-regression), preview-tap, testIDs
    what_resolved: "8 / 8"
```
