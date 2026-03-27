# Screen Spec: {ScreenName}

> Machine-readable 화면 명세. Design Engineer agent가 이 파일을 읽어 Figma 프로토타입을 생성한다.
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

들여쓰기로 계층 구조를 표현한다. 각 노드는 `ComponentName [type] — 설명` 형식.

```
Screen [frame: 390x844]
├── StatusBar [system]
├── Header [container]
│   ├── BackButton [icon-button] — 뒤로가기
│   ├── Title [text] — "{화면 타이틀}"
│   └── ActionButton [icon-button] — {액션 설명}
├── Body [scroll-container]
│   ├── {SectionName} [container]
│   │   ├── {ComponentName} [type] — {설명}
│   │   └── ...
│   └── ...
├── BottomAction [container] — (있는 경우만)
│   └── CTAButton [button-primary] — "{버튼 텍스트}"
└── BottomNav [navigation] — 5탭 (홈, 검색, 만들기, 알림, MY)
```

### Component Details

각 컴포넌트의 상세 속성을 정의한다.

```yaml
components:
  - name: "{ComponentName}"
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

## Layout Spec

화면의 전체 레이아웃을 ASCII로 표현한다.

```
┌─────────────────────────────┐ 390px
│ StatusBar (44px)            │
├─────────────────────────────┤
│ Header (56px)               │
│ [← Back] [Title] [Action]  │
├─────────────────────────────┤
│                             │
│ Scrollable Body             │
│                             │
│ ┌─────────────────────────┐ │
│ │ Section A               │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Section B               │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ Bottom Nav (83px)           │
│ [홈] [검색] [+] [알림] [MY]│
└─────────────────────────────┘ 844px
```

## States

화면의 모든 상태를 열거한다. 각 상태별로 **무엇이 달라지는지**만 명시.

```yaml
states:
  default:
    description: "기본 상태"
    visible: ["모든 컴포넌트"]

  empty:
    description: "콘텐츠 없음"
    changes:
      - target: "Body"
        action: "replace"
        with: "EmptyState [container] — 일러스트 + 안내 문구 + CTA"
    labels:
      title: "{빈 상태 제목}"
      description: "{빈 상태 설명}"
      cta: "{CTA 버튼 텍스트}"

  loading:
    description: "로딩 중"
    changes:
      - target: "{ComponentName}"
        action: "replace"
        with: "Skeleton [skeleton] — {크기 설명}"

  error:
    description: "에러 발생"
    changes:
      - target: "Body"
        action: "replace"
        with: "ErrorState [container] — 에러 아이콘 + 메시지 + 재시도"
    labels:
      message: "{에러 메시지}"
      retry: "다시 시도"
```

## Interactions

사용자 행동 → 화면 반응을 매핑한다. 기술 용어 없이 UX 관점만.

```yaml
interactions:
  - trigger: "{유저 행동}"
    response: "{화면 반응}"
    navigation: "{이동 대상 화면 | null}"

  - trigger: "탭: {탭명}"
    response: "해당 탭 콘텐츠로 전환"
    navigation: null

  - trigger: "탭: {컴포넌트명}"
    response: "{바텀시트 열기 | 화면 전환 | 토글}"
    navigation: "{ScreenName | BottomSheetName | null}"
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
