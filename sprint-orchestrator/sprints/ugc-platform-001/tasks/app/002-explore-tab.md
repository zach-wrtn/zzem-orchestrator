# app-002 · 탐색(돋보기) 탭 — 그리드 피드 숏컷

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: app-001 (하단 탭 등록)

## Target

`app/apps/MemeApp/src/presentation/explore/` (신규).

## Context

AC에서 탭 2(탐색, 돋보기 아이콘)는 **그리드 피드 숏컷**이며 홈과 **동일한 콘텐츠 풀/추천 로직**을 공유한다. PRD에 명시: "홈과 동일한 콘텐츠 풀/추천 로직".

## Objective

하단 탭 2번에 해당하는 Explore 화면을 신설해, 기존 홈의 그리드 피드(추천) 컴포넌트를 재사용하여 렌더한다.

## Specification

### Screens / Components
- **ExploreScreen** (신규): 홈의 추천 그리드 피드 컴포넌트를 재사용.
  - 헤더: 돋보기 아이콘 + "탐색" 타이틀 (`HeaderBar` 패턴).
  - 본문: 홈의 `HomeBody`(또는 추천 그리드 전담 컴포넌트)를 재사용.

### Behavior
- 데이터 소스·쿼리 키는 홈과 공유하여 네트워크 중복 호출을 최소화한다.
- 아이템 탭 → 기존 세로 스와이프 피드 화면으로 진입. `FeedOrigin` 등 기존 컨벤션이 있으면 재사용하고, 없으면 홈과 동일한 네비게이션 경로 호출.

### KB Contract Clauses
- completeness-001 (critical): Explore 스크린은 하단 탭 버튼이 진입점. 진입점 확인.
- completeness-002 (major, freq 1): 기존 훅 재사용으로 미사용 신규 훅을 만들지 않도록 주의. 재사용 import가 실제 화면에서 호출되는지 확인.

### Tests
- Maestro flow (확장): `bottom-tab-nav.yaml` 내에서 탐색 탭 탭(openLink) 후 그리드 아이템 `assertVisible`.

## Acceptance Criteria

- [ ] 하단 탭 2번(돋보기) 선택 시 Explore 화면이 렌더링되며 홈과 동일한 콘텐츠(추천 그리드)가 노출된다.
- [ ] 아이템 탭 시 기존 세로 스와이프 피드가 진입 가능.
- [ ] 네트워크 요청 중복 호출 없음(동일 queryKey 재사용 확인).
- [ ] `npm run typecheck` 신규 에러 0.

## Implementation Hints

- 참조: 홈 스크린의 추천(Recommend) 그리드 컴포넌트. 가능한 한 **추출 없이 재사용**; 구조가 얽혀 있다면 순수 view component만 분리.
- 신규 전용 API 호출 추가 금지 — 기존 홈 추천 쿼리 재사용.
