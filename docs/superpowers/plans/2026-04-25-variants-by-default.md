# Variants-by-Default Mode (Conditional) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `fabrication_risk: medium` 트리거 시 단일 Design Engineer 산출 대신 **3개 DE 인스턴스를 병렬 스폰**하여 서로 다른 디자인 변형을 동시 생성하고, Sprint Lead가 사용자에게 1개를 고르게 한 뒤 미선택 2개는 archive 한다. PR #29 머지된 v2 파이프라인의 Assumption Preview Gate(§3.2.5)와 상호 배타 — variants 모드가 활성화되면 preview gate는 스킵되고 비교 gate가 그 자리를 차지한다.

**Architecture:** 3 Phase 독립 커밋. Phase 1·3은 워크플로우 분기 (`.claude/skills/sprint/phase-prototype.md`), Phase 2는 DE 측 variant 디렉티브 수신 (`.claude/teammates/design-engineer.md`). 신규 코드 없음 — 프로토콜 변경 + 1개 신규 템플릿(variant-comparison).

**Tech Stack:** Markdown(프로토콜), 기존 TaskCreate 병렬 스폰 메커니즘(superpowers:dispatching-parallel-agents).

---

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2 Step 2에 variant-spawn 분기 추가 (3개 TaskCreate 병렬) |
| 1 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2.5 Preview Gate에 "variants 모드 시 스킵" 조건 |
| 2 | `.claude/teammates/design-engineer.md` | Modify | Step A.0/B.1 에 `variant_directive` 입력 수신 + Step C에 directive 반영 |
| 3 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2.6 신규 — Variant Comparison Gate (사용자 1택) |
| 3 | `sprint-orchestrator/templates/variant-comparison-template.md` | Create | 비교 gate 사용자 제시 포맷 + archive 메타데이터 |

---

## Phase 1 — Variant Spawn Branch (Trigger + 3-Way TaskCreate)

`fabrication_risk: medium` 또는 사용자 명시 (`variants_required: true`) 트리거 시 phase-prototype.md §3.2 Step 2에서 1개 대신 3개 TaskCreate를 병렬 발행.

### Task 1.1: §3.2 트리거 감지 + 3-way 스폰 분기 추가

**Files:**
- Modify: `.claude/skills/sprint/phase-prototype.md` (§3.2 Step 2 TaskCreate 직전)

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "Step 2: 태스크 생성" .claude/skills/sprint/phase-prototype.md`
Expected: 한 줄 매치. 매치 0이면 STOP — 파일 구조 변경됨.

- [ ] **Step 2: §3.2 Step 2 분기 추가**

`.claude/skills/sprint/phase-prototype.md`의 §3.2 "Step 2: 태스크 생성" 시작부에 다음 분기 블록 삽입 (기존 단일 TaskCreate 코드 앞):

```markdown
**Variant 트리거 평가** (Step 2 진입 시 최초 1회):

다음 조건 중 하나라도 만족하면 **variants 모드** — 1개가 아닌 3개 TaskCreate 병렬 발행:

- 태스크의 `quality_score.fabrication_risk` == `medium`
- 태스크 Description에 `variants_required: true`
- 사용자가 본 화면 시작 직전에 "여러 안 보고 싶다" 명시

미충족 시 단일 모드 — 기존 흐름 유지.

**Variants 모드 흐름**:

1. 동일 Frozen Snapshot 입력으로 3개 TaskCreate를 병렬 발행 (superpowers:dispatching-parallel-agents 적용)
2. 각 TaskCreate Description 끝에 다음 추가:
   ```
   variant_id: A | B | C
   variant_directive: "{persona-1줄: 보수 / 표현 / 미니멀 등}"
   shared_inputs: 동일 Frozen Snapshot — 임의 추가 컨텍스트 금지
   ```
3. 3개 variant 디렉티브 (고정):
   - **A — Conservative**: PRD/패턴 기본형 충실. 새 컴포넌트 도입 금지. 안전 선택만.
   - **B — Expressive**: 시각 위계 강조 (대형 hero, 컬러 contrast, motion 힌트). DESIGN.md §3 표현형 토큰 적극 사용.
   - **C — Minimal**: 정보 밀도 최저. 여백 최대. CTA 1-2개로 축소.
4. 3개 모두 Step C(HTML 생성) 완료 시 §3.2.6 Comparison Gate로 진행
5. **Adjust loop 상한**: 3개 variant 모두 완료까지 1회 — Sprint Lead가 변형을 변경하고 싶으면 비교 gate에서 stop 후 재시작

**Auto-Skip 조건** (variants 모드 비활성):
- `sprint-config.yaml` 에 `variants_mode: disabled` → 전역 비활성 (기본값은 conditional)
- 태스크 Description에 `variants_disabled: true` → 단일 모드 강제

**Logging**: Sprint Lead는 다음을 `logs/events.jsonl` 에 append:
- `{"phase":"variants_spawned","screen":"{ScreenName}","variants":["A","B","C"],"trigger":"fabrication_risk_medium"}`
```

- [ ] **Step 3: §3.2.5 Preview Gate에 variants 우선 분기 추가**

`.claude/skills/sprint/phase-prototype.md`의 "### 3.2.5 Assumption Preview Gate" 섹션 본문 첫 줄 직후에 삽입:

```markdown
**Variants 모드 상호 배타**: 본 태스크가 §3.2 Step 2에서 variants 모드로 분기되었다면 **이 gate를 스킵**한다 (이유: 3개 variant가 곧 비교됨 — 사전 가정 검증보다 사후 비교가 더 강력). 로그에 `phase: preview_skipped, reason: variants_mode` 기록.
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -n "Variant 트리거 평가\|variants_mode\|variant_directive" .claude/skills/sprint/phase-prototype.md`
Expected: 최소 4줄 매치 (분기 블록 + Auto-Skip + Logging + Preview Gate 상호 배타).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sprint/phase-prototype.md
git commit -m "feat(phase-prototype): add variants-mode 3-way spawn branch

Triggers on fabrication_risk: medium or explicit variants_required.
Spawns 3 DE TaskCreates in parallel with fixed personas
(Conservative/Expressive/Minimal) sharing identical Frozen Snapshot.
Mutually exclusive with §3.2.5 Assumption Preview Gate."
```

---

## Phase 2 — DE Variant Directive Reception

DE가 `variant_directive` 를 수신했을 때 Step A.5 Asset Layer 와 Step C HTML 생성에서 디렉티브를 어떻게 반영하는지 정의.

### Task 2.1: design-engineer.md Step A.0 에 variant_directive 수신 룰 추가

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (Step A.0 직후, A.1 직전)

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "^### A.0 DESIGN.md 선행 읽기" .claude/teammates/design-engineer.md`
Expected: 한 줄 매치.

- [ ] **Step 2: A.0.1 Variant Directive 섹션 추가**

A.0 종료 직후, A.1 시작 전에 삽입:

```markdown
### A.0.1 Variant Directive 수신 (조건부)

태스크 Description에 `variant_directive` 가 있는 경우 본 DE는 **variants 모드 인스턴스** — 동일 Frozen Snapshot으로 평행 인스턴스 2개가 동시 실행 중이다. 다음 룰을 준수:

| variant_id | directive | 강제 룰 |
|-----------|-----------|--------|
| A — Conservative | 패턴 기본형 충실 | 새 컴포넌트 도입 금지. tokens.css 정의 토큰 외 사용 금지. layout-spec 의 "기본" 옵션만 채택. |
| B — Expressive | 시각 위계 강조 | DESIGN.md §3의 표현형 토큰 (hero typography, accent colors) 적극 사용. motion 힌트 (`transition:` CSS) 허용. 단, Pass 6 #5 보라 그라디언트 룰은 여전히 적용. |
| C — Minimal | 정보 밀도 최저 | spacing 토큰 한 단계 큰 값 우선 (`--spacing-16` 대신 `--spacing-24` 등). CTA 1-2개로 축소 — 화면당 primary action 최대 1개. |

**공유 제약** (3개 variant 모두 동일):
- 동일 Frozen Snapshot — KB·DESIGN.md·tokens.css 동일 입력
- 동일 Pass 6 Anti-Slop Audit (C.2.1)
- 동일 Asset Layer 룰 (A.5)
- 임의 추가 패턴 인용 금지 — variants 간 비교 가능성을 위해 입력 동일성 유지

**저장 경로 변경**:
기존: `sprints/{sprint-id}/prototypes/app/{task-id}/prototype.html`
Variants: `sprints/{sprint-id}/prototypes/app/{task-id}/variants/{variant_id}/prototype.html` + 동일 패턴으로 spec/intent/quality-report 도 분리 저장.

**완료 보고** (Activity Logging):
| variant_id | activity | message |
|-----------|----------|---------|
| A/B/C | `variant_complete` | "Variant {id} ({directive 1단어}) 완료 — Sprint Lead 비교 대기" |
```

- [ ] **Step 3: Step C HTML 생성 룰에 variant 분기 노트 추가**

`.claude/teammates/design-engineer.md`의 "### C.4 HTML 생성 규칙" 섹션 끝에 다음 한 단락 추가:

```markdown
**Variants 모드 추가 룰**: `variant_directive` 가 있을 때 C.4의 모든 룰은 적용되되, A.0.1의 variant 강제 룰을 **상위 우선순위**로 둔다 — 충돌 시 variant 룰이 이긴다 (예: A는 새 컴포넌트 금지, C는 spacing 1단계 증가).
```

- [ ] **Step 4: Activity Logging 표에 variant_complete 행 추가**

"## Activity Logging" 표에서 `C.2.1 Pass 6 audit 통과` 다음에 추가:

```markdown
| C. Variant 완료 | `variant_complete` | "Variant {A|B|C} ({directive}) 완료 — comparison gate 대기" |
```

- [ ] **Step 5: 정합성 검증**

Run: `grep -c "variant_directive\|variant_id\|variants 모드" .claude/teammates/design-engineer.md`
Expected: 8 이상.

- [ ] **Step 6: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "docs(de): add A.0.1 variant_directive reception protocol

3 fixed personas (Conservative/Expressive/Minimal) with explicit
forced rules. Variants share inputs but diverge on layout discretion
points. Output path scoped under variants/{A|B|C}/."
```

---

## Phase 3 — Variant Comparison Gate (§3.2.6)

3개 variant 완료 후 사용자에게 1개를 고르게 하고, 미선택 2개는 `variants/_archive/` 로 이동.

### Task 3.1: variant-comparison 템플릿 생성

**Files:**
- Create: `sprint-orchestrator/templates/variant-comparison-template.md`

- [ ] **Step 1: 템플릿 작성**

다음 내용으로 작성:

```markdown
# Variant Comparison: {ScreenName}

> 3개 DE variant 비교 gate. Sprint Lead가 사용자에게 제시.

## Inputs

```yaml
task_id: "{task-id}"
screen_name: "{ScreenName}"
generated_at: "{ISO8601}"
trigger: "{fabrication_risk_medium | variants_required | user_request}"
shared_snapshot_hash: "{hash of Frozen Snapshot — 입력 동일성 증명}"
```

## Variants

```yaml
variants:
  - id: A
    directive: Conservative
    prototype_path: "sprints/{sprint-id}/prototypes/app/{task-id}/variants/A/prototype.html"
    spec_path:      "sprints/{sprint-id}/prototypes/app/{task-id}/variants/A/screen-spec.yaml"
    quality_score:
      anti_slop_audit: passed | partial | failed
      fabrication_risk: none | low | medium
      file_size_bytes: {N}
    diff_highlights:
      - "{한 줄 — 다른 variant 대비 가장 두드러진 차이}"
      - "{또 한 줄}"
  - id: B
    # 동일 구조
  - id: C
    # 동일 구조
```

## Side-by-Side Screenshot

```
sprints/{sprint-id}/prototypes/app/{task-id}/variants/_comparison.png
```
3컷 가로 배열 (A | B | C). capture-screenshots.ts 가 variants 디렉토리 인식 시 자동 합성.

## User Decision

| 선택 | 동작 |
|------|------|
| **A** / **B** / **C** | 선택된 variant를 `prototype.html` (variants 부모 디렉토리)로 promote. 미선택 2개는 `variants/_archive/` 로 이동. |
| **mix** | 사용자가 원하는 부분을 지정 ("A의 헤더 + B의 카드 레이아웃"). DE 새 인스턴스 1개 스폰하여 mix 지시 반영 → 단일 모드로 재생성. |
| **stop** | 3개 모두 부적합. PRD 갭 가능성 — Sprint Lead가 prd-gaps.md 에 갭 추가 + Phase 3.4 Amendment 트리거. |
```

- [ ] **Step 2: 구조 검증**

Run: `grep -c '^```yaml' sprint-orchestrator/templates/variant-comparison-template.md`
Expected: 2 (Inputs + Variants).

- [ ] **Step 3: Commit**

```bash
git add sprint-orchestrator/templates/variant-comparison-template.md
git commit -m "feat(templates): add variant-comparison-template for §3.2.6 gate

Side-by-side comparison doc presented to user when variants mode
spawns 3 DE instances. proceed-with-X / mix / stop actions with
archival of unchosen variants."
```

### Task 3.2: phase-prototype.md §3.2.6 Comparison Gate 섹션 추가

**Files:**
- Modify: `.claude/skills/sprint/phase-prototype.md` (§3.2.5 직후, §3.3 직전)

- [ ] **Step 1: §3.2.6 본문 작성**

§3.2.5 종료 직후 삽입:

```markdown
### 3.2.6 Variant Comparison Gate (variants 모드 전용)

§3.2 Step 2 에서 variants 모드로 분기된 태스크는 3개 variant 완료 후 본 gate를 거친다.

**입력**: `sprints/{sprint-id}/prototypes/app/{task-id}/variants/{A,B,C}/prototype.html` + 각 variant 의 spec/quality-report

**Sprint Lead 동작**:

1. capture-screenshots 가 자동 생성한 `variants/_comparison.png` (3컷 가로) 를 사용자에게 제시
2. `sprint-orchestrator/templates/variant-comparison-template.md` 채워서 `variants/comparison.md` 로 저장
3. 다음 형식으로 사용자에게 요약 (3-5문장):
   ```
   [{ScreenName}] 3개 variant 비교
   - A (Conservative): {diff_highlights[0]}
   - B (Expressive): {diff_highlights[0]}
   - C (Minimal): {diff_highlights[0]}
   _comparison.png 참조. A / B / C / mix / stop?
   ```
4. 사용자 응답 처리:

| 선택 | 동작 |
|------|------|
| **A/B/C** | 선택된 variant를 `prototype.html` (variants 부모 디렉토리)로 promote (file move). 미선택 2개는 `variants/_archive/` 로 이동. approval-status.yaml 에 `chosen_variant: {id}` 기록. §3.3 일반 리뷰로 진행. |
| **mix** | 사용자 지시 ("A의 X + B의 Y") 를 새 단일 모드 TaskCreate Description 에 명시 → 1개 DE 인스턴스 스폰. 기존 3개는 모두 `_archive/` 로. mix 결과는 단일 모드 흐름 (preview gate 활성화 가능). |
| **stop** | 3개 모두 `_archive/` 로 이동. `prd-gaps.md` 에 갭 항목 append (사용자 사유 인용). `TaskUpdate: blocked`. |

**Adjust loop 상한**: variants → mix 1회 → 그 결과 unsatisfactory 시 stop. mix 후 또 mix 금지 — 무한 루프 방지.

**Logging**:
- `{"phase":"variant_comparison","screen":"{ScreenName}","action":"chose_A|chose_B|chose_C|mix|stop"}`
- mix 선택 시: `{"phase":"variant_mix_spawned","screen":"{ScreenName}","mix_spec":"..."}`
```

- [ ] **Step 2: §3.3 진입 조건 명시**

`.claude/skills/sprint/phase-prototype.md` §3.3 첫 문단에 다음 한 줄 추가:

```markdown
> Variants 모드 태스크는 §3.2.6 Comparison Gate 통과(promote 완료) 후 본 §3.3 진입.
```

- [ ] **Step 3: 정합성 검증**

Run: `grep -n "3.2.6 Variant Comparison Gate" .claude/skills/sprint/phase-prototype.md`
Expected: 한 줄 매치.

Run: `grep -c "chosen_variant\|_archive\|variant_comparison" .claude/skills/sprint/phase-prototype.md`
Expected: 5 이상.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sprint/phase-prototype.md
git commit -m "feat(phase-prototype): add §3.2.6 Variant Comparison Gate

3-up side-by-side presentation, A/B/C/mix/stop actions, archival of
unchosen variants under variants/_archive/. mix path spawns 1 new
single-mode DE incorporating user's combine spec; mix-after-mix
prohibited."
```

### Task 3.3: capture-screenshots variants 합성 지원 확인

**Files:**
- Read-only: `sprint-gallery/scripts/capture-screenshots.ts`
- Modify: 위 스크립트 (변경 필요 시)

- [ ] **Step 1: 현재 스크립트가 variants 디렉토리를 인식하는지 grep**

Run: `grep -n "variants" sprint-gallery/scripts/capture-screenshots.ts`
Expected: 0 매치 (현재 미지원). 1+ 매치면 이미 처리됨 — Step 2 스킵.

- [ ] **Step 2: 합성 로직 추가 (현재 미지원 시)**

`sprint-gallery/scripts/capture-screenshots.ts`에 variants 디렉토리 감지 시:
- A/B/C 각각 viewport 430×985 캡처
- sharp 또는 puppeteer composite 로 가로 3컷 합성 (1290×985)
- `variants/_comparison.png` 저장

세부 코드는 본 plan 외 — 별 PR 분리 검토 (이 plan은 프로토콜 정의에 집중).

- [ ] **Step 3: 본 plan 범위 확정**

이 plan은 **워크플로우 프로토콜 정의**에 집중. capture-screenshots 코드 변경은 별 PR에서 처리하거나, Step 2 적용 시 본 plan에 Phase 4 추가.

---

## Post-Plan Verification

- [ ] **Step 1: 전체 변경 리뷰**

Run: `git log --oneline main..HEAD`
Expected: 5개 전후 커밋 (Phase별 1-3개).

- [ ] **Step 2: 트리거 일관성 확인**

Run: `grep -A2 "fabrication_risk: medium" .claude/skills/sprint/phase-prototype.md .claude/teammates/design-engineer.md`
Expected: variants 모드 진입 조건과 preview gate 트리거가 명확히 분기됨.

- [ ] **Step 3: 첫 dogfood 실행 권고**

본 plan 완료 후 다음 sprint Phase 3에서 variants 모드를 처음 dogfood. medium-risk 화면이 1개 이상이면 자동 트리거. 첫 실측 결과로 Phase 4 (capture-screenshots 합성) 우선순위 결정.

---

## Open Questions

- [ ] **Variant 비용 vs 가치**: DE 1회당 토큰/시간 3배 — medium risk 화면 빈도가 sprint당 50% 이하여야 비용 정당화. 처음 3 sprint dogfood 후 비율 측정.
- [ ] **Persona 직교성**: A/B/C 디렉티브가 실제로 충분히 다른 결과를 만드는가? 첫 dogfood에서 A vs B 결과가 너무 비슷하면 디렉티브를 강화 (B에 "hero 240px 이상 필수" 등 정량 룰 추가).
- [ ] **Mix 의 한계**: 사용자가 "A 헤더 + B 본문" 식으로 정확히 지시할 수 있는가? Mix 사용률 < 30% 면 단순화 검토 (A/B/C/stop 만 유지).
