---
name: sprint-run
description: Execute sprint tasks with worktree isolation and self-QA. Use when the user wants to run a sprint, execute tasks, or says /sprint-run.
---

# Sprint Run

## Goal

스프린트의 태스크들을 브랜치 전략(`docs/designs/branch-strategy.md`)에 따라 worktree isolation으로 실행하고, 각 태스크 완료 후 sprint 브랜치에 머지한다.

## Invocation

```
/sprint-run <sprint-id>                    # 전체 스프린트 실행
/sprint-run <sprint-id> <task-id>          # 단일 태스크 실행
/sprint-run <sprint-id> --sequential       # 순차 실행 모드
```

## Workflow

### 1. 사전 확인

- 스프린트 디렉토리 존재 확인: `sprint-orchestrator/sprints/{sprint-id}/`
- sprint-config.yaml 로드
- 태스크 파일 목록 수집
- 각 프로젝트 레포 상태 확인 (clean working tree인지)

### 2. Sprint 브랜치 생성

각 레포에서 sprint-config.yaml의 base branch로부터 sprint 브랜치를 생성한다.

```
브랜치 네이밍: zzem/{sprint-id}
```

**각 프로젝트 레포(wrtn-backend, app-core-packages)에서:**

```bash
git fetch origin {base-branch}
git checkout -b zzem/{sprint-id} origin/{base-branch}
```

base branch는 sprint-config.yaml에서 해석:
- `branches.backend.base` → wrtn-backend
- `branches.app.base` → app-core-packages
- 미지정 시 `defaults.base` → 없으면 `"main"` 폴백

### 3. 태스크 그룹 구성

태스크 번호 기준으로 그룹화한다:
- 동일 번호 = 병렬 실행 가능
- 낮은 번호 그룹이 모두 완료된 후 다음 그룹 실행

### 4. 태스크 실행 (그룹별)

각 태스크에 대해:

#### 4a. Task 브랜치 + Worktree 생성

해당 프로젝트 레포에서:

```bash
git worktree add -b zzem/{sprint-id}/{task-id} {worktree-path} zzem/{sprint-id}
```

- worktree 경로: `{orchestrator-root}/.worktrees/{project}_{task-id}`

#### 4b. 태스크 실행

worktree 디렉토리에서 Agent tool을 사용하여 태스크를 실행한다.

에이전트에게 전달할 컨텍스트:
- 태스크 파일 내용 (tasks/{project}/{task-id}.md)
- API contract (api-contract.yaml)
- 수정 범위 제한 (target_path)
- 해당 레포의 기존 CLAUDE.md/skills 규칙을 따를 것

에이전트가 수행할 작업:
1. 태스크 파일의 Context, Specification 이해
2. Implementation Hints의 기존 코드 패턴 + 필수 스킬 참고
3. 구현
4. Self-QA 수행:
   - TypeScript 체크
   - Lint
   - 단위 테스트
   - 기존 테스트 regression 확인
5. Acceptance Criteria 검증
6. result 파일 생성: `{task-id}.result.md`

#### 4c. Scope 검증

태스크 완료 후, 수정된 파일이 target_path 범위 내인지 확인:

```bash
git diff --name-only zzem/{sprint-id}
```

범위 밖 파일이 수정되었으면 경고 출력.

#### 4d. Sprint 브랜치로 머지

```bash
# 프로젝트 레포의 메인 clone으로 이동
git checkout zzem/{sprint-id}
git merge zzem/{sprint-id}/{task-id} --no-ff -m "merge: {task-id}"
```

#### 4e. Worktree 정리

```bash
git worktree remove {worktree-path} --force
git branch -d zzem/{sprint-id}/{task-id}
```

### 5. 결과 출력

각 태스크 완료 후 실시간 상태 업데이트:

```
Sprint Run: {sprint-id}

  [Group 001]
    backend/001-content-publish-status  ✓ COMPLETED → merged
    app/001-profile-screen              ✓ COMPLETED → merged

  [Group 002]
    backend/002-profile-api             ⟳ RUNNING...
    app/002-profile-edit                ⟳ RUNNING...
```

전체 완료 시:

```
Sprint Run Complete: {sprint-id}

  Results: {N}/{M} tasks completed
  Failed: {list or "none"}

  Sprint branches:
    wrtn-backend:       zzem/{sprint-id}
    app-core-packages:  zzem/{sprint-id}

Next: /sprint-pr {sprint-id}
```

## Error Handling

| 상황 | 처리 |
|------|------|
| 태스크 실행 실패 | result.md에 FAILED 기록, 다음 태스크 계속 (의존성 없는 경우) |
| 머지 충돌 | 스프린트 중단, 충돌 내용 출력, 수동 해결 요청 |
| Scope 위반 | 경고 출력, 사용자에게 계속/중단 확인 |
| Worktree 생성 실패 | 기존 worktree 정리 시도 후 재시도 |

## Constraints

- 단일 태스크 실행 시 Agent tool 타임아웃: 30분
- QA 실패 시 최대 3회 재시도 후 FAILED 처리
- `.worktrees/` 디렉토리는 `.gitignore`에 추가할 것
