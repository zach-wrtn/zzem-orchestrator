# PRD Copy vs Empty State Persona — Conflict Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PRD 의 "UI copy 변경 금지" (NEVER DO) 룰과 empty_state persona 강제 룰 #4 (부정 어조 금지) 가 충돌할 때 표준 해결 프로토콜이 부재하여 화면별 임의 결정이 발생. 룰 우선순위를 명시 + Sprint Lead 의 표준 gate question 을 도입하여 동일 충돌 케이스가 일관되게 처리되도록 한다.

**Architecture:** 2 Phase. Phase 1 — 룰 우선순위 명시 (empty_state.md #4 약화 + DE Step B.1.1 메타 룰 추가). Phase 2 — Sprint Lead gate question 표준화 (phase-prototype.md). 신규 코드 없음.

**Tech Stack:** Markdown only.

---

## Background — v2 Dogfood Finding

`ugc-platform-integration-qa-2` Phase 3 dogfood (2026-04-25, 23 화면) 에서 **app-021 알림센터_노데이터** 케이스에서 충돌 발생:

- **PRD/Figma 카피**: "아직 도착한 알림이 없어요" (수동/부정형)
- **empty_state #4**: "부정 어조 금지 — 행동 유도형으로 변환" 권고. DE 자동 제안 카피: "조용한 하루네요"
- **상위 sprint 룰**: PRD `### NEVER DO` 섹션에 "UI copy 변경 금지" 명시

DE 는 임시로 PRD 카피를 유지하고 quality-report 에 `archetype_recommendation_skipped: empty_state #4 — PRD 카피 우선` 기록. 사용자에게 결정 위임 표시.

문제: 다음 sprint 에서 동일 충돌 (검색 결과 0건, 친구 0명, 차단 0명 등) 이 화면당 1건씩 반복될 가능성. DE/Sprint Lead 가 매번 임의 결정하면 일관성 결여.

**Pass 6 결과**: 통과 (룰 우선순위 명시 후속 필요).

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/teammates/design-engineer-archetypes/empty_state.md` | Modify | #4 행에 PRD 카피 우선 clause 추가 |
| 1 | `.claude/teammates/design-engineer.md` | Modify | Step B.1.1 메타 룰 — 룰 우선순위 표 |
| 2 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2 또는 §3.2.5 에 표준 gate question |

---

## Phase 1 — 룰 우선순위 명시

### Task 1.1: empty_state.md #4 약화 — PRD 카피 우선 clause

**Files:**
- Modify: `.claude/teammates/design-engineer-archetypes/empty_state.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "부정 어조 금지" .claude/teammates/design-engineer-archetypes/empty_state.md`
Expected: 2 줄 매치 (#4 행 + 권장 룰 또는 본문).

- [ ] **Step 2: #4 행 수정 — PRD 우선 clause 추가**

기존 #4 행:
```
| 4 | 부정 어조 금지: "아무것도 없습니다" / "검색 실패" 같은 negative framing 금지 — 행동 유도형으로 변환 | 텍스트 검토: "없다 / 실패 / 못함" 키워드 위주 문장 ≤ 0 |
```

다음으로 변경:
```
| 4 | 부정 어조 회피 (권장 강제) — "아무것도 없습니다" / "검색 실패" 같은 negative framing 은 행동 유도형으로 변환. **단, PRD/Figma 카피가 명시되어 있으면 그 카피를 우선** (PRD `### NEVER DO`: UI copy 변경 금지). 충돌 시 §3.2.5 표준 gate question 으로 Sprint Lead 결정. | DE 가 제안 카피를 quality-report 에 기록 — Sprint Lead/사용자가 PRD 카피 vs DE 카피 중 선택 |
```

- [ ] **Step 3: 신규 섹션 추가 — `## PRD Copy 와의 충돌`**

`## Anti-Patterns` 직전에 다음 섹션 삽입:

```markdown
## PRD Copy 와의 충돌

PRD/Figma 가 부정형 카피 ("아직 X 가 없어요", "검색 실패") 를 명시하고 PRD `### NEVER DO` 에 "UI copy 변경 금지" 가 있을 때:

**우선순위**:

1. **PRD 카피 우선** — DE 는 PRD 카피를 그대로 사용
2. DE 는 동시에 quality-report.yaml 에 다음을 기록:
   ```yaml
   prd_copy_conflict:
     screen: "{ScreenName}"
     prd_copy: "{원문}"
     persona_recommended_copy: "{DE 제안 — empty_state #4 적용 시}"
     resolution: "prd_preserved"  # 또는 persona_applied (Sprint Lead 결정 후)
   ```
3. Sprint Lead 가 §3.2.5 에서 사용자에게 표준 gate question 발사 — 사용자 결정으로 `resolution` 갱신

**예외 (DE 자가 결정 가능)**:

- PRD 카피가 명백한 오타 / 문법 오류 — 수정 후 quality-report 에 `prd_copy_conflict.resolution: typo_fix` 기록
- 그 외 모든 의미적 변경은 Sprint Lead 결정 필요
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "prd_copy_conflict\|PRD 카피 우선" .claude/teammates/design-engineer-archetypes/empty_state.md`
Expected: 3 이상.

### Task 1.2: design-engineer.md 메타 룰 — 룰 우선순위 표

**Files:**
- Modify: `.claude/teammates/design-engineer.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "Persona 룰 적용\|persona 강제 룰" .claude/teammates/design-engineer.md`
Expected: 1+ 줄 매치 (Step C 본문).

- [ ] **Step 2: 룰 우선순위 표 추가**

`**Persona 룰 적용**` 단락 직후에 다음 표 삽입:

```markdown
**룰 우선순위 (충돌 시)**:

| 순위 | 룰 종류 | 사례 |
|------|--------|------|
| 1 | PRD `### NEVER DO` | "UI copy 변경 금지" 명시 시 DE 카피 변경 금지 |
| 2 | Pass 6 Anti-Slop Audit | 보라 그라디언트 금지 등 |
| 3 | DESIGN.md / tokens.css | 토큰 외 raw hex 금지 |
| 4 | Persona 강제 룰 | empty_state #4 부정 어조 금지 등 |
| 5 | Persona 권장 룰 | 트레이드오프 — 거절 시 quality-report 로그 |

충돌 시 상위 룰이 이김. 단, **상위 룰 위반 가능성을 발견한 DE 는 자동으로 Sprint Lead 결정 trigger** (quality-report 에 `rule_conflict` 블록 기록 + activity log).
```

- [ ] **Step 3: Activity Logging 표에 신규 행 추가**

`| C.2.1 archetype persona 거절 권장` 행 직후에 추가:

```markdown
| C.2.1 룰 충돌 발견 | `rule_conflict_detected` | "{rule_a} ({source}) vs {rule_b} ({source}) — Sprint Lead 결정 대기" |
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "rule_conflict\|룰 우선순위" .claude/teammates/design-engineer.md`
Expected: 3 이상.

### Task 1.3: Phase 1 commit

- [ ] **Step 1: commit**

```bash
git add .claude/teammates/design-engineer-archetypes/empty_state.md .claude/teammates/design-engineer.md
git commit -m "$(cat <<'EOF'
docs(persona): formalize PRD copy vs empty_state #4 conflict resolution

ugc-platform-integration-qa-2 dogfood: app-021 (notification center
empty) saw "아직 도착한 알림이 없어요" (PRD/Figma) collide with
empty_state #4 (avoid negative framing, recommended "조용한 하루네요").

- empty_state.md #4: weakened to "권장 강제" with PRD-copy-priority
  clause + new "PRD Copy 와의 충돌" section detailing the
  prd_copy_conflict quality-report block
- design-engineer.md: rule priority table (PRD NEVER DO > Pass 6 >
  DESIGN.md > persona forced > persona recommended) + new activity
  log row rule_conflict_detected

EOF
)"
```

---

## Phase 2 — 표준 Sprint Lead gate question

### Task 2.1: phase-prototype.md §3.2.5 에 표준 gate question 추가

**Files:**
- Modify: `.claude/skills/sprint/phase-prototype.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "3.2.5 Assumption Preview Gate\|Preview Gate" .claude/skills/sprint/phase-prototype.md`
Expected: 1+ 줄 매치.

- [ ] **Step 2: §3.2.5 본문에 룰 충돌 분기 추가**

§3.2.5 본문에서 `**Variants 모드 상호 배타**` 직전 (또는 동급 위치) 에 다음 추가:

```markdown
**룰 충돌 감지 시 (PRD vs Persona 등)**:

DE 가 quality-report 에 `rule_conflict` 또는 `prd_copy_conflict` 블록을 기록한 화면은 본 gate 통과 전에 Sprint Lead 가 사용자에게 다음 표준 질문 발사:

```
[{ScreenName}] 룰 충돌 발견:
- 상위 룰: {rule_a} ({source_a, 예: PRD ### NEVER DO})
- 하위 룰: {rule_b} ({source_b, 예: empty_state persona #4})
- DE 현재 적용: {current — 보통 상위 룰}
- DE 제안 변경: "{원문}" → "{제안 카피}" (적용 안 함)

선택:
A. 현재 유지 (상위 룰 우선) — 변경 없음
B. DE 제안 채택 (상위 룰 한정 면제) — quality-report 에 면제 사유 기록
C. mix — 사용자가 직접 카피 작성

선택 (A/B/C)?
```

사용자 선택을 quality-report 의 `prd_copy_conflict.resolution` (또는 `rule_conflict.resolution`) 에 기록 + 다음 동일 패턴 (검색 0건, 친구 0명 등) 발생 시 동일 결정 자동 적용 검토 (`prd_copy_conflict.precedent: applied_from_{ScreenName}`).
```

- [ ] **Step 3: precedent 누적 메커니즘 노트 추가**

위 블록 끝에 다음 한 단락 추가:

```markdown
**Precedent 누적**: 동일 sprint 내 동일 룰 충돌 패턴이 2회 이상 발생 시 Sprint Lead 가 첫 결정을 sprint-config.yaml 에 `rule_conflict_precedents` 로 기록 → 이후 동일 패턴 자동 적용 + 사용자 알림. 다른 sprint 로 이전은 retrospective 결정 (수동 carry-over).
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "rule_conflict\|prd_copy_conflict\|룰 충돌" .claude/skills/sprint/phase-prototype.md`
Expected: 5 이상.

### Task 2.2: Phase 2 commit

- [ ] **Step 1: commit**

```bash
git add .claude/skills/sprint/phase-prototype.md
git commit -m "$(cat <<'EOF'
feat(phase-prototype): standard gate question for PRD vs persona conflict

§3.2.5 augmented with rule-conflict branch: when DE logs
rule_conflict or prd_copy_conflict, Sprint Lead presents 3-choice
prompt (A keep PRD / B apply persona / C user-mix) before allowing
prototype to proceed.

- precedent accumulation: 2nd same-pattern conflict in same sprint
  triggers sprint-config.yaml > rule_conflict_precedents auto-apply
- cross-sprint carry-over is manual (retrospective decision)

EOF
)"
```

---

## Post-Plan Verification

- [ ] **Step 1: 전체 일관성 검증**

Run: `grep -rn "rule_conflict\|prd_copy_conflict" .claude/teammates/ .claude/skills/sprint/`
Expected: 7+ 매치 (empty_state.md ×3, design-engineer.md ×3, phase-prototype.md ×5).

- [ ] **Step 2: 다음 sprint 첫 dogfood 시**

empty_state 또는 form 화면에서 PRD 부정형 카피 발견 시:
- DE 가 자동으로 quality-report `prd_copy_conflict` 블록 기록
- Sprint Lead 가 표준 질문 발사
- 사용자 결정 후 동일 패턴 자동 적용 (precedent)

처음 결정 → 동일 패턴 2회 자동 적용 → 모두 일관 처리 확인.

---

## Open Questions

- [ ] **옵션 A vs B vs C 비율 추적**: 사용자가 거의 항상 같은 답을 한다면 default 결정으로 승격 (gate 자체 스킵 + 로그만). 첫 5 sprint 데이터로 결정.
- [ ] **PRD `### NEVER DO` 의 다른 항목**: "UI copy 변경 금지" 외에 어떤 NEVER DO 가 persona 와 충돌 가능한지 사전 매핑. 첫 dogfood 사례 누적 후 wiki 화 검토.
- [ ] **자동 사용자 결정 적용 위험**: precedent 가 다른 화면에 잘못 적용될 가능성 (검색 0건 vs 친구 0건은 의미 다름). 첫 사례에서 정확도 검증.
