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
6. **레포지토리 동기화**: `./scripts/sync-repos.sh --config sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml` 실행. `wrtn-backend`, `app-core-packages`, `wds-tokens` 세 레포의 base 브랜치를 remote와 동기화한다. 각 레포는 다음 규칙으로 처리:
   - Clean + on base branch → 자동 `git pull` (fast-forward)
   - Clean + 다른 브랜치 → 경고만 표시, 자동 전환 금지
   - Dirty working tree → 경고만 표시, 자동 pull 금지
   스크립트 출력을 사용자에게 보여준다. 경고가 있으면 사용자에게 해결 여부 확인 후 계속 진행할지 묻는다. `--skip-sync` 플래그로 이 단계를 생략 가능.

## Gate → Phase 2

다음 조건 **모두** 충족 시 Phase 2 진입:
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (PRD.md, sprint-config.yaml, tasks/, contracts/, evaluations/, checkpoints/, logs/)
- [ ] PRD.md에 원본 PRD 링크 + 스코프 요약 존재
- [ ] sprint-config.yaml에 base branch 설정 존재
- [ ] 레포지토리 동기화 결과 확인 (경고 해결 또는 `--skip-sync`)

## Output

Gate 통과 시:
1. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
2. 다음 Phase 진입.

```
Sprint initialized: {sprint-id}
  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Base branches: backend → {base}, app → {base}

[Sprint Status Dashboard]

→ Proceeding to Phase 2: Spec
```
