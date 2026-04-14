# app-002 · SwipeFeed 무료 전용 모드 + Circular Scroll

- **Group**: 003
- **Owner**: fe-engineer + design-engineer
- **Depends on**: be-003

## Target

`app-core-packages/apps/MemeApp/src/presentation/swipe-feed/*`.

## Context

무료탭 그리드에서 카드 탭 시, 오늘 무료 필터만으로 구성된 SwipeFeed로 진입한다(AC 2.2.1). 추천탭 진입점과는 피드 구성이 다름.

## Objective

무료 전용 SwipeFeed 모드를 추가하고 circular scroll, 상태별 CTA(무료/유료)를 구현한다.

## Specification

### Screens / Components
- `SwipeFeedScreen`에 `mode: "free" | "algo"` prop 추가.
- `SwipeFeedItem` CTA: 무료 모드 + `freeUsedToday==false` → **티켓 아이콘 + "무료"**. 무료 모드 + `true` → **코인 아이콘 + 유료 가격**(AC 2.6.2).
- `mode=="free"`에서 **circular scroll**: 마지막 → 첫 번째, 첫 번째 위로 → 마지막. 스냅 전환 자연스러움 유지.

### Behavior
- 진입 시 그리드에서 전달받은 filters 사용. 추가 API 호출 금지.
- `initialFilterId`가 있으면 해당 카드에서 시작.
- 뒤로가기 → 무료탭 그리드 복귀(AC 2.3.2).
- 무료 상태에서 CTA 탭 → 확인 바텀시트(app-003) 오픈.
- 유료 상태에서 CTA 탭 → 크레딧 안내 바텀시트(app-003) 오픈.

### Deep link
- `zzem://swipe-feed/free?filterId=...`(e2e 진입점).

## Acceptance Criteria

- [ ] 무료 그리드에서 카드 탭 → SwipeFeed 진입, 탭한 필터가 첫 화면(AC 2.2.1).
- [ ] 위/아래 스냅 스크롤로 다른 무료 필터 탐색. 각 카드 동일 CTA 구조(AC 2.3.1).
- [ ] 마지막에서 아래, 첫 번째에서 위 스크롤 → circular 연결, 끊김 없음(AC 2.2.2).
- [ ] 무료 상태 CTA 탭 → 확인 바텀시트 오픈(hand-off to app-003).
- [ ] 유료 상태 CTA 탭 → 크레딧 안내 바텀시트 오픈(hand-off to app-003).
- [ ] 뒤로가기 → 무료탭 그리드로 복귀.
- [ ] 피드 진입 시 `/free-tab` 또는 `/filters` 네트워크 호출 0회(ALWAYS — 그리드 응답 재사용).

### E2E 인증
- Extend: `swipe-feed.yaml` — 무료 모드 진입 후 CTA testID 확인 + 스크롤 1회.
- New: `flows/swipe-feed-free-circular.yaml` — 순환 스크롤 검증(마지막→첫 인덱스 표시 testID).

## Implementation Hints

- 기존 `FlatList pagingEnabled` 구조 유지. circular은 데이터를 [...items, ...items, ...items] 복제 방식 대신 `onMomentumScrollEnd`에서 경계 감지 → 반대편으로 jumpToIndex 방식 권장(성능·상태 단순).

## Prototype Reference
- **프로토타입**: `prototypes/app/app-002/prototype.html`
- **스크린샷**: `prototypes/app/app-002/screenshots/`
- **상태**: approved
