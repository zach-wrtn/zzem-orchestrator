# Phase 1: Init (Sprint Lead solo)

스프린트 디렉토리를 초기화한다.

## Workflow

1. **인자 수집**: `sprint-id`와 `prd-file` 경로. 없으면 사용자에게 질문.
2. **PRD 존재 확인**: `docs/prds/{prd-file}` 확인.
3. **디렉토리 생성**:
   ```
   sprint-orchestrator/sprints/{sprint-id}/
   ├── PRD.md
   ├── sprint-config.yaml
   ├── tasks/
   │   ├── app/.gitkeep
   │   └── backend/.gitkeep
   ├── contracts/.gitkeep
   ├── evaluations/.gitkeep
   ├── prototypes/app/.gitkeep
   ├── checkpoints/.gitkeep
   └── logs/.gitkeep
   ```
4. **PRD.md**: 원본 링크 + 스코프 요약 자동 생성.
5. **sprint-config.yaml**: 사용자에게 base branch 질문 후 생성.
6. **레포지토리 Worktree 생성**: `./scripts/setup-sprint.sh --config sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml` 실행. sprint-config의 `repositories` map을 loop하여 각 role에 대해:
   - `mode: worktree` → `{role}/`에 git worktree 생성 + `{branch_prefix}/{sprint-id}` 브랜치 체크아웃 (`origin/{base}`에서 분기).
   - `mode: symlink` → `{role}/`에 source 경로로 심볼릭 링크 생성.

   각 source repo의 메인 체크아웃은 HEAD/working tree가 변경되지 않는다. 스크립트 출력을 사용자에게 보여주고, 에러 시 원인(예: source 경로 누락)을 해결한 뒤 재실행.

7. **레포지토리 동기화 (선택)**: `./scripts/sync-repos.sh --config sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml` 실행. 각 source repo에서 `git fetch origin {base}`만 수행 (sprint 브랜치는 건드리지 않음). 네트워크 문제 또는 읽기 전용 환경이면 생략 가능.

## Gate → Phase 2

다음 조건 **모두** 충족 시 Phase 2 진입:
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (PRD.md, sprint-config.yaml, tasks/, contracts/, evaluations/, checkpoints/, logs/)
- [ ] PRD.md에 원본 PRD 링크 + 스코프 요약 존재
- [ ] sprint-config.yaml에 `repositories` (role → {source, base, mode}) + `branch_prefix` 설정 존재
- [ ] `setup-sprint.sh`가 성공적으로 실행되어 각 role 디렉토리가 생성됨 (`{role}/.git` 또는 symlink)
- [ ] (선택) 레포지토리 fetch 완료

## Output

Gate 통과 시:
1. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
2. 다음 Phase 진입.

```
Sprint initialized: {sprint-id}
  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Repositories: (role → branch)
    backend → {branch_prefix}/{sprint-id} (base: {base})
    app     → {branch_prefix}/{sprint-id} (base: {base})
    tokens  → symlink (read-only)

[Sprint Status Dashboard]

→ Proceeding to Phase 2: Spec
```
