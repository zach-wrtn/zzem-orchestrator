# Phase 3: Prototype (Sprint Lead + Design Engineer)

App 태스크의 UI 프로토타입을 self-contained HTML로 생성하고 리뷰한다.

## Auto-Skip 조건

다음 중 하나라도 해당하면 Phase 3를 자동 스킵하고 Phase 4로 직행:
- `tasks/app/` 디렉토리에 태스크 파일이 0개
- 모든 app 태스크에 `### Screens / Components` 섹션이 없음
- `sprint-config.yaml`에 `prototype: skip` 설정

스킵 시 출력:
```
Phase 3 skipped: no prototypable UI tasks found
→ Proceeding to Phase 4: Build
```

## Workflow

### 3.0 KB 동기화

Design KB 참조 전에 `zzem-kb:sync` 1회 호출 (fast-forward pull). Phase 2에서 sync를 수행했다면 스킵 가능하나, Phase 2 없이 Phase 3 직행 시 필수.

### 3.1 태스크 필터

app 태스크 중 `### Screens / Components` 섹션이 있는 태스크만 대상.

### 3.2 Design Engineer 스폰

각 대상 태스크에 대해:

**Step 1: Frozen Snapshot 조립** (Sprint Lead — 1회만)

첫 번째 Design Engineer 태스크 생성 전에 다음을 읽고 snapshot을 조립한다:

```
1. docs/designs/DESIGN.md (존재 시)
   → §1 Visual Theme, §4 Component Stylings, §7 Do's/Don'ts, §9 Agent Prompt Guide 발췌
2. docs/designs/README.md (+ docs/designs/components/*.mdx)
   → 현재 스프린트 태스크와 관련된 패턴만 발췌
3. `zzem-kb:read type=pattern category=design_proto` (+ `design_spec`)
   → 관련 디자인 패턴 .yaml 파일 경로 리턴 → Read로 인라인 포함
4. `zzem-kb:read type=asset category=sample_image` (존재 시)
   → 피드 썸네일·아바타 등 재사용 가능한 샘플 asset 목록 리턴
   → `context-engine.yaml assets:` 레이어 조립의 fallback 소스 후보로 사용
5. (Sprint Lead 가 task description 에 archetype hint 를 명시했거나, B.1.1 사전 분류 결과가 있으면) `cat .claude/teammates/design-engineer-archetypes/{archetype}.md`
   → persona 룰 파일 전체를 Snapshot 에 인라인
   → archetype 미정 task 는 Step 5 스킵 — DE 가 B.1.1 에서 분류 후 본 파일 직접 read
```

이 snapshot은 **모든 Design Engineer 태스크에 동일하게 포함**한다.
스프린트 내에서 재조립하지 않는다.

**Step 2: 태스크 생성**

**Variant 트리거 평가** (Step 2 진입 시 최초 1회):

다음 조건 중 하나라도 만족하면 **variants 모드** — 1개가 아닌 3개 TaskCreate 병렬 발행:

- 태스크의 `quality_score.fabrication_risk` == `medium`
- 태스크 Description에 `variants_required: true`
- 사용자가 본 화면 시작 직전에 "여러 안 보고 싶다" 명시

미충족 시 단일 모드 — 기존 흐름 유지.

**Variants 모드 흐름**:

1. 동일 Frozen Snapshot 입력으로 3개 TaskCreate를 병렬 발행 (superpowers:dispatching-parallel-agents 적용)
2. 각 TaskCreate Description 끝에 다음 추가:
   ```
   variant_id: A | B | C
   variant_directive: "{persona-1줄: 보수 / 표현 / 미니멀 등}"
   shared_inputs: 동일 Frozen Snapshot — 임의 추가 컨텍스트 금지
   ```
3. 3개 variant 디렉티브 (고정):
   - **A — Conservative**: PRD/패턴 기본형 충실. 새 컴포넌트 도입 금지. 안전 선택만.
   - **B — Expressive**: 시각 위계 강조 (대형 hero, 컬러 contrast, motion 힌트). DESIGN.md §3 표현형 토큰 적극 사용.
   - **C — Minimal**: 정보 밀도 최저. 여백 최대. CTA 1-2개로 축소.
4. 3개 모두 Step C(HTML 생성) 완료 시 §3.2.6 Comparison Gate로 진행
5. **Adjust loop 상한**: 3개 variant 모두 완료까지 1회 — Sprint Lead가 변형을 변경하고 싶으면 비교 gate에서 stop 후 재시작

**Auto-Skip 조건** (variants 모드 비활성):
- `sprint-config.yaml` 에 `variants_mode: disabled` → 전역 비활성 (기본값은 conditional)
- 태스크 Description에 `variants_disabled: true` → 단일 모드 강제

**Logging**: Sprint Lead는 다음을 `logs/events.jsonl` 에 append:
- `{"phase":"variants_spawned","screen":"{ScreenName}","variants":["A","B","C"],"trigger":"fabrication_risk_medium"}`

```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: |
    --- FROZEN SNAPSHOT ---
    ## Design System (from DESIGN.md)
    {발췌 내용}

    ## Component Patterns (from docs/designs/README.md)
    {관련 패턴 발췌}

    ## Known Design Patterns (from KB)
    {관련 KB 디자인 패턴}
    --- END SNAPSHOT ---

    태스크: tasks/app/{task-id}.md
    Assumption Preview 산출 경로: sprints/{sprint-id}/prototypes/app/{task-id}/{ScreenName}.intent.md
    Preview 템플릿: sprint-orchestrator/templates/assumption-preview-template.md
    Screen Spec 템플릿: sprint-orchestrator/templates/screen-spec-template.md
    HTML 템플릿: sprint-orchestrator/templates/html-prototype-template.html
    Context Engine 템플릿: sprint-orchestrator/templates/context-engine-template.yaml
    Archetype hint (선택): Sprint Lead 가 PRD 분석에서 archetype 추론했다면 명시 — 예 archetype: feed
      → 미명시 시 DE 가 B.1.1 에서 분류 후 persona 파일 직접 read
      → 6 enum: feed | detail | onboarding | form | modal | empty_state
      → persona 디렉토리: .claude/teammates/design-engineer-archetypes/
    디자인 토큰: design-tokens/
    Context 출력: sprints/{sprint-id}/prototypes/context/
    프로토타입 출력: sprints/{sprint-id}/prototypes/app/{task-id}/
  Owner: Design Engineer
```

Design Engineer가 HTML 프로토타입을 생성 후 `TaskUpdate: completed`.

### 3.2.5 Assumption Preview Gate (조건부)

Step C 진입 전에 DE가 산출한 `{ScreenName}.intent.md`를 사용자에게 제시하여 가정을 조기 검증한다. 조건 및 템플릿은 `.claude/teammates/design-engineer.md` §B.6 참조.

**Variants 모드 상호 배타**: 본 태스크가 §3.2 Step 2에서 variants 모드로 분기되었다면 **이 gate를 스킵**한다 (이유: 3개 variant가 곧 비교됨 — 사전 가정 검증보다 사후 비교가 더 강력). 로그에 `phase: preview_skipped, reason: variants_mode` 기록.

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

### 3.3 리뷰 (Sprint Lead ↔ 사용자)

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

### 3.3.1 Revision 분기

사용자가 `revise`를 선택하면 Sprint Lead가 피드백 내용으로 보정 규모를 자동 판단한다.

| 분류 | 기준 | 예시 |
|------|------|------|
| **minor** | CSS/콘텐츠 수정 — 구조 변경 없음 | 간격, 색상, 크기, 텍스트, 폰트 |
| **major** | 레이아웃 구조, 컴포넌트, 인터랙션 변경 | 탭 순서, 컴포넌트 추가/삭제, 새 상태, 내비게이션 수정 |

**규칙**: 사용자에게 minor/major를 묻지 않는다. 피드백 내용에서 자동 판단. 애매하면 major로 처리.

### 3.3.2 Baseline 관리

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

### 3.3.3 Minor Revision (Annotation 방식)

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

### 3.3.4 Major Revision (Live Preview 방식)

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

### 3.3.5 Visual Regression (before/after 비교)

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

### 3.3.6 approval-status.yaml 확장

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

### 3.4 PRD Amendment Extraction

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

### 3.5 Prototype-Driven PRD Refinement

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

### 3.6 Gate → Phase 4

다음 조건 확인:
- [ ] `approval-status.yaml` 존재
- [ ] 모든 대상 화면에 approve/reject/skip 판정 완료 (pending 0)
- [ ] rejected 화면의 태스크에서 `## Prototype Reference` 제거 확인
- [ ] `prd-amendment.md` 존재 시, 모든 amendment에 apply/defer/dismiss 판정 완료
- [ ] `refined-prd.md` 존재 시, 사용자가 accept/partial/review-only 판정 완료

**Warning 진입**: pending 또는 rejected 존재 시 경고 출력. `--force`로 무시 가능.

## Checkpoint (Phase 3 완료 시)

`checkpoints/phase-3-summary.md` 생성:

```markdown
# Phase 3 Checkpoint: {sprint-id}

## Prototype Results
| Task | Screen | Status | Revisions | Type |
|------|--------|--------|-----------|------|
| {task-id} | {ScreenName} | approved/rejected/skipped | {N} | {minor/major/null} |

## PRD Amendments Applied
- {amendment 1 요약}
- {amendment 2 요약}

## PRD Refinement
- Status: {accept/partial/review-only}
- New requirements: {N}
- Refined requirements: {N}

## Key User Decisions
- {사용자가 내린 주요 판단과 근거}
```

> 이후 Phase 4에서는 revision 세부 대화를 다시 참조하지 않고, 이 checkpoint + approval-status.yaml + 태스크 파일의 Prototype Reference만 참조한다.

## Output

Gate 통과 시:
1. Checkpoint 파일 생성 (`checkpoints/phase-3-summary.md`).
2. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
3. 다음 Phase 진입.

```
Sprint Prototype: {sprint-id}
  Generated: {N} screens (HTML)
  Approved: {N}, Pending: {N}, Rejected: {N}
  PRD Amendments: {N} applied, {N} deferred, {N} dismissed
  PRD Refinement: {N} new, {N} refined — {accept | partial | review-only}

[Sprint Status Dashboard]

→ Proceeding to Phase 4: Build
```
