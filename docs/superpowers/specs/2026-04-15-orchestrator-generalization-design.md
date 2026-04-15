# Orchestrator Generalization Design

## Problem

현재 zzem-orchestrator는 **프로젝트 내부 도구**로 설계되어 있어, 이를 그대로 다른 팀/프로젝트에 적용하거나 오픈소스화하기 어렵다. 주요 커플링:

1. **Source repo 격리 부재**: `setup.sh`가 `~/dev/work/{repo}`로 심볼릭 링크만 만들어, Phase 4에서 `git checkout -b zzem/{id}`를 하면 **사용자의 메인 체크아웃 HEAD가 바뀐다**. 결과:
   - 동시 병렬 스프린트 불가능 (모든 스프린트가 같은 체크아웃 공유)
   - 사용자가 메인 체크아웃에서 다른 작업 중이면 충돌
   - worktree 격리가 `zzem-orchestrator`에서만 유지되고 source repo는 격리되지 않음

2. **레포명·디렉토리 하드코딩**: `("wrtn-backend" "app-core-packages" "wds-tokens")` 배열이 `setup.sh`에 박혀있고, 경로 `wrtn-backend/`가 phase 파일·teammate 가이드·스크립트 전반에 산재. 다른 프로젝트는 레포 개수·이름이 전혀 다름.

3. **브랜치 prefix `zzem/` 고정**: phase-build.md 등에 하드코딩. 프로젝트 식별자가 시스템 코드에 섞여있음.

4. **3-repo 전제**: phase-build/phase-pr에 backend/app 2분법이 깔려있음. 모노레포(1 repo) 또는 5+ repo 프로젝트 커버 불가.

5. **Teammate 파일의 스택 고정**: `be-engineer.md`: "NestJS meme-api 백엔드", `fe-engineer.md`: "React Native MemeApp". 내용이 특정 스택·도메인에 고정.

6. **환경 관례 암묵**: `$REPOS_DIR` 기본값 `$HOME/dev/work` — 오픈소스 사용자가 알기 어려움.

## Solution

오케스트레이션 시스템을 **role 기반 config-driven** 아키텍처로 재설계. 특정 레포·스택·프로젝트에 무관하게 동작하도록 한다.

### 핵심 원리

1. **Role 기반 디렉토리**: worktree 경로가 레포명이 아닌 `role key`. `wrtn-backend/` → `backend/`, `app-core-packages/` → `app/`, `wds-tokens/` → `tokens/`.
2. **Source repo는 git worktree로 격리**: 메인 체크아웃과 HEAD 공유 금지. 동시 병렬 스프린트 가능.
3. **Config-driven scripts**: 모든 스크립트가 sprint-config.yaml의 `repositories` map을 loop. 하드코딩 제거.
4. **Configurable branch prefix**: `branch_prefix` 설정 가능. 기본값 `sprint`.
5. **Teammate 템플릿화**: 현 `.claude/teammates/*.md`를 템플릿으로 분리. 새 프로젝트는 `init-project.sh` 마법사로 구체화 (Phase β).

## Scope

### Phase α — 구조적 개편 (이 문서의 실행 범위)

오픈소스화 직전 단계. 내부 프로젝트가 여전히 1차 사용자이지만, 임의 레포 구성/브랜치 prefix를 수용 가능한 형태로 전환.

#### 변경 대상 — Scripts

| 파일 | 동작 |
|------|------|
| `scripts/setup-sprint.sh` | 신규 — sprint-config 기반 worktree/symlink 생성 |
| `scripts/sync-repos.sh` | 재작성 — config loop, source repo에서 `git fetch origin {base}` |
| `scripts/cleanup-sprint.sh` | 신규 — `git worktree remove` + 브랜치 정리 |
| `scripts/setup.sh` | 삭제 (또는 deprecation 메시지로 1회만 유지) |

#### 변경 대상 — Config

| 파일 | 동작 |
|------|------|
| `sprint-orchestrator/templates/sprint-config-template.yaml` | `repositories` 스키마 확장: `source`, `base`, `mode` (worktree/symlink) + `branch_prefix` 추가 |
| 기존 스프린트의 `sprint-config.yaml` | 현재 in-flight 없음. 새 스프린트부터 신 스키마 적용 |

#### 변경 대상 — Phase 파일

| 파일 | 동작 |
|------|------|
| `.claude/skills/sprint/phase-init.md` | `setup.sh` → `setup-sprint.sh` 교체. 자동 worktree 생성 설명 추가 |
| `.claude/skills/sprint/phase-build.md` | `cd wrtn-backend` → `cd backend` 치환. `git checkout -b zzem/{id}` 제거 (worktree 생성 시 이미 브랜치 존재) |
| `.claude/skills/sprint/phase-pr.md` | `cd app-core-packages` → `cd app` 치환. 브랜치명은 `{branch_prefix}/{sprint-id}` 치환 |
| `.claude/skills/sprint/phase-retro.md` | `cleanup-sprint.sh` 호출 단계 추가 |
| `.claude/skills/sprint/phase-spec.md`, `phase-modes.md` | 하드코딩 경로·브랜치 치환 |
| `.claude/skills/sprint/SKILL.md` | role 기반 설명으로 업데이트 |

#### 변경 대상 — Teammate 가이드

| 파일 | 동작 |
|------|------|
| `.claude/teammates/be-engineer.md` | `wrtn-backend/` → `backend/` 치환. 스택 설명은 주석 처리하되 구체 내용 보존 (Phase β에서 템플릿화) |
| `.claude/teammates/fe-engineer.md` | `app-core-packages/` → `app/` 치환. 동일 |
| `.claude/teammates/evaluator.md` | 양쪽 레포 경로 치환 + 브랜치 prefix 변수화 |
| `.claude/teammates/design-engineer.md` | 필요 시 경로 치환 |

#### 변경 대상 — 문서

| 파일 | 동작 |
|------|------|
| `README.md` | 새 구조 반영. Quick Start에 sprint-config 샘플, `$REPOS_DIR` 선택적 명시 |
| `ARCHITECTURE.md` | Worktree 기반 격리 모델 설명 추가 |
| `MANUAL.md` | sprint 시작/종료 흐름 재작성 |
| `.gitignore` | `backend/`, `app/`, `tokens/` (role 기반) 추가. 기존 `wrtn-backend/` 등 제거 |

#### 변경하지 않는 파일

- `sprint-orchestrator/sprints/free-tab-diversification/**` — 완료된 스프린트. 아카이브 상태 유지.
- `sprint-orchestrator/sprints/*/tasks/backend/`, `tasks/app/` — role 기반 경로는 이미 올바름.
- `knowledge-base/**` — 내용 변경 없음.
- `.claude/skills/extract-design/SKILL.md` — 외부 참조용. 경로는 치환하되 스킬 로직은 유지.

### Phase β — 오픈소스 준비 (별도 후속 스프린트)

이 문서의 범위 밖. 간단히 기록:

- `templates/teammates/*.template.md` 분리 + 플레이스홀더 (`{{REPO_PATH}}`, `{{STACK_SUMMARY}}`)
- `scripts/init-project.sh` 마법사 (레포 목록·스택·브랜치 prefix를 묻고 config + teammate 파일 생성)
- `README.md`/`LICENSE`/`examples/` 추가
- 스택 adapter 가이드 (`docs/stack-adapters.md`)
- Public test fixture (가짜 레포 2개로 동작 검증)

## Detailed Design

### Directory Layout

```
{sprint-worktree}/
├── sprint-orchestrator/
│   ├── sprints/{sprint-id}/
│   │   ├── sprint-config.yaml
│   │   ├── PRD.md
│   │   └── ...
│   └── templates/...
├── backend/      ← git worktree of source=wrtn-backend, branch=sprint/{id}
├── app/          ← git worktree of source=app-core-packages, branch=sprint/{id}
├── tokens/       ← symlink to source=wds-tokens (mode=symlink, read-only)
└── scripts/
```

### sprint-config.yaml Schema (new)

```yaml
sprint_id: "ai-webtoon"
branch_prefix: "sprint"  # optional. Defaults to "sprint"

repositories:
  # Key = role name. Used for directory name and tasks/{role}/ path.
  backend:
    source: ~/dev/work/wrtn-backend  # absolute path or ~ to main checkout
    base: apple
    mode: worktree                    # worktree | symlink
  app:
    source: ~/dev/work/app-core-packages
    base: meme-release-1.2.2
    mode: worktree
  tokens:
    source: ~/dev/work/wds-tokens
    base: main
    mode: symlink                     # read-only repos can stay as symlinks

defaults:
  base: main                          # fallback if a repo omits base

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
  title: "..."
  # ...
```

### Script — setup-sprint.sh

**입력**: `--config <path-to-sprint-config.yaml>`

**동작**:
1. Config 파싱 (YAML → 간단한 key-value; `yq` 있으면 사용, 없으면 Python 파서).
2. 각 `repositories.<role>` 엔트리에 대해:
   - `source` 절대화 (`~` 확장, 상대경로 금지).
   - `mode == worktree`:
     - 대상 경로 `{sprint-worktree}/{role}/`가 이미 존재하면 skip (idempotent).
     - 브랜치 `{branch_prefix}/{sprint_id}` 존재 여부 확인:
       - 존재 → `git worktree add {target} {branch_prefix}/{sprint_id}` (기존 브랜치 체크아웃).
       - 없음 → `git worktree add {target} -b {branch_prefix}/{sprint_id} origin/{base}`.
   - `mode == symlink`:
     - `{target}`이 심볼릭 링크로 존재 → skip.
     - 존재하지 않음 → `ln -s {source} {target}`.
     - 디렉토리/파일로 존재 → 에러 (사용자 정리 요청).
3. 성공/skip 로그 출력. 실패는 즉시 종료 + 명시적 에러.

**에러 케이스**:
- `source`가 존재하지 않음: "Run `git clone {url} {source}` first" 메시지.
- `source`가 git repo가 아님: 에러.
- 대상 경로가 worktree이지만 다른 sprint 브랜치: 경고 + 사용자 확인 요구.

### Script — sync-repos.sh (재작성)

**동작**:
1. Config의 각 role에 대해:
   - source 체크아웃에서 `git fetch origin {base}`.
   - sprint worktree가 존재하면 (mode=worktree), 현재 HEAD가 `{branch_prefix}/{sprint_id}`인지 확인.
   - 사용자에게 merge/rebase 여부 묻지 않음 — sprint 브랜치는 명시적 요청으로만 업데이트.
2. mode=symlink는 skip (원격 상태만 fetch로 갱신).

**중요**: sprint 브랜치에 자동 merge/rebase 금지. base 최신화는 사용자가 명시적으로 요청할 때만.

### Script — cleanup-sprint.sh (신규)

**입력**: `--config <path>` + `--force` 옵션

**동작**:
1. 각 role에 대해:
   - mode=worktree: `git worktree remove {target}` (dirty면 `--force` 필요).
   - mode=symlink: symlink만 제거.
2. Merged 된 sprint 브랜치 제거 확인 (사용자 승인 후):
   - `git -C {source} branch -d {branch_prefix}/{sprint_id}` (fast-forward 조건).

### Phase 파일 수정 원칙

- **경로 리터럴 제거**: `wrtn-backend/`, `app-core-packages/`, `wds-tokens/` → `backend/`, `app/`, `tokens/` (role key).
- **브랜치 리터럴 변수화**: `zzem/{sprint-id}` → `{branch_prefix}/{sprint-id}`. 기본 prefix는 `sprint`.
- **스크립트 호출 업데이트**: `setup.sh` → `setup-sprint.sh --config ...`, `cleanup-sprint.sh` 추가.
- **배치 로직 일반화**: `for role in ${config.repositories}` 스타일로 기술.

### Teammate 파일 수정 원칙

- Phase α: 경로/브랜치 리터럴만 치환. 스택 설명은 그대로 유지 (예: "NestJS meme-api" 주석 처리하거나 `// CUSTOMIZE: project-specific stack info` 마커 추가).
- Phase β: 템플릿으로 분리.

### Branch Prefix Migration

현재 산재한 `zzem/` 리터럴을 일괄 치환. 검색어: `zzem/{sprint` (정규식 `zzem/\{sprint`).

기존 스프린트(`free-tab-diversification`)의 아티팩트는 역사적 기록이므로 변경하지 않음. 새 스프린트부터 `{branch_prefix}/{sprint-id}`.

## Risks & Edge Cases

### Risk 1: Worktree 브랜치 중복

- **시나리오**: 사용자가 이미 `sprint/ai-webtoon` 브랜치를 다른 목적으로 만들어둠.
- **대응**: `setup-sprint.sh`에서 브랜치 존재 감지 시 사용자 확인. 강제로 재사용할지 새 스프린트 id로 갈지.

### Risk 2: 메인 체크아웃이 dirty한 상태

- **시나리오**: `~/dev/work/wrtn-backend`에 uncommitted changes 존재.
- **대응**: worktree 생성 자체는 영향 없음 (worktree는 독립). 단, `origin/{base}` fetch는 네트워크만 사용하므로 문제 없음.

### Risk 3: 기존 in-flight 스프린트가 신 구조로 전환

- **현재 시점**: in-flight 스프린트 없음 (free-tab-diversification 완료). 안전.
- **일반화**: 개편 완료 후 새 스프린트만 신 구조 사용.

### Risk 4: Teammate 가이드가 옛 경로를 참조

- **대응**: phase α에서 전량 치환. 빠뜨린 부분은 Phase 4 실행 중 발견될 경우 즉시 수정.

### Risk 5: `.claude/skills/extract-design/SKILL.md` 외부 스킬 파일

- **대응**: 이 스킬은 MemeApp 전용. 일반화 대상이 아님. 경로만 치환, 로직은 유지.

## Success Criteria

Phase α 완료 후:

- [ ] 새 sprint-config.yaml 스키마로 `ai-webtoon` 스프린트 Phase 1 통과.
- [ ] `setup-sprint.sh` 실행 시 backend/app이 `{sprint-worktree}/backend/`, `{sprint-worktree}/app/`에 worktree로 생성되고 `sprint/ai-webtoon` 브랜치에 체크아웃됨.
- [ ] `~/dev/work/wrtn-backend`의 HEAD·working tree가 worktree 생성 전후로 불변.
- [ ] 두 번째 스프린트를 별도 zzem-orchestrator worktree에서 동시에 초기화 가능 (병렬 격리 증명).
- [ ] 모든 phase 파일·teammate 가이드에 `wrtn-backend`, `app-core-packages`, `zzem/` 리터럴이 남아있지 않음 (role key / `branch_prefix` 사용).
- [ ] `cleanup-sprint.sh`로 worktree·브랜치가 깔끔히 제거됨.

## Out of Scope

- Teammate 템플릿화 + 플레이스홀더 (Phase β)
- `init-project.sh` 프로젝트 마법사 (Phase β)
- 다국어 문서 (Phase β)
- GitHub Actions CI (Phase β)
- 공개 fixture 프로젝트 (Phase β)
