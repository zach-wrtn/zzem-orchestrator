# Evaluation: Group 4 (free-filter-qa-fix)

- **Sprint Lead Verdict (post-fix, pre-QA)**: PROVISIONAL PASS
- **Date**: 2026-04-27

## Tickets

| Ticket | Pri | Status |
|---|---|---|
| IS-1366 — 추천 탭 스크롤 시 웹툰 툴팁 ↔ 필터칩 영역 겹침 | P2 | Awaiting manual QA |

## Fix Summary

**App commit:** `b9f810f72`

**File:** `apps/MemeApp/src/presentation/home/componenets/home-body.tsx`

Sticky FilterChips overlay `zIndex` 10 → 11.
- HomeHeader 의 웹툰 SimpleTooltip 도 `zIndex: 10` 사용 → stack 충돌
- 스크롤로 sticky overlay 가 헤더 영역에 진입할 때 둘이 같은 stack 에 놓여 겹침
- overlay 를 1 단계 상승시켜 항상 헤더 위에 그려지도록

## Done Criteria — Pre-Manual-QA Status

| ID | Criterion | Code review | Manual QA |
|---|---|---|---|
| DC-1366-A | 겹침 없음 | ✅ zIndex 11 > tooltip zIndex 10 | ⏳ |
| DC-1366-B | Root cause 명시 | ✅ HomeHeader SimpleTooltip 과 stack 충돌 | ⏳ |
| DC-1366-C | 다른 ToolTip / FilterChip 사용처 영향 없음 | ✅ stickyOverlay 는 home-body 단독 | ⏳ |
| DC-1366-D | 툴팁 dismiss 후 정상 | ✅ overlay 자체 동작 변경 없음 | ⏳ |

## Manual QA

→ 통합 manual QA plan 참조: `../manual-qa-integrated.md` § Group 4

## 회귀 위험

낮음. `stickyOverlay` 스타일은 home-body 단일 사용처. 다른 화면의 ToolTip / FilterChip 컴포넌트는 무관.
