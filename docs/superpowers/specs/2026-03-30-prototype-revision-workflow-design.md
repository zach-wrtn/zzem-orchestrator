# Prototype Revision Workflow Design

> HTML 프로토타입 산출물의 보정 워크플로우. minor(Annotation) / major(Live Preview) 분기 + Visual Regression 검증.

## 동기

프로토타입 생성 후 사용자가 `revise`를 선택했을 때, 구체적인 보정 흐름이 없었다. 보정 규모에 따라 적절한 워크플로우를 제공하고, 수정 전후를 시각적으로 비교하여 의도한 변경만 반영되었는지 확인할 수 있어야 한다.

## 범위

- Phase 3.3 리뷰의 `revise` 경로에 minor/major 분기 추가
- minor: Annotation 방식 (텍스트 피드백 → 수정 → before/after)
- major: Live Preview 방식 (로컬 서버 + 실시간 수정 루프)
- Visual Regression: before/after side-by-side 스크린샷 비교 (공통)

---

## 1. Revision 분기 (minor vs major)

사용자가 `revise`를 선택하면 Sprint Lead가 피드백 내용으로 보정 규모를 자동 판단한다.

### 판단 기준

| 분류 | 기준 | 예시 |
|------|------|------|
| **minor** | CSS/콘텐츠 수정 — 구조 변경 없음 | 간격, 색상, 크기, 텍스트, 폰트 |
| **major** | 레이아웃 구조, 컴포넌트, 인터랙션 변경 | 탭 순서, 컴포넌트 추가/삭제, 새 상태, 내비게이션 수정 |

**규칙**: 사용자에게 minor/major를 묻지 않는다. 피드백 내용에서 자동 판단. 애매하면 major로 처리 (더 안전한 경로).

---

## 2. Minor Revision — Annotation 방식

텍스트 피드백 → 수정 → before/after 비교의 단순 루프.

### 흐름

```
1. 사용자 피드백 수집
   "카드 간격 16px → 24px, 아바타 40px → 48px"

2. baseline 보존
   screenshots/ → baseline/ 복사 (최초 revise 시 1회)

3. Design Engineer: prototype.html 수정

4. 자동 스크린샷 재캡처
   변경된 스크린만 재캡처 (Screen Spec의 states 기준)

5. before/after 제시
   browse 스킬로 baseline과 신규 스크린샷을 side-by-side로 보여줌

6. 사용자 확인
   ├─ approve → baseline/ 삭제, 완료
   ├─ revise → 3번으로 돌아감
   └─ reject → baseline 복원, 프로토타입 제외
```

### Sprint Lead → Design Engineer 지시 형식

```
TaskCreate:
  Subject: revise/minor/app/{task-id}
  Description: |
    피드백:
    - 카드 간격 16px → 24px
    - 아바타 크기 40px → 48px
    대상 파일: prototypes/app/{task-id}/prototype.html
    변경 스크린: FeedScreen
  Owner: Design Engineer
```

Design Engineer는 피드백 항목을 하나씩 반영하고, 반영 완료 후 `TaskUpdate: completed`.

---

## 3. Major Revision — Live Preview 방식

로컬 서버를 띄우고 사용자가 브라우저에서 직접 확인하면서 실시간 수정 루프.

### 흐름

```
1. baseline 보존
   screenshots/ → baseline/ 복사

2. 로컬 서버 시작
   Sprint Lead: python3 -m http.server 8080 --directory prototypes/app/{task-id}/
   사용자에게 URL 안내: http://localhost:8080/prototype.html

3. 수정 루프 (사용자와 대화형)
   사용자: "이 탭 순서 바꿔줘"
     → Design Engineer: prototype.html 수정
     → 사용자: 브라우저 새로고침
     → 사용자: "좋아" 또는 "여기도 수정해줘"
     → 반복

4. 수정 완료 선언
   사용자: "이제 됐어" 또는 "approve"

5. 최종 스크린샷 캡처 + before/after 비교
   전체 스크린 × 전체 상태 재캡처
   baseline과 side-by-side 비교 제시

6. 사용자 최종 확인
   ├─ approve → baseline/ 삭제, 로컬 서버 종료, 완료
   └─ revise → 3번으로 돌아감
```

### Sprint Lead → Design Engineer 지시 형식

```
TaskCreate:
  Subject: revise/major/app/{task-id}
  Description: |
    모드: live-preview
    피드백:
    - 탭 순서 변경: 인기 → 팔로잉 → 맞춤형
    - 새로운 바텀시트 추가: 공유 옵션
    대상 파일: prototypes/app/{task-id}/prototype.html
    로컬 서버: http://localhost:8080/prototype.html
  Owner: Design Engineer
```

**minor와의 차이점**: Design Engineer가 수정할 때마다 완료 보고를 하지 않고, 사용자가 approve할 때까지 대화형으로 계속 수정.

---

## 4. Visual Regression — before/after 비교

minor와 major 모두 수정 후 공통으로 실행되는 검증 단계.

### 디렉토리 구조

```
sprints/{sprint-id}/prototypes/app/{task-id}/
├── prototype.html
├── screenshots/                 # 최신 (수정 후)
│   ├── FeedScreen-default.png
│   ├── FeedScreen-loading.png
│   └── ...
└── baseline/                    # 수정 전 (revise 시 자동 생성)
    ├── FeedScreen-default.png
    ├── FeedScreen-loading.png
    └── ...
```

### 동작 규칙

| 시점 | 동작 |
|------|------|
| 최초 revise 진입 | `screenshots/` → `baseline/` 복사 |
| 연속 revise (baseline 이미 존재) | baseline 유지, screenshots만 갱신 |
| approve | `baseline/` 삭제 |
| reject | `baseline/` → `screenshots/` 복원 후 baseline 삭제 |

### side-by-side 제시 형식

browse 스킬로 캡처한 스크린샷을 대화 내에서 제시:

```markdown
## Revision 비교: FeedScreen

| Before | After |
|--------|-------|
| baseline/FeedScreen-default.png | screenshots/FeedScreen-default.png |

변경 사항:
- 카드 간격 16px → 24px
- 아바타 크기 40px → 48px
```

변경되지 않은 스크린은 제시하지 않음 — 변경된 스크린만 비교.

### approval-status.yaml 확장

```yaml
tasks:
  {task-id}:
    {ScreenName}:
      status: approved
      prototype: "prototype.html#{ScreenName}"
      screenshot: "screenshots/{ScreenName}-default.png"
      states_captured: [default, loading, empty, error]
      revision_count: 2          # revise 횟수
      last_revision: "minor"     # 마지막 revise 유형
      quality_score: "{schema_completeness score}"
      fabrication_risk: "{none | low | medium}"
      reviewed_at: null
      notes: ""
```

---

## 5. 변경 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `.claude/teammates/design-engineer.md` | revise/minor, revise/major 태스크 처리 프로토콜 추가 |
| `.claude/skills/sprint/SKILL.md` | Phase 3.3 리뷰에 revision 분기 + Visual Regression 추가 |
