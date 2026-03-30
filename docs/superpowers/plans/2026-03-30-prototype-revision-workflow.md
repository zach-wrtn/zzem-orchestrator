# Prototype Revision Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add minor/major revision paths and visual regression (before/after side-by-side) to the prototype review workflow.

**Architecture:** Extend Phase 3.3 in sprint SKILL.md with revision branching logic and baseline management. Add revision task handling protocol to Design Engineer. Both revise paths converge on a shared Visual Regression comparison step.

**Tech Stack:** Markdown protocol docs (no code — these are agent instruction files)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `.claude/skills/sprint/SKILL.md` (Phase 3.3) | Revision branching, baseline management, Visual Regression, approval-status extension |
| Modify | `.claude/teammates/design-engineer.md` | Revision task handling (minor + major protocols) |

---

### Task 1: Update Sprint SKILL.md Phase 3.3 with revision workflow

**Files:**
- Modify: `.claude/skills/sprint/SKILL.md` (lines 181-221)

Replace the existing 3.3 리뷰 section with the full revision workflow including minor/major branching, baseline management, and visual regression.

- [ ] **Step 1: Replace Phase 3.3 section**

Find the section from `#### 3.3 리뷰 (Sprint Lead ↔ 사용자)` up to (but not including) `#### 3.4 Gate → Phase 4`. Replace with:

```markdown
#### 3.3 리뷰 (Sprint Lead ↔ 사용자)

각 프로토타입을 사용자에게 순차 리뷰:

**리뷰 방법**:
1. 자동 스크린샷 캡처 (browse 스킬) — 각 스크린 × 각 상태별
2. 스크린샷을 대화 내에서 제시
3. 필요 시 브라우저에서 prototype.html 직접 열어 인터랙션 확인 안내

| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크에 `## Prototype Reference` 추가 |
| **reject** | 상태 기록, 프로토타입 참조 제외 |
| **revise** | 아래 Revision 워크플로우 실행 |
| **skip** | pending 유지, 다음 화면 |

**`## Prototype Reference` 형식** (approve 시 태스크에 추가):
```markdown
## Prototype Reference
- **프로토타입**: `prototypes/app/{task-id}/prototype.html`
- **스크린샷**: `prototypes/app/{task-id}/screenshots/`
- **상태**: approved
```

#### 3.3.1 Revision 분기

사용자가 `revise`를 선택하면 Sprint Lead가 피드백 내용으로 보정 규모를 자동 판단한다.

| 분류 | 기준 | 예시 |
|------|------|------|
| **minor** | CSS/콘텐츠 수정 — 구조 변경 없음 | 간격, 색상, 크기, 텍스트, 폰트 |
| **major** | 레이아웃 구조, 컴포넌트, 인터랙션 변경 | 탭 순서, 컴포넌트 추가/삭제, 새 상태, 내비게이션 수정 |

**규칙**: 사용자에게 minor/major를 묻지 않는다. 피드백 내용에서 자동 판단. 애매하면 major로 처리.

#### 3.3.2 Baseline 관리

revise 진입 시 수정 전 스크린샷을 보존하여 before/after 비교에 사용한다.

```
sprints/{sprint-id}/prototypes/app/{task-id}/
├── prototype.html
├── screenshots/                 # 최신 (수정 후)
└── baseline/                    # 수정 전 (revise 시 자동 생성)
```

| 시점 | 동작 |
|------|------|
| 최초 revise 진입 | `screenshots/` → `baseline/` 복사 |
| 연속 revise (baseline 이미 존재) | baseline 유지, screenshots만 갱신 |
| approve | `baseline/` 삭제 |
| reject | `baseline/` → `screenshots/` 복원 후 baseline 삭제 |

#### 3.3.3 Minor Revision (Annotation 방식)

```
1. 사용자 피드백 수집
2. baseline 보존 (3.3.2 규칙)
3. Design Engineer에게 수정 태스크 할당:
   TaskCreate:
     Subject: revise/minor/app/{task-id}
     Description: |
       피드백:
       - {피드백 항목 1}
       - {피드백 항목 2}
       대상 파일: prototypes/app/{task-id}/prototype.html
       변경 스크린: {ScreenName}
     Owner: Design Engineer
4. Design Engineer 수정 완료 후 자동 스크린샷 재캡처
5. Visual Regression 비교 (3.3.5)
6. 사용자 확인 → approve / revise / reject
```

#### 3.3.4 Major Revision (Live Preview 방식)

```
1. baseline 보존 (3.3.2 규칙)
2. 로컬 서버 시작:
   python3 -m http.server 8080 --directory sprints/{sprint-id}/prototypes/app/{task-id}/
   사용자에게 안내: http://localhost:8080/prototype.html
3. Design Engineer에게 수정 태스크 할당:
   TaskCreate:
     Subject: revise/major/app/{task-id}
     Description: |
       모드: live-preview
       피드백:
       - {피드백 항목 1}
       - {피드백 항목 2}
       대상 파일: prototypes/app/{task-id}/prototype.html
       로컬 서버: http://localhost:8080/prototype.html
     Owner: Design Engineer
4. 대화형 수정 루프:
   사용자 피드백 → Design Engineer 수정 → 사용자 새로고침 → 반복
5. 사용자가 "approve" 또는 "이제 됐어" 선언
6. 최종 스크린샷 캡처 + Visual Regression 비교 (3.3.5)
7. 사용자 최종 확인 → approve / revise
8. 로컬 서버 종료
```

#### 3.3.5 Visual Regression (before/after 비교)

minor와 major 모두 수정 후 공통으로 실행.

1. 변경된 스크린만 식별 (전체 스크린 × 전체 상태 재캡처 후 baseline과 비교)
2. 변경된 스크린의 before/after를 side-by-side로 제시:

```markdown
## Revision 비교: {ScreenName}

| Before | After |
|--------|-------|
| baseline/{ScreenName}-default.png | screenshots/{ScreenName}-default.png |

변경 사항:
- {피드백 항목 1 반영}
- {피드백 항목 2 반영}
```

3. 변경되지 않은 스크린은 제시하지 않음

#### 3.3.6 approval-status.yaml 확장

revise를 거친 프로토타입에 revision 추적 필드를 추가:

```yaml
tasks:
  {task-id}:
    {ScreenName}:
      status: approved
      prototype: "prototype.html#{ScreenName}"
      screenshot: "screenshots/{ScreenName}-default.png"
      states_captured: [default, loading, empty, error]
      revision_count: 2          # revise 횟수 (0이면 1회에 approve)
      last_revision: "minor"     # 마지막 revise 유형 (minor | major | null)
      quality_score: "{schema_completeness score}"
      fabrication_risk: "{none | low | medium}"
      reviewed_at: null
      notes: ""
```
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sprint/SKILL.md
git commit -m "feat: add revision workflow to sprint SKILL.md Phase 3.3

Minor (annotation) and major (live preview) revision paths with
baseline management and visual regression comparison.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add revision task handling to Design Engineer

**Files:**
- Modify: `.claude/teammates/design-engineer.md` (insert after the `## Activity Logging` section, before `## Constraints`)

Add a new section defining how Design Engineer handles `revise/minor` and `revise/major` tasks.

- [ ] **Step 1: Insert Revision Protocol section**

Insert the following before `## Constraints` (currently at line 618):

```markdown
## Revision Protocol

Design Engineer가 Sprint Lead로부터 revision 태스크를 받았을 때의 처리 프로토콜.

### Revision 태스크 식별

| Subject 패턴 | 유형 | 처리 방식 |
|-------------|------|----------|
| `revise/minor/app/{task-id}` | Minor | Annotation — 피드백 반영 후 완료 보고 |
| `revise/major/app/{task-id}` | Major | Live Preview — 사용자 approve까지 대화형 수정 |

### Minor Revision 처리

```
1. 태스크 Description에서 피드백 항목과 변경 스크린 확인
2. prototype.html 읽기
3. 피드백 항목을 순서대로 반영:
   - CSS 변경: 해당 스타일 수정
   - 콘텐츠 변경: HTML 텍스트 수정
   - 크기/간격 변경: 인라인 스타일 또는 CSS 변수 조정
4. 수정된 스크린을 셀프 검증 (변경 의도와 결과 일치 확인)
5. TaskUpdate: completed
   Sprint Lead에게: "Minor revision 완료. 변경: {변경 요약}. 재캡처 대기."
```

### Major Revision 처리

```
1. 태스크 Description에서 피드백 항목과 로컬 서버 URL 확인
2. prototype.html 읽기
3. 피드백 항목 중 첫 번째부터 반영
4. 반영 후 Sprint Lead에게 메시지:
   "수정 완료: {변경 내용}. 브라우저 새로고침 후 확인해 주세요."
5. 추가 피드백 대기 → 반영 → 메시지 → 반복
6. 사용자가 approve하면 TaskUpdate: completed
   Sprint Lead에게: "Major revision 완료. 총 {N}건 수정."
```

### Revision 공통 규칙

- **Screen Spec 미수정**: revision은 prototype.html만 수정한다. Screen Spec(.spec.md)은 변경하지 않는다.
- **구조 보존**: minor revision에서 HTML 구조(section, data-state 등)를 변경하지 않는다. CSS와 콘텐츠만 수정.
- **변경 최소화**: 피드백에 명시된 항목만 수정한다. 관련 없는 부분을 함께 개선하지 않는다.
- **tokens.css 유지**: 디자인 토큰 값을 직접 수정하지 않는다. 토큰 변경이 필요하면 Sprint Lead에 보고.
```

### Revision Logging

| 프로토콜 단계 | phase | message 예시 |
|-------------|-------|-------------|
| Revision 수령 | `revision_started` | "Minor revision 수령: 카드 간격, 아바타 크기" |
| 항목 반영 | `revision_applying` | "피드백 1/3 반영: 카드 간격 16px → 24px" |
| Revision 완료 | `revision_completed` | "Minor revision 완료. 2건 반영." |
```

- [ ] **Step 2: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "feat: add revision protocol to Design Engineer

Minor and major revision handling, common rules, and logging.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Final verification

- [ ] **Step 1: Verify revision workflow references are consistent**

```bash
grep -n "revise/minor\|revise/major\|baseline\|Visual Regression\|revision_count\|last_revision" .claude/skills/sprint/SKILL.md .claude/teammates/design-engineer.md
```

Expected: Matching terminology in both files.

- [ ] **Step 2: Verify no conflicts with existing content**

```bash
grep -n "3\.3\." .claude/skills/sprint/SKILL.md
```

Expected: 3.3.1 through 3.3.6 subsections present, no duplicate numbering.

- [ ] **Step 3: Commit any fixes if needed**
