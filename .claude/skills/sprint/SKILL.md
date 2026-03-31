---
name: sprint
description: Harness-driven sprint orchestration with Planner-Generator-Evaluator pattern. Use when the user wants to run a sprint pipeline, or says /sprint.
---

# Sprint — Harness-Driven Orchestration

## Design Principles

> Ref: "Harness Design for Long-Running Agentic Applications" (Anthropic Engineering)

1. **Planner-Generator-Evaluator 분리**: 생성과 평가를 분리. Self-evaluation은 신뢰할 수 없다.
2. **Sprint Contract**: 구현 전 Generator와 Evaluator가 "done" 기준에 합의.
3. **Feature-by-Feature Iteration**: 기능 그룹 단위 반복 루프.
4. **Active Evaluation**: 정적 검사가 아닌, 코드 로직 추적 및 엣지 케이스 탐색.
5. **Deliverable-Focused Spec**: 결과물 중심 명세. 구현 세부사항 사전 지정 금지.
6. **File-Based Handoff**: 에이전트 간 상태 전달은 구조화된 파일 아티팩트로.
7. **Minimal Harness**: 모델이 자체 처리 가능한 부분은 scaffolding 제거.

## Goal

Sprint Lead로서 Planner-Generator-Evaluator 패턴으로 스프린트를 오케스트레이션한다.
- **Planner**: Sprint Lead가 Phase 2에서 deliverable-focused spec 생성
- **Generator**: BE/FE Engineer가 기능 구현
- **Evaluator**: 독립 Evaluator가 active evaluation 수행

## Invocation

```
/sprint <sprint-id>                              # 전체 파이프라인 (Phase 1~6)
/sprint <sprint-id> --phase=init                 # Phase 1
/sprint <sprint-id> --phase=spec                 # Phase 2
/sprint <sprint-id> --phase=prototype            # Phase 3
/sprint <sprint-id> --phase=build                # Phase 4
/sprint <sprint-id> --phase=build --resume       # Phase 4 중간 재시작
/sprint <sprint-id> --phase=pr                   # Phase 5
/sprint <sprint-id> --phase=pr --allow-partial   # FAILED 그룹 제외 PR
/sprint <sprint-id> --phase=retro                # Phase 6 (Retrospective)
/sprint <sprint-id> --continue                   # 같은 스프린트 내 미충족 항목 이어서 진행
/sprint <sprint-id> --follow-up=<prev-sprint-id> # 이전 스프린트 기반 후속 스프린트
/sprint <sprint-id> --status                     # 상태 대시보드
/sprint                                          # 최근 스프린트 자동 감지
```

## Prerequisites

- Agent Teams 활성화: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Teammate 정의: `.claude/teammates/` (be-engineer, fe-engineer, design-engineer, evaluator)
- HTML 프로토타입 템플릿 (Design Engineer용)
- `--follow-up` 사용 시: 이전 스프린트의 `retrospective/` 디렉토리 필수

---

## Phase 1: Init (Sprint Lead solo)

스프린트 디렉토리를 초기화한다.

### Workflow

1. **인자 수집**: `sprint-id`와 `prd-file` 경로. 없으면 사용자에게 질문.
2. **PRD 존재 확인**: `docs/prds/{prd-file}` 확인.
3. **디렉토리 생성**:
   ```
   sprint-orchestrator/sprints/{sprint-id}/
   ├── PRD.md
   ├── sprint-config.yaml
   ├── tasks/
   │   ├── app/.gitkeep
   │   └── backend/.gitkeep
   ├── contracts/.gitkeep
   ├── evaluations/.gitkeep
   ├── prototypes/app/.gitkeep
   └── logs/.gitkeep
   ```
4. **PRD.md**: 원본 링크 + 스코프 요약 자동 생성.
5. **sprint-config.yaml**: 사용자에게 base branch 질문 후 생성.

### Gate → Phase 2

다음 조건 **모두** 충족 시 Phase 2 진입:
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (PRD.md, sprint-config.yaml, tasks/, contracts/, evaluations/, logs/)
- [ ] PRD.md에 원본 PRD 링크 + 스코프 요약 존재
- [ ] sprint-config.yaml에 base branch 설정 존재

### Output
```
Sprint initialized: {sprint-id}
  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Base branches: backend → {base}, app → {base}

→ Proceeding to Phase 2: Spec
```

---

## Phase 2: Spec (Sprint Lead as Planner)

PRD를 **deliverable-focused** 명세로 확장한다.

### Planner 원칙

- **What, not How**: 각 기능이 달성해야 할 결과를 명세. 구현 방법은 Generator가 결정.
- **Testable Criteria**: 모든 AC는 코드로 검증 가능한 형태로 작성.
- **Over-specification 회피**: 구현 세부사항 사전 지정은 오류 cascade 유발.

### Workflow

1. **PRD 분석**: User Story + AC 추출, 비즈니스 목표 파악.
2. **코드베이스 패턴 파악**:
   - Backend: `wrtn-backend/apps/meme-api/src/`
   - App: `app-core-packages/apps/MemeApp/src/`
3. **API Contract 생성**: `api-contract.yaml` (OpenAPI 3.0) — SSOT.
4. **태스크 분해**: `tasks/backend/*.md`, `tasks/app/*.md`
   - 필수 섹션: Target, Context, Objective, Specification, Acceptance Criteria
   - Implementation Hints는 **기존 패턴 참조만** 포함. 구체적 구현 지시 금지.
   - 번호 규칙: 동일 번호 = 병렬, 낮은 번호 = 선행
5. **Evaluation Criteria**: `evaluation/criteria.md` 생성.
   - 그룹별 평가 기준 + Evaluator 캘리브레이션 가이드
6. **자체 검증**: OpenAPI 유효성, AC testability, 순환 의존성 없음.

### Gate → Phase 3

다음 조건 **모두** 충족 시 Phase 3 진입:
- [ ] `api-contract.yaml` 존재 + OpenAPI 3.0 유효성 통과
- [ ] 모든 태스크 파일에 필수 섹션 존재 (Target, Context, Objective, Specification, AC)
- [ ] 태스크 번호 간 순환 의존성 없음
- [ ] 각 AC가 testable (모호한 표현 — "적절한", "빠른" 등 — 금지)
- [ ] Backend 태스크와 App 태스크가 API contract의 동일 endpoint를 참조

**Phase 3 스킵 조건**: app 태스크가 0개이거나, 모든 app 태스크에 `### Screens / Components` 섹션이 없으면 Phase 3를 건너뛰고 Phase 4로 직행.

### Output
```
Sprint Spec: {sprint-id}
  API Contract: {N} endpoints
  Tasks: Backend {N} + App {N}
  Evaluation Criteria: defined

→ Proceeding to Phase 3: Prototype
→ Proceeding to Phase 4: Build (no UI tasks — skipping prototype)
```

---

## Phase 3: Prototype (Sprint Lead + Design Engineer)

App 태스크의 UI 프로토타입을 self-contained HTML로 생성하고 리뷰한다.

### Auto-Skip 조건

다음 중 하나라도 해당하면 Phase 3를 자동 스킵하고 Phase 4로 직행:
- `tasks/app/` 디렉토리에 태스크 파일이 0개
- 모든 app 태스크에 `### Screens / Components` 섹션이 없음
- `sprint-config.yaml`에 `prototype: skip` 설정

스킵 시 출력:
```
Phase 3 skipped: no prototypable UI tasks found
→ Proceeding to Phase 4: Build
```

### Workflow

#### 3.1 태스크 필터

app 태스크 중 `### Screens / Components` 섹션이 있는 태스크만 대상.

#### 3.2 Design Engineer 스폰

각 대상 태스크에 대해:
```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: <태스크 파일 + html-prototype-template.html 참조>
  Owner: Design Engineer
```

Design Engineer가 HTML 프로토타입을 생성 후 `TaskUpdate: completed`.

#### 3.3 리뷰 (Sprint Lead ↔ 사용자)

각 프로토타입을 사용자에게 순차 리뷰:

**리뷰 방법**:
1. 자동 스크린샷 캡처 (browse 스킬) — 각 스크린 × 각 상태별
2. 스크린샷을 대화 내에서 제시
3. 필요 시 브라우저에서 prototype.html 직접 열어 인터랙션 확인 안내

| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크에 `## Prototype Reference` 추가 |
| **reject** | 상태 기록, 프로토타입 참조 제외 |
| **revise** | 아래 Revision 워크플로우 실행 |
| **skip** | pending 유지, 다음 화면 |

**`## Prototype Reference` 형식** (approve 시 태스크에 추가):
```markdown
## Prototype Reference
- **프로토타입**: `prototypes/app/{task-id}/prototype.html`
- **스크린샷**: `prototypes/app/{task-id}/screenshots/`
- **상태**: approved
```

#### 3.3.1 Revision 분기

사용자가 `revise`를 선택하면 Sprint Lead가 피드백 내용으로 보정 규모를 자동 판단한다.

| 분류 | 기준 | 예시 |
|------|------|------|
| **minor** | CSS/콘텐츠 수정 — 구조 변경 없음 | 간격, 색상, 크기, 텍스트, 폰트 |
| **major** | 레이아웃 구조, 컴포넌트, 인터랙션 변경 | 탭 순서, 컴포넌트 추가/삭제, 새 상태, 내비게이션 수정 |

**규칙**: 사용자에게 minor/major를 묻지 않는다. 피드백 내용에서 자동 판단. 애매하면 major로 처리.

#### 3.3.2 Baseline 관리

revise 진입 시 수정 전 스크린샷을 보존하여 before/after 비교에 사용한다.

```
sprints/{sprint-id}/prototypes/app/{task-id}/
├── prototype.html
├── screenshots/                 # 최신 (수정 후)
└── baseline/                    # 수정 전 (revise 시 자동 생성)
```

| 시점 | 동작 |
|------|------|
| 최초 revise 진입 | `screenshots/` → `baseline/` 복사 |
| 연속 revise (baseline 이미 존재) | baseline 유지, screenshots만 갱신 |
| approve | `baseline/` 삭제 |
| reject | `baseline/` → `screenshots/` 복원 후 baseline 삭제 |

#### 3.3.3 Minor Revision (Annotation 방식)

```
1. 사용자 피드백 수집
2. baseline 보존 (3.3.2 규칙)
3. Design Engineer에게 수정 태스크 할당:
   TaskCreate:
     Subject: revise/minor/app/{task-id}
     Description: |
       피드백:
       - {피드백 항목 1}
       - {피드백 항목 2}
       대상 파일: prototypes/app/{task-id}/prototype.html
       변경 스크린: {ScreenName}
     Owner: Design Engineer
4. Design Engineer 수정 완료 후 자동 스크린샷 재캡처
5. Visual Regression 비교 (3.3.5)
6. 사용자 확인 → approve / revise / reject
```

#### 3.3.4 Major Revision (Live Preview 방식)

```
1. baseline 보존 (3.3.2 규칙)
2. 로컬 서버 시작:
   python3 -m http.server 8080 --directory sprints/{sprint-id}/prototypes/app/{task-id}/
   사용자에게 안내: http://localhost:8080/prototype.html
3. Design Engineer에게 수정 태스크 할당:
   TaskCreate:
     Subject: revise/major/app/{task-id}
     Description: |
       모드: live-preview
       피드백:
       - {피드백 항목 1}
       - {피드백 항목 2}
       대상 파일: prototypes/app/{task-id}/prototype.html
       로컬 서버: http://localhost:8080/prototype.html
     Owner: Design Engineer
4. 대화형 수정 루프:
   사용자 피드백 → Design Engineer 수정 → 사용자 새로고침 → 반복
5. 사용자가 "approve" 또는 "이제 됐어" 선언
6. 최종 스크린샷 캡처 + Visual Regression 비교 (3.3.5)
7. 사용자 최종 확인 → approve / revise
8. 로컬 서버 종료
```

#### 3.3.5 Visual Regression (before/after 비교)

minor와 major 모두 수정 후 공통으로 실행.

1. 변경된 스크린만 식별 (전체 스크린 × 전체 상태 재캡처 후 baseline과 비교)
2. 변경된 스크린의 before/after를 side-by-side로 제시:

```markdown
## Revision 비교: {ScreenName}

| Before | After |
|--------|-------|
| baseline/{ScreenName}-default.png | screenshots/{ScreenName}-default.png |

변경 사항:
- {피드백 항목 1 반영}
- {피드백 항목 2 반영}
```

3. 변경되지 않은 스크린은 제시하지 않음

#### 3.3.6 approval-status.yaml 확장

revise를 거친 프로토타입에 revision 추적 필드를 추가:

```yaml
tasks:
  {task-id}:
    {ScreenName}:
      status: approved
      prototype: "prototype.html#{ScreenName}"
      screenshot: "screenshots/{ScreenName}-default.png"
      states_captured: [default, loading, empty, error]
      revision_count: 2          # revise 횟수 (0이면 1회에 approve)
      last_revision: "minor"     # 마지막 revise 유형 (minor | major | null)
      quality_score: "{schema_completeness score}"
      fabrication_risk: "{none | low | medium}"
      reviewed_at: null
      notes: ""
```

#### 3.4 PRD Amendment Extraction

revision이 발생한 스프린트에서 PRD 갭을 역추출하여 개정안을 생성한다.

**Auto-Skip 조건**: `approval-status.yaml`에서 `revision_count >= 1`인 화면이 0개이면 스킵.

스킵 시 출력:
```
Phase 3.4 skipped: no revisions occurred — PRD amendment not needed
```

**입력 데이터**:
- `approval-status.yaml` — revision_count, last_revision, fabrication_risk per screen
- 각 revision 태스크의 Description (피드백 항목 목록)
- Before/After 스크린샷 (`baseline/` vs `screenshots/`)
- 원본 PRD의 관련 AC (Given/When/Then)
- 원본 태스크 spec의 `### Screens / Components` 섹션

**분석 로직**:

| Revision 시그널 | PRD 갭 유형 | 개정안 카테고리 |
|----------------|-----------|-------------|
| Major revision + 새 컴포넌트 추가 | AC 누락 | `new_ac` — 새 AC 제안 |
| Minor revision + 텍스트/라벨 변경 | AC 모호 | `clarify_ac` — 기존 AC 구체화 |
| Major revision + 레이아웃 구조 변경 | UI 명세 부재 | `add_ui_spec` — UI 요구사항 추가 |
| fabrication_risk: medium + approved | PRD 미언급 추론 승인 | `implicit_req` — 암묵적 요구사항 명문화 |
| 다수 화면에서 동일 패턴 revision | 공통 규칙 누락 | `add_rule` — 비즈니스 룰 추가 |

**Workflow**:

1. `approval-status.yaml`에서 `revision_count >= 1`인 화면 목록 수집
2. 각 화면의 revision 태스크 Description에서 피드백 항목 추출
3. 피드백을 PRD 갭 유형으로 분류 (위 분석 로직 테이블)
4. 원본 PRD AC와 대조하여 amendment 항목 생성
5. `prd-amendment.md` 생성 및 저장: `sprints/{sprint-id}/prototypes/prd-amendment.md`
6. 사용자에게 요약 제시 + amendment별 적용 여부 확인

**산출물**: `sprints/{sprint-id}/prototypes/prd-amendment.md` (템플릿: `sprint-orchestrator/templates/prd-amendment-template.md`)

**사용자 액션** (amendment별):

| 선택 | 동작 |
|------|------|
| **apply** | 해당 amendment를 태스크 spec AC에 반영. API contract 변경 필요 시 업데이트. |
| **defer** | `prd-amendment.md`에 기록만. Phase 6 Retrospective에서 재검토. |
| **dismiss** | 해당 amendment 무시. |

**apply 시 자동 반영**:
- 태스크 spec의 `## Acceptance Criteria` 섹션에 amendment 내용 추가/수정
- API contract 변경이 필요한 경우 Sprint Lead가 수동으로 `api-contract.yaml` 업데이트
- 변경된 태스크 목록을 Phase 4 진입 시 표시

**출력**:
```
PRD Amendment: {sprint-id}
  Revised screens: {N}
  Amendments generated: {M}
    new_ac: {N}, clarify_ac: {N}, add_ui_spec: {N}
    implicit_req: {N}, add_rule: {N}
  Applied: {N}, Deferred: {N}, Dismissed: {N}
  Task specs updated: {list}
```

#### 3.5 Prototype-Driven PRD Refinement

승인된 프로토타입을 분석하여 구체화된 PRD를 역추출한다. 프로토타입이 시각적 source of truth가 되어, 빌드 단계에서 사용할 정밀한 명세를 생성한다.

**트리거 조건**: `approval-status.yaml`에서 `revision_count >= 1` **AND** `status: approved`인 화면이 1개 이상.

**Auto-Skip 조건**: 모든 approved 화면의 `revision_count === 0`이면 스킵 (원본 PRD 대로 승인 = 추가 추출 불필요).

스킵 시 출력:
```
Phase 3.5 skipped: all prototypes approved without revision — PRD refinement not needed
```

**입력 데이터**:
- 승인된 프로토타입 HTML 파일 (`prototypes/app/{task-id}/prototype.html`)
- 원본 PRD AC (Given/When/Then)
- 태스크 spec의 `### Screens / Components` 섹션
- `approval-status.yaml` (revision 이력)
- `prd-amendment.md` (Phase 3.4 산출물, 존재 시)

**추출 대상**:

| 카테고리 | 추출 항목 | 예시 |
|---------|---------|------|
| **UI Components** | 화면에 존재하는 모든 컴포넌트, 속성, 계층 | `Header: logo(좌) + coin_btn + bell_btn(우)` |
| **Screen States** | control panel에 정의된 상태 목록 + 각 상태별 UI 차이 | `default`, `notification-badge`, `ranking-expanded` |
| **Interactions** | 클릭/탭/스크롤/토글 등 인터랙션 목록 | `chip 탭 → 그리드 필터링`, `하트 탭 → 좋아요 토글` |
| **Data Schema** | 표시되는 데이터 필드, 포맷, placeholder 값 | `카드: thumbnail + title(max 1줄) + creator(avatar 20px + name) + likeCount` |
| **Layout Rules** | 열 수, 간격, 스크롤 방향, sticky 동작 | `2열 매거진, 열간격 6px, 행간격 16px, 필터칩 sticky` |
| **Edge Case UI** | 빈 상태, 에러 상태, 로딩 상태 등 | `필터 결과 0건 → 빈 상태 표시` |

**Workflow**:

1. `approval-status.yaml`에서 `revision_count >= 1 AND status: approved`인 화면 목록 수집
2. 각 화면의 prototype.html 읽기
3. HTML 구조 분석:
   - `#screen-select` → 스크린 목록
   - `#state-toggles` → 상태 목록
   - `.screen` → 각 스크린의 DOM 구조 → 컴포넌트 계층
   - `onclick`, `navigate()` → 인터랙션 매핑
   - `[data-state]` → 상태별 UI 차이
4. 추출된 요구사항을 구조화하여 `refined-prd.md` 생성
5. 원본 PRD AC와 diff:
   - **new**: 프로토타입에 있지만 원본 PRD에 없는 요구사항
   - **refined**: 원본 PRD에 있지만 프로토타입이 더 구체적인 요구사항
   - **unchanged**: 원본 PRD와 일치하는 요구사항
6. 사용자에게 diff 요약 제시 + 반영 여부 확인

**산출물**: `sprints/{sprint-id}/prototypes/refined-prd.md`

```markdown
# Refined PRD: {sprint-id}

> Source: Approved prototypes (post-revision)
> Generated: {date}
> Original PRD: {prd-source}

## {task-id}: {Screen Name}

### Components
| Component | Properties | Notes |
|-----------|-----------|-------|
| {name}    | {속성}     | {비고} |

### States
| State | Trigger | UI Changes |
|-------|---------|-----------|
| {상태} | {트리거} | {UI 차이} |

### Interactions
| Element | Action | Result |
|---------|--------|--------|
| {요소}  | {동작}  | {결과}  |

### Data Schema
| Field | Type | Format | Constraints |
|-------|------|--------|------------|
| {필드} | {타입} | {포맷} | {제약}     |

### Layout
| Rule | Value |
|------|-------|
| {규칙} | {값} |

### Diff from Original PRD
| Type | AC | Detail |
|------|----|----|
| new | — | {프로토타입에만 존재하는 요구사항} |
| refined | AC {N} | {원본 → 구체화된 내용} |
| unchanged | AC {N} | {일치} |
```

**사용자 액션**:

| 선택 | 동작 |
|------|------|
| **accept** | `refined-prd.md`를 기준으로 태스크 spec AC를 전면 갱신. Phase 4에서 이 spec을 사용. |
| **partial** | 사용자가 반영할 항목을 선택. 선택된 항목만 태스크 spec에 반영. |
| **review-only** | 기록만 유지. 태스크 spec은 변경하지 않음. Phase 4에서 참조 자료로 사용. |

**accept 시 자동 반영**:
- 태스크 spec의 `## Acceptance Criteria` 섹션을 refined-prd 기준으로 갱신
- 태스크 spec에 `## Refined PRD Reference` 섹션 추가:
  ```markdown
  ## Refined PRD Reference
  - **Refined PRD**: `prototypes/refined-prd.md#{task-id}`
  - **Extraction source**: approved prototype (revision {N})
  - **Status**: accepted
  ```
- API contract 변경이 필요한 경우 Sprint Lead가 `api-contract.yaml` 업데이트

**Phase 3.4와의 관계**:
- 3.4 (Amendment Extraction): revision 피드백 기반 → **무엇이 바뀌었는지** (delta)
- 3.5 (PRD Refinement): 승인된 프로토타입 기반 → **무엇이 있는지** (full spec)
- 3.4가 먼저 실행되어 amendment가 태스크 spec에 반영된 후, 3.5가 프로토타입 전체를 분석하여 누락된 요구사항을 추가로 포착
- 3.4에서 이미 apply된 항목은 3.5의 diff에서 `unchanged`로 표시

**출력**:
```
PRD Refinement: {sprint-id}
  Analyzed screens: {N} (revised + approved)
  Requirements extracted:
    Components: {N}, States: {N}, Interactions: {N}
    Data fields: {N}, Layout rules: {N}
  Diff from original PRD:
    new: {N}, refined: {N}, unchanged: {N}
  User action: {accept | partial | review-only}
  Task specs updated: {list}
```

#### 3.6 Gate → Phase 4

다음 조건 확인:
- [ ] `approval-status.yaml` 존재
- [ ] 모든 대상 화면에 approve/reject/skip 판정 완료 (pending 0)
- [ ] rejected 화면의 태스크에서 `## Prototype Reference` 제거 확인
- [ ] `prd-amendment.md` 존재 시, 모든 amendment에 apply/defer/dismiss 판정 완료
- [ ] `refined-prd.md` 존재 시, 사용자가 accept/partial/review-only 판정 완료

**Warning 진입**: pending 또는 rejected 존재 시 경고 출력. `--force`로 무시 가능.

### Output
```
Sprint Prototype: {sprint-id}
  Generated: {N} screens (HTML)
  Approved: {N}, Pending: {N}, Rejected: {N}
  PRD Amendments: {N} applied, {N} deferred, {N} dismissed
  PRD Refinement: {N} new, {N} refined — {accept | partial | review-only}

→ Proceeding to Phase 4: Build
```

---

## Phase 4: Build (Sprint Lead + BE + FE + Evaluator — Iterative Loop)

**핵심**: 전체 태스크 일괄 디스패치가 아닌, 기능 그룹 단위 반복 루프.

```
For each feature group (001, 002, 003, ...):
  4.1 Contract  → Sprint Lead drafts, Evaluator reviews
  4.2 Implement → Engineers build in worktrees
  4.3 Merge     → Sprint Lead merges to sprint branch
  4.4 Evaluate  → Evaluator actively assesses
  4.5 Fix/Accept → Fix loop or proceed to next group
```

### 파이프라인 병렬화 규칙

순차 실행이 기본이지만, 다음 조건에서 병렬화 허용:

| 상황 | 허용 범위 |
|------|----------|
| Group N 평가 중 (4.4) | Group N+1 계약 작성 (4.1) 선행 가능 |
| Group N PASS 확정 전 | Group N+1 구현 (4.2) 시작 **불가** |
| 같은 그룹 BE/FE | 항상 병렬 실행 |
| 다른 레포 머지 (4.3) | 독립이므로 병렬 가능 |

**핵심 제약**: 이전 그룹이 PASS 되기 전에 다음 그룹 구현을 시작하지 않는다. 이전 그룹의 fix가 다음 그룹 spec에 영향을 줄 수 있기 때문.

### 4.0 Sprint 브랜치 생성 (첫 그룹 시)

**관련 레포만 브랜치 생성**: backend 태스크만 있으면 wrtn-backend만, app 태스크만 있으면 app-core-packages만 생성.

```bash
# wrtn-backend (backend 태스크 존재 시)
cd wrtn-backend
git fetch origin {backend-base}
git checkout -b zzem/{sprint-id} origin/{backend-base}

# app-core-packages (app 태스크 존재 시)
cd app-core-packages
git fetch origin {app-base}
git checkout -b zzem/{sprint-id} origin/{app-base}
```

Base branch 우선순위: `sprint-config.yaml` → `defaults.base` → `"main"`

### 4.1 Sprint Contract (per group)

Sprint Lead가 해당 그룹의 계약서를 구성한다:

```markdown
# Sprint Contract: Group {N}

## Scope
- Tasks: {task-ids}
- Endpoints: {related API endpoints}

## Done Criteria
- [ ] {testable criterion 1}
- [ ] {testable criterion 2}
- ...

## Verification Method
- {Evaluator가 각 criterion을 어떻게 검증할지}
- {테스트할 엣지 케이스}
- {검증할 비즈니스 규칙}
```

저장: `sprints/{sprint-id}/contracts/group-{N}.md`

Evaluator에게 계약서 리뷰 요청:

```
TaskCreate:
  Subject: contract-review/group-{N}
  Description: <계약서 경로 + 원본 태스크 파일 참조>
  Owner: Evaluator
```

**Contract 합의 프로토콜:**

1. **Evaluator 리뷰 결과 분류**:
   | 이의 유형 | 처리 |
   |----------|------|
   | **Ambiguity** (모호한 기준) | Sprint Lead가 기준을 구체화 (수치, 조건 명시) |
   | **Missing Edge Case** | Done Criteria에 추가 |
   | **Untestable Criterion** | 검증 방법 재설계 또는 기준 재작성 |
   | **Scope Dispute** (범위 이견) | 원본 태스크 AC와 대조 → 일치하면 유지, 불일치하면 수정 |

2. **합의 루프**:
   - Round 1: Evaluator 리뷰 → Sprint Lead 수정
   - Round 2: Evaluator 재리뷰 → 합의 또는 잔여 이의
   - Round 3 (최종): 합의 실패 시 사용자에게 잔여 이의 목록 제시 → 사용자 판단

3. **합의 완료 시**: 계약서에 `## Sign-off` 섹션 추가 (날짜 + "Evaluator approved")

### 4.2 Implement (Engineers)

해당 그룹의 태스크만 디스패치:

```
For each task in current group:
  TaskCreate:
    Subject: impl/{project}/{task-id}
    Description: <태스크 파일 + API contract + Sprint Contract 참조>
    Owner: {BE/FE} Engineer
```

BE/FE Engineer가 worktree에서 구현 후 완료 보고.
**같은 그룹의 BE/FE 태스크는 병렬 실행.**

#### Cross-Repo 의존성 처리

같은 그룹 내 BE/FE가 병렬 실행될 때 FE가 아직 없는 BE API에 의존하는 경우:

1. **API Contract가 SSOT**: FE Engineer는 `api-contract.yaml`의 request/response 스키마를 기준으로 구현.
2. **Mock/Stub 전략**: FE 태스크 spec에 다음을 포함:
   ```
   ## API Dependency
   - Endpoint: POST /api/v1/follows
   - Contract: api-contract.yaml#/paths/~1api~1v1~1follows/post
   - FE는 contract 기반으로 구현. 실제 BE 연동은 Evaluator가 머지 후 검증.
   ```
3. **Evaluator 통합 검증**: 그룹 머지 완료 후 Evaluator가 BE↔FE 실제 연동을 검증.
4. **Contract 불일치 발견 시**: Evaluator가 ISSUES로 보고 → Sprint Lead가 contract 수정 → 양쪽 fix 태스크.

### 4.3 Merge (Sprint Lead)

completed 태스크를 순차 머지:

```
1. git checkout zzem/{sprint-id}
2. git merge zzem/{sprint-id}/{task-id} --no-ff -m "merge: {task-id}"
3. 충돌 시: 스프린트 중단, 사용자 개입 요청
4. 성공 시: worktree 정리 (git worktree remove + branch delete)
```

같은 레포 내: 번호 오름차순 순차 머지.
다른 레포: 독립이므로 병렬 머지 가능.

### 4.4 Evaluate (Evaluator)

그룹의 모든 태스크 머지 완료 후, Evaluator에게 평가 할당:

```
TaskCreate:
  Subject: eval/{project}/group-{N}
  Description: <Sprint Contract + 머지된 코드 경로 + evaluation criteria>
  Owner: Evaluator
```

Evaluator는 **Active Evaluation** 수행:
- Sprint Contract의 Done Criteria를 코드에서 하나씩 증명
- Logic tracing으로 실행 흐름 추적
- Edge case를 능동적으로 탐색
- Skepticism: "버그가 있다고 가정하고 찾아라"

평가 보고서: `sprints/{sprint-id}/evaluations/group-{N}.md`

판정:
| 판정 | 조건 | 다음 단계 |
|------|------|----------|
| **PASS** | Critical/Major 이슈 0개 | 다음 그룹으로 진행 |
| **ISSUES** | Critical 0, Major 1+ | 4.5 Fix Loop |
| **FAIL** | Critical 1+, 또는 Major 3+ | 4.5 Fix Loop (또는 재구현) |

### 4.5 Fix Loop

ISSUES 또는 FAIL 시:
1. Evaluator 보고서를 원 Engineer에게 전달
2. Engineer가 이슈별 수정 후 완료 보고
3. Sprint Lead 머지
4. Evaluator 재평가
5. **최대 2회 반복**, 3회차 실패 시 FAILED 처리 + 사용자 개입 요청

### 4.6 에러 처리 및 복구 플레이북

| 상황 | Sprint Lead 처리 |
|------|-----------------|
| Engineer 구현 실패 | fix 태스크 재할당 (최대 2회) → FAILED |
| 머지 충돌 | 스프린트 중단, 충돌 상세 출력, 수동 해결 요청 |
| Evaluator ISSUES/FAIL | 원 Engineer에게 보고서 전달 → fix loop |
| Worktree 생성 실패 | 기존 worktree 정리 후 재시도 |

#### 복구 플레이북

**P1: Engineer 구현 반복 실패 (fix 2회 초과)**
```
1. 실패 원인 분류: spec 모호 vs 기술적 한계 vs 의존성 문제
2. spec 모호 → Sprint Lead가 태스크 spec 재작성 후 재할당
3. 기술적 한계 → 사용자에게 scope 축소 또는 대안 접근 제안
4. 의존성 문제 → 선행 그룹 결과 확인, 필요시 그룹 순서 재조정
5. 해당 태스크 FAILED 마킹, 다른 태스크는 계속 진행
```

**P2: 머지 충돌 발생**
```
1. 충돌 파일 목록 + diff 출력
2. 충돌 원인 분석: 같은 그룹 내 BE/FE 겹침 vs 이전 그룹 잔여 변경
3. 사용자에게 충돌 컨텍스트 + 해결 가이드 제공
4. 사용자 해결 후 → git merge --continue → 나머지 머지 재개
5. 해결 불가 시 → git merge --abort → 해당 태스크만 FAILED 처리
```

**P3: Evaluator 반복 FAIL (fix loop 2회 초과)**
```
1. 누적 이슈 목록 정리 (1차 → 2차 → 3차)
2. 반복되는 이슈 패턴 분석
3. 사용자에게 3가지 옵션 제시:
   a) scope 축소: 해당 AC를 다음 스프린트로 이월
   b) 수동 수정: 사용자가 직접 코드 수정
   c) 그룹 재구현: 태스크 spec 수정 후 처음부터 재시작
4. 선택에 따라 sprint-config.yaml에 deferred 항목 기록
```

**P4: Worktree/Branch 오염**
```
1. git worktree list로 전체 worktree 상태 확인
2. 잔여 worktree: git worktree remove --force {path}
3. 잔여 branch: git branch -D zzem/{sprint-id}/{task-id}
4. sprint 브랜치 무결성 확인: git log --oneline zzem/{sprint-id}
5. 재시도
```

**P5: Phase 중간 재시작 (`/sprint {id} --phase=build --resume`)**
```
1. contracts/ 디렉토리에서 마지막 합의된 그룹 번호 확인
2. evaluations/ 디렉토리에서 마지막 PASS 그룹 번호 확인
3. 다음 미완료 그룹부터 재개
4. 이미 머지된 태스크는 스킵, 미머지 태스크만 재디스패치
```

### Gate → Phase 5

다음 조건 **모두** 충족 시 Phase 5 진입:
- [ ] 모든 그룹이 ACCEPTED (Evaluator PASS)
- [ ] FAILED 그룹 0개 (FAILED 그룹 존재 시 사용자에게 skip 여부 확인)
- [ ] 모든 worktree 정리 완료 (잔여 worktree 없음)
- [ ] sprint 브랜치에 모든 머지 커밋 반영

**Partial PR 허용**: `--allow-partial` 플래그 시 ACCEPTED 그룹만으로 PR 생성. FAILED 그룹은 PR body에 명시.

### Output
```
Sprint Build: {sprint-id}

  [Group 001] ACCEPTED
    impl/backend/001-profile-api        merged → eval PASS
    impl/app/001-profile-screen         merged → eval PASS

  [Group 002] EVALUATING
    impl/backend/002-follow-api         merged
    impl/app/002-follow-ui              merged
    eval: pending...

  Results: 1/3 groups accepted, 1/3 evaluating

→ Proceeding to Phase 5: PR (all groups accepted)
```

---

## Phase 5: PR (Sprint Lead solo)

Sprint 브랜치에서 base branch로 PR을 생성한다.

### Workflow

1. **사전 확인**: 각 레포 sprint 브랜치 변경사항 확인.
2. **태스크 상태 수집**: COMPLETED/FAILED 목록.
3. **Push + PR 생성** (레포별, **사용자 확인 필수**):

```bash
cd {project-dir}
git checkout zzem/{sprint-id}
git push -u origin zzem/{sprint-id}
```

```bash
gh pr create \
  --base {base-branch} \
  --head zzem/{sprint-id} \
  --title "feat: Sprint {sprint-id} — {repo-name}" \
  --body "$(cat <<'EOF'
## Sprint: {sprint-id}

### Summary
{PRD 스코프 요약}

### Tasks
| Task | Status | Evaluation |
|------|--------|------------|
| {task-id} | {status} | {eval result} |

### Evaluation Summary
- Groups: {N} total, {N} accepted, {N} failed
- Issues found & fixed: {N}

### Generated by
zzem-orchestrator Harness-Driven Sprint System v4
EOF
)"
```

4. **중복 PR 확인**: 동일 head/base PR → 기존 PR URL 안내.

### Output
```
Sprint PR: {sprint-id}
  wrtn-backend:       {url} (zzem/{sprint-id} → {base})
  app-core-packages:  {url} (zzem/{sprint-id} → {base})

Sprint pipeline complete!
→ Proceeding to Phase 6: Retrospective
```

---

## Phase 6: Retrospective (Sprint Lead solo)

PR 생성 후 스프린트의 성과를 분석하고, 후속 작업을 위한 구조화된 산출물을 생성한다.

### Auto-Trigger

Phase 5 완료 후 자동 실행. `--phase=retro`로 독립 실행도 가능.

### Workflow

#### 6.1 Gap Analysis (PRD AC 달성 여부)

PRD.md의 모든 Acceptance Criteria를 순회하며, Evaluator 보고서와 태스크 상태를 대조한다.

```
For each AC in PRD:
  1. 해당 AC를 구현한 태스크 식별 (tasks/*.md의 AC 매핑)
  2. 태스크 상태 확인: COMPLETED / FAILED
  3. COMPLETED인 경우: evaluations/group-{N}.md에서 관련 이슈 확인
  4. 판정: fulfilled / partially_fulfilled / unfulfilled
  5. root_cause 분류: spec_ambiguity / technical_limit / dependency / scope_creep
```

저장: `sprints/{sprint-id}/retrospective/gap-analysis.yaml`

```yaml
sprint_id: "{sprint-id}"
prd_source: "{prd-file}"
generated_at: "{ISO8601}"

coverage:
  total_ac: {N}
  fulfilled: {N}
  partially_fulfilled: {N}
  unfulfilled: {N}
  fulfillment_rate: "{fulfilled / total_ac}"

prototype_amendments:
  total: {N}
  applied: {N}
  deferred: {N}
  dismissed: {N}
  categories:
    new_ac: {N}
    clarify_ac: {N}
    add_ui_spec: {N}
    implicit_req: {N}
    add_rule: {N}

items:
  - ac_id: "AC-{N}"
    ac_text: "{원본 AC 텍스트}"
    task_id: "{구현 태스크}"
    group: "group-{N}"
    status: "{fulfilled | partially_fulfilled | unfulfilled}"
    reason: "{상세 사유}"
    evidence: "{evaluations/group-{N}.md#issue-{N} | null}"
    root_cause: "{spec_ambiguity | technical_limit | dependency | scope_creep | null}"
    recommendation: "{후속 조치 제안}"
    priority: "{critical | high | medium | low}"
```

#### 6.2 Pattern Digest (반복 실패 패턴)

모든 Evaluator 보고서를 교차 분석하여 시스템적 패턴을 추출한다.

```
1. evaluations/group-*.md 전체 읽기
2. 이슈를 카테고리별로 그룹화: correctness / completeness / edge_case / integration / code_quality
3. 2개 이상 그룹에서 반복되는 패턴 식별
4. 시스템적 개선 제안 도출
```

저장: `sprints/{sprint-id}/retrospective/pattern-digest.yaml`

```yaml
patterns:
  - pattern: "{반복 패턴 설명}"
    category: "{correctness | completeness | edge_case | integration | code_quality}"
    frequency: {N}
    groups: ["group-{N}", ...]
    severity: "{critical | major | minor}"
    systemic_fix: "{시스템 수준 개선 방안}"

metrics:
  total_groups: {N}
  first_pass_rate: {0.0~1.0}       # 첫 평가에서 PASS한 비율
  avg_fix_cycles: {N.N}            # 평균 fix loop 횟수
  critical_issues_found: {N}
  major_issues_found: {N}
  minor_issues_found: {N}
  issues_fixed: {N}
  issues_deferred: {N}
```

#### 6.3 Deferral Index (이월 항목)

gap-analysis에서 `unfulfilled` 또는 `partially_fulfilled`인 항목을 구조화한다.

저장: `sprints/{sprint-id}/retrospective/deferred-items.yaml`

```yaml
deferred:
  - ac_id: "AC-{N}"
    original_task: "{task file path}"
    group: "group-{N}"
    status: "{unfulfilled | partially_fulfilled}"
    reason: "{미충족 사유}"
    root_cause: "{spec_ambiguity | technical_limit | dependency | scope_creep}"
    prior_attempts: {N}
    evaluator_notes: "{evaluations reference}"
    suggested_approach: "{다음 시도에서의 접근 방법}"
    priority: "{critical | high | medium | low}"
    estimated_complexity: "{small | medium | large}"

improvements:
  - description: "{사용자 피드백 또는 추가 개선 사항}"
    source: "{user_feedback | pattern_digest | evaluator_suggestion}"
    priority: "{high | medium | low}"
```

#### 6.4 Sprint Report 생성

모든 retrospective 산출물을 통합하여 `REPORT.md`를 생성한다.

저장: `sprints/{sprint-id}/REPORT.md`

```markdown
# Sprint Report: {sprint-id}

> Generated: {date}
> Architecture: Planner-Generator-Evaluator (Harness Design v4)
> PRD: {prd-source}

## Executive Summary
{1~2문장 요약: 무엇을 구현했고 결과는 어떤지}

## PRD Coverage
| User Story | AC 수 | 충족 | 미충족 |
{gap-analysis.yaml에서 US별 집계}
**Fulfillment Rate: {rate}%**

## Build Results
| Group | Feature | BE Task | FE Task | Eval Result | Fix Loops |
{각 그룹별 결과}

## Quality Metrics
| Metric | Value |
{pattern-digest.yaml의 metrics 섹션}

## Issues Found by Evaluator
### Critical
{이슈 테이블: Group, Issue, Root Cause, Resolution}
### Major
{이슈 테이블}
### Minor
{이슈 테이블}

## Systemic Patterns
{pattern-digest.yaml의 patterns 섹션을 서술형으로}

## Deliverables
### Code
| Repository | Branch | Base | Files | Lines |
### New Modules / Screens / Components
{구현된 모듈, 화면, 컴포넌트 목록}
### API Contract
{endpoint 수, 파일 경로}
### Sprint Artifacts
{contract 수, DC 수, evaluation report 수}

## PR Links
| Repository | Status | Link |

## Improvements for Next Sprint
| Priority | Improvement | Source |
{deferred-items.yaml의 improvements 섹션}

## Timeline
| Phase | Duration | Notes |
{각 phase별 소요 시간}
```

#### 6.5 사용자에게 Next Action 제안

gap-analysis 결과에 따라 분기:

| 상태 | 제안 |
|------|------|
| fulfillment_rate = 1.0 | "모든 AC 충족. 스프린트 완료." |
| deferred 1~2건 (small) | "`--continue`로 같은 스프린트 내에서 이어서 진행 권장" |
| deferred 3건+ 또는 large | "`--follow-up`으로 후속 스프린트 생성 권장" |
| root_cause가 spec_ambiguity 다수 | "PRD/태스크 spec 재작성 후 후속 스프린트 권장" |
| systemic_fix 존재 | "시스템 개선 선행 후 후속 스프린트 권장" |

### Gate

Phase 6는 최종 단계이므로 별도 gate 없음. 산출물 생성 완료 시 종료.

### Output
```
Sprint Retrospective: {sprint-id}

  PRD Coverage: {fulfilled}/{total_ac} AC fulfilled ({fulfillment_rate}%)
    Fulfilled:           {N}
    Partially fulfilled: {N}
    Unfulfilled:         {N}

  Build Quality:
    First-pass rate:     {N}% ({N}/{M} groups PASS on first eval)
    Avg fix cycles:      {N.N}
    Issues found:        {N} (C:{N} M:{N} m:{N})

  Patterns detected:     {N} systemic patterns
  Deferred items:        {N} ({N} critical, {N} high)

  Retrospective saved: sprints/{sprint-id}/retrospective/
  Sprint Report: sprints/{sprint-id}/REPORT.md

→ Recommendation: {context-aware next action}
```

---

## --continue Mode (같은 스프린트 이어서 진행)

이전에 완료된 스프린트에서 미충족 항목만 이어서 처리한다.

### Prerequisites

- `retrospective/` 디렉토리 존재 (Phase 6 완료 필수)
- `deferred-items.yaml`에 1건 이상 항목 존재
- sprint 브랜치가 유효한 상태

### Workflow

```
/sprint {sprint-id} --continue

1. retrospective/deferred-items.yaml 읽기
2. 이월 항목을 새 그룹으로 구성 (기존 마지막 그룹 번호 + 1부터)
3. 이월 항목의 원본 태스크 spec 읽기
4. Evaluator 피드백 + suggested_approach 반영하여 태스크 spec 갱신
5. Phase 4 (Build) 루프 재진입 — 새 그룹부터 시작
   ├─ 4.1 Contract (이전 실패 원인 + 보강된 검증 방법 포함)
   ├─ 4.2 Implement
   ├─ 4.3 Merge (기존 sprint 브랜치에 추가 머지)
   ├─ 4.4 Evaluate
   └─ 4.5 Fix/Accept
6. 완료 후: 기존 PR에 추가 커밋 push 또는 새 PR 생성 (사용자 선택)
7. Phase 6 재실행 (gap-analysis 갱신)
```

### Contract 보강

`--continue`의 Sprint Contract에는 이전 실패 컨텍스트를 포함한다:

```markdown
# Sprint Contract: Group {N} (Continuation)

## Prior Context
- Original group: group-{M}
- Prior attempts: {N}
- Root cause: {from deferred-items.yaml}
- Evaluator feedback: {핵심 피드백 요약}

## Revised Approach
- {suggested_approach from deferred-items.yaml}

## Done Criteria
- [ ] {보강된 기준 1}
- [ ] {보강된 기준 2}
- [ ] Regression: 이전 그룹 구현 사항 영향 없음

## Verification Method
- {이전 실패를 반복하지 않기 위한 구체적 검증 방법}
```

### Output
```
Sprint Continue: {sprint-id}
  Deferred items: {N}
  New groups: {N} (group-{M+1} ~ group-{M+K})

  Entering Phase 4: Build (continuation)
```

---

## --follow-up Mode (후속 스프린트)

이전 스프린트의 Retrospective 산출물을 기반으로 새 스프린트를 생성한다.

### Invocation

```
/sprint {new-sprint-id} --follow-up={prev-sprint-id}
```

### Prerequisites

- 이전 스프린트의 `retrospective/` 디렉토리 존재
- 이전 스프린트의 `deferred-items.yaml` 또는 사용자 추가 요구사항 존재

### Workflow

#### Phase 1: Init (확장)

기존 Init에 다음을 추가:

```
1. 이전 스프린트의 retrospective/ 읽기:
   - gap-analysis.yaml → 미충족 AC 목록
   - pattern-digest.yaml → 시스템 패턴 + 메트릭
   - deferred-items.yaml → 이월 항목
2. 이전 스프린트의 api-contract.yaml 복사 (기반으로 확장)
3. follow-up 메타데이터 기록
```

디렉토리에 추가:
```
sprints/{new-sprint-id}/
├── ... (기존 구조)
└── follow-up-context.yaml       # 이전 스프린트 연결 정보
```

```yaml
# follow-up-context.yaml
previous_sprint: "{prev-sprint-id}"
inherited_from:
  deferred_items: {N}
  api_contract: true
  patterns: {N}
previous_metrics:
  fulfillment_rate: {0.0~1.0}
  first_pass_rate: {0.0~1.0}
  avg_fix_cycles: {N.N}
```

#### Phase 2: Spec (확장)

기존 Spec에 다음을 추가:

1. **Delta PRD 생성**: 이전 PRD + 이월 항목 + 개선 사항을 통합한 PRD 생성.

```markdown
# Delta PRD: {new-sprint-id}

## 선행 스프린트
- Sprint: {prev-sprint-id}
- Coverage: {fulfilled}/{total_ac} AC fulfilled
- Gap Analysis: {prev-sprint}/retrospective/gap-analysis.yaml

## 이월 항목 (Deferred from {prev-sprint-id})
### AC-{N}: {AC 제목}
- 원인: {root_cause}
- 이전 접근: {prior attempts summary}
- 보강된 접근: {suggested_approach}
- 보강된 AC: {구체화된 acceptance criteria}

## 개선 항목 (Improvements)
{사용자에게 추가 요구사항 확인 — 없으면 이월 항목만으로 진행}

## Regression Guard
이전 스프린트에서 완료된 기능이 후속 작업에 의해 깨지지 않았는지 검증:
- [ ] AC-001 ~ AC-{M}: 이전 충족 항목 회귀 없음
```

2. **Evaluator 캘리브레이션 보강**: pattern-digest의 systemic_fix를 evaluation criteria에 반영.

```
evaluation/criteria.md에 추가:
## Calibration from {prev-sprint-id}
- Pattern: {반복 패턴} → 이 패턴에 대해 추가 주의
- Pattern: {반복 패턴} → {systemic_fix} 적용 여부 확인
```

3. **Regression AC 생성**: 이전 스프린트에서 fulfilled된 AC를 간소화한 regression 체크리스트 생성.

```yaml
# tasks/{project}/{task-id}.md의 AC 섹션에 추가
## Regression Guard
- [ ] {이전 AC-001}: {검증 방법 — 기존 기능 동작 확인}
- [ ] {이전 AC-002}: {검증 방법}
```

#### Phase 3~5: 기존과 동일

#### Phase 6: Retrospective (확장)

기존 Retrospective에 추가:
- 이전 스프린트 대비 개선 추이 기록
- 이월 항목 해소 여부 추적

```yaml
# gap-analysis.yaml에 추가
follow_up_tracking:
  previous_sprint: "{prev-sprint-id}"
  inherited_deferred: {N}
  resolved_in_this_sprint: {N}
  still_deferred: {N}
  trend:
    fulfillment_rate: "{prev} → {current}"
    first_pass_rate: "{prev} → {current}"
```

### Output
```
Sprint Follow-Up Init: {new-sprint-id}
  Based on: {prev-sprint-id}
  Inherited: {N} deferred items, {N} patterns
  API Contract: inherited + extended

→ Proceeding to Phase 2: Spec (Delta PRD)
```

---

## --status Mode (anytime, read-only)

### 정보 수집

1. **태스크 상태**: TaskList 또는 result 파일
2. **프로토타입 상태**: `approval-status.yaml`
3. **Sprint Contract 상태**: `contracts/` 디렉토리
4. **평가 상태**: `evaluations/` 디렉토리
5. **브랜치 상태**: sprint 브랜치 커밋 수
6. **PR 상태**: `gh pr list`
7. **Agent Activity**: `logs/*.jsonl` — 각 에이전트 JSONL 파일의 마지막 줄 파싱
8. **Retrospective 상태**: `retrospective/` 디렉토리 존재 여부 + gap-analysis 요약

### Log Parsing

`sprint-orchestrator/sprints/{sprint-id}/logs/` 디렉토리의 JSONL 파일을 파싱한다:

1. 각 에이전트 파일(`be-engineer.jsonl`, `fe-engineer.jsonl`, `design-engineer.jsonl`, `evaluator.jsonl`)의 **마지막 줄**을 읽는다.
2. JSON 파싱하여 `task`, `phase`, `message`, `ts` 추출.
3. `ts`로부터 경과 시간 계산.
4. `phase` → Display Status 매핑:

| phase | Display |
|-------|---------|
| `started`, `context_loaded` | LOADING |
| `worktree_created`, `implementing`, `html_generating`, `evaluating`, `fixing` | ACTIVE |
| `build_check` | BUILDING |
| `build_failed` | BUILD FAIL |
| `html_complete` | SAVING |
| `completed` | IDLE (마지막 로그가 completed이면 현재 대기 중) |
| `error` | ERROR |

5. 로그 파일이 없거나 비어있으면 **IDLE** 표시 (아직 활성화되지 않은 에이전트).

### Dashboard Output

```
═══════════════════════════════════════════════════════
  Sprint: {sprint-id}
  PRD: {prd-source}
  Architecture: Planner-Generator-Evaluator
═══════════════════════════════════════════════════════

  Build Progress: ████████░░░░ Group {N}/{M}

  Group   Contract   Backend         App             Evaluation
  ─────   ────────   ────────────    ────────────    ──────────
  001     agreed     COMPLETED       COMPLETED       PASS
  002     agreed     COMPLETED       RUNNING         pending
  003     draft      pending         pending         —

  ─── Agent Activity ───────────────────────────────────
  Agent              Task                    Phase        Elapsed   Detail
  ────────────────   ─────────────────────   ──────────   ───────   ──────────────────────
  BE Engineer        impl/backend/002-api    BUILDING     2m ago    tsc --noEmit
  FE Engineer        impl/app/002-ui         ACTIVE       5m ago    FollowerList 컴포넌트 생성
  Design Engineer    —                       IDLE         —         —
  Evaluator          —                       IDLE         —         —

  Prototypes:
    001-profile-screen    ProfileScreen     approved
    002-follow-ui         FollowerListScreen approved

  PRs:
    wrtn-backend:       not created
    app-core-packages:  not created

  ─── Bottleneck Detection ────────────────────────────
  ⚠ FE Engineer ACTIVE for 15m+ on impl/app/002-ui (threshold: 10m)
  ⚠ Group 002 blocked: waiting for FE completion

═══════════════════════════════════════════════════════
  Next step: {context-aware suggestion}
═══════════════════════════════════════════════════════
```

### 병목 감지 규칙

| 조건 | 경고 |
|------|------|
| Agent ACTIVE 10분+ 경과 | `⚠ {Agent} ACTIVE for {N}m+ on {task}` |
| Agent BUILD FAIL 상태 | `🔴 {Agent} build failed on {task}` |
| Agent ERROR 상태 | `🔴 {Agent} error on {task}` |
| 그룹 내 한쪽만 완료, 다른 쪽 5분+ | `⚠ Group {N} blocked: waiting for {side}` |
| Fix loop 2회차 진입 | `⚠ Group {N} in fix loop round 2` |

### 진행률 계산

```
progress = (accepted_groups / total_groups) * 100
bar_filled = round(progress / 100 * 12)
```

### Next Step 로직

상태 기반 자동 추천:
- 모든 그룹 ACCEPTED → "Ready for Phase 5: PR"
- 현재 그룹 평가 중 → "Waiting for Evaluator on Group {N}"
- Fix loop 중 → "Fix loop round {R} for Group {N}"
- FAILED 그룹 존재 → "Group {N} FAILED — user decision required"
- 구현 진행 중 → "Engineers working on Group {N}"
- PR 생성 완료, retrospective 미실행 → "Ready for Phase 6: Retrospective"
- Retrospective 완료, deferred 존재 → "`--continue` or `--follow-up` recommended"
- Retrospective 완료, 전체 충족 → "Sprint complete. All AC fulfilled."

### 자동 모니터링 (`/loop` 연계)

빌드 중 실시간 모니터링:
```
/loop 3m /sprint {sprint-id} --status
```

---

## Team Configuration

### Teammate Files

| Teammate | 파일 | 역할 |
|----------|------|------|
| BE Engineer | `.claude/teammates/be-engineer.md` | Backend Generator |
| FE Engineer | `.claude/teammates/fe-engineer.md` | Frontend Generator |
| Design Engineer | `.claude/teammates/design-engineer.md` | HTML 프로토타입 |
| Evaluator | `.claude/teammates/evaluator.md` | Active Evaluation |

### Task Naming Convention

| Phase | Subject 패턴 | Owner |
|-------|-------------|-------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | Design Engineer |
| Implementation | `impl/backend/{task-id}` | BE Engineer |
| Implementation | `impl/app/{task-id}` | FE Engineer |
| Evaluation | `eval/{project}/group-{N}` | Evaluator |

## Constraints

- 머지 충돌: 자동 해결 없이 즉시 사용자 개입 요청
- `.worktrees/` 디렉토리는 `.gitignore`에 포함
- PR 생성/push 전 반드시 사용자 확인
- Teammate는 원격 push 및 브랜치 머지 금지 (Sprint Lead 전담)
- **Evaluator 피드백 없이 그룹을 accept하지 않는다**
- **이전 그룹 PASS 전 다음 그룹 구현(4.2) 시작 금지** (계약 선행 작업만 허용)
- Phase 전환 시 Gate 조건 미충족이면 진행 차단 (`--force`로 오버라이드 가능)
- Fix loop 최대 2회, 3회차 실패 시 FAILED + 사용자 개입
- Backend-only 스프린트 시 Phase 3 자동 스킵, app-core-packages 브랜치 미생성
- **`--continue`는 retrospective/ 완료 후에만 사용 가능**
- **`--follow-up`은 이전 스프린트의 retrospective/ 존재 필수**
- **Regression Guard**: follow-up 스프린트에서 이전 충족 AC의 회귀 검증 필수
