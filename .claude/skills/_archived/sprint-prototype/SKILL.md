---
name: sprint-prototype
description: Generate high-fidelity UI prototypes from app task specifications using Google Stitch. Use when the user wants to create UI mockups before sprint execution, or says /sprint-prototype.
---

# Sprint Prototype

## Goal

App 태스크의 Specification(화면, 인터랙션, 비즈니스 룰)을 Google Stitch에 전달하여 고충실도 모바일 UI 목업을 생성하고, 리뷰/승인 후 구현 참조로 연결한다.

## Invocation

```
/sprint-prototype <sprint-id>                  # 전체 app 태스크 프로토타입 생성
/sprint-prototype <sprint-id> <task-id>        # 단일 태스크 프로토타입
/sprint-prototype <sprint-id> --review         # 기존 프로토타입 리뷰 모드
```

## Workflow

### 1. 사전 확인

- 스프린트 디렉토리 존재 확인: `sprint-orchestrator/sprints/{sprint-id}/`
- `tasks/app/` 하위 태스크 파일 목록 수집
- backend 태스크는 자동 스킵 (UI 없음)
- `Screens / Components` 섹션이 없는 app 태스크도 스킵 (예: 순수 로직 태스크)

### 2. 태스크별 화면 추출

각 app 태스크 파일에서:

1. `### Screens / Components` 섹션 파싱
2. 최상위 화면 식별 (Screen, View, BottomSheet로 끝나는 항목)
3. 하위 컴포넌트를 부모 화면에 그룹화
4. **화면 단위로** Stitch 프롬프트 구성 (태스크 단위가 아님)

예시:
```
001-profile-screen.md
  → ProfileScreen (포함: ProfileHeader, ProfileContentTabs, ContentGrid)

003-block-report-ui.md
  → ReportScreen
  → OpinionScreen
  → BlockedProfileView
```

### 3. Stitch 프롬프트 구성

`sprint-orchestrator/templates/stitch-prompt-template.md` 템플릿을 참고하여 각 화면의 프롬프트를 조립한다.

**입력 소스** (태스크 파일에서 추출):
- `### Screens / Components` → Layout & Components
- `### User Interactions` → User Flow
- `### Business Rules` → Visual Rules (UI 관련 항목만 필터)

**출력**: 화면별 `stitch-prompt.md` 파일

### 4. Stitch 호출

**Mode A: MCP Server (Primary)**

Stitch MCP 서버가 설정되어 있으면 직접 호출:
- MCP tool로 프롬프트 전달
- HTML/CSS 결과 수신
- 스크린샷 생성 (가능한 경우)

**Mode B: Manual Fallback**

MCP가 없거나 실패하면:
1. 구성된 프롬프트를 `stitch-prompt.md`에 저장
2. 사용자에게 안내:
   ```
   Stitch MCP를 사용할 수 없습니다.
   아래 프롬프트를 stitch.withgoogle.com에 붙여넣어 주세요:

   [프롬프트 전문 출력]

   생성된 HTML을 아래 경로에 저장해 주세요:
   prototypes/app/{task-id}/{ScreenName}.html
   ```
3. 사용자가 HTML 파일을 저장한 후 `--review` 모드로 리뷰 진행

### 5. 결과 저장

```
sprint-orchestrator/sprints/{sprint-id}/prototypes/
└── app/
    ├── {task-id}/
    │   ├── {ScreenName}.html          # Stitch HTML 출력
    │   ├── {ScreenName}.png           # 스크린샷 (있으면)
    │   └── stitch-prompt.md           # 재현용 프롬프트
    └── approval-status.yaml           # 리뷰 상태 추적
```

`approval-status.yaml` 형식:
```yaml
tasks:
  001-profile-screen:
    ProfileScreen:
      status: pending          # pending | approved | rejected | revision-requested
      reviewed_at: null
      notes: ""
  003-block-report-ui:
    ReportScreen:
      status: pending
    OpinionScreen:
      status: pending
    BlockedProfileView:
      status: pending
```

### 6. 리뷰/승인

각 프로토타입에 대해 순차적으로 리뷰를 진행한다.

#### 6a. 프레젠테이션

```
─────────────────────────────────────────
Prototype: 001-profile-screen / ProfileScreen
File: prototypes/app/001-profile-screen/ProfileScreen.html
Components: ProfileHeader, ProfileContentTabs, ContentGrid, ...

브라우저에서 열기? [Y/n]:
─────────────────────────────────────────
```

Y → `open {html-file-path}` (macOS)

#### 6b. 결정

```
ProfileScreen 상태? [approve/reject/revise/skip]:
```

| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크 파일에 Prototype Reference 추가 |
| **reject** | 상태 기록, 해당 화면 프로토타입 참조 제외 |
| **revise** | 사용자 피드백 입력 → 프롬프트에 추가 → Stitch 재호출 |
| **skip** | pending 상태 유지, 다음 화면으로 이동 |

#### 6c. Revision Loop

revise 선택 시:
1. 사용자로부터 수정 피드백 입력받기
2. 기존 `stitch-prompt.md`에 피드백 추가
3. Stitch 재호출 (또는 수동 재생성 안내)
4. 새 결과로 HTML 파일 덮어쓰기
5. 다시 리뷰 단계로

### 7. 태스크 파일 연결

승인된 프로토타입을 해당 app 태스크 파일에 추가:

```markdown
## Prototype Reference
- Approved: ../prototypes/app/{task-id}/{ScreenName}.html
- Key visual decisions:
  - {승인 시 노트 또는 HTML 구조에서 자동 요약}
```

이 섹션은 `## Implementation Hints`와 `## Acceptance Criteria` 사이에 삽입한다.

### 8. 결과 출력

```
Sprint Prototype: {sprint-id}

  Generated:
    001-profile-screen
      ProfileScreen          ✓ approved
    001-feed-publish-toggle-cta
      SwipeFeedPublishView   ✓ approved
      UnpublishBottomSheet   ✓ approved
    002-follow-ui
      FollowerListScreen     → revision-requested
    003-block-report-ui
      ReportScreen           ○ pending
      OpinionScreen          ○ pending
      BlockedProfileView     ○ pending
    004-persona-handling     (skipped — no screens)

  Summary: 3/8 approved, 1 revision, 3 pending, 1 skipped

Next: 모든 프로토타입 승인 후 → /sprint-run {sprint-id}
```

## Gate 역할

`/sprint-run` 실행 시 `approval-status.yaml`을 확인한다:
- `pending` 또는 `rejected` 상태 태스크가 있으면 경고 출력
- `--force` 플래그로 무시 가능

## Constraints

- backend 태스크는 프로토타입 대상이 아님
- `Screens / Components` 섹션이 없는 app 태스크는 자동 스킵
- 프로토타입은 시각적 참조일 뿐, 코드를 그대로 복사하지 않음
- 한국어 UI 라벨을 프롬프트에 명시적으로 포함
- `stitch-prompt.md`는 항상 보존 (재현성 보장)
