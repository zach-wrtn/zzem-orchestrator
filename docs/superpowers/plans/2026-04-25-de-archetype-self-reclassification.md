# Design Engineer — Archetype Self-Reclassification Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** task spec 의 archetype hint (Sprint Lead 가 미리 채워둔) 와 DE 분석 결과 (실 UI 패턴) 가 다를 때 DE 가 자가 재분류 가능함을 명시 + 재분류 사유를 quality-report 에 기록하는 표준 프로토콜을 도입. app-019 (detail→feed) 사례에서 DE 가 묵시적으로 재분류했지만 룰 부재로 임의 결정처럼 보였던 갭을 메운다.

**Architecture:** 1 Phase, 단일 파일 변경. design-engineer.md Step B.1.1 본문에 재분류 룰 + Activity Logging 행 추가 + quality-report.yaml 스키마에 `archetype_reclassified` 블록 명시. 신규 코드 없음.

**Tech Stack:** Markdown only.

---

## Background — v2 Dogfood Finding

`ugc-platform-integration-qa-2` Phase 3 dogfood (2026-04-25, 23 화면) Batch 3 에서 **app-019** 발생:

- task spec 의 `archetype_hint: detail` (Sprint Lead 가 PRD 만 보고 추정)
- DE 가 Frozen Snapshot 분석 후 실제 UI 가 refresh + toast variant 가 강한 feed 패턴임을 확인
- DE 가 자가 재분류 → `feed` 적용 → 강제 룰 4/4 통과
- quality-report 에 `archetype_classified: feed (대안 검토: detail)` 만 기록 — 재분류 사유 부재

문제: 다음 sprint 에서 DE 가 동일 패턴 (task hint vs actual 차이) 발견 시:
- 재분류 가능한지 명시적 룰 부재 → DE 가 hint 유지 (잘못 적용) 또는 임의 재분류
- 재분류 시 Sprint Lead 가 사유 추적 불가 (회고 어려움)
- 사용자 신뢰 저하 ("왜 task spec 이 detail 인데 결과는 feed 인가?")

**Pass 6 결과**: app-019 통과 (Pass 6 9/9). 단, 재분류 메커니즘 표준화 필요.

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/teammates/design-engineer.md` | Modify | Step B.1.1 재분류 룰 + Activity Logging 행 + quality-report 스키마 |

---

## Phase 1 — Self-Reclassification Protocol

### Task 1.1: design-engineer.md Step B.1.1 재분류 룰 추가

**Files:**
- Modify: `.claude/teammates/design-engineer.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "B.1.1 Archetype 분류\|archetype_classified" .claude/teammates/design-engineer.md`
Expected: 3+ 줄 매치 (헤더 + 본문 + Activity Logging).

- [ ] **Step 2: 분류 흐름에 재분류 단계 추가**

`### B.1.1 Archetype 분류 (필수)` > `**분류 흐름**:` 의 4번 항목 직후 (또는 nav_list disambiguation 직전) 에 다음 5번 항목 추가:

```markdown
5. **재분류 룰** (task spec hint vs DE 분석 차이):

   task description 또는 spec 에 `archetype_hint: {x}` 가 있고 DE 분석 결과 다른 archetype 이 더 적합하다고 판단되면 **DE 가 자가 재분류 가능**. 단:

   - 재분류 사유를 `quality-report.yaml > archetype_reclassified` 블록에 기록 (아래 스키마)
   - Activity Logging 에 `archetype_reclassified` 발사 (Sprint Lead 가 자동 인지)
   - 재분류 결과가 **두 단계 이상 차이** (예: feed → modal) 또는 **PRD 범위 의심** 시 재분류 적용 전 Sprint Lead 질의 필수 (default 자가 재분류 금지)

   **`archetype_reclassified` 스키마**:

   ```yaml
   archetype_reclassified:
     screen: "{ScreenName}"
     hint: "{원래 hint, 예: detail}"
     applied: "{재분류 결과, 예: feed}"
     reason: "{1-2 문장 — Frozen Snapshot 의 어떤 신호가 재분류 근거인지}"
     evidence:
       - "{spec yaml 또는 Figma 의 구체 항목 인용 1}"
       - "{인용 2}"
     escalated: false  # 두 단계 이상 차이 또는 PRD 범위 의심 시 true (Sprint Lead 결정 대기)
   ```

   **자가 재분류 허용 매트릭스**:

   | hint → applied | 자가 재분류 | 사유 |
   |---------------|------------|------|
   | feed ↔ nav_list | OK | 동질 list 모양에서 의도 (소비 vs 이동) 만 다름 |
   | detail ↔ feed | OK | 단일 vs 다수 객체 — Snapshot 보면 명확 |
   | form ↔ nav_list | OK | instant_save 토글 vs navigation row 혼동 흔함 |
   | modal subtype 변경 (dialog↔picker↔action_sheet) | OK | Meta.modal_subtype 만 변경 |
   | 그 외 두 단계 이상 (예: feed → modal, detail → onboarding) | **escalated: true** — Sprint Lead 질의 필수 |
```

- [ ] **Step 3: Activity Logging 표에 신규 행 추가**

`| B.1.1 archetype 모호` 행 직후에 추가:

```markdown
| B.1.1 archetype 재분류 | `archetype_reclassified` | "{ScreenName}: hint={x} → applied={y} (사유: {1줄}, escalated: {bool})" |
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "archetype_reclassified\|재분류" .claude/teammates/design-engineer.md`
Expected: 6 이상.

Run: `grep -n "escalated: true\|escalated: false" .claude/teammates/design-engineer.md`
Expected: 2 매치 (스키마 + 매트릭스).

### Task 1.2: quality-report-template 갱신 (있으면)

**Files:**
- Read first: `sprint-orchestrator/templates/quality-report-template.yaml` (또는 `.md`)
- Modify if exists: 해당 파일

- [ ] **Step 1: 템플릿 존재 확인**

Run: `ls sprint-orchestrator/templates/ | grep -i quality`
Expected: quality-report-template 파일 존재 또는 부재.

- [ ] **Step 2: 존재 시 — `archetype_reclassified` 섹션 추가**

템플릿 yaml 의 적절한 위치 (archetype_classified 또는 anti_slop_audit 근처) 에 다음 추가:

```yaml
# archetype 재분류 (DE 가 task hint 와 다른 archetype 결정 시)
archetype_reclassified:
  applied: false  # true 시 아래 필드 채움
  hint: ""
  applied_archetype: ""
  reason: ""
  evidence: []
  escalated: false
```

- [ ] **Step 3: 부재 시 — 본 plan 범위 확정**

템플릿 파일이 부재하면 본 plan 은 design-engineer.md 변경에 집중. quality-report 스키마는 docs 의 yaml 예시로 유지.

### Task 1.3: Commit

- [ ] **Step 1: commit**

```bash
git add .claude/teammates/design-engineer.md sprint-orchestrator/templates/quality-report-template.yaml 2>/dev/null || git add .claude/teammates/design-engineer.md
git commit -m "$(cat <<'EOF'
docs(de): formalize archetype self-reclassification protocol

ugc-platform-integration-qa-2 dogfood: app-019 had task hint=detail
but DE detected feed pattern from Frozen Snapshot (refresh + toast
variant). Reclassification was implicit and reason untraceable.

- Step B.1.1: new flow item #5 with self-reclassification matrix
  (single-step adjacent OK, 2+ steps escalated to Sprint Lead)
- archetype_reclassified yaml schema (hint/applied/reason/evidence/
  escalated) for quality-report.yaml
- new Activity Logging row archetype_reclassified
- quality-report-template (if present) gains the schema block

EOF
)"
```

---

## Post-Plan Verification

- [ ] **Step 1: 매트릭스 일관성 검증**

Run: `grep -A2 "자가 재분류 허용 매트릭스" .claude/teammates/design-engineer.md`
Expected: 매트릭스 표 출력.

- [ ] **Step 2: 다음 sprint 첫 dogfood 시**

archetype 재분류 케이스가 1건 이상 발생하면:
- DE 가 `archetype_reclassified` 블록 자동 기록
- Activity log 에 `archetype_reclassified` 발사
- escalated: true 시 Sprint Lead 가 질의 → 사용자 결정 → applied 갱신

미통과 시 (DE 가 hint 그대로 적용했는데 fit miss 발생) Step B.1.1 본문 강화.

---

## Open Questions

- [ ] **재분류 빈도 추적**: sprint 당 재분류 건수가 30% 이상이면 task spec 작성 단계 (Sprint Lead) 의 archetype_hint 정확도 개선 필요. 첫 3 sprint 데이터로 결정.
- [ ] **escalated true → false 전환 기준**: Sprint Lead 가 매번 결정하면 마찰. 동일 hint→applied 패턴이 2회 이상이면 자동 OK 화 검토 (precedent — empty-state-prd-copy-conflict-resolution plan 의 메커니즘 재사용).
