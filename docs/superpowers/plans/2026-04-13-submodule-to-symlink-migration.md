# Submodule → Symlink Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서브모듈 3개를 제거하고 심볼릭 링크로 전환하여, 오케스트레이션 에이전트가 항상 최신 코드를 바라보도록 한다.

**Architecture:** 서브모듈 디렉토리(`app-core-packages/`, `wrtn-backend/`, `wds-tokens/`)를 git에서 해제하고, 동일 경로에 `~/dev/work/` 하위 실제 레포를 가리키는 심볼릭 링크를 생성한다. 기존 상대경로가 모두 그대로 동작하므로 teammate/skill 파일 변경 불필요.

**Tech Stack:** Git, Bash, symlinks

**Spec:** `docs/superpowers/specs/2026-04-13-submodule-to-symlink-migration-design.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Delete | `.gitmodules` | 서브모듈 설정 제거 |
| Modify | `.gitignore` | 심볼릭 링크 3개 무시 항목 추가 |
| Create | `scripts/setup.sh` | 심볼릭 링크 생성 셋업 스크립트 |
| Modify | `README.md:13-15,18-24,28-31` | `[submodule]` → `[symlink]`, Submodules → Repositories, Quick Start 변경 |
| Modify | `MANUAL.md:15-16` | `git submodule update` → `scripts/setup.sh` |
| Modify | `sprint-orchestrator/templates/sprint-config-template.yaml` | `branches` → `repositories` 섹션 통합 |
| Modify | `.claude/settings.local.json:60` | `git submodule` 권한 항목 제거 |

---

### Task 1: 서브모듈 해제 및 디렉토리 정리

**Files:**
- Delete: `.gitmodules`
- Delete (git index): `app-core-packages`, `wrtn-backend`, `wds-tokens` 서브모듈 엔트리

- [ ] **Step 1: 서브모듈 등록 해제**

```bash
cd /Users/zachryu/dev/work/zzem-orchestrator
git submodule deinit -f app-core-packages wrtn-backend wds-tokens
```

Expected: 각 서브모듈에 대해 `Cleared directory 'xxx'` 메시지 출력.

- [ ] **Step 2: .git/modules 캐시 제거**

```bash
rm -rf .git/modules/app-core-packages .git/modules/wrtn-backend .git/modules/wds-tokens
```

Expected: 출력 없음 (정상).

- [ ] **Step 3: git index에서 서브모듈 제거**

```bash
git rm -f app-core-packages wrtn-backend wds-tokens
```

Expected: `rm 'app-core-packages'`, `rm 'wrtn-backend'`, `rm 'wds-tokens'` 출력.

- [ ] **Step 4: .gitmodules 파일 삭제**

```bash
git rm -f .gitmodules
```

Expected: `rm '.gitmodules'` 출력.

- [ ] **Step 5: 서브모듈 제거 커밋**

```bash
git add -A
git commit -m "chore: remove git submodules (app-core-packages, wrtn-backend, wds-tokens)"
```

---

### Task 2: 심볼릭 링크 생성 및 .gitignore 업데이트

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 심볼릭 링크 생성**

```bash
cd /Users/zachryu/dev/work/zzem-orchestrator
ln -s ~/dev/work/app-core-packages ./app-core-packages
ln -s ~/dev/work/wrtn-backend ./wrtn-backend
ln -s ~/dev/work/wds-tokens ./wds-tokens
```

Expected: 출력 없음. `ls -la` 로 심볼릭 링크 확인.

- [ ] **Step 2: 심볼릭 링크 동작 확인**

```bash
cat wrtn-backend/package.json | head -3
cat app-core-packages/package.json | head -3
ls wds-tokens/tokens.json
```

Expected: 각 레포의 실제 파일 내용이 출력됨.

- [ ] **Step 3: .gitignore에 심볼릭 링크 추가**

`.gitignore` 파일 끝에 추가:

```gitignore

# Repository symlinks
app-core-packages
wrtn-backend
wds-tokens
```

- [ ] **Step 4: git status 확인**

```bash
git status
```

Expected: 심볼릭 링크가 untracked로 나타나지 않음. `.gitignore` 변경만 표시.

- [ ] **Step 5: 커밋**

```bash
git add .gitignore
git commit -m "chore: add symlink entries to .gitignore"
```

---

### Task 3: setup.sh 스크립트 생성

**Files:**
- Create: `scripts/setup.sh`

- [ ] **Step 1: scripts 디렉토리 생성**

```bash
mkdir -p /Users/zachryu/dev/work/zzem-orchestrator/scripts
```

- [ ] **Step 2: setup.sh 작성**

`scripts/setup.sh` 파일 생성:

```bash
#!/bin/bash
set -euo pipefail

REPOS_DIR="${REPOS_DIR:-$HOME/dev/work}"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

repos=("app-core-packages" "wrtn-backend" "wds-tokens")

for repo in "${repos[@]}"; do
  target="$SCRIPT_DIR/$repo"
  source="$REPOS_DIR/$repo"

  if [ -L "$target" ]; then
    echo "✓ $repo (symlink exists)"
  elif [ -d "$target" ]; then
    echo "✗ $repo — directory already exists (remove it first)"
    exit 1
  elif [ ! -d "$source" ]; then
    echo "✗ $repo — not found at $source"
    exit 1
  else
    ln -s "$source" "$target"
    echo "✓ $repo → $source"
  fi
done

echo ""
echo "Setup complete. All repositories linked."
```

- [ ] **Step 3: 실행 권한 부여**

```bash
chmod +x scripts/setup.sh
```

- [ ] **Step 4: 스크립트 동작 확인**

심볼릭 링크가 이미 있으므로, 재실행 시 스킵되는지 확인:

```bash
./scripts/setup.sh
```

Expected:
```
✓ app-core-packages (symlink exists)
✓ wrtn-backend (symlink exists)
✓ wds-tokens (symlink exists)

Setup complete. All repositories linked.
```

- [ ] **Step 5: 커밋**

```bash
git add scripts/setup.sh
git commit -m "feat: add setup.sh for repository symlink creation"
```

---

### Task 4: README.md 업데이트

**Files:**
- Modify: `README.md:13-15,18-24,28-31`

- [ ] **Step 1: 구조도에서 `[submodule]` → `[symlink]` 변경**

`README.md` 13-15행:

```
Before:
├── app-core-packages/   [submodule]   ← React Native 프론트엔드
├── wrtn-backend/        [submodule]   ← NestJS 백엔드
└── wds-tokens/          [submodule]   ← Figma-synced 디자인 토큰

After:
├── app-core-packages/   [symlink]     ← React Native 프론트엔드
├── wrtn-backend/        [symlink]     ← NestJS 백엔드
└── wds-tokens/          [symlink]     ← Figma-synced 디자인 토큰
```

- [ ] **Step 2: Submodules 섹션 → Repositories 섹션 변경**

`README.md` 18-24행:

```markdown
Before:
### Submodules

| Submodule | Repository | 역할 |
|-----------|-----------|------|
| `app-core-packages` | `github.com:wrtn-tech/app-core-packages` | Yarn/Lerna 모노레포. MemeApp 등 9개 앱 + 23개 패키지 |
| `wrtn-backend` | `github.wrtn.club:wrtn-tech/wrtn-backend` | pnpm/Nx 모노레포. meme-api 등 6개 NestJS 서비스 |
| `wds-tokens` | `github.wrtn.club:pepper/wds-tokens` | Token Studio JSON. primitive → semantic → component 3계층 |

After:
### Repositories

| Repository | URL | 역할 |
|-----------|-----|------|
| `app-core-packages` | `github.com:wrtn-tech/app-core-packages` | Yarn/Lerna 모노레포. MemeApp 등 9개 앱 + 23개 패키지 |
| `wrtn-backend` | `github.wrtn.club:wrtn-tech/wrtn-backend` | pnpm/Nx 모노레포. meme-api 등 6개 NestJS 서비스 |
| `wds-tokens` | `github.wrtn.club:pepper/wds-tokens` | Token Studio JSON. primitive → semantic → component 3계층 |

> 심볼릭 링크로 연결. `scripts/setup.sh` 실행으로 셋업.
```

- [ ] **Step 3: Quick Start 변경**

`README.md` 28-31행:

```markdown
Before:
## Quick Start

\```bash
# 1. Clone with submodules
git clone --recurse-submodules <repo-url>

# 2. Agent Teams 환경변수 설정
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 3. 스프린트 실행
/sprint ugc-profile-nav-001
\```

After:
## Quick Start

\```bash
# 1. Clone
git clone <repo-url>

# 2. 레포지토리 심볼릭 링크 연결
./scripts/setup.sh

# 3. Agent Teams 환경변수 설정
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 4. 스프린트 실행
/sprint ugc-profile-nav-001
\```
```

- [ ] **Step 4: 커밋**

```bash
git add README.md
git commit -m "docs: update README for symlink-based repository references"
```

---

### Task 5: MANUAL.md 업데이트

**Files:**
- Modify: `MANUAL.md:15-16`

- [ ] **Step 1: 환경 설정 섹션 변경**

`MANUAL.md` 15-16행:

```markdown
Before:
# Submodule 최신화
git submodule update --init --recursive

After:
# 레포지토리 연결 (심볼릭 링크)
./scripts/setup.sh
```

- [ ] **Step 2: 커밋**

```bash
git add MANUAL.md
git commit -m "docs: update MANUAL for symlink setup"
```

---

### Task 6: sprint-config-template.yaml 리팩터

**Files:**
- Modify: `sprint-orchestrator/templates/sprint-config-template.yaml`

- [ ] **Step 1: `branches` → `repositories` 섹션 통합**

전체 파일을 다음으로 교체:

```yaml
# Sprint Configuration Template
# 복사하여 sprints/{sprint-id}/sprint-config.yaml로 사용

sprint_id: "{sprint-id}"

# 레포지토리 참조 (심볼릭 링크 경로 기준)
repositories:
  backend:
    path: wrtn-backend
    url: git@github.wrtn.club:wrtn-tech/wrtn-backend.git
    base: "apple"
  app:
    path: app-core-packages
    url: git@github.com:wrtn-tech/app-core-packages.git
    base: "meme-release-1.2.2"
  tokens:
    path: wds-tokens
    url: git@github.wrtn.club:pepper/wds-tokens.git
    base: "main"

# 미지정 프로젝트의 폴백 base branch
defaults:
  base: "main"

# Agent Teams 설정 (Harness Design v4)
team:
  teammates:
    - be-engineer            # .claude/teammates/be-engineer.md (Generator)
    - fe-engineer            # .claude/teammates/fe-engineer.md (Generator)
    - design-engineer        # .claude/teammates/design-engineer.md (Prototype)
    - evaluator              # .claude/teammates/evaluator.md (Evaluator)
  settings:
    eval_retry_limit: 2        # Evaluation fix loop 최대 반복
    max_parallel_tasks: 4      # 동시 실행 최대 태스크 수
```

- [ ] **Step 2: 커밋**

```bash
git add sprint-orchestrator/templates/sprint-config-template.yaml
git commit -m "refactor: consolidate branches into repositories section in sprint config"
```

---

### Task 7: settings.local.json 정리 및 최종 검증

**Files:**
- Modify: `.claude/settings.local.json:60`

- [ ] **Step 1: `git submodule` 권한 항목 제거**

`.claude/settings.local.json` 60행의 `"Bash(git submodule:*)"` 항목을 삭제한다.

- [ ] **Step 2: 워크트리 호환성 검증**

```bash
cd /Users/zachryu/dev/work/zzem-orchestrator/wrtn-backend
git status
git worktree list
```

Expected: 심볼릭 링크를 통해 접근한 레포에서 git 명령이 정상 동작.

```bash
cd /Users/zachryu/dev/work/zzem-orchestrator/app-core-packages
git status
git worktree list
```

Expected: 동일하게 정상 동작.

- [ ] **Step 3: 오케스트레이터 루트 git status 확인**

```bash
cd /Users/zachryu/dev/work/zzem-orchestrator
git status
```

Expected: clean 상태 (settings.local.json 변경만 표시).

- [ ] **Step 4: 커밋**

```bash
git add .claude/settings.local.json
git commit -m "chore: remove git submodule permission from settings"
```
