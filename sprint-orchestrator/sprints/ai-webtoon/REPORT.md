# Sprint Report — ai-webtoon

**Date**: 2026-04-15
**Sprint branch**: `sprint/ai-webtoon`
**PRD source**: [`docs/prds/PRD-ai-webtoon-v1.2.md`](../../../docs/prds/PRD-ai-webtoon-v1.2.md)
**Verdict**: PASS (3 / 3 groups, 0 fix loops, 4 Major follow-ups deferred)

## Executive Summary

사진 1장 → AI 웹툰 1화 생성 + 자동/직접 이어가기 연재 구조 전체 파이프라인을 3개 그룹으로 분해 구현, 모든 그룹이 첫 평가에서 PASS. Critical 0건, Major 4건은 모두 non-blocking(자가 치유 / 계약 수준 안전)으로 다음 스프린트로 이월.

## PRD Coverage

| Metric | Value |
|---|---|
| Total AC | 22 |
| Fulfilled | 18 |
| Partially fulfilled | 4 |
| Unfulfilled | 0 |
| Fulfillment rate | 0.82 |

## Build Results

| Group | Scope | Verdict | Fix loops | Critical | Major | Minor |
|---|---|---|---|---|---|---|
| group-001 | be-001 (templates + schemas) + app-001 (tab + detail + MY) | PASS | 0 | 0 | 0 | 0 |
| group-002 | be-002 (generation pipeline + fal-ai callback) + app-002 (generate screen + polling) | PASS | 0 | 0 | 2 | 3 |
| group-003 | be-003 (continuation + series queries + seen + test-seed) + app-003 (series detail + manual continue) | PASS | 0 | 0 | 2 | 3 |

## Quality Metrics

- First-pass rate: 3/3 = 100%
- Average fix cycles: 0.0
- Critical: 0 | Major: 4 (deferred) | Minor: 6
- Issues fixed: 0 | Issues deferred: 10
- E2E flows authored: 8 (executed: 0 — Phase 5 simulator gate)

## Issues

### Critical
_None._

### Major (deferred follow-ups)

| ID | Group | Pattern | Root cause | Recommendation |
|---|---|---|---|---|
| G002-M1 | group-002 | Concurrency cap source drift (webtoon DB-sum vs meme Redis slot) | integration / dependency | Unify webtoon submit into `reserveGenerationSlotOrThrow` |
| G002-M2 | group-002 | episodeNumber gap when `$inc` precedes failed insert | edge_case | Compensating `$dec` on insert catch, or doc gap-allowed contract |
| G003-M1 | group-003 | Retry CTA hardcodes AUTO — MANUAL intent lost | scope_creep | Persist originType on episode; route MANUAL retry to input screen |
| G003-M2 | group-003 | `hasUnseenEpisode=true` dual flip site (PENDING-append + COMPLETED-callback) | code_quality | Remove flag set from `incrementLastEpisode` $set; flip only via `markHasUnseenTrue` |

### Minor

| Area | Note |
|---|---|
| app-002 402 UX | Toast + Paywall nav instead of `InsufficientCreditSheet` (behaviourally equivalent) |
| HMAC | `canonicalizePayload` is shallow (top-level only) — OK for flat payload |
| app-002 | `buildCallbackUrl` double-includes generationId; harmless |
| app-002 | 240s `setTimeout` not explicitly cleared on terminal status (GC-safe) |
| app-003 | Duplicated error mapping between series-detail and manual-continue screens |
| app-003 | After manual submit + goBack, new-episode auto-scroll does not fire |
| be-003 | N+1 series-list query — `buildSeriesSummary` refetches episodes per row |

## Systemic Patterns

**Positive (load-bearing reuse)**:
- Shared credit/concurrency/HMAC helper reuse across submit→continuation — zero forked logic in be-003.
- Race-safe append (atomic `$inc` + unique `(seriesId, episodeNumber)` compound index backstop) validated by 5-parallel spec.
- Single `useWebtoonGenerationPolling(generationId)` hook reused across app-002 + app-003 with AppState listener + 240s timeout.

**Regressions (→ contract amendments)**:
- Two pipelines sharing a cap must share the atomic counter source (G002-M1).
- 2-step atomic sequences must declare gap-allowed vs compensate (G002-M2).
- Retry CTA must preserve originating mode/payload; silent fallback forbidden (G003-M1).
- Domain state flags must flip from a single domain-service helper; repository write side-effects forbidden (G003-M2).

## Deliverables

### Code (3 repos)
- **sprint-orchestrator**: sprint artifacts, checkpoints, evaluations, contracts, retrospective → `sprint/ai-webtoon`
- **wrtn-backend**: `apps/meme-api/src/**/webtoon-*`, fal-ai adapter, scheduler, webhook → `sprint/ai-webtoon`
- **app-core-packages** (MemeApp): webtoon presentation + domain + data + navigation + hooks + Maestro flows → `sprint/ai-webtoon`

### Screens
- Home tabs (웹툰 탭 추가) + WebtoonFloatingButton + WebtoonEmptyView
- WebtoonTemplateDetailScreen (preview + CTA)
- WebtoonGenerateScreen (INPUT / GENERATING / RESULT / FAILED states)
- WebtoonSeriesDetailScreen (FIRST/LAST_CONTINUE focus, inline polling, ContinuationCtaBar)
- WebtoonManualContinueScreen (purple banner + 500-char input)
- MyWebtoonScreen (list, N-badge, split hitboxes) + MyWebtoonEmptyView

### API Contract (10+ endpoints)
1. `GET /webtoon/templates`
2. `GET /webtoon/templates/{id}`
3. `GET /webtoon/series`
4. `GET /webtoon/series/{id}?focus=FIRST|LAST_CONTINUE`
5. `POST /webtoon/series/{id}/seen`
6. `POST /webtoon/generations` (1화 submit)
7. `GET /webtoon/generations/{generationId}` (status poll)
8. `POST /webtoon/series/{seriesId}/episodes` (continuation AUTO/MANUAL)
9. `POST /webhook/webtoon/{generationId}` (internal fal-ai callback, HMAC)
10. `POST /__test__/webtoon/series/seed` (dev-only, double-gated)
11. `POST /__test__/webtoon/series/clear` (dev-only, origin-scoped cleanup)

### Artifacts
- `sprint-config.yaml`, `PRD.md`
- `contracts/api-contract.yaml`
- `tasks/{backend,app}/00{1,2,3}-*.md`
- `evaluations/group-00{1,2,3}.md`
- `checkpoints/group-00{1,2,3}-summary.md`
- `prototypes/app/` (Phase 3)
- `retrospective/{gap-analysis,pattern-digest,deferred-items}.yaml`
- 8 Maestro flows (MemeApp e2e)

## PR Links
- sprint-orchestrator: https://github.com/zach-wrtn/zzem-orchestrator/pull/8
- wrtn-backend: https://github.wrtn.club/wrtn-tech/wrtn-backend/pull/752
- app-core-packages: https://github.com/wrtn-tech/app-core-packages/pull/516

## Improvements for Next Sprint

1. Unify concurrency cap counter source — webtoon submit → `reserveGenerationSlotOrThrow` (closes G002-M1).
2. Compensate counter on insert failure or document gap-allowed (closes G002-M2).
3. Persist originType on episode; MANUAL retry → ManualContinueInputScreen (closes G003-M1).
4. Single flip site for `hasUnseenEpisode` — remove from `incrementLastEpisode` (closes G003-M2).
5. Extract shared `handleContinuationError` util (series-detail ↔ manual-continue duplication).
6. Execute 8 Maestro flows in simulator gate.
7. Fill FE jest coverage for webtoon domain/data/presentation.
8. Batch episode lookup in `buildSeriesSummary` to eliminate N+1.

## Timeline

- Phase 1 (Plan): 2026-04-15 — sprint-config.yaml + PRD.md extract
- Phase 2 (Design): 2026-04-15 — 6 task specs + api-contract.yaml
- Phase 3 (Prototype): 2026-04-15 — webtoon screens prototyped; no amendments
- Phase 4 (Build): 2026-04-15 — 3 groups, all PASS first pass, 0 fix loops
- Phase 6 (Retro): 2026-04-15 — this report

## Commits

### Backend (wrtn-backend)
- `0e4c42d8` feat(be-001): webtoon templates + series/episode schema + read endpoints
- `da3deb23` feat(be-002): webtoon generation pipeline + fal-ai callback + concurrency cap
- `5d64c2a8` feat(be-003): webtoon continuation + series queries + seen + test-seed

### App (app-core-packages / MemeApp)
- `32a97fbb` feat(app-001): webtoon tab + template detail + MY webtoon list
- `c8c78696` feat(app-002): webtoon generate screen + 5s polling + result/error branches
- `cf938b60` feat(app-003): series detail + continuation (auto/manual) + inline errors

### Sprint (sprint-orchestrator)
- `433b9ca`, `dc8470b`, `2bc11cf` — sprint artifact checkpoints per group
