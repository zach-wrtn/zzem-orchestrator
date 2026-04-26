# APP-007 — `parentFilterId` Navigation Refactor

## Target
- 필터 상세 진입 (예: `useFilterDetailRoute`, `MemeViewer` 등에서 `filterId`로 detail navigate하는 모든 경로)
- 딥링크 핸들러 (`apps/MemeApp/src/shared/routes/*.ts`)
- 워터마크 CreditPaywall 진입 경로 (existing).

## Context
i2v Content의 `filterId`는 i2v child filter id이지만, 유저가 해당 Content에서 필터 상세나
딥링크로 이동할 때는 **parent (workflow) filter id**를 사용해야 한다 (BR-10, AC 2.3.2).

## Objective
유저가 Content를 통해 필터로 진입하는 모든 navigation 경로에서 `filterId` → `parentFilterId`로 전환한다.
이벤트 로깅, BQ 분석, 비용 추적은 child filterId 그대로 유지.

## Specification

### 전수 조사 대상 (App spec '## ASK' 항목 — 1차 grep으로 enumerate, PR 본문에 명시)
- `MemeViewer` 진입.
- 필터 상세 진입 (홈/그리드/딥링크 등).
- 워터마크 CreditPaywall 진입.

### Branch
- Content에 `parentFilterId`가 있으면 (i2v Content) → `parentFilterId` 사용.
- 없으면 (기존 단일 workflow Content) → 기존 `filterId` 사용 (회귀 방지).

### Logging — 변경하지 않는다
- `filter_view`, `generation_started` 등 logger event는 child `filterId` 그대로.
- BQ analytics export 경로 변경 금지.

## Acceptance Criteria — maps to AC 2.3.2
- [ ] i2v Content에서 필터 상세 진입 → parent 필터로 navigate.
- [ ] 딥링크 zzem://filter/{id} 핸들러 — i2v Content 기반 진입 시 parent filterId 사용.
- [ ] 워터마크 CreditPaywall — i2v Content 진입 시 parent filterId 사용.
- [ ] 기존 단일 Content (parentFilterId 없음)는 기존 동작 유지.
- [ ] 분석 로깅의 filterId는 child 값 그대로 유지 (event 페이로드 회귀 0).
- [ ] PR 본문에 변경된 navigation 경로 전수 path 나열 (포괄 표현 금지 — pattern completeness-010).
