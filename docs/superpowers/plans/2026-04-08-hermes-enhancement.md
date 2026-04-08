# Hermes Agent 패턴 고도화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hermes Agent의 5개 핵심 패턴(Budget Pressure, Frozen Snapshot, Self-Improving Nudge, PTC, Cross-Session KB)을 ZZEM 스프린트 오케스트레이터의 skill/teammate .md 파일에 적용하여, 특히 Design Engineer의 프로토타입 산출 품질과 장기 스프린트 안정성을 고도화한다.

**Architecture:** 모든 변경은 기존 skill-native 아키텍처(.md 프로토콜) 내에서 수행. 외부 런타임 의존성 없음. 5개 영역이 서로 참조하는 통합 시스템으로, knowledge-base가 foundation이 되고 나머지 4개가 이를 소비/생산한다.

**Tech Stack:** Claude Code Agent Teams, Markdown/YAML 프로토콜, Bash (JSONL 로그, 파일 검색)

---

## File Map

### 생성 파일
| File | Purpose |
|------|---------|
| `sprint-orchestrator/knowledge-base/README.md` | KB 디렉토리 설명 + 검색 프로토콜 |
| `sprint-orchestrator/knowledge-base/patterns/README.md` | 패턴 카탈로그 인덱스 |
| `sprint-orchestrator/knowledge-base/design/README.md` | 디자인 패턴 인덱스 |
| `.claude/skills/sprint/knowledge-base.md` | KB 검색/쓰기 프로토콜 (Sprint Lead용) |

### 수정 파일
| File | Lines affected | Changes |
|------|---------------|---------|
| `.claude/skills/sprint/SKILL.md` | 전체 구조 | KB 참조, Frozen Snapshot 섹션, Budget Pressure 섹션 추가 |
| `.claude/skills/sprint/phase-build.md` | §Context Window Guard, §4.1, §4.4, §4.5 | Budget Pressure Injection 프로토콜 삽입 |
| `.claude/skills/sprint/phase-prototype.md` | §3.2, §3.3 | Design Engineer Frozen Snapshot + PTC Pass 프로토콜 |
| `.claude/skills/sprint/phase-retro.md` | §6.2, §6.5 뒤 | Self-Improving Nudge + KB Write 프로토콜 |
| `.claude/skills/sprint/phase-modes.md` | §--follow-up Phase 2 | KB 검색으로 Evaluator calibration 자동화 |
| `.claude/teammates/design-engineer.md` | §Step A, §Step C | Frozen Snapshot 로드 + PTC-style Script Generation |
| `.claude/teammates/evaluator.md` | §2 컨텍스트 구축 | KB 패턴 조회 + 자동 체크리스트 보강 |
| `sprint-orchestrator/templates/evaluation-criteria.md` | 하단 | KB 패턴 기반 동적 체크리스트 섹션 |
| `sprint-orchestrator/templates/sprint-contract-template.md` | Done Criteria 섹션 | KB 패턴 자동 주입 가이드 |

---

## Task 1: Cross-Session Knowledge Base 구조 생성

> Foundation — 다른 4개 태스크가 이 KB를 참조/기록한다.

**Files:**
- Create: `sprint-orchestrator/knowledge-base/README.md`
- Create: `sprint-orchestrator/knowledge-base/patterns/README.md`
- Create: `sprint-orchestrator/knowledge-base/design/README.md`
- Create: `.claude/skills/sprint/knowledge-base.md`

- [ ] **Step 1: KB 디렉토리 구조 생성**

```bash
mkdir -p sprint-orchestrator/knowledge-base/patterns
mkdir -p sprint-orchestrator/knowledge-base/design
```

- [ ] **Step 2: KB README 작성**

```markdown
# Sprint Knowledge Base

> 스프린트 간 누적되는 구조화된 지식 저장소.
> Phase 6 Retrospective에서 자동 기록, Phase 2/4에서 자동 조회.

## 구조

```
knowledge-base/
├── patterns/              # Evaluator 발견 패턴 (코드 품질, 통합, 엣지케이스)
│   ├── README.md          # 패턴 인덱스 (검색용)
│   └── {pattern-id}.yaml  # 개별 패턴 파일
└── design/                # Design Engineer 발견 패턴 (프로토타입 품질)
    ├── README.md          # 디자인 패턴 인덱스 (검색용)
    └── {pattern-id}.yaml  # 개별 디자인 패턴 파일
```

## 패턴 파일 스키마

```yaml
id: "{category}-{NNN}"          # 예: correctness-001, design-proto-001
title: "{1줄 제목}"
category: "{correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec}"
severity: "{critical | major | minor}"
source_sprint: "{sprint-id}"
source_group: "group-{N}"
discovered_at: "{ISO8601}"
frequency: {N}                   # 발견된 스프린트 수
last_seen: "{sprint-id}"

description: |
  {패턴 상세 설명}

detection: |
  {이 패턴을 감지하는 방법 — Evaluator/Design Engineer가 참조}

prevention: |
  {이 패턴을 예방하는 Contract/Spec 보강 방법}

contract_clause: |
  {Sprint Contract Done Criteria에 추가할 조항 — 있으면}

example:
  bad: |
    {잘못된 코드/spec 예시}
  good: |
    {올바른 코드/spec 예시}
```

## 검색 프로토콜

검색은 `knowledge-base.md` 스킬을 통해 수행.
README.md 인덱스를 먼저 읽고, 관련 패턴 파일만 선택적으로 조회.

## 기록 프로토콜

Phase 6 Retrospective에서 `pattern-digest.yaml`의 각 항목을:
1. 기존 KB 패턴과 매칭 → frequency 증가 + last_seen 갱신
2. 신규 패턴 → 새 파일 생성 + 인덱스 갱신
```

- [ ] **Step 3: patterns/README.md 인덱스 작성**

```markdown
# Pattern Index

> Evaluator가 발견한 코드 패턴 인덱스. 최신순 정렬.

| ID | Title | Category | Severity | Freq | Last Seen |
|----|-------|----------|----------|------|-----------|
<!-- 자동 갱신: Phase 6 KB Write 시 이 테이블에 행 추가/갱신 -->
```

- [ ] **Step 4: design/README.md 인덱스 작성**

```markdown
# Design Pattern Index

> Design Engineer 프로토타입 품질 패턴 인덱스. 최신순 정렬.

| ID | Title | Category | Severity | Freq | Last Seen |
|----|-------|----------|----------|------|-----------|
<!-- 자동 갱신: Phase 6 KB Write 시 이 테이블에 행 추가/갱신 -->
```

- [ ] **Step 5: knowledge-base.md 스킬 파일 작성**

`.claude/skills/sprint/knowledge-base.md`:

```markdown
# Knowledge Base Operations

Sprint 파이프라인 내에서 KB를 검색/기록하는 프로토콜.

## KB Search (Phase 2, 4.1 Contract, 4.4 Evaluate 시)

### 호출 시점

| Phase | 트리거 | 검색 대상 |
|-------|--------|----------|
| Phase 2 Spec | 태스크 분해 시 | `patterns/` — 관련 카테고리 |
| Phase 4.1 Contract | Done Criteria 작성 시 | `patterns/` — 해당 그룹 관련 패턴 |
| Phase 4.4 Evaluate | 평가 체크리스트 구축 시 | `patterns/` — 전체 critical/major |
| Phase 3 Prototype | Design Engineer 스폰 시 | `design/` — 프로토타입 품질 패턴 |

### 검색 절차

1. 해당 디렉토리의 `README.md` 인덱스 읽기
2. 현재 작업과 관련된 패턴 ID 식별 (category + severity 필터)
3. 관련 패턴 파일(.yaml)만 선택적으로 Read
4. 검색 결과를 해당 Phase의 프로토콜에 주입

### 관련성 판단 기준

| 작업 유형 | 관련 category |
|----------|--------------|
| API 엔드포인트 구현 | correctness, integration |
| UI 화면 구현 | completeness, design_proto |
| 상태 관리 | edge_case, code_quality |
| BE↔FE 연동 | integration |
| 프로토타입 생성 | design_proto, design_spec |

## KB Write (Phase 6 Retrospective 후)

### 기록 절차

1. `pattern-digest.yaml`의 각 패턴에 대해:
   a. `patterns/README.md` 인덱스에서 동일/유사 패턴 검색
   b. **기존 패턴 매칭** → 해당 .yaml 파일의 `frequency` +1, `last_seen` 갱신
   c. **신규 패턴** → 새 .yaml 파일 생성, README.md 인덱스에 행 추가
2. Design Engineer quality-report에서 `fabrication_risk: medium` 항목 추출:
   a. `design/README.md`에서 유사 패턴 검색
   b. 기존 매칭 → frequency 갱신
   c. 신규 → 새 design 패턴 파일 생성

### 패턴 ID 생성 규칙

`{category}-{NNN}` (NNN은 해당 category 내 순번)

- `correctness-001`, `correctness-002`, ...
- `integration-001`, ...
- `design-proto-001`, `design-spec-001`, ...

### 자동 정리

- `frequency >= 3`인 패턴은 Sprint Contract 템플릿에 영구 반영 검토 대상
- `last_seen`이 3개 스프린트 이상 미갱신된 패턴은 `archived` 마킹
```

- [ ] **Step 6: ugc-profile-nav-001 패턴을 KB에 시드 데이터로 기록**

`sprint-orchestrator/knowledge-base/patterns/correctness-001.yaml`:
```yaml
id: "correctness-001"
title: "커서 페이지네이션 DTO 이중 래핑"
category: "correctness"
severity: "critical"
source_sprint: "ugc-profile-nav-001"
source_group: "group-001"
discovered_at: "2026-04-08T00:00:00Z"
frequency: 1
last_seen: "ugc-profile-nav-001"

description: |
  Controller에서 CursorResponseDto를 재래핑하여 nextCursor가 항상 null이 되는 버그.
  Service가 이미 CursorResponseDto를 반환하는데 Controller가 한 번 더 감싸는 경우.

detection: |
  Controller의 return문에서 new CursorResponseDto() 호출이 있고,
  Service의 반환 타입도 CursorResponseDto인 경우 이중 래핑.

prevention: |
  Sprint Contract에 "페이지네이션 응답의 nextCursor가 실제 값을 반환하는지 검증" 항목 추가.

contract_clause: |
  - [ ] 페이지네이션 API: 2건 이상 데이터에서 nextCursor가 null이 아닌 실제 값 반환

example:
  bad: |
    // Controller
    return new CursorResponseDto(service.findAll(query)); // 이중 래핑
  good: |
    // Controller
    return service.findAll(query); // Service가 이미 CursorResponseDto 반환
```

나머지 5개 패턴도 동일 형식으로 생성 (Step 6에서 일괄):

- `correctness-002.yaml` — JS getter JSON 직렬화 누락
- `integration-001.yaml` — BE/FE 응답 필드명 불일치
- `code-quality-001.yaml` — Clean Architecture 위반 (domain → react-query)
- `completeness-001.yaml` — 네비게이션 진입점 누락
- `completeness-002.yaml` — 훅 생성 후 호출부 미구현

각 파일은 `pattern-digest.yaml`의 해당 항목에서 `description`, `systemic_fix`를 변환하여 채운다.

- [ ] **Step 7: patterns/README.md 인덱스 시드 데이터 갱신**

```markdown
# Pattern Index

> Evaluator가 발견한 코드 패턴 인덱스. 최신순 정렬.

| ID | Title | Category | Severity | Freq | Last Seen |
|----|-------|----------|----------|------|-----------|
| correctness-001 | 커서 페이지네이션 DTO 이중 래핑 | correctness | critical | 1 | ugc-profile-nav-001 |
| correctness-002 | JS getter JSON 직렬화 누락 | correctness | critical | 1 | ugc-profile-nav-001 |
| integration-001 | BE/FE 응답 필드명 불일치 | integration | critical | 1 | ugc-profile-nav-001 |
| code-quality-001 | Clean Architecture 위반 | code_quality | medium | 1 | ugc-profile-nav-001 |
| completeness-001 | 네비게이션 진입점 누락 | completeness | critical | 1 | ugc-profile-nav-001 |
| completeness-002 | 훅 생성 후 호출부 미구현 | completeness | medium | 1 | ugc-profile-nav-001 |
```

- [ ] **Step 8: Commit**

```bash
git add sprint-orchestrator/knowledge-base/ .claude/skills/sprint/knowledge-base.md
git commit -m "feat: add cross-session knowledge base with seed data from ugc-profile-nav-001"
```

---

## Task 2: Budget Pressure Injection — phase-build.md 고도화

> Hermes의 IterationBudget + pressure injection을 Build Loop에 적용.

**Files:**
- Modify: `.claude/skills/sprint/SKILL.md`
- Modify: `.claude/skills/sprint/phase-build.md`

- [ ] **Step 1: SKILL.md에 Budget Pressure 섹션 추가**

`.claude/skills/sprint/SKILL.md`의 `## Context Window Management` 섹션 끝(Progressive File Reading 뒤)에 추가:

```markdown
### Budget Pressure Injection

> Ref: Hermes Agent IterationBudget — 컨텍스트 소진 전 동적 스티어링.

장기 Build Loop에서 컨텍스트 윈도우 품질을 유지하기 위해,
Sprint Lead는 각 그룹의 진행 상황을 모니터링하고 pressure 레벨에 따라 행동을 조정한다.

**Pressure 레벨 판단**:

| 레벨 | 조건 | Sprint Lead 행동 |
|------|------|-----------------|
| 🟢 Normal | 현재 그룹 내 fix loop 0회 | 정상 진행 |
| 🟡 Caution | fix loop 1회차 진입 또는 Engineer 태스크 2회 이상 재할당 | Checkpoint 즉시 생성 + 이전 그룹 상세 컨텍스트 drop |
| 🔴 Urgent | fix loop 2회차 또는 그룹 내 총 이슈 5건+ | scope 축소 제안 + 사용자 개입 요청 준비 |

**Pressure 주입 방식**:

Sprint Lead가 Engineer/Evaluator에게 태스크를 할당할 때,
현재 pressure 레벨에 따라 태스크 Description에 컨텍스트 힌트를 추가한다:

- 🟡 Caution: `⚠ Context Pressure: Caution — 핵심 AC에 집중. 부가 개선 금지.`
- 🔴 Urgent: `🔴 Context Pressure: Urgent — 최소 기능만 구현. scope 축소 가능성 있음.`

이 힌트는 Engineer/Evaluator의 동작에 직접 영향을 준다:
- Engineer: Caution에서 불필요한 리팩토링/추가 기능 금지. Urgent에서 AC 충족 최소 구현만.
- Evaluator: Caution에서 Minor 이슈 보고 생략. Urgent에서 Critical만 보고.
```

- [ ] **Step 2: phase-build.md에 Budget Pressure 프로토콜 삽입**

`phase-build.md`의 `## Context Window Guard` 섹션 끝, `### Progressive File Reading` 뒤에 추가:

```markdown
### Budget Pressure Protocol

> Build Loop 진행 중 자동으로 pressure 레벨을 산출하고, 에이전트 행동을 조정한다.

**레벨 산출 (매 4.x 단계 전이 시)**:

```
pressure = "normal"

if fix_loop_count >= 1 OR engineer_reassign_count >= 2:
    pressure = "caution"

if fix_loop_count >= 2 OR total_issues_in_group >= 5:
    pressure = "urgent"
```

**Normal → Caution 전이 시 Sprint Lead 필수 행동**:

1. 현재 그룹의 checkpoint 즉시 생성 (중간 checkpoint)
2. 이전 그룹의 evaluation 원본 참조 금지 (summary만)
3. Engineer 태스크 Description에 caution 힌트 추가
4. Evaluator 재평가 시 "Minor 이슈는 다음 스프린트로 이월" 지시

**Caution → Urgent 전이 시 Sprint Lead 필수 행동**:

1. 사용자에게 상황 보고:
   ```
   ⚠ Budget Pressure: Urgent
   Group {N}: fix loop {M}회, 이슈 {K}건
   옵션:
   a) Scope 축소 — Critical 이슈만 수정, Major는 deferred
   b) 수동 개입 — 사용자가 직접 코드 확인/수정
   c) 그룹 FAILED — 다음 그룹으로 이동, Phase 6에서 이월
   ```
2. 사용자 선택에 따라 진행
3. Evaluator 재평가 시 Critical 이슈만 검증 지시

**압력 해소**: 그룹 PASS 시 다음 그룹은 "normal"로 리셋.
```

- [ ] **Step 3: 4.1 Sprint Contract에 KB 패턴 자동 주입 추가**

`phase-build.md`의 `## 4.1 Sprint Contract (per group)` 섹션, Contract 마크다운 블록 뒤에 추가:

```markdown
### KB 패턴 자동 주입

Contract 작성 전 `knowledge-base.md`의 KB Search를 실행하여,
해당 그룹 태스크와 관련된 기존 패턴을 조회한다.

**주입 규칙**:
1. `patterns/README.md` 인덱스에서 현재 그룹 태스크의 category와 매칭되는 패턴 조회
2. `severity: critical` 패턴의 `contract_clause`를 Done Criteria에 자동 추가
3. `severity: major` + `frequency >= 2` 패턴도 추가
4. 추가된 조항에 출처 표기: `(KB: {pattern-id})`

**예시**:
```markdown
## Done Criteria
- [ ] 프로필 API 200 응답 반환 (AC-2.1)
- [ ] 페이지네이션 API: nextCursor가 실제 값 반환 (KB: correctness-001)
- [ ] BE 응답 필드명이 api-contract.yaml과 정확히 일치 (KB: integration-001)
```
```

- [ ] **Step 4: 4.5 Fix Loop에 pressure 연동 추가**

`phase-build.md`의 `## 4.5 Fix Loop` 섹션을 다음으로 교체:

```markdown
## 4.5 Fix Loop

ISSUES 또는 FAIL 시:

1. **Pressure 레벨 갱신**: fix_loop_count += 1 → pressure 재산출
2. Evaluator 보고서를 원 Engineer에게 전달
   - 🟡 Caution: `⚠ Context Pressure: Caution — Critical/Major만 수정. Minor는 다음 스프린트로 이월.`
   - 🔴 Urgent: 사용자에게 scope 축소 옵션 제시 (4.6 Budget Pressure Protocol 참조)
3. Engineer가 이슈별 수정 후 완료 보고
4. Sprint Lead 머지
5. Evaluator 재평가
   - 🟡 Caution: Minor 이슈는 보고하되 verdict에 영향 없음 (PASS 가능)
   - 🔴 Urgent: Critical 이슈만 검증
6. **최대 2회 반복**, 3회차 실패 시 FAILED 처리 + 사용자 개입 요청
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sprint/SKILL.md .claude/skills/sprint/phase-build.md
git commit -m "feat: add budget pressure injection to build loop"
```

---

## Task 3: Frozen Snapshot Caching — Teammate 프롬프트 최적화

> Hermes의 frozen snapshot 패턴을 적용하여 Teammate 시스템 프롬프트를 세션 내 불변으로 관리.

**Files:**
- Modify: `.claude/skills/sprint/SKILL.md`
- Modify: `.claude/skills/sprint/phase-prototype.md`
- Modify: `.claude/teammates/design-engineer.md`
- Modify: `.claude/teammates/evaluator.md`

- [ ] **Step 1: SKILL.md에 Frozen Snapshot 섹션 추가**

`## Context Window Management` 섹션의 `### Budget Pressure Injection` 뒤에 추가:

```markdown
### Frozen Snapshot Protocol

> Ref: Hermes Agent — 세션 시작 시 시스템 프롬프트를 1회 로드 후 고정. Anthropic prompt caching 최적화.

**원칙**: Teammate가 스폰될 때 참조하는 디자인 시스템, 패턴 라이브러리, KB 데이터를
**1회만 로드하고 세션 내에서 재로드하지 않는다**.

**Snapshot 대상** (Teammate 스폰 시 1회 로드):

| 대상 | 파일 | 소비자 |
|------|------|--------|
| Design System | `docs/designs/DESIGN.md` | Design Engineer |
| Component Patterns | `docs/designs/component-patterns.md` | Design Engineer |
| Design KB | `knowledge-base/design/README.md` + 관련 .yaml | Design Engineer |
| Code KB | `knowledge-base/patterns/README.md` + 관련 .yaml | Evaluator, Engineers |
| API Contract (그룹 범위) | `contracts/api-contract.yaml` (현재 그룹 endpoints) | Engineers, Evaluator |

**적용 방식**:

Sprint Lead가 Teammate에게 TaskCreate 시, Description에 snapshot context를 **인라인으로 포함**한다.
Teammate는 별도로 이 파일들을 Read하지 않는다.

```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: |
    --- FROZEN SNAPSHOT ---
    {DESIGN.md 핵심 섹션 발췌}
    {component-patterns.md 관련 패턴}
    {KB design 패턴 중 관련 항목}
    --- END SNAPSHOT ---

    태스크 상세: {task-id} 참조
    Screen Spec 템플릿: sprint-orchestrator/templates/screen-spec-template.md
```

**금지 사항**:
- Teammate가 snapshot 대상 파일을 직접 Read하는 것 (Sprint Lead가 이미 제공)
- Sprint Lead가 같은 세션 내에서 snapshot을 재구성하는 것 (한 번만)
- 단, `tokens.css`와 `context-engine.yaml`은 Design Engineer가 직접 생성하므로 예외

**비용 효과**: 4-agent × 다회 호출 구조에서 시스템 프롬프트 + 참조 파일의 반복 로드를 제거.
```

- [ ] **Step 2: design-engineer.md에 Frozen Snapshot 수신 프로토콜 추가**

`design-engineer.md`의 `## Task Execution Protocol` > `### 2. 컨텍스트 수집` 섹션을 다음으로 교체:

```markdown
### 2. 컨텍스트 수집

`TaskGet`으로 태스크 상세를 읽는다.

**Frozen Snapshot 활용** (Sprint Lead가 태스크 Description에 인라인 제공):

태스크 Description에 `--- FROZEN SNAPSHOT ---` 블록이 있으면:
- DESIGN.md를 **별도로 Read하지 않는다** — snapshot에 포함됨
- component-patterns.md를 **별도로 Read하지 않는다** — snapshot에 포함됨
- KB design 패턴을 **별도로 Read하지 않는다** — snapshot에 포함됨
- ✅ `design-tokens/` JSON은 직접 Read한다 (tokens.css 생성에 원본 필요)
- ✅ `screen-spec-template.md`는 직접 Read한다 (구조 참조 필요)

**Snapshot 미제공 시** (fallback — 호환성):
기존 프로토콜대로 각 파일을 직접 Read한다:
- PRD 원본 (태스크에 참조된 User Story + AC)
- 태스크 파일의 `### Screens / Components` 섹션
- 태스크 파일의 `### User Interactions` 섹션
- 태스크 파일의 `### Business Rules` 섹션
- 태스크 파일의 `### Interaction States` 섹션
- `design-tokens/` 디렉토리에서 관련 토큰 값

**스킵 조건**: `Screens / Components` 섹션이 없거나 비어있으면 `TaskUpdate: completed` (skipped).
```

- [ ] **Step 3: phase-prototype.md의 3.2에 Snapshot 조립 프로토콜 추가**

`phase-prototype.md`의 `### 3.2 Design Engineer 스폰` 섹션을 다음으로 교체:

```markdown
### 3.2 Design Engineer 스폰

각 대상 태스크에 대해:

**Step 1: Frozen Snapshot 조립** (Sprint Lead — 1회만)

첫 번째 Design Engineer 태스크 생성 전에 다음을 읽고 snapshot을 조립한다:

```
1. docs/designs/DESIGN.md (존재 시)
   → §1 Visual Theme, §4 Component Stylings, §7 Do's/Don'ts, §9 Agent Prompt Guide 발췌
2. docs/designs/component-patterns.md
   → 현재 스프린트 태스크와 관련된 패턴만 발췌 (예: Profile 관련 태스크면 §3 Profile Header, §5 Profile Edit)
3. knowledge-base/design/README.md
   → 관련 디자인 패턴 .yaml 파일 조회 + 인라인 포함
```

이 snapshot은 **모든 Design Engineer 태스크에 동일하게 포함**한다.
스프린트 내에서 재조립하지 않는다.

**Step 2: 태스크 생성**

```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: |
    --- FROZEN SNAPSHOT ---
    ## Design System (from DESIGN.md)
    {발췌 내용}

    ## Component Patterns (from component-patterns.md)
    {관련 패턴 발췌}

    ## Known Design Patterns (from KB)
    {관련 KB 디자인 패턴}
    --- END SNAPSHOT ---

    태스크: tasks/app/{task-id}.md
    Screen Spec 템플릿: sprint-orchestrator/templates/screen-spec-template.md
    HTML 템플릿: sprint-orchestrator/templates/html-prototype-template.html
    디자인 토큰: design-tokens/
    Context 출력: sprints/{sprint-id}/prototypes/context/
    프로토타입 출력: sprints/{sprint-id}/prototypes/app/{task-id}/
  Owner: Design Engineer
```
```

- [ ] **Step 4: evaluator.md에 Frozen Snapshot 수신 프로토콜 추가**

`evaluator.md`의 `### 2. 컨텍스트 구축` 섹션을 다음으로 교체:

```markdown
### 2. 컨텍스트 구축

`TaskGet`으로 평가 태스크를 읽고:

**Frozen Snapshot 활용** (Sprint Lead가 태스크 Description에 인라인 제공):

태스크 Description에 `--- FROZEN SNAPSHOT ---` 블록이 있으면:
- KB patterns를 **별도로 Read하지 않는다** — snapshot에 포함됨
- Evaluation Criteria를 **별도로 Read하지 않는다** — snapshot에 포함됨

Snapshot에서 다음을 확인:
1. **KB 패턴 체크리스트**: 이전 스프린트에서 발견된 관련 패턴 → 우선 검증 대상
2. **동적 Evaluation Criteria**: KB 패턴 기반으로 보강된 평가 기준

**항상 직접 Read하는 파일** (snapshot에 미포함):
1. **Sprint Contract**: `contracts/group-{N}.md` — Done Criteria와 검증 방법
2. **원본 태스크 파일들**: Specification, AC, Business Rules
3. **API Contract**: `api-contract.yaml` — 엔드포인트 스키마 (현재 그룹 범위)
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sprint/SKILL.md .claude/skills/sprint/phase-prototype.md \
       .claude/teammates/design-engineer.md .claude/teammates/evaluator.md
git commit -m "feat: add frozen snapshot caching for teammate prompt optimization"
```

---

## Task 4: Self-Improving Skill Nudge — Phase 6 + Design Engineer 자동 패턴 누적

> Hermes의 self-improving skills 패턴을 Retrospective와 Design Engineer에 적용.

**Files:**
- Modify: `.claude/skills/sprint/phase-retro.md`
- Modify: `.claude/skills/sprint/phase-modes.md`
- Modify: `.claude/teammates/design-engineer.md`
- Modify: `sprint-orchestrator/templates/sprint-contract-template.md`

- [ ] **Step 1: phase-retro.md에 6.7 KB Write 섹션 추가**

`phase-retro.md`의 `### 6.6 DESIGN.md 갱신 검토` 뒤에 추가:

```markdown
### 6.7 Knowledge Base Write (자동 패턴 누적)

> Ref: Hermes Agent self-improving skills — 스프린트 완료 후 패턴을 KB에 자동 기록.

Pattern Digest + Quality Report를 KB에 기록한다.

**Workflow**:

```
1. pattern-digest.yaml 읽기
2. knowledge-base/patterns/README.md 인덱스 읽기
3. For each pattern in pattern-digest:
   a. 인덱스에서 동일 title/category 매칭 검색
   b. 매칭 발견:
      - 해당 .yaml 파일 Read
      - frequency += 1
      - last_seen = current sprint-id
      - groups 배열에 현재 그룹 추가
      - Write (갱신)
      - README.md 인덱스의 Freq, Last Seen 갱신
   c. 매칭 없음 (신규):
      - 새 .yaml 파일 생성 (스키마: knowledge-base/README.md 참조)
      - pattern-digest의 systemic_fix → prevention 필드로 변환
      - pattern-digest의 pattern → description 필드로 변환
      - contract_clause: systemic_fix에서 Contract 조항 도출 (없으면 null)
      - README.md 인덱스에 행 추가
4. prototypes/quality-report.yaml 읽기 (존재 시)
5. fabrication_risk: medium 항목을 design/ KB에 동일 절차로 기록
```

**Design Engineer 패턴 기록**:

프로토타입에서 반복된 품질 이슈도 KB에 기록한다:

| 시그널 | Design KB 패턴 |
|--------|--------------|
| 같은 revision 사유가 2회+ | `design-proto-{NNN}`: 반복 보정 패턴 |
| fabrication_risk: medium + approved | `design-spec-{NNN}`: PRD 암묵적 요구사항 |
| quality_score.extraction_accuracy < 0.8 | `design-spec-{NNN}`: 추출 정확도 개선 필요 |

**Nudge 메커니즘**:

Retrospective 산출물 생성 후, 다음 조건을 체크:

```
if new_patterns_count >= 2:
    사용자에게: "이번 스프린트에서 {N}개 신규 패턴 발견, KB에 기록. 
    다음 스프린트의 Contract/Evaluation에 자동 반영됩니다."

if any pattern.frequency >= 3:
    사용자에게: "⚠ 패턴 '{title}'이 {N}개 스프린트에서 반복. 
    Sprint Contract 템플릿에 영구 반영을 권장합니다."
    → 사용자 승인 시 sprint-contract-template.md에 해당 clause 추가
```

**출력에 추가**:
```
  KB Update:
    Patterns updated: {N} (existing: {M} updated, new: {K} created)
    Design patterns: {N}
    Template nudge: {있으면 표시, 없으면 생략}
```
```

- [ ] **Step 2: phase-modes.md의 --follow-up Phase 2에 KB 자동 조회 추가**

`phase-modes.md`의 `#### Phase 2: Spec (확장)` 섹션, `2. **Evaluator 캘리브레이션 보강**` 부분을 다음으로 교체:

```markdown
2. **Evaluator 캘리브레이션 보강 (KB 자동 조회)**:

KB의 pattern 인덱스를 조회하여 evaluation criteria를 자동 보강한다.

```
1. knowledge-base/patterns/README.md 읽기
2. severity: critical 또는 (severity: major AND frequency >= 2) 패턴 필터
3. 필터된 패턴의 .yaml 파일 Read
4. 각 패턴의 detection + contract_clause를 evaluation/criteria.md에 추가:

## KB-Calibrated Checks (from {prev-sprint-id} + accumulated KB)
- Pattern: {title} (KB: {pattern-id}, freq: {N})
  Detection: {detection 필드 요약}
  Contract clause: {contract_clause}
```

기존 pattern-digest 기반 캘리브레이션은 유지하되, KB가 더 포괄적이므로 우선 적용:
- KB에 있고 pattern-digest에도 있는 패턴 → KB 버전 사용 (frequency 반영)
- pattern-digest에만 있는 패턴 → 기존대로 추가
```

- [ ] **Step 3: sprint-contract-template.md에 KB 자동 주입 가이드 추가**

`sprint-contract-template.md` 하단에 추가:

```markdown
## KB Pattern Clauses (자동 주입)

> Sprint Lead가 Contract 작성 시, `knowledge-base/patterns/README.md`에서
> 관련 패턴의 `contract_clause`를 Done Criteria에 자동 추가한다.
>
> 형식: `- [ ] {clause 내용} (KB: {pattern-id})`
>
> 주입 기준:
> - `severity: critical` → 항상 주입
> - `severity: major` + `frequency >= 2` → 주입
> - `severity: minor` → 주입하지 않음
```

- [ ] **Step 4: Design Engineer에 프로토타입 완료 시 패턴 보고 추가**

`design-engineer.md`의 `### 완료 보고` 섹션을 다음으로 교체:

```markdown
### 완료 보고

```
TaskUpdate: completed
Sprint Lead에게: "Prototype {task-id} complete. {N}개 화면 spec 작성 + HTML 생성. 
품질 점수: accuracy {X}, completeness {Y}, fabrication_risk: {Z}. 
리뷰 대기. 프로토타입: prototypes/app/{task-id}/prototype.html"
```

### 품질 이상 자동 보고 (Self-Improving Nudge)

완료 시 다음 조건을 체크하여 Sprint Lead에게 추가 보고:

| 조건 | 보고 내용 |
|------|----------|
| `fabrication_risk: medium` 항목 존재 | `⚠ Fabrication risk medium on {component}: {inferred_fields 목록}. PRD 보강 권장.` |
| `extraction_accuracy < 0.8` | `⚠ Low extraction accuracy ({score}): {원인 분석}. 태스크 spec 보강 또는 PRD 구체화 필요.` |
| 이전 KB 디자인 패턴과 동일 이슈 재발 | `⚠ KB pattern {pattern-id} 재발: {title}. 이 스프린트에서도 동일 문제 발생.` |

이 보고는 Phase 6에서 KB에 자동 기록된다.
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sprint/phase-retro.md .claude/skills/sprint/phase-modes.md \
       .claude/teammates/design-engineer.md \
       sprint-orchestrator/templates/sprint-contract-template.md
git commit -m "feat: add self-improving skill nudge with KB auto-accumulation"
```

---

## Task 5: PTC-Style Script Generation — Design Engineer HTML 생성 최적화

> Hermes의 Programmatic Tool Calling 패턴을 Design Engineer의 HTML Generation에 적용.
> 6-pass HTML 생성을 스크립트 기반으로 전환하여 컨텍스트 소모 최소화.

**Files:**
- Modify: `.claude/teammates/design-engineer.md`

- [ ] **Step 1: Design Engineer의 Step C에 Script-First Generation 프로토콜 추가**

`design-engineer.md`의 `## Step C: Prototype Generation (Screen Spec → HTML)` 섹션 시작부에 추가:

```markdown
## Step C: Prototype Generation (Screen Spec → HTML)

### Script-First Generation Protocol

> Ref: Hermes Agent PTC — 중간 tool call 결과가 컨텍스트를 먹지 않도록 스크립트로 일괄 처리.

HTML 생성의 6-pass를 **2단계**로 분리하여 컨텍스트 효율을 극대화한다:

**Phase α: Spec → Intermediate Data (컨텍스트 내)**
- Pass 1~2 (Structure + Components): Screen Spec을 읽고 HTML 구조를 **직접 생성**
- 이 단계는 Screen Spec 해석이 필요하므로 LLM 컨텍스트 내에서 수행

**Phase β: Data → Final HTML (스크립트 기반)**
- Pass 3~6 (Content + States + Interactions + Polish): 반복적/기계적 변환
- 이 단계를 **Bash 스크립트로 일괄 처리**하여 중간 결과가 컨텍스트에 진입하지 않음

### Phase α: Structure + Components (컨텍스트 내)

기존 Pass 1~2와 동일. Screen Spec의 Component Tree와 Layout Spec을 해석하여:
1. HTML 골격(`<section>` 구조 + CSS flex/grid)을 생성
2. 각 컴포넌트를 HTML 요소로 변환 + 토큰 CSS 적용
3. 결과를 `prototype-alpha.html`로 저장

```
sprints/{sprint-id}/prototypes/app/{task-id}/prototype-alpha.html
```

### Phase β: Content + States + Interactions + Polish (스크립트 기반)

prototype-alpha.html을 기반으로 나머지 패스를 Bash로 일괄 적용한다.

**적용 방법**: 다음 Bash 명령을 **한 번에 실행**하여 최종 prototype.html을 생성:

```bash
# prototype-alpha.html → prototype.html 변환
# Step 1: Labels 주입 (Screen Spec의 labels 섹션을 sed로 치환)
cp sprints/{sprint-id}/prototypes/app/{task-id}/prototype-alpha.html \
   sprints/{sprint-id}/prototypes/app/{task-id}/prototype.html

# Step 2: tokens.css 인라인 삽입
# Step 3: Control Panel 자동 생성 (screen ID 목록 + state 목록 추출)
# Step 4: 기본 JS 이벤트 바인딩 삽입
```

> 구체적인 sed/awk 명령은 생성하지 않는다 — Design Engineer가 prototype-alpha.html의
> placeholder를 실제 content로 채우는 과정을 **단일 Write 호출**로 수행한다.
> 핵심은 Pass 3~6을 **개별 Read/Edit가 아닌 한 번의 Write**로 완결하는 것이다.

### 실제 적용 규칙

1. **Phase α** (Pass 1~2): Screen Spec을 읽고 `prototype-alpha.html`을 Write
2. **Phase β** (Pass 3~6): `prototype-alpha.html`을 Read하고, Labels/States/Interactions/Polish를 모두 적용한 최종 `prototype.html`을 **한 번의 Write**로 생성
3. 중간 Read/Edit 루프를 최소화: Pass별로 Edit하지 않고, 최종 HTML을 **한 번에 완성**

**컨텍스트 절감 효과**:
- 기존: 6회 Read + 6회 Edit (12 tool calls, 각각의 결과가 컨텍스트 점유)
- 개선: 1회 Read(Spec) + 1회 Write(alpha) + 1회 Read(alpha) + 1회 Write(final) = 4 tool calls
```

- [ ] **Step 2: 기존 Pass 설명을 Phase α/β 참조로 업데이트**

`design-engineer.md`의 기존 `### C.2 HTML Generation Passes` 섹션을 다음으로 교체:

```markdown
### C.2 HTML Generation Passes (Phase α/β 통합)

```
Phase α (컨텍스트 내 — Screen Spec 해석 필요):
  Pass 1: Structure  — 스크린 프레임 + 레이아웃 구조 생성
  Pass 2: Components — 컴포넌트를 HTML 요소로 변환
  → prototype-alpha.html 저장

Phase β (단일 Write — 기계적 변환):
  Pass 3: Content    — 한국어 라벨 + placeholder 콘텐츠
  Pass 4: States     — 상태별 가시성 + state 컨테이너
  Pass 5: Interactions — 내비게이션 + 이벤트 바인딩
  Pass 6: Polish     — 통합 검증 + 미세 조정
  → prototype.html 저장 (prototype-alpha.html 기반 최종본)
```

**Phase α 입력/출력**:
| 입력 | 출력 |
|------|------|
| Screen Spec (Component Tree + Layout Spec + Component Details + Token Map) | prototype-alpha.html (구조 + 컴포넌트 + CSS) |

**Phase β 입력/출력**:
| 입력 | 출력 |
|------|------|
| prototype-alpha.html + Screen Spec (Labels + States + Interactions) + tokens.css | prototype.html (최종) |
```

- [ ] **Step 3: C.3 Pass별 컨텍스트 스코핑 규칙을 Phase α/β로 업데이트**

`design-engineer.md`의 `### C.3 Pass별 컨텍스트 스코핑 규칙` 섹션을 다음으로 교체:

```markdown
### C.3 Phase별 컨텍스트 스코핑 규칙

| Phase | 투입 컨텍스트 | 제외 컨텍스트 | 이유 |
|-------|-------------|-------------|------|
| α (Structure + Components) | Layout Spec, Component Tree, Component Details, Token Map | Labels, Interactions, States 상세 | 구조/스타일에 집중 |
| β (Content + States + Interactions + Polish) | prototype-alpha.html, Labels, States, Interactions, tokens.css | 개별 Component Details | alpha HTML이 이미 구조 포함 |

**원칙**: Phase α에서 Screen Spec의 구조적 정보를 HTML로 변환. Phase β에서 동적 정보(텍스트, 상태, 이벤트)를 한 번에 주입.
```

- [ ] **Step 4: Activity Logging에 Phase α/β 로깅 포인트 추가**

`design-engineer.md`의 `## Activity Logging` 섹션의 로깅 포인트 테이블에 교체:

```markdown
| 프로토콜 단계 | phase | message 예시 |
|-------------|-------|-------------|
| 1. 태스크 수령 | `started` | "프로토타입 태스크 수령" |
| 2. 컨텍스트 수집 | `context_loaded` | "화면 3개 식별: ProfileScreen, EditScreen, SettingsScreen" |
| 2. Snapshot 활용 | `snapshot_used` | "Frozen Snapshot 활용: DESIGN.md + patterns 3개 + KB 2개" |
| A. Context Engine 조립 | `context_engine` | "WHY 3 stories / WHAT 12 tokens / HOW 4 rules 조립 완료" |
| B. Spec 작성 시작 | `spec_writing` | "ProfileScreen spec 작성 중" |
| B. Spec 작성 완료 | `spec_complete` | "3개 화면 spec 완료, avg accuracy 0.92, fabrication none" |
| A. tokens.css 생성 | `tokens_generated` | "tokens.css 생성 완료 (42 variables)" |
| C. Phase α 완료 | `html_alpha` | "prototype-alpha.html 생성 (Structure + Components)" |
| C. Phase β 완료 | `html_final` | "prototype.html 생성 (Content + States + Interactions + Polish)" |
| 완료 보고 | `completed` | "프로토타입 완료, 품질 accuracy 0.95 / completeness 1.0" |
| 품질 이상 | `nudge` | "⚠ fabrication_risk medium on FollowerList" |
| 오류 | `error` | 오류 설명 (detail에 상세) |
```

- [ ] **Step 5: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "feat: add PTC-style script generation for Design Engineer HTML passes"
```

---

## Task 6: 통합 테스트 — 시드 데이터 검증 + 프로토콜 일관성 확인

**Files:**
- Read-only verification of all modified files

- [ ] **Step 1: KB 시드 데이터 일관성 검증**

```bash
# 모든 패턴 파일이 존재하는지 확인
ls sprint-orchestrator/knowledge-base/patterns/*.yaml

# README.md 인덱스의 행 수와 .yaml 파일 수 일치 확인
grep -c "^|" sprint-orchestrator/knowledge-base/patterns/README.md
ls sprint-orchestrator/knowledge-base/patterns/*.yaml | wc -l
```

Expected: 인덱스 행 수(헤더 2행 제외) = .yaml 파일 수 = 6

- [ ] **Step 2: 파일 간 참조 일관성 검증**

```bash
# SKILL.md에서 참조하는 phase 파일이 모두 존재하는지
for f in phase-init phase-spec phase-prototype phase-build phase-pr phase-retro phase-modes knowledge-base; do
  test -f .claude/skills/sprint/${f}.md && echo "OK: ${f}.md" || echo "MISSING: ${f}.md"
done

# Teammate 파일에서 참조하는 경로가 실제 존재하는지
grep -oP 'knowledge-base/\S+' .claude/teammates/design-engineer.md
grep -oP 'knowledge-base/\S+' .claude/teammates/evaluator.md
```

- [ ] **Step 3: 프로토콜 키워드 일관성 검증**

```bash
# "FROZEN SNAPSHOT" 키워드가 Sprint Lead(phase-prototype.md)와 Teammate(design-engineer.md, evaluator.md)에 모두 존재
grep -l "FROZEN SNAPSHOT" .claude/skills/sprint/*.md .claude/teammates/*.md

# "Budget Pressure" 키워드가 SKILL.md와 phase-build.md에 존재
grep -l "Budget Pressure" .claude/skills/sprint/*.md

# "KB Search" / "KB Write" 키워드가 knowledge-base.md에 존재
grep -c "KB Search\|KB Write" .claude/skills/sprint/knowledge-base.md
```

Expected:
- FROZEN SNAPSHOT: phase-prototype.md, design-engineer.md, evaluator.md (3 files)
- Budget Pressure: SKILL.md, phase-build.md (2 files)
- KB Search/KB Write: knowledge-base.md (2+ matches)

- [ ] **Step 4: 전체 변경사항 요약 커밋**

모든 태스크의 개별 커밋이 완료된 상태를 확인:

```bash
git log --oneline -10
```

Expected: 5개 커밋 (Task 1~5)

---

## Architecture Decision Records

### ADR-1: KB를 SQLite 대신 YAML 파일로 구현

**결정**: FTS5 검색 대신 파일 기반 인덱스(README.md) + grep 검색.
**이유**: (1) 외부 의존성 없이 기존 skill-native 아키텍처 유지 (2) 패턴 수가 수십 건 수준으로 파일 검색으로 충분 (3) Git으로 변경 이력 자동 추적 (4) Claude Agent가 YAML 파일을 직접 읽고 쓸 수 있어 별도 CLI 불필요.
**트레이드오프**: 패턴 수가 100건 이상이 되면 인덱스 검색 성능 저하 가능. 그때 SQLite 마이그레이션 검토.

### ADR-2: Frozen Snapshot을 TaskCreate Description에 인라인

**결정**: Teammate 시스템 프롬프트 변경 대신 태스크 Description에 snapshot 인라인.
**이유**: (1) Claude Code Agent Teams에서 teammate .md 파일은 시스템 프롬프트로 로드되어 변경 불가 (2) Description은 태스크별로 다르게 구성 가능 (3) snapshot 범위를 태스크별로 조절 가능.
**트레이드오프**: Description이 길어지지만, Design Engineer가 별도로 6~7개 파일을 Read하는 것보다 총 토큰 사용량 적음.

### ADR-3: PTC를 Bash 스크립트 대신 2-Phase Write로 구현

**결정**: Hermes의 Unix domain socket RPC 대신, Write 호출을 2회로 분리하는 간소화 버전.
**이유**: (1) Claude Code Agent는 Python RPC 서버를 실행할 수 없음 (2) 핵심 효과(중간 결과 컨텍스트 미진입)는 2-Phase Write로도 달성 (3) Design Engineer의 HTML 생성은 LLM 판단이 필요하므로 완전한 스크립트화 불가.
**트레이드오프**: Hermes의 PTC만큼 극단적인 컨텍스트 절감은 아니지만, 기존 12 tool calls → 4 tool calls로 67% 감소.

### ADR-4: Budget Pressure를 TaskCreate Description에 주입

**결정**: Hermes의 tool result JSON 주입 대신 TaskCreate Description에 pressure 힌트 추가.
**이유**: (1) Agent Teams에서 tool result는 Sprint Lead가 제어 불가 (2) TaskCreate Description은 Sprint Lead가 완전히 제어 가능 (3) Engineer/Evaluator가 태스크 수령 시 첫 번째로 읽는 정보이므로 효과적.
**트레이드오프**: 실시간 주입이 아닌 태스크 생성 시점 주입이므로, 태스크 실행 중 압력 변화는 반영 불가. 이 경우 새 태스크 생성으로 대응.
