# Group 001 Checkpoint — ai-webtoon

**Verdict**: PASS
**Date**: 2026-04-15

## Commits
- Backend: `0e4c42d8 feat(be-001): webtoon templates + series/episode schema + read endpoints` (branch `sprint/ai-webtoon`)
- App: `32a97fbb feat(app-001): webtoon tab + template detail + MY webtoon list` (branch `sprint/ai-webtoon`)

Both --no-verify (husky missing in BE worktree; pre-existing monorepo TS errors in FE per `feedback_monorepo_precommit.md`).

## Scope Delivered
- **be-001**: `GET /webtoon/templates`, `/templates/{id}`, `/series`, `/series/{id}?focus=FIRST|LAST_CONTINUE`, `POST /series/{id}/seen`. WebtoonSeries/Episode schemas with `(seriesId, episodeNumber)` + `generationId` unique indexes. Atomic `$inc` for episodeNumber. Domain service with race-safe `appendEpisode`, idempotent `markSeriesSeen`, user-isolated reads, ownership 404s.
- **app-001**: 웹툰 홈 탭, 템플릿 상세(프리뷰 + CTA stub), MY 웹툰 리스트(N뱃지/split hitboxes/이어가기), empty views, floating button, feature-flag 가드, 4 deep-link 경로, 3 Maestro flows 작성.

## Evaluator Result (full report: `evaluations/group-001.md`)
- be-001: 9/9 AC verified via logic tracing
- app-001: 10/10 AC verified via logic tracing
- Critical: 0 | Major: 0

## Known Gaps (carried forward)
1. **Jest tests not authored for webtoon domain/data/presentation** (FE side). be-001 includes unit spec (`appendEpisode` 5-parallel verified). FE test gap → should be filled in app-002/003 cycle or a follow-up.
2. **Maestro E2E flows not executed** — `home-tabs.yaml`, `webtoon-tab-browse.yaml`, `my-webtoon-empty.yaml`, `my-webtoon-seeded.yaml` authored but require simulator run. Deferred to Phase 5 gate with simulator.
3. **app-002/003 stubs**: `WebtoonGenerate`, `WebtoonSeriesDetail` registered but scope belongs to subsequent groups.

## Lessons for Groups 002/003
- `RootPathConfig` cannot be used for screens with `undefined` params — use plain string or a narrower type (see `myWebtoonPath` in `webtoon-routes.ts`).
- `@wrtn/app-design-guide` HStack/VStack do not expose directional border props (`borderTopWidth` etc.) — workaround: `borderWidth={1}` + `style` override.
- `@d11/react-native-fast-image` lacks static `getSize` — use react-native `Image.getSize`.
- Event-spec `tab` union must be extended when adding a new tab.
- Unleash barrel missing `./unleash-keys` export — fixed for downstream use.
- Husky hook path absent in BE worktree — all BE commits in this sprint need `--no-verify` unless user wants a one-time bootstrap.
