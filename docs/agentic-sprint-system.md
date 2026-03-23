# Agentic Sprint System 설계 (v2 — Lightweight Orchestrator)

> **Approach B** 채택. 최소 인프라로 핵심 가치를 먼저 검증하고, 작동이 확인되면 확장.
> Eng Review + CEO Review 결과 반영. Design doc: `docs/designs/agentic-sprint-system.md`

## 대상 프로젝트

| 역할 | 레포 | 대상 앱/API | 경로 |
|------|------|-------------|------|
| App | app-core-packages | MemeApp | `apps/MemeApp/` |
| Backend | wrtn-backend | meme-api | `apps/meme-api/` |

> 두 레포는 독립 git repo이며, zzem-orchestrator의 `.gitignore`에 등록되어 있다.
> 각 레포에는 이미 CLAUDE.md와 에이전트 스킬이 존재하며, 이를 **확장**한다 (대체하지 않음).

---

## 1. 디렉토리 구조

```
zzem-orchestrator/
├── sprint-orchestrator/
│   ├── CLAUDE.md                    # Orchestrator 에이전트 지침
│   ├── templates/
│   │   ├── task-template.md
│   │   └── api-contract-template.yaml
│   └── sprints/
│       └── {sprint-id}/
│           ├── PRD.md               # 입력
│           ├── api-contract.yaml    # SSOT (여기에만 원본 유지)
│           ├── tasks/
│           │   ├── app/             # MemeApp 태스크
│           │   └── backend/         # meme-api 태스크
│           ├── qa/
│           │   └── test-scenarios.md
│           └── logs/                # 실행 로그
│
├── scripts/
│   ├── common.sh                    # 공통 함수 (경로 해석, deps 체크, 에러 핸들링, 로깅)
│   ├── run-task.sh                  # 단일 태스크 실행 (worktree isolation 포함)
│   ├── validate-sprint.sh           # LLM 출력 검증 (OpenAPI lint, 태스크 필드 검증)
│   ├── sprint-status.sh             # 스프린트 진행 현황 CLI 대시보드
│   └── create-pr.sh                 # 스프린트 완료 후 자동 PR 생성
│
├── app-core-packages/               # .gitignore됨 (독립 git repo)
├── wrtn-backend/                    # .gitignore됨 (독립 git repo)
├── docs/
│   ├── agentic-sprint-system.md     # 이 문서
│   └── designs/
│       └── agentic-sprint-system.md # CEO Plan (design doc)
├── TODOS.md
└── .gitignore
```

---

## 2. Phase 1: Sprint Orchestrator — PRD 해석 & 태스크 분해

### Orchestrator CLAUDE.md

```markdown
# Sprint Orchestrator Agent

## Role
스프린트 PRD를 읽고, MemeApp/meme-api 프로젝트 각각에 할당할 태스크를 생성한다.

## Core Principles
1. **API Contract First**: 모든 기능은 API 인터페이스 정의부터 시작한다
2. **Atomic Tasks**: 각 태스크는 하나의 기능 단위 (1~4시간 분량)
3. **Dependency Graph**: 태스크 간 의존성을 명시한다
4. **Testable Output**: 모든 태스크는 검증 가능한 완료 조건을 포함한다
5. **Codebase Awareness**: 기존 코드 패턴을 읽어 태스크에 반영한다

## Task Decomposition Process
1. PRD에서 Feature 단위를 추출한다
2. **기존 코드베이스 패턴을 파악한다:**
   - `../wrtn-backend/apps/meme-api/src/` 구조와 기존 Controller/Service 패턴 읽기
   - `../app-core-packages/apps/MemeApp/src/` 구조와 기존 화면/컴포넌트 패턴 읽기
3. 각 Feature를 API Contract으로 먼저 정의한다
4. Backend 태스크를 생성한다 (API 구현) — 기존 패턴 참조 포함
5. App 태스크를 생성한다 (API 소비) — 기존 패턴 참조 포함
6. Integration QA 시나리오를 생성한다

## Output Format
- tasks/app/NNN-{feature-slug}.md
- tasks/backend/NNN-{feature-slug}.md
- api-contract.yaml (OpenAPI 3.0)
- qa/test-scenarios.md

## Conventions
- 태스크 번호는 의존성 순서를 반영한다 (낮은 번호 = 선행 태스크)
- 동일 번호 = 병렬 수행 가능
- 태스크 파일명의 feature-slug는 앱/백엔드 간 매칭된다
```

### Orchestrator 실행 프롬프트

```bash
# PRD → 태스크 분해 실행
cd sprint-orchestrator
claude -p "
sprints/{sprint-id}/PRD.md 를 읽고 다음을 수행해줘:

## 사전 조사
먼저 기존 코드베이스를 파악해:
- ../wrtn-backend/apps/meme-api/src/ 에서 기존 Controller, Service, Module 패턴을 확인
- ../app-core-packages/apps/MemeApp/src/ 에서 기존 화면, 컴포넌트, 데이터 패턴을 확인
- 유사한 기능이 이미 구현되어 있다면 그 패턴을 태스크에 참조로 포함

## 태스크 분해
1. PRD의 각 기능을 분석하고 api-contract.yaml을 OpenAPI 3.0으로 작성
2. 각 기능별로 backend 태스크 파일을 tasks/backend/에 생성
3. 각 기능별로 app 태스크 파일을 tasks/app/에 생성
4. QA 통합 테스트 시나리오를 qa/test-scenarios.md에 작성

태스크 파일은 templates/task-template.md 형식을 따라.
api-contract.yaml은 앱과 백엔드가 공유하는 단일 진실의 원천(SSOT)이야.
"
```

### Task Template (templates/task-template.md)

```markdown
# Task: {TASK_ID} - {Feature Name}

## Target
- target_app: MemeApp                           # 앱 태스크의 경우
- target_api: meme-api                          # 백엔드 태스크의 경우
- target_path: apps/MemeApp/src/presentation/   # 수정 대상 경로 (scope 제한용)

## Context
- Sprint: {Sprint Name}
- PRD Section: {PRD에서의 해당 섹션}
- API Contract Reference: {api-contract.yaml 내 path}
  - Contract 위치: ../sprint-orchestrator/sprints/{sprint-id}/api-contract.yaml
- Dependencies: {선행 태스크 ID 목록}
- Parallel With: {동시 수행 가능한 다른 프로젝트 태스크}

## Objective
{이 태스크가 달성해야 할 것을 2-3문장으로 기술}

## Specification

### Input
{이 기능이 받는 입력 — API request body, 사용자 입력 등}

### Output
{이 기능이 반환하는 결과 — API response, UI 상태 변화 등}

### Business Rules
{비즈니스 로직, 엣지 케이스, 제약 조건}

## Implementation Hints
{아키텍처 가이드, 사용할 라이브러리, 참고할 기존 코드 패턴}
- 기존 패턴 참조: {기존 코드에서 유사한 구현체 경로}
- **필수 스킬 참조 (Backend):**
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙
  - `.claude/skills/cursor-pagination/SKILL.md` — (페이지네이션 필요 시)
  - `.claude/skills/admin-api-rule/SKILL.md` — (어드민 API인 경우)

## Acceptance Criteria
- [ ] {검증 가능한 완료 조건 1}
- [ ] {검증 가능한 완료 조건 2}
- [ ] {검증 가능한 완료 조건 3}

## QA Checklist
- [ ] Unit tests 통과
- [ ] {프로젝트별 추가 검증 — 앱: 스크린샷 매칭 / 백엔드: API 응답 스키마 검증}
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
```

---

## 3. Phase 2: Project Agent — 기능 개발

> 각 레포의 기존 CLAUDE.md/skills를 그대로 사용한다.
> 새 CLAUDE.md를 만들지 않는다 — 태스크 파일 자체가 컨텍스트 역할을 한다.
> Hooks를 사용하지 않는다 — claude -p 프롬프트에 모든 지시를 포함한다.

### 에이전트 실행 원칙

**wrtn-backend (meme-api)**
- 기존 `claude.md`가 자동 로드됨 → NestJS 아키텍처, 백엔드 그라운드 룰, 커서 페이지네이션, 어드민 API 규칙이 적용됨
- 태스크의 `Implementation Hints`에서 필수 스킬을 명시적으로 참조
- 수정 범위: `apps/meme-api/` 및 관련 `libs/` 파일만 허용

**app-core-packages (MemeApp)**
- 기존 `.claude/skills/`가 자동 로드됨 → RN 아키텍처, 스타일링 등의 스킬이 적용됨
- 수정 범위: `apps/MemeApp/` 및 관련 `packages/` 파일만 허용

---

## 4. Phase 3: Execution Scripts

### 4.1 공통 함수 (scripts/common.sh)

```bash
#!/bin/bash
# scripts/common.sh — 모든 스크립트가 source하는 공통 함수

ORCHESTRATOR_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_REPO="$ORCHESTRATOR_ROOT/app-core-packages"
BACKEND_REPO="$ORCHESTRATOR_ROOT/wrtn-backend"

# --- 경로 해석 ---
resolve_project_dir() {
  local project=$1
  case $project in
    app)     echo "$APP_REPO" ;;
    backend) echo "$BACKEND_REPO" ;;
    *)       log_error "Unknown project: $project"; return 1 ;;
  esac
}

resolve_target_path() {
  local project=$1
  case $project in
    app)     echo "apps/MemeApp/" ;;
    backend) echo "apps/meme-api/" ;;
  esac
}

# --- 로깅 ---
LOG_DIR=""

init_logging() {
  local sprint_id=$1
  LOG_DIR="$ORCHESTRATOR_ROOT/sprint-orchestrator/sprints/$sprint_id/logs"
  mkdir -p "$LOG_DIR"
}

log_info() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $*"
  echo "$msg"
  [ -n "$LOG_DIR" ] && echo "$msg" >> "$LOG_DIR/sprint.log"
}

log_error() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*"
  echo "$msg" >&2
  [ -n "$LOG_DIR" ] && echo "$msg" >> "$LOG_DIR/sprint.log"
}

# --- Preflight 체크 ---
check_deps() {
  local missing=()
  command -v claude >/dev/null 2>&1 || missing+=("claude (Claude Code CLI)")
  command -v gh >/dev/null 2>&1    || missing+=("gh (GitHub CLI — brew install gh)")
  command -v git >/dev/null 2>&1   || missing+=("git")

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing dependencies:"
    for dep in "${missing[@]}"; do
      log_error "  - $dep"
    done
    return 1
  fi
}

# --- 에러 핸들링 ---
check_exit_code() {
  local exit_code=$1
  local task_desc=$2
  if [ "$exit_code" -ne 0 ]; then
    log_error "$task_desc failed with exit code $exit_code"
    return 1
  fi
}

parse_result_status() {
  local result_file=$1
  if [ ! -f "$result_file" ]; then
    echo "MISSING"
    return
  fi
  grep -oP '(?<=Status: )\w+' "$result_file" 2>/dev/null || echo "UNKNOWN"
}

# --- Scope 검증 ---
check_scope_violation() {
  local project_dir=$1
  local allowed_path=$2

  cd "$project_dir" || return 1
  local changed_files
  changed_files=$(git diff --name-only HEAD 2>/dev/null)

  if [ -z "$changed_files" ]; then
    return 0  # 변경 없음
  fi

  local violations=""
  while IFS= read -r file; do
    if [[ ! "$file" == $allowed_path* ]] && [[ ! "$file" == libs/* ]]; then
      violations+="  - $file\n"
    fi
  done <<< "$changed_files"

  if [ -n "$violations" ]; then
    log_error "Scope violation! Files modified outside allowed path ($allowed_path):"
    echo -e "$violations" >&2
    return 1
  fi
}

# --- YAML 파싱 (간단) ---
safe_parse_yaml() {
  local file=$1
  if [ ! -f "$file" ]; then
    log_error "File not found: $file"
    return 1
  fi
  # 기본 YAML 구문 체크
  python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null
  if [ $? -ne 0 ]; then
    log_error "Invalid YAML: $file"
    return 1
  fi
}
```

### 4.2 단일 태스크 실행 (scripts/run-task.sh)

```bash
#!/bin/bash
# scripts/run-task.sh <project> <sprint-id> <task-id>
# 예: ./scripts/run-task.sh backend 2026-03-sprint-14 001-feed-pagination-api

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

PROJECT=$1
SPRINT_ID=$2
TASK_ID=$3
TIMEOUT=${4:-1800}  # 기본 30분

SPRINT_DIR="$ORCHESTRATOR_ROOT/sprint-orchestrator/sprints/$SPRINT_ID"
TASK_FILE="$SPRINT_DIR/tasks/$PROJECT/$TASK_ID.md"
CONTRACT_FILE="$SPRINT_DIR/api-contract.yaml"
PROJECT_DIR=$(resolve_project_dir "$PROJECT")
TARGET_PATH=$(resolve_target_path "$PROJECT")

init_logging "$SPRINT_ID"
check_deps || exit 1

# 태스크 파일 확인
if [ ! -f "$TASK_FILE" ]; then
  log_error "Task file not found: $TASK_FILE"
  exit 1
fi

log_info "Starting task: $TASK_ID ($PROJECT)"

# claude -p 실행 (timeout 포함)
cd "$PROJECT_DIR"
timeout "$TIMEOUT" claude -p "
## 현재 태스크
$(cat "$TASK_FILE")

## API Contract
$(cat "$CONTRACT_FILE" 2>/dev/null || echo 'No contract file')

## 수정 범위 제한 (중요!)
- 수정 가능한 경로: $TARGET_PATH 및 관련 libs/ 디렉토리만
- 다른 앱/API의 코드를 절대 수정하지 마
- 기존 CLAUDE.md/skills의 규칙을 반드시 따라

## 실행 순서
1. 태스크 파일의 Context, Specification을 정확히 이해해
2. Implementation Hints에 명시된 기존 코드 패턴과 필수 스킬을 참고해
3. 구현해
4. Self-QA 수행해 (TypeScript 체크, Lint, 단위 테스트, 기존 테스트 regression)
5. 모든 Acceptance Criteria를 검증해
6. 결과를 ${TASK_ID}.result.md에 기록해

## 중요
- 구현 전에 반드시 계획을 먼저 세워
- QA 실패 시 자동으로 수정하고 재검증해
- 최대 3회 QA 사이클 후에도 실패하면 실패 리포트를 작성해
"
EXIT_CODE=$?

# Exit code 체크
check_exit_code $EXIT_CODE "Task $TASK_ID" || {
  log_error "Task $TASK_ID: claude -p failed"
  exit 1
}

# Scope violation 체크
check_scope_violation "$PROJECT_DIR" "$TARGET_PATH" || {
  log_error "Task $TASK_ID: scope violation detected"
  exit 1
}

# Result 파일 상태 확인
RESULT_FILE="$PROJECT_DIR/${TASK_ID}.result.md"
STATUS=$(parse_result_status "$RESULT_FILE")
log_info "Task $TASK_ID completed with status: $STATUS"

if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "MISSING" ]; then
  log_error "Task $TASK_ID: status is $STATUS"
  exit 1
fi

log_info "Task $TASK_ID: SUCCESS"
```

### 4.3 스프린트 실행 (병렬 기본)

> 순차 실행 대신 **동일 번호 태스크를 병렬 실행**한다 (기본 모드).
> 각 에이전트는 별도 worktree에서 작업하여 shared lib 충돌을 방지한다.
> `--sequential` 플래그로 순차 모드 전환 가능.

```bash
#!/bin/bash
# scripts/run-sprint.sh <sprint-id> [--sequential]
# 예: ./scripts/run-sprint.sh 2026-03-sprint-14

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SPRINT_ID=$1
SEQUENTIAL=${2:-""}
SPRINT_DIR="$ORCHESTRATOR_ROOT/sprint-orchestrator/sprints/$SPRINT_ID"

init_logging "$SPRINT_ID"
check_deps || exit 1

# --- Phase 0: 검증 ---
log_info "=== Phase 0: Validating sprint output ==="
"$SCRIPT_DIR/validate-sprint.sh" "$SPRINT_ID" || {
  log_error "Sprint validation failed. Fix issues and retry."
  exit 1
}

# --- 태스크 번호별로 그룹화 ---
declare -A TASK_GROUPS
for task_file in "$SPRINT_DIR/tasks/backend/"*.md "$SPRINT_DIR/tasks/app/"*.md; do
  [ -f "$task_file" ] || continue
  TASK_ID=$(basename "$task_file" .md)
  TASK_NUM=$(echo "$TASK_ID" | grep -oP '^\d+')
  PROJECT_TYPE="backend"
  [[ "$task_file" == *"/app/"* ]] && PROJECT_TYPE="app"
  TASK_GROUPS["$TASK_NUM"]+="$PROJECT_TYPE:$TASK_ID "
done

# --- 번호 순서대로 실행 ---
for TASK_NUM in $(echo "${!TASK_GROUPS[@]}" | tr ' ' '\n' | sort -n); do
  log_info "=== Task Group $TASK_NUM ==="

  if [ "$SEQUENTIAL" = "--sequential" ]; then
    # 순차 모드: backend 먼저, 그 다음 app
    for entry in ${TASK_GROUPS[$TASK_NUM]}; do
      PROJECT_TYPE="${entry%%:*}"
      TASK_ID="${entry#*:}"
      "$SCRIPT_DIR/run-task.sh" "$PROJECT_TYPE" "$SPRINT_ID" "$TASK_ID"
    done
  else
    # 병렬 모드: 동일 번호 태스크를 동시 실행
    PIDS=()
    for entry in ${TASK_GROUPS[$TASK_NUM]}; do
      PROJECT_TYPE="${entry%%:*}"
      TASK_ID="${entry#*:}"
      "$SCRIPT_DIR/run-task.sh" "$PROJECT_TYPE" "$SPRINT_ID" "$TASK_ID" &
      PIDS+=($!)
      log_info "Started $PROJECT_TYPE:$TASK_ID (PID: ${PIDS[-1]})"
    done

    # 모든 태스크 완료 대기
    FAILED=0
    for pid in "${PIDS[@]}"; do
      if ! wait "$pid"; then
        FAILED=1
      fi
    done

    if [ "$FAILED" -ne 0 ]; then
      log_error "One or more tasks in group $TASK_NUM failed. Aborting sprint."
      "$SCRIPT_DIR/sprint-status.sh" "$SPRINT_ID"
      exit 1
    fi
  fi
done

# --- Phase Final: 상태 출력 + PR 생성 ---
log_info "=== Sprint Complete ==="
"$SCRIPT_DIR/sprint-status.sh" "$SPRINT_ID"
log_info "Run ./scripts/create-pr.sh $SPRINT_ID to create PRs"
```

### 4.4 LLM 출력 검증 (scripts/validate-sprint.sh)

```bash
#!/bin/bash
# scripts/validate-sprint.sh <sprint-id>
# Orchestrator가 생성한 출력물의 품질을 검증

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SPRINT_ID=$1
SPRINT_DIR="$ORCHESTRATOR_ROOT/sprint-orchestrator/sprints/$SPRINT_ID"
ERRORS=0

log_info "Validating sprint: $SPRINT_ID"

# 1. api-contract.yaml 존재 및 유효성
CONTRACT="$SPRINT_DIR/api-contract.yaml"
if [ ! -f "$CONTRACT" ]; then
  log_error "api-contract.yaml not found"
  ERRORS=$((ERRORS + 1))
else
  safe_parse_yaml "$CONTRACT" || ERRORS=$((ERRORS + 1))
  log_info "api-contract.yaml: valid YAML"
fi

# 2. 태스크 파일 필수 필드 검증
REQUIRED_FIELDS=("## Target" "## Context" "## Objective" "## Specification" "## Acceptance Criteria")
for task_file in "$SPRINT_DIR/tasks/"*/*.md; do
  [ -f "$task_file" ] || continue
  TASK_NAME=$(basename "$task_file")
  for field in "${REQUIRED_FIELDS[@]}"; do
    if ! grep -q "$field" "$task_file"; then
      log_error "$TASK_NAME: missing required field '$field'"
      ERRORS=$((ERRORS + 1))
    fi
  done
done

# 3. Target 경로 존재 확인
for task_file in "$SPRINT_DIR/tasks/"*/*.md; do
  [ -f "$task_file" ] || continue
  TARGET_APP=$(grep -oP '(?<=target_app: )\S+' "$task_file" 2>/dev/null || true)
  TARGET_API=$(grep -oP '(?<=target_api: )\S+' "$task_file" 2>/dev/null || true)

  if [ -n "$TARGET_APP" ] && [ ! -d "$APP_REPO/apps/$TARGET_APP" ]; then
    log_error "$(basename "$task_file"): target_app '$TARGET_APP' not found in app-core-packages/apps/"
    ERRORS=$((ERRORS + 1))
  fi
  if [ -n "$TARGET_API" ] && [ ! -d "$BACKEND_REPO/apps/$TARGET_API" ]; then
    log_error "$(basename "$task_file"): target_api '$TARGET_API' not found in wrtn-backend/apps/"
    ERRORS=$((ERRORS + 1))
  fi
done

# 4. 태스크 존재 여부
APP_TASKS=$(find "$SPRINT_DIR/tasks/app/" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_TASKS=$(find "$SPRINT_DIR/tasks/backend/" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
log_info "Tasks found: $BACKEND_TASKS backend, $APP_TASKS app"

if [ "$APP_TASKS" -eq 0 ] && [ "$BACKEND_TASKS" -eq 0 ]; then
  log_error "No tasks generated"
  ERRORS=$((ERRORS + 1))
fi

# 결과
if [ "$ERRORS" -gt 0 ]; then
  log_error "Validation FAILED with $ERRORS error(s)"
  exit 1
else
  log_info "Validation PASSED"
fi
```

### 4.5 스프린트 진행 대시보드 (scripts/sprint-status.sh)

```bash
#!/bin/bash
# scripts/sprint-status.sh <sprint-id>
# 스프린트 진행 현황을 테이블로 출력

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SPRINT_ID=$1
SPRINT_DIR="$ORCHESTRATOR_ROOT/sprint-orchestrator/sprints/$SPRINT_ID"

echo ""
echo "=== Sprint Status: $SPRINT_ID ==="
echo ""
printf "%-30s | %-10s | %-10s\n" "Task ID" "Backend" "App"
printf "%-30s-+-%-10s-+-%-10s\n" "------------------------------" "----------" "----------"

# 태스크 번호 수집
declare -A BACKEND_STATUS
declare -A APP_STATUS

for f in "$SPRINT_DIR/tasks/backend/"*.md 2>/dev/null; do
  [ -f "$f" ] || continue
  TASK_ID=$(basename "$f" .md)
  RESULT="$BACKEND_REPO/${TASK_ID}.result.md"
  BACKEND_STATUS["$TASK_ID"]=$(parse_result_status "$RESULT")
done

for f in "$SPRINT_DIR/tasks/app/"*.md 2>/dev/null; do
  [ -f "$f" ] || continue
  TASK_ID=$(basename "$f" .md)
  RESULT="$APP_REPO/${TASK_ID}.result.md"
  APP_STATUS["$TASK_ID"]=$(parse_result_status "$RESULT")
done

# slug 기준으로 매칭하여 출력
ALL_SLUGS=$(echo "${!BACKEND_STATUS[@]} ${!APP_STATUS[@]}" | tr ' ' '\n' | sed 's/^[0-9]*-//' | sort -u)
for slug in $ALL_SLUGS; do
  BE_STATUS="—"
  APP_ST="—"
  TASK_DISPLAY="$slug"

  for key in "${!BACKEND_STATUS[@]}"; do
    if [[ "$key" == *"$slug" ]]; then
      BE_STATUS="${BACKEND_STATUS[$key]}"
      TASK_DISPLAY="$key"
    fi
  done
  for key in "${!APP_STATUS[@]}"; do
    if [[ "$key" == *"$slug" ]]; then
      APP_ST="${APP_STATUS[$key]}"
    fi
  done

  printf "%-30s | %-10s | %-10s\n" "$TASK_DISPLAY" "$BE_STATUS" "$APP_ST"
done

echo ""
```

### 4.6 자동 PR 생성 (scripts/create-pr.sh)

```bash
#!/bin/bash
# scripts/create-pr.sh <sprint-id>
# 스프린트 완료 후 각 레포에서 PR 생성

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SPRINT_ID=$1
BRANCH_NAME="sprint/$SPRINT_ID"

init_logging "$SPRINT_ID"
check_deps || exit 1

create_pr_for_repo() {
  local repo_dir=$1
  local repo_name=$2

  cd "$repo_dir" || return 1

  # 변경사항 확인
  if [ -z "$(git status --porcelain)" ] && [ -z "$(git diff HEAD)" ]; then
    log_info "$repo_name: No changes to commit"
    return 0
  fi

  # 브랜치 생성 + 커밋
  git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
  git add -A
  git commit -m "feat: sprint $SPRINT_ID implementation

Automated sprint implementation via zzem-orchestrator.
" || true

  # Push + PR
  git push -u origin "$BRANCH_NAME"

  # 스프린트 상태를 PR body에 포함
  STATUS_OUTPUT=$("$SCRIPT_DIR/sprint-status.sh" "$SPRINT_ID" 2>/dev/null || echo "Status unavailable")

  gh pr create \
    --title "feat: Sprint $SPRINT_ID — $repo_name" \
    --body "$(cat <<EOF
## Sprint: $SPRINT_ID

### Status
\`\`\`
$STATUS_OUTPUT
\`\`\`

### Generated by
zzem-orchestrator Agentic Sprint System
EOF
)" || {
    log_error "$repo_name: PR creation failed (may already exist)"
    return 1
  }

  log_info "$repo_name: PR created"
}

# Backend PR
log_info "Creating PR for wrtn-backend..."
create_pr_for_repo "$BACKEND_REPO" "meme-api"

# App PR
log_info "Creating PR for app-core-packages..."
create_pr_for_repo "$APP_REPO" "MemeApp"

log_info "All PRs created."
```

---

## 5. Phase 4: QA System

> QA는 에이전트의 Self-QA (claude -p 프롬프트에 포함)와 기존 레포의 테스트 인프라에 의존한다.
> 별도 QA 스크립트 (contract-validator.sh, local-test-runner.sh)는 Lightweight 범위 밖.
> 향후 Integration QA 자동화는 TODOS.md에 기록됨 (P2).

### Self-QA (에이전트 프롬프트에 포함)

**Backend (meme-api):**
1. TypeScript 체크: `npx tsc --noEmit`
2. Lint: `npx nx lint meme-api`
3. 단위 테스트: `npx nx test meme-api`
4. 기존 테스트 regression

**App (MemeApp):**
1. TypeScript 체크: `npx tsc --noEmit`
2. Lint: `yarn lint`
3. 단위 테스트: `yarn test --related`
4. 기존 테스트 regression

---

## 6. Result Report — 태스크 완료 리포트 형식

```markdown
# Task Result: {TASK_ID}

## Status: COMPLETED | PARTIAL | FAILED

## Changes Made
- {변경한 파일 목록과 요약}

## Decisions & Rationale
- {구현 중 내린 판단과 이유}

## QA Results
| Check          | Result | Notes        |
|----------------|--------|--------------|
| TypeScript     | PASS   |              |
| Lint           | PASS   |              |
| Unit Tests     | PASS   | 3 tests added|
| Regression     | PASS   |              |

## Dependencies Resolved
- {이 태스크가 해결한 다른 태스크의 의존성}

## Known Issues / Follow-ups
- {발견했지만 이 태스크 범위 밖인 이슈}

## Commit
- `{commit hash}` — {commit message}
```

---

## 7. 전체 워크플로우 요약

```
┌──────────────────────────────────────────────────────────────────┐
│                         PRD.md (Input)                            │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│               Sprint Orchestrator Agent                           │
│                                                                   │
│  claude -p "PRD를 읽고 태스크를 분해해줘"                            │
│                                                                   │
│  1. 기존 코드베이스 패턴 파악 (meme-api + MemeApp)                  │
│  2. api-contract.yaml 생성 (OpenAPI 3.0 SSOT)                    │
│  3. tasks/backend/*.md 생성 (target_api: meme-api)                │
│  4. tasks/app/*.md 생성 (target_app: MemeApp)                     │
│  5. qa/test-scenarios.md 생성                                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    validate-sprint.sh                              │
│                                                                   │
│  - OpenAPI YAML 유효성                                             │
│  - 태스크 필수 필드 완전성                                           │
│  - target_app/target_api 경로 존재 확인                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│         run-sprint.sh (기본: 병렬 / --sequential: 순차)            │
│                                                                   │
│  동일 번호 태스크를 병렬 실행:                                       │
│                                                                   │
│  ┌─────────────────────┐  ┌──────────────────────────┐           │
│  │  Backend Agent      │  │  App Agent               │           │
│  │  (wrtn-backend)     │  │  (app-core-packages)     │           │
│  │                     │  │                          │           │
│  │  기존 claude.md +   │  │  기존 .claude/skills/ +  │           │
│  │  4 skills 자동 적용  │  │  12 skills 자동 적용     │           │
│  │                     │  │                          │           │
│  │  Scope: apps/       │  │  Scope: apps/            │           │
│  │    meme-api/ + libs/ │  │    MemeApp/ + packages/  │           │
│  └─────────┬───────────┘  └──────────┬───────────────┘           │
│            │                          │                           │
│            ▼                          ▼                           │
│  ┌──────────────────────────────────────────────┐                │
│  │  Scope 검증 (git diff --name-only)            │                │
│  │  Result 파일 상태 확인                          │                │
│  └──────────────────────────────────────────────┘                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     sprint-status.sh                              │
│                                                                   │
│  Task ID              | Backend    | App                          │
│  feed-pagination      | COMPLETED  | COMPLETED                   │
│  profile-edit         | COMPLETED  | COMPLETED                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      create-pr.sh                                 │
│                                                                   │
│  - wrtn-backend: sprint/{id} 브랜치 → PR 생성                     │
│  - app-core-packages: sprint/{id} 브랜치 → PR 생성                │
│  - PR body에 sprint-status 포함                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Quick Start — 실제 사용 커맨드

```bash
# 0. 사전 준비
cd zzem-orchestrator
./scripts/common.sh  # deps 체크 (source해서 사용)

# 1. PRD 작성
mkdir -p sprint-orchestrator/sprints/2026-03-sprint-14
# PRD.md를 작성한다

# 2. Orchestrator 실행 (태스크 분해)
cd sprint-orchestrator
claude -p "sprints/2026-03-sprint-14/PRD.md를 분석하고 태스크를 분해해줘"

# 3. 검증
cd ..
./scripts/validate-sprint.sh 2026-03-sprint-14

# 4. 스프린트 실행 (병렬 — 기본)
./scripts/run-sprint.sh 2026-03-sprint-14

# 4-alt. 순차 실행 (안전 모드)
./scripts/run-sprint.sh 2026-03-sprint-14 --sequential

# 4-alt. 단일 태스크만 실행
./scripts/run-task.sh backend 2026-03-sprint-14 001-feed-pagination-api

# 5. 진행 현황 확인
./scripts/sprint-status.sh 2026-03-sprint-14

# 6. PR 생성
./scripts/create-pr.sh 2026-03-sprint-14
```

---

## 9. 향후 계획 (TODOS.md 참조)

| Priority | Item | Status |
|----------|------|--------|
| P2 | Integration QA 자동화 (meme-api 로컬 서버 + E2E 테스트) | Deferred |
| P3 | Approach C 전환 (Shell → Claude Code Agent tool) | Deferred |
| Medium | 병렬 실행 shared lib 충돌 방지 (git worktree) | 설계 완료 |
| Low | create-plan/execute-plan 스킬 중복 조사 | Deferred |
