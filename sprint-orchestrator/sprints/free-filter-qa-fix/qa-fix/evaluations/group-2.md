# Evaluation: Group 2 (free-filter-qa-fix)

- **Sprint Lead Verdict (post-fix, pre-QA)**: PROVISIONAL PASS
- **Date**: 2026-04-27

## Tickets

| Ticket | Pri | Status |
|---|---|---|
| IS-1368 — 웹툰 생성 실패 시 내 웹툰 목록 + 미생성 회차 필터칩 노출 | P1 | Awaiting manual QA |

## Fix Summary

**App commit:** `b9f810f72` (worktree `/app`)

**File 1:** `apps/MemeApp/src/domain/webtoon/webtoon.usecase.ts`
- `useCreateWebtoonEpisodeUseCase` 의 `onSuccess` → `onSettled`
- 실패 경로에서도 `invalidateMySeries()` + `invalidateActiveGenerations()` 가 호출되어 backend softDelete 와 FE 캐시 동기화

**File 2:** `apps/MemeApp/src/presentation/webtoon/webtoon-viewer.screen.tsx`
- `chipIndices` 계산 시 `episodeIdMapRef` 의 stale entry 를 `episodeListData` (server truth) 와 cross-check
- backend 가 rollback 한 회차의 chip 노출 방지
- 자동이어가기 직후 `episodeListData` 가 비어있는 fallback 시점은 보존

## Done Criteria — Pre-Manual-QA Status

| ID | Criterion | Code review | Manual QA |
|---|---|---|---|
| DC-1368-A | 1화 실패 시 "내 웹툰" 목록에 entry 안 남음 | ✅ onSettled invalidate | ⏳ |
| DC-1368-B | 회차 실패 시 미생성 chip 안 보임 | ✅ chipIndices cross-check | ⏳ |
| DC-1368-C | Root cause 명시 | ✅ onError 핸들러 부재 + idMap stale | ⏳ |
| DC-1368-D | 정상 생성 path 회귀 없음 | ✅ onSettled = onSuccess + onError, 성공 path 동작 동일 | ⏳ |
| DC-1368-E | BE 변경 없음 | ✅ `git diff backend/` 비어있음 | — |

## Manual QA

→ 통합 manual QA plan 참조: `../manual-qa-integrated.md` § Group 2

## IS-1371 가능성

reporter 단서 ("크레딧 소진 후 밈 재생성 시 ... 생성 중 목록 누적") 가 본 G2 와 같은 패턴 (mutation onError 누락 → cache stale). 본 fix 는 webtoon path 한정이라 IS-1371 (밈 path) 는 별도. 다만 같은 fix 패턴 적용으로 해소 가능 — Retro 단계에서 follow-up 후보로 기록.
