# app-009 · Deferred Items 정리 (ugc-platform-001 이월)

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: —

## Target

- `app/apps/MemeApp/src/presentation/home/` (MINOR-G2-1)
- `app/apps/MemeApp/src/presentation/profile/profile.screen.tsx` (MINOR-G2-2)
- `app/apps/MemeApp/src/presentation/other-user-profile/` (MINOR-G3-3)
- `app/apps/MemeApp/src/presentation/swipe-feed/` + 관련 훅 (MINOR-G3-4)
- Clipboard 사용처 전반 (MINOR-G3-3)

## Context

Phase 1 retrospective 에서 partially_fulfilled 또는 unfulfilled 처리된 Minor 항목 4개를 본 스프린트에서 정리한다. 상세는 `sprints/ugc-platform-001/retrospective/deferred-items.yaml` 참조.

## Objective

Phase 1 에서 follow-up 으로 이월된 UX 보정 항목을 마무리한다. 본 태스크는 **4 개의 독립 sub-fix** 로 구성된다. 각 sub-fix 는 독립 ACspec 을 가지며 단일 PR 단위로 묶어 진행한다.

## Specification

### Sub-fix 1 — MINOR-G2-1: Home header gear 제거 (PRD 재확인)

- Phase 1 AC 2.8 "설정 진입점" 은 MY 프로필 우상단 gear icon 이 canonical.
- 현재 Home 헤더에도 gear icon 이 존재 (dual entry). Phase 1 Evaluator 는 "계약에 Home gear 제거 명시 없어 의도적 유지 가능성" 으로 low severity 판정.
- **결정 기준**:
  1. Phase 2 PRD + 원본 통합 PRD 재확인. Home gear 명시 없음 → 제거.
  2. 원본 PRD 에 Home 헤더 설정 진입 관련 명시 있음 → 유지 (PRD 우선).
- **기본 판단 (Spec 시점)**: **제거** (SSOT MY 프로필 gear 이고, Phase 2 PRD 에도 Home 헤더 설정 언급 없음).
- 변경 시:
  - Home header 에서 gear icon 제거.
  - `home-to-settings.yaml` e2e flow 가 있으면 MY 경유로 재작성.

### Sub-fix 2 — MINOR-G2-2: profile.screen useEffect landingTab race 수정

- 증상: `useEffect([landingTab])` 가 counts API 지연 도착 후 사용자 수동 탭 선택을 덮어쓸 수 있음.
- 수정 방향: counts 결과 반영을 **1회만 sync** 하는 flag 또는 route param override 있을 때만 effect 발동.
- 패턴:
  ```typescript
  const [hasAutoLanded, setHasAutoLanded] = useState(false);
  useEffect(() => {
    if (hasAutoLanded) return;
    if (routeParams?.landingTab) { setActiveTab(routeParams.landingTab); setHasAutoLanded(true); return; }
    if (countsLoaded) { setActiveTab(pickByPriority(counts)); setHasAutoLanded(true); }
  }, [routeParams?.landingTab, counts, hasAutoLanded]);
  ```
- Regression: AC 2.1 랜딩 우선순위 (route > public > private > public-empty) 유지.
- AC 2.7 생성 후 MY 공개 탭 redirect 유지 (route.landingTab 경유).

### Sub-fix 3 — MINOR-G3-3: Clipboard 모듈 교체

- 증상: `Clipboard` from `react-native` 는 deprecated (RN 0.59+).
- 대체: `@react-native-clipboard/clipboard`.
- 작업:
  - `yarn add @react-native-clipboard/clipboard` (또는 기존 workspace dependency 패턴).
  - iOS pod install + Android auto-linking 확인.
  - Codebase-wide import 변경:
    - grep `'react-native'` 의 `Clipboard` import 검색.
    - `@react-native-clipboard/clipboard` 로 치환.
  - try/catch 보강 (권한/실패 케이스).
- Test: 기존 `other-user-profile` URL 복사 기능 회귀 없음 (기존 Maestro flow 통과).

### Sub-fix 4 — MINOR-G3-4: SwipeFeed initialContentId fallback UX

- 증상: `SwipeFeed` 의 `initialContentId` 가 응답 list 에 없을 때 fallback 부재.
- 수정 방향:
  - 응답 list 에서 해당 id 를 탐색 → 없으면 **첫 아이템부터 렌더**.
  - 또는 "콘텐츠를 찾을 수 없음" 상태 표시 (list 길이 0 일 때).
- 구현:
  ```typescript
  const initialIndex = list.findIndex((i) => i.id === initialContentId);
  const effectiveIndex = initialIndex >= 0 ? initialIndex : 0;
  ```
- Regression: 정상 케이스 (id 존재) 에서 기존 동작 유지.

## Acceptance Criteria

### Sub-fix 1
- [ ] Home header 에서 gear icon 제거됨 (PRD 재확인 후 유지 결정 시 이 항목 N/A 로 기록).
- [ ] 설정 진입은 MY 프로필 gear 에서만 접근 가능.
- [ ] 관련 e2e flow (`home-to-settings.yaml` 등) 업데이트.

### Sub-fix 2
- [ ] landingTab race 해소: counts 도착 전 사용자 수동 탭 선택 덮어쓰기 없음.
- [ ] AC 2.1 자동 랜딩 우선순위 유지 (seed 별 verification).
- [ ] AC 2.7 콘텐츠 생성 후 공개 탭 이동 유지.

### Sub-fix 3
- [ ] Codebase 전체에서 `react-native` 의 Clipboard import 0 (grep).
- [ ] `@react-native-clipboard/clipboard` import 정상.
- [ ] iOS / Android 빌드 통과.
- [ ] 기존 URL 복사 기능 (Maestro other-user-profile flow) 통과.
- [ ] Deprecation warning 사라짐.

### Sub-fix 4
- [ ] initialContentId 가 list 에 없을 때 첫 아이템부터 렌더.
- [ ] Regression: 정상 케이스에서 기존 initialIndex 동작.

### 공통
- [ ] `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.
- [ ] 각 sub-fix 별 commit 분리 권장 (bisect 용이성).

## Screens / Components

*Deferred UX cleanup — 신규 화면 없음. Prototype 대상 최소.*

- **HomeHeader-WithoutGear** (Sub-fix 1 대상, Before/After 비교용 주석):
  - Before: 로고 + 코인 + 종 + **gear**
  - After: 로고 + 코인 + 종 (gear 제거)
- **SwipeFeed-FallbackIndex** (Sub-fix 4, 구조적 변경 없음 — logic fix)
- States: minimal (no new states)

> 본 태스크는 주로 logic fix 로 HTML 프로토타입이 필수 아님. Prototype 생성 생략 가능 (Design Engineer 판단).

## Implementation Hints

- Sub-fix 1 의 PRD 재확인: 원본 PRD `~/.zzem/kb/products/ugc-platform/phase-2-feed-payback/prd.md` + 통합 overview `~/.zzem/kb/products/ugc-platform/prd.md` 에서 Home header / Settings 관련 언급 grep.
- Sub-fix 2 의 useEffect dep list 주의 — stale closure 방지.
- Sub-fix 3 은 monorepo 차원 package 추가 — `app-core-packages` workspace 루트의 package.json 확인.
- Sub-fix 4 는 `SwipeFeed` 엔트리 포인트 (profile-to-swipe-feed 등) 모두 영향 — 단일 수정점으로 커버.
