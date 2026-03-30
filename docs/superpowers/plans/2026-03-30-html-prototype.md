# HTML Prototype Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Figma-based prototype generation (Step B.5 + Step C) with self-contained HTML file generation, and optimize Screen Spec format (Step B) for HTML output.

**Architecture:** Modify the Design Engineer's 3-step pipeline: add `tokens.css` generation to Step A, restructure Screen Spec format in Step B for CSS layout hints and structured interactions, replace Figma generation in Step C with single HTML file output per task. Update sprint SKILL.md Phase 3 workflow and approval flow accordingly.

**Tech Stack:** HTML5, CSS3 (Custom Properties), Vanilla JS, browse skill (screenshots)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `.claude/teammates/design-engineer.md` | Replace Steps B.5 and C, update Step A and B |
| Modify | `sprint-orchestrator/templates/screen-spec-template.md` | New Screen Spec format with CSS hints |
| Create | `sprint-orchestrator/templates/html-prototype-template.html` | Reference HTML structure for Step C |
| Modify | `.claude/skills/sprint/SKILL.md` (Phase 3 section) | Update workflow from Figma to HTML |
| Modify | `docs/designs/harness-design.md` | Update Phase 3 description |

---

### Task 1: Update Screen Spec Template

**Files:**
- Modify: `sprint-orchestrator/templates/screen-spec-template.md` (lines 1-276, full rewrite of sections: Layout Spec, States, Interactions, Component Tree)

This task restructures the Screen Spec format so it maps directly to HTML generation.

- [ ] **Step 1: Update the template header**

Change line 3 from Figma reference to HTML:

```markdown
# Screen Spec: {ScreenName}

> Machine-readable 화면 명세. Design Engineer agent가 이 파일을 읽어 HTML 프로토타입을 생성한다.
> 모든 필드는 구조화되어 있으며, 산문(prose)은 사용하지 않는다.
```

- [ ] **Step 2: Update Component Tree section (lines 19-38)**

Add `id` and `tag` hint fields to the tree format:

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
```

- [ ] **Step 3: Update Component Details (lines 40-67)**

Remove `library` field, add `tag` and `id` fields:

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

- [ ] **Step 4: Update Layout Spec section (lines 109-134)**

Replace ASCII diagram with structured CSS layout hints:

```markdown
## Layout Spec

화면의 전체 레이아웃을 구조화된 CSS 힌트로 표현한다.

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
```

- [ ] **Step 5: Update States section (lines 136-173)**

Replace changes-based format with visible/hidden component mapping:

```markdown
## States

화면의 모든 상태를 열거한다. 각 상태별로 표시/숨김 컴포넌트를 명시.

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
```

- [ ] **Step 6: Update Interactions section (lines 175-192)**

Replace natural-language format with structured event bindings:

```markdown
## Interactions

사용자 행동 → 화면 반응을 구조화된 이벤트로 매핑한다.

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
```

- [ ] **Step 7: Remove library references from Quality Score (lines 254-275)**

Update `extraction_accuracy` to remove `with_library_match`:

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

- [ ] **Step 8: Commit**

```bash
git add sprint-orchestrator/templates/screen-spec-template.md
git commit -m "refactor: update Screen Spec template for HTML prototype generation"
```

---

### Task 2: Create HTML Prototype Template

**Files:**
- Create: `sprint-orchestrator/templates/html-prototype-template.html`

A reference template that Design Engineer uses as the base structure for generating HTML prototypes.

- [ ] **Step 1: Create the template file**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TASK_ID}} Prototype</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet">
  <style>
    /* === Design Tokens (tokens.css content inlined here) === */
    :root {
      /* {{TOKENS_CSS}} */
    }

    /* === Reset === */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Pretendard', -apple-system, 'SF Pro', sans-serif;
      background: #f0f0f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
    }

    /* === Control Panel (리뷰어용, device frame 외부) === */
    .control-panel {
      width: 390px;
      background: #1a1a2e;
      color: #e0e0e0;
      border-radius: 12px 12px 0 0;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
    }

    .control-panel__row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .control-panel__label {
      color: #888;
      font-size: 11px;
      min-width: 48px;
    }

    .control-panel select {
      background: #2a2a3e;
      color: #e0e0e0;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 12px;
      flex: 1;
    }

    .control-panel__states {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .control-panel__state-btn {
      background: #2a2a3e;
      color: #888;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .control-panel__state-btn.active {
      background: var(--color-brand-primary, #8752FA);
      color: #fff;
      border-color: var(--color-brand-primary, #8752FA);
    }

    .control-panel__breadcrumb {
      color: #666;
      font-size: 11px;
      font-family: monospace;
    }

    /* === Device Frame === */
    .device-frame {
      width: 390px;
      height: 844px;
      background: var(--color-bg-normal, #FFFFFF);
      overflow: hidden;
      position: relative;
      border: 1px solid #ddd;
      border-radius: 0 0 12px 12px;
    }

    /* === Screen === */
    .screen {
      display: none;
      flex-direction: column;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }

    .screen.active {
      display: flex;
    }

    /* === Transitions === */
    @keyframes slideLeftIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @keyframes slideLeftOut {
      from { transform: translateX(0); }
      to { transform: translateX(-30%); opacity: 0.5; }
    }

    @keyframes slideRightIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    @keyframes slideUpIn {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .transition-slide-left { animation: slideLeftIn 0.3s ease-out; }
    .transition-slide-right { animation: slideRightIn 0.3s ease-out; }
    .transition-slide-up { animation: slideUpIn 0.3s ease-out; }
    .transition-fade { animation: fadeIn 0.2s ease-out; }

    /* === State Visibility === */
    [data-state] {
      display: none;
    }

    [data-state].state-active {
      display: flex;
    }

    /* === Overlay === */
    .overlay-backdrop {
      display: none;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 100;
    }

    .overlay-backdrop.active {
      display: block;
    }

    .overlay-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 101;
    }

    /* === Placeholder (이미지/아이콘) === */
    .placeholder-image {
      background: var(--color-fill-neutral, #F0F1F3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-label-assistive, #8E9199);
      font-size: 12px;
      border-radius: var(--radius-md, 12px);
    }

    .placeholder-icon {
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-label-normal, #212228);
      font-size: 18px;
    }

    /* === Skeleton === */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
      border-radius: var(--radius-sm, 8px);
    }

    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* === Per-screen styles below (generated by Design Engineer) === */
    /* {{SCREEN_STYLES}} */
  </style>
</head>
<body>

  <!-- Control Panel -->
  <div class="control-panel">
    <div class="control-panel__row">
      <span class="control-panel__label">Screen</span>
      <select id="screen-select" onchange="navigateBySelect(this.value)">
        <!-- {{SCREEN_OPTIONS}} -->
      </select>
    </div>
    <div class="control-panel__row">
      <span class="control-panel__label">State</span>
      <div class="control-panel__states" id="state-toggles">
        <!-- {{STATE_BUTTONS}} -->
      </div>
    </div>
    <div class="control-panel__row">
      <span class="control-panel__breadcrumb" id="breadcrumb"><!-- {{INITIAL_SCREEN}} --></span>
    </div>
  </div>

  <!-- Device Frame -->
  <div class="device-frame" id="device-frame">
    <!-- {{SCREENS}} -->
  </div>

  <script>
    // === State ===
    let currentScreen = null;
    let currentState = 'default';
    const navHistory = [];

    // === Navigation ===
    function navigate(screenId, transition = 'slide-left') {
      const target = document.getElementById(screenId);
      if (!target || (currentScreen && currentScreen.id === screenId)) return;

      if (currentScreen) {
        navHistory.push(currentScreen.id);
        currentScreen.classList.remove('active');
        currentScreen.className = currentScreen.className.replace(/transition-\S+/g, '');
      }

      target.classList.add('active');
      if (transition !== 'none') {
        target.classList.add('transition-' + transition);
        target.addEventListener('animationend', function handler() {
          target.classList.remove('transition-' + transition);
          target.removeEventListener('animationend', handler);
        });
      }

      currentScreen = target;
      currentState = 'default';
      applyState(screenId, 'default');
      updateControlPanel();
    }

    function goBack() {
      if (navHistory.length === 0) return;
      const prevId = navHistory.pop();
      const target = document.getElementById(prevId);
      if (!target) return;

      if (currentScreen) {
        currentScreen.classList.remove('active');
      }

      target.classList.add('active', 'transition-slide-right');
      target.addEventListener('animationend', function handler() {
        target.classList.remove('transition-slide-right');
        target.removeEventListener('animationend', handler);
      });

      currentScreen = target;
      currentState = 'default';
      applyState(prevId, 'default');
      updateControlPanel();
    }

    function navigateBySelect(screenId) {
      navigate(screenId, 'fade');
    }

    // === State Toggle ===
    function applyState(screenId, stateName) {
      const screen = document.getElementById(screenId);
      if (!screen) return;

      screen.querySelectorAll('[data-state]').forEach(el => {
        el.classList.toggle('state-active', el.dataset.state === stateName);
      });

      currentState = stateName;
      updateStateButtons();
    }

    function toggleState(stateName) {
      if (!currentScreen) return;
      applyState(currentScreen.id, stateName);
    }

    // === Overlay ===
    function openOverlay(overlayId, transition = 'slide-up') {
      const backdrop = currentScreen.querySelector('.overlay-backdrop');
      const overlay = document.getElementById(overlayId);
      if (!backdrop || !overlay) return;

      backdrop.classList.add('active');
      overlay.classList.add('active');
      if (transition !== 'none') {
        overlay.classList.add('transition-' + transition);
        overlay.addEventListener('animationend', function handler() {
          overlay.classList.remove('transition-' + transition);
          overlay.removeEventListener('animationend', handler);
        });
      }
    }

    function closeOverlay() {
      if (!currentScreen) return;
      const backdrop = currentScreen.querySelector('.overlay-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      currentScreen.querySelectorAll('.overlay-content.active').forEach(el => {
        el.classList.remove('active');
      });
    }

    // === Control Panel ===
    function updateControlPanel() {
      if (!currentScreen) return;

      // Update select
      const select = document.getElementById('screen-select');
      if (select) select.value = currentScreen.id;

      // Update breadcrumb
      const breadcrumb = document.getElementById('breadcrumb');
      if (breadcrumb) {
        const path = [...navHistory, currentScreen.id].join(' → ');
        breadcrumb.textContent = path;
      }

      // Update state buttons
      updateStateButtons();
    }

    function updateStateButtons() {
      document.querySelectorAll('.control-panel__state-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.state === currentState);
      });
    }

    // === Init ===
    document.addEventListener('DOMContentLoaded', () => {
      const firstScreen = document.querySelector('.screen');
      if (firstScreen) {
        firstScreen.classList.add('active');
        currentScreen = firstScreen;
        applyState(firstScreen.id, 'default');
        updateControlPanel();
      }
    });

    // === Event bindings (generated by Design Engineer from Screen Spec interactions) ===
    // {{EVENT_BINDINGS}}
  </script>

</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/html-prototype-template.html
git commit -m "feat: add HTML prototype template for Design Engineer"
```

---

### Task 3: Update Design Engineer Step A (tokens.css generation)

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (lines 94-192, Step A section)

Add tokens.css generation to the Context Engine assembly step.

- [ ] **Step 1: Update WHAT layer description (line 108)**

Change line 108:

Old:
```
│  Layer 2: WHAT (Design System)          │ ← design-tokens/ + library에서 추출
```

New:
```
│  Layer 2: WHAT (Design System)          │ ← design-tokens/에서 추출
```

- [ ] **Step 2: Remove library_key from WHAT schema (lines 146-161)**

Old:
```yaml
  components_needed:
    - name: "{ComponentName}"
      category: "{navigation | content | input | feedback | layout}"
      source: "{library | custom}"
      library_key: "{key | null}"
```

New:
```yaml
  components_needed:
    - name: "{ComponentName}"
      category: "{navigation | content | input | feedback | layout}"
```

- [ ] **Step 3: Add tokens.css generation subsection after A.3 (after line 191)**

Insert after the existing `A.3 Context Engine 저장` section:

```markdown
### A.4 디자인 토큰 CSS 변환

`design-tokens/` JSON 파일을 CSS Custom Properties로 변환하여 `tokens.css`를 생성한다.
HTML 프로토타입이 이 파일을 inline으로 포함한다.

**변환 규칙**:

| JSON key path | CSS variable |
|---------------|-------------|
| `color.brand.primary` | `--color-brand-primary` |
| `color.bg.normal` | `--color-bg-normal` |
| `font.size.body` | `--font-size-body` |
| `spacing.{N}` | `--spacing-{N}` |
| `radius.{name}` | `--radius-{name}` |
| `semantic.label.normal` | `--color-label-normal` |
| `component.button.primary.fill` | `--component-button-primary-fill` |

**생성 예시**:
```css
:root {
  /* Color - Brand */
  --color-brand-primary: #8752FA;
  --color-brand-primary-dark: #A17BFF;

  /* Color - Background */
  --color-bg-normal: #FFFFFF;

  /* Color - Label */
  --color-label-normal: #212228;
  --color-label-alternative: #6B6E76;
  --color-label-assistive: #8E9199;

  /* Color - Line */
  --color-line-normal: #E4E5E9;

  /* Color - Fill */
  --color-fill-neutral: #F0F1F3;
  --color-fill-brand-primary: #8752FA;

  /* Typography */
  --font-family-default: 'Pretendard', -apple-system, 'SF Pro', sans-serif;
  --font-size-heading1: 24px;
  --font-size-heading2: 20px;
  --font-size-body1: 16px;
  --font-size-body2: 14px;
  --font-size-caption: 12px;
  --font-weight-bold: 700;
  --font-weight-medium: 500;
  --font-weight-regular: 400;

  /* Spacing (4px grid) */
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Component Tokens */
  --component-button-primary-fill: #8752FA;
  --component-button-primary-label: #FFFFFF;
  --component-card-fill: #FFFFFF;
  --component-card-radius: 16px;
  --component-input-fill: #F7F8F9;
  --component-input-radius: 12px;
  --component-nav-active: #8752FA;
  --component-nav-inactive: #8E9199;
}
```

**저장 경로**: `sprints/{sprint-id}/prototypes/context/tokens.css`

**Zero-Contamination**: 토큰 값은 `design-tokens/` JSON에서 직접 변환한다. 값을 추측하거나 보완하지 않는다.
```

- [ ] **Step 4: Update A.3 저장 경로 산출물 목록**

Old (line 186):
```
**저장 경로**: `sprints/{sprint-id}/prototypes/context/context-engine.yaml`
```

New:
```
**저장 경로**:
- `sprints/{sprint-id}/prototypes/context/context-engine.yaml`
- `sprints/{sprint-id}/prototypes/context/tokens.css`
```

- [ ] **Step 5: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "feat: add tokens.css generation to Design Engineer Step A"
```

---

### Task 4: Update Design Engineer Step B (Screen Spec format)

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (lines 195-341, Step B section)

Update the spec writing rules and extraction mapping to match the new template.

- [ ] **Step 1: Update B.2 Screen Spec 작성 규칙 (lines 210-228)**

Old (lines 213-214):
```
3. **Layout Spec 필수** — ASCII 다이어그램으로 화면 레이아웃을 시각화
4. **States 전수 나열** — default, empty, loading, error + 화면 특화 상태
```

New:
```
3. **Layout Spec 필수** — CSS 레이아웃 힌트(flex/grid/sticky)로 화면 레이아웃을 구조화
4. **States 전수 나열** — default, empty, loading, error + 화면 특화 상태, visible/hidden 컴포넌트 매핑 포함
```

- [ ] **Step 2: Update extraction mapping table (lines 219-229)**

Old:
```markdown
| 태스크 섹션 | Screen Spec 섹션 | 추출 방법 |
|------------|-----------------|----------|
| `Screens / Components` | Component Tree + Component Details | 컴포넌트 계층 구조화, `(new)` 표시는 새 컴포넌트 |
| `User Interactions` | Interactions | trigger → response → navigation YAML로 변환 |
| `Business Rules` | Visual Rules | UI 영향 규칙만 필터 (서버 로직 제외) |
| `Interaction States` | States | 상태별 changes YAML로 변환 |
| PRD 한국어 텍스트 | Labels (ko) | 버튼/탭/안내문구/토스트/에러 메시지 전수 수집 |
| `design-tokens/` | Token Map | semantic → component → primitive 순 조회 |
| Context Engine WHY | Business Context | AC의 ui_impact를 각 컴포넌트에 연결 |
```

New:
```markdown
| 태스크 섹션 | Screen Spec 섹션 | 추출 방법 |
|------------|-----------------|----------|
| `Screens / Components` | Component Tree + Component Details | 컴포넌트 계층 구조화 + HTML tag/id 힌트 부여, `(new)` 표시는 새 컴포넌트 |
| `User Interactions` | Interactions | trigger/target/action/destination/transition 구조화 YAML로 변환 |
| `Business Rules` | Visual Rules | UI 영향 규칙만 필터 (서버 로직 제외) |
| `Interaction States` | States | 상태별 visible/hidden 컴포넌트 매핑으로 변환 |
| PRD 한국어 텍스트 | Labels (ko) | 버튼/탭/안내문구/토스트/에러 메시지 전수 수집 |
| `design-tokens/` | Token Map | semantic → component → primitive 순 조회 |
| Context Engine WHY | Business Context | AC의 ui_impact를 각 컴포넌트에 연결 |
```

- [ ] **Step 3: Update B.3 Component Details — remove library field (lines 239-248)**

Old:
```yaml
    # === 기존 필드 ===
    position: "{position}"
    size: "{size}"
    library: { ... }
    tokens: { ... }
    children: [...]
```

New:
```yaml
    # === 기존 필드 ===
    id: "{html-element-id}"
    tag: "{HTML tag}"
    position: "{position}"
    size: "{size}"
    tokens: { ... }
    children: [...]
```

- [ ] **Step 4: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "refactor: update Design Engineer Step B for HTML-optimized Screen Spec"
```

---

### Task 5: Remove Step B.5 and Replace Step C in Design Engineer

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (lines 344-617, Steps B.5 + C)

This is the largest change — delete Figma-specific content and replace with HTML generation protocol.

- [ ] **Step 1: Delete Step B.5 entirely (lines 344-412)**

Remove the entire `## Step B.5: Library Discovery` section (lines 342-413, including separator).

- [ ] **Step 2: Replace Step C header and C.1 (lines 416-425)**

Old:
```markdown
## Step C: Prototype Generation (Screen Spec → Figma)

작성된 screen spec 파일과 library catalog를 읽어 Figma 프로토타입을 생성한다.

### C.1 사전 준비

1. **`figma-use` 스킬 로드** (필수)
2. **`figma-generate-design` 스킬 로드** (권장 — 디자인 시스템 연동 워크플로우)
3. **library-catalog.yaml 읽기** — 사용 가능 컴포넌트 확인
4. **context-engine.yaml 읽기** — HOW 레이어의 composition_rules 확인
```

New:
```markdown
## Step C: Prototype Generation (Screen Spec → HTML)

작성된 screen spec 파일과 tokens.css를 읽어 self-contained HTML 프로토타입을 생성한다.

### C.1 사전 준비

1. **`tokens.css` 읽기** — `sprints/{sprint-id}/prototypes/context/tokens.css`
2. **HTML 템플릿 참조** — `sprint-orchestrator/templates/html-prototype-template.html`
3. **context-engine.yaml 읽기** — HOW 레이어의 composition_rules 확인
4. **모든 Screen Spec 읽기** — 해당 태스크의 모든 `{ScreenName}.spec.md` 파일
```

- [ ] **Step 3: Replace C.2 Intent-Driven Multi-Pass with HTML generation passes (lines 427-457)**

Old content: 6-pass Figma generation (Structure → Library → Custom → Content → Validate → Flow)

New:
```markdown
### C.2 HTML Generation Passes

Screen Spec을 HTML로 변환할 때도 단계적으로 구성한다.

```
Pass 1: Structure  — 스크린 프레임 + 레이아웃 구조 생성
  Input: Layout Spec + Component Tree (계층만)
  Output: <section> 구조 + CSS flex/grid 레이아웃

Pass 2: Components — 컴포넌트를 HTML 요소로 변환
  Input: Component Details (tag, id, tokens) + Token Map
  Output: 각 컴포넌트의 HTML + CSS 스타일

Pass 3: Content    — 한국어 라벨 + placeholder 콘텐츠
  Input: Labels (ko) + Component Details (behavior.purpose)
  Output: 텍스트, placeholder 이미지, 아이콘

Pass 4: States     — 상태별 가시성 + state 컨테이너
  Input: States (visible/hidden mapping)
  Output: data-state 속성 + 상태별 대체 콘텐츠 (empty, loading, error)

Pass 5: Interactions — 내비게이션 + 이벤트 바인딩
  Input: Interactions (trigger/target/action/destination)
  Output: JS 이벤트 리스너 + Control Panel 구성

Pass 6: Polish     — 통합 검증 + 미세 조정
  Input: 전체 HTML 결과물
  Output: 최종 prototype.html
```
```

- [ ] **Step 4: Replace C.3 context scoping rules (lines 459-472)**

Old: Pass별 Figma 컨텍스트 스코핑 테이블

New:
```markdown
### C.3 Pass별 컨텍스트 스코핑 규칙

| Pass | 투입 컨텍스트 | 제외 컨텍스트 | 이유 |
|------|-------------|-------------|------|
| 1 Structure | Layout Spec, Tree 계층 | Labels, Token 값, Interactions | 구조에 텍스트/색상 불필요 |
| 2 Components | Component Details (tag, id, tokens), Token Map | Interactions, States | 개별 요소 스타일링에 집중 |
| 3 Content | Labels, behavior.purpose, WHY stories | Token Map, Layout | 텍스트 채우기에 시각 토큰 불필요 |
| 4 States | States (visible/hidden), component tree | Interactions | 상태 분기에만 집중 |
| 5 Interactions | Interactions, Screen 목록 | Token Map, Labels | 이벤트 바인딩에만 집중 |
| 6 Polish | 전체 HTML 결과물 | 개별 Spec 섹션 | 통합 검증에만 집중 |

**원칙**: 적시에 적절한 컨텍스트를 투입한다.
```

- [ ] **Step 5: Delete C.4 through C.9 (lines 474-617)**

Delete the following Figma-specific sections entirely:
- C.4 Library Component 활용 패턴
- C.5 컴포넌트 매핑 기준
- C.6 Figma 파일 구조
- C.7 State Variant 프레임
- C.8 UX Flow Connections (Pass 6)
- C.9 Manual Fallback

- [ ] **Step 6: Add new C.4 HTML 생성 규칙**

Insert after the new C.3:

```markdown
### C.4 HTML 생성 규칙

**파일 구조**: 태스크당 하나의 self-contained HTML 파일.

```
sprints/{sprint-id}/prototypes/app/{task-id}/prototype.html
```

**필수 요소**:

1. **tokens.css inline** — `<style>` 내에 `tokens.css` 내용을 그대로 포함
2. **모바일 프레임** — `.device-frame` 390x844px 고정
3. **스크린 구조** — 각 화면은 `<section class="screen" id="{ScreenName}">` 으로 구분
4. **상태 컨테이너** — `data-state="{stateName}"` 속성으로 상태별 콘텐츠 구분
5. **Control Panel** — device frame 외부에 스크린 선택, 상태 토글, breadcrumb
6. **이벤트 바인딩** — Screen Spec의 interactions를 JS `addEventListener`로 변환

**컴포넌트 렌더링 규칙**:

| Spec type | HTML 렌더링 | CSS |
|-----------|-----------|-----|
| `button-primary` | `<button class="btn-primary">` | `background: var(--component-button-primary-fill); color: var(--component-button-primary-label); border-radius: var(--radius-md); padding: 16px; width: 100%;` |
| `button-secondary` | `<button class="btn-secondary">` | `background: var(--color-fill-neutral); color: var(--color-label-normal); border-radius: var(--radius-md); padding: 16px;` |
| `icon-button` | `<button class="icon-btn">` | 24x24, no background |
| `input` | `<div class="input-field">` | `background: var(--component-input-fill); border-radius: var(--component-input-radius); padding: 12px 16px;` |
| `card` | `<div class="card">` | `background: var(--component-card-fill); border-radius: var(--component-card-radius); padding: 16px;` |
| `avatar` | `<div class="avatar placeholder-image">` | circular, `border-radius: var(--radius-full);` |
| `image` | `<div class="placeholder-image">` | label 텍스트로 용도 표시 |
| `skeleton` | `<div class="skeleton">` | shimmer animation |
| `divider` | `<hr class="divider">` | `border-color: var(--color-line-normal);` |
| `tabs` | `<div class="tab-bar">` | horizontal flex, active tab에 brand color underline |
| `bottom-sheet` | `<div class="overlay-content" id="{Name}">` | overlay-backdrop 내부, slide-up |
| `navigation` | `<nav class="bottom-nav">` | 5-tab flex, sticky bottom |

**아이콘 처리**: 인라인 텍스트 placeholder 사용 (예: `←`, `⋮`, `♡`, `🔔`, `+`). SVG가 필요한 경우 간단한 인라인 SVG로 구성.

**이미지 처리**: `<div class="placeholder-image" style="width:W;height:H">{설명}</div>` 형태로 용도를 텍스트로 표시.

### C.5 Interactions → JS 변환 규칙

Screen Spec의 `interactions` 섹션을 JavaScript 이벤트 바인딩으로 변환한다.

| action | JS 코드 |
|--------|---------|
| `navigate` | `el.addEventListener('click', () => navigate('{destination}', '{transition}'))` |
| `toggle-state` | `el.addEventListener('click', () => toggleState('{state_key}'))` |
| `open-overlay` | `el.addEventListener('click', () => openOverlay('{destination}', '{transition}'))` |
| `close-overlay` | `el.addEventListener('click', () => closeOverlay())` |
| `switch-tab` | 탭 UI 내부 active 클래스 토글 + 콘텐츠 전환 |
| `go-back` | `el.addEventListener('click', () => goBack())` |

### C.6 Control Panel 구성

HTML 상단의 Control Panel은 자동으로 구성된다:

1. **Screen Select** — 모든 `<section class="screen">` 의 id를 `<option>`으로 나열
2. **State Buttons** — 현재 스크린의 Screen Spec `states` 키를 버튼으로 생성
3. **Breadcrumb** — 내비게이션 히스토리를 `→`로 연결하여 표시

### C.7 Manual Fallback

HTML 생성이 실패하면:
1. Screen Spec 파일이 이미 존재하므로, 이것이 성과물이 된다
2. Sprint Lead에게 메시지:
   ```
   HTML 프로토타입 생성 실패. Screen Spec 기반 수동 확인 필요:
   Spec 경로: prototypes/app/{task-id}/{ScreenName}.spec.md
   ```
```

- [ ] **Step 7: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "feat: replace Figma generation with HTML prototype in Design Engineer Step C"
```

---

### Task 6: Update Design Engineer deliverables and constraints

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (lines 620-731, deliverables + logging + constraints)

- [ ] **Step 1: Update 결과물 저장 directory tree (lines 620-636)**

Old:
```
sprint-orchestrator/sprints/{sprint-id}/prototypes/
├── context/
│   └── context-engine.yaml              # Step A 산출물 (Context Engine)
├── library-catalog.yaml                 # Step B.5 산출물
├── app/
│   ├── {task-id}/
│   │   ├── {ScreenName}.spec.md         # Step B 산출물 (machine-readable + quality_score)
│   │   ├── {ScreenName}.png             # Step C 산출물 (Figma 스크린샷)
│   │   ├── {ScreenName}/empty.png       # State variant 스크린샷
│   │   ├── {ScreenName}/loading.png
│   │   └── figma-link.md                # Figma URL
│   └── approval-status.yaml             # 리뷰 상태 추적
└── quality-report.yaml                  # 전체 품질 리포트
```

New:
```
sprint-orchestrator/sprints/{sprint-id}/prototypes/
├── context/
│   ├── context-engine.yaml              # Step A 산출물 (Context Engine)
│   └── tokens.css                       # Step A 산출물 (디자인 토큰 CSS)
├── app/
│   ├── {task-id}/
│   │   ├── {ScreenName}.spec.md         # Step B 산출물 (machine-readable + quality_score)
│   │   ├── prototype.html               # Step C 산출물 (self-contained HTML)
│   │   ├── prototype.png                # 대표 스크린샷 (첫 스크린 default)
│   │   └── screenshots/
│   │       ├── {ScreenName}-default.png
│   │       ├── {ScreenName}-loading.png
│   │       ├── {ScreenName}-empty.png
│   │       └── {ScreenName}-error.png
│   └── approval-status.yaml             # 리뷰 상태 추적
└── quality-report.yaml                  # 전체 품질 리포트
```

- [ ] **Step 2: Update approval-status.yaml format (lines 638-652)**

Old:
```yaml
tasks:
  {task-id}:
    {ScreenName}:
      status: pending
      spec: "{ScreenName}.spec.md"
      figma_url: "https://figma.com/design/..."
      screenshot: "{ScreenName}.png"
      quality_score: "{schema_completeness score}"
      fabrication_risk: "{none | low | medium}"
      reviewed_at: null
      notes: ""
```

New:
```yaml
tasks:
  {task-id}:
    {ScreenName}:
      status: pending
      spec: "{ScreenName}.spec.md"
      prototype: "prototype.html#{ScreenName}"
      screenshot: "screenshots/{ScreenName}-default.png"
      states_captured: [default, loading, empty, error]
      quality_score: "{schema_completeness score}"
      fabrication_risk: "{none | low | medium}"
      reviewed_at: null
      notes: ""
```

- [ ] **Step 3: Update 완료 보고 메시지 (lines 681-686)**

Old:
```
TaskUpdate: completed
Sprint Lead에게: "Prototype {task-id} complete. {N}개 화면 spec 작성 + Figma 생성. 품질 점수: accuracy {X}, completeness {Y}, fabrication_risk: {Z}. 리뷰 대기."
```

New:
```
TaskUpdate: completed
Sprint Lead에게: "Prototype {task-id} complete. {N}개 화면 spec 작성 + HTML 생성. 품질 점수: accuracy {X}, completeness {Y}, fabrication_risk: {Z}. 리뷰 대기. 프로토타입: prototypes/app/{task-id}/prototype.html"
```

- [ ] **Step 4: Update logging table (lines 702-716)**

Old:
```
| B.5 Library Discovery | `library_discovery` | "available 8 / not_available 3 컴포넌트 카탈로그 완료" |
| C. Figma Pass 1-4 | `figma_generating` | "ProfileScreen Pass 2 (Library) 완료" |
| C. Figma Pass 5 | `figma_validating` | "스크린샷 검증 완료, 2건 수정" |
| C. Figma Pass 6 | `flow_connecting` | "12개 인터랙션 플로우 연결 완료" |
```

New:
```
| A. tokens.css 생성 | `tokens_generated` | "tokens.css 생성 완료 (42 variables)" |
| C. HTML Pass 1-3 | `html_generating` | "ProfileScreen Pass 2 (Components) 완료" |
| C. HTML Pass 4-5 | `html_interactions` | "상태 4개 + 인터랙션 12개 바인딩 완료" |
| C. HTML Pass 6 | `html_polishing` | "통합 검증 완료, prototype.html 저장" |
```

- [ ] **Step 5: Update constraints (lines 718-731)**

Remove Figma-specific constraints and add HTML-specific ones:

Old:
```
- **figma-use 스킬 필수**: `use_figma` 호출 전에 반드시 `figma-use` 스킬을 로드
```

New:
```
- **HTML 템플릿 참조**: `sprint-orchestrator/templates/html-prototype-template.html` 구조를 기반으로 생성
- **tokens.css 필수**: Step A에서 생성한 tokens.css를 HTML에 inline 포함
- **Self-Contained**: 외부 의존성 없이 (Pretendard CDN 제외) 단일 HTML 파일로 완결
```

Also remove:
```
- **Intent-Scoped Context**: 각 Generation Pass에 해당 Pass의 의도에 맞는 컨텍스트만 투입한다
```

Add:
```
- **Intent-Scoped Context**: 각 HTML Generation Pass에 해당 Pass의 의도에 맞는 컨텍스트만 투입한다
```

- [ ] **Step 6: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "refactor: update Design Engineer deliverables and constraints for HTML output"
```

---

### Task 7: Update Sprint SKILL.md Phase 3

**Files:**
- Modify: `.claude/skills/sprint/SKILL.md` (lines 145-209, Phase 3 section)

- [ ] **Step 1: Update Phase 3 header (line 148)**

Old:
```
App 태스크의 UI 프로토타입을 Figma에 직접 생성하고 리뷰한다.
```

New:
```
App 태스크의 UI 프로토타입을 self-contained HTML로 생성하고 리뷰한다.
```

- [ ] **Step 2: Update 3.2 Design Engineer spawn (lines 169-179)**

Old:
```
각 대상 태스크에 대해:
```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: <태스크 파일 + figma-prompt-template.md 참조>
  Owner: Design Engineer
```

Design Engineer가 Figma MCP (`use_figma`)로 프로토타입 생성 후 `TaskUpdate: completed`.
```

New:
```
각 대상 태스크에 대해:
```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: <태스크 파일 + html-prototype-template.html 참조>
  Owner: Design Engineer
```

Design Engineer가 HTML 프로토타입을 생성 후 `TaskUpdate: completed`.
```

- [ ] **Step 3: Update 3.3 리뷰 — add HTML review details (lines 181-190)**

Old:
```markdown
각 프로토타입을 사용자에게 순차 리뷰:

| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크에 `## Prototype Reference` 추가 |
| **reject** | 상태 기록, 프로토타입 참조 제외 |
| **revise** | 피드백 → Design Engineer 수정 태스크 할당 |
| **skip** | pending 유지, 다음 화면 |
```

New:
```markdown
각 프로토타입을 사용자에게 순차 리뷰:

**리뷰 방법**:
1. 자동 스크린샷 캡처 (browse 스킬) — 각 스크린 × 각 상태별
2. 스크린샷을 대화 내에서 제시
3. 필요 시 브라우저에서 prototype.html 직접 열어 인터랙션 확인 안내

| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크에 `## Prototype Reference` 추가 |
| **reject** | 상태 기록, 프로토타입 참조 제외 |
| **revise** | 피드백 → Design Engineer 수정 태스크 할당 (HTML 재생성) |
| **skip** | pending 유지, 다음 화면 |

**`## Prototype Reference` 형식** (approve 시 태스크에 추가):
```markdown
## Prototype Reference
- **프로토타입**: `prototypes/app/{task-id}/prototype.html`
- **스크린샷**: `prototypes/app/{task-id}/screenshots/`
- **상태**: approved
```
```

- [ ] **Step 4: Update Phase 3 Output (lines 201-208)**

Old:
```
Sprint Prototype: {sprint-id}
  Generated: {N} screens (Figma)
  Approved: {N}, Pending: {N}, Rejected: {N}

→ Proceeding to Phase 4: Build
```

New:
```
Sprint Prototype: {sprint-id}
  Generated: {N} screens (HTML)
  Approved: {N}, Pending: {N}, Rejected: {N}

→ Proceeding to Phase 4: Build
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sprint/SKILL.md
git commit -m "refactor: update sprint SKILL.md Phase 3 for HTML prototype workflow"
```

---

### Task 8: Update Harness Design Document

**Files:**
- Modify: `docs/designs/harness-design.md` (Phase 3 references)

- [ ] **Step 1: Update Phase 3 description in iteration protocol section**

Find the Phase 3 reference (around line 150) and update:

Old (any reference to):
```
Prototype (Planner+Design)
```

New:
```
Prototype (Planner+Design → HTML)
```

Also update any mention of Figma in the Phase 3 context to HTML.

- [ ] **Step 2: Commit**

```bash
git add docs/designs/harness-design.md
git commit -m "docs: update harness design doc for HTML prototype pipeline"
```

---

### Task 9: Final verification

- [ ] **Step 1: Verify no remaining Figma references in modified files**

```bash
grep -n -i "figma\|use_figma\|figma-use\|importComponent\|library-catalog\|figma-link\|figma_url\|figma-prompt" .claude/teammates/design-engineer.md sprint-orchestrator/templates/screen-spec-template.md .claude/skills/sprint/SKILL.md
```

Expected: No matches (or only the archived template reference).

- [ ] **Step 2: Verify all files reference HTML prototype consistently**

```bash
grep -n "prototype.html\|tokens.css\|html-prototype-template" .claude/teammates/design-engineer.md sprint-orchestrator/templates/screen-spec-template.md .claude/skills/sprint/SKILL.md
```

Expected: Multiple matches confirming consistent references.

- [ ] **Step 3: Verify template HTML is valid**

Open `sprint-orchestrator/templates/html-prototype-template.html` in a browser and confirm:
- Control Panel renders correctly
- Device frame is 390x844
- No JS console errors

- [ ] **Step 4: Commit any fixes if needed, then done**

```bash
git log --oneline -10
```

Expected: 7 commits from this implementation (Tasks 1-8).
