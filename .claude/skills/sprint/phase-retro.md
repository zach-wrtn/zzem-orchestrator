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

### 6.6 DESIGN.md 갱신 검토

스프린트에서 새로운 컴포넌트·화면·인터랙션 패턴이 추가된 경우, `docs/designs/DESIGN.md`의 갱신 필요 여부를 검토한다.

- **갱신 트리거**: 새 컴포넌트 토큰 추가, 기존 Do's/Don'ts에 반하는 패턴 도입, 디자인 시스템 변경
- **갱신 방법**: `/extract-design --update` 실행 → 기존 DESIGN.md와 diff 출력 → 사용자 확인 후 반영
- **스킵 조건**: 기존 컴포넌트만 사용하고 디자인 시스템 변경이 없으면 스킵

### 6.7 Knowledge Base Write (3종 승격 의식)

> Ref: Hermes / Reflexion / DSPy — 스프린트 완료 후 학습을 다음 스프린트가 실제로 소비하도록 KB에 기록.
>
> 6.7은 4개 하위 단계로 구성된다:
> - **6.7a Rubric 승격**: pattern → Evaluator rubric clause
> - **6.7b Skill 승격** (placeholder, Phase B에서 구현): pattern → 재사용 코드 skill
> - **6.7c Rule 승격**: 사용자 피드백 → 영구 rule
> - **6.7d Reflection 작성**: Reflexion-style 1페이지 자연어 회고
>
> 아래 6.7 본문(Pattern KB Write)은 4개 단계의 공통 기반이며, 각 승격 단계는 본문 종료 후 순차 실행된다.

Pattern Digest + Quality Report를 KB에 기록한다.

**Workflow**:

```
1. pattern-digest.yaml 읽기
2. knowledge-base/patterns/README.md 인덱스 읽기
3. For each pattern in pattern-digest:
   a. 인덱스에서 동일 title/category 매칭 검색
   b. 매칭 발견:
      - 해당 .yaml 파일 Read
      - frequency += 1
      - last_seen = current sprint-id
      - groups 배열에 현재 그룹 추가
      - Write (갱신)
      - README.md 인덱스의 Freq, Last Seen 갱신
   c. 매칭 없음 (신규):
      - 새 .yaml 파일 생성 (스키마: knowledge-base/README.md 참조)
      - pattern-digest의 systemic_fix → prevention 필드로 변환
      - pattern-digest의 pattern → description 필드로 변환
      - contract_clause: systemic_fix에서 Contract 조항 도출 (없으면 null)
      - README.md 인덱스에 행 추가
4. prototypes/quality-report.yaml 읽기 (존재 시)
5. fabrication_risk: medium 항목을 design/ KB에 동일 절차로 기록
```

**Design Engineer 패턴 기록**:

프로토타입에서 반복된 품질 이슈도 KB에 기록한다:

| 시그널 | Design KB 패턴 |
|--------|--------------|
| 같은 revision 사유가 2회+ | `design-proto-{NNN}`: 반복 보정 패턴 |
| fabrication_risk: medium + approved | `design-spec-{NNN}`: PRD 암묵적 요구사항 |
| quality_score.extraction_accuracy < 0.8 | `design-spec-{NNN}`: 추출 정확도 개선 필요 |

**Nudge 메커니즘**:

Retrospective 산출물 생성 후, 다음 조건을 체크:

```
if new_patterns_count >= 2:
    사용자에게: "이번 스프린트에서 {N}개 신규 패턴 발견, KB에 기록. 
    다음 스프린트의 Contract/Evaluation에 자동 반영됩니다."

if any pattern.frequency >= 3:
    사용자에게: "⚠ 패턴 '{title}'이 {N}개 스프린트에서 반복. 
    Sprint Contract 템플릿에 영구 반영을 권장합니다."
    → 사용자 승인 시 sprint-contract-template.md에 해당 clause 추가
```

**출력에 추가** (기존 Phase 6 Output 블록 안에):
```
  KB Update:
    Patterns updated: {N} (existing: {M} updated, new: {K} created)
    Design patterns: {N}
    Template nudge: {있으면 표시, 없으면 생략}
```

### 6.7a Rubric 승격 (Pattern → Evaluator Rubric Clause)

> Ref: ExpeL — cross-task insight를 평가 rubric으로 누적.

**Trigger**: pattern-digest의 패턴 중 `frequency >= 2` 이고 `contract_clause`가 정의된 것.

**Workflow**:
1. `knowledge-base/rubrics/` 디렉토리 ls → `superseded_by: null` 인 최신 v(N) 파일 찾기
2. v(N) 파일의 "Promotion Log" 표에 후보 패턴 추가 (Date, Sprint, Clause Added, Source Pattern)
3. v(N) 파일의 누적 promotion 개수 계산:
   - 누적 `< 2`: v(N)에 Promotion Log 행 추가만 (clause는 본문에 미반영, 다음 스프린트부터 신규 패턴이면 우선 평가)
   - 누적 `>= 2`: v(N+1) 파일 신규 생성
     - 헤더 갱신 (`id: vN+1`, `created_at`, `source_sprint: 현재 sprint-id`)
     - v(N) 모든 clause + 누적 Promotion Log의 clause를 Clauses 섹션으로 본문화
     - v(N) 파일 frontmatter의 `superseded_by: vN+1`로 갱신
4. 사용자 nudge:
   ```
   Rubric: v{N} 유지 (promotion log {N}건 누적) | v{N+1} 생성 (clause {N}건 본문화)
   ```

**Effect**: 다음 스프린트 Phase 4.4에서 Evaluator가 자동으로 최신 vN 로드 → 누적된 평가 기준 적용.

### 6.7b Skill 승격 (Pattern → Reusable Code Skill)

> 본 단계는 **placeholder** 상태. Phase B(스킬 라이브러리 구축)에서 구현된다.
>
> 트리거 조건만 정의:
> - 동일 코드 패턴이 2개 이상 그룹에서 반복 구현됨
> - Generator가 작성한 코드 중 90%+ 동일한 구조

당분간은 Pattern Digest의 해당 항목에 `skill_candidate: true` 태그만 부여하고 KB 기록 없이 통과.

### 6.7c Rule 승격 (User Feedback → Permanent Rule)

> Ref: Cursor Rules / Claude Code CLAUDE.md auto-promotion.

**Trigger**: 스프린트 중 사용자가 동일 교정을 2회 이상 제공한 경우.

**Workflow**:
1. `deferred-items.yaml`의 `improvements` 섹션에서 `source: user_feedback` 항목 추출
2. 동일/유사 피드백이 직전 스프린트 reflection의 "What failed" 또는 KB rule에 이미 있는지 확인
3. 신규 + frequency 2+ 항목 → `MEMORY.md` 인덱스에 `feedback_*.md` 추가 후보로 사용자에게 제시
   ```
   ⚠ User feedback "{summary}" repeated {N} times.
   → Promote to memory/feedback_{slug}.md? (y/n)
   ```
4. 사용자 승인 시 auto-memory 가이드 절차에 따라 frontmatter 포함 파일 작성 + MEMORY.md 인덱스 갱신

### 6.7d Reflection 작성 (Reflexion-style 1페이지 회고)

> Ref: Reflexion (Shinn 2023) — 자연어 self-reflection을 다음 시도에 주입.

**Trigger**: Phase 6 항상 실행 (누락 금지 — 다음 스프린트 Phase 2가 의존).

**Workflow**:
1. `pattern-digest.yaml` + `gap-analysis.yaml` 읽기
2. `knowledge-base/reflections/{sprint-id}.md` 작성 (스키마: `knowledge-base/reflections/README.md` 참조)
   - **What worked**: PASS 그룹의 성공 요인 2~3개 (재사용 가능 형태)
   - **What failed (with root cause)**: ISSUES/FAIL 항목의 1줄 trace + root_cause
   - **Lesson (next-sprint actionable)**: 다음 스프린트 Phase 2/4에 반영할 구체 지침
   - **Pointers**: pattern-digest, gap-analysis, KB pattern id 참조
3. 직전 스프린트(같은 도메인)의 reflection이 존재하면 마지막에 1줄 추가:
   ```
   > 직전 lesson 반영도: {fully | partially | not} — {간단 평가}
   ```
4. <= 400단어 유지

**출력 갱신** (Phase 6 Output 블록):
```
  Promotions:
    Rubric: {v(N) 유지 | v(N+1) 생성, clause {K}개 본문화}
    Skill candidates: {N} (placeholder)
    Rule promotions: {N}
    Reflection: knowledge-base/reflections/{sprint-id}.md
```

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
