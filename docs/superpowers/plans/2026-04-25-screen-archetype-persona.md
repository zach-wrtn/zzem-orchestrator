# Screen Archetype Persona Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** 화면을 6개 archetype (feed / detail / onboarding / form / modal / empty_state) 으로 분류하고, 각 archetype 별로 Design Engineer 가 따르는 **persona-specific UI 룰** 을 명문화하여, 화면 유형 무시하고 모든 화면을 같은 방식으로 그리는 cargo-cult 를 방지한다.

PR #29 v2 파이프라인의 Pass 6 Anti-Slop Audit 와 직교 — Pass 6 가 "하지 말 것" 룰이라면 archetype persona 는 "각 유형이 반드시 갖춰야 할 것" 룰.

**Architecture:** 4 Phase. Phase 1 은 screen-spec-template.md 메타 필드 추가, Phase 2 는 6개 persona 룰 파일, Phase 3 은 design-engineer.md Step B.1/C 에 분기 로직, Phase 4 는 phase-prototype.md 에 archetype 분류 단계.

**Tech Stack:** Markdown (프로토콜 + persona 룰), YAML (screen-spec meta enum), 신규 코드 없음.

---

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `sprint-orchestrator/templates/screen-spec-template.md` | Modify | `## Meta` 에 `screen_archetype` enum 필드 추가 |
| 1 | `sprint-orchestrator/templates/screen-spec-template.md` | Modify | "Auto-classify hint" 가이드 한 줄 추가 |
| 2 | `.claude/teammates/design-engineer-archetypes/feed.md` | Create | Feed persona 룰 + good/bad 예시 |
| 2 | `.claude/teammates/design-engineer-archetypes/detail.md` | Create | Detail persona 룰 |
| 2 | `.claude/teammates/design-engineer-archetypes/onboarding.md` | Create | Onboarding persona 룰 |
| 2 | `.claude/teammates/design-engineer-archetypes/form.md` | Create | Form persona 룰 |
| 2 | `.claude/teammates/design-engineer-archetypes/modal.md` | Create | Modal persona 룰 |
| 2 | `.claude/teammates/design-engineer-archetypes/empty_state.md` | Create | Empty state persona 룰 |
| 2 | `.claude/teammates/design-engineer-archetypes/_index.md` | Create | 6개 archetype 목차 + 분류 가이드 |
| 3 | `.claude/teammates/design-engineer.md` | Modify | Step B.1 에 archetype 분류 단계 + Step C 에 persona 룰 인라인 룰 |
| 4 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2 Step 1 Frozen Snapshot 에 archetype-매칭 persona 파일 인라인 |

---

## Phase 1 — Screen Spec Meta 확장

### Task 1.1: `screen_archetype` enum 필드 추가

**Files:**
- Modify: `sprint-orchestrator/templates/screen-spec-template.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "^## Meta" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 한 줄 매치.

- [ ] **Step 2: Meta 섹션 enum 필드 추가**

`## Meta` 섹션의 YAML 블록 안에 다음 필드 추가 (`screen_name` 다음 권장):

```yaml
screen_archetype: "{feed | detail | onboarding | form | modal | empty_state}"
```

- [ ] **Step 3: Meta 섹션 끝에 분류 가이드 한 단락 추가**

```markdown
**`screen_archetype` 선택 가이드** (한 화면 1개만 선택, 가장 우세한 패턴 기준):

| archetype | 핵심 신호 | 예시 |
|-----------|----------|------|
| **feed** | 동질 아이템 N개 스크롤 | 홈 피드, 검색 결과, 알림 리스트 |
| **detail** | 단일 객체 상세 (hero + body + CTAs) | 게시물 상세, 프로필 페이지, 상품 상세 |
| **onboarding** | 다단계 진행 + large primary CTA | 가입 step 1/2/3, 튜토리얼, 설정 마법사 |
| **form** | 입력 필드 + validation + submit | 로그인, 신고, 프로필 편집 |
| **modal** | 부분 화면 + backdrop + dismiss | confirm, share sheet, filter 시트 |
| **empty_state** | 컨텐츠 0건 안내 + 1 primary CTA | 빈 피드, 검색결과 없음, 첫 사용자 |

복합 화면 (예: detail + 하단 form) 인 경우 가장 시각 면적 큰 영역 기준. 분류 모호 시 Sprint Lead 에 질의.

DE 는 본 필드를 읽고 `.claude/teammates/design-engineer-archetypes/{archetype}.md` 의 persona 룰을 적용한다 (자세한 룰은 Step C 참조).
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "screen_archetype" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 3 이상 (YAML 필드 + 가이드 헤더 + 본문 참조).

- [ ] **Step 5: Commit**

```bash
git add sprint-orchestrator/templates/screen-spec-template.md
git commit -m "feat(templates): add screen_archetype enum to screen-spec Meta

6-archetype enum (feed/detail/onboarding/form/modal/empty_state) with
selection guide table. DE applies per-archetype persona rules from
.claude/teammates/design-engineer-archetypes/{archetype}.md."
```

---

## Phase 2 — 6 Persona Rule Files

### Task 2.1: `_index.md` 목차 + 분류 가이드

**Files:**
- Create: `.claude/teammates/design-engineer-archetypes/_index.md`

- [ ] **Step 1: 목차 작성**

```markdown
# Design Engineer Archetype Personas

Screen Spec 의 `screen_archetype` 필드에 따라 DE 가 추가로 적용하는 persona 룰 모음.

## Index

| archetype | 파일 | 핵심 강제 룰 (요약) |
|-----------|------|------------------|
| feed | [feed.md](feed.md) | skeleton state 필수 / pull-to-refresh 힌트 / 첫 화면 6+ 아이템 표시 |
| detail | [detail.md](detail.md) | hero 320px+ / breadcrumb 또는 back / 핵심 metadata 4 이내 |
| onboarding | [onboarding.md](onboarding.md) | progress 표시 / primary CTA 56px+ / skip 옵션 |
| form | [form.md](form.md) | inline validation / submit disabled until valid / 1 primary action |
| modal | [modal.md](modal.md) | backdrop / 닫기 2-way (X + 외부 탭) / 1 primary + 0-1 secondary |
| empty_state | [empty_state.md](empty_state.md) | illustration or icon / 1 sentence + 1 CTA / 부정 어조 금지 |

## 적용 흐름

1. Screen Spec `Meta.screen_archetype` 읽기
2. 해당 archetype md 파일을 Frozen Snapshot 에 인라인 (phase-prototype.md §3.2 Step 1 자동화)
3. Step C HTML 생성 시 DE 가 persona 의 "강제 룰" 모두 충족 — 충족 못하면 Pass 6 와 동일하게 STOP
4. persona 의 "권장 룰" 은 트레이드오프 — 의식적 거절 시 quality-report 에 `archetype_recommendation_skipped` 기록

## 메타 룰

- archetype 분류 자체가 모호하면 Sprint Lead 에 질의 (default 분류 금지)
- persona 룰은 **archetype 한정 추가 룰** — DESIGN.md / tokens.css / Pass 6 Audit 보다 약함 (충돌 시 상위 룰이 이김)
- persona 룰 변경/추가는 본 디렉토리 변경 → 별 PR 로 검토
```

- [ ] **Step 2: Commit**

```bash
git add .claude/teammates/design-engineer-archetypes/_index.md
git commit -m "docs(de): add archetype personas index

6-archetype lookup with one-line forced rules per persona. Defines
priority (lower than DESIGN.md/tokens/Pass 6) and adjustment workflow."
```

### Task 2.2: 6개 persona 파일 작성

**Files:**
- Create: `.claude/teammates/design-engineer-archetypes/feed.md`
- Create: `.claude/teammates/design-engineer-archetypes/detail.md`
- Create: `.claude/teammates/design-engineer-archetypes/onboarding.md`
- Create: `.claude/teammates/design-engineer-archetypes/form.md`
- Create: `.claude/teammates/design-engineer-archetypes/modal.md`
- Create: `.claude/teammates/design-engineer-archetypes/empty_state.md`

각 파일 표준 구조:

```markdown
# {Archetype} Persona

## 정체성
{한 단락 — 이 archetype 의 사용자 의도와 시각적 상징}

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | ... | grep / 시각 검토 |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | ... | ... |

## Good Pattern Examples
{2-3 예시 — exemplar 가 있으면 id 참조, 없으면 추상 스케치}

## Anti-Patterns
{이 archetype 에서 자주 나오는 슬롭 — 예: feed 에 carousel 강요}
```

각 archetype 의 강제 룰 (3-5개씩) 권장 핵심:

**feed.md 강제 룰**:
1. Skeleton/loading state 명시 (states 섹션에 `loading` 필수)
2. 첫 viewport 에 6+ 아이템 가시 (스크롤 유도)
3. Pull-to-refresh 인터랙션 또는 명시적 refresh CTA
4. 빈 결과 분기 처리 (empty_state archetype 참조)

**detail.md 강제 룰**:
1. Hero 영역 320px+ (썸네일/이미지/title)
2. 뒤로가기 1-way (back button 또는 swipe)
3. 핵심 metadata 4 이내 (시각 위계 유지)
4. CTA 1 primary + 0-2 secondary 최대

**onboarding.md 강제 룰**:
1. 진행 표시 (step indicator 또는 progress bar)
2. Primary CTA 56px+ height
3. Skip 또는 dismiss 1-way 보장
4. 마지막 step 완료 → 명확한 다음 화면 (success state)

**form.md 강제 룰**:
1. Inline validation (focus-out 또는 onChange)
2. Submit 버튼 disabled until valid
3. Error message 필드 직하 (alert 박스 금지)
4. Primary action 1개 (Submit 또는 Save)

**modal.md 강제 룰**:
1. Backdrop opacity 40%+ (콘텐츠 가독성)
2. 닫기 2-way (X 버튼 + 외부 탭/backdrop click)
3. Primary CTA 1 + secondary 0-1
4. Title 또는 명확한 콘텍스트 제공 (modal 만 떠있을 때 사용자 위치 인지 가능)

**empty_state.md 강제 룰**:
1. Illustration 또는 icon 80px+ (시각 앵커)
2. Headline 1 문장 + body 1-2 문장
3. Primary CTA 1개 (다음 단계 안내)
4. 부정 어조 금지 ("아무것도 없습니다" → "첫 X 를 만들어보세요")

- [ ] **Step 1: 6개 파일 작성**

위 표준 구조에 맞춰 각각 작성. 각 파일 80-150 줄 이내 권장.

- [ ] **Step 2: Commit (단일 또는 6개 분리)**

```bash
git add .claude/teammates/design-engineer-archetypes/{feed,detail,onboarding,form,modal,empty_state}.md
git commit -m "docs(de): add 6 archetype persona rule files

feed/detail/onboarding/form/modal/empty_state with forced rules
(STOP on miss), recommended rules (logged on skip), good patterns,
and anti-patterns per archetype."
```

---

## Phase 3 — Design Engineer 분기 로직

### Task 3.1: Step B.1 에 archetype 분류 단계

**Files:**
- Modify: `.claude/teammates/design-engineer.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "^### B.1 화면 식별" .claude/teammates/design-engineer.md`
Expected: 한 줄 매치.

- [ ] **Step 2: B.1.1 archetype 분류 섹션 추가**

`### B.1 화면 식별` 직후 (B.2 직전) 삽입:

```markdown
### B.1.1 Archetype 분류 (필수)

각 화면에 대해 `screen_spec.yaml > Meta.screen_archetype` 을 6 enum 중 하나로 결정한다.

**분류 흐름**:

1. screen-spec-template.md `Meta` 섹션의 분류 가이드 표를 참조
2. 가장 우세한 패턴 1개 선택 (복합 화면이면 시각 면적 큰 영역 기준)
3. 모호 시 Sprint Lead 에 질의 — default 분류 금지
4. 결정된 archetype 의 persona 파일 (`.claude/teammates/design-engineer-archetypes/{archetype}.md`) 을 본 task working memory 에 인라인 (Step C 시작 전까지 유지)

**Activity Logging**:
| B.1.1 archetype 분류 | `archetype_classified` | "{ScreenName}: {archetype} (대안 검토: {alt or none})" |
| B.1.1 archetype 모호 | `archetype_ambiguous` | "{ScreenName}: {a vs b} — Sprint Lead 질의 대기" |
```

- [ ] **Step 3: Step C 시작부에 persona 룰 적용 안내 추가**

`## Step C: Prototype Generation` 섹션 첫 단락 끝에 추가:

```markdown
**Persona 룰 적용**: B.1.1 에서 결정된 `screen_archetype` 의 persona 파일에 정의된 강제 룰을 본 Step C 의 모든 Pass (1~6) 에 추가 제약으로 적용한다. Persona 강제 룰은 Pass 6 Anti-Slop Audit 와 동급의 STOP 조건 — 미충족 시 prototype.html 저장 금지.
```

- [ ] **Step 4: Pass 6 Audit 표 8/9 행 추가**

`### C.2.1 Pass 6 Anti-Slop Self-Audit` 표에 추가 (#7 다음, exemplar drift 가 #8 이라면 #9 로 추가):

```markdown
| N | `screen_archetype` 의 persona 강제 룰 (모든 항목) 통과했는가 | 미통과 항목 STOP. persona md 의 "강제 룰" 표 참조 |
```

- [ ] **Step 5: Activity Logging 표에 archetype_persona_check 행 추가**

```markdown
| C.2.1 archetype persona 통과 | `archetype_persona_passed` | "{archetype} persona 강제 룰 {N}/{N} 통과" |
| C.2.1 archetype persona 거절 권장 | `archetype_recommendation_skipped` | "{archetype} 권장 #{N} 거절: {사유}" |
```

- [ ] **Step 6: 정합성 검증**

Run: `grep -c "screen_archetype\|archetype_classified\|persona" .claude/teammates/design-engineer.md`
Expected: 8 이상.

- [ ] **Step 7: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "feat(de): add archetype classification + persona enforcement

Step B.1.1 forces archetype selection from 6 enum + Sprint Lead
escalation on ambiguity. Step C inlines persona file's forced rules
into Pass 6 audit (STOP on miss). Recommendation skips logged for
post-sprint analysis."
```

---

## Phase 4 — Phase Prototype Snapshot 에 persona 인라인

### Task 4.1: §3.2 Step 1 Snapshot 에 archetype-매칭 persona 인라인

**Files:**
- Modify: `.claude/skills/sprint/phase-prototype.md`

- [ ] **Step 1: Snapshot 조립 목록 6번째 항목 추가**

PR #29 + Curated Exemplar plan 의 5번째 (exemplar lookup) 직후에 6번째 추가:

```markdown
6. (Step 5 의 archetype 결과 또는 task description 의 archetype hint 사용) `cat .claude/teammates/design-engineer-archetypes/{archetype}.md`
   → persona 룰 파일 전체를 Snapshot 에 인라인
   → archetype 미정 (B.1.1 미수행 task) 인 경우 Step 6 스킵 — DE 가 B.1.1 에서 분류 후 본 파일 직접 read
```

- [ ] **Step 2: TaskCreate Description 에 archetype 사전 hint 가능성 명시**

§3.2 Step 2 TaskCreate Description 에 추가:

```
    Archetype hint (선택): task의 PRD 분석 단계에서 Sprint Lead 가 archetype 을 추론했다면
    Description 에 archetype: {value} 명시 → DE Snapshot Step 6 에서 persona 자동 인라인.
    추론 실패 시 생략 — DE 가 B.1.1 에서 분류 후 직접 인라인.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sprint/phase-prototype.md
git commit -m "feat(phase-prototype): inline archetype persona into Snapshot

Snapshot Step 1 adds 6th input (cat of archetype persona md). Sprint
Lead can pre-hint archetype in TaskCreate Description; otherwise DE
classifies in Step B.1.1 and inlines on its own."
```

---

## Post-Plan Verification

- [ ] **Step 1: 6개 persona 파일 존재 확인**

Run: `ls .claude/teammates/design-engineer-archetypes/`
Expected: `_index.md feed.md detail.md onboarding.md form.md modal.md empty_state.md` (7개).

- [ ] **Step 2: 강제 룰 개수 sanity**

Run: `for f in .claude/teammates/design-engineer-archetypes/{feed,detail,onboarding,form,modal,empty_state}.md; do echo "$f"; grep -c "^| [0-9]" "$f"; done`
Expected: 각 파일 강제 + 권장 룰 합쳐서 4-10개 (너무 많으면 cargo-cult, 너무 적으면 무의미).

- [ ] **Step 3: 다음 dogfood sprint 에서 archetype 분류 적용 확인**

본 plan 머지 후 첫 sprint Phase 3 에서 모든 task 의 screen-spec.yaml 에 `screen_archetype` 필드가 채워지고, 해당 persona 의 강제 룰이 Pass 6 에서 검증되는지 확인.

---

## Open Questions

- [ ] **복합 화면 처리**: detail + form 같은 복합 화면이 의외로 많을 경우 — 7번째 archetype `composite` 추가 검토 vs 시각 면적 기준 단일 분류 강제.
- [ ] **Archetype 룰의 강도**: 강제 룰 / 권장 룰 비율을 첫 dogfood 결과로 조정. 거절률이 50% 이상인 권장 룰은 강제로 승격 또는 삭제 검토.
- [ ] **신규 archetype 추가 정책**: 6 enum 으로 부족할 때 (예: data_visualization, map, video_player) 추가 절차 — 별 PR + 사용자 승인 필수.
