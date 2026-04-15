# Orchestrator Generalization Implementation Plan (Phase α)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** zzem-orchestrator를 role 기반 config-driven 아키텍처로 재설계하여, 특정 레포·스택·프로젝트에 무관하게 동작하는 범용 스프린트 오케스트레이터로 전환한다. (Phase α — 구조적 개편. Phase β 오픈소스 템플릿화는 후속 스프린트)

**Architecture:** source repo를 git worktree로 격리, 디렉토리명을 role key(`backend/`, `app/`, `tokens/`)로 전환, 스크립트를 config-driven으로 재작성, 브랜치 prefix를 설정화(`{branch_prefix}/{sprint-id}`).

**Tech Stack:** Bash, Python (YAML 파싱), Git worktree

**Spec:** `docs/superpowers/specs/2026-04-15-orchestrator-generalization-design.md`

---

## Pickup Prompt (새 세션에서 이것만 복사-붙여넣기)

```
# zzem-orchestrator 구조 개편을 진행한다.

plan: docs/superpowers/plans/2026-04-15-orchestrator-generalization.md
spec: docs/superpowers/specs/2026-04-15-orchestrator-generalization-design.md

목표: role 기반 config-driven 스프린트 오케스트레이터로 전환.
- Source repo를 git worktree로 격리 (메인 체크아웃 HEAD 불변)
- 디렉토리명 레포명 → role key (backend/, app/, tokens/)
- 브랜치 prefix 설정화 (`zzem/` → `{branch_prefix}/`)
- 스크립트 config-driven (하드코딩 레포 배열 제거)

진입 방법:
1. spec을 먼저 Read하여 설계 이해.
2. plan의 File Map 섹션으로 변경 대상 파악.
3. superpowers:executing-plans 스킬을 사용해 Task 1부터 체크박스 단위로 진행.
4. 각 Task 완료 시 plan 파일의 체크박스를 업데이트.

현재 상태: ai-webtoon 스프린트 Phase 1 중단 상태. free-tab-diversification 이후 in-flight 없음.
이 작업은 별도 feature 브랜치로 진행 (zzem 스프린트 파이프라인 사용 안 함).

제약:
- 완료된 스프린트(free-tab-diversification/) 아티팩트는 변경 금지 (역사 기록 보존).
- .claude/skills/extract-design/SKILL.md는 MemeApp 전용이므로 경로 치환만, 로직 유지.
- Phase β(템플릿화, init-project 마법사)는 이 plan 범위 밖.

Success Criteria는 plan의 "Success Criteria" 섹션 참조.
```

---

## File Map

| Action | File | Purpose |
| --- | --- | --- |
| Create | `scripts/setup-sprint.sh` | Config 기반 worktree/symlink 생성 |
| Create | `scripts/cleanup-sprint.sh` | Worktree 제거 + 브랜치 정리 |
| Rewrite | `scripts/sync-repos.sh` | Config loop, source repo에서 base fetch만 |
| Delete | `scripts/setup.sh` | 레거시 스크립트 제거 |
| Modify | `sprint-orchestrator/templates/sprint-config-template.yaml` | `repositories` 스키마 확장 (`source`, `mode`) + `branch_prefix` |
| Modify | `.claude/skills/sprint/phase-init.md` | setup-sprint.sh 호출 전환, role 기반 설명 |
| Modify | `.claude/skills/sprint/phase-build.md` | `cd wrtn-backend` → `cd backend`, 브랜치 생성 제거 |
| Modify | `.claude/skills/sprint/phase-pr.md` | 경로·브랜치 prefix 변수화 |
| Modify | `.claude/skills/sprint/phase-retro.md` | cleanup-sprint.sh 호출 단계 추가 |
| Modify | `.claude/skills/sprint/phase-spec.md` | 경로 치환 |
| Modify | `.claude/skills/sprint/phase-modes.md` | 경로·브랜치 치환 |
| Modify | `.claude/skills/sprint/SKILL.md` | role 기반 아키텍처 설명 반영 |
| Modify | `.claude/teammates/be-engineer.md` | `wrtn-backend/` → `backend/` |
| Modify | `.claude/teammates/fe-engineer.md` | `app-core-packages/` → `app/` |
| Modify | `.claude/teammates/evaluator.md` | 경로 + 브랜치 prefix 변수화 |
| Modify | `.claude/teammates/design-engineer.md` | 경로 치환 (필요 시) |
| Modify | `.claude/skills/extract-design/SKILL.md` | `app-core-packages/` → `app/` (로직 유지) |
| Modify | `README.md` | 새 Quick Start + sprint-config 샘플 |
| Modify | `ARCHITECTURE.md` | Worktree 기반 격리 모델 설명 |
| Modify | `MANUAL.md` | sprint 시작/종료 흐름 재작성 |
| Modify | `.gitignore` | `wrtn-backend`, `app-core-packages`, `wds-tokens` → `backend`, `app`, `tokens` |

---

## Task 1: 새 Config 스키마 확정

**Files:**

- [ ] 

- Modify: `sprint-orchestrator/templates/sprint-config-template.yaml`

- [x]  **Step 1: 새 스키마로 template 재작성**

```yaml
sprint_id: "{sprint-id}"
branch_prefix: "sprint"  # Optional. Default "sprint". 과거 "zzem" 사용 시 여기 설정.

repositories:
  backend:
    source: ~/dev/work/wrtn-backend
    base: apple
    mode: worktree
  app:
    source: ~/dev/work/app-core-packages
    base: meme-release-1.2.2
    mode: worktree
  tokens:
    source: ~/dev/work/wds-tokens
    base: main
    mode: symlink

defaults:
  base: main

team:
  teammates:
    - be-engineer
    - fe-engineer
    - design-engineer
    - evaluator
  settings:
    eval_retry_limit: 2
    max_parallel_tasks: 4

display:
  title: "Human-readable sprint title"
  startDate: "YYYY-MM-DD"
  endDate: "YYYY-MM-DD"
  status: "in-progress"
  tags: []
  summary: ""
  prototypes: []
```

Expected: 파일이 위 내용으로 업데이트됨. `url` 필드는 제거 (source 경로가 이미 clone되어 있다고 가정). `path` 필드는 role key로 대체되어 불필요.

- [x] **Step 2: 기존** `repositories.<role>.url` **필드 사용처 확인**

```bash
grep -rn "repositories\." . --include="*.sh" --include="*.md" --include="*.yaml" | grep -v docs/superpowers
```

Expected: `url` 필드를 사용하는 곳이 스크립트에 없어야 함. 있으면 이후 Task에서 함께 처리.

---

## Task 2: setup-sprint.sh 작성

**Files:**

- [ ] 

- Create: `scripts/setup-sprint.sh`

- [x]  **Step 1: 파일 골격 작성**

```bash
#!/bin/bash
# setup-sprint.sh — Create git worktrees (or symlinks) for sprint source repos.
# Usage: ./scripts/setup-sprint.sh --config sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml

set -euo pipefail

CONFIG_PATH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --config) CONFIG_PATH="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

[ -z "$CONFIG_PATH" ] && { echo "Error: --config required"; exit 1; }
[ ! -f "$CONFIG_PATH" ] && { echo "Error: config not found: $CONFIG_PATH"; exit 1; }

ORCHESTRATOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"
```

- [x] **Step 2: YAML 파싱 함수 추가 (Python 사용)**

bash에서 YAML을 안전하게 파싱하려면 Python 사용이 가장 견고. `python3 -c "..."`로 repositories를 tab-separated (role, source, base, mode) 리스트로 출력하는 헬퍼 추가.

Example:

```bash
parse_repos() {
  python3 - <<PY
import yaml, sys, os
with open("$CONFIG_PATH") as f:
    cfg = yaml.safe_load(f)
for role, spec in (cfg.get("repositories") or {}).items():
    source = os.path.expanduser(spec.get("source", ""))
    base = spec.get("base", cfg.get("defaults", {}).get("base", "main"))
    mode = spec.get("mode", "worktree")
    print(f"{role}\t{source}\t{base}\t{mode}")
PY
}

parse_meta() {
  python3 - <<PY
import yaml
with open("$CONFIG_PATH") as f:
    cfg = yaml.safe_load(f)
print(cfg.get("sprint_id", ""))
print(cfg.get("branch_prefix", "sprint"))
PY
}
```

- [x] **Step 3: worktree/symlink 생성 로직**

```bash
SPRINT_ID=$(parse_meta | sed -n '1p')
BRANCH_PREFIX=$(parse_meta | sed -n '2p')
BRANCH="$BRANCH_PREFIX/$SPRINT_ID"

while IFS=$'\t' read -r role source base mode; do
  target="$ORCHESTRATOR_DIR/$role"

  if [ ! -d "$source" ]; then
    echo "✗ $role: source repo not found at $source — clone it first"
    exit 1
  fi

  if [ "$mode" = "symlink" ]; then
    if [ -L "$target" ]; then
      echo "✓ $role (symlink exists)"
    elif [ -e "$target" ]; then
      echo "✗ $role: $target exists but is not a symlink — remove manually"
      exit 1
    else
      ln -s "$source" "$target"
      echo "✓ $role → symlink to $source"
    fi
    continue
  fi

  # mode = worktree
  if [ -d "$target/.git" ] || [ -f "$target/.git" ]; then
    echo "✓ $role (worktree exists at $target)"
    continue
  fi

  if [ -e "$target" ]; then
    echo "✗ $role: $target exists but is not a worktree — remove manually"
    exit 1
  fi

  # Check if branch exists in source
  if git -C "$source" show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git -C "$source" worktree add "$target" "$BRANCH"
    echo "✓ $role → worktree at $target (existing branch $BRANCH)"
  else
    git -C "$source" fetch origin "$base" --quiet
    git -C "$source" worktree add "$target" -b "$BRANCH" "origin/$base"
    echo "✓ $role → worktree at $target (new branch $BRANCH from origin/$base)"
  fi
done < <(parse_repos)

echo ""
echo "Sprint setup complete."
```

- [x] **Step 4: 실행 권한 부여 및 smoke test** (deferred full smoke to Task 10; syntax + arg handling verified)

```bash
chmod +x scripts/setup-sprint.sh
./scripts/setup-sprint.sh --config sprint-orchestrator/sprints/ai-webtoon/sprint-config.yaml
```

Expected: `backend/`, `app/`가 worktree로 생성되고 `sprint/ai-webtoon` 브랜치 체크아웃. `tokens/`는 symlink.

Verify:

```bash
ls -la backend/.git app/.git tokens
git -C backend branch --show-current  # should output: sprint/ai-webtoon
git -C app branch --show-current      # should output: sprint/ai-webtoon
cd ~/dev/work/wrtn-backend && git branch --show-current  # unchanged
```

---

## Task 3: cleanup-sprint.sh 작성

**Files:**

- [ ] 

- Create: `scripts/cleanup-sprint.sh`

- [x]  **Step 1: 파일 작성**

```bash
#!/bin/bash
# cleanup-sprint.sh — Remove sprint worktrees and optionally delete merged branches.
# Usage: ./scripts/cleanup-sprint.sh --config <path> [--force] [--delete-branch]

set -euo pipefail

CONFIG_PATH=""
FORCE=""
DELETE_BRANCH=""

while [ $# -gt 0 ]; do
  case "$1" in
    --config) CONFIG_PATH="$2"; shift 2 ;;
    --force) FORCE="--force"; shift ;;
    --delete-branch) DELETE_BRANCH="1"; shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

[ -z "$CONFIG_PATH" ] && { echo "Error: --config required"; exit 1; }
ORCHESTRATOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# [parse_repos / parse_meta: same as setup-sprint.sh — extract to common lib if repeated]

SPRINT_ID=$(...)
BRANCH_PREFIX=$(...)
BRANCH="$BRANCH_PREFIX/$SPRINT_ID"

while IFS=$'\t' read -r role source base mode; do
  target="$ORCHESTRATOR_DIR/$role"

  if [ "$mode" = "symlink" ]; then
    [ -L "$target" ] && rm "$target" && echo "✓ $role symlink removed"
    continue
  fi

  if [ -d "$target" ]; then
    git -C "$source" worktree remove "$target" $FORCE
    echo "✓ $role worktree removed"
  fi

  if [ -n "$DELETE_BRANCH" ]; then
    if git -C "$source" branch -d "$BRANCH" 2>/dev/null; then
      echo "✓ $role branch $BRANCH deleted (merged)"
    else
      echo "⚠ $role branch $BRANCH not deleted (unmerged or missing)"
    fi
  fi
done < <(parse_repos)
```

- [x] **Step 2: 공통 YAML 파서를 lib로 추출 (optional refactor)** — `scripts/lib/parse-config.sh` 생성

```
scripts/lib/parse-config.sh
```

setup-sprint.sh와 cleanup-sprint.sh가 동일한 파서를 `source`. 중복 제거.

- [x] **Step 3: chmod + smoke test** (full smoke deferred to Task 10)

```bash
chmod +x scripts/cleanup-sprint.sh
```

ai-webtoon으로 smoke test는 Phase 1 재개 이후 실제 cleanup 필요 시 수행.

---

## Task 4: sync-repos.sh 재작성

**Files:**

- [ ] 

- Modify: `scripts/sync-repos.sh`

- [x]  **Step 1: 기존 스크립트 백업 및 재작성**

새 동작: config loop, source 체크아웃에서 `git fetch origin {base}`만 수행. sprint worktree는 건드리지 않음.

```bash
#!/bin/bash
set -euo pipefail

CONFIG_PATH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --config) CONFIG_PATH="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

[ -z "$CONFIG_PATH" ] && { echo "Usage: $0 --config <sprint-config.yaml>"; exit 1; }

# [parse_repos from shared lib]

echo "Fetching base branches in source repos..."
while IFS=$'\t' read -r role source base mode; do
  if [ ! -d "$source" ]; then
    echo "  ✗ $role: source not found ($source)"
    continue
  fi
  if git -C "$source" fetch origin "$base" --quiet 2>/dev/null; then
    behind=$(git -C "$source" rev-list --count "refs/heads/${base}..origin/${base}" 2>/dev/null || echo "?")
    echo "  ✓ $role: origin/$base fetched (main checkout is $behind commits behind)"
  else
    echo "  ✗ $role: fetch failed"
  fi
done < <(parse_repos)
```

- [x] **Step 2: 이전 기능(dirty 감지·pull) 제거 설명 문서화** (Task 8 README/MANUAL 업데이트에 반영 예정)

README/MANUAL에 "sync-repos.sh는 이제 source repo에 대해 fetch만 수행하며, sprint worktree의 sprint 브랜치는 독립적으로 진행된다"고 명시.

---

## Task 5: Phase 파일 업데이트 (경로·브랜치 리터럴 치환)

**Files:**

- [ ] 

- Modify: `.claude/skills/sprint/phase-init.md`
- Modify: `.claude/skills/sprint/phase-build.md`
- Modify: `.claude/skills/sprint/phase-pr.md`
- Modify: `.claude/skills/sprint/phase-retro.md`
- Modify: `.claude/skills/sprint/phase-spec.md`
- Modify: `.claude/skills/sprint/phase-modes.md`
- Modify: `.claude/skills/sprint/SKILL.md`

- [x]  **Step 1:** `phase-init.md` **업데이트**

step 6/7을 다음으로 교체:

```
6. **레포지토리 Worktree 생성**: `./scripts/setup-sprint.sh --config sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml` 실행.
   - `repositories` map의 각 role에 대해 worktree 또는 symlink 생성.
   - 브랜치명: `{branch_prefix}/{sprint-id}` (기본 prefix: `sprint`).
   - 메인 체크아웃의 HEAD는 변경되지 않음.
7. **레포지토리 동기화 (선택)**: `./scripts/sync-repos.sh --config ...` 실행. 각 source repo에서 `origin/{base}`를 fetch (메인 체크아웃 HEAD 불변).
```

- [x]  **Step 2:** `phase-build.md` **업데이트**

- `cd wrtn-backend` → `cd backend` 치환 (전역).
- `cd app-core-packages` → `cd app` 치환 (전역).
- "브랜치 생성" 섹션에서 `git checkout -b zzem/{sprint-id}` 블록 삭제. worktree 생성 시 이미 브랜치가 존재한다는 설명으로 대체.
- `zzem/` 리터럴을 `{branch_prefix}/` (변수 표기)로 치환. 실제 값은 config에서 읽음.

- [x]  **Step 3:** `phase-pr.md` **업데이트**

- `cd app-core-packages && yarn workspace MemeApp e2e:auth` → `cd app && yarn workspace MemeApp e2e:auth` (MemeApp은 app-core-packages의 내부 workspace 이름이라 유지).
- `wrtn-backend:`, `app-core-packages:` 리터럴 블록을 generic role 표기로 변경.
- 브랜치 prefix 변수화.

- [x]  **Step 4:** `phase-retro.md` **업데이트**

마지막 단계로 추가:

```
## Cleanup (optional)

Sprint가 완전히 종료되고 PR이 merge된 후:
```

./scripts/cleanup-sprint.sh --config sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml --delete-branch

```

- worktree 제거 + 병합된 sprint 브랜치 삭제.
- 사용자가 수동 실행 (자동 아님).
```

- [x]  **Step 5:** `phase-spec.md`**,** `phase-modes.md`**,** `SKILL.md` **치환**

- 모든 `wrtn-backend/`, `app-core-packages/`, `wds-tokens/` 리터럴을 role key로 치환.
- `zzem/` 브랜치 prefix 리터럴을 `{branch_prefix}/`로 치환.

- [x]  **Step 6: 잔여 리터럴 검증**

```bash
grep -rn "wrtn-backend\|app-core-packages\|wds-tokens\|zzem/" .claude/
```

Expected: 결과 없음 (extract-design/SKILL.md 제외 — Task 7에서 처리).

---

## Task 6: Teammate 파일 업데이트

**Files:**

- [ ] 

- Modify: `.claude/teammates/be-engineer.md`
- Modify: `.claude/teammates/fe-engineer.md`
- Modify: `.claude/teammates/evaluator.md`
- Modify: `.claude/teammates/design-engineer.md`

- [ ]  **Step 1: 경로 치환**

- `be-engineer.md`: `wrtn-backend/apps/meme-api/src/` → `backend/apps/meme-api/src/`. `cd wrtn-backend` → `cd backend`.
- `fe-engineer.md`: `app-core-packages/apps/MemeApp/src/` → `app/apps/MemeApp/src/`. `cd app-core-packages` → `cd app`.
- `evaluator.md`: 동일 치환 + `git checkout zzem/{sprint-id}` → `git checkout {branch_prefix}/{sprint-id}` (변수 표기).
- `design-engineer.md`: 경로 치환 (필요 시).

- [ ]  **Step 2: 스택 고정 표현 마킹 (Phase β 준비)**

"NestJS meme-api 백엔드", "React Native MemeApp" 같은 스택 설명에 `<!-- CUSTOMIZE: project-specific stack info -->` 주석 추가. Phase β에서 플레이스홀더로 치환할 지점 표시.

- [ ] **Step 3: 검증**

```bash
grep -n "wrtn-backend\|app-core-packages\|zzem/" .claude/teammates/
```

Expected: 결과 없음.

---

## Task 7: extract-design 스킬 경로 치환

**Files:**

- [ ] 

- Modify: `.claude/skills/extract-design/SKILL.md`

- [ ]  **Step 1: 경로만 치환**

- `app-core-packages/packages/app-design-guide/` → `app/packages/app-design-guide/`
- `app-core-packages/apps/MemeApp/src/` → `app/apps/MemeApp/src/`

로직·내용은 유지 (MemeApp 전용 스킬).

---

## Task 8: 최상위 문서 업데이트

**Files:**

- [ ] 

- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Modify: `MANUAL.md`

- [ ]  **Step 1:** `README.md`

Quick Start 섹션 재작성:

```markdown
## Quick Start

1. Source repos를 로컬에 clone (sprint-config.yaml에 지정할 경로).
2. 이 repo를 clone.
3. 새 sprint 시작:
```

/sprint &lt;sprint-id&gt;

```
Phase 1이 sprint-config.yaml 생성 후 `setup-sprint.sh`를 호출해 worktree를 생성.

Source repo 경로는 sprint-config.yaml의 `repositories.<role>.source`에 지정.
```

Submodule/symlink 관련 기존 내용 제거.

- [ ] **Step 2:** `ARCHITECTURE.md`

Worktree 기반 격리 섹션 추가. 다이어그램:

```
~/dev/work/wrtn-backend         (main checkout, 사용자 작업)
  │
  ├─ git worktree {orchestrator}/sprint-A/backend/ branch=sprint/A
  └─ git worktree {orchestrator}/sprint-B/backend/ branch=sprint/B
```

병렬 스프린트 가능 점 강조.

- [ ]  **Step 3:** `MANUAL.md`

- sprint 시작: `setup-sprint.sh` 자동 호출 설명.
- sprint 종료: `cleanup-sprint.sh` 수동 호출 설명.
- 레거시 `setup.sh` 언급 제거.

---

## Task 9: .gitignore 및 setup.sh 정리

**Files:**

- [ ] 

- Modify: `.gitignore`
- Delete: `scripts/setup.sh`

- [ ]  **Step 1: .gitignore 업데이트**

기존:

```
app-core-packages
wrtn-backend
wds-tokens
```

신규:

```
# Sprint worktree / symlink role directories
backend
app
tokens

# 과거 레포명 기반 호환 (전환 기간 중)
app-core-packages
wrtn-backend
wds-tokens
```

(과거 이름도 한동안 같이 ignore 유지 — 오래된 worktree 체크아웃 대비)

- [ ] **Step 2: setup.sh 삭제**

```bash
git rm scripts/setup.sh
```

---

## Task 10: 통합 Smoke Test

**Files:** (실행만 — 변경 없음)

- [ ] **Step 1: 기존 ai-webtoon worktree 정리**

이번 스프린트는 Phase 1 중단 상태이므로, 옛 심볼릭 링크와 config를 새 구조에 맞게 마이그레이션.

```bash
rm backend app tokens 2>/dev/null  # 기존 심볼릭 링크 있으면 제거
rm -rf sprint-orchestrator/sprints/ai-webtoon  # 재생성 예정
```

- [ ] **Step 2: 새 구조로 ai-webtoon 재초기화**

`/sprint ai-webtoon @docs/prds/PRD-ai-webtoon-v1.2.md --phase=init` 로 Phase 1 재실행.

Verify:

- [ ] 

- `backend/.git`, `app/.git` 존재 (worktree 마커).
- `tokens`는 symlink.
- `git -C backend branch --show-current` 출력 `sprint/ai-webtoon`.
- `cd ~/dev/work/wrtn-backend && git status` — HEAD 및 working tree가 Phase 1 실행 전후로 동일해야 함.

- [ ]  **Step 3: 병렬 격리 증명 (optional)**

두 번째 worktree에서 다른 sprint-id로 setup-sprint.sh를 돌려, 각각 독립 브랜치·디렉토리를 가지는지 확인.

- [ ] **Step 4: cleanup 검증**

```bash
./scripts/cleanup-sprint.sh --config sprint-orchestrator/sprints/ai-webtoon/sprint-config.yaml
```

Expected: backend/, app/ worktree 제거. tokens/ symlink 제거. `~/dev/work/*` 메인 체크아웃 여전히 존재.

---

## Success Criteria

- [ ]  새 sprint-config.yaml 스키마가 template 및 새 스프린트에 반영됨.

- [ ] `setup-sprint.sh` 실행 시 `{sprint-worktree}/backend/`, `{sprint-worktree}/app/`에 worktree가 생성되고 `{branch_prefix}/{sprint_id}` 브랜치 체크아웃.

- [ ] `~/dev/work/*` 메인 체크아웃의 HEAD·working tree가 worktree 생성 전후로 불변.

- [ ]  두 번째 zzem-orchestrator worktree에서 동시 스프린트 초기화가 가능 (병렬 격리).

- [ ] `.claude/skills/sprint/**`, `.claude/teammates/**`에 `wrtn-backend`, `app-core-packages`, `zzem/` 리터럴 부재 (extract-design 제외).

- [ ] `cleanup-sprint.sh`로 worktree·브랜치 제거 가능.

- [ ] `README`, `ARCHITECTURE`, `MANUAL` 신 구조 반영.

- [ ] `scripts/setup.sh` 삭제됨.

---

## Post-Completion

Phase α 완료 후:

1. 이 plan 파일의 체크박스를 모두 완료 상태로 업데이트.
2. `ai-webtoon` 스프린트 Phase 1을 신 구조로 재개.
3. Phase β(오픈소스 템플릿화)는 별도 plan 문서 작성 후 착수.

## Notes

- 이 작업은 zzem 스프린트 파이프라인을 타지 않음. 일반 feature 브랜치(`refactor/orchestrator-generalization`)로 진행 권장.
- PR 생성은 사용자 승인 후. Self-merge 금지.
- Task 간 의존: 1 → 2/3/4 (병렬 가능) → 5/6/7 (병렬 가능) → 8/9 → 10.