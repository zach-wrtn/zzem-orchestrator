# Prototype Production Guide

> Sprint Phase 3에서 HTML 프로토타입을 제작·리뷰·PRD 추출하는 전체 프로세스 메뉴얼.

---

## 1. Overview

프로토타입은 **시각적 Source of Truth**로, PRD의 추상적 요구사항을 구체적 UI로 확정하는 역할을 한다.

```
PRD (추상) ──► 태스크 Spec ──► HTML 프로토타입 (구체) ──► 리뷰/개정 ──► Refined PRD ──► Build
```

### 핵심 원칙

1. **Self-contained**: 외부 의존성 없이 브라우저에서 독립 실행 (Pretendard 폰트만 CDN)
2. **Interactive**: control panel로 스크린/상태 전환, 인터랙션 시뮬레이션
3. **Device-realistic**: 390×844px 디바이스 프레임으로 실제 모바일 경험 재현
4. **Reviewable**: 사용자가 직접 브라우저에서 조작하며 피드백

---

## 2. 프로토타입 구조

### 2.1 파일 구조

```
sprints/{sprint-id}/prototypes/
├── app/
│   ├── {task-id}/
│   │   ├── prototype.html        # 프로토타입 본체
│   │   ├── screenshots/          # 최신 스크린샷 (상태별)
│   │   └── baseline/             # revision 전 스크린샷 (비교용)
│   └── {task-id}/
│       └── ...
├── approval-status.yaml          # 화면별 승인 상태
├── prd-amendment.md              # Phase 3.4 산출물 (revision 피드백 기반)
└── refined-prd.md                # Phase 3.5 산출물 (프로토타입 기반 PRD)
```

### 2.2 HTML 템플릿 구조

템플릿: `sprint-orchestrator/templates/html-prototype-template.html`

```
┌─────────────────────────────────┐
│  Control Panel (리뷰어용)        │ ← 디바이스 프레임 외부
│  ├── Screen select (드롭다운)    │    스크린 간 이동
│  ├── State toggles (버튼)       │    상태 전환 (default/loading/error/...)
│  └── Breadcrumb                 │    네비게이션 경로 표시
├─────────────────────────────────┤
│                                 │
│  Device Frame (390×844px)       │ ← 실제 프로토타입 영역
│  ├── Screen 1 (.screen.active)  │
│  ├── Screen 2 (.screen)         │
│  └── Screen N (.screen)         │
│                                 │
│  각 Screen 내부:                │
│  ├── [data-state="default"]     │    상태별 분기 UI
│  ├── [data-state="loading"]     │
│  └── [data-state="error"]       │
│                                 │
└─────────────────────────────────┘
```

### 2.3 핵심 JavaScript API

| 함수 | 용도 | 예시 |
|------|------|------|
| `navigate(screenId, transition)` | 스크린 전환 | `navigate('detail-screen', 'slide-left')` |
| `goBack()` | 이전 스크린으로 복귀 | 뒤로가기 버튼에 바인딩 |
| `applyState(screenId, stateName)` | 상태 전환 | `applyState('home', 'loading')` |
| `toggleState(stateName)` | 현재 스크린 상태 토글 | control panel 버튼에 바인딩 |
| `openOverlay(overlayId)` | 오버레이/바텀시트 열기 | `openOverlay('confirm-dialog')` |
| `closeOverlay()` | 오버레이 닫기 | backdrop 클릭에 바인딩 |

### 2.4 트랜지션 종류

| 클래스 | 애니메이션 | 용도 |
|--------|-----------|------|
| `transition-slide-left` | 우→좌 슬라이드 | 전진 네비게이션 |
| `transition-slide-right` | 좌→우 슬라이드 | 뒤로가기 |
| `transition-slide-up` | 하→상 슬라이드 | 바텀시트/모달 |
| `transition-fade` | 페이드 인 | 탭 전환 |
| `transition-slide-down` | 상→하 슬라이드 | 오버레이 닫기 |

---

## 3. 제작 프로세스

### 3.1 입력 확인

프로토타입 제작 전 다음을 확인한다:

| 입력 | 소스 | 필수 |
|------|------|------|
| 태스크 Spec | `tasks/app/{task-id}.md` | 필수 — `### Screens / Components` 섹션 |
| API Contract | `api-contract.yaml` | 필수 — 데이터 스키마 참조 |
| PRD AC | `PRD.md` 또는 원본 PRD | 필수 — Given/When/Then |
| 디자인 토큰 | `wds-tokens/` submodule | 권장 — 색상, 타이포, 간격 |
| Figma 디자인 | Figma URL (있을 경우) | 선택 — 시각 레퍼런스 |

### 3.2 제작 단계

```
1. 태스크 Spec에서 스크린/컴포넌트 목록 추출
   └── ### Screens / Components 테이블 참조

2. 각 스크린의 상태(state) 목록 정의
   └── default, loading, empty, error, 도메인 특화 상태

3. 컴포넌트 계층 설계
   └── 상위 → 하위 컴포넌트 트리

4. HTML 작성 (html-prototype-template.html 기반)
   ├── Control Panel: screen select + state toggles
   ├── Device Frame: 각 스크린 마크업
   ├── CSS: 디자인 토큰 적용
   └── JS: 인터랙션 바인딩

5. 로컬 브라우저에서 검증
   └── 모든 스크린 × 모든 상태 × 인터랙션 확인
```

### 3.3 디자인 토큰 적용

```css
:root {
  /* Brand */
  --color-brand-primary: #8752FA;

  /* Background */
  --color-bg-normal: #FFFFFF;

  /* Text */
  --color-label-normal: #212228;
  --color-label-assistive: #8E9199;

  /* Fill */
  --color-fill-neutral: #F0F1F3;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

> 전체 토큰은 `wds-tokens/` submodule 참조.

### 3.4 샘플 데이터 규칙

| 규칙 | 예시 |
|------|------|
| 한국어 사용 | "웃기는 변신 챌린지", "밈마스터" |
| 현실적인 수치 | 좋아요 1.2K, 892, 3.4K (1자리 정밀도) |
| 다양한 길이 | 짧은 이름 + 긴 이름 (말줄임 테스트) |
| Placeholder 이미지 | 색상 그라디언트 사각형 (실제 이미지 대신) |
| 높이 변화 | 매거진 레이아웃은 카드 높이를 180~260px로 랜덤 배치 |

---

## 4. 리뷰 프로세스

### 4.1 리뷰 방법

1. **브라우저 직접 열기**: `open prototype.html`
2. **통합 뷰어 사용**: `sprint-orchestrator/prototypes/index.html` (PRD 기준 사이드바)
3. **Control Panel 조작**: 스크린 전환, 상태 토글로 모든 경우 확인

### 4.2 리뷰 판정

| 판정 | 의미 | 후속 |
|------|------|------|
| **approve** | PRD 요구사항 부합 | `approval-status.yaml` 업데이트, 태스크에 Prototype Reference 추가 |
| **revise** | 수정 필요 | Sprint Lead가 minor/major 자동 판단 → revision 워크플로우 |
| **reject** | 전면 재작업 | 프로토타입 참조 제외 |
| **skip** | 나중에 리뷰 | pending 유지 |

### 4.3 Revision 워크플로우

```
사용자 피드백
  │
  ├─ minor (CSS/콘텐츠 수정, 구조 변경 없음)
  │   └── Annotation 방식: 피드백 → 수정 → 스크린샷 재캡처 → Visual Regression
  │
  └─ major (레이아웃/컴포넌트/인터랙션 변경)
      └── Live Preview 방식: 로컬 서버 → 대화형 수정 루프 → 최종 스크린샷
```

#### Minor vs Major 판단 기준

| Minor | Major |
|-------|-------|
| 간격, 색상, 크기, 폰트 | 레이아웃 구조 변경 |
| 텍스트/라벨 수정 | 컴포넌트 추가/삭제 |
| 아이콘 교체 | 새로운 상태 추가 |
| 정렬 조정 | 네비게이션 수정 |

> Sprint Lead가 피드백 내용에서 자동 판단. 애매하면 major로 처리.

#### Baseline 관리

| 시점 | 동작 |
|------|------|
| 최초 revise 진입 | `screenshots/` → `baseline/` 복사 |
| 연속 revise | baseline 유지, screenshots만 갱신 |
| approve | `baseline/` 삭제 |
| reject | `baseline/` → `screenshots/` 복원 후 삭제 |

#### Visual Regression

수정 후 변경된 스크린만 before/after로 제시:

```markdown
## Revision 비교: HomeScreen

| Before | After |
|--------|-------|
| baseline/HomeScreen-default.png | screenshots/HomeScreen-default.png |

변경 사항:
- 헤더 알림 벨 아이콘 크기 24px → 20px
- 랭킹 섹션 Top 4 → Top 3
```

### 4.4 approval-status.yaml 형식

```yaml
tasks:
  APP-001:
    HomeScreen:
      status: approved           # approved | rejected | pending
      prototype: "prototype.html#HomeScreen"
      screenshot: "screenshots/HomeScreen-default.png"
      states_captured: [default, notification-badge, ranking-expanded]
      revision_count: 1          # revise 횟수
      last_revision: "minor"     # minor | major | null
      quality_score: 0.9
      fabrication_risk: "low"    # none | low | medium
      reviewed_at: "2026-04-01T10:00:00Z"
      notes: ""
```

---

## 5. PRD 추출 프로세스

프로토타입이 revised + approved 되면, 두 단계의 PRD 추출이 실행된다.

### 5.1 Phase 3.4: PRD Amendment Extraction (Delta)

**목적**: revision 피드백에서 원본 PRD의 **갭**을 역추출.

```
revision 피드백 → PRD 갭 분류 → 개정안 생성 → 사용자 판정 (apply/defer/dismiss)
```

| Revision 시그널 | PRD 갭 유형 | 개정안 카테고리 |
|----------------|-----------|-------------|
| Major + 새 컴포넌트 | AC 누락 | `new_ac` |
| Minor + 텍스트 변경 | AC 모호 | `clarify_ac` |
| Major + 레이아웃 변경 | UI 명세 부재 | `add_ui_spec` |
| fabrication_risk: medium + approved | 암묵적 요구사항 | `implicit_req` |
| 다수 화면 동일 패턴 revision | 공통 규칙 누락 | `add_rule` |

**산출물**: `prototypes/prd-amendment.md`

### 5.2 Phase 3.5: Prototype-Driven PRD Refinement (Full Spec)

**목적**: 승인된 프로토타입 HTML에서 **구체적 요구사항**을 역추출.

```
approved prototype.html → HTML 분석 → 요구사항 구조화 → 원본 PRD diff → refined-prd.md
```

#### 추출 대상

| 카테고리 | 분석 소스 | 추출 항목 |
|---------|---------|---------|
| **UI Components** | DOM 구조 | 컴포넌트 계층, 속성, 크기/간격 |
| **Screen States** | `#state-toggles`, `[data-state]` | 상태 목록, 상태별 UI 차이 |
| **Interactions** | `onclick`, `navigate()`, JS 이벤트 | 인터랙션 매핑 (요소 → 동작 → 결과) |
| **Data Schema** | placeholder 데이터 | 표시 필드, 포맷, 제약 (말줄임 등) |
| **Layout Rules** | CSS 분석 | 열 수, 간격, 스크롤 방향, sticky |
| **Edge Case UI** | 상태 분기 | 빈 상태, 에러 상태, 로딩 상태 |

#### refined-prd.md 구조

```markdown
# Refined PRD: {sprint-id}

## {task-id}: {Screen Name}

### Components
| Component | Properties | Notes |

### States
| State | Trigger | UI Changes |

### Interactions
| Element | Action | Result |

### Data Schema
| Field | Type | Format | Constraints |

### Layout
| Rule | Value |

### Diff from Original PRD
| Type | AC | Detail |
| new | — | 프로토타입에만 존재 |
| refined | AC 4.1 | 원본 → 구체화 |
| unchanged | AC 1.1 | 일치 |
```

#### 사용자 판정

| 선택 | 동작 |
|------|------|
| **accept** | refined-prd 기준으로 태스크 spec AC 전면 갱신 |
| **partial** | 선택 항목만 반영 |
| **review-only** | 기록만 유지, 참조 자료로 활용 |

### 5.3 Phase 3.4 ↔ 3.5 관계

```
Phase 3.4                          Phase 3.5
┌──────────────────┐               ┌──────────────────┐
│ 입력: 피드백      │               │ 입력: prototype  │
│ 분석: 무엇이 바뀜 │               │ 분석: 무엇이 있음 │
│ 산출: 개정안 목록  │    ──순서──►  │ 산출: 전체 명세   │
│ (delta)          │               │ (full spec)      │
└──────────────────┘               └──────────────────┘
```

3.4에서 apply된 항목은 3.5의 diff에서 `unchanged`로 표시되어 중복 반영을 방지한다.

---

## 6. 통합 프로토타입 뷰어

### 6.1 위치

`sprint-orchestrator/prototypes/index.html`

### 6.2 기능

- **PRD 기준 사이드바**: 스프린트를 PRD별로 그룹화 (접기/펼치기)
- **iframe 렌더링**: 선택한 프로토타입을 iframe으로 표시
- **키보드 네비게이션**: `↑↓` 이동, `1-9` 점프, "Open in New Tab"
- **히스토리 추적**: 모든 스프린트의 프로토타입을 한 곳에서 탐색

### 6.3 프로토타입 등록

새 스프린트의 프로토타입 추가 시 `SPRINTS` 배열에 항목 추가:

```javascript
// sprint-orchestrator/prototypes/index.html
const SPRINTS = [
  {
    id: 'zzem-home-001',
    prd: 'PRD-002',
    name: 'ZZEM Home',
    description: 'ZZEM 앱 홈 화면',
    prototypes: [
      {
        id: 'APP-001',
        name: 'Home Screen',
        type: 'app',
        path: '../sprints/zzem-home-001/prototypes/app/APP-001-home-screen/prototype.html'
      }
    ]
  },
  // 새 스프린트 추가
];
```

---

## 7. 체크리스트

### 프로토타입 제작 체크리스트

- [ ] 태스크 Spec의 `### Screens / Components` 확인
- [ ] 모든 스크린이 prototype.html에 포함
- [ ] 각 스크린에 최소 `default` 상태 존재
- [ ] Control Panel에 screen select + state toggles 설정
- [ ] 디자인 토큰 적용 (색상, 타이포, 간격)
- [ ] 인터랙션 바인딩 (네비게이션, 상태 전환, 토글)
- [ ] 한국어 샘플 데이터 사용
- [ ] 말줄임 처리 (긴 텍스트)
- [ ] 390×844px 디바이스 프레임에서 레이아웃 확인

### 리뷰 체크리스트

- [ ] 모든 스크린 × 모든 상태 확인
- [ ] PRD AC와 1:1 대응 확인
- [ ] 인터랙션 동작 확인 (탭, 스크롤, 토글)
- [ ] 엣지 케이스 UI 확인 (빈 상태, 에러, 긴 텍스트)
- [ ] 디자인 일관성 확인 (토큰, 간격, 색상)

### PRD 추출 체크리스트

- [ ] revision_count >= 1인 approved 화면 식별
- [ ] Phase 3.4: 피드백 → 개정안 생성 → apply/defer/dismiss
- [ ] Phase 3.5: prototype HTML → 요구사항 추출 → refined-prd.md
- [ ] 원본 PRD diff 확인 (new/refined/unchanged)
- [ ] 태스크 spec AC 갱신 (accept 시)
- [ ] 통합 뷰어에 프로토타입 등록
