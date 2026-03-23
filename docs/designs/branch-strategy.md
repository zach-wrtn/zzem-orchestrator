# Branch Strategy: Hybrid Task-to-Sprint Merge

> PR 생성 시 브랜치 전략 명세. Agentic Sprint System의 `create-pr.sh`, `run-task.sh`에서 참조한다.

## 1. 전략 개요

**Hybrid (Task Branch → Sprint Branch → Base Branch)** 방식을 채택한다.

```
base branch (동적)
  └── zzem/{sprint-id}                        # 스프린트 통합 브랜치
        ├── zzem/{sprint-id}/001-content-publish-status   # 태스크 브랜치
        ├── zzem/{sprint-id}/002-profile-api
        ├── zzem/{sprint-id}/001-profile-screen
        └── zzem/{sprint-id}/002-profile-edit
```

> 각 프로젝트 레포는 독립 git repo이므로, 브랜치명에 `app/backend` prefix를 포함하지 않는다.
> 동일 태스크 번호라도 레포가 다르면 충돌하지 않는다.

### 흐름

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  Task Branches  │ ──► │  Sprint Branch        │ ──► │  Base Branch  │
│  (worktree)     │     │  zzem/{sprint-id}     │     │  (동적 주입)   │
│                 │     │                       │     │              │
│  태스크별 독립   │     │  태스크 머지 통합      │     │  최종 PR 1개  │
│  작업 공간       │     │  충돌 해결 지점        │     │  per repo     │
└─────────────────┘     └──────────────────────┘     └──────────────┘
```

---

## 2. Base Branch 동적 주입

각 프로젝트(레포)의 base branch는 **스프린트 설정 파일**에서 동적으로 지정한다.

### 2.1 설정 위치

`sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml`

```yaml
# sprint-config.yaml
sprint_id: "2026-03-sprint-1"

branches:
  backend:
    base: "develop"          # wrtn-backend의 PR 타겟 브랜치
  app:
    base: "main"             # app-core-packages의 PR 타겟 브랜치

# 기본값: 명시하지 않으면 "main"
defaults:
  base: "main"
```

### 2.2 설정 우선순위

```
sprint-config.yaml의 branches.{project}.base
  ↓ (미지정 시)
sprint-config.yaml의 defaults.base
  ↓ (미지정 시)
"main" (하드코딩 폴백)
```

### 2.3 런타임 해석 (common.sh 확장)

```bash
# common.sh에 추가
resolve_base_branch() {
  local project=$1  # "backend" | "app"
  local sprint_id=$2
  local config="$ORCHESTRATOR_ROOT/sprint-orchestrator/sprints/$sprint_id/sprint-config.yaml"

  if [ ! -f "$config" ]; then
    echo "main"
    return
  fi

  # project별 base branch 조회
  local branch
  branch=$(python3 -c "
import yaml, sys
with open('$config') as f:
    cfg = yaml.safe_load(f)
branches = cfg.get('branches', {})
project = branches.get('$project', {})
base = project.get('base', cfg.get('defaults', {}).get('base', 'main'))
print(base)
" 2>/dev/null)

  echo "${branch:-main}"
}
```

---

## 3. 브랜치 네이밍 규칙

| 레벨 | 패턴 | 예시 |
|------|------|------|
| Sprint | `zzem/{sprint-id}` | `zzem/2026-03-sprint-1` |
| Task | `zzem/{sprint-id}/{task-id}` | `zzem/2026-03-sprint-1/001-content-publish-status` |

- `zzem/`: orchestrator가 생성한 브랜치임을 나타내는 namespace prefix
- `{task-id}`: 태스크 파일명에서 `.md` 제거한 값
- Sprint 브랜치는 base branch에서 분기
- Task 브랜치는 sprint 브랜치에서 분기
- 각 레포는 독립 git repo이므로 브랜치명에 project prefix(`app/`, `backend/`)를 포함하지 않음

---

## 4. 실행 단계별 브랜치 라이프사이클

### Phase 1: Sprint 브랜치 생성

스프린트 실행 시작 전, 각 레포에 sprint 브랜치를 생성한다.

```bash
# run-sprint.sh에서 호출
setup_sprint_branch() {
  local project=$1      # "backend" | "app"
  local sprint_id=$2
  local project_dir=$(resolve_project_dir "$project")
  local base_branch=$(resolve_base_branch "$project" "$sprint_id")
  local sprint_branch="zzem/$sprint_id"

  cd "$project_dir"
  git fetch origin "$base_branch"
  git checkout -b "$sprint_branch" "origin/$base_branch"
  log_info "$project: Created sprint branch '$sprint_branch' from '$base_branch'"
}
```

### Phase 2: Task 브랜치 생성 (worktree isolation)

각 태스크는 독립 worktree에서 태스크 브랜치를 생성하여 작업한다.

```bash
# run-task.sh에서 호출
setup_task_worktree() {
  local project=$1
  local sprint_id=$2
  local task_id=$3
  local project_dir=$(resolve_project_dir "$project")
  local sprint_branch="zzem/$sprint_id"
  local task_branch="zzem/$sprint_id/$task_id"
  local worktree_dir="$ORCHESTRATOR_ROOT/.worktrees/${project}_${task_id}"

  cd "$project_dir"

  # sprint 브랜치에서 task 브랜치 분기 + worktree 생성
  git worktree add -b "$task_branch" "$worktree_dir" "$sprint_branch"
  log_info "$project/$task_id: Worktree created at $worktree_dir (branch: $task_branch)"

  echo "$worktree_dir"
}
```

### Phase 3: Task 완료 → Sprint 브랜치로 머지

태스크 완료 후, 태스크 브랜치를 sprint 브랜치에 머지하고 worktree를 정리한다.

```bash
# run-task.sh 태스크 완료 후 호출
merge_task_to_sprint() {
  local project=$1
  local sprint_id=$2
  local task_id=$3
  local worktree_dir=$4
  local project_dir=$(resolve_project_dir "$project")
  local sprint_branch="zzem/$sprint_id"
  local task_branch="zzem/$sprint_id/$task_id"

  cd "$project_dir"
  git checkout "$sprint_branch"

  # 태스크 브랜치를 sprint 브랜치에 머지
  if ! git merge "$task_branch" --no-ff -m "merge: $task_id into $sprint_branch"; then
    log_error "$project/$task_id: Merge conflict detected"
    log_error "Resolve manually in $project_dir on branch $sprint_branch"
    return 1
  fi

  # 정리
  git worktree remove "$worktree_dir" --force 2>/dev/null || true
  git branch -d "$task_branch" 2>/dev/null || true
  log_info "$project/$task_id: Merged to $sprint_branch and cleaned up"
}
```

### Phase 4: PR 생성

Sprint 브랜치에서 base branch로 PR을 생성한다.

```bash
# create-pr.sh 개선
create_pr_for_repo() {
  local project=$1      # "backend" | "app"
  local sprint_id=$2
  local project_dir=$(resolve_project_dir "$project")
  local base_branch=$(resolve_base_branch "$project" "$sprint_id")
  local sprint_branch="zzem/$sprint_id"
  local repo_name
  case $project in
    backend) repo_name="meme-api" ;;
    app)     repo_name="MemeApp" ;;
  esac

  cd "$project_dir"
  git checkout "$sprint_branch"

  # base branch 대비 변경사항 확인
  if [ -z "$(git log "origin/$base_branch..$sprint_branch" --oneline)" ]; then
    log_info "$repo_name: No changes to create PR"
    return 0
  fi

  # Push
  git push -u origin "$sprint_branch"

  # PR 생성 (base branch 동적 지정)
  local status_output
  status_output=$("$SCRIPT_DIR/sprint-status.sh" "$sprint_id" 2>/dev/null || echo "Status unavailable")

  gh pr create \
    --base "$base_branch" \
    --head "$sprint_branch" \
    --title "feat: Sprint $sprint_id — $repo_name" \
    --body "$(cat <<EOF
## Sprint: $sprint_id

### Branch Strategy
- **Base**: \`$base_branch\`
- **Sprint Branch**: \`$sprint_branch\`
- **Merge Strategy**: task branches → sprint branch → PR

### Task Merge History
$(git log "origin/$base_branch..$sprint_branch" --oneline --no-decorate)

### Status
\`\`\`
$status_output
\`\`\`

### Generated by
zzem-orchestrator Agentic Sprint System
EOF
)"

  log_info "$repo_name: PR created ($sprint_branch → $base_branch)"
}
```

---

## 5. 병렬 실행 시 머지 순서

동일 번호 태스크가 병렬 실행될 때, 머지는 **순차적**으로 수행한다.

```
[병렬 실행]                         [순차 머지]
backend/001 ─┐                     backend/001 → sprint branch
             ├── 동시 작업           app/001     → sprint branch
app/001     ─┘                     backend/002 → sprint branch
                                   app/002     → sprint branch
```

- 같은 레포 내 태스크 머지는 순서 보장 (번호 오름차순)
- 서로 다른 레포(backend vs app)는 독립 레포이므로 충돌 없음
- **같은 레포 내 동일 번호 태스크**가 shared lib를 수정한 경우에만 충돌 가능
  → worktree isolation으로 작업은 독립, 머지 시점에 충돌 감지 및 해결

---

## 6. 충돌 처리 정책

| 상황 | 처리 |
|------|------|
| Task → Sprint 머지 성공 | 자동 진행 |
| Task → Sprint 머지 충돌 | 스프린트 중단, 로그 출력, 수동 해결 요청 |
| Sprint → Base PR 충돌 | GitHub PR에서 리뷰어가 해결 |

### 충돌 최소화 원칙

1. **Scope 제한**: 태스크의 `target_path`를 엄격히 지켜 수정 범위를 격리
2. **libs/ 수정 최소화**: shared lib 수정이 필요한 태스크는 동일 번호 배정을 피함
3. **의존성 순서**: 선행 태스크(낮은 번호)가 머지된 후 후행 태스크 실행

---

## 7. 정리(Cleanup) 정책

| 시점 | 대상 | 동작 |
|------|------|------|
| 태스크 머지 후 | Task 브랜치 + worktree | 자동 삭제 |
| PR 머지 후 | Sprint 브랜치 | GitHub에서 자동 삭제 (repo 설정) 또는 수동 |
| 스프린트 실패/중단 시 | 모든 worktree | `cleanup_worktrees()` 호출 |

```bash
cleanup_worktrees() {
  local project=$1
  local project_dir=$(resolve_project_dir "$project")

  cd "$project_dir"
  git worktree list --porcelain | grep "^worktree " | while read -r _ path; do
    if [[ "$path" == *"/.worktrees/"* ]]; then
      git worktree remove "$path" --force 2>/dev/null || true
      log_info "Cleaned up worktree: $path"
    fi
  done
}
```

---

## 8. 전체 흐름 다이어그램

```
sprint-config.yaml
  │  branches.backend.base = "develop"
  │  branches.app.base = "main"
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  run-sprint.sh                                                       │
│                                                                      │
│  1. sprint-config.yaml에서 base branch 해석                           │
│                                                                      │
│  2. 각 레포에 sprint branch 생성                                      │
│     wrtn-backend:       develop → zzem/2026-03-sprint-1              │
│     app-core-packages:  main    → zzem/2026-03-sprint-1              │
│                                                                      │
│  3. 태스크 그룹별 실행                                                 │
│     ┌─────────────────────────────────────────────────────────┐      │
│     │  Task Group 001 (병렬)                                   │      │
│     │                                                         │      │
│     │  ┌─ worktree ──────────────┐  ┌─ worktree ───────────┐ │      │
│     │  │ backend/001-publish     │  │ app/001-profile      │ │      │
│     │  │ branch: zzem/.../       │  │ branch: zzem/.../    │ │      │
│     │  │   001-publish           │  │   001-profile        │ │      │
│     │  └────────┬────────────────┘  └────────┬──────────────┘ │      │
│     │           │                            │                │      │
│     │           ▼                            ▼                │      │
│     │  merge → sprint branch       merge → sprint branch      │      │
│     │  (wrtn-backend)              (app-core-packages)        │      │
│     └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│  4. 반복: Task Group 002, 003, ...                                   │
│                                                                      │
│  5. PR 생성                                                           │
│     wrtn-backend:       zzem/2026-03-sprint-1 → develop (PR)        │
│     app-core-packages:  zzem/2026-03-sprint-1 → main    (PR)        │
└──────────────────────────────────────────────────────────────────────┘
```
