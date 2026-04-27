# Evaluation: Group 5 (free-filter-qa-fix — post-launch)

- **Verdict**: PASS (post-fix)
- **Date**: 2026-04-27

## Tickets

| Ticket | Pri | Status |
|---|---|---|
| IS-1423 — 무료 필터가 추천 탭에서 노출될 때 무료 혜택 미적용 | P1 | Ready for QA (R_QA 요청), comment 72008 |

## Fix Summary

**BE merge SHA**: `9e0c836b` (PR #866 squashed into develop)

**File 1**: `apps/meme-api/src/application/filter/filter-query-app.service.ts`
- `readListByGridFeed` 시그니처에 `appVersion` 추가 + 내부 `readListV2` fallback 호출 모두에 전달
- `readGridFeedRecommendations` 가 `loadRosterContextIfCapable(capable, userId)` 로 rosterContext 로드 후 `enrichRecommendedFilters` 에 전달
- `enrichRecommendedFilters` 가 `enrichFilters` 와 동일한 rosterSlot 분기 (isFreeFilter / hasGeneratedToday / themeTag 동적 판정)

**File 2**: `apps/meme-api/src/controller/filter/filter.controller.ts`
- `readListByGridFeed` 호출에 `appVersion` 추가 (1줄)

## Done Criteria — Pre-Manual-QA Status

| ID | Criterion | Code review | Manual QA |
|---|---|---|---|
| DC-1423-A | 무료 quota 미소진 + 무료 슬롯 필터 → 추천 탭 응답에서 requiredCredit=0 + isFreeFilter=true | ✅ enrichRecommendedFilters 가 rosterSlot 기반 동적 판정 | ⏳ |
| DC-1423-B | 무료 1회 사용 후 → requiredCredit > 0 + hasGeneratedToday=true (BR-1 보존) | ✅ rosterContext.usage.freeUsedToday 통과 | ⏳ |
| DC-1423-C | Root cause 명시 | ✅ 비대칭 enrichment helper 분산 + cross-cutting field 누락 | ⏳ |
| DC-1423-D | 무료 탭 / 일반 탭 / FilterPreview 단건 회귀 없음 | ✅ enrichFilters / readOne 변경 없음 | ⏳ |
| DC-1423-E | 1.2.0~1.2.x 구앱 응답 schema 보존 | ✅ capable=false → rosterContext null → legacy shape | ⏳ |

## KB Pattern (Retro 결과)

본 fix 의 root cause 가 KB pattern 으로 promotion 됨:
- **completeness-014** — Cross-tab parity (cross-cutting enrichment 도입 시 도메인의 모든 list/single endpoint 에 적용)
- KB push: `zach-wrtn/knowledge-base@84237ce`

## Manual QA

→ 통합 manual QA plan 참조: `../manual-qa-integrated.md`. G5 의 추가 step 은 본 evaluation 의 DC-1423-A~E 표 참조.

## 회귀 위험

**Low** — `enrichRecommendedFilters` 의 단일 호출처 (`readGridFeedRecommendations`). 다른 path (일반 탭/무료 탭/단건 조회) 영향 없음. 1.2.x 구앱은 `isFreeRosterCapableVersion=false` → rosterContext null → 응답 schema 변경 없음.
