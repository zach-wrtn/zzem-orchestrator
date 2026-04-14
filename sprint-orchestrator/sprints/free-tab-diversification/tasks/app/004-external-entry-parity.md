# app-004 · 외부 진입점(추천탭 등) 동일 무료 경험

- **Group**: 004
- **Owner**: fe-engineer
- **Depends on**: app-003

## Target

`app-core-packages/apps/MemeApp/src/presentation/home/*` (추천탭), `presentation/swipe-feed/*` 진입점 params.

## Context

추천탭 피드에서 무료 필터를 만난 경우에도 동일 바텀시트/CTA 경험을 제공(US-7). 단, "더 둘러볼게요" 시 현재 탭의 알고리즘 피드를 유지해야 한다(AC 2.7.2).

## Objective

추천탭 및 기타 진입점에서 무료 필터에 대한 동일한 확인/크레딧 바텀시트 경험을 연결하고, 피드 전환 차이를 유지한다.

## Specification

### Entry points
- Recommend Feed 카드 탭 → 기존 알고리즘 SwipeFeed 진입, `mode: "algo"`, `entryPoint: "recommend"`.
- 무료 필터 카드(오늘 활성)인 경우에도 mode는 "algo" 유지(무료탭 피드로 전환 금지).

### Behavior
- 무료 필터 + `freeUsedToday==false` → CTA 탭 시 `FreeUseConfirmSheet` 노출(AC 2.7.1).
- 무료 필터 + `freeUsedToday==true` → `CreditUseConfirmSheet` 노출(AC 2.7.3).
- "더 둘러볼게요" → 현재 알고리즘 피드 유지(AC 2.7.2).

### Compatibility
- 추천 알고리즘은 무료 필터를 제외하지 않음(BR-14).

## Acceptance Criteria

- [ ] 추천탭 피드에서 오늘 활성 무료 필터 CTA 탭 → `FreeUseConfirmSheet` 노출.
- [ ] 동일 상황에서 "더 둘러볼게요" → 현재 추천 피드 유지(무료 전용 모드로 전환되지 않음).
- [ ] 추천탭 피드에서 사용 완료 상태 무료 필터 CTA 탭 → `CreditUseConfirmSheet` 노출.
- [ ] 추천탭 피드 응답에 무료 필터가 포함되어 노출됨(API/컴포넌트 단 검증).

### E2E 인증
- New: `flows/external-entry-free-parity.yaml` — 추천탭 진입 → (시드 기반) 무료 필터 카드 탭 → 바텀시트 assertVisible.
- Deferred (server-injection-required): 실제 "오늘 활성 무료 필터"가 추천 피드에 포함되는 조건을 e2e에서 보장하기 어려움 → BE 통합 테스트로 대체.

## Implementation Hints

- CTA/시트 로직을 재사용 훅(`useFreeGenCTA`)으로 분리해 무료탭/추천탭 양쪽에서 호출.

## Prototype Reference
- **프로토타입**: `prototypes/app/app-004/prototype.html`
- **스크린샷**: `prototypes/app/app-004/screenshots/`
- **상태**: approved
