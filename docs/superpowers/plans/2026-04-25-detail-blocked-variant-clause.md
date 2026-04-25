# Detail Persona — Blocked / Restricted Variant Clause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** detail archetype 의 "blocked" / "restricted" variant (사용자가 차단된 콘텐츠, 제한된 프로필 등) 는 차단 의도 보호 차원에서 primary CTA 0개가 정당. detail.md 강제 룰 #4 에 면제 clause 를 추가하여 향후 차단/제한 detail 화면이 detail persona 4/4 통과 가능하도록 한다.

**Architecture:** 1 Phase, 단일 파일 변경. detail.md 강제 룰 #4 in-cell 면제 + 신규 섹션 (`## 면제 조건 (Blocked / Restricted Variant)`). 신규 코드 없음.

**Tech Stack:** Markdown only.

---

## Background — v2 Dogfood Finding

`ugc-platform-integration-qa-2` Phase 3 dogfood (2026-04-25, 23 화면) 에서 **app-014 차단됨** (사용자가 차단한 프로필 진입) 케이스:

- archetype: detail (블록된 사용자 프로필 = 단일 객체)
- 강제 룰 #4 (`Primary CTA 1개 + secondary 0-2개`) 미충족 — primary 0개
- 의도: 차단 상태이므로 "팔로우/메시지" 등 primary action 노출 금지가 정당. "차단 해제" 만 secondary 로 노출
- quality-report 에 `archetype_recommendation_skipped: detail #4 — blocked variant` 로깅

severity 는 low — 빈도 낮음 (sprint 당 1-2건). 단, 향후 restriction (연령 제한, 지역 제한, 비공개 계정) 등 동일 패턴 확장 시 일관 처리 필요.

DE 는 sprint_lead_followup 에 다음 보고:

> "detail #4 의 'primary CTA 1개' 룰이 차단/제한 상태와 충돌. blocked 외에도 private (비공개), restricted (연령제한), unavailable (지역) 패턴 존재 가능. 면제 clause 권장."

**Pass 6 결과**: 통과 (Pass 6 9/9). persona 단계만 fit miss.

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/teammates/design-engineer-archetypes/detail.md` | Modify | #4 in-cell 면제 + 신규 섹션 |
| 1 | `sprint-orchestrator/templates/screen-spec-template.md` | Modify | `detail_state` 필드 (Meta) — normal/blocked/private/restricted/unavailable |

---

## Phase 1 — Blocked Variant Clause

### Task 1.1: detail.md #4 면제 + 신규 섹션

**Files:**
- Modify: `.claude/teammates/design-engineer-archetypes/detail.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "Primary CTA 1개 + secondary 0-2개" .claude/teammates/design-engineer-archetypes/detail.md`
Expected: 1 줄 매치 (#4 행).

- [ ] **Step 2: #4 행 수정 — blocked/restricted 면제 in-cell**

기존 #4 행:
```
| 4 | Primary CTA 1개 + secondary 0-2개 — 액션 위계 명확 | 버튼 분류: primary 1, 다른 버튼은 ghost/text/icon-only |
```

다음으로 변경:
```
| 4 | Primary CTA 1개 + secondary 0-2개 — 액션 위계 명확. **면제**: `screen-spec.yaml > Meta.detail_state` 가 `blocked` / `private` / `restricted` / `unavailable` 중 하나일 때 primary CTA 0개 허용 (차단/제한 의도 보호 — secondary 만 노출, 예: "차단 해제"). | 버튼 분류: primary 1 (기본), detail_state 면제 시 primary 0 + secondary 0-2 허용. |
```

- [ ] **Step 3: 신규 섹션 추가 — `## 면제 조건 (Blocked / Restricted Variant)`**

`## Anti-Patterns` 직전에 다음 섹션 삽입:

```markdown
## 면제 조건 (Blocked / Restricted Variant)

차단된 사용자 프로필, 비공개 계정, 연령/지역 제한 콘텐츠 등 — 사용자가 객체에 진입했지만 정상 action 노출이 부적합한 상태 — 은 강제 룰 #4 (primary 1개) 면제.

**활성 조건**:

- `screen-spec.yaml > Meta.detail_state` 가 다음 중 하나:
  - `blocked` — 사용자가 차단한 또는 차단된 프로필/콘텐츠
  - `private` — 비공개 계정 (팔로우 승인 전)
  - `restricted` — 연령 제한 / 지역 제한 콘텐츠
  - `unavailable` — 삭제됨 / 신고로 비공개 처리됨
- detail_state 사유가 hero 영역 또는 본문에 명시 (예: "차단된 사용자입니다", "비공개 계정")

**면제 시에도 유지되는 룰**:

- 강제 룰 #1 (hero 320px+) — 차단 상태도 시각 앵커 유지
- 강제 룰 #2 (back 1-way) — 진입 경로 보존
- 강제 룰 #3 (메타 4개 이내) — 단, 차단 상태에서는 일부 메타 hidden 가능

**허용되는 secondary actions** (detail_state 별):

| detail_state | 허용 secondary | 금지 |
|-------------|---------------|------|
| `blocked` | 차단 해제 / 신고 | 팔로우 / 메시지 / 좋아요 |
| `private` | 팔로우 요청 / 신고 | 게시물 보기 / 좋아요 |
| `restricted` | 연령 인증 / 도움말 | 콘텐츠 직접 노출 |
| `unavailable` | 신고 / 도움말 | 모든 일반 action |

**Anti-Pattern (면제 남용 금지)**:

- 일반 detail 인데 "단순화 위해" detail_state 사용 — Sprint Lead PRD 검증.
- detail_state: blocked 인데 "팔로우" CTA 그대로 노출 — 면제 의미 무효.

**Good Pattern Examples** (면제 적용):

- **차단된 프로필 (app-014)**: hero (블러 처리된 아바타 + 이름 placeholder) → 본문 "차단된 사용자입니다" + "차단을 해제하면 게시물을 볼 수 있어요" → secondary "차단 해제" (ghost) + 신고 icon.
- **비공개 계정**: hero (아바타 + 이름) → 본문 "비공개 계정입니다" + "팔로우 요청을 보내 게시물을 확인해보세요" → secondary "팔로우 요청" (ghost).
- **연령 제한**: hero (블러 썸네일) → "이 콘텐츠는 19세 이상만 볼 수 있어요" → secondary "연령 인증" (ghost) + "도움말" (text).
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "detail_state\|blocked\|restricted" .claude/teammates/design-engineer-archetypes/detail.md`
Expected: 8 이상.

### Task 1.2: screen-spec-template.md 에 `detail_state` 필드 추가

**Files:**
- Modify: `sprint-orchestrator/templates/screen-spec-template.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "screen_archetype:" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 1 줄 매치 (Meta yaml 블록).

- [ ] **Step 2: Meta yaml 블록에 `detail_state` 추가**

Meta 섹션 yaml 블록의 `screen_archetype` 다음 줄 (또는 modal_subtype 근처) 에 추가:

```yaml
detail_state: "{normal | blocked | private | restricted | unavailable}"  # detail archetype 한정 — blocked 외 4종 시 detail #4 면제. 기본 normal
```

- [ ] **Step 3: Meta 본문에 짧은 설명 추가**

Meta 섹션 분류 가이드 표 직후 (instant_save / modal_subtype 노트와 같은 군집) 다음 한 단락 추가:

```markdown
**`detail_state` 플래그**: detail archetype 에 한해 의미. `normal` 외 (`blocked` / `private` / `restricted` / `unavailable`) 시 detail persona #4 (primary 1개) 면제. 자세한 면제 조건은 `.claude/teammates/design-engineer-archetypes/detail.md > 면제 조건 (Blocked / Restricted Variant)` 참조.
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "detail_state" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 2 (yaml + 본문).

### Task 1.3: Commit

- [ ] **Step 1: commit**

```bash
git add .claude/teammates/design-engineer-archetypes/detail.md sprint-orchestrator/templates/screen-spec-template.md
git commit -m "$(cat <<'EOF'
docs(detail-persona): add blocked/restricted variant exception for #4

ugc-platform-integration-qa-2 dogfood: app-014 (blocked profile) had
to skip detail #4 (1 primary CTA) because exposing follow/message
actions on a blocked profile defeats the block intent. Same pattern
applies to private/restricted/unavailable content.

- detail.md #4: in-cell exemption when Meta.detail_state in
  {blocked, private, restricted, unavailable}
- detail.md: new section "면제 조건 (Blocked / Restricted Variant)"
  with allowed secondary actions per state + Good examples
- screen-spec-template: detail_state field with default normal

EOF
)"
```

---

## Post-Plan Verification

- [ ] **Step 1: 통합 검증**

Run: `grep -B1 -A3 "면제 조건 (Blocked" .claude/teammates/design-engineer-archetypes/detail.md`
Expected: 섹션 본문 출력.

- [ ] **Step 2: 다음 sprint 첫 dogfood 시**

차단/제한 detail 화면이 1개 이상이면:
- DE 가 `detail_state: blocked` (또는 동급) 명시
- detail persona 4/4 통과 (archetype_recommendation_skipped 없음)
- 허용 secondary 매트릭스 자동 검증 (예: blocked 상태에 "팔로우" 노출 시 STOP)

미통과 시 detail.md 매트릭스 강화.

---

## Open Questions

- [ ] **`unavailable` 의 hero 처리**: 삭제된 콘텐츠 hero 영역에 무엇을 표시할지 (placeholder 이미지 / 빈 공간 / icon) — 첫 사례에서 결정.
- [ ] **detail_state 자동 감지**: PRD 가 "차단 상태" 같은 키워드 명시 시 DE 가 자동으로 detail_state 매핑 가능한지 (현재는 수동 지정). 첫 3 sprint 후 자동화 검토.
