# Archetype Enum Expansion — `nav_list` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** screen archetype enum 을 6→7 로 확장하여 `nav_list` 를 추가한다. settings/navigation list 화면 (설정 메인, 계정 메뉴, 도움말 인덱스 등) 이 form / feed / detail 어디에도 fit 하지 않는 구조적 갭을 메우고, 다음 sprint 의 settings 류 화면이 강제 룰 4/4 통과 가능하도록 한다.

**Architecture:** 2 Phase. Phase 1 — 신규 persona 파일 (`nav_list.md`) 작성 + `_index.md` 갱신. Phase 2 — Meta enum 확장 (template 2개 + DE Step B.1.1 분류 가이드). 신규 코드 없음.

**Tech Stack:** Markdown only.

---

## Background — v2 Dogfood Finding

`ugc-platform-integration-qa-2` Phase 3 dogfood (2026-04-25, 23 화면) 에서 **app-023 설정 메인** 이 모든 archetype 에 부적합:

- 후보 1: `form` — Submit 도 input field 도 없음. 강제 룰 4/4 모두 미충족 (form 0/4).
- 후보 2: `feed` — 동질 아이템 스크롤이지만 정보 소비 목적이 아니라 navigation 목적. skeleton/refresh 룰 부적합.
- 후보 3: `detail` — 단일 객체 상세가 아님. hero 영역도 부재.

DE 는 quality-report.yaml 의 `sprint_lead_followup` 섹션에 다음과 같이 보고:

> "현재 archetype enum 6종 중 settings/navigation list 패턴을 정확히 다루는 항목 부재. 임시로 `form` 분류 후 4/4 강제 룰 모두 권장 거절 처리. 7번째 enum `nav_list` 신설 권장."

영향 범위:
- 즉시: app-023
- 향후: 모든 sprint 의 설정/메뉴/인덱스 화면 (앱당 평균 3-5건 추정)

**Pass 6 결과**: app-023 통과 (Pass 6 9/9). persona 단계에서만 fit miss.

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `.claude/teammates/design-engineer-archetypes/nav_list.md` | Create | 신규 persona — 정체성 + 강제 룰 4 + 권장 룰 3 + Good/Anti |
| 1 | `.claude/teammates/design-engineer-archetypes/_index.md` | Modify | Index 표 7번째 행 + 메타 룰 갱신 |
| 2 | `sprint-orchestrator/templates/screen-spec-template.md` | Modify | enum + 가이드 표 7번째 행 |
| 2 | `.claude/teammates/design-engineer.md` | Modify | Step B.1.1 본문 6→7 + 분류 가이드 |

---

## Phase 1 — `nav_list` Persona 파일 작성

### Task 1.1: nav_list.md 신규 작성

**Files:**
- Create: `.claude/teammates/design-engineer-archetypes/nav_list.md`

- [ ] **Step 1: 본문 작성**

다음 내용으로 신규 파일 생성 (다른 persona md 와 동일 구조):

```markdown
# Nav List Persona

## 정체성

설정/계정/도움말 메뉴 — 사용자가 다음 화면으로 이동할 진입점들을 동질 list 로 나열하는 화면. 사용자는 "어디 가야 하지" 모드 — list 항목을 빠르게 스캔하고 정확히 1개를 선택. 핵심 신호: row 단위 list (icon + label + chevron 또는 value) + 그루핑 (섹션 헤더). 예: 설정 메인, 계정 메뉴, 알림 인덱스, 도움말 카테고리, 프로필 메뉴.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | 모든 row 가 동일 높이 (44px 이상, iOS HIG 표준) — 시각 리듬 유지 | 시각 검토 또는 `grep -E "list-row\|min-height: 44" prototype.html` |
| 2 | 각 row 우측에 affordance (chevron `>` 또는 value 또는 toggle) — 무엇이 일어날지 시각적으로 알림 | `screen-spec.yaml > components` 의 list-row 정의에 `trailing` 필드 존재 |
| 3 | 섹션 헤더 또는 명시적 그루핑 — flat 50개 list 금지. 7±2 항목 단위로 그룹 | `grep -E "section-header\|group-label" screen-spec.yaml` 또는 시각 검토 |
| 4 | Primary action 0개 (모든 row 가 동등 navigation 진입점) — 강조 버튼 금지 | 버튼 분류: 모든 row 가 같은 시각 가중치, primary CTA 부재 정상 |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Leading icon 모든 row 동일 크기 (24px 또는 28px) + 동일 색상 룰 — 일관성 | 일부 row 에 icon, 일부에 없음 → 시각 노이즈 |
| 2 | Destructive action (예: "로그아웃", "계정 삭제") 은 별 섹션 + 빨간 텍스트 — 사고 방지 | 일반 row 와 섞이면 사용자가 실수 클릭 |
| 3 | Search bar 상단 sticky (항목 20개 이상 시) — 빠른 접근 | 사용자가 스크롤해서 찾아야 함, 마찰 |

## Good Pattern Examples

- **설정 메인**: "계정" 섹션 (프로필/이메일/비밀번호) → "알림" 섹션 (push/email toggle) → "프라이버시" 섹션 → 최하단 "로그아웃" (단독 섹션, 빨간 텍스트).
- **도움말 인덱스**: search bar sticky → 카테고리 row 6개 (각각 icon + label + chevron) → 하단 "고객센터 문의" text link.
- **계정 메뉴**: 프로필 hero → "내 활동" 섹션 (게시물/좋아요/저장) → "관리" 섹션 (차단/숨김) → 로그아웃.

## Anti-Patterns

- **Row 높이 불균일**: 일부 row 는 44px, 일부는 60px (서브타이틀 포함 등) → 시각 리듬 깨짐. 서브타이틀 필요 시 row 전체 56px 일관.
- **Chevron 없는 navigation row**: 어디로 갈지 시각 단서 부재 → 사용자에게 "버튼인가 정보인가" 혼란.
- **Primary CTA 추가**: 화면 하단에 "저장" 같은 primary 버튼 → nav_list 의 본질 (모두 동등) 위반. instant 저장 토글이면 form archetype + instant_save 사용.
- **Flat 30+ row, 헤더 없음**: 사용자가 스캔 불가. 섹션 헤더 필수.
- **Destructive 가 일반 row 사이 섞임**: "로그아웃" 이 "이메일 변경" 옆에 있으면 사고 위험.

## Form / Feed / Detail 와의 차이

- **vs form**: form 은 input → 서버 제출. nav_list 는 row → 다른 화면 navigation. nav_list 에 toggle 이 섞여 있으면 → form (instant_save) 으로 분류.
- **vs feed**: feed 는 콘텐츠 소비 (사용자가 읽기/보기 의도). nav_list 는 navigation (이동 의도). pull-to-refresh / skeleton 미적용.
- **vs detail**: detail 은 단일 객체. nav_list 는 N개 진입점 동등 나열.
```

- [ ] **Step 2: 라인 수 확인**

Run: `wc -l .claude/teammates/design-engineer-archetypes/nav_list.md`
Expected: 50-70 줄 (다른 persona 와 비슷).

### Task 1.2: _index.md 갱신

**Files:**
- Modify: `.claude/teammates/design-engineer-archetypes/_index.md`

- [ ] **Step 1: Index 표에 7번째 행 추가**

`empty_state` 행 직후에 다음 추가:

```markdown
| nav_list | [nav_list.md](nav_list.md) | row 동일 높이 / 우측 affordance / 섹션 그루핑 / primary CTA 0개 |
```

- [ ] **Step 2: 메타 룰 본문 갱신**

"신규 archetype 추가는 7번째 enum 으로" 문장을 다음으로 교체:

```markdown
- 신규 archetype 추가는 8번째 enum 으로 — Screen Spec template + DE Step B.1.1 + 본 _index.md 동시 갱신
```

- [ ] **Step 3: 정합성 검증**

Run: `grep -c "nav_list" .claude/teammates/design-engineer-archetypes/_index.md`
Expected: 2 (Index 행 + 파일명 링크).

### Task 1.3: Phase 1 commit

- [ ] **Step 1: commit**

```bash
git add .claude/teammates/design-engineer-archetypes/nav_list.md .claude/teammates/design-engineer-archetypes/_index.md
git commit -m "$(cat <<'EOF'
feat(archetype-persona): add nav_list (7th archetype)

ugc-platform-integration-qa-2 dogfood: app-023 (settings) found no
fit in 6-archetype enum. Settings/menu/index screens are navigation
lists, not forms (no input/submit) nor feeds (consumption intent
absent) nor details (no single hero object).

- new persona file with 4 forced rules (uniform row height /
  trailing affordance / section grouping / 0 primary CTA)
- 3 recommended rules (icon consistency / destructive isolation /
  sticky search)
- contrast section vs form/feed/detail to prevent misclassification
- _index.md updated to 7 archetypes

EOF
)"
```

---

## Phase 2 — Meta enum 확장

### Task 2.1: screen-spec-template.md enum 갱신

**Files:**
- Modify: `sprint-orchestrator/templates/screen-spec-template.md`

- [ ] **Step 1: enum 한 줄 갱신**

기존:
```yaml
screen_archetype: "{feed | detail | onboarding | form | modal | empty_state}"
```

변경:
```yaml
screen_archetype: "{feed | detail | onboarding | form | modal | empty_state | nav_list}"
```

- [ ] **Step 2: 가이드 표 7번째 행 추가**

`empty_state` 행 직후 추가:

```markdown
| **nav_list** | 동질 navigation row N개 + 그루핑 + 우측 affordance | 설정 메인, 계정 메뉴, 도움말 인덱스 |
```

- [ ] **Step 3: 정합성 검증**

Run: `grep -c "nav_list" sprint-orchestrator/templates/screen-spec-template.md`
Expected: 2 (enum + 가이드 행).

### Task 2.2: design-engineer.md Step B.1.1 갱신

**Files:**
- Modify: `.claude/teammates/design-engineer.md`

- [ ] **Step 1: 6 enum → 7 enum 본문 갱신**

`### B.1.1 Archetype 분류 (필수)` 본문의 다음 줄:

```
**6 archetypes**: `feed | detail | onboarding | form | modal | empty_state` — ...
```

다음으로 변경:

```
**7 archetypes**: `feed | detail | onboarding | form | modal | empty_state | nav_list` — 각각의 정의·강제 룰·Good/Anti-Pattern 은 `.claude/teammates/design-engineer-archetypes/{archetype}.md` 참조.
```

또한 같은 섹션의 "각 화면에 대해 `screen_spec.yaml > Meta.screen_archetype` 을 6 enum 중 하나로" 를 "7 enum 중 하나로" 로 변경.

- [ ] **Step 2: 분류 흐름에 nav_list 노트 추가**

`### B.1.1 Archetype 분류 (필수)` > `**분류 흐름**:` 표 직후에 다음 한 단락 추가:

```markdown
**`nav_list` vs `form` 구분 가이드** (자주 혼동됨):

- 화면이 "다른 화면으로 가는 진입점" 모음이면 → `nav_list`
- 화면 내에서 값을 변경/제출하면 → `form` (즉시 저장이면 `instant_save: true`)
- 두 패턴 혼합 (상단 toggle + 하단 nav row) → 시각 면적 큰 영역 기준 (Meta 룰)
```

- [ ] **Step 3: 정합성 검증**

Run: `grep -c "nav_list\|7 archetypes\|7 enum" .claude/teammates/design-engineer.md`
Expected: 4 이상.

### Task 2.3: Phase 2 commit

- [ ] **Step 1: commit**

```bash
git add sprint-orchestrator/templates/screen-spec-template.md .claude/teammates/design-engineer.md
git commit -m "$(cat <<'EOF'
feat(screen-spec): expand archetype enum 6 -> 7 (add nav_list)

- screen-spec-template: enum + classification guide row added
- design-engineer Step B.1.1: 6->7 enum text + nav_list vs form
  disambiguation paragraph (most common confusion)

EOF
)"
```

---

## Post-Plan Verification

- [ ] **Step 1: 전체 일관성 검증**

Run: `grep -rn "nav_list" .claude/teammates/ sprint-orchestrator/templates/`
Expected: 6+ 매치 (nav_list.md, _index.md ×2, screen-spec-template.md ×2, design-engineer.md ×4).

- [ ] **Step 2: 다음 sprint 첫 dogfood 시**

settings/menu/index 패턴 화면이 1개 이상 등장 시:
- DE 가 nav_list 분류 선택
- 강제 룰 4/4 통과 (primary CTA 0개 정상화)
- archetype_recommendation_skipped 없음

미통과 시 nav_list.md 강제 룰 정의 재검토.

---

## Open Questions

- [ ] **`nav_list` vs `feed` 경계**: 동질 row N개라는 점에서 feed 와 비슷. 사용자 의도 (소비 vs 이동) 만으로 구분 충분한가? 첫 dogfood 사례에서 모호 케이스 발생 시 정량 기준 추가 (예: row 가 chevron 가지면 nav_list).
- [ ] **profile menu 분류**: 사용자 프로필 메인 화면이 hero (detail 신호) + nav_list (메뉴 row) 혼합. 어느 쪽 우세 판단 표준 필요. 현재는 시각 면적 기준 (Meta 룰) 으로 충분한지 첫 케이스에서 검증.
