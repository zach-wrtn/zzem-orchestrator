# Prototype Pipeline Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sprint Phase 3(Prototype) 파이프라인에 huashu-design 레퍼런스에서 검증된 4가지 패턴(Anti-Slop Self-Audit / Assumption Preview / Playwright Click-Test Verifier / Imagery & Asset Protocol)을 이식하여, Figma 보정 없이도 고품질 프로토타입을 안정적으로 산출한다.

**Architecture:** 4개 Phase가 각자 독립 커밋 가능한 단위. Phase 1·2·4는 에이전트 프로토콜(.md) + 템플릿 변경으로 DE 동작을 바꾸고, Phase 3만 실제 코드(puppeteer 기반 TS verifier + vitest 테스트)를 추가한다. 각 Phase는 Phase 0 없이도 독립 실행 가능하지만 권장 순서는 1 → 2 → 3 → 4 (효용/리스크 순).

**Tech Stack:** Markdown (프로토콜), YAML (context-engine 스키마), TypeScript + puppeteer (verifier), vitest (단위 테스트), pnpm 스크립트 (CI 훅).

---

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/teammates/design-engineer.md` | Modify | Step C.2에 Pass 6 Anti-Slop Audit 체크리스트 삽입 |
| 1 | `.claude/teammates/design-engineer.md` | Modify | Activity Logging 표에 `anti_slop_audit` 로깅 포인트 추가 |
| 2 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2.5 Assumption Preview 체크포인트 삽입 |
| 2 | `.claude/teammates/design-engineer.md` | Modify | Step B 뒤에 Step B.6 Assumption Preview 산출 규칙 삽입 |
| 2 | `sprint-orchestrator/templates/assumption-preview-template.md` | Create | Preview 문서 템플릿 |
| 3 | `sprint-gallery/scripts/verify-prototype.ts` | Create | 프로토타입 HTML 클릭 smoke-test CLI |
| 3 | `sprint-gallery/tests/verify-prototype.test.ts` | Create | verifier 단위 테스트 (vitest) |
| 3 | `sprint-gallery/tests/fixtures/prototype-good.html` | Create | 양호 프로토타입 픽스처 |
| 3 | `sprint-gallery/tests/fixtures/prototype-broken.html` | Create | 콘솔 에러가 있는 깨진 픽스처 |
| 3 | `sprint-gallery/package.json` | Modify | `verify:prototypes` 스크립트 + `build` 체인 삽입 |
| 4 | `.claude/teammates/design-engineer.md` | Modify | Step A에 A.5 Asset Layer 블록 삽입 |
| 4 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2 Frozen Snapshot에 Asset 섹션 추가 |
| 4 | `sprint-orchestrator/templates/context-engine-template.yaml` | Create | context-engine.yaml 공식 스키마 (assets 포함) |

각 Phase의 변경은 이전 Phase의 산출물을 읽지 않는다 — 독립 실행 가능. 단 Phase 4의 `context-engine-template.yaml`은 Phase 2의 assumption-preview와 동일한 `templates/` 디렉토리에 위치하므로 서로 충돌하지 않게 이름 충돌만 피한다.

---

## Phase 1 — Anti-Slop Self-Audit (Pass 6)

Design Engineer의 HTML 생성 Pass 6 "Polish"를 기계적 체크리스트로 강제하여 자주 반복되는 AI-slop 패턴(토큰 밖 hex, emoji 아이콘, 카드 왼쪽 컬러 보더, Pretendard 외 폰트)을 DE가 제출 전에 스스로 제거하도록 한다.

### Task 1.1: Design Engineer C.2 "Pass 6 Anti-Slop Self-Audit" 삽입

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (Step C.2 HTML Generation Passes 표 직후, Phase α/β 입출력 표 앞)

- [ ] **Step 1: 삽입 위치 앵커 확인**

Run: `grep -n "Pass 6: Polish" .claude/teammates/design-engineer.md`
Expected: 한 줄만 매치 (C.2 표 내부). 매치 수가 1이 아니면 STOP — 파일 구조가 예상과 다름.

- [ ] **Step 2: Pass 6 Anti-Slop Audit 섹션 추가**

`.claude/teammates/design-engineer.md`에서 다음 블록(C.2 표 종료 직후, "**Phase α 입력/출력**:" 바로 앞)에 삽입 (나의 외곽 펜스 4-backtick은 네스트된 ```bash 를 포함하기 위함 — 실제 삽입 시 바깥 ````markdown 와 닫는 ```` 를 제외한 내용만 붙여넣는다):

````markdown
### C.2.1 Pass 6 Anti-Slop Self-Audit (필수)

Pass 6 "Polish" 완료 조건. 아래 7개 체크 중 하나라도 실패하면 prototype.html을 저장하지 않고 원인을 수정한 뒤 재실행한다.

| # | 체크 | 실패 시 조치 |
|---|------|------------|
| 1 | `#[0-9A-Fa-f]{6}` hex 색상이 tokens.css에 정의되지 않은 값으로 HTML에 등장하는가 | 해당 hex → `var(--color-*)` 로 교체. 매핑이 없으면 DE가 임의 생성 금지 → Sprint Lead에 토큰 누락 보고 |
| 2 | Unicode emoji가 인터랙티브 요소(button, tab, nav)의 아이콘으로 사용되었는가 (`<button>🔔</button>` 등) | 기호 placeholder(`←`, `⋮`, `♡`, `+`) 또는 inline SVG로 교체. body 텍스트 내 이모지는 허용 |
| 3 | `.card` 계열 요소에 `border-left: Npx solid var(--*)` 스타일이 있는가 (Material/Tailwind slop) | 제거. 강조가 필요하면 `box-shadow` 또는 배경 fill 사용 |
| 4 | `font-family`를 `Pretendard` 외로 명시한 CSS 규칙이 있는가 (인라인 스타일 포함) | `--font-family-default` 로 통일. `JetBrains Mono`는 라틴 전용 mono 블록에 한해 허용 |
| 5 | `linear-gradient(... #8752FA ...)` 등 브랜드 보라색을 그라디언트로 배경 전면에 사용했는가 | 단색 fill 또는 토큰화된 표면으로 교체. 그라디언트는 DESIGN.md §4에 명시된 경우에만 |
| 6 | `<img src>` 없이 `<div class="placeholder-image">`가 화면의 **주 콘텐츠** 위치(피드 카드 썸네일, 프로필 아바타, 밈 이미지)를 차지하고 있는가 | Phase 4의 Asset Layer(`context-engine.yaml` `assets:`)가 있으면 실제 파일 경로로 교체; 없으면 Sprint Lead에 stop-and-ask |
| 7 | Pass 1~5에서 생성된 DOM 중 `[onclick]` 또는 `addEventListener`로 바인딩된 요소 수가 Screen Spec `interactions` 엔트리 수와 불일치하는가 | 누락된 이벤트 바인딩을 추가하거나, 스펙의 interaction을 삭제하여 정합성 맞춤 |

**자동화 힌트**: 체크 1·2·4는 `grep -E`로 기계 검출 가능 (아래 shell 블록 참조). 체크 3·5·6은 DE가 수동 검토. 체크 7은 DOM 파싱 필요 — Phase 3의 `verify-prototype.ts`가 커버.

```bash
# Pass 6 시작 직전 DE가 실행할 수 있는 자가 검사 커맨드(제안):
grep -oE '#[0-9A-Fa-f]{6}' prototype.html | sort -u > /tmp/proto-hex.txt
grep -oE '#[0-9A-Fa-f]{6}' ../../prototypes/context/tokens.css | sort -u > /tmp/tokens-hex.txt
comm -23 /tmp/proto-hex.txt /tmp/tokens-hex.txt   # 차집합이 비어있어야 통과
```

**결과 기록**: audit 완료 시 `approval-status.yaml` 의 해당 스크린 엔트리에 `anti_slop_audit: passed` 필드 추가. 실패 수정 이력이 있으면 `anti_slop_fixes: ["item-N: 설명", ...]`에 누적.
````

- [ ] **Step 3: Activity Logging 표에 로그 포인트 추가**

`.claude/teammates/design-engineer.md`의 "## Activity Logging" 섹션 로깅 포인트 표에 다음 행을 `C. Phase β 완료`와 `완료 보고` 사이에 추가:

```markdown
| C. Pass 6 audit 통과 | `anti_slop_audit` | "Anti-slop audit passed (7/7)" 또는 "Anti-slop audit: {N}건 수정 후 통과" |
```

- [ ] **Step 4: 문서 정합성 검증**

Run: `grep -c "Pass 6" .claude/teammates/design-engineer.md`
Expected: 최소 3회 (기존 C.2 표 + 신규 C.2.1 헤더 + 신규 logging 행). 2회 이하면 삽입 누락.

Run: `grep -n "anti_slop_audit" .claude/teammates/design-engineer.md`
Expected: 최소 2줄 (신규 체크리스트 + logging phase 값).

- [ ] **Step 5: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "docs(de): add Pass 6 anti-slop self-audit checklist

7-point mechanical check before prototype.html is saved:
- non-token hex colors
- emoji as interactive icons
- Material-style card left-border accent
- non-Pretendard font-family
- purple gradient backgrounds
- placeholder-image in primary content slots
- onclick/interactions spec parity

Shell grep hints provided for checks 1/2/4; check 7 covered by
Phase 3 verify-prototype.ts."
```

---

## Phase 2 — Assumption Preview Checkpoint (Phase 3.2.5)

Step B 완료 직후 Step C 시작 전에, DE가 "어떤 가정으로 무엇을 채웠는지"를 얇은 `intent.md` 로 공개하고 Sprint Lead를 통해 사용자 early-review를 받는 선택적 체크포인트를 추가한다. `fabrication_risk >= low` 또는 `context_coverage.why_linked < 1.0` 조건에서만 강제.

### Task 2.1: Assumption Preview 템플릿 생성

**Files:**
- Create: `sprint-orchestrator/templates/assumption-preview-template.md`

- [ ] **Step 1: 템플릿 파일 생성**

다음 내용으로 `sprint-orchestrator/templates/assumption-preview-template.md`를 작성 (외곽 ````markdown 펜스는 네스트된 ```yaml 을 감싸기 위함 — 파일에는 안쪽 내용만 저장):

````markdown
# Assumption Preview: {ScreenName}

> Design Engineer가 Step C(HTML 생성) 시작 전에 공개하는 가정·선택 근거 문서.
> Sprint Lead는 이 문서를 사용자에게 제시하여 조기 승인/보정을 받는다.
> YAML/테이블만 — 산문 금지.

## Meta

```yaml
task_id: "{task-id}"
screen_name: "{ScreenName}"
generated_at: "{ISO8601}"
spec_fabrication_risk: "{none | low | medium}"
spec_context_coverage: "{why_linked 비율}"
```

## Inferred Layout Decisions

PRD/태스크에 명시적으로 없지만 DE가 컴포넌트 배치/계층을 추론한 항목. 각 항목은 근거와 대체 옵션을 동반한다.

```yaml
inferred_layout:
  - decision: "{레이아웃 결정 요약}"
    rationale: "{왜 이 선택 — DESIGN.md §N 또는 pattern {key} 근거}"
    alternatives:
      - "{대안 1 — 이 선택이 맞지 않을 때 사용자가 고를 수 있는 옵션}"
      - "{대안 2}"
    would_break_if: "{이 가정이 틀린 경우 수정 범위 — 예: 'Body 스크롤 구조 전체 재작업'}"
```

## Placeholder / Content Choices

실제 콘텐츠가 없어 DE가 placeholder 또는 샘플 데이터로 채운 위치. 진짜 콘텐츠로 채워야 하는 곳을 명시.

```yaml
placeholders:
  - component_id: "{#html-id}"
    kind: "{image | text | avatar | list-item | ...}"
    current: "{현재 채워진 값 요약}"
    source: "{context-engine.assets.{key} | hardcoded | pattern-default}"
    needs_real_content: "{true | false}"
    note: "{특이사항}"
```

## Interactions Not In PRD

Screen Spec interactions 중 PRD AC에서 직접 도출되지 않은 항목. DE가 패턴/관례로 추가한 것.

```yaml
implicit_interactions:
  - interaction: "{spec interactions[] 의 trigger+target+action 요약}"
    rationale: "{왜 추가 — 예: '리스트는 관례상 pull-to-refresh 필수'}"
    removable: "{true | false — 사용자가 빼라고 했을 때 제거 가능한가}"
```

## Anti-Slop Pre-Check (예상)

Pass 6 audit에서 걸릴 가능성이 있다고 DE가 self-flag한 항목.

```yaml
anti_slop_risks:
  - item: "{체크리스트 번호 1~7}"
    risk: "{예상 실패 원인}"
    mitigation: "{Pass 6 전에 어떻게 해결할지}"
```

## Gate Questions for Sprint Lead

사용자에게 물을 항목 (Sprint Lead가 요약하여 질의).

```yaml
gate_questions:
  - "{질문 1 — yes/no 또는 a/b/c 형식}"
  - "{질문 2}"
```

## User Action

| 선택 | 동작 |
|------|------|
| **proceed** | Step C(HTML 생성) 진행. 가정 모두 승인. |
| **adjust** | 특정 `inferred_layout` 또는 `placeholder` 항목 변경 지시. DE가 Screen Spec을 수정한 뒤 preview 재생성. |
| **stop** | 이 화면의 프로토타입 생성 중단. PRD 보강 필요 — Sprint Lead가 PRD Amendment 트리거. |
````

- [ ] **Step 2: 템플릿 구조 검증**

Run: `grep -c '^```yaml' sprint-orchestrator/templates/assumption-preview-template.md`
Expected: 6 (Meta, inferred_layout, placeholders, implicit_interactions, anti_slop_risks, gate_questions).

- [ ] **Step 3: Commit**

```bash
git add sprint-orchestrator/templates/assumption-preview-template.md
git commit -m "feat(templates): add assumption-preview template for Phase 3.2.5

Machine-readable intent doc DE writes after Step B and before Step C,
exposing layout inferences, placeholder choices, implicit interactions,
and anti-slop risks for early Sprint Lead review."
```

### Task 2.2: Design Engineer Step B.6 Assumption Preview 산출 규칙

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (Step B.5 Self-Review 바로 다음, "---" 구분선 앞)

- [ ] **Step 1: 삽입 위치 앵커 확인**

Run: `grep -n "^### B.5 Self-Review" .claude/teammates/design-engineer.md`
Expected: 한 줄만 매치.

- [ ] **Step 2: Step B.6 섹션 추가**

`.claude/teammates/design-engineer.md`에서 Step B.5 블록 종료 직후, "---" 구분선 앞에 삽입:

```markdown
### B.6 Assumption Preview 산출 (조건부)

Step C 진입 전 Sprint Lead가 early-review 할 수 있도록 `intent.md` 를 산출한다. **아래 트리거 조건 중 하나라도 해당하면 필수, 그렇지 않으면 스킵 가능**:

- `quality_score.fabrication_risk` in `[low, medium]`
- `quality_score.context_coverage.why_linked < 1.0` (UI에 영향을 주는 AC 중 연결되지 않은 것이 있음)
- 태스크 Description에 `preview_required: true` 명시
- 새 컴포넌트(`(new)` 표시)가 2개 이상 등장

**템플릿**: `sprint-orchestrator/templates/assumption-preview-template.md`

**저장 경로**:
`sprints/{sprint-id}/prototypes/app/{task-id}/{ScreenName}.intent.md`

**작성 원칙**:
- Screen Spec 각 섹션을 다시 나열하지 않는다 — Spec에 **없던** 결정만 기록
- `inferred_layout` 항목이 0개이고 `placeholders.needs_real_content: true`가 0개면 preview 생성을 **스킵**하고 로그만 남김 (`phase: preview_skipped`)
- 한 태스크가 여러 Screen을 포함하면 화면별로 파일 분리

**Gate 동작**:
- Step C는 Sprint Lead로부터 `proceed` 수신 시에만 진행
- `adjust` 수신 시 지정된 항목만 Screen Spec에 반영 후 preview 재생성 (최대 2회까지 루프; 초과 시 Sprint Lead에 escalation)
- `stop` 수신 시 `TaskUpdate: blocked` + Sprint Lead에게 PRD 갭 보고

**로깅 포인트** (Activity Logging 표에 다음 행 추가):

| B.6 Preview 생성 | `preview_generated` | "{ScreenName}.intent.md 생성, gate_questions {N}개" |
| B.6 Preview 스킵 | `preview_skipped` | "fabrication_risk none + 전부 PRD 기반 — preview 불필요" |
| B.6 Adjust 수신 | `preview_adjusting` | "Sprint Lead adjust 피드백 {N}건 반영 중" |
```

- [ ] **Step 3: Activity Logging 표에도 동일 행 3개 추가**

`.claude/teammates/design-engineer.md`의 "## Activity Logging" 섹션 표에서 `B. Spec 작성 완료` 다음에 다음 3행 삽입:

```markdown
| B.6 Preview 생성 | `preview_generated` | "{ScreenName}.intent.md 생성, gate_questions {N}개" |
| B.6 Preview 스킵 | `preview_skipped` | "fabrication_risk none — preview 불필요" |
| B.6 Adjust 수신 | `preview_adjusting` | "Sprint Lead adjust 피드백 {N}건 반영 중" |
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -n "B.6 Assumption Preview" .claude/teammates/design-engineer.md`
Expected: 한 줄 이상.

Run: `grep -c "preview_generated\|preview_skipped\|preview_adjusting" .claude/teammates/design-engineer.md`
Expected: 6 이상 (B.6 본문에 3 + Activity Logging 표에 3).

- [ ] **Step 5: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "docs(de): add Step B.6 Assumption Preview protocol

Conditional intent.md output before Step C HTML generation, gated on
fabrication_risk/coverage/new-component triggers. Template at
sprint-orchestrator/templates/assumption-preview-template.md."
```

### Task 2.3: Phase Prototype workflow §3.2.5 추가

**Files:**
- Modify: `.claude/skills/sprint/phase-prototype.md` (§3.2 Design Engineer 스폰 다음, §3.3 리뷰 앞)

- [ ] **Step 1: 삽입 위치 앵커 확인**

Run: `grep -n "^### 3.3 리뷰" .claude/skills/sprint/phase-prototype.md`
Expected: 한 줄만 매치.

- [ ] **Step 2: §3.2.5 섹션 추가**

`.claude/skills/sprint/phase-prototype.md`에서 "### 3.3 리뷰 (Sprint Lead ↔ 사용자)" 바로 앞에 삽입 (외곽 ````markdown 펜스는 네스트된 ``` 블록과 ```json 라인을 감싸기 위함):

````markdown
### 3.2.5 Assumption Preview Gate (조건부)

Step C 진입 전에 DE가 산출한 `{ScreenName}.intent.md`를 사용자에게 제시하여 가정을 조기 검증한다. 조건 및 템플릿은 `.claude/teammates/design-engineer.md` §B.6 참조.

**실행 흐름**:

1. DE가 `{ScreenName}.intent.md`를 생성하면 Sprint Lead는 해당 파일을 Read
2. `gate_questions` 블록을 사용자에게 요약 제시 (3문장 이내):
   ```
   [{ScreenName} 가정 미리보기]
   - 추론 레이아웃 {N}건: {한 줄 요약}
   - Placeholder 위치 {M}건: {한 줄 요약}
   질문:
   - {gate_question 1}
   - {gate_question 2}
   proceed / adjust / stop?
   ```
3. 사용자 응답 처리:

| 선택 | 동작 |
|------|------|
| **proceed** | DE에게 "preview approved, proceed to Step C" 전달. `TaskUpdate: in_progress` 유지. |
| **adjust** | 사용자의 지시를 DE 태스크 Description에 append: `### Preview Adjustments` 블록. DE가 Screen Spec 수정 → intent.md 재생성 → 본 gate 재실행. |
| **stop** | `TaskUpdate: blocked`. PRD 갭 기록: `sprints/{sprint-id}/prototypes/prd-gaps.md`에 갭 항목 append. Phase 3.4 Amendment 추출 대상으로 자동 합류. |

**Auto-Skip 조건**:
- DE 로그에 `phase: preview_skipped` 기록 → gate 통과 간주 (DE가 자체 판단으로 스킵한 케이스)
- `sprint-config.yaml`에 `preview_gate: skip` → 전역 스킵 (CI/배치 모드)

**Adjust 루프 상한**: 동일 Screen에 대해 adjust 2회 초과 시 Sprint Lead가 escalation 결정:
- **continue**: 3회차 허용 (사용자가 명시 동의)
- **switch-to-stop**: preview 포기하고 Step C 직행 (사용자가 "일단 그려보자" 수락)
- **abandon**: Phase 3에서 해당 화면 제외 → rejected 처리

**로깅**: Sprint Lead는 다음을 `logs/events.jsonl`에 append:
- `{"phase":"preview_gate","screen":"{ScreenName}","action":"proceed|adjust|stop","iteration":{N}}`
````

- [ ] **Step 3: Frozen Snapshot 블록에 intent.md 경로 언급 추가**

`.claude/skills/sprint/phase-prototype.md`의 §3.2 "Step 2: 태스크 생성" 내 TaskCreate Description 템플릿에서 "태스크: tasks/app/{task-id}.md" 직후 다음 줄 삽입:

```
    Assumption Preview 산출 경로: sprints/{sprint-id}/prototypes/app/{task-id}/{ScreenName}.intent.md
    Preview 템플릿: sprint-orchestrator/templates/assumption-preview-template.md
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -n "3.2.5 Assumption Preview Gate" .claude/skills/sprint/phase-prototype.md`
Expected: 한 줄 매치.

Run: `grep -c "intent.md" .claude/skills/sprint/phase-prototype.md`
Expected: 3 이상.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sprint/phase-prototype.md
git commit -m "feat(phase-prototype): add §3.2.5 Assumption Preview Gate

Sprint Lead presents DE-authored intent.md to user before Step C HTML
generation when fabrication_risk/coverage triggers fire. proceed /
adjust / stop actions with 2-iteration adjust cap and escalation path."
```

---

## Phase 3 — Playwright-Style Click-Test Verifier

`sprint-gallery/scripts/verify-prototype.ts`를 추가하여 각 `prototype.html`을 headless Chromium(puppeteer)으로 로드하고, (a) 콘솔 에러 0건, (b) unhandled rejection 0건, (c) 모든 `[onclick]` + `.state-toggle` 요소 클릭 후 JS 에러 0건, (d) Screen Spec `interactions` 수와 실제 바인딩 수 일치를 gate로 건다. `pnpm build` 체인에 삽입하여 gallery 배포 전 자동 실행.

### Task 3.1: Fixture HTML 2개 생성 (good + broken)

**Files:**
- Create: `sprint-gallery/tests/fixtures/prototype-good.html`
- Create: `sprint-gallery/tests/fixtures/prototype-broken.html`

- [ ] **Step 1: good fixture 생성**

다음 내용으로 `sprint-gallery/tests/fixtures/prototype-good.html` 작성:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Good Fixture</title>
  <style>
    .device-frame { width: 390px; height: 844px; border: 1px solid #000; }
    .screen { display: none; padding: 16px; }
    .screen.active { display: block; }
    [data-state="loading"] { display: none; }
    [data-state="loading"].active { display: block; }
  </style>
</head>
<body>
  <div class="device-frame">
    <section class="screen active" id="Home">
      <h1>Home</h1>
      <button id="go-detail" onclick="document.getElementById('Home').classList.remove('active'); document.getElementById('Detail').classList.add('active');">Go Detail</button>
      <button id="toggle-loading" class="state-toggle" data-target="loading">Toggle Loading</button>
      <div data-state="loading">Loading…</div>
    </section>
    <section class="screen" id="Detail">
      <h1>Detail</h1>
      <button id="go-back" onclick="document.getElementById('Detail').classList.remove('active'); document.getElementById('Home').classList.add('active');">Back</button>
    </section>
  </div>
  <script>
    document.querySelectorAll('.state-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        document.querySelector(`[data-state="${target}"]`).classList.toggle('active');
      });
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: broken fixture 생성**

다음 내용으로 `sprint-gallery/tests/fixtures/prototype-broken.html` 작성 (의도적으로 존재하지 않는 함수 호출 + 존재하지 않는 element 접근):

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Broken Fixture</title>
</head>
<body>
  <div class="device-frame">
    <section class="screen active" id="Home">
      <button id="broken-btn" onclick="nonExistentFunction()">Click me (broken)</button>
      <button id="null-access" onclick="document.getElementById('ghost').classList.add('x')">Null access</button>
    </section>
  </div>
</body>
</html>
```

- [ ] **Step 3: 픽스처 구조 확인**

Run: `ls sprint-gallery/tests/fixtures/`
Expected: `prototype-broken.html` 과 `prototype-good.html` 둘 다 출현.

- [ ] **Step 4: Commit**

```bash
git add sprint-gallery/tests/fixtures/
git commit -m "test(gallery): add prototype verifier fixtures

Good fixture: 2 screens, working nav + state-toggle pattern.
Broken fixture: intentional ReferenceError + null-access for
verifier regression coverage."
```

### Task 3.2: verify-prototype.ts 구현 (discovery + Puppeteer 검증)

**Files:**
- Create: `sprint-gallery/scripts/verify-prototype.ts`
- Test: `sprint-gallery/tests/verify-prototype.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

다음 내용으로 `sprint-gallery/tests/verify-prototype.test.ts` 작성:

```typescript
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { verifyPrototype } from '../scripts/verify-prototype.js';

const FIXTURES = join(__dirname, 'fixtures');

describe('verifyPrototype', () => {
  it('passes a well-formed prototype with console-clean interactions', async () => {
    const result = await verifyPrototype(join(FIXTURES, 'prototype-good.html'));
    expect(result.status).toBe('pass');
    expect(result.consoleErrors).toEqual([]);
    expect(result.unhandledRejections).toEqual([]);
    expect(result.clickedElements).toBeGreaterThanOrEqual(3);
    expect(result.clickErrors).toEqual([]);
  }, 30_000);

  it('fails a broken prototype with ReferenceError on click', async () => {
    const result = await verifyPrototype(join(FIXTURES, 'prototype-broken.html'));
    expect(result.status).toBe('fail');
    expect(result.clickErrors.length).toBeGreaterThan(0);
    // 둘 중 하나는 broken 버튼 이슈
    const joined = result.clickErrors.join('\n');
    expect(joined).toMatch(/nonExistentFunction|ghost|null/i);
  }, 30_000);
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `cd sprint-gallery && pnpm vitest run tests/verify-prototype.test.ts`
Expected: `Cannot find module '../scripts/verify-prototype.js'` 로 실패.

- [ ] **Step 3: verify-prototype.ts 구현**

다음 내용으로 `sprint-gallery/scripts/verify-prototype.ts` 작성:

```typescript
/**
 * Click-test smoke verifier for sprint prototype.html files.
 *
 * Loads each prototype.html under file:// via puppeteer, listens for console
 * errors + unhandled rejections, then clicks every [onclick] and
 * .state-toggle element. Any JS error during load or click fails the gate.
 *
 * CLI:  pnpm verify:prototypes [--sprint=<slug>] [--fail-fast]
 * Exit: 0 on all-pass, 1 on any failure.
 *
 * If Puppeteer cannot launch (Chromium missing), logs warning and exits 0
 * so CI environments without Chromium don't block the pipeline — matches
 * capture-screenshots.ts policy.
 */
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SPRINTS_DIR, REPO_ROOT } from '../src/lib/paths.js';

export interface VerifyResult {
  file: string;
  status: 'pass' | 'fail' | 'skipped';
  consoleErrors: string[];
  unhandledRejections: string[];
  clickedElements: number;
  clickErrors: string[];
  durationMs: number;
}

const CLICK_SELECTORS = ['[onclick]', '.state-toggle', '[data-state-toggle]'];
const LOAD_TIMEOUT_MS = 15_000;
const WAIT_AFTER_LOAD_MS = 300;

export async function verifyPrototype(htmlPath: string): Promise<VerifyResult> {
  const start = Date.now();
  const result: VerifyResult = {
    file: htmlPath,
    status: 'pass',
    consoleErrors: [],
    unhandledRejections: [],
    clickedElements: 0,
    clickErrors: [],
    durationMs: 0,
  };

  let puppeteer: typeof import('puppeteer');
  try {
    puppeteer = await import('puppeteer');
  } catch {
    result.status = 'skipped';
    result.durationMs = Date.now() - start;
    return result;
  }

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 985 });

    page.on('console', (msg) => {
      if (msg.type() === 'error') result.consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      result.consoleErrors.push(err.message);
    });
    page.on('requestfailed', (req) => {
      // file:// 로컬 리소스 실패만 카운트 (CDN 실패는 무시)
      if (req.url().startsWith('file://')) {
        result.consoleErrors.push(`requestfailed: ${req.url()}`);
      }
    });

    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: 'load',
      timeout: LOAD_TIMEOUT_MS,
    });
    await new Promise((r) => setTimeout(r, WAIT_AFTER_LOAD_MS));

    // 클릭 가능한 요소 수집 (중복 제거)
    const handles = await page.evaluateHandle((selectors: string[]) => {
      const set = new Set<Element>();
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => set.add(el));
      }
      return Array.from(set);
    }, CLICK_SELECTORS);

    const count = await page.evaluate((h) => (h as unknown as Element[]).length, handles);
    result.clickedElements = count;

    for (let i = 0; i < count; i++) {
      try {
        await page.evaluate((h, idx) => {
          const el = (h as unknown as Element[])[idx] as HTMLElement;
          el.click();
        }, handles, i);
        await new Promise((r) => setTimeout(r, 50));
      } catch (err: any) {
        result.clickErrors.push(`#${i}: ${err?.message ?? String(err)}`);
      }
    }

    // 로드 이후 쌓인 콘솔/페이지 에러가 있으면 clickErrors로 승격 (클릭 핸들러 동기 실패)
    if (result.consoleErrors.length > 0) {
      for (const e of result.consoleErrors) result.clickErrors.push(e);
    }
  } finally {
    await browser.close();
  }

  if (result.clickErrors.length > 0 || result.unhandledRejections.length > 0) {
    result.status = 'fail';
  }
  result.durationMs = Date.now() - start;
  return result;
}

interface Target {
  sprintSlug: string;
  protoId: string;
  htmlPath: string;
}

async function findTargets(sprintFilter: string | null): Promise<Target[]> {
  const targets: Target[] = [];
  if (!existsSync(SPRINTS_DIR)) return targets;

  const sprintEntries = await readdir(SPRINTS_DIR, { withFileTypes: true });
  for (const entry of sprintEntries) {
    if (!entry.isDirectory()) continue;
    if (sprintFilter && entry.name !== sprintFilter) continue;

    const appDir = join(SPRINTS_DIR, entry.name, 'prototypes', 'app');
    if (!existsSync(appDir)) continue;

    const protoDirs = await readdir(appDir, { withFileTypes: true });
    for (const proto of protoDirs) {
      if (!proto.isDirectory()) continue;
      const htmlPath = join(appDir, proto.name, 'prototype.html');
      if (!existsSync(htmlPath)) continue;
      targets.push({ sprintSlug: entry.name, protoId: proto.name, htmlPath });
    }
  }
  return targets;
}

function parseArgs(argv: string[]) {
  const sprintArg = argv.find((a) => a.startsWith('--sprint='));
  const sprint = sprintArg ? sprintArg.slice('--sprint='.length) : null;
  const failFast = argv.includes('--fail-fast');
  return { sprint, failFast };
}

async function main() {
  const { sprint, failFast } = parseArgs(process.argv.slice(2));
  const targets = await findTargets(sprint);
  if (targets.length === 0) {
    console.log('verify-prototype: no prototypes found');
    return;
  }

  const results: Array<VerifyResult & { sprintSlug: string; protoId: string }> = [];
  let skipped = false;
  for (const t of targets) {
    const r = await verifyPrototype(t.htmlPath);
    if (r.status === 'skipped') {
      skipped = true;
      console.warn(`verify-prototype: puppeteer unavailable — skipping all targets`);
      break;
    }
    results.push({ ...r, sprintSlug: t.sprintSlug, protoId: t.protoId });
    const rel = relative(REPO_ROOT, t.htmlPath);
    const label = r.status === 'pass' ? '✓' : '✗';
    console.log(`${label} [${r.durationMs}ms] ${rel} — clicked ${r.clickedElements}, errors ${r.clickErrors.length}`);
    if (r.status === 'fail') {
      for (const e of r.clickErrors) console.log(`    ${e}`);
      if (failFast) break;
    }
  }

  if (skipped) {
    process.exit(0);
  }
  const failed = results.filter((r) => r.status === 'fail');
  if (failed.length > 0) {
    console.error(`verify-prototype: ${failed.length}/${results.length} FAILED`);
    process.exit(1);
  }
  console.log(`verify-prototype: ${results.length}/${results.length} passed`);
}

// Only run main() when invoked directly (not when imported for tests)
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('verify-prototype.ts');
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `cd sprint-gallery && pnpm vitest run tests/verify-prototype.test.ts`
Expected: 2 테스트 모두 PASS. (puppeteer 다운로드/런치에 30s 소요 가능 — 타임아웃 30s 설정됨.)

**트러블슈팅**: 
- "Could not find Chromium" → `cd sprint-gallery && pnpm puppeteer browsers install chromium` 실행.
- WSL/CI에서 실패 → 이 스크립트는 puppeteer 실패 시 `status: skipped`를 반환하므로 테스트 2개가 skipped로 나올 수 있다. 이 경우 테스트는 `expect(status).toBe('pass')`에서 실패 → 해당 환경에서는 `vitest` 실행 전에 Chromium 설치를 전제로 한다.

- [ ] **Step 5: Commit**

```bash
git add sprint-gallery/scripts/verify-prototype.ts sprint-gallery/tests/verify-prototype.test.ts
git commit -m "feat(gallery): add verify-prototype click-test smoke verifier

Puppeteer-driven headless check per prototype.html:
- listens for console.error + pageerror + requestfailed(file://)
- clicks every [onclick] / .state-toggle / [data-state-toggle]
- fails on any JS error during load or click

CLI: pnpm verify:prototypes [--sprint=slug] [--fail-fast]
Exits 0 when puppeteer unavailable (same policy as
capture-screenshots.ts)."
```

### Task 3.3: package.json 스크립트 + build 체인 통합

**Files:**
- Modify: `sprint-gallery/package.json`

- [ ] **Step 1: 현재 scripts 영역 확인**

Run: `cat sprint-gallery/package.json`
Expected: `"scripts"` 객체 안에 `"build": "pnpm run sync:tokens && pnpm run validate:tokens && pnpm run capture:screenshots && pnpm run copy:prototypes && astro build"` 존재.

- [ ] **Step 2: verify:prototypes 스크립트 추가 + build 체인 수정**

`sprint-gallery/package.json`의 `scripts` 객체를 다음과 같이 수정:

- 기존 `"build": "pnpm run sync:tokens && pnpm run validate:tokens && pnpm run capture:screenshots && pnpm run copy:prototypes && astro build"`
- 변경 후: `"build": "pnpm run sync:tokens && pnpm run validate:tokens && pnpm run verify:prototypes && pnpm run capture:screenshots && pnpm run copy:prototypes && astro build"`
- `"copy:prototypes": "tsx scripts/copy-prototypes.ts"` 다음 줄에 추가: `"verify:prototypes": "tsx scripts/verify-prototype.ts"`

적용 후 `scripts` 블록은 다음과 같아야 한다:

```json
"scripts": {
  "dev": "astro dev",
  "validate:tokens": "tsx scripts/validate-tokens.ts",
  "build": "pnpm run sync:tokens && pnpm run validate:tokens && pnpm run verify:prototypes && pnpm run capture:screenshots && pnpm run copy:prototypes && astro build",
  "preview": "astro preview",
  "copy:prototypes": "tsx scripts/copy-prototypes.ts",
  "verify:prototypes": "tsx scripts/verify-prototype.ts",
  "capture:screenshots": "tsx scripts/capture-screenshots.ts",
  "sync:tokens": "tsx scripts/sync-tokens.ts",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

- [ ] **Step 3: 전체 스크립트 실행 — 회귀 확인**

Run: `cd sprint-gallery && pnpm run verify:prototypes`
Expected: 현재 커밋된 모든 prototype.html에 대해 pass 또는 skipped 출력. Chromium 미설치면 skipped로 exit 0 — OK.

만약 기존 prototype.html 중 1개라도 fail → Phase 3는 거기서 멈추고 별도 수정 태스크 발행. 본 계획 범위 밖.

- [ ] **Step 4: vitest 전체 실행**

Run: `cd sprint-gallery && pnpm test`
Expected: 기존 테스트 + `verify-prototype.test.ts` 모두 PASS.

- [ ] **Step 5: Commit**

```bash
git add sprint-gallery/package.json
git commit -m "chore(gallery): wire verify:prototypes into build chain

Build order: sync-tokens → validate-tokens → verify:prototypes →
capture-screenshots → copy-prototypes → astro build. Prototype
click-test gate runs before thumbnails so broken prototypes are
caught before gallery publish."
```

---

## Phase 4 — Imagery & Asset Layer

`context-engine.yaml`에 `assets:` 레이어를 추가하여, 피드 썸네일·아바타·밈 이미지처럼 placeholder로 때우면 품질이 크게 깎이는 슬롯의 실제 asset 소스를 고정한다. DE는 이 레이어를 기반으로 `<img src="...">`를 생성하고, 소스가 없으면 Sprint Lead에 stop-and-ask.

### Task 4.1: context-engine-template.yaml 생성

**Files:**
- Create: `sprint-orchestrator/templates/context-engine-template.yaml`

- [ ] **Step 1: 템플릿 생성**

다음 내용으로 `sprint-orchestrator/templates/context-engine-template.yaml` 작성:

```yaml
# Context Engine Template (v1)
#
# Design Engineer Step A 산출물 스키마. 실제 인스턴스는
#   sprints/{sprint-id}/prototypes/context/context-engine.yaml
# 에 저장된다. 이 파일은 스키마 참조용이며 placeholder 값은
# {중괄호} 표기로 마킹한다.
#
# 3 레이어 구조: WHY / WHAT / HOW + assets 레이어 (v1 추가)

meta:
  sprint_id: "{sprint-id}"
  task_id: "{task-id}"
  generated_at: "{ISO8601}"
  schema_version: "1.0"

# ─────────────────────────────
# Layer 1: WHY (Business Intent)
# ─────────────────────────────
why:
  product_intent: "{이 기능이 해결하는 사용자 문제}"
  target_user: "{주요 사용자 유형}"
  success_metric: "{PRD에 명시된 성공 지표}"
  user_stories:
    - id: "US-{N}"
      as_a: "{사용자}"
      i_want: "{행동}"
      so_that: "{기대 효과}"
  acceptance_criteria:
    - id: "AC-{N}"
      given: "{전제}"
      when: "{행동}"
      then: "{결과}"
      ui_impact: "{UI 영향 요약 or null}"

# ─────────────────────────────
# Layer 2: WHAT (Design System)
# ─────────────────────────────
what:
  tokens_needed:
    colors: ["{semantic.xxx}"]
    typography: ["{heading/h2}", "{body/body1}"]
    spacing: ["{4}", "{8}", "{16}"]
    radius: ["{sm}", "{md}"]
  components_needed:
    - name: "{ComponentName}"
      category: "{navigation | content | input | feedback | layout}"
  patterns_needed:
    - name: "{PatternName}"
      description: "{패턴 설명}"

# ─────────────────────────────
# Layer 3: HOW (Orchestration)
# ─────────────────────────────
how:
  composition_rules:
    - rule: "{조합 규칙}"
      applies_to: ["{ScreenName}"]
  conditional_rendering:
    - condition: "{분기 조건}"
      variant_a: "{내용 A}"
      variant_b: "{내용 B}"
  constraints:
    - "{제약 1}"
  priority_order:
    - "{최상위 요소}"

# ─────────────────────────────
# Layer 4: ASSETS (Imagery Sources, v1 추가)
# ─────────────────────────────
# 정직성 원칙:
#   - 실제 src 경로가 확정된 asset만 기록한다 (추측 금지)
#   - 소스가 없으면 해당 키를 생략하고 DE가 Sprint Lead에 stop-and-ask
#   - needs_real_content: true 는 "placeholder 금지" 선언
#
# 카테고리별 fallback 순서 (왼쪽일수록 우선):
#   avatar         : user-provided > KB sample > app-core-packages/ds/avatars > ask
#   feed_thumb     : user-provided > Figma node screenshot > ask
#   meme_image     : user-provided > KB sample_image > ask
#   icon           : @wrtn/icons inline SVG > text placeholder (←, ⋮, ♡)
#   hero_banner    : user-provided > ask (placeholder 금지)
assets:
  avatars:
    source: "{path glob or asset pack reference}"
    count: "{N}"
    license: "{internal-test | public-domain | user-provided}"
    needs_real_content: false   # true 일 때 Pass 6 #6 fails with placeholder-image
  feed_thumbnails:
    source: "{path glob}"
    license: "{internal-test | ...}"
    needs_real_content: true
  meme_images:
    source: "{path or null}"
    license: "{...}"
    needs_real_content: true
  icons:
    source: "{@wrtn/icons or inline SVG file}"
    fallback: "text-placeholder"
  hero_banners:
    source: "{path or null}"
    needs_real_content: true
```

- [ ] **Step 2: 스키마 기본 파싱 확인**

Run: `python3 -c "import yaml; yaml.safe_load(open('sprint-orchestrator/templates/context-engine-template.yaml'))" && echo OK`
Expected: `OK` 출력 — YAML 구문 유효.

- [ ] **Step 3: Commit**

```bash
git add sprint-orchestrator/templates/context-engine-template.yaml
git commit -m "feat(templates): add context-engine-template.yaml with assets layer

4-layer schema (WHY/WHAT/HOW/ASSETS). Assets layer declares imagery
sources for 5 slot categories (avatars, feed_thumbnails, meme_images,
icons, hero_banners) with honesty rule: no entry = stop-and-ask."
```

### Task 4.2: Design Engineer Step A.5 Asset Layer 추가

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (Step A 내부, A.4 디자인 토큰 CSS 변환 다음)

- [ ] **Step 1: 삽입 위치 앵커 확인**

Run: `grep -n "### A.4 디자인 토큰 CSS 변환" .claude/teammates/design-engineer.md`
Expected: 한 줄만 매치.

Run: `grep -n "^## Step B: UX Decomposition" .claude/teammates/design-engineer.md`
Expected: 한 줄만 매치 (A 끝 직후 위치).

- [ ] **Step 2: A.5 Asset Layer 섹션 추가**

`.claude/teammates/design-engineer.md`에서 A.4 섹션 종료 직후, Step B 시작("## Step B: UX Decomposition") 바로 앞(그리고 기존 "---" 구분선 앞)에 삽입 (외곽 ````markdown 펜스는 네스트된 ``` 경고 블록을 감싸기 위함):

````markdown
### A.5 Asset Layer 조립 (v1 추가)

시각적 품질을 좌우하는 **이미지 슬롯**(피드 썸네일·아바타·밈 이미지·hero banner)을 placeholder로 때우면 Figma 수준 품질에서 멀어진다. Step A 산출물인 `context-engine.yaml`에 `assets:` 레이어를 조립한다.

**5개 슬롯 카테고리 + fallback 순서**:

| 카테고리 | fallback 우선순위 | placeholder 허용 여부 |
|---------|------------------|-------------------|
| `avatars` | user-provided → KB sample → `app-core-packages/ds/avatars/` → Sprint Lead 질의 | ✗ 주 콘텐츠 위치면 금지 |
| `feed_thumbnails` | user-provided → Figma node screenshot → Sprint Lead 질의 | ✗ |
| `meme_images` | user-provided → KB `sample_image` 패턴 → Sprint Lead 질의 | ✗ |
| `icons` | `@wrtn/icons` inline SVG → 기호 placeholder(`←`, `⋮`, `♡`, `+`) | ✓ 기호 placeholder는 허용 |
| `hero_banners` | user-provided → Sprint Lead 질의 | ✗ |

**조립 규칙 (stop-and-ask 원칙)**:
- 슬롯에 실제 src 경로가 확정된 경우에만 `assets:` 에 기록. 추측 경로 금지
- 확정되지 않은 슬롯은 키를 **생략**하고 Sprint Lead에 보고:
  ```
  ⚠ Asset missing: {slot_category} for task {task-id}.
  Fallback chain exhausted. 다음 중 하나 필요:
    - 실제 이미지 파일 경로
    - Figma node URL
    - "placeholder 허용" 명시 승인
  ```
- Sprint Lead의 명시적 "placeholder 허용" 승인이 있을 때만 Pass 6 audit #6을 `needs_real_content: false`로 기록하여 통과

**Pass 6 Anti-Slop Audit 체크 6과의 연결**:
- `prototype.html`에서 `<div class="placeholder-image">`가 화면의 주 콘텐츠 슬롯에 존재 + `context-engine.yaml assets.{slot}.needs_real_content: true` → **Pass 6 실패** → HTML 저장 금지
- `needs_real_content: false` (명시 승인) → 통과

**저장 경로**: `sprints/{sprint-id}/prototypes/context/context-engine.yaml` 의 `assets:` 블록.

**템플릿 참조**: `sprint-orchestrator/templates/context-engine-template.yaml` § `assets`.

**Zero-Contamination**: asset 경로는 파일시스템에서 존재 확인된 것만. 가상 경로/미래 경로/"나중에 채워질" 경로를 `source:` 에 쓰지 않는다.
````

- [ ] **Step 3: 결과물 저장 트리 업데이트**

`.claude/teammates/design-engineer.md`의 "## 결과물 저장" 섹션 ASCII 트리에서 `context-engine.yaml` 주석을 업데이트. 기존:

```
│   ├── context-engine.yaml              # Step A 산출물 (Context Engine)
```

→ 변경:

```
│   ├── context-engine.yaml              # Step A 산출물 (WHY/WHAT/HOW + assets 4-layer)
```

- [ ] **Step 4: Activity Logging 표에 asset 조립 로그 포인트 추가**

`.claude/teammates/design-engineer.md`의 "## Activity Logging" 섹션 로깅 포인트 표에서 `A. Context Engine 조립` 행 다음에 추가:

```markdown
| A.5 Asset 조립 | `assets_resolved` | "assets: avatars({N}) feed_thumbs({M}) icons({K}) — {P}건 Sprint Lead 질의 대기" |
| A.5 Asset 미해결 | `assets_pending` | "⚠ {slot_category} src 미확정 — fallback 체인 소진" |
```

- [ ] **Step 5: 정합성 검증**

Run: `grep -n "### A.5 Asset Layer 조립" .claude/teammates/design-engineer.md`
Expected: 한 줄 매치.

Run: `grep -c "needs_real_content" .claude/teammates/design-engineer.md`
Expected: 3 이상 (A.5 본문 + Pass 6 연결 설명 + 로그 주석).

- [ ] **Step 6: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "docs(de): add Step A.5 Asset Layer assembly protocol

5 imagery slot categories with fallback chains + stop-and-ask honesty
rule: no entry = missing asset report to Sprint Lead. Links to Pass 6
anti-slop audit check #6 for placeholder-image gating."
```

### Task 4.3: Phase Prototype Frozen Snapshot asset 섹션

**Files:**
- Modify: `.claude/skills/sprint/phase-prototype.md` (§3.2 Step 1 Frozen Snapshot 조립)

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "Step 1: Frozen Snapshot 조립" .claude/skills/sprint/phase-prototype.md`
Expected: 한 줄 매치.

- [ ] **Step 2: Snapshot 조립 체크리스트에 Asset 섹션 추가**

`.claude/skills/sprint/phase-prototype.md`의 Step 1 snapshot 조립 목록(현재 3개 항목)에 4번째 항목 추가:

기존:
```
3. `zzem-kb:read type=pattern category=design_proto` (+ `design_spec`)
   → 관련 디자인 패턴 .yaml 파일 경로 리턴 → Read로 인라인 포함
```

그 뒤에 다음 블록 삽입:

```
4. `zzem-kb:read type=asset category=sample_image` (존재 시)
   → 피드 썸네일·아바타 등 재사용 가능한 샘플 asset 목록 리턴
   → `context-engine.yaml assets:` 레이어 조립의 fallback 소스 후보로 사용
```

- [ ] **Step 3: TaskCreate Description 에 context 템플릿 경로 추가**

`.claude/skills/sprint/phase-prototype.md`의 §3.2 Step 2 TaskCreate Description 블록에서 "HTML 템플릿: sprint-orchestrator/templates/html-prototype-template.html" 바로 다음 줄에 추가:

```
    Context Engine 템플릿: sprint-orchestrator/templates/context-engine-template.yaml
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "context-engine-template" .claude/skills/sprint/phase-prototype.md`
Expected: 1 이상.

Run: `grep -c "sample_image" .claude/skills/sprint/phase-prototype.md`
Expected: 1 이상.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sprint/phase-prototype.md
git commit -m "feat(phase-prototype): wire asset sources into Frozen Snapshot

Adds 4th snapshot input (zzem-kb asset category=sample_image) and
surfaces context-engine-template.yaml path in TaskCreate description
so DE can populate the assets: layer without re-reading templates/."
```

---

## Post-Plan Verification

모든 Phase commit 후 1회 실행.

- [ ] **Step 1: 전체 변경 목록 리뷰**

Run: `git log --oneline main..docs/prototype-pipeline-upgrade`
Expected: 10개 전후의 커밋 (Phase별 독립 커밋). 각 Phase가 하나 이상의 커밋을 가진다.

- [ ] **Step 2: 문서 일관성 sanity check**

Run: `grep -l "anti_slop_audit\|preview_generated\|assets_resolved" .claude/teammates/design-engineer.md .claude/skills/sprint/phase-prototype.md`
Expected: 두 파일 모두 매치 (신규 용어가 양쪽에서 상호 참조됨).

- [ ] **Step 3: Sprint-gallery 빌드 회귀 테스트**

Run: `cd sprint-gallery && pnpm install && pnpm run build`
Expected: `verify:prototypes` → `capture:screenshots` → `copy:prototypes` → `astro build` 순으로 실행되어 오류 없이 종료. Chromium 없는 환경이면 verify는 skipped.

**트러블슈팅**: `verify:prototypes` 에서 기존 prototype 중 fail이 나오면 — 이는 본 계획의 성과 검증 순간이다. fail된 프로토타입은 별도 스프린트로 수정 태스크 발행.

- [ ] **Step 4: 참조 무결성**

Run: `for f in assumption-preview-template.md context-engine-template.yaml; do ls -la sprint-orchestrator/templates/$f; done`
Expected: 두 파일 모두 정상 존재 (Phase 2 + Phase 4 산출).

- [ ] **Step 5: PR 초안 준비 (선택)**

`gh pr create --draft`로 초안 PR 생성. 제목: `docs(pipeline): prototype pipeline upgrade from huashu-design`. 본문에 Phase별 변경 요약 + "1번+2번만으로 기대 효과 체감" 롤아웃 권장사항 기재.
