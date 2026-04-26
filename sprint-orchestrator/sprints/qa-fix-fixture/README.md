# QA-Fix Workflow Fixture

This is a dry-run fixture for the QA-Fix workflow (`.claude/skills/sprint/phase-qa-fix.md`).

**Not a real sprint.** Used to validate the workflow's outputs without a live Jira connection.

## Usage

이 fixture는 **수동 dry-run 검증용**이다 (CLI 통합 X — 미래의 `--use-snapshot` 플래그 자리표시).

수동 검증 절차:
1. `qa-fix/jira-snapshot.yaml` 을 직접 Read하여 분류 휴리스틱 확인 (FIXTURE-1 P0 → in-scope, FIXTURE-2 P1 → in-scope, FIXTURE-3 P3 → deferred 가 자연스러운지)
2. `phase-qa-fix.md` Stage 2 grouping 기준에 따라 in-scope 2건이 한 그룹으로 묶일지 별도 그룹이 좋을지 판단
3. 각 템플릿(triage / group / comment / kb-candidate / retro)을 fixture 데이터로 채워보면 미흡한 필드/문구가 드러남
4. Sprint Lead의 분류 휴리스틱 변경 시 이 fixture 결과가 어떻게 달라지는지 회귀 비교

## Expected Outputs

After a successful dry-run, the following files should exist:
- `qa-fix/triage.md` — with FIXTURE-1 + FIXTURE-2 in-scope, FIXTURE-3 deferred
- `qa-fix/groups/group-1.yaml` — both in-scope tickets bundled (or split if grouping rationale differs)
- `qa-fix/contracts/group-1.md` — group contract
- (post-build) `qa-fix/jira-comments/FIXTURE-1.md` — local SSOT, no `.posted` marker (dry-run)
- (post-build) `qa-fix/kb-candidates/FIXTURE-1.yaml` — P0 candidate
- `qa-fix/retro.md`

Inspect outputs and verify:
1. Local SSOT comments are well-formed (template fields filled)
2. KB candidate yaml uses correct zzem-kb category enum
3. No `.posted` marker exists (dry-run blocks the post)
4. Retro Pattern Digest counts match: 2 P0/P1 + 1 P3 (deferred)
