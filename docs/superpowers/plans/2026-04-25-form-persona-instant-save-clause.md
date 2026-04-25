# Form Persona — Instant Save Exception Clause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** form persona 강제 룰 #2 (`Submit disabled until valid`) 와 #4 (`Primary action 1개`) 가 즉시 저장(instant save) 패턴 — 토글/체크박스 변경 즉시 서버 반영, Submit 버튼 자체가 부재 — 과 구조적으로 양립 불가능. screen-spec 에 `instant_save: true` 가 명시된 화면에 한해 두 룰을 면제하는 clause 를 form.md 에 추가하여, 다음 sprint 의 알림설정/계정설정 류 화면이 form persona 4/4 통과 가능하도록 한다.

**Architecture:** 1 Phase, 단일 파일 변경. form.md 의 강제 룰 표 #2/#4 행에 면제 조건을 in-cell 로 추가 + `## 면제 조건 (Instant Save)` 신규 섹션으로 메타데이터 명시. 신규 코드 없음.

**Tech Stack:** Markdown only.

---

## Background — v2 Dogfood Finding

`ugc-platform-integration-qa-2` Phase 3 dogfood (2026-04-25, 23 화면) 에서 form persona 강제 룰 4/4 미충족이 2건 발생:

- **app-022 알림 설정** (toggle 8개, Submit 버튼 없음) — 룰 #2 (`submit_disabled` 상태 정의 필요) 와 #4 (`Primary action 1개`) 를 만족할 수 없음. 변경 즉시 PATCH API 발사가 의도된 패턴.
- **app-023 설정 메인** (nav row + 토글 혼합) — 동일 사유 + 부수적으로 form archetype 자체가 fit 하지 않음 (별 plan: `archetype-enum-nav-list`).

quality-report.yaml 에는 `archetype_recommendation_skipped: form #2 / #4` 로 로깅되었으나, 두 케이스 모두 사실상 강제 룰 위반이 아니라 패턴 자체의 부적합. 향후 sprint 에서 동일 패턴이 반복될 때마다 권장 거절 로그가 누적되면 form persona 의 신뢰도가 저하된다.

**Pass 6 결과**: 두 화면 모두 통과 (Pass 6 9/9), persona 단계에서만 룰 미충족.

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/teammates/design-engineer-archetypes/form.md` | Modify | 강제 룰 #2/#4 면제 clause + 신규 섹션 |
| 1 | `sprint-orchestrator/templates/screen-spec-template.md` | Modify | `instant_save: bool` 필드 명시 (Meta 섹션) |

---

## Phase 1 — Instant Save Clause + Spec Field

### Task 1.1: form.md 강제 룰 #2/#4 에 면제 조건 추가

**Files:**
- Modify: `.claude/teammates/design-engineer-archetypes/form.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "Submit 버튼 disabled\|Primary action 1개만" .claude/teammates/design-engineer-archetypes/form.md`
Expected: 2줄 매치 (#2, #4 행).

- [ ] **Step 2: #2 행 수정 — 면제 조건 in-cell**

기존 #2 행:
```
| 2 | Submit 버튼 disabled 상태 정의됨 — 모든 required 필드 valid 까지 비활성 | `screen-spec.yaml > states` 에 `submit_disabled` + `submit_enabled` 둘 다 |
```

다음으로 변경:
```
| 2 | Submit 버튼 disabled 상태 정의됨 — 모든 required 필드 valid 까지 비활성. **면제**: `screen-spec.yaml > Meta.instant_save: true` 명시 시 미적용 (Submit 버튼 자체가 없는 즉시 저장 패턴). | `screen-spec.yaml > states` 에 `submit_disabled` + `submit_enabled` 둘 다, **또는** `Meta.instant_save: true` |
```

- [ ] **Step 3: #4 행 수정 — 동일 면제 조건**

기존 #4 행:
```
| 4 | Primary action 1개만 (Submit / Save / 다음 등) — 동급 강조 버튼 금지 | 버튼 분류: primary 1, 다른 버튼은 ghost/text |
```

다음으로 변경:
```
| 4 | Primary action 1개만 (Submit / Save / 다음 등) — 동급 강조 버튼 금지. **면제**: `Meta.instant_save: true` 시 primary action 0개 허용 (각 input/toggle 이 자체 commit). | 버튼 분류: primary 1, 다른 버튼은 ghost/text. instant_save 시 primary 0 허용. |
```

- [ ] **Step 4: 신규 섹션 추가 — `## 면제 조건 (Instant Save)`**

`## Anti-Patterns` 직전에 다음 섹션 삽입:

```markdown
## 면제 조건 (Instant Save)

토글/체크박스/라디오 변경 즉시 서버 PATCH 가 발사되는 화면 (예: 알림 설정, 계정 보안 옵션, 다크모드 토글) 은 본질적으로 Submit 버튼이 없다. 이 경우 강제 룰 #2 (submit disabled) 와 #4 (primary action 1개) 가 적용 불가.

**활성 조건**:

- `screen-spec.yaml > Meta.instant_save: true` 명시
- 추가로 `screen-spec.yaml > states` 에 `saving.{field-id}` (저장 중 spinner) + `saved.{field-id}` (성공 체크) + `error.{field-id}` (롤백) 정의 필수

**면제 시에도 유지되는 룰**:

- 강제 룰 #1 (inline validation) — 잘못된 값 즉시 표시 + 서버 거부 시 토글 원위치
- 강제 룰 #3 (error message 위치) — 에러 발생 필드 직하

**Anti-Pattern (면제 남용 금지)**:

- 일반 form 인데 `instant_save: true` 로 회피 — Sprint Lead 가 PRD 와 대조 검증.
- toggle 조합이 강한 의존성 (A 켜야 B 가능) 인데 즉시 저장 — 부분 적용 상태 위험. 이 경우 일반 form 으로 회귀.

**Good Pattern Examples** (면제 적용):

- **알림 설정**: 카테고리별 toggle 8개, 각각 변경 즉시 PATCH `/notifications/preferences`. 우상단 spinner + saved 체크 800ms.
- **계정 보안**: "2단계 인증" 토글 → 즉시 modal 진입 → 완료 후 자동 토글 on.
- **다크모드 토글**: 즉시 테마 전환 + 서버 동기화 백그라운드.
```

- [ ] **Step 5: 정합성 검증**

Run: `grep -c "instant_save" .claude/teammates/design-engineer-archetypes/form.md`
Expected: 6 이상 (#2 in-cell 1, #4 in-cell 1, 신규 섹션 4+).

Run: `grep -n "면제 조건 (Instant Save)" .claude/teammates/design-engineer-archetypes/form.md`
Expected: 1 줄 매치.

### Task 1.2: screen-spec-template.md 에 `instant_save` 필드 추가

**Files:**
- Modify: `sprint-orchestrator/templates/screen-spec-template.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "screen_archetype:" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 1 줄 매치 (Meta 섹션 yaml 블록 내).

- [ ] **Step 2: Meta yaml 블록에 `instant_save` 추가**

`Meta` 섹션의 yaml 블록에서 `theme: "light"` 직후에 다음 한 줄 추가:

```yaml
instant_save: false  # form archetype 한정 — toggle/체크박스 즉시 저장 패턴 시 true (form persona #2/#4 면제)
```

- [ ] **Step 3: Meta 본문에 짧은 설명 추가**

Meta 섹션 분류 가이드 표 직후에 다음 한 단락 추가:

```markdown
**`instant_save` 플래그**: form archetype 에 한해 의미. `true` 시 form persona #2 (submit disabled) / #4 (primary 1개) 면제. 자세한 면제 조건은 `.claude/teammates/design-engineer-archetypes/form.md > 면제 조건 (Instant Save)` 참조.
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "instant_save" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 2 (yaml + 본문).

### Task 1.3: Commit

- [ ] **Step 1: 단일 commit**

```bash
git add .claude/teammates/design-engineer-archetypes/form.md sprint-orchestrator/templates/screen-spec-template.md
git commit -m "$(cat <<'EOF'
docs(form-persona): add instant_save exception clause for #2/#4

ugc-platform-integration-qa-2 dogfood: app-022 (notification toggles)
and app-023 (settings) cannot satisfy form #2 (submit_disabled) or #4
(1 primary action) because they use instant-save patterns where each
toggle commits on change.

- form.md #2/#4: in-cell exemption when Meta.instant_save: true
- form.md: new section "면제 조건 (Instant Save)" with activation
  conditions, retained rules, anti-patterns, good examples
- screen-spec-template.md: add instant_save: false default field with
  pointer to the exception section

EOF
)"
```

---

## Post-Plan Verification

- [ ] **Step 1: form 통합 검증**

Run: `grep -B1 -A2 "instant_save" .claude/teammates/design-engineer-archetypes/form.md`
Expected: #2/#4 in-cell 면제 + 면제 섹션 본문 출력.

- [ ] **Step 2: 다음 sprint 첫 dogfood 시 검증**

다음 sprint 에서 `instant_save: true` 화면이 1개 이상이면:
- form persona 4/4 통과 (archetype_recommendation_skipped 없음)
- quality-report 에 `instant_save_exempted: true` 명시 (DE 가 자동 기록)

미통과 시 form.md 면제 조건의 모호성 재검토.

---

## Open Questions

- [ ] **남용 방지 검증 메커니즘**: `instant_save: true` 가 Sprint Lead 검토 없이 사용되는 케이스 빈도. 첫 3 sprint dogfood 후 비율이 30% 이상이면 PRD 근거 인용 강제화 검토.
- [ ] **mixed pattern 처리**: 한 화면이 즉시 저장 영역 + 일반 form 영역 (예: 프로필 편집 — 토글은 즉시, 텍스트 필드는 Save 버튼) 일 때 archetype 분리 vs 동일 화면 내 부분 면제. 첫 사례 발생 시 결정.
