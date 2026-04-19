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
2. For each pattern in pattern-digest:
   a. 매칭 검색: `zzem-kb:read type=pattern category={카테고리}` → 반환된 파일들을 Read하여
      title/description 유사도로 기존 패턴과 매칭 여부 판정
   b. 매칭 발견:
      - `zzem-kb:update-pattern id={기존-id} source_sprint={현재-sprint-id}`
        (스킬이 frequency+1 + last_seen 업데이트 + rebase-retry push 자동 처리)
   c. 매칭 없음 (신규):
      - `zzem-kb:write-pattern` 호출, 필드 매핑:
        - category: pattern-digest의 category 그대로
        - severity: pattern-digest의 severity
        - title: pattern-digest의 pattern 요약 (≤120자)
        - source_sprint: 현재 sprint-id
        - source_group: pattern-digest.groups[0] (최초 관측 그룹)
        - description: pattern-digest의 pattern 필드
        - detection: 이번 스프린트에서 해당 패턴이 어떻게 드러났는지 서술 (≥10자)
        - prevention: pattern-digest의 systemic_fix → 예방 문장 (≥10자)
        - contract_clause: systemic_fix에서 Contract 조항 도출 (≥10자; 불명확하면 minimum description)
        (스킬이 다음 ID 자동 채번 + 스키마 검증 + commit/push)
3. prototypes/quality-report.yaml 읽기 (존재 시)
4. fabrication_risk: medium 항목은 동일 절차로 `category: design_proto` 또는
   `design_spec`으로 기록 (별도 저장소 없음 — axis-1 `learning/patterns/` 공통)
```

> **주의**: standalone KB에는 별도의 패턴 인덱스 README가 없다. 매칭은 `zzem-kb:read`
> 결과를 직접 Read하여 수행한다. `groups` 배열 필드는 current pattern 스키마에 존재하지
> 않으므로(schemas/learning/pattern.schema.json 참조) 누적하지 않는다. 반복 관측은
> `frequency` 카운터로만 표현한다.

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
1. 활성 rubric 확인: `zzem-kb:read type=rubric status=active` (최신 v(N) 경로만 — 내용 읽기는 step 2의 스킬이 처리)
2. **Promotion Log 행 추가 (skill):**
   `zzem-kb:promote-rubric source_sprint=<현재-sprint-id> source_pattern=<pattern-id> clause_id=C<다음번호> clause_title="<짧은 제목>"`
   (스킬이 행 추가 + `validate:content` + rebase-retry push + 누적 카운트 nudge 자동 처리)
3. 스킬 nudge 결과에 따라 분기:
   - **누적 `< 2`**: 추가만 수행. clause는 본문에 미반영, 다음 스프린트부터 신규 패턴이면 우선 평가.
   - **누적 `>= 2`**: v(N+1) 파일 신규 생성 (**현재는 manual direct op** — 아래 주의 참조).
     `$ZZEM_KB_PATH/learning/rubrics/v{N+1}.md` 작성:
     - 프런트매터: `version: N+1`, `status: active`, `superseded_by: null`, `schema_version: 1`
     - Body: v(N) 모든 clause + 누적 Promotion Log의 clause를 Clauses 섹션으로 본문화
     - Promotion Log: 베이스라인 행만 남긴 빈 표
     - v(N) 파일 frontmatter를 `status: superseded` + `superseded_by: N+1`로 갱신
     - `cd $ZZEM_KB_PATH && git add learning/rubrics/ && git commit -m "rubric: bump to vN+1 ({sprint-id})" && git pull --rebase origin main && git push`
4. 사용자 nudge:
   ```
   Rubric: v{N} 유지 (promotion log {N}건 누적) | v{N+1} 생성 (clause {N}건 본문화)
   ```

**Effect**: 다음 스프린트 Phase 4.4에서 Evaluator가 자동으로 최신 vN 로드 → 누적된 평가 기준 적용.

> **주의 (rubric version bump는 skill 미제공)**: `zzem-kb:promote-rubric`은 Promotion Log 행
> 추가까지만 커버한다(`clause_title` 짧은 텍스트만 기록). v(N) → v(N+1) 승격은 clause 본문
> 전체가 필요해 아직 스킬이 없으며, 위 step 3의 누적 `>= 2` 분기에서 direct git op로 수행한다.
> 향후 `zzem-kb:bump-rubric`(clauses array 입력으로 본문 migration 수행) 추가 검토. direct op
> 수행 시 rebase-retry 필수.

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
2. 직전 스프린트(같은 도메인)의 reflection 확인: `zzem-kb:read type=reflection domain=<도메인> limit=1`
   (존재하면 3번 단계의 반영도 라인을 위해 Read 결과 보관)
3. `zzem-kb:write-reflection` 호출 (스키마: `$ZZEM_KB_PATH/schemas/learning/reflection.schema.json`):
   - `sprint_id`: 현재 sprint-id
   - `domain`: `ai-webtoon | free-tab | ugc-platform | infra` 중 하나 (enum; 스키마 강제)
   - `completed_at`: 현재 ISO 8601 with offset
   - `outcome`: `pass | fail | partial` — gap-analysis의 fulfillment_rate 기반
     (`= 1.0` → pass / `>= 0.7` → partial / `< 0.7` → fail 기준 적용. 팀 컨벤션 확인 권장)
   - `related_patterns`: 이번 스프린트에서 write/update한 pattern id 배열
   - `body` (≤ 400단어, 마크다운):
     - **What worked**: PASS 그룹의 성공 요인 2~3개 (재사용 가능 형태)
     - **What failed (with root cause)**: ISSUES/FAIL 항목의 1줄 trace + root_cause
     - **Lesson (next-sprint actionable)**: 다음 스프린트 Phase 2/4에 반영할 구체 지침
     - **Pointers**: pattern-digest, gap-analysis, KB pattern id 참조
     - (step 2에서 직전 reflection이 있었다면) 마지막 1줄:
       `> 직전 lesson 반영도: {fully | partially | not} — {간단 평가}`
   (스킬이 스키마 검증 + rebase-retry push 자동 처리)

**출력 갱신** (Phase 6 Output 블록):
```
  Promotions:
    Rubric: {v(N) 유지 | v(N+1) 생성, clause {K}개 본문화}
    Skill candidates: {N} (placeholder)
    Rule promotions: {N}
    Reflection: $ZZEM_KB_PATH/learning/reflections/{sprint-id}.md
```

## Cleanup (optional, 사용자 수동 실행)

Sprint가 완전히 종료되고 모든 PR이 머지된 후, worktree와 sprint 브랜치를 정리한다. **자동 실행되지 않는다** — 사용자가 PR 머지 완료를 확인한 뒤 직접 실행.

```bash
./scripts/cleanup-sprint.sh --config sprint-orchestrator/sprints/{sprint-id}/sprint-config.yaml --delete-branch
```

- `repositories` map을 loop하여 각 role 디렉토리(worktree/symlink) 제거.
- `--delete-branch` 지정 시 머지된 `{branch_prefix}/{sprint-id}` 브랜치도 source repo에서 삭제 (fast-forward 확인만 통과하는 `git branch -d` 사용).

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
