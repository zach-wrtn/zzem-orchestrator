# Screen Spec: ComingSoonScreen (Placeholder)

> 공용 placeholder 화면. `NotificationPlaceholder`, `BlockPlaceholder`, `CustomerServicePlaceholder`
> 세 variant가 동일 템플릿을 사용하며 헤더 타이틀만 다르다.

## Meta

```yaml
screen_name: "ComingSoonScreen"
task_id: "app-004"
sprint_id: "ugc-platform-001"
app: "ZZEM (MemeApp)"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "375x812 (Figma) / 390x844 (prototype wrap)"
theme: "light"
variants:
  - id: "NotificationPlaceholder"
    header_title: "알림 설정"
  - id: "BlockPlaceholder"
    header_title: "차단 관리"
  - id: "CustomerServicePlaceholder"
    header_title: "고객센터"
    status: "NEW — added for Figma-introduced '고객센터' row (Phase 3.4 PRD amendment pending)"
```

## Component Tree

```
ComingSoonScreen [frame: 375x812]
├── StatusBar (div)
├── HeaderBar (header)        # pl-12 pr-44 py-4, h-48
│   ├── BackButton (button) — ArrowshortLeft_Fill_L 24
│   └── Title (h1) — "{variant.header_title}"
└── Body (main)               # flex-1, center/center
    └── EmptyNotice (p) — "준비 중"
```

### Component Details

```yaml
components:
  - name: "HeaderBar"
    tag: "header"
    size: "full-width x 48px"
    layout: "pl-12 pr-44 py-4, space-between"
    tokens:
      fill: "var(--background_primary) → #FFFFFF"

  - name: "BackButton"
    tag: "button"
    size: "40×40 tap target (24 icon)"
    fill: "transparent"
    a11y:
      role: "button"
      label: "뒤로"

  - name: "Title"
    tag: "h1"
    tokens:
      text: "var(--text_primary) → #262626"
      font: "Pretendard SemiBold 18px"

  - name: "EmptyNotice"
    tag: "p"
    position: "center of body (flex center/center)"
    tokens:
      text: "var(--text_tertiary) → #8A8A8A"
      font: "Pretendard Medium 16px"
    a11y:
      role: "text"
      label: "준비 중"
    notes: "단일 문구 — 서브텍스트/일러스트/CTA 금지"
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 375x812
  background: "var(--background_primary) → #FFFFFF"
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: header
      sticky: top
      height: fixed(48px)
      padding: "4px 44px 4px 12px"
    - id: body
      flex: 1
      align: center
      justify: center
      children:
        - id: empty-notice
          alignment: center
```

## States

```yaml
states:
  coming-soon:
    description: "단일 state. '준비 중' 노출."
    active: true
    visible_components: [header, body, empty-notice]
    hidden_components: []
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "button[data-back]"
    action: go-back
    transition: slide-right
```

## Visual Rules

```yaml
rules:
  - condition: "Phase 3 이전 placeholder"
    effect: "'준비 중' 단일 텍스트만 노출 — 서브텍스트/일러스트/CTA 추가 금지"
  - condition: "헤더 타이틀"
    effect: "variant 값 고정 — 임의 변형 불가"
    variants: ["알림 설정", "차단 관리", "고객센터"]
```

## Labels (ko)

```yaml
labels:
  header:
    notification_variant: "알림 설정"
    block_variant: "차단 관리"
    customer_service_variant: "고객센터"
    back: "뒤로"
  body:
    notice: "준비 중"
```

## Token Map

```yaml
tokens:
  background:   "var(--background_primary) → #FFFFFF"
  title_text:   "var(--text_primary) → #262626"
  notice_text:  "var(--text_tertiary) → #8A8A8A"
  font_family:  "Pretendard"
  title_font:   "Pretendard SemiBold 18px"
  notice_font:  "Pretendard Medium 16px"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 4
    with_token_map: 4
    with_html_mapping: 4
    score: "8 / 8 = 1.0"
  fabrication_risk:
    inferred_fields: []
    risk_level: "none"   # Figma doesn't show explicit placeholder frame but notice pattern is established project-wide
    notes: "'준비 중' pattern is team convention, header follows Settings Screen HeaderBar spec verbatim."
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 (AC-2.8-2)"
    what_resolved: "4 / 4"
  drift_findings:
    - id: "DRIFT-CS-01"
      field: "variant_count"
      baseline: "2 (Notification, Block)"
      figma:    "3 (+ CustomerService — new Settings row)"
      resolution: "Added CustomerServicePlaceholder. Flag Phase 3.4 PRD for 고객센터 scope definition."
```
