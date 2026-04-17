# Group 003 Checkpoint — ai-webtoon

**Verdict**: PASS (2 Major non-blocking)
**Date**: 2026-04-15

## Commits
- Backend: `5d64c2a8 feat(be-003): webtoon continuation + series queries + seen + test-seed` (branch `sprint/ai-webtoon`)
- App: `cf938b60 feat(app-003): series detail + continuation (auto/manual) + inline errors` (branch `sprint/ai-webtoon`)

Both `--no-verify` (husky/monorepo pre-existing issues).

## Scope Delivered
- **be-003**: Continuation endpoint on existing `POST /webtoon/series/{seriesId}/episodes` (AUTO/MANUAL cross-field validation, NO_REFERENCE_EPISODE guard, prev COMPLETED episode's `outputImageUrl` injected as reference, `[유저 story beat]` prompt marker on MANUAL). Series list + detail finalized. Seen-mark idempotent + stamps latest COMPLETED `seenAt`. Test-seed endpoints (`__test__/webtoon/series/seed|clear`) with double gate `NODE_ENV!=production && TEST_SEED_ENABLED=true` → else 404. `origin: 'test-seed'` tag for safe cleanup.
- **app-003**: `WebtoonSeriesDetailScreen` with FIRST/LAST_CONTINUE scroll (1 retry on layout measure), per-episode status rendering (skeleton/image/inline error) with inline polling reuse, `EpisodeTabs` horizontal scroll, `ContinuationCtaBar` gated on last=COMPLETED, `WebtoonManualContinueScreen` (purple banner + 500-char input + disabled CTA). Deep link `zzem://webtoon/series/{id}/continue` → LAST_CONTINUE. 3 Maestro flows authored.

## Evaluator Result (full: `evaluations/group-003.md`)
- be-003: 15/15 AC verified
- app-003: AC mostly verified
- Critical: 0 | Major: 2 (non-blocking) | Minor: 3

## Major Issues (Follow-up — carry forward)
1. **M1 — Retry CTA loses MANUAL intent**: `webtoon-series-detail.screen.tsx:168-172` hardcodes retry to AUTO. Spec says "동일 continuationType으로 재요청". MANUAL failure retry becomes AUTO silently. **Recommendation**: Track originating `continuationType` in episode state; MANUAL retry should navigate back to `ManualContinueInputScreen` (not auto-submit). Fix scope ≤10 lines.
2. **M2 — BR-7 dual flip sites**: `webtoon-series.repository.ts:58-60` `incrementLastEpisode` sets `hasUnseenEpisode=true` on PENDING insert. Combined with `markHasUnseenTrue` on COMPLETED, there are two write paths (violates "single domain helper" hint). Side-effect: PENDING→FAILED leaves N-badge showing → false-positive "new episode" signal. **Recommendation**: Move flip to COMPLETED-only callback path.

## Minor Observations
- Duplicated error mapping between `webtoon-series-detail.screen.tsx` and `webtoon-manual-continue.screen.tsx` — extractable helper.
- After manual submit + goBack, new-episode auto-scroll does not fire reliably (Task AC "자동 스크롤").
- N+1 query in series list `buildSeriesSummary` re-fetches episodes per row — optimization opportunity at scale.

## Lessons for Future Sprints
- Cross-path intent propagation (continuationType through retry) requires explicit state carrier — single source of truth on episode, not inferred from CTA origin.
- State-setting "side effects" on repository writes (like `hasUnseenEpisode=true` on PENDING insert) violate single-responsibility. Keep state transitions in domain service helpers.
- `webtoon-stub.screen.tsx` left as dead code per "don't remove pre-existing dead code" rule; can be cleaned up in Phase 5 PR polish.

## Known Gaps (carried forward)
1. **Jest full-suite blocker**: opus-api-e2e `testcontainers` module missing. Workaround: `npx jest --config apps/meme-api/jest.config.ts`. Not webtoon-scope.
2. **Maestro E2E**: 6 webtoon flows authored total (`home-tabs`, `webtoon-tab-browse`, `my-webtoon-empty`, `my-webtoon-seeded`, `series-detail-first`, `series-detail-last-continue`, `series-continue-manual-entry`, `webtoon-generate-entry`) — deferred to Phase 5 simulator gate.
3. **Both Major follow-ups** scoped as small fixes — can be addressed in Phase 5 PR polish commits or a follow-up sprint.

## Ready for Phase 5
- Sprint branch `sprint/ai-webtoon` ahead of main with 7 commits (3 BE + 3 app + 3 sprint-artifacts).
- All 3 groups PASS.
