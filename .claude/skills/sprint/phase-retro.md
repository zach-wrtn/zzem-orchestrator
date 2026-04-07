# Phase 6: Retrospective (Sprint Lead solo)

PR 생성 후 스프린트의 성과를 분석하고, 후속 작업을 위한 구조화된 산출물을 생성한다.

## Auto-Trigger

Phase 5 완료 후 자동 실행. `--phase=retro`로 독립 실행도 가능.

## Workflow

### 6.1 Gap Analysis (PRD AC 달성 여부)

PRD.md의 모든 Acceptance Criteria를 순회하며, Evaluator 보고서와 태스크 상태를 대조한다.

```
For each AC in PRD:
  1. 해당 AC를 구현한 태스크 식별 (tasks/*.md의 AC 매핑)
  2. 태스크 상태 확인: COMPLETED / FAILED
  3. COMPLETED인 경우: evaluations/group-{N}.md에서 관련 이슈 확인
  4. 판정: fulfilled / partially_fulfilled / unfulfilled
  5. root_cause 분류: spec_ambiguity / technical_limit / dependency / scope_creep
```

저장: `sprints/{sprint-id}/retrospective/gap-analysis.yaml`

```yaml
sprint_id: "{sprint-id}"
prd_source: "{prd-file}"
generated_at: "{ISO8601}"

coverage:
  total_ac: {N}
  fulfilled: {N}
  partially_fulfilled: {N}
  unfulfilled: {N}
  fulfillment_rate: "{fulfilled / total_ac}"

prototype_amendments:
  total: {N}
  applied: {N}
  deferred: {N}
  dismissed: {N}
  categories:
    new_ac: {N}
    clarify_ac: {N}
    add_ui_spec: {N}
    implicit_req: {N}
    add_rule: {N}

items:
  - ac_id: "AC-{N}"
    ac_text: "{원본 AC 텍스트}"
    task_id: "{구현 태스크}"
    group: "group-{N}"
    status: "{fulfilled | partially_fulfilled | unfulfilled}"
    reason: "{상세 사유}"
    evidence: "{evaluations/group-{N}.md#issue-{N} | null}"
    root_cause: "{spec_ambiguity | technical_limit | dependency | scope_creep | null}"
    recommendation: "{후속 조치 제안}"
    priority: "{critical | high | medium | low}"
```

### 6.2 Pattern Digest (반복 실패 패턴)

모든 Evaluator 보고서를 교차 분석하여 시스템적 패턴을 추출한다.

```
1. evaluations/group-*.md 전체 읽기
2. 이슈를 카테고리별로 그룹화: correctness / completeness / edge_case / integration / code_quality
3. 2개 이상 그룹에서 반복되는 패턴 식별
4. 시스템적 개선 제안 도출
```

저장: `sprints/{sprint-id}/retrospective/pattern-digest.yaml`

```yaml
patterns:
  - pattern: "{반복 패턴 설명}"
    category: "{correctness | completeness | edge_case | integration | code_quality}"
    frequency: {N}
    groups: ["group-{N}", ...]
    severity: "{critical | major | minor}"
    systemic_fix: "{시스템 수준 개선 방안}"

metrics:
  total_groups: {N}
  first_pass_rate: {0.0~1.0}       # 첫 평가에서 PASS한 비율
  avg_fix_cycles: {N.N}            # 평균 fix loop 횟수
  critical_issues_found: {N}
  major_issues_found: {N}
  minor_issues_found: {N}
  issues_fixed: {N}
  issues_deferred: {N}
```

### 6.3 Deferral Index (이월 항목)

gap-analysis에서 `unfulfilled` 또는 `partially_fulfilled`인 항목을 구조화한다.

저장: `sprints/{sprint-id}/retrospective/deferred-items.yaml`

```yaml
deferred:
  - ac_id: "AC-{N}"
    original_task: "{task file path}"
    group: "group-{N}"
    status: "{unfulfilled | partially_fulfilled}"
    reason: "{미충족 사유}"
    root_cause: "{spec_ambiguity | technical_limit | dependency | scope_creep}"
    prior_attempts: {N}
    evaluator_notes: "{evaluations reference}"
    suggested_approach: "{다음 시도에서의 접근 방법}"
    priority: "{critical | high | medium | low}"
    estimated_complexity: "{small | medium | large}"

improvements:
  - description: "{사용자 피드백 또는 추가 개선 사항}"
    source: "{user_feedback | pattern_digest | evaluator_suggestion}"
    priority: "{high | medium | low}"
```

### 6.4 Sprint Report 생성

모든 retrospective 산출물을 통합하여 `REPORT.md`를 생성한다.

저장: `sprints/{sprint-id}/REPORT.md`

```markdown
# Sprint Report: {sprint-id}

> Generated: {date}
> Architecture: Planner-Generator-Evaluator (Harness Design v4)
> PRD: {prd-source}

## Executive Summary
{1~2문장 요약: 무엇을 구현했고 결과는 어떤지}

## PRD Coverage
| User Story | AC 수 | 충족 | 미충족 |
{gap-analysis.yaml에서 US별 집계}
**Fulfillment Rate: {rate}%**

## Build Results
| Group | Feature | BE Task | FE Task | Eval Result | Fix Loops |
{각 그룹별 결과}

## Quality Metrics
| Metric | Value |
{pattern-digest.yaml의 metrics 섹션}

## Issues Found by Evaluator
### Critical
{이슈 테이블: Group, Issue, Root Cause, Resolution}
### Major
{이슈 테이블}
### Minor
{이슈 테이블}

## Systemic Patterns
{pattern-digest.yaml의 patterns 섹션을 서술형으로}

## Deliverables
### Code
| Repository | Branch | Base | Files | Lines |
### New Modules / Screens / Components
{구현된 모듈, 화면, 컴포넌트 목록}
### API Contract
{endpoint 수, 파일 경로}
### Sprint Artifacts
{contract 수, DC 수, evaluation report 수}

## PR Links
| Repository | Status | Link |

## Improvements for Next Sprint
| Priority | Improvement | Source |
{deferred-items.yaml의 improvements 섹션}

## Timeline
| Phase | Duration | Notes |
{각 phase별 소요 시간}
```

### 6.5 사용자에게 Next Action 제안

gap-analysis 결과에 따라 분기:

| 상태 | 제안 |
|------|------|
| fulfillment_rate = 1.0 | "모든 AC 충족. 스프린트 완료." |
| deferred 1~2건 (small) | "`--continue`로 같은 스프린트 내에서 이어서 진행 권장" |
| deferred 3건+ 또는 large | "`--follow-up`으로 후속 스프린트 생성 권장" |
| root_cause가 spec_ambiguity 다수 | "PRD/태스크 spec 재작성 후 후속 스프린트 권장" |
| systemic_fix 존재 | "시스템 개선 선행 후 후속 스프린트 권장" |

## Gate

Phase 6는 최종 단계이므로 별도 gate 없음. 산출물 생성 완료 시 종료.

## Output
```
Sprint Retrospective: {sprint-id}

  PRD Coverage: {fulfilled}/{total_ac} AC fulfilled ({fulfillment_rate}%)
    Fulfilled:           {N}
    Partially fulfilled: {N}
    Unfulfilled:         {N}

  Build Quality:
    First-pass rate:     {N}% ({N}/{M} groups PASS on first eval)
    Avg fix cycles:      {N.N}
    Issues found:        {N} (C:{N} M:{N} m:{N})

  Patterns detected:     {N} systemic patterns
  Deferred items:        {N} ({N} critical, {N} high)

  Retrospective saved: sprints/{sprint-id}/retrospective/
  Sprint Report: sprints/{sprint-id}/REPORT.md

→ Recommendation: {context-aware next action}
```
