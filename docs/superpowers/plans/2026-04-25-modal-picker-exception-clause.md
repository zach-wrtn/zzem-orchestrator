# Modal Persona — Picker / Action Sheet Exception Clause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** modal persona 강제 룰 #3 (`Primary CTA 1개 + secondary 0-1개`) 가 picker / action sheet 패턴 (iOS HIG 스타일 — 메뉴 옵션 N개가 모두 동등 행동) 과 양립 불가능. picker 패턴이 spec 에 명시된 modal 에 한해 #3 을 면제 + 신규 권장 룰 (cancel/dismiss 명시) 도입하여 다음 sprint 의 picker 화면이 modal persona 4/4 통과 가능하도록 한다.

**Architecture:** 1 Phase, 단일 파일 변경. modal.md 강제 룰 #3 in-cell 면제 + 신규 권장 룰 1개 + 신규 섹션 (`## 면제 조건 (Picker / Action Sheet)`). 신규 코드 없음.

**Tech Stack:** Markdown only.

---

## Background — v2 Dogfood Finding

`ugc-platform-integration-qa-2` Phase 3 dogfood (2026-04-25, 23 화면) 에서 modal persona 강제 룰 #3 위반이 4건 발생 (모두 동일 패턴):

- **app-005 사진 라이브러리 picker** — 옵션 4개 ("최근/즐겨찾기/앨범별/모든사진") 동등 행동
- **app-009 앨범 picker** — 옵션 5+ 개 (각 앨범 row) 동등 선택
- **app-012 더보기 메뉴** — 옵션 4개 ("저장/공유/신고/숨김") 동등 액션
- **app-015 더보기 메뉴 (변형)** — 옵션 3개 동등

모두 quality-report 에 `archetype_recommendation_skipped: modal #3 — picker pattern` 로그. iOS HIG action sheet 스타일은 본질적으로 N 개 옵션이 동급 — primary 1개 강제는 부적합.

DE 는 sprint_lead_followup 에 다음 보고:

> "modal #3 의 'primary 1개' 룰이 picker/action sheet 와 본질적 충돌. 다음 sprint 에서 동일 패턴 반복 예상 — modal.md 에 picker exception clause 추가 권장."

**Pass 6 결과**: 4건 모두 통과 (Pass 6 9/9). persona 단계만 fit miss.

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/teammates/design-engineer-archetypes/modal.md` | Modify | #3 in-cell 면제 + 신규 권장 룰 + 면제 섹션 |
| 1 | `sprint-orchestrator/templates/screen-spec-template.md` | Modify | `modal_subtype` 필드 (Meta) 추가 — picker/action_sheet/dialog 분류 |

---

## Phase 1 — Picker Exception Clause

### Task 1.1: modal.md #3 면제 + 신규 권장 룰

**Files:**
- Modify: `.claude/teammates/design-engineer-archetypes/modal.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "Primary CTA 1개 + secondary" .claude/teammates/design-engineer-archetypes/modal.md`
Expected: 1 줄 매치 (#3 행).

- [ ] **Step 2: #3 행 수정 — picker 면제 in-cell**

기존 #3 행:
```
| 3 | Primary CTA 1개 + secondary 0-1개 — 결정 단순화 | 버튼 분류: primary 1, secondary 0-1 |
```

다음으로 변경:
```
| 3 | Primary CTA 1개 + secondary 0-1개 — 결정 단순화. **면제**: `screen-spec.yaml > Meta.modal_subtype: picker` 또는 `action_sheet` 명시 시 — 모든 메뉴 옵션 N개 동등 행동 (iOS HIG 스타일). 단, cancel/dismiss row 1개 명시 필수 (권장 룰 #4 참조). | 버튼 분류: primary 1, secondary 0-1. modal_subtype: picker/action_sheet 시 N개 동등 옵션 + cancel/dismiss 1개. |
```

- [ ] **Step 3: 권장 룰에 #4 추가 — picker 시 cancel/dismiss 명시**

권장 룰 표 끝에 다음 한 행 추가:

```markdown
| 4 | Picker / action sheet 패턴 시 명시적 cancel row 또는 dismiss-only 가시 — N개 옵션이 동등이라 사용자가 "선택 안 함" 경로 필요 | 사용자가 picker 진입 후 빠져나갈 경로 모호 (특히 backdrop tap 영역 작은 sheet) |
```

- [ ] **Step 4: 신규 섹션 추가 — `## 면제 조건 (Picker / Action Sheet)`**

`## Anti-Patterns` 직전에 다음 섹션 삽입:

```markdown
## 면제 조건 (Picker / Action Sheet)

iOS HIG action sheet 또는 picker 패턴 — 메뉴 옵션 N개가 모두 동급 navigation 또는 action — 은 본질적으로 primary 1개 룰과 충돌. 다음 조건 명시 시 강제 룰 #3 면제:

**활성 조건**:

- `screen-spec.yaml > Meta.modal_subtype: picker` 또는 `action_sheet` 명시
- 옵션 row 가 모두 동일 시각 가중치 (background 동일 / typography 동일)
- cancel row 또는 dismiss-only (backdrop tap 가능) 1개 이상 가시

**면제 시에도 유지되는 룰**:

- 강제 룰 #1 (backdrop opacity 0.4+) — sheet 모달 인지 유지
- 강제 룰 #2 (닫기 2-way) — 외부 backdrop tap + cancel row
- 강제 룰 #4 (title 또는 컨텍스트) — "공유 옵션", "앨범 선택" 등

**권장 룰 변형 (picker 적용 시)**:

- 권장 #1 (bottom sheet) → 권장 강제 (action sheet 는 거의 항상 bottom)
- 권장 #4 (cancel/dismiss row) → 신규 권장 룰 (picker 에 한해 의미)

**Subtype 분류 가이드**:

| modal_subtype | 정의 | 룰 #3 |
|--------------|------|------|
| `dialog` | confirm/alert — 결정형 | 강제 (기본) |
| `picker` | 옵션 N개 중 1개 선택 (즉시 적용) | 면제 |
| `action_sheet` | 옵션 N개 = N개 다른 action | 면제 |
| `sheet` | 본문 + bottom CTA (필터/공유 sheet) | 강제 (기본) |

**Anti-Pattern (면제 남용 금지)**:

- 본질적으로 confirm 인데 (예: "삭제하시겠어요? 예/아니오") `action_sheet` 로 분류 회피 — Sprint Lead PRD 검증.
- picker 에 1 옵션이 destructive (예: "이 앨범 삭제") — 일반 picker 가 아니라 dialog 분리.

**Good Pattern Examples** (면제 적용):

- **사진 라이브러리 picker**: bottom sheet → "사진 선택" title → 옵션 row 4개 (최근/즐겨찾기/앨범별/모든사진) → cancel row 하단 sticky.
- **앨범 picker**: bottom sheet → "앨범 선택" title → 앨범 row N개 (썸네일+이름+개수) → 외부 backdrop tap dismiss.
- **더보기 메뉴 (action sheet)**: bottom sheet → 옵션 row 4개 (저장/공유/신고/숨김) → cancel row 하단 (구분선 위).
```

- [ ] **Step 5: 정합성 검증**

Run: `grep -c "modal_subtype\|picker\|action_sheet" .claude/teammates/design-engineer-archetypes/modal.md`
Expected: 8 이상.

### Task 1.2: screen-spec-template.md 에 `modal_subtype` 필드 추가

**Files:**
- Modify: `sprint-orchestrator/templates/screen-spec-template.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "screen_archetype:" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 1 줄 매치 (Meta yaml 블록).

- [ ] **Step 2: Meta yaml 블록에 `modal_subtype` 추가**

Meta 섹션 yaml 블록의 `screen_archetype` 다음 줄에 추가:

```yaml
modal_subtype: "{dialog | picker | action_sheet | sheet | null}"  # modal archetype 한정 — picker/action_sheet 시 modal #3 면제. modal 외 archetype 은 null
```

- [ ] **Step 3: Meta 본문에 짧은 설명 추가**

Meta 섹션 분류 가이드 표 직후 (instant_save 노트 이전 또는 이후) 다음 한 단락 추가:

```markdown
**`modal_subtype` 플래그**: modal archetype 에 한해 의미. `picker` 또는 `action_sheet` 시 modal persona #3 (primary 1개) 면제. 자세한 면제 조건은 `.claude/teammates/design-engineer-archetypes/modal.md > 면제 조건 (Picker / Action Sheet)` 참조.
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "modal_subtype" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 2 (yaml + 본문).

### Task 1.3: Commit

- [ ] **Step 1: commit**

```bash
git add .claude/teammates/design-engineer-archetypes/modal.md sprint-orchestrator/templates/screen-spec-template.md
git commit -m "$(cat <<'EOF'
docs(modal-persona): add picker/action_sheet exception clause for #3

ugc-platform-integration-qa-2 dogfood: 4 picker/menu screens
(app-005/009/012/015) all violated modal #3 (1 primary + 0-1
secondary) because action sheets are inherently N equal options.

- modal.md #3: in-cell exemption when Meta.modal_subtype is picker
  or action_sheet
- modal.md: new recommended rule #4 (explicit cancel/dismiss row for
  picker patterns)
- modal.md: new section "면제 조건 (Picker / Action Sheet)" with
  subtype taxonomy (dialog/picker/action_sheet/sheet) and Good
  examples
- screen-spec-template: modal_subtype field with default null

EOF
)"
```

---

## Post-Plan Verification

- [ ] **Step 1: 통합 검증**

Run: `grep -B1 -A3 "면제 조건 (Picker" .claude/teammates/design-engineer-archetypes/modal.md`
Expected: 섹션 본문 출력.

- [ ] **Step 2: 다음 sprint 첫 dogfood 시**

picker / action sheet 화면이 1개 이상이면:
- DE 가 `modal_subtype: picker` (또는 `action_sheet`) 명시
- modal persona 4/4 통과 (archetype_recommendation_skipped 없음)
- 권장 룰 #4 (cancel row) 자동 검증

미통과 시 modal_subtype 분류 가이드 추가 강화.

---

## Open Questions

- [ ] **`sheet` (bottom sheet — 필터/공유 sheet) 분류 강제 여부**: 현재 dialog 와 동일 (#3 강제). 필터 sheet 가 N개 동등 옵션 + 1개 적용 버튼 인 경우 모호. 첫 사례에서 결정 — sheet 도 면제 vs 분리 (`filter_sheet`).
- [ ] **앨범 picker 의 thumbnail row**: 앨범 picker 는 row 마다 thumbnail 이 있어 시각 가중치 다름. "동등" 정의 모호 — 시각 가중치 정량 기준 필요한지 첫 dogfood 에서 검증.
