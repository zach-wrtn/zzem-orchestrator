# ZZEM Orchestrator — Manual

실무 운영 매뉴얼. 스프린트 실행 절차, 트러블슈팅, 템플릿 사용법을 다룬다.

---

## 1. 스프린트 실행 전 준비

### 1.1 환경 설정

```bash
# Agent Teams 활성화 (필수)
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 레포지토리 연결 (심볼릭 링크)
./scripts/setup.sh
```

### 1.2 PRD 준비

`docs/prds/` 디렉토리에 PRD를 작성한다.

- **템플릿**: `sprint-orchestrator/templates/prd-template.md`
- **네이밍**: `PRD-{project}-{번호}-{slug}.md` (예: `PRD-ugc-platform-1-profile-navigation.md`)

PRD 필수 섹션:
```yaml
title: "(PRD 제목)"
domain: ZZEM
status: 대기
description: "(한 줄 요약)"
kpi: "(지표 → 비즈니스 임팩트)"
```

- Overview + 구현 범위
- User Stories + Acceptance Criteria (Given/When/Then 형식)
- 비즈니스 룰
- 경계 (ALWAYS DO / NEVER DO)

---

## 2. 스프린트 라이프사이클

### Phase 1: Init

```bash
/sprint ugc-profile-nav-001 --phase=init
```

Sprint Lead에게 필요한 입력:
- `sprint-id`: 스프린트 식별자
- `prd-file`: PRD 파일 경로
- `base branches`: backend/app 각각의 base branch

산출물:
```
sprints/{sprint-id}/
├── PRD.md
├── sprint-config.yaml
├── tasks/ (app/, backend/)
├── contracts/
├── evaluations/
├── prototypes/app/
├── checkpoints/
└── logs/
```

### Phase 2: Spec

```bash
/sprint ugc-profile-nav-001 --phase=spec
```

Sprint Lead(Planner)가 수행하는 작업:
1. PRD 분석 → User Story + AC 추출
2. 코드베이스 기존 패턴 파악
3. `api-contract.yaml` 생성 (OpenAPI 3.0)
4. 태스크 분해 → `tasks/backend/*.md`, `tasks/app/*.md`
5. `evaluations/criteria.md` 생성
6. **KB 패턴 조회**: `zzem-kb:read type=pattern category=<관련>`으로 관련 패턴을 검색하여 태스크 spec과 evaluation criteria에 반영

**태스크 필수 섹션**: Target, Context, Objective, Specification, Acceptance Criteria

**태스크 그룹 규칙**:
- 동일 번호 = 병렬 실행 가능
- 낮은 번호 = 선행 필수
- 같은 그룹의 BE/FE는 API Contract를 SSOT로 사용

### Phase 3: Prototype

```bash
/sprint ugc-profile-nav-001 --phase=prototype
```

**자동 스킵 조건**:
- app 태스크 0개
- 모든 app 태스크에 `Screens / Components` 섹션 없음
- `sprint-config.yaml`에 `prototype: skip`

**Frozen Snapshot 조립**: Sprint Lead가 첫 Design Engineer 태스크 생성 전에 DESIGN.md + component-patterns.md + KB 디자인 패턴을 1회 읽고 snapshot을 조립한다. 이 snapshot은 모든 Design Engineer 태스크의 Description에 `--- FROZEN SNAPSHOT ---` 블록으로 인라인 제공된다.

**PTC 2-Phase HTML 생성**: Design Engineer는 6-pass 대신 2-phase로 HTML을 생성한다:
- Phase α: Screen Spec → prototype-alpha.html (구조 + 컴포넌트)
- Phase β: alpha → prototype.html (콘텐츠 + 상태 + 인터랙션, 단일 Write)

**리뷰 옵션**:

| 선택 | 의미 |
|------|------|
| `approve` | 태스크에 Prototype Reference 추가 |
| `reject` | 참조 제외 |
| `revise` | minor(CSS) 또는 major(구조) revision |
| `skip` | pending 유지 |

**Revision 분류** (Sprint Lead가 자동 판단):
- **minor**: 간격, 색상, 크기, 텍스트, 폰트 → annotation 방식
- **major**: 레이아웃 구조, 컴포넌트, 인터랙션 변경 → live preview (localhost:8080)

Phase 3 완료 시 자동으로 PRD Amendment Extraction(3.4)과 PRD Refinement(3.5) 실행.

### Phase 4: Build

```bash
/sprint ugc-profile-nav-001 --phase=build
/sprint ugc-profile-nav-001 --phase=build --resume    # 중간 재시작
```

기능 그룹 단위 반복 루프:

```
For each group:
  4.1 Sprint Contract → Evaluator 리뷰 합의
  4.2 Implement → BE/FE 병렬, worktree 사용
  4.3 Merge → sprint 브랜치에 --no-ff
  4.4 Evaluate → Active Evaluation
  4.5 Fix/Accept → PASS면 다음 그룹, ISSUES/FAIL면 fix loop
```

**Budget Pressure 모니터링**: Build Loop 중 Sprint Lead가 자동으로 pressure 레벨을 관리한다:
- 🟢 Normal: 정상 진행
- 🟡 Caution (fix loop 1회 진입): Minor 이슈 이월, 핵심 AC에 집중 지시
- 🔴 Urgent (fix loop 2회 진입): 사용자에게 scope 축소 옵션 제시

**KB 패턴 자동 주입**: Sprint Contract 작성 시 Knowledge Base의 critical 패턴이 Done Criteria에 자동 추가된다. `(KB: {pattern-id})` 태그로 출처 표시.

**사용자 개입이 필요한 상황**:
- 머지 충돌 발생
- Fix loop 3회차 실패
- FAILED 그룹 처리 결정

### Phase 5: PR

```bash
/sprint ugc-profile-nav-001 --phase=pr
/sprint ugc-profile-nav-001 --phase=pr --allow-partial    # FAILED 그룹 제외
```

Sprint 브랜치 → base branch로 PR 생성. Push 전 사용자 확인 필수.

App PR은 `/meme-pr-create` 스킬 사용 권장 (과일환경 추출 + CodePush 분석).

### Phase 6: Retrospective

```bash
/sprint ugc-profile-nav-001 --phase=retro
```

자동 생성되는 산출물:

| 파일 | 내용 |
|------|------|
| `gap-analysis.yaml` | PRD AC 달성 여부 (fulfilled/partially/unfulfilled) |
| `pattern-digest.yaml` | 반복 실패 패턴 + 시스템 개선 제안 |
| `deferred-items.yaml` | 이월 항목 + 우선순위 + 접근 방법 |
| **KB Write** | Knowledge Base 자동 갱신 (기존 패턴 frequency 증가 + 신규 패턴 등록) |
| `REPORT.md` | 통합 스프린트 리포트 |

---

## 3. 후속 스프린트

### --continue (같은 스프린트 이어서)

```bash
/sprint ugc-profile-nav-001 --continue
```

전제조건: Phase 6 완료 + `deferred-items.yaml`에 항목 존재

동작:
1. 이월 항목을 새 그룹으로 구성
2. 이전 실패 원인 + Evaluator 피드백을 Contract에 반영
3. Phase 4 Build 루프 재진입
4. 완료 후 기존 PR에 추가 push 또는 새 PR (사용자 선택)
5. Phase 6 재실행

### --follow-up (후속 스프린트)

```bash
/sprint new-sprint-id --follow-up=ugc-profile-nav-001
```

전제조건: 이전 스프린트의 `retrospective/` 존재

동작:
1. 이전 gap-analysis + deferred-items + pattern-digest 상속
2. Delta PRD 생성 (이월 + 추가 요구사항)
3. Regression Guard: 이전 fulfilled AC의 회귀 검증 필수
4. **Evaluator 캘리브레이션**: KB 인덱스 조회 → critical/major 패턴의 detection + contract_clause를 evaluation criteria에 자동 반영
5. 전체 Phase 1~6 실행

---

## 4. 모니터링

### 대시보드

```bash
/sprint ugc-profile-nav-001 --status
```

표시 정보:
- Build Progress (그룹별 진행률)
- Agent Activity (각 에이전트 현재 상태)
- Prototype 승인 현황
- PR 상태
- Checkpoint 완료 현황
- 병목 감지 경고

### 자동 모니터링

```bash
/loop 3m /sprint ugc-profile-nav-001 --status
```

### 병목 감지 규칙

| 조건 | 경고 |
|------|------|
| Agent ACTIVE 10분+ | `⚠ {Agent} ACTIVE for {N}m+` |
| Agent BUILD FAIL | `🔴 {Agent} build failed` |
| Agent ERROR | `🔴 {Agent} error` |
| 그룹 내 한쪽만 완료 5분+ | `⚠ Group {N} blocked` |
| Fix loop 2회차 진입 | `⚠ Group {N} in fix loop round 2` |

---

## 5. 템플릿 가이드

### sprint-config-template.yaml

```yaml
sprint_id: "{sprint-id}"
branch_prefix: "sprint"      # 브랜치 네임스페이스 (기본 "sprint")

repositories:
  backend:
    source: "git@github.com:org/backend-repo.git"
    base: "main"
    mode: "worktree"
  app:
    source: "git@github.com:org/app-repo.git"
    base: "release/1.2.2"
    mode: "worktree"
  tokens:
    source: "git@github.com:org/design-tokens.git"
    base: "main"
    mode: "symlink"          # 읽기 전용, 브랜치 불필요

defaults:
  base: "main"

team:
  teammates:
    - be-engineer
    - fe-engineer
    - design-engineer
    - evaluator
  settings:
    eval_retry_limit: 2
    max_parallel_tasks: 4
```

> Role key(`backend`, `app`, `tokens`)가 디렉토리 이름이자 태스크 경로 prefix로 쓰인다. Role은
> 프로젝트별로 자유롭게 추가/제거할 수 있다.

### 태스크 파일 구조

```markdown
# Task: {task-id}

## Target
- project: {backend | app}
- target_path: {구현 대상 경로}
- group: {group-N}

## Context
{PRD 참조, 관련 태스크, 선행 조건}

## Objective
{이 태스크가 달성해야 할 결과 1~2문장}

## Specification
{무엇을 구현해야 하는지 — How가 아닌 What}

## Acceptance Criteria
- AC 1: Given {조건} When {행동} Then {결과}
- AC 2: ...

## Implementation Hints (optional)
{기존 코드베이스 패턴 참조만. 구체적 구현 지시 금지}
```

### Screen Spec 구조

Machine-readable 화면 명세 (`screen-spec-template.md` 참조):

- **Meta**: screen_name, task_id, platform, frame, theme
- **Component Tree**: 들여쓰기 계층 구조
- **Component Details**: type, position, size, tokens, behavior, states, a11y
- **Layout Spec**: flex-column 기반 영역 정의
- **States**: default, empty, loading, error
- **Interactions**: trigger → target → action → destination
- **Labels (ko)**: 화면에 표시되는 모든 한국어 텍스트
- **Token Map**: WDS 토큰 매핑
- **Quality Score**: 추출 정확도, fabrication risk, schema completeness

### Sprint Contract 구조

```markdown
# Sprint Contract: Group {N}

## Scope
- Tasks: {task-ids}
- Endpoints: {API endpoints}

## Done Criteria
- [ ] {testable criterion — 코드로 검증 가능해야 함}

## Verification Method
| Criterion | 검증 방법 |
|-----------|----------|
| {기준}    | {구체적 검증 방법} |

## Edge Cases to Test
- {case}: {expected behavior}

## Business Rules to Validate
- {rule}: {코드 반영 방법}
```

---

## 6. 트러블슈팅

### Worktree 잔여물 정리

```bash
git worktree list                              # 전체 worktree 확인
git worktree remove --force .worktrees/{name}  # 강제 삭제
git branch -D {branch_prefix}/{sprint-id}/{task-id}  # 잔여 브랜치 삭제
```

### 스프린트 브랜치 복구

```bash
cd backend    # 또는 app/tokens 등 역할 디렉토리
git log --oneline {branch_prefix}/{sprint-id}  # 현재 상태 확인
git checkout {branch_prefix}/{sprint-id}       # 브랜치 전환
```

### 중간 재시작

```bash
/sprint {sprint-id} --phase=build --resume
```

contracts/와 evaluations/ 디렉토리를 스캔하여 마지막 완료 그룹을 찾고, 다음 미완료 그룹부터 재개.

### QA Pattern Check 실패

```bash
/qa-pattern-check
```

- 폴링 자기 무효화 무한루프 (ESLint 커스텀 규칙)
- Zod 스키마 nullable 검증 (Jest fixture 테스트)

FAIL 시 FE Engineer에게 fix 태스크 재할당 후 재머지.

---

## 7. 아티팩트 커밋 규칙

> 교훈: ugc-full 스프린트에서 장시간 작업 중 아티팩트를 커밋하지 않아 유실된 사례.

**규칙**: Phase 완료 시마다 스프린트 아티팩트를 커밋한다.

```bash
# Phase 2 완료 후
git add sprint-orchestrator/sprints/{sprint-id}/
git commit -m "sprint: {sprint-id} Phase 2 spec complete"

# Group N PASS 후
git add sprint-orchestrator/sprints/{sprint-id}/
git commit -m "sprint: {sprint-id} group-{N} accepted"
```

---

## 8. Design System Reference

### 토큰 계층

```
tokens/           # (role key — 실제 디렉토리명은 sprint-config.yaml에서 결정)
├── primitive/     → 기본값 (color.json, typography.json, spacing.json, ...)
├── semantic/      → 의미 기반 (light.json, dark.json, typography.json)
└── component/     → 컴포넌트별 (button.json, card.json, input.json, ...)
```

### 핵심 토큰

| 용도 | 토큰 | Light 값 |
|------|------|----------|
| Brand | `semantic.fill.brand-primary` | `#8752FA` |
| Background | `semantic.background.normal` | `#FFFFFF` |
| Text primary | `semantic.label.normal` | `#212228` |
| Text secondary | `semantic.label.alternative` | `#6B6E76` |
| Text hint | `semantic.label.assistive` | `#8E9199` |
| Divider | `semantic.line.normal` | `#E4E5E9` |
| Error | `semantic.status.negative` | `#D33717` |
| Button primary | `component.button.primary.fill` | `#8752FA` |
| Card | `component.card.fill` | `#FFFFFF` |
| Card radius | `component.card.radius` | `16px` |
| Input fill | `component.input.fill` | `#F7F8F9` |
| Nav active | `component.navigation.bottom-bar.active` | `#8752FA` |

### 스페이싱 스케일

4px 기반: `0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80`

### 라운드 스케일

`xs(4) → sm(8) → md(12) → lg(16) → xl(20) → 2xl(24) → full(9999)`

### 폰트

- Primary: **Pretendard** (fallback: SF Pro Display)
- Device frame: 390×844 (iOS)

---

## 9. Knowledge Base 운영

### 검색

KB는 표준 리포 `zach-wrtn/knowledge-base`(로컬 clone: `$ZZEM_KB_PATH`, 기본 `~/.zzem/kb`)에 저장된다. **접근은 `zzem-kb:*` 스킬로만 수행한다** — 파일시스템 직접 읽기/쓰기 금지.

```
# 세션 시작 시 동기화 (SessionStart 훅이 자동 수행)
zzem-kb:sync

# 카테고리별 조회
zzem-kb:read type=pattern category=correctness

# 특정 도메인 reflection 조회
zzem-kb:read type=reflection domain=<domain> limit=3

# 최신 rubric
zzem-kb:read type=rubric status=active
```

### 자동 기록 (Phase 6)

Phase 6 Retrospective에서 `zzem-kb:*` 스킬을 통해 자동으로:
1. `pattern-digest.yaml`의 각 패턴을 `zzem-kb:read`로 매칭
2. 기존 패턴 → `zzem-kb:update-pattern`로 frequency 증가 + last_seen 갱신
3. 신규 패턴 → `zzem-kb:write-pattern`로 ID 자동 채번 + 스키마 검증 + 커밋/푸시
4. 스프린트 종료 → `zzem-kb:write-reflection`로 도메인 학습 기록
5. Design Engineer quality-report의 fabrication_risk → `zzem-kb:write-pattern category=design_proto`

### Nudge 알림

| 조건 | 사용자 알림 |
|------|-----------|
| 신규 패턴 2건+ | "KB에 {N}개 신규 패턴 기록" |
| 패턴 frequency ≥ 3 | "⚠ 패턴 반복 — Sprint Contract 템플릿 영구 반영 권장" |

### 수동 관리

수동 편집 금지. 항상 `zzem-kb:*` 스킬 경유. status 변경(archived 등)도 스킬 또는 PR을 통해 처리한다. 상세 가이드는 `.claude/skills/sprint/knowledge-base.md` 참조.
