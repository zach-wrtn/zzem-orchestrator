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

## Gate → Phase 2

다음 조건 **모두** 충족 시 Phase 2 진입:
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (PRD.md, sprint-config.yaml, tasks/, contracts/, evaluations/, checkpoints/, logs/)
- [ ] PRD.md에 원본 PRD 링크 + 스코프 요약 존재
- [ ] sprint-config.yaml에 base branch 설정 존재

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
