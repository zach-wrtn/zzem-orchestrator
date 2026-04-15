# Group 001 Evaluation — ai-webtoon
Verdict: PASS
Date: 2026-04-15

## be-001 Done Criteria
- [✓] Template registry = exactly 2 (PERSON 1, ANIMAL 1), schema shape — `backend/apps/meme-api/src/domain/webtoon-template/webtoon-template.registry.ts:13-38`. `WEBTOON_TEMPLATES` freezes two entries (`tpl_person_romance` PERSON, `tpl_animal_adventure` ANIMAL). Response shape mapped via `WebtoonTemplateListResponseDto`.
- [✓] 404 on unknown templateId — `webtoon-template.error.ts:7` (`TemplateNotFoundError extends NotFoundException`) thrown from `webtoon-template-domain.service.ts:19`. Controller `getTemplateDetail` lets NestJS map to 404.
- [✓] WebtoonSeries/WebtoonEpisode Mongoose schema + repo + domain service — `persistence/webtoon-series/webtoon-series.schema.ts`, `persistence/webtoon-episode/webtoon-episode.schema.ts`, repositories under `persistence/webtoon-{series,episode}/`, domain service at `domain/webtoon-series/webtoon-series-domain.service.ts`.
- [✓] Unique indexes `(seriesId, episodeNumber)` and `generationId` — `webtoon-episode.schema.ts:64` and `:66` declare `{ unique: true }` on both.
- [✓] `appendEpisode` race-safety — `webtoon-series-domain.service.ts:61-77` + `webtoon-series.repository.ts:50-62`. Atomic `$inc` via `findOneAndUpdate` yields distinct counter values; `(seriesId, episodeNumber)` unique index is the backstop. 5-parallel test exists at `unit-test/webtoon-series-domain.service.spec.ts:76-109` asserting `[1,2,3,4,5]` with no duplicates.
- [✓] `markSeriesSeen` idempotent — `webtoon-series-domain.service.ts:91-103` uses `clearUnseenIfSet` which filters `hasUnseenEpisode: true` so 2nd call returns `null` → `{ changed: false }`. Spec covers first/second call (`.spec.ts:127+`).
- [✓] `GET /series` user isolation + sort desc — `webtoon-series.repository.ts:30-40` filters `userId` and sorts `{ lastEpisodeCreatedAt: -1, _id: -1 }`. App service returns only that user's list.
- [✓] `GET /series/{id}?focus=LAST_CONTINUE` → `focusEpisodeNumber` = max COMPLETED or null — `webtoon-series-domain.service.ts:117-121` + `webtoon-episode.repository.ts:53-63` queries `status=COMPLETED` sorted desc limit 1, returning `null` when none.
- [✓] `POST /seen` 404 on non-owned/non-existent — `assertOwnership` at `webtoon-series-domain.service.ts:143-152` throws `NotFoundException` when `!series || series.userId !== userId`. Called before the clear path in `markSeriesSeen`.

## app-001 Done Criteria
- [✓] `[추천]` default + `[웹툰]` visible — `home.screen.tsx:36-48` sets `selectedTab` default `"recommend"`; `home-header.tsx:59-72` renders webtoon tab when flag on.
- [✓] Webtoon tab renders 2 cards; empty → `WebtoonEmptyView` — `webtoon-tab.screen.tsx:65-97` branches on `isEmpty`.
- [✓] Template card → detail heading/preview/CTA — `webtoon-template-detail.screen.tsx:48-97` (HeaderBar title, FastImage preview, bottom-fixed RegularButton CTA).
- [✓] `WebtoonFloatingButton` → `MyWebtoonScreen` — `webtoon-tab.screen.tsx:35-37,98`.
- [✓] MY empty → `MyWebtoonEmptyView` — `my-webtoon.screen.tsx:71,80-81`.
- [✓] SeriesRow split hitboxes → FIRST vs LAST_CONTINUE — `my-webtoon.screen.tsx:18-30` two callbacks; `series-row.tsx:35-78` `VStack.Pressable onPressCard` vs `VStack.Pressable onPressContinue` with distinct testIDs.
- [✓] `hasUnseenEpisode` → conditional `NBadge` — `series-row.tsx:51-59` conditional.
- [✓] Series detail entry → `POST /seen` — `hooks/useSeenMark.ts:12-30` auto-calls `useMarkWebtoonSeriesSeenUseCase` on mount.
- [✓] Deep links `zzem://webtoon`, `zzem://webtoon/my` — `shared/routes/webtoon-routes.ts:10` + `useNavigationLinking.ts:10-25` (`webtoon` base → `home?tag=webtoon`, `/continue` → focus query normalization).
- [✓] Feature flag off → webtoon tab hidden — `home-header.tsx:55-72` tabItems excludes webtoon when `UNLEASH_VARIANT_KEYS.WEBTOON_TAB_ENABLED` is off; `home.screen.tsx:31-41` falls back to recommend when tag=webtoon but flag off.

## Critical Issues (blockers)
None.

## Major Issues (should fix this sprint)
None.

## Deferred to app-002/003 (documented in task specs)
- `WebtoonGenerateScreen` navigation target is a stub (`WebtoonGenerateStubScreen` in root navigator) — planned for app-002.
- `WebtoonSeriesDetailScreen` implementation is a stub — planned for app-003. Current navigate calls from `SeriesRowItem` and deep links already pass correct `focus` param.
- `useMarkWebtoonSeriesSeenUseCase` consumed by `useSeenMark`, but actual detail screen wiring lands in app-003.

## Notes
- Tests: BE unit tests (template registry, domain service concurrency + idempotency) present. FE jest tests for webtoon not authored this sprint (pre-flagged gap, acceptable).
- E2E Maestro YAMLs referenced but not executed in session (pre-flagged).
- Pre-existing TS/ESLint errors in home-header.tsx etc. confirmed unrelated to group-001 diff.
- BE `--no-verify` commit confirmed due to husky missing in worktree (infra), not a code quality regression.
- Minor defensive behavior: `buildSeriesSummaryFromParts` resolves missing templateId to fallback DTO rather than 500 — sensible and logged.
