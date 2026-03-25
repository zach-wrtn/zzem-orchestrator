# Agent Teams Architecture — ZZEM Agentic Sprint System

> 스프린트 파이프라인을 Claude Code Agent Teams 기반으로 재설계한 아키텍처 명세.

## 1. 개요

### Before: 단일 세션 순차 실행

```
/sprint-init → /sprint-plan → /sprint-prototype → /sprint-run → /sprint-pr
                                                       │
                                                  Agent tool (subagents)
                                                  - 서로 소통 불가
                                                  - 결과만 리턴
                                                  - 제한된 컨텍스트
```

### After: Agent Teams 병렬 실행

```
/sprint <sprint-id>
  │
  Sprint Lead (Team Lead)
  ├── Phase 1: Init ────────────── solo
  ├── Phase 2: Plan ────────────── solo
  ├── Phase 3: Prototype ───────── + Design Engineer
  ├── Phase 4: Execute ─────────── + BE Engineer + FE Engineer + QA Engineer
  └── Phase 5: PR ──────────────── solo
```

**핵심 변경**: subagent 패턴에서 Agent Teams 패턴으로 전환.
- Teammate는 독립 Claude Code 세션으로 실행
- 공유 TaskList로 태스크 분배 및 진행 추적
- 메시지를 통한 Teammate 간 조율

## 2. 팀 구성

| Role | 세션 | Scope | 생명주기 |
|------|------|-------|---------|
| Sprint Lead | 메인 세션 (Team Lead) | 오케스트레이션 전체 | 전 Phase |
| BE Engineer | Teammate 세션 | wrtn-backend | Phase 4 |
| FE Engineer | Teammate 세션 | app-core-packages | Phase 4 |
| Design Engineer | Teammate 세션 | Stitch MCP | Phase 3 |
| QA Engineer | Teammate 세션 | 양쪽 레포 (read-only) | Phase 4 |

### Teammate 정의 파일

```
.claude/teammates/
├── be-engineer.md       # Backend 구현 전문 프롬프트
├── fe-engineer.md       # Frontend 구현 전문 프롬프트
├── design-engineer.md   # Stitch 프로토타입 전문 프롬프트
└── qa-engineer.md       # 품질 검증 전문 프롬프트
```

## 3. 태스크 조율 프로토콜

### 3.1 태스크 네이밍

Agent Teams `TaskCreate`의 Subject 필드 규칙:

| Phase | Pattern | Example |
|-------|---------|---------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | `proto/app/001-profile-screen/ProfileScreen` |
| Implementation | `impl/backend/{task-id}` | `impl/backend/001-profile-api` |
| Implementation | `impl/app/{task-id}` | `impl/app/001-profile-screen` |
| QA | `qa/{project}/{task-id}` | `qa/backend/001-profile-api` |

### 3.2 의존성 인코딩

태스크 파일의 번호 체계를 Agent Teams 의존성으로 변환:

```
태스크 파일 번호:     001 → 002 → 003 → 004
Agent Teams:         Group 001 unblocked
                     Group 002 addBlockedBy → all Group 001 (같은 project)
                     Group 003 addBlockedBy → all Group 002 (같은 project)
```

크로스 프로젝트 의존성은 태스크 파일의 `Dependencies` 필드에서 추출.

### 3.3 메시징 프로토콜

```
Teammate → Sprint Lead:
  "Task {task-id} complete, branch zzem/{sprint-id}/{task-id} ready for merge"
  "Task {task-id} FAILED: {reason}"

Sprint Lead → Teammate:
  "Merge done for {task-id}, group {N+1} unblocked"
  "QA failed for {task-id}: {details}. Fix needed."

Sprint Lead → User:
  "Phase {N} complete. Proceeding to Phase {N+1}."
  "Merge conflict in {task-id}. Manual resolution needed."
```

## 4. 실행 모델

### Phase 4 상세 플로우

```
Sprint Lead                    BE Engineer              FE Engineer           QA Engineer
    │                              │                        │                     │
    ├─ Sprint branch 생성          │                        │                     │
    ├─ TaskCreate (all tasks)      │                        │                     │
    │                              │                        │                     │
    │  ← Group 001 unblocked →     │                        │                     │
    │                              ├─ Pick: impl/be/001     │                     │
    │                              ├─ Worktree 생성         ├─ Pick: impl/app/001 │
    │                              ├─ 구현                  ├─ Worktree 생성      │
    │                              ├─ Self-QA               ├─ 구현               │
    │                              ├─ TaskUpdate: done ──►  ├─ Self-QA            │
    │  ◄── "ready for merge" ──────┤                        ├─ TaskUpdate: done   │
    ├─ git merge be/001            │                        │                     │
    ├─ Worktree cleanup            │                        │                     │
    ├─ TaskCreate: qa/be/001 ──────┼────────────────────────┼──►                  │
    │                              │                        │  ├─ 검증            │
    │  ◄── "ready for merge" ──────┼────────────────────────┤  ├─ QA Report       │
    ├─ git merge app/001           │                        │  └─ TaskUpdate: done│
    ├─ Worktree cleanup            │                        │                     │
    ├─ TaskCreate: qa/app/001 ─────┼────────────────────────┼──►                  │
    │                              │                        │                     │
    │  ← Group 002 unblocked →     │                        │                     │
    │                              ├─ Pick: impl/be/002     ├─ Pick: impl/app/002 │
    │                              ...                      ...                   │
```

### Worktree 격리

각 Teammate는 독립 worktree에서 작업:

```
.worktrees/
├── backend_001-profile-api/           # BE Engineer
├── backend_001-nickname-auto-gen/     # BE Engineer (병렬)
├── app_001-profile-screen/            # FE Engineer
└── app_001-profile-edit-screen/       # FE Engineer (병렬)
```

Sprint Lead가 머지 후 worktree 정리.

## 5. 브랜치 전략 (변경 없음)

기존 `docs/designs/branch-strategy.md` 그대로 유지:

```
Task Branch → Sprint Branch → Base Branch
zzem/{sprint-id}/{task-id} → zzem/{sprint-id} → {base-branch}
```

- Sprint Lead만 머지 수행 (순차)
- Teammate는 task branch에서만 작업
- base branch는 `sprint-config.yaml`에서 동적 해석

## 6. 에러 처리

| 상황 | 처리 주체 | 동작 |
|------|----------|------|
| Teammate 구현 실패 | Sprint Lead | fix 태스크 재할당 (최대 2회) → FAILED |
| Self-QA 실패 | Teammate | 자체 수정 재시도 (최대 3회) → Sprint Lead에 FAILED 보고 |
| 머지 충돌 | Sprint Lead → 사용자 | 스프린트 중단, 충돌 상세 출력, 수동 해결 요청 |
| QA 실패 | Sprint Lead | 원 Teammate에게 QA report와 함께 fix 태스크 재할당 |
| Teammate 타임아웃 | Sprint Lead | 30분 초과 시 FAILED, 다음 태스크 진행 |
| Stitch MCP 불가 | Design Engineer | 수동 폴백 프롬프트 출력, Sprint Lead에 통보 |

## 7. 설정

### 환경 변수

`.claude/settings.local.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Sprint Config

`sprint-config.yaml`에 team 섹션 추가:
```yaml
team:
  teammates: [be-engineer, fe-engineer, design-engineer, qa-engineer]
  settings:
    task_timeout_minutes: 30
    qa_retry_limit: 2
    max_parallel_tasks: 4
```

## 8. 마이그레이션

| 단계 | 변경 |
|------|------|
| 기존 6개 스킬 | `.claude/skills/_archived/`로 이동 |
| 새 통합 스킬 | `.claude/skills/sprint/SKILL.md` |
| Teammate 정의 | `.claude/teammates/*.md` 4개 신규 |
| 호출 방식 | `/sprint-init`, `/sprint-run` 등 → `/sprint <id>` 통합 |

기존 스프린트 데이터 (`sprint-orchestrator/sprints/`) 및 브랜치 전략은 변경 없이 호환.
