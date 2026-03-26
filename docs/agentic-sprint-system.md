# Agentic Sprint System (v3 — Agent Teams)

> **v2 Shell Scripts → v3 Agent Teams 전환 완료.**
> 모든 오케스트레이션을 Claude Code의 Agent Teams 기능으로 통합.
> 단일 `/sprint` 스킬이 5개 Phase를 관리하고, 4명의 전문 Teammate를 스폰한다.

## 대상 프로젝트

| 역할 | 레포 | 대상 앱/API | 경로 |
|------|------|-------------|------|
| App | app-core-packages | MemeApp | `apps/MemeApp/` |
| Backend | wrtn-backend | meme-api | `apps/meme-api/` |

> 두 레포는 독립 git repo이며, zzem-orchestrator의 `.gitignore`에 등록되어 있다.
> 각 레포에는 이미 CLAUDE.md와 에이전트 스킬이 존재하며, 이를 **확장**한다 (대체하지 않음).

---

## 1. 시스템 구조

### 1.1 디렉토리 구조

```
zzem-orchestrator/
├── .claude/
│   ├── settings.local.json          # Agent Teams 활성화, MCP 키
│   ├── skills/
│   │   └── sprint/SKILL.md          # 통합 /sprint 스킬 (5 phases)
│   └── teammates/
│       ├── be-engineer.md           # Backend 전문
│       ├── fe-engineer.md           # Frontend 전문
│       ├── design-engineer.md       # UI 프로토타입 전문
│       └── qa-engineer.md           # QA 검증 전문
│
├── sprint-orchestrator/
│   ├── templates/
│   │   ├── sprint-config-template.yaml
│   │   ├── stitch-prompt-template.md
│   │   └── prd-template.md
│   └── sprints/
│       └── {sprint-id}/
│           ├── PRD.md                    # 입력 (PRD 원본 링크 + 스코프 요약)
│           ├── sprint-config.yaml        # 브랜치, 팀 설정
│           ├── api-contract.yaml         # OpenAPI 3.0 SSOT
│           ├── tasks/
│           │   ├── app/                  # MemeApp 태스크 (*.md)
│           │   └── backend/              # meme-api 태스크 (*.md)
│           ├── prototypes/
│           │   └── app/
│           │       ├── {task-id}/
│           │       │   ├── {ScreenName}.html
│           │       │   ├── stitch-prompt.md
│           │       │   └── {ScreenName}.png
│           │       └── approval-status.yaml
│           ├── qa/
│           │   └── test-scenarios.md
│           └── logs/
│
├── app-core-packages/               # .gitignore됨 (독립 git repo)
├── wrtn-backend/                    # .gitignore됨 (독립 git repo)
└── docs/
    └── agentic-sprint-system.md     # 이 문서
```

### 1.2 설정 (`settings.local.json`)

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "STITCH_API_KEY": "<key>"
  }
}
```

---

## 2. Agent Teams 아키텍처

### 2.1 Sprint Lead (메인 에이전트)

`/sprint` 스킬을 실행하는 메인 Claude Code 세션.
전체 파이프라인을 오케스트레이션하고, Teammate를 스폰/모니터링/머지한다.

### 2.2 Teammates

| Teammate | 정의 파일 | 역할 | 주요 도구 |
|----------|----------|------|----------|
| BE Engineer | `.claude/teammates/be-engineer.md` | Backend (NestJS) 태스크 구현 | Worktree, tsc, eslint, jest |
| FE Engineer | `.claude/teammates/fe-engineer.md` | App (React Native) 태스크 구현 | Worktree, tsc, eslint, jest |
| Design Engineer | `.claude/teammates/design-engineer.md` | Stitch MCP로 UI 프로토타입 생성 | Stitch MCP |
| QA Engineer | `.claude/teammates/qa-engineer.md` | Acceptance Criteria 검증 (읽기 전용) | tsc, eslint, jest |

### 2.3 태스크 네이밍 컨벤션

| Phase | Subject 패턴 | Owner |
|-------|-------------|-------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | Design Engineer |
| Implementation | `impl/backend/{task-id}` | BE Engineer |
| Implementation | `impl/app/{task-id}` | FE Engineer |
| QA Validation | `qa/{project}/{task-id}` | QA Engineer |

---

## 3. `/sprint` 스킬 — 통합 파이프라인

### Invocation

```
/sprint <sprint-id>                    # 전체 파이프라인 (Phase 1~5)
/sprint <sprint-id> --phase=init       # Phase 1만
/sprint <sprint-id> --phase=plan       # Phase 2만
/sprint <sprint-id> --phase=prototype  # Phase 3만
/sprint <sprint-id> --phase=run        # Phase 4부터 재개
/sprint <sprint-id> --phase=pr         # Phase 5만
/sprint <sprint-id> --status           # 상태 대시보드 (읽기 전용)
/sprint                                # 최근 스프린트 자동 감지
```

---

## 4. Phase 1: Init (Sprint Lead solo)

스프린트 디렉토리와 설정 파일을 초기화한다.

1. `sprint-id`와 PRD 파일 경로를 수집한다.
2. 디렉토리 생성: `sprints/{sprint-id}/` + 하위 구조 (tasks, prototypes, qa, logs).
3. PRD.md 생성: 원본 링크 + 스코프 요약.
4. `sprint-config.yaml` 생성: 사용자에게 base branch 질문.
   - 템플릿: `templates/sprint-config-template.yaml`

**Output**: 디렉토리 + 설정 완료 → Phase 2로 진행.

---

## 5. Phase 2: Plan (Sprint Lead solo)

PRD를 분석하여 API contract, 태스크 파일, QA 시나리오를 생성한다.

### 워크플로우

1. **PRD 분석**: User Story, Acceptance Criteria 추출.
2. **코드베이스 패턴 파악**:
   - Backend: `wrtn-backend/apps/meme-api/src/` — Controller → Service → Repository → Entity
   - App: `app-core-packages/apps/MemeApp/src/` — Screen → ViewModel → UseCase → Repository
3. **API Contract 생성**: `api-contract.yaml` (OpenAPI 3.0).
4. **태스크 분해**: `tasks/backend/*.md`, `tasks/app/*.md` 생성.
5. **QA 시나리오**: `qa/test-scenarios.md` 생성.
6. **자체 검증**: OpenAPI 유효성, 필수 섹션, 순환 의존성 없음.

### 태스크 파일 필수 섹션

| 섹션 | 내용 |
|------|------|
| Target | `target_app` / `target_api`, `target_path` |
| Context | Sprint ID, PRD 참조, API Contract 경로, Dependencies, Parallel |
| Objective | 1-2문장 목표 |
| Specification | Design Tokens, Screens/Components, User Interactions, Business Rules, Interaction States |
| Implementation Hints | 기존 패턴 참조, 필수 스킬, Domain/Data 구조 |
| Acceptance Criteria | 검증 가능한 체크리스트 |
| QA Checklist | tsc, lint, jest, regression, scope 검증 |

### 태스크 번호 규칙

- **동일 번호 = 병렬 수행 가능** (001 그룹이 모두 완료되어야 002 그룹 시작)
- **낮은 번호 = 선행 태스크**
- 태스크 파일의 `Dependencies` 필드에 크로스 의존성 명시

**Output**: API Contract + Backend/App 태스크 + QA 시나리오 → Phase 3로 진행.

---

## 6. Phase 3: Prototype (Sprint Lead + Design Engineer)

App 태스크의 UI 프로토타입을 Google Stitch MCP로 생성하고 리뷰한다.

### 워크플로우

1. **필터링**: app 태스크 중 `### Screens / Components` 섹션이 있는 태스크만 대상.
2. **Design Engineer 스폰**: 각 대상 화면에 대해 `TaskCreate` (Owner: Design Engineer).
3. **프로토타입 생성**: Design Engineer가 `stitch-prompt-template.md` 기반으로 Stitch 호출.
   - `mcp__stitch__generate_screen_from_text` → HTML 프로토타입
   - `mcp__stitch__apply_design_system` → "ZZEM Production" 디자인 시스템 적용
   - Fallback: `stitch-prompt.md`를 저장하여 수동 생성 가능
4. **리뷰**: Sprint Lead가 사용자에게 순차 리뷰 진행.

| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크에 `## Prototype Reference` 추가 |
| **reject** | 상태 기록, 프로토타입 참조 제외 |
| **revise** | 피드백 → Design Engineer에게 수정 태스크 재할당 |
| **skip** | pending 상태 유지 |

### Gate

Phase 4 진입 전 `approval-status.yaml`에 pending/rejected가 있으면 경고.
`--force`로 게이트 무시 가능.

**Output**: 프로토타입 HTML + approval-status → Phase 4로 진행.

---

## 7. Phase 4: Execute (Sprint Lead + BE + FE + QA — Full Parallelism)

태스크를 Teammate에게 분배하여 병렬 실행, 머지, QA 검증.

### 7.1 Sprint 브랜치 생성

```bash
# sprint-config.yaml 기반
# wrtn-backend
git checkout -b zzem/{sprint-id} origin/{backend-base}

# app-core-packages
git checkout -b zzem/{sprint-id} origin/{app-base}
```

Base branch 해석: `branches.{project}.base` → `defaults.base` → `"main"`.

### 7.2 태스크 분배

Sprint Lead가 Agent Teams TaskCreate로 등록:
- Backend 태스크 → **BE Engineer**
- App 태스크 → **FE Engineer**
- 태스크 번호 기준 의존성 인코딩

### 7.3 Teammate 실행 (Worktree 격리)

각 Teammate는:
1. Worktree 생성: `git worktree add -b zzem/{sprint-id}/{task-id} .worktrees/{project}_{task-id}`
2. 태스크 파일 + API contract + (app인 경우) 프로토타입 참조 읽기
3. 기존 코드베이스 패턴 따라 구현
4. Self-QA: `tsc --noEmit` → `eslint` → `jest`
5. 커밋 → `TaskUpdate: completed`

### 7.4 머지 사이클 (Sprint Lead)

`TaskList` 모니터링 → completed 태스크 순차 머지:

1. `git checkout zzem/{sprint-id}`
2. `git merge zzem/{sprint-id}/{task-id} --no-ff`
3. 충돌 시: 스프린트 중단, 사용자에게 수동 해결 요청
4. 성공 시: worktree 정리 + task branch 삭제
5. 다음 그룹 unblock

### 7.5 QA 검증

머지 완료된 태스크마다 QA Engineer에게 검증 태스크 할당:
- **PASS** → 다음 진행
- **FAIL** → 원 엔지니어에게 fix 태스크 재할당 (최대 2회 → 3회차 FAILED)

### 7.6 에러 처리

| 상황 | 처리 |
|------|------|
| Teammate 태스크 실패 | fix 태스크 재할당 (최대 2회) → 3회차 FAILED |
| 머지 충돌 | 스프린트 중단, 사용자 수동 해결 |
| QA 실패 | 원 엔지니어에게 QA report 포함 fix 재할당 |
| 타임아웃 (30분) | 태스크 FAILED 처리 |
| Worktree 생성 실패 | 기존 worktree 정리 후 재시도 |

---

## 8. Phase 5: PR (Sprint Lead solo)

Sprint 브랜치를 base branch로 PR 생성.

1. 각 레포의 sprint 브랜치에 변경사항 확인.
2. 태스크 상태 수집 (COMPLETED/FAILED).
3. Push + PR 생성:
   ```bash
   gh pr create \
     --base {base-branch} \
     --head zzem/{sprint-id} \
     --title "feat: Sprint {sprint-id} — {repo-name}" \
     --body "..."
   ```
4. PR body: PRD 요약, 태스크 상태 테이블, 머지 히스토리, QA 요약.
5. 중복 PR 확인: 동일 head/base PR이 있으면 기존 URL 안내.
6. **반드시 사용자 동의 후 push/PR 실행.**

---

## 9. `--status` 모드

읽기 전용 대시보드. 아무 Phase에서나 실행 가능.

### 수집 정보

- 태스크 상태 (COMPLETED/RUNNING/PENDING/FAILED)
- 프로토타입 승인 상태 (approved/pending/rejected)
- 브랜치 상태 (commits ahead of base)
- PR 상태 (URL + state)

### Next Step 추천

| 상태 | 추천 |
|------|------|
| 태스크만 있고 프로토타입 없음 | `/sprint {id} --phase=prototype` |
| 프로토타입 pending/rejected | `/sprint {id} --phase=prototype` (리뷰 진행) |
| 프로토타입 승인 완료, 미실행 | `/sprint {id} --phase=run` |
| 태스크 실패 | 실패 태스크 재실행 안내 |
| 전체 완료, PR 없음 | `/sprint {id} --phase=pr` |
| PR 생성됨 | PR 리뷰 링크 안내 |

---

## 10. Sprint Config Reference

```yaml
sprint_id: "2026-03-sprint-1"

branches:
  backend:
    base: "develop"              # wrtn-backend 타겟 브랜치
  app:
    base: "meme-release-1.2.1"   # app-core-packages 타겟 브랜치

defaults:
  base: "main"                   # 프로젝트별 설정 없을 때 폴백

team:
  teammates:
    - be-engineer
    - fe-engineer
    - design-engineer
    - qa-engineer
  settings:
    task_timeout_minutes: 30
    qa_retry_limit: 2
    max_parallel_tasks: 4
```

---

## 11. 전체 워크플로우 요약

```
┌──────────────────────────────────────────────────────────────────┐
│                         PRD.md (Input)                           │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Phase 1: Init (Sprint Lead solo)                                │
│  디렉토리 초기화 + sprint-config.yaml 생성                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Phase 2: Plan (Sprint Lead solo)                                │
│  PRD → api-contract.yaml + tasks/ + qa/test-scenarios.md         │
│  코드베이스 패턴 분석 → 태스크에 Implementation Hints 반영          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Phase 3: Prototype (Sprint Lead + Design Engineer)              │
│                                                                  │
│  ┌────────────────────┐                                          │
│  │  Design Engineer   │  Stitch MCP로 프로토타입 생성              │
│  │  (Teammate)        │  → HTML + approval-status.yaml            │
│  └────────────────────┘                                          │
│  Sprint Lead ↔ 사용자: approve / reject / revise / skip           │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Phase 4: Execute (Full Parallelism)                             │
│                                                                  │
│  Sprint Lead 오케스트레이션:                                       │
│  ┌────────────────┐  ┌────────────────┐                          │
│  │  BE Engineer   │  │  FE Engineer   │  Worktree 격리            │
│  │  (Teammate)    │  │  (Teammate)    │  병렬 실행                │
│  │  NestJS 구현   │  │  RN 구현       │  Self-QA                  │
│  └──────┬─────────┘  └──────┬─────────┘                          │
│         │                   │                                    │
│         └─────────┬─────────┘                                    │
│                   ▼                                              │
│  Sprint Lead: 순차 머지 → sprint 브랜치                            │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────┐                                          │
│  │  QA Engineer       │  Acceptance Criteria 검증 (읽기 전용)      │
│  │  (Teammate)        │  PASS → 진행 / FAIL → fix 재할당          │
│  └────────────────────┘                                          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Phase 5: PR (Sprint Lead solo)                                  │
│  sprint 브랜치 push → gh pr create (사용자 동의 필요)              │
│  wrtn-backend + app-core-packages 각각 PR 생성                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 12. 핵심 설계 원칙

1. **Agent Teams 병렬성**: BE/FE/Design/QA 전문가가 동시에 작업
2. **Worktree 격리**: 각 태스크가 독립 worktree에서 실행 — 충돌 방지
3. **Self-QA 패턴**: 엔지니어가 구현 후 자체 검증 (tsc, lint, jest)
4. **순차 머지**: 병렬 실행 후 번호 순서대로 sprint 브랜치에 머지
5. **프로토타입 기반 개발**: Stitch 프로토타입은 시각적 참조 (코드 복사 아님)
6. **Sprint 브랜치 전략**: 모든 작업은 sprint 브랜치에서, 최종 PR로 base에 머지
7. **QA 읽기 전용**: QA Engineer는 검증만, 코드 수정 불가
8. **사용자 게이트**: PR push, 머지 충돌 해결 등 외부 영향 작업은 사용자 동의 필수
9. **한국어 우선 UI**: 모든 사용자 대면 텍스트는 한국어로 구현
10. **설정 기반**: `sprint-config.yaml`로 브랜치, 타임아웃, 재시도 제어

---

## 13. Quick Start

```bash
# 1. PRD 준비
#    docs/prds/ 에 PRD 파일 작성

# 2. 스프린트 초기화 + 전체 파이프라인
/sprint 2026-03-sprint-1

# 3. 특정 Phase만 실행
/sprint 2026-03-sprint-1 --phase=plan
/sprint 2026-03-sprint-1 --phase=prototype
/sprint 2026-03-sprint-1 --phase=run
/sprint 2026-03-sprint-1 --phase=pr

# 4. 상태 확인
/sprint 2026-03-sprint-1 --status
```

---

## 14. v2 → v3 변경 사항

| v2 (Shell Scripts) | v3 (Agent Teams) |
|---------------------|-----------------|
| `scripts/common.sh`, `run-task.sh`, `run-sprint.sh` 등 | `/sprint` 단일 스킬 |
| `claude -p` 프롬프트로 에이전트 실행 | Agent Teams `TaskCreate` + Teammate 스폰 |
| Shell 기반 병렬 실행 (`&`, `wait`) | Agent Teams 네이티브 병렬 실행 |
| 별도 검증 스크립트 (`validate-sprint.sh`) | Phase 2 자체 검증 내장 |
| `sprint-status.sh` CLI 대시보드 | `--status` 모드 내장 |
| `create-pr.sh` 스크립트 | Phase 5 PR 내장 |
| 프로토타입 Phase 없음 | Phase 3 (Design Engineer + Stitch MCP) |
| QA는 Self-QA만 | 전담 QA Engineer Teammate 추가 |
| `sprint-orchestrator/CLAUDE.md` | `.claude/skills/sprint/SKILL.md` + `.claude/teammates/` |
