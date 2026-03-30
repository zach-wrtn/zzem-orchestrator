# HTML Prototype Pipeline Design

> Design Engineer의 프로토타입 산출물을 Figma에서 self-contained HTML로 전환한다.

## 동기

1. **Figma MCP 불안정/비용** — `use_figma` 도구의 안정성 이슈와 높은 토큰 소모
2. **인터랙티브 프리뷰** — 브라우저에서 화면 전환, 상태 토글을 직접 확인

## 범위

- Step A (Context Engine): 변경 최소 — `tokens.css` 생성 추가
- Step B (UX Decomposition): Screen Spec 포맷을 HTML 생성에 최적화
- Step C (Prototype Generation): Figma → 단일 HTML 파일로 완전 교체
- Step B.5 (Library Discovery): 제거

## 접근법

**Single HTML per Task** — 태스크 단위로 하나의 self-contained HTML 파일 생성. 의존성 zero, `file://`로 바로 열림, Git 버전 관리 용이.

---

## 1. 디자인 토큰 변환 (Step A 추가)

`design-tokens/*.json`을 CSS Custom Properties로 변환하여 `tokens.css` 생성.

### 변환 규칙

```
JSON key path → CSS variable name
color.brand.primary → --color-brand-primary
font.size.body → --font-size-body
spacing.4 → --spacing-4
radius.md → --radius-md
```

### 생성 예시

```css
:root {
  /* Color - Brand */
  --color-brand-primary: #8752FA;
  --color-brand-primary-dark: #A17BFF;

  /* Typography */
  --font-family-default: 'Pretendard', 'SF Pro', sans-serif;
  --font-size-body: 16px;
  --font-weight-bold: 700;

  /* Spacing (4px grid) */
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-full: 9999px;
}
```

### 산출물

```
sprints/{sprint-id}/prototypes/context/tokens.css
```

Step A에서 `context-engine.yaml` 생성 시 함께 생성. 모든 태스크의 HTML이 이 토큰을 inline으로 포함.

---

## 2. Screen Spec 포맷 변경 (Step B)

기존 Figma 최적화 YAML을 HTML 생성에 최적화된 구조로 변경.

### 2.1 layout_spec — CSS 레이아웃 힌트

```yaml
# Before: ASCII 다이어그램
layout_spec: |
  [Header         ]
  [  TabBar        ]
  [  ContentList   ]
  [BottomNav       ]

# After: 구조화된 CSS 힌트
layout_spec:
  type: flex-column          # flex-column | flex-row | grid | stack
  viewport: 390x844
  regions:
    - id: header
      sticky: top
      height: fixed(56px)
    - id: content
      scroll: vertical
      flex: 1
    - id: bottom-nav
      sticky: bottom
      height: fixed(83px)
```

### 2.2 interactions — 구조화된 이벤트 바인딩

```yaml
# Before: 자연어
interactions:
  - trigger: tap 프로필 버튼
    response: 프로필 화면 이동

# After: 구조화
interactions:
  - trigger: tap
    target: "#profile-button"
    action: navigate
    destination: ProfileScreen
    transition: slide-left
  - trigger: tap
    target: "#like-button"
    action: toggle-state
    state_key: liked
```

### 2.3 states — visible/hidden 컴포넌트 매핑

```yaml
# Before: 단순 리스트
states: [default, empty, loading, error]

# After: 컴포넌트 가시성 매핑
states:
  default:
    description: "콘텐츠 로드 완료"
    active: true
  empty:
    description: "콘텐츠 없음"
    visible_components: [empty-state-view]
    hidden_components: [content-list]
  loading:
    description: "로딩 중"
    visible_components: [skeleton-loader]
    hidden_components: [content-list, empty-state-view]
  error:
    description: "네트워크 오류"
    visible_components: [error-view]
    hidden_components: [content-list]
```

### 2.4 component_tree — HTML 태그 힌트 추가

```yaml
component_tree:
  - id: header
    type: Header
    tag: header
    children:
      - id: back-button
        type: IconButton
        tag: button
        icon: arrow-left
      - id: title
        type: Text
        tag: h1
        content: "피드"
```

### 변경하지 않는 것

- `meta` (task-id, screen name 등)
- `labels` (한국어 UI 텍스트)
- `token_map` (사용되는 디자인 토큰)
- Zero-contamination 원칙
- 메타데이터 품질 스코어

### 제거

- Step B.5 (Library Discovery) — Figma 라이브러리 조회 불필요

---

## 3. HTML 프로토타입 생성 (Step C)

### 3.1 HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{task-id} Prototype</title>
  <style>
    /* === Design Tokens (tokens.css inline) === */
    :root { ... }

    /* === Base: 모바일 프레임 === */
    .device-frame { width: 390px; height: 844px; overflow: hidden; position: relative; }

    /* === Screen 공통 === */
    .screen { display: none; width: 100%; height: 100%; flex-direction: column; }
    .screen.active { display: flex; }

    /* === Transitions === */
    .slide-left-enter { animation: slideLeftIn 0.3s ease; }

    /* === State visibility === */
    [data-state-visible] { display: none; }
    [data-state-visible].state-active { display: flex; }

    /* === Per-screen styles === */
    ...
  </style>
</head>
<body>
  <!-- Control Panel (리뷰어용, device frame 외부) -->
  <div class="control-panel">
    <select id="screen-select">...</select>
    <div class="state-toggles">
      <button data-state="default" class="active">Default</button>
      <button data-state="loading">Loading</button>
      <button data-state="empty">Empty</button>
      <button data-state="error">Error</button>
    </div>
    <div class="breadcrumb">FeedScreen</div>
  </div>

  <!-- Device Frame -->
  <div class="device-frame">
    <section class="screen active" id="FeedScreen">
      <header>...</header>
      <main data-state-visible="default">...</main>
      <main data-state-visible="loading">...</main>
      <main data-state-visible="empty">...</main>
      <nav class="bottom-nav">...</nav>
    </section>

    <section class="screen" id="DetailScreen">
      ...
    </section>
  </div>

  <script>
    function navigate(screenId, transition) { ... }
    function setState(screenId, stateName) { ... }
    // Event bindings from Screen Spec interactions
  </script>
</body>
</html>
```

### 3.2 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 디바이스 프레임 | 390x844 고정 | iPhone 15 기준, RN 앱 시뮬레이션 |
| 스크린 전환 | CSS animation + JS | 네이티브 내비게이션 느낌 (slide, fade) |
| 상태 전환 | Control Panel 토글 | 리뷰어가 모든 상태를 빠르게 확인 |
| 아이콘 | 인라인 SVG 또는 텍스트 placeholder | 외부 의존성 zero |
| 이미지 | placeholder 박스 + 라벨 | 실제 이미지 불필요 (시각적 참조) |
| 폰트 | Pretendard CDN (유일한 외부 의존) | 한국어 타이포 충실도 필수 |

### 3.3 Control Panel

device frame 밖 상단에 위치하는 리뷰 전용 패널:

- **스크린 선택** 드롭다운 — 모든 스크린에 바로 점프
- **상태 토글** 버튼 — 현재 스크린의 상태 전환 (default/loading/empty/error)
- **현재 경로** breadcrumb — 내비게이션 히스토리 표시

### 3.4 산출물

```
sprints/{sprint-id}/prototypes/app/{task-id}/
├── prototype.html          # self-contained HTML
├── prototype.png           # 대표 스크린샷 (첫 스크린 default)
├── screenshots/
│   ├── {ScreenName}-default.png
│   ├── {ScreenName}-loading.png
│   ├── {ScreenName}-empty.png
│   └── {ScreenName}-error.png
└── {ScreenName}.spec.md    # Screen Spec (Step B 산출물)
```

---

## 4. 리뷰 및 승인 흐름

### 4.1 프로세스

```
Step C 완료
  │
  ├─ 1) 자동 스크린샷 캡처 (browse 스킬)
  │     - 각 스크린 × 각 상태별 스크린샷
  │     - prototype.png (default 상태 대표 이미지)
  │
  ├─ 2) 사용자에게 리뷰 요청
  │     - 스크린샷을 대화 내에서 제시
  │     - 로컬 서버 URL 안내 (직접 인터랙션 확인용)
  │
  └─ 3) 사용자 결정
        ├─ approve  → approval-status.yaml 업데이트
        ├─ revise   → 피드백 반영 후 HTML 재생성
        ├─ reject   → prototype reference에서 제외
        └─ skip     → pending 상태로 유지
```

### 4.2 approval-status.yaml

```yaml
FeedScreen:
  status: approved
  prototype: prototype.html#FeedScreen
  screenshot: screenshots/FeedScreen-default.png
  states_captured: [default, loading, empty, error]
```

### 4.3 FE Engineer 핸드오프

태스크 파일의 `## Prototype Reference` 섹션:

```markdown
## Prototype Reference
- **프로토타입**: `prototypes/app/{task-id}/prototype.html`
- **스크린샷**: `prototypes/app/{task-id}/screenshots/`
- **상태**: approved
- **열기**: 브라우저에서 prototype.html 직접 열기 또는 로컬 서버
```

프로토타입은 시각적 참조일 뿐, 구현은 React Native로 네이티브 작성.

---

## 5. Design Engineer 프로토콜 변경 요약

### Step A (Context Engine) — 변경 최소

| 항목 | 기존 | 변경 |
|------|------|------|
| WHY/WHAT/HOW 레이어 | 유지 | 유지 |
| 디자인 토큰 수집 | Figma library + JSON | JSON only |
| 추가 | — | `tokens.css` 생성 |
| 산출물 | `context-engine.yaml` | `context-engine.yaml` + `tokens.css` |

### Step B (UX Decomposition) — 포맷 변경

| 항목 | 기존 | 변경 |
|------|------|------|
| layout_spec | ASCII 다이어그램 | CSS 레이아웃 힌트 |
| interactions | 자연어 | 구조화 (trigger/target/action/destination) |
| states | 단순 리스트 | visible/hidden 컴포넌트 매핑 |
| component_tree | type만 | tag 힌트 + id 추가 |
| Library Discovery (B.5) | Figma 라이브러리 조회 | 제거 |

### Step C (Prototype Generation) — 완전 교체

| 항목 | 기존 | 변경 |
|------|------|------|
| 도구 | `use_figma` MCP | Write 도구 (HTML 파일 생성) |
| 산출물 | Figma URL + 스크린샷 | `prototype.html` + 스크린샷 |
| 리뷰 | Figma 브라우저 | 로컬 브라우저 + 자동 스크린샷 |
| 승인 기록 | figma_url 기반 | prototype.html#anchor 기반 |

### 제거되는 것

- Figma MCP 의존성 (`use_figma`, `search_design_system`, `importComponentByKeyAsync`)
- `library-catalog.yaml` (Step B.5)
- `figma-link.md`
- Figma 라이브러리 allowlist 관리

### 유지되는 것

- Zero-contamination 원칙
- Context Engine 3-layer 구조 (WHY/WHAT/HOW)
- 사용자 승인 게이트 (approve/revise/reject/skip)
- `approval-status.yaml` 흐름
- FE Engineer 핸드오프 구조 (`## Prototype Reference`)
- 메타데이터 품질 스코어
