# Screen Spec: {ScreenName}

> Machine-readable 화면 명세. Design Engineer agent가 이 파일을 읽어 HTML 프로토타입을 생성한다.
> 모든 필드는 구조화되어 있으며, 산문(prose)은 사용하지 않는다.

## Meta

```yaml
screen_name: "{ScreenName}"
task_id: "{task-id}"
sprint_id: "{sprint-id}"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
```

## Component Tree

들여쓰기로 계층 구조를 표현한다. 각 노드는 `ComponentName [type] (tag) #id — 설명` 형식.

```
Screen [frame: 390x844]
├── StatusBar [system] (div) #status-bar
├── Header [container] (header) #header
│   ├── BackButton [icon-button] (button) #back-button — 뒤로가기
│   ├── Title [text] (h1) #title — "{화면 타이틀}"
│   └── ActionButton [icon-button] (button) #action-button — {액션 설명}
├── Body [scroll-container] (main) #body
│   ├── {SectionName} [container] (section) #{section-id}
│   │   ├── {ComponentName} [type] (tag) #{id} — {설명}
│   │   └── ...
│   └── ...
├── BottomAction [container] (div) #bottom-action — (있는 경우만)
│   └── CTAButton [button-primary] (button) #cta-button — "{버튼 텍스트}"
└── BottomNav [navigation] (nav) #bottom-nav — 5탭 (홈, 검색, 만들기, 알림, MY)
```

### Component Details

각 컴포넌트의 상세 속성을 정의한다.

```yaml
components:
  - name: "{ComponentName}"
    id: "{html-element-id}"
    tag: "{header | main | nav | section | div | button | h1 | p | img | input | ul | li | span}"
    type: "{container | text | button-primary | button-secondary | icon-button | image | input | list | grid | tabs | chip | badge | toggle | bottom-sheet | avatar | card | divider | skeleton}"
    position: "{top | center | bottom | sticky-top | sticky-bottom | overlay}"
    size: "{width}x{height} | full-width | wrap-content"
    tokens:
      fill: "{semantic.xxx | component.xxx | #HEX}"
      text: "{semantic.label.xxx}"
      border: "{semantic.line.xxx | none}"
      radius: "{xs|sm|md|lg|xl|2xl|full} ({N}px)"
      spacing: "{내부 padding: N N N N}"
    children:
      - "{child component 참조}"
    notes: "{특이사항}"
```

> `tag`와 `id` 필드는 Step C에서 HTML 요소 생성 시 사용한다. `tokens` 필드로 CSS 스타일을 적용한다.

### Enhanced Component Metadata

> 참조: design-engineer.md Step B.3 — Component-as-Data

각 컴포넌트에 다음 메타데이터 카테고리를 추가한다 (해당 컴포넌트에 관련 있는 것만):

```yaml
    # Behavioral Metadata
    behavior:
      purpose: "{이 컴포넌트가 존재하는 이유 — Context Engine WHY 레이어에서 도출}"
      user_action: "{사용자가 이 컴포넌트로 수행하는 행동}"
      feedback: "{행동에 대한 피드백 유형: visual | haptic | navigation | toast}"

    # State Metadata
    states:
      default: "{기본 외관}"
      disabled: "{비활성 조건 — null이면 항상 활성}"
      loading: "{로딩 중 외관 — null이면 로딩 상태 없음}"
      error: "{에러 시 외관 — null이면 에러 표시 없음}"

    # Layout Metadata
    layout:
      direction: "{horizontal | vertical}"
      alignment: "{start | center | end | space-between}"
      sizing: "{fixed | hug | fill}"

    # Accessibility Metadata
    a11y:
      role: "{button | link | heading | img | text | list | tab | switch | ...}"
      label: "{스크린리더 라벨 — 한국어}"

    # Composition Constraints
    constraints:
      min_height: "{N}px | null"
      max_lines: "{N} | null"
      truncation: "{ellipsis | fade | none}"
```

적용 우선순위: `behavior` > `states` > `a11y` > `layout` > `constraints`

## Layout Spec

화면의 전체 레이아웃을 구조화된 CSS 레이아웃 힌트로 표현한다.

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
    - id: body
      scroll: vertical
      flex: 1
      children:
        - id: "{section-id}"
          type: flex-column
          gap: "{N}px"
    - id: bottom-action
      sticky: bottom
      height: fixed(auto)
      padding: "16px 16px 34px"
    - id: bottom-nav
      sticky: bottom
      height: fixed(83px)
```

## States

화면의 모든 상태를 열거한다. 각 상태별로 visible/hidden 컴포넌트를 매핑한다.

```yaml
states:
  default:
    description: "기본 상태"
    active: true
    visible_components: [body]
    hidden_components: []

  empty:
    description: "콘텐츠 없음"
    visible_components: [empty-state-view]
    hidden_components: [body]
    labels:
      title: "{빈 상태 제목}"
      description: "{빈 상태 설명}"
      cta: "{CTA 버튼 텍스트}"

  loading:
    description: "로딩 중"
    visible_components: [skeleton-loader]
    hidden_components: [body, empty-state-view]

  error:
    description: "에러 발생"
    visible_components: [error-view]
    hidden_components: [body]
    labels:
      message: "{에러 메시지}"
      retry: "다시 시도"
```

## Interactions

사용자 행동 → 화면 반응을 구조화된 이벤트 바인딩으로 매핑한다.

```yaml
interactions:
  - trigger: tap
    target: "#{element-id}"
    action: navigate
    destination: "{ScreenName}"
    transition: slide-left

  - trigger: tap
    target: "#{tab-id}"
    action: switch-tab
    destination: null
    transition: none

  - trigger: tap
    target: "#{element-id}"
    action: toggle-state
    state_key: "{state-name}"

  - trigger: tap
    target: "#{element-id}"
    action: open-overlay
    destination: "{BottomSheetName}"
    transition: slide-up

  - trigger: tap
    target: "#{close-button-id}"
    action: close-overlay
    transition: slide-down
```

## Visual Rules

UI에 영향을 주는 비즈니스 규칙만. 서버 로직 제외.

```yaml
rules:
  - condition: "{조건}"
    effect: "{UI 변화}"
    example: "{구체적 예시}"
```

## Labels (ko)

화면에 표시되는 모든 한국어 텍스트. 빠짐없이 나열.

```yaml
labels:
  header:
    title: "{화면 타이틀}"
    back: "뒤로"
  body:
    section_title: "{섹션 제목}"
    placeholder: "{입력 필드 힌트}"
  buttons:
    primary: "{주요 버튼}"
    secondary: "{보조 버튼}"
  tabs:
    - "{탭1}"
    - "{탭2}"
  toast:
    success: "{성공 메시지}"
    error: "{에러 메시지}"
  empty_state:
    title: "{빈 상태 제목}"
    description: "{빈 상태 설명}"
```

## Token Map

이 화면에서 사용하는 WDS 토큰의 전체 매핑.

```yaml
tokens:
  background: "semantic.background.normal → #FFFFFF"
  text_primary: "semantic.label.normal → #212228"
  text_secondary: "semantic.label.alternative → #6B6E76"
  text_hint: "semantic.label.assistive → #8E9199"
  divider: "semantic.line.normal → #E4E5E9"
  brand: "semantic.fill.brand-primary → #8752FA"
  button_primary_fill: "component.button.primary.fill → #8752FA"
  button_primary_label: "component.button.primary.label → #FFFFFF"
  button_secondary_fill: "component.button.secondary.fill → #F0F1F3"
  card_fill: "component.card.fill → #FFFFFF"
  card_radius: "component.card.radius → 16px"
  input_fill: "component.input.fill → #F7F8F9"
  input_radius: "component.input.radius → 12px"
  nav_active: "component.navigation.bottom-bar.active → #8752FA"
  nav_inactive: "component.navigation.bottom-bar.inactive → #8E9199"
```

## Quality Score

> 참조: design-engineer.md Step B.5 — 메타데이터 품질 점수

```yaml
quality_score:
  extraction_accuracy:
    total_components: {N}
    with_token_map: {N}
    with_html_mapping: {N}
    score: "{with_token_map + with_html_mapping} / {total_components * 2}"
  fabrication_risk:
    inferred_fields: ["{AI가 PRD에 없는 내용을 추론한 필드 목록}"]
    risk_level: "{none | low | medium | high}"
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["{실제 작성된 섹션}"]
    score: "{present} / {required}"
  context_coverage:
    why_linked: "{ui_impact가 연결된 AC 수} / {전체 AC 수}"
    what_resolved: "{토큰/컴포넌트가 확인된 수} / {필요한 수}"
```
