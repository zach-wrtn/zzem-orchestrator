# Screen Spec: ErrorNotFoundScreen

## Meta

```yaml
screen_name: "ErrorNotFoundScreen"
task_id: "app-006"
sprint_id: "ugc-platform-001"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
parent_screen: "OtherUserProfileScreen"
render_mode: "state-overlay (전체 화면 대체 블록)"
trigger: "GET /v2/users/{userId}/profile → 404"
```

## Component Tree

```
ErrorNotFoundScreen [frame: 390x844]
├── StatusBar [system] (div) #status-bar
├── HeaderBar [container] (header) — 48px, px-12 py-4 (Figma-accurate, same as parent)
│   ├── BackButton [icon-button] (button) #error-top-back — 32x32, p-4, rounded-8
│   ├── TitleSpacer [container] — flex:1 (empty)
│   └── MorePlaceholder [spacer] — 32x32, hidden (preserves header balance)
└── ErrorStateView [container] (section) #error-state-view — center
    ├── ErrorIcon [icon] (div) #error-icon — 🔍 (72x72 circular)
    ├── ErrorTitle [text] (h2) — "사용자를 찾을 수 없어요"
    ├── ErrorDescription [text] (p) — "존재하지 않거나 비공개된 프로필이에요"
    └── BackCTA [button-secondary] (button) #error-back-cta — "돌아가기"
```

### Component Details

```yaml
components:
  - name: HeaderBar
    id: error-header-bar
    tag: header
    type: container
    position: sticky-top
    size: 390x48
    tokens:
      fill: "semantic.background.normal → #FFFFFF"
      spacing: "4 12"
    layout: { direction: horizontal, alignment: space-between, sizing: fill }

  - name: BackButton
    id: error-top-back
    tag: button
    type: icon-button
    size: 32x32
    tokens:
      padding: "4"
      radius: "8"
      text: "semantic.label.normal → #212228"
    behavior:
      purpose: "이전 화면 복귀"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "뒤로 가기" }

  - name: ErrorStateView
    id: error-state-view
    tag: section
    type: container
    position: center
    size: 390x788
    tokens:
      fill: "semantic.background.normal"
      spacing: "120 24 24"
      gap: "12px"
    layout: { direction: vertical, alignment: center, sizing: fill }

  - name: ErrorIcon
    id: error-icon
    tag: div
    type: icon
    size: 72x72
    tokens:
      fill: "semantic.fill.neutral-secondary → #F0F1F3"
      text: "semantic.label.assistive → #8E9199"
      radius: "full"
    content: "🔍"
    a11y: { role: img, label: "검색 실패 아이콘" }

  - name: ErrorTitle
    id: error-title
    tag: h2
    type: text
    tokens:
      text: "semantic.label.normal → #212228"
      typography: "subtitle.subtitle2 semibold 20/1.5"
    a11y: { role: heading, label: "에러 제목" }
    constraints: { max_lines: 1 }

  - name: ErrorDescription
    id: error-description
    tag: p
    type: text
    tokens:
      text: "semantic.label.alternative → #6B6E76"
      typography: "body.body4 regular 14/1.4"
    constraints: { max_lines: 2, truncation: none }

  - name: BackCTA
    id: error-back-cta
    tag: button
    type: button-secondary
    size: "wrap-content (min 160px)"
    tokens:
      fill: "semantic.fill.neutral-secondary → #F0F1F3"
      text: "semantic.label.normal → #212228"
      radius: "md → 12px"
      spacing: "12 24"
      typography: "label.label1 semibold 14/1.4"
    behavior:
      purpose: "이전 화면으로 돌아가기"
      user_action: "tap"
      feedback: navigation
    a11y: { role: button, label: "돌아가기" }
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 390x844
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: error-header-bar
      sticky: top
      height: fixed(48px)
      padding: "4 12"
    - id: error-state-view
      flex: 1
      type: flex-column
      alignment: center
      padding: "120 24 24"
      gap: "12px"
      children:
        - id: error-icon
          size: 72x72
          margin-bottom: "8px"
        - id: error-title
        - id: error-description
          margin-bottom: "24px"
        - id: error-back-cta
```

## States

```yaml
states:
  default:
    description: "에러 화면 기본 (error-not-found 상태)"
    active: true
    visible_components: [error-top-bar, error-state-view]
    hidden_components: []
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#error-top-back"
    action: go-back
    transition: slide-right

  - trigger: tap
    target: "#error-back-cta"
    action: go-back
    transition: slide-right
```

## Visual Rules

```yaml
rules:
  - condition: "userId 404 fetch 결과"
    effect: "프로필/탭/그리드 영역을 전체 에러뷰로 대체"
    example: "ProfileSection + TabBar + FeedGrid 모두 숨김"
  - condition: "에러 메시지 톤"
    effect: "원인 추측 금지, 일반화된 안내만"
    example: "'계정이 삭제되었습니다' 같은 단정적 표현 회피"
```

## Labels (ko)

```yaml
labels:
  top_bar:
    back: "뒤로 가기"
  error:
    title: "사용자를 찾을 수 없어요"
    description: "존재하지 않거나 비공개된 프로필이에요"
    cta: "돌아가기"
```

## Token Map

```yaml
tokens:
  background: "semantic.background.normal → #FFFFFF"
  text_primary: "semantic.label.normal → #212228"
  text_secondary: "semantic.label.alternative → #6B6E76"
  text_hint: "semantic.label.assistive → #8E9199"
  divider: "semantic.line.normal → #E4E5E9"
  icon_bg: "semantic.fill.neutral-secondary → #F0F1F3"
  cta_fill: "semantic.fill.neutral-secondary → #F0F1F3"
  cta_text: "semantic.label.normal → #212228"
  cta_radius: "md → 12px"
  font_title: "subtitle.subtitle2 semibold 20/1.5"
  font_body: "body.body4 regular 14/1.4"
  font_cta: "label.label1 semibold 14/1.4"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 6
    with_token_map: 6
    with_html_mapping: 6
    score: "12 / 12 = 1.00"
  fabrication_risk:
    inferred_fields:
      - "error_state 타이틀/설명 문구 (PRD에 구체 카피 없음 — 관례적 한국어 에러 카피)"
      - "🔍 아이콘 선택 (디자인 시스템에 확정 아이콘 없음)"
    risk_level: "low"
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, component_tree, component_details, layout_spec, states, interactions, visual_rules, labels, token_map, quality_score]
    score: "10 / 7 (초과 충족)"
  context_coverage:
    why_linked: "1 / 1 (AC-6)"
    what_resolved: "6 / 6"
```
