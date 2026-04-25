# Design Engineer Eval Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** `sprint-orchestrator/evals/design-engineer-suite.yaml` 회귀 테스트 하니스를 구축하여, `.claude/teammates/design-engineer.md` 또는 `phase-prototype.md` 변경 시 **3-5개 frozen 역사적 PRD** 입력으로 DE 를 재실행하고 spec/HTML 구조 회귀를 자동 측정한다.

PR #29 v2 파이프라인 변경이 누적될 때 "DE 가 갑자기 더 나빠졌다" 를 사전 차단. Pass 6 / Assumption Preview / verify-prototype / Asset Layer 모두 회귀 측정 대상.

**Architecture:** 4 Phase. Phase 1 디렉토리 + 스키마, Phase 2 frozen input fixtures + baseline 산출, Phase 3 score 계산 스크립트, Phase 4 CI 통합 (변경 감지 + 임계값 gate).

**Tech Stack:** YAML (suite config), TypeScript (runner + scorer), Claude Code CLI (`claude` 헤드리스 모드 — DE 재실행), GitHub Actions (CI), 기존 verify-prototype + Pass 6 audit grep 재사용.

---

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `sprint-orchestrator/evals/README.md` | Create | 하니스 사용법 + 비용 경고 |
| 1 | `sprint-orchestrator/evals/design-engineer-suite.yaml` | Create | suite 정의 (frozen inputs + threshold) |
| 1 | `sprint-orchestrator/evals/lib/types.ts` | Create | EvalInput / EvalResult / Metric 타입 |
| 2 | `sprint-orchestrator/evals/inputs/<id>/prd.md` | Create×3-5 | frozen 역사 PRD (snapshot — git 변경 금지) |
| 2 | `sprint-orchestrator/evals/inputs/<id>/frozen-snapshot.md` | Create×3-5 | DE 입력 Snapshot (KB/DESIGN.md 시점 고정) |
| 2 | `sprint-orchestrator/evals/baselines/<id>/screen-spec.yaml` | Create×3-5 | 골든 spec (1차 산출 후 사용자 승인 → freeze) |
| 2 | `sprint-orchestrator/evals/baselines/<id>/prototype.html` | Create×3-5 | 골든 HTML |
| 2 | `sprint-orchestrator/evals/baselines/<id>/quality-report.yaml` | Create×3-5 | 골든 품질 메트릭 |
| 3 | `sprint-orchestrator/evals/scripts/run-de-eval.ts` | Create | DE 재실행 orchestrator (Claude Code CLI 헤드리스 호출) |
| 3 | `sprint-orchestrator/evals/scripts/score.ts` | Create | metric 계산 + threshold 비교 |
| 3 | `sprint-orchestrator/evals/scripts/snapshot-baseline.ts` | Create | 사용자 승인 후 baseline 갱신 도구 |
| 3 | `sprint-orchestrator/evals/tests/score.test.ts` | Create | scorer 단위 테스트 |
| 4 | `.github/workflows/de-eval.yml` | Create | DE 변경 감지 시 eval 자동 실행 |
| 4 | `package.json` (root) | Modify | `pnpm de-eval` 스크립트 |

---

## Phase 1 — 디렉토리 + 스키마

### Task 1.1: README + suite 스키마

**Files:**
- Create: `sprint-orchestrator/evals/README.md`
- Create: `sprint-orchestrator/evals/design-engineer-suite.yaml`
- Create: `sprint-orchestrator/evals/lib/types.ts`

- [ ] **Step 1: README 작성**

`sprint-orchestrator/evals/README.md`:

```markdown
# Sprint Orchestrator Evals

DE / sprint pipeline 변경 회귀 테스트 하니스.

## 비용 경고

- 1회 eval = N개 frozen input × 1 DE 풀 실행 (Pass 1-6 + Asset + Preview)
- 토큰 소비 ≈ 30k-80k per input (Opus). 4개 input = 120k-320k tokens
- CI 자동 실행은 변경 감지 시 1일 최대 3회로 제한 (de-eval.yml 의 cooldown)
- 로컬 실행은 `pnpm de-eval --inputs=<id>` 로 단일 input 만 (개발 중 빠른 피드백)

## 실행

```bash
# 전체 suite
pnpm de-eval

# 단일 input
pnpm de-eval --inputs=ugc-001-home

# baseline 갱신 (사용자 승인 후)
pnpm de-eval:snapshot --inputs=ugc-001-home
```

## 통과 기준

- regression_score (가중 평균) ≥ 0.85 → PASS
- 임계값 미만 → FAIL + 회귀 항목 nudge

## Frozen Inputs 룰

- inputs/ 하위는 절대 변경 금지 (변경 시 baseline 도 같이 변경되므로 회귀 의미 상실)
- 신규 input 추가는 별 PR
- 기존 input 폐기는 별 PR + 사유 명시
```

- [ ] **Step 2: suite YAML 스키마 작성**

`sprint-orchestrator/evals/design-engineer-suite.yaml`:

```yaml
# Design Engineer Eval Suite v1
schema_version: "1.0"

# 가중 평균 통과 기준
threshold:
  regression_score: 0.85
  per_metric_floor: 0.70   # 단일 metric 이라도 이 값 미만이면 FAIL

# 측정 metric (각각 0.0-1.0)
metrics:
  token_compliance:
    weight: 0.25
    description: "CSS rule 중 var(--*) 사용 비율 (raw hex 페널티)"
    extractor: "grep + ratio"
  anti_slop_pass_rate:
    weight: 0.20
    description: "Pass 6 audit 통과한 체크 / 전체 체크"
    extractor: "quality-report.yaml.anti_slop_audit"
  spec_completeness:
    weight: 0.15
    description: "screen-spec.yaml 필수 섹션 채움 비율"
    extractor: "yaml section presence"
  verify_prototype_pass:
    weight: 0.20
    description: "verify-prototype clickErrors 0 + status pass"
    extractor: "verify-prototype.ts result"
  archetype_persona_compliance:
    weight: 0.10
    description: "archetype persona 강제 룰 통과 (해당 시)"
    extractor: "quality-report.yaml.archetype_persona_passed"
  file_size_drift:
    weight: 0.10
    description: "HTML 바이트 크기 / baseline 비율 (1.0 이상이면 페널티)"
    extractor: "fs.stat byte ratio"

# Frozen inputs
inputs:
  - id: "ugc-001-home"
    description: "UGC platform Home feed (정적 archetype: feed)"
    expected_archetype: feed
  - id: "ugc-001-detail"
    description: "UGC platform 게시물 상세 (archetype: detail)"
    expected_archetype: detail
  - id: "free-tab-app-001-home"
    description: "Free tab 홈 (archetype: feed, fabrication_risk: medium)"
    expected_archetype: feed
  - id: "ai-webtoon-onboarding"
    description: "AI webtoon onboarding 첫 step (archetype: onboarding)"
    expected_archetype: onboarding

# CI 동작
ci:
  trigger_paths:
    - ".claude/teammates/design-engineer.md"
    - ".claude/teammates/design-engineer-archetypes/**"
    - ".claude/skills/sprint/phase-prototype.md"
    - "sprint-orchestrator/templates/**"
  cooldown_per_day: 3
  fail_blocks_merge: true
```

- [ ] **Step 3: TS 타입 작성**

`sprint-orchestrator/evals/lib/types.ts`:

```typescript
export interface MetricSpec {
  weight: number;
  description: string;
  extractor: string;
}

export interface EvalSuite {
  schema_version: '1.0';
  threshold: {
    regression_score: number;
    per_metric_floor: number;
  };
  metrics: Record<string, MetricSpec>;
  inputs: EvalInput[];
  ci: {
    trigger_paths: string[];
    cooldown_per_day: number;
    fail_blocks_merge: boolean;
  };
}

export interface EvalInput {
  id: string;
  description: string;
  expected_archetype?: string;
}

export interface MetricScore {
  name: string;
  value: number;          // 0-1
  weight: number;
  baseline_value: number;
  delta: number;          // value - baseline_value
}

export interface EvalResult {
  input_id: string;
  metrics: MetricScore[];
  regression_score: number;
  status: 'pass' | 'fail';
  failures: string[];     // metric names below floor
  duration_ms: number;
  artifacts: {
    spec_path: string;
    html_path: string;
    quality_report_path: string;
  };
}

export interface EvalSuiteResult {
  suite_id: string;
  generated_at: string;
  inputs: EvalResult[];
  overall_status: 'pass' | 'fail';
  summary: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add sprint-orchestrator/evals/README.md sprint-orchestrator/evals/design-engineer-suite.yaml sprint-orchestrator/evals/lib/types.ts
git commit -m "feat(evals): add DE eval suite scaffold

YAML suite config with 6 weighted metrics + 4 frozen input slots.
TS types for MetricScore/EvalResult. README with cost warnings and
frozen-input rules."
```

---

## Phase 2 — Frozen Inputs + Baselines

### Task 2.1: 4개 input fixture 추출

**Files:**
- Create: `sprint-orchestrator/evals/inputs/<id>/{prd.md, frozen-snapshot.md}` ×4

- [ ] **Step 1: 후보 input 식별**

다음 4개 sprint 의 통과한 task 1개씩 선정:
- `ugc-platform-001` 의 Home feed task (archetype: feed)
- `ugc-platform-001` 의 게시물 상세 task (archetype: detail)
- `free-tab-diversification` 의 app-001 Home (medium fabrication_risk)
- `ai-webtoon` 의 onboarding 첫 step

각 task 의 PRD 발췌본 + Frozen Snapshot (KB / DESIGN.md / tokens / archetype persona / exemplars 포함) 을 시점 고정하여 frozen 디렉토리로 복사.

- [ ] **Step 2: 각 input 디렉토리 생성**

```
sprint-orchestrator/evals/inputs/
├── ugc-001-home/
│   ├── prd.md                    # 해당 화면 PRD 발췌
│   ├── frozen-snapshot.md        # DE 가 받을 Snapshot (그 시점 KB/DESIGN.md 인라인 완료본)
│   └── meta.yaml                  # source_sprint, source_task, captured_at
├── ugc-001-detail/
├── free-tab-app-001-home/
└── ai-webtoon-onboarding/
```

`meta.yaml` 표준:
```yaml
source_sprint: "ugc-platform-001"
source_task: "app-001"
source_screen: "Home"
captured_at: "2026-04-25T00:00:00Z"
captured_by: "zach@wrtn.io"
notes: "통과한 마지막 baseline. DESIGN.md v1.2 / tokens v3.0 시점."
```

- [ ] **Step 3: 변경 금지 가드 추가**

`.gitattributes` 에 추가:
```
sprint-orchestrator/evals/inputs/** linguist-vendored=true
```

REVIEW 단계에서 inputs/ 변경 PR 은 차단 — `.github/CODEOWNERS` 또는 PR review label 로 강제 검토.

- [ ] **Step 4: Commit**

```bash
git add sprint-orchestrator/evals/inputs/
git commit -m "feat(evals): add 4 frozen historical inputs

ugc-001-home/detail, free-tab-app-001-home, ai-webtoon-onboarding.
Each input includes PRD excerpt + DE Frozen Snapshot + meta.yaml.
inputs/ marked vendored — changes require explicit PR review."
```

### Task 2.2: 각 input baseline 산출 + freeze

**Files:**
- Create: `sprint-orchestrator/evals/baselines/<id>/{screen-spec.yaml, prototype.html, quality-report.yaml}` ×4

- [ ] **Step 1: 각 input 1회 DE 실행**

본 plan 의 Phase 3 `run-de-eval.ts` 가 완성된 후 (또는 임시로 수동 실행):

```bash
pnpm de-eval --inputs=ugc-001-home --no-compare
```

→ 출력물 (spec/html/report) 을 `baselines/ugc-001-home/` 으로 복사 + 사용자 검수

- [ ] **Step 2: 사용자 검수 후 baseline freeze**

각 baseline 에 대해 사용자가 "이 산출이 합격선" 임을 확인한 뒤 commit.

- [ ] **Step 3: baseline meta 추가**

`baselines/<id>/meta.yaml`:
```yaml
frozen_at: "2026-04-25T00:00:00Z"
frozen_by: "zach@wrtn.io"
de_version_hash: "{git rev of .claude/teammates/design-engineer.md at freeze time}"
phase_prototype_hash: "{git rev of .claude/skills/sprint/phase-prototype.md}"
notes: "1차 baseline. 이후 DE 변경의 회귀 측정 기준."
```

- [ ] **Step 4: Commit**

```bash
git add sprint-orchestrator/evals/baselines/
git commit -m "feat(evals): freeze 4 baselines

First-cut baselines from current DE/phase-prototype state.
de_version_hash recorded for drift accounting."
```

---

## Phase 3 — Runner + Scorer

### Task 3.1: `score.ts` 스코어 계산

**Files:**
- Create: `sprint-orchestrator/evals/scripts/score.ts`
- Create: `sprint-orchestrator/evals/tests/score.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 (TDD)**

`tests/score.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { scoreInput } from '../scripts/score.js';

describe('scoreInput', () => {
  it('returns 1.0 when artifacts exactly match baseline', async () => {
    const result = await scoreInput({
      inputId: 'fixture-identical',
      currentDir: '/tmp/eval-fixture/current',
      baselineDir: '/tmp/eval-fixture/baseline-identical',
    });
    expect(result.regression_score).toBeGreaterThanOrEqual(0.99);
    expect(result.status).toBe('pass');
  });

  it('fails when token_compliance drops below per_metric_floor', async () => {
    const result = await scoreInput({
      inputId: 'fixture-raw-hex',
      currentDir: '/tmp/eval-fixture/current-raw-hex',
      baselineDir: '/tmp/eval-fixture/baseline-identical',
    });
    expect(result.status).toBe('fail');
    expect(result.failures).toContain('token_compliance');
  });
});
```

(고정 fixture 디렉토리는 setup 에서 생성)

- [ ] **Step 2: scorer 구현**

`scripts/score.ts`:

각 metric extractor 구현:
- `token_compliance`: HTML 의 CSS rule 중 `var(--*)` vs `#[0-9a-f]{6}` 비율
- `anti_slop_pass_rate`: `quality-report.yaml.anti_slop_audit.passed_count / 7` (또는 8 with exemplar drift)
- `spec_completeness`: screen-spec.yaml 의 11개 표준 섹션 중 채워진 비율
- `verify_prototype_pass`: verify-prototype 결과 status === 'pass' && clickErrors.length === 0
- `archetype_persona_compliance`: quality-report 의 persona 통과 (없으면 1.0 으로 통과 간주)
- `file_size_drift`: `min(1.0, baseline_bytes / current_bytes)` (current 가 너무 크면 페널티)

regression_score = Σ (metric.value × metric.weight)

- [ ] **Step 3: 테스트 통과 확인**

Run: `cd sprint-orchestrator/evals && pnpm vitest run tests/score.test.ts`
Expected: 2 PASS.

- [ ] **Step 4: Commit**

```bash
git add sprint-orchestrator/evals/scripts/score.ts sprint-orchestrator/evals/tests/score.test.ts
git commit -m "feat(evals): add scorer with 6 metric extractors + tests

Token compliance / anti-slop pass rate / spec completeness /
verify-prototype / archetype persona / file size drift. Weighted
sum + per-metric floor enforcement."
```

### Task 3.2: `run-de-eval.ts` orchestrator

**Files:**
- Create: `sprint-orchestrator/evals/scripts/run-de-eval.ts`

- [ ] **Step 1: orchestrator 작성**

`pnpm de-eval [--inputs=<id1,id2>] [--no-compare]`

흐름:
1. `design-engineer-suite.yaml` 로드
2. `--inputs` 필터 또는 전체 inputs 순회
3. 각 input:
   a. 임시 디렉토리에 `inputs/<id>/frozen-snapshot.md` + DE prompt 조립
   b. Claude Code CLI 헤드리스 호출:
      ```bash
      claude -p "$(cat .claude/teammates/design-engineer.md)
      
      $(cat sprint-orchestrator/evals/inputs/<id>/frozen-snapshot.md)" \
        --output-format=json \
        --output-dir=/tmp/eval-runs/<id>/<timestamp>
      ```
   c. 산출물 (spec/html/report) 을 `/tmp/eval-runs/<id>/<timestamp>/` 에서 수집
   d. `--no-compare` 가 아니면 `scoreInput()` 호출
4. 전체 EvalSuiteResult 출력 (콘솔 + JSON file)
5. 종료 코드: overall_status === 'fail' 이면 1

**중요**: DE 헤드리스 호출은 토큰 비용 발생 — README 의 비용 경고 참조.

- [ ] **Step 2: package.json 스크립트 추가**

루트 `package.json` (또는 sprint-orchestrator/package.json):
```json
"de-eval": "tsx sprint-orchestrator/evals/scripts/run-de-eval.ts",
"de-eval:snapshot": "tsx sprint-orchestrator/evals/scripts/snapshot-baseline.ts"
```

- [ ] **Step 3: snapshot-baseline.ts 작성**

`pnpm de-eval:snapshot --inputs=<id>` — 가장 최근 eval 결과를 baseline 으로 promote (사용자 승인 후 사용).

흐름:
1. 가장 최근 `/tmp/eval-runs/<id>/<latest>/` 식별
2. `baselines/<id>/` 로 복사 (덮어쓰기 전 git diff 보여주기)
3. `meta.yaml` 의 `frozen_at`, `de_version_hash` 갱신
4. 사용자에게 `git add` 안내

- [ ] **Step 4: 단일 input 로컬 실행 sanity**

Run: `pnpm de-eval --inputs=ugc-001-home --no-compare`
Expected: 토큰 소비 후 산출물이 `/tmp/eval-runs/ugc-001-home/<ts>/` 에 생성.

- [ ] **Step 5: Commit**

```bash
git add sprint-orchestrator/evals/scripts/run-de-eval.ts sprint-orchestrator/evals/scripts/snapshot-baseline.ts package.json
git commit -m "feat(evals): add DE eval runner + baseline snapshot CLIs

run-de-eval invokes Claude Code CLI headless with DE prompt + frozen
snapshot, scores against baseline. snapshot-baseline promotes latest
run to baseline (with user approval flow)."
```

---

## Phase 4 — CI 통합

### Task 4.1: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/de-eval.yml`

- [ ] **Step 1: workflow 작성**

```yaml
name: DE Eval

on:
  pull_request:
    paths:
      - '.claude/teammates/design-engineer.md'
      - '.claude/teammates/design-engineer-archetypes/**'
      - '.claude/skills/sprint/phase-prototype.md'
      - 'sprint-orchestrator/templates/**'
      - 'sprint-orchestrator/evals/scripts/**'

jobs:
  de-eval:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: cd sprint-gallery && pnpm puppeteer browsers install chromium

      - name: Cooldown check
        run: |
          today_runs=$(gh run list --workflow=de-eval.yml --created="$(date -I)" --json conclusion --jq 'length')
          if [ "$today_runs" -ge 3 ]; then
            echo "Cooldown reached (3 runs/day) — skipping"
            exit 0
          fi
        env:
          GH_TOKEN: ${{ github.token }}

      - name: Run DE eval
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: pnpm de-eval --output-json=/tmp/eval-result.json

      - name: Comment PR with results
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const result = JSON.parse(fs.readFileSync('/tmp/eval-result.json', 'utf8'));
            const body = `## DE Eval Result: ${result.overall_status.toUpperCase()}\n\n${result.summary}`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body,
            });

      - name: Fail on regression
        if: failure()
        run: exit 1
```

- [ ] **Step 2: cooldown 정책 검증**

수동 시뮬레이션: 같은 PR 에 3회 푸시 후 4회차가 skip 되는지 확인 (cooldown 로직 sanity).

- [ ] **Step 3: secrets 설정 안내**

GitHub repo settings 에 `ANTHROPIC_API_KEY` 등록 필요. 본 plan PR 머지 전 수동 설정.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/de-eval.yml
git commit -m "ci: add DE eval workflow

Triggers on DE/phase-prototype/templates change. Daily cooldown 3 runs.
Comments PR with regression score + per-metric breakdown. Fails build
on regression below threshold."
```

---

## Post-Plan Verification

- [ ] **Step 1: 로컬 단일 eval 통과**

Run: `pnpm de-eval --inputs=ugc-001-home`
Expected: regression_score ≥ 0.85 (baseline 직후이므로 1.0 근처).

- [ ] **Step 2: 전체 suite 비용 측정**

Run: `pnpm de-eval` (전체)
Expected: 4개 input 완료, 총 토큰 소비 기록 (다음 cooldown 정책 조정 데이터).

- [ ] **Step 3: 인위적 회귀 sanity**

`.claude/teammates/design-engineer.md` 의 Pass 6 audit 표 일부를 일시적으로 주석 처리 → eval 재실행 → `anti_slop_pass_rate` 메트릭이 떨어지고 FAIL 나오는지 확인. 확인 후 원복.

- [ ] **Step 4: CI 첫 실행**

본 plan PR 자체에 `.claude/teammates/design-engineer.md` 변경이 없으면 trigger 안 됨 — 별도 sanity PR 1개로 trigger 확인 (Pass 6 audit 표 trivial 변경).

---

## Open Questions

- [ ] **CI 비용**: 한 번 eval = $X (API 비용). PR 당 평균 trigger 횟수 × 비용 = 월 예산. 첫 1개월 데이터 수집 후 cooldown / input 수 조정.
- [ ] **Baseline 갱신 주기**: DE 가 합법적으로 개선되면 baseline 도 갱신 — 너무 자주 갱신하면 회귀 의미 상실, 너무 느리면 false negative. 권장: 메이저 변경 + 사용자 검수 시에만 (월 1-2회 이내).
- [ ] **Frozen input 수**: 4개로 충분한가? 너무 적으면 cherry-picked 위험. 7-10개로 확장 시 비용 ~2배. archetype 6개 enum 모두 커버하려면 최소 6개 필요.
- [ ] **CI 안정성**: Claude Code CLI 헤드리스 모드의 비결정성 (같은 입력 → 다른 출력 가능). 같은 input 을 N회 돌려서 분산 측정 후 metric 별 변동성 허용 범위 정의.
