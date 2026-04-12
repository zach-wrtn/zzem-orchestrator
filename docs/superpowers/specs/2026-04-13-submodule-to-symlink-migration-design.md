# Submodule → Symlink Migration Design

## Problem

오케스트레이션 에이전트가 서브모듈의 stale 코드를 바라보는 문제.

서브모듈은 특정 커밋에 고정되므로, 실제 레포에서 진행된 변경이 오케스트레이터에 반영되지 않는다.
이로 인해 에이전트가 outdated 코드 위에서 구현하거나, 머지 시점에 충돌이 폭발한다.

## Solution

서브모듈 3개를 제거하고, `~/dev/work/` 하위의 실제 레포를 **심볼릭 링크**로 참조한다.

- 기존 상대경로(`wrtn-backend/`, `app-core-packages/`, `wds-tokens/`)가 그대로 동작
- 에이전트가 바라보는 코드가 항상 실제 레포의 최신 상태
- 워크트리 생성 명령 변경 불필요

## Scope

### 변경 대상

| 파일 | 변경 내용 |
|------|----------|
| `.gitmodules` | 삭제 |
| `.gitignore` | 심볼릭 링크 3개 추가 |
| `scripts/setup.sh` | 신규 — 심볼릭 링크 생성 스크립트 |
| `README.md` | `[submodule]` → `[symlink]`, Quick Start 변경 |
| `ARCHITECTURE.md` | `[submodule]` → `[symlink]`, Submodules → Repositories |
| `MANUAL.md` | `git submodule update` → `scripts/setup.sh` |
| `sprint-config-template.yaml` | `branches` → `repositories` 섹션 통합 |

### 변경하지 않는 파일

- `.claude/teammates/*.md` — 상대경로 그대로 동작
- `.claude/skills/sprint/*.md` — 상대경로 그대로 동작
- `.claude/skills/extract-design/SKILL.md` — 상대경로 그대로 동작
- `.github/workflows/deploy-prototypes.yml` — 이미 `submodules: false`

## Detailed Design

### 1. 서브모듈 제거

```bash
# 서브모듈 등록 해제
git submodule deinit -f app-core-packages wrtn-backend wds-tokens

# .git/modules 캐시 제거
rm -rf .git/modules/app-core-packages .git/modules/wrtn-backend .git/modules/wds-tokens

# git index에서 제거
git rm -f app-core-packages wrtn-backend wds-tokens

# .gitmodules 삭제
git rm -f .gitmodules
```

### 2. 심볼릭 링크 생성

```bash
ln -s ~/dev/work/app-core-packages ./app-core-packages
ln -s ~/dev/work/wrtn-backend ./wrtn-backend
ln -s ~/dev/work/wds-tokens ./wds-tokens
```

### 3. .gitignore 변경

```gitignore
# 기존
.DS_Store
design-tokens/
.worktrees/
.mcp.json
.env
.gstack/

# 추가: Repository symlinks
app-core-packages
wrtn-backend
wds-tokens
```

### 4. scripts/setup.sh (신규)

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

`REPOS_DIR` 환경변수로 경로 오버라이드 가능 (기본값 `~/dev/work`).

### 5. README.md 변경

구조도:
```
zzem-orchestrator/                     ← 오케스트레이션 레이어
├── sprint-orchestrator/               ← 스프린트 관리 (templates, sprints, knowledge-base)
├── docs/prds/                         ← PRD 원본
├── app-core-packages/   [symlink]     ← React Native 프론트엔드
├── wrtn-backend/        [symlink]     ← NestJS 백엔드
└── wds-tokens/          [symlink]     ← Figma-synced 디자인 토큰
```

Submodules 섹션 → Repositories:
```markdown
### Repositories

| Repository | URL | 역할 |
|-----------|-----|------|
| `app-core-packages` | `github.com:wrtn-tech/app-core-packages` | Yarn/Lerna 모노레포. MemeApp 등 9개 앱 + 23개 패키지 |
| `wrtn-backend` | `github.wrtn.club:wrtn-tech/wrtn-backend` | pnpm/Nx 모노레포. meme-api 등 6개 NestJS 서비스 |
| `wds-tokens` | `github.wrtn.club:pepper/wds-tokens` | Token Studio JSON. primitive → semantic → component 3계층 |

> 심볼릭 링크로 연결. `scripts/setup.sh` 실행으로 셋업.
```

Quick Start:
```bash
# 1. Clone
git clone <repo-url>

# 2. 레포지토리 심볼릭 링크 연결
./scripts/setup.sh

# 3. Agent Teams 환경변수 설정
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 4. 스프린트 실행
/sprint ugc-profile-nav-001
```

### 6. ARCHITECTURE.md 변경

README.md와 동일하게 `[submodule]` → `[symlink]`, Submodules 테이블 → Repositories 테이블.

### 7. MANUAL.md 변경

환경 설정 섹션:
```bash
# Agent Teams 활성화 (필수)
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 레포지토리 연결 (심볼릭 링크)
./scripts/setup.sh
```

### 8. sprint-config-template.yaml 변경

기존 `branches` 섹션을 `repositories` 섹션으로 통합:

```yaml
sprint_id: "{sprint-id}"

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

## Verification

마이그레이션 완료 후 검증:

1. `ls -la app-core-packages wrtn-backend wds-tokens` — 심볼릭 링크 확인
2. `cat wrtn-backend/package.json` — 실제 파일 읽기 확인
3. `cd wrtn-backend && git status` — git 명령 정상 동작 확인
4. `cd wrtn-backend && git worktree list` — 워크트리 명령 호환 확인
5. `git status` (오케스트레이터 루트) — clean 상태 확인

## Risk & Mitigation

| 리스크 | 대응 |
|--------|------|
| 서브모듈 디렉토리 잔여물로 심볼릭 링크 생성 실패 | `setup.sh`가 기존 디렉토리 존재 시 에러로 중단 |
| 다른 머신에서 클론 시 심볼릭 링크 없음 | `setup.sh` 실행으로 해결. README Quick Start에 명시 |
| `sprint-config.yaml` 스키마 변경으로 기존 스프린트 호환 깨짐 | 기존 `sprints/*/sprint-config.yaml`은 그대로 유지 (템플릿만 변경) |
| sprint skill이 `branches.backend.base`를 참조하는 경우 | 확인 완료: skill 파일은 특정 키 경로를 하드코딩하지 않고 YAML을 자연어로 참조. `repositories.backend.base`로 변경해도 호환됨 |
