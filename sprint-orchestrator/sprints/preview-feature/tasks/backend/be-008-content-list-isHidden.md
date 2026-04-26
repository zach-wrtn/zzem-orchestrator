# BE-008 — Content List `isHidden` Filter

## Target
- `apps/meme-api/src/application/filter/filter-query-app.service.ts` —
  `readList`, `readListV2`, `readListByGridFeed` 셋 모두.
- 기타 같은 파일 또는 `meme-collection-query.app-service.ts` 류에서 Content를 목록으로
  제공하는 경로 전수.

## Context
i2i preview Content는 MemeCollection·grid·feed 어디에도 노출되면 안 됨 (BR-9, AC 2.3.1).
앱은 변경하지 않는다 — 서버에서 전부 필터링.

## Objective
모든 user-facing Content 목록 쿼리에 `isHidden: { $ne: true }` 또는 동등한 boolean
필터를 추가한다. (필드 default는 false이므로 누락된 도큐먼트도 자동 통과.)

## Specification
- 대상 쿼리 enumerate: 위 3개 + grep 결과(`rg "Content.find" apps/meme-api/src` →
  유저 노출 경로 전수). 패턴 `completeness-010` (포괄 표현 → 구체 path 전수 나열).
- 어드민·디버그·내부 통계 쿼리는 변경하지 않는다 (포함 의도).
- 인덱스: BE-001에서 `{ userId, isHidden }` 추가.

## Acceptance Criteria
- [ ] `isHidden: true` Content가 MemeCollection 응답에 포함되지 않는다 (단위 + 통합 테스트).
- [ ] `isHidden: true` Content가 grid feed에 포함되지 않는다.
- [ ] 기존 `isHidden` 부재 도큐먼트(default false)는 정상 노출.
- [ ] 어드민·통계 쿼리는 변경하지 않는다 (포함 의도 그대로).
- [ ] 변경된 모든 쿼리 path를 task PR 본문에 명시 (구체 path 전수 나열, completeness-010).
