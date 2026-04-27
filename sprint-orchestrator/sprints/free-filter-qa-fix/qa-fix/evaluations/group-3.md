# Evaluation: Group 3 (free-filter-qa-fix)

- **Sprint Lead Verdict (post-fix, pre-QA)**: PROVISIONAL PASS — fix 가 가설 기반 (영상 미시청). manual QA 가 PASS 확정 게이트.
- **Date**: 2026-04-27

## Tickets

| Ticket | Pri | Status |
|---|---|---|
| IS-1375 — 필터 좋아요 버튼 탭 시 즉시 취소 + 카운트 미반영 | P2 | Awaiting manual QA |

## Fix Summary

**App commit:** `b9f810f72`

**File:** `apps/MemeApp/src/domain/favorite/favorite.usecase.ts`

`useToggleFavoriteUseCase.onSuccess` 에 `getFreeTab` cache 의 `setQueriesData` 추가:
- IS-1345 fix 가 invalidate 만 추가했더니 toggle 직후 refetch 도착 전 짧은 윈도우에 stale `isFavorited`/`favoriteCount` 가 `effectiveFreeFilters` 로 노출
- 화면 레벨 Map 의 보존 가드 (`if (!next.has(f.id))`) 를 우회하는 진입점에서 좋아요 상태가 즉시 false 로 보이는 회귀
- server 응답값으로 cache 즉시 일관시킨 뒤 invalidate 로 SSOT reconcile (race window 제거)

## ⚠️ Caveat

- 영상 (`Screen_Recording_20260427_142401_DEV.mp4`) 미시청 → reporter 의 "필터 화면" 이 무료 SwipeFeed (`SwipeFeedFreeActions`) 인지 일반 SwipeFeed (`SwipeFeedActions`) 인지 또는 다른 진입점인지 불확실
- Backend 응답은 정상 (`enrichFilters` 가 isFavorited/favoriteCount 모든 path 에서 채움 — `filter-query-app.service.ts:415-416`)
- IS-1345 시기 fix 와 동일 모듈에서 다시 발생 → 재발 시 IS-1345 reflection lesson 강화 + Retro KB 후보

## Done Criteria — Pre-Manual-QA Status

| ID | Criterion | Code review | Manual QA |
|---|---|---|---|
| DC-1375-A | 좋아요 상태 유지 | ✅ cache setQueriesData 즉시 일관 | ⏳ |
| DC-1375-B | 좋아요 수 정상 반영 | ✅ server response 의 favoriteCount 즉시 cache 반영 | ⏳ |
| DC-1375-C | 다시 탭 → 정상 토글 | ✅ 같은 path, race 제거 | ⏳ |
| DC-1375-D | Root cause 명시 | ✅ invalidate-only 의 race window | ⏳ |
| DC-1375-E | IS-1345 회귀 여부 | ✅ IS-1345 commit 9cb47f8a5 + 43abaa0e2 검토 — invalidate-only 한계 보강 | ⏳ |
| DC-1375-F | 다른 좋아요 진입점 회귀 없음 | ✅ getFeedSwipe cache 의 setQueriesData 도 그대로 유지 | ⏳ |

## Manual QA

→ 통합 manual QA plan 참조: `../manual-qa-integrated.md` § Group 3
