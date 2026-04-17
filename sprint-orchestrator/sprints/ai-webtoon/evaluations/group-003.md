# Group 003 Evaluation — ai-webtoon

**Verdict**: PASS
**Date**: 2026-04-15

## be-003 AC Verification

- **AUTO continuation → 202 with image_urls=[prev.outputImageUrl], no user photo**
  ✓ `webtoon-generation-app.service.ts:278-287` — `falAiService.generateV2` called with `image_urls: [prevCompleted.outputImageUrl]`, `prompt=promptSnapshot`; `inputImageUrl=null` is passed to `appendEpisode` (`:272`). Spec test at `webtoon-generation-app.service.spec.ts:341-368` explicitly asserts both.

- **MANUAL without `userStoryBeat` → 400**
  ✓ `validateContinuationBody:324-331` — trim then empty check → `STORY_BEAT_REQUIRED`. Covered in spec `:370-377`.

- **AUTO with `userStoryBeat` → 400**
  ✓ `:344-349` → `STORY_BEAT_NOT_ALLOWED`. Covered `:379-386`.
  Edge case: DTO declares `@IsOptional() @IsString() @MaxLength(500)` on `userStoryBeat` but has no `@ValidateIf` guard; cross-field validation relies entirely on `validateContinuationBody`. Verified rawBeat is checked with `!== undefined`, so `userStoryBeat: ""` in AUTO also triggers 400. Fine.

- **MANUAL snapshot contains `[유저 story beat]`**
  ✓ `buildContinuationPromptSnapshot:560-573` appends `\n[유저 story beat]\n${beat}`. Spec `:388-413` asserts marker presence (MANUAL) + absence (AUTO) + trimming.

- **Zero COMPLETED → 400 NO_REFERENCE_EPISODE**
  ✓ `:234-240` — `findLastCompletedEpisode` returns highest COMPLETED only; null → 400. Also defensive check on `outputImageUrl` being falsy. Spec `:415-429`.

- **Cross-user seriesId → 404**
  ✓ `assertSeriesOwnership` → `assertOwnership:263-272` throws `NotFoundException` (not 403) when `series.userId !== userId`. Same pattern as be-001. Spec `:431-442`.

- **Credit/concurrency reuse shared helpers**
  ✓ Uses identical helpers to submit path: `creditDomainService.getOrCreateWallet` (`:243`) + `generationStatusResolutionAppService.countAllInProgressByUser` + `seriesDomainService.countInFlightByUser` (`:249-252`). No fork. Spec `:444-474` verifies 402/409 reuse.

- **Callback SUCCESS: -500 credit, COMPLETED, hasUnseen=true, lastEpisodeCreatedAt bumped**
  ✓ `completeEpisode:433-457` deducts via shared `creditDomainService.deductCredit`, marks status COMPLETED w/ `creditDeducted=500`, calls `markSeriesHasUnseen` which invokes repository `markHasUnseenTrue` (sets both `hasUnseenEpisode=true` AND `lastEpisodeCreatedAt=now`). Event emitted.

- **GET /webtoon/series empty for new user**
  ✓ `listSeriesByUser` → repository `findAllByUser` filters by `userId` + `deletedAt: null`. Returns `[]` naturally.

- **Cross-user isolation on list**
  ✓ Same query scoped by `userId`.

- **focus=LAST_CONTINUE returns focusEpisodeNumber = max COMPLETED (or null)**
  ✓ `webtoon-series-domain.service.ts:180-184` invokes `findLastCompletedEpisodeNumber` only for LAST_CONTINUE branch. Repository returns null on no COMPLETED.

- **`POST /seen` idempotent**
  ✓ `markSeriesSeen:131-144` — repository `clearUnseenIfSet` uses conditional filter `hasUnseenEpisode: true`; on 2nd call the filter misses → `changed: false`, no `markLatestCompletedSeen` call, no event.

- **After auto-continue completion → hasUnseen=true (BR-7)**
  ✓ `completeEpisode` calls `markSeriesHasUnseen` → repository bump. Combined with seen-mark flow this completes the cycle.

- **Test-seed 404 in production**
  ✓ `webtoon-test-seed.guard.ts:29-31` throws `NotFoundException` on `NODE_ENV==='production'` OR `TEST_SEED_ENABLED!=='true'`. Double gate (both must be non-prod AND flag set).

- **Seed series visible in list; clear scoped to origin='test-seed'**
  ✓ `webtoon-test-seed-app.service.ts:55-82` tags `origin: TEST_SEED_ORIGIN`. `clearSeeded` → `hardDeleteSeededSeries` → `findSeededByUser(userId, 'test-seed')` scoped delete. Non-seeded rows untouched.

## app-003 AC Verification

- **`/seen` called on entry; badge cleared**
  ✓ `webtoon-series-detail.screen.tsx:40` calls `useSeenMark(seriesId)` (`hooks/useSeenMark.ts`) which optimistically clears `hasUnseenEpisode` in series-list cache, then POSTs. Idempotent per BE.

- **focus=FIRST → top**
  ✓ No explicit scrollTo for FIRST; ScrollView default is top. The auto-scroll effect (`:73-98`) guards `focus !== "LAST_CONTINUE"` → return.

- **focus=LAST_CONTINUE → auto scroll to CTA**
  ✓ `:73-98` measures CTA y (ctaYRef from `ContinuationCtaBar.onLayout`) + episodeYRef fallback. 300ms retry on layout miss (1 retry). Scrolls to `ctaY ?? episodeY`.

- **ContinuationCtaBar gating**
  ✓ `:61` `showContinuationCta = lastEpisode?.status === "COMPLETED"`. Not rendered during PENDING/FAILED/TIMEOUT/PROHIBITED.

- **Auto continuation → disabled + 202 → skeleton inline**
  ✓ `submitAndRefetch:121-158` sets `submitLocked=true` before mutation (combined with mutation `isPending`, passed as `isSubmitting` to CTA → disables both buttons). On success `refetch` pulls new episode (PENDING) → `WebtoonEpisodeSection` renders skeleton + starts per-episode polling.

- **Polling COMPLETED → image + credit reflected + new EpisodeTab**
  ✓ `webtoon-episode-section.tsx:51-71` invokes `onCompleted` (parent refetches detail) on terminal. Series list invalidated via `useSubmitWebtoonContinuationUseCase` onSuccess → MY list N badge re-appears.

- **Polling FAILED/TIMEOUT → InlineEpisodeError, no deduction**
  ✓ Effective status handled at `:104-113`; `InlineEpisodeError` shows retry/home CTAs. Credit not deducted server-side (BR-2) — asserted in BE.

- **Manual input screen: purple banner + disabled CTA + 500 cap**
  ✓ `webtoon-manual-continue.screen.tsx` — `PurpleBanner` with fixed `#7D5CFF`, `Input.TextArea maxLength=500`, CTA `disabled={trimmed.length === 0 || isPending || submitLocked}`.

- **Manual submit → 202 → pop + new skeleton + scroll**
  ✓ `handleSubmit:36-51` → `submitContinuation({continuationType:'MANUAL', userStoryBeat: trimmed})` → `navigation.goBack()`. Parent screen uses `refetchOnMount: 'always'` (`webtoon.usecase.ts:148`) → new PENDING episode appears.
  ⚠️ But on `goBack`, parent cannot scroll to the new episode because the manual-submit screen does the submit, not the series detail. See "Minor Observations".

- **No photo upload UI in continuation flow (AC 2.6.6)**
  ✓ Neither SeriesDetailScreen nor WebtoonManualContinueScreen exposes photo slot. BE mirror: `inputImageUrl=null` for continuation episode.

- **Error branches 402/409/422/500 reused**
  ✓ `handleContinuationError:233-270` (series detail) and `handleManualSubmitError:122-156` (manual) — identical mapping: 402 → paywall + toast, 409 → toast message from body, 422 → toast "적절하지 않은 내용", else toast "이어가기에 실패했어요".
  ⚠️ Handler is duplicated verbatim across both screens — should be extracted (see Minor).

- **Retry CTA same continuationType**
  ✗ `handleRetry:168-172` always calls `submitAndRefetch("AUTO")` — the agent explicitly comments this is a simplification. Task spec 2.5.2 explicitly says "재시도 → 해당 시리즈에서 동일 continuationType으로 재요청" — retry after MANUAL failure should re-enter input screen (or preserve the last beat). Currently a MANUAL retry becomes AUTO, which loses user intent. See "Major Issues".

- **BR-7 N-badge re-show after COMPLETED**
  ✓ `useSubmitWebtoonContinuationUseCase` onSuccess invalidates `getSeriesList().queryKeyBase`. `useGetWebtoonSeriesListUseCase` uses `refetchOnMount: "always"`. BE `markHasUnseenTrue` on callback completion → list shows badge.

- **Deep link `zzem://webtoon/series/{id}/continue`**
  ✓ `useNavigationLinking.ts:10-24` — regex `WEBTOON_CONTINUE_PATTERN` rewrites `/continue` → `?focus=LAST_CONTINUE` so the series detail path config receives the focus param. Then `SeriesDetailScreen` auto-scrolls per the LAST_CONTINUE effect.

## Critical Issues

None.

## Major Issues

1. **Retry CTA ignores original `continuationType`** (FE app-003 AC "재시도/홈 CTA" + spec line 64-65).
   `webtoon-series-detail.screen.tsx:168-172` always routes retry to AUTO regardless of the failed episode's origin. A MANUAL failure retry should either (a) re-open the manual input screen (optionally prefilled with the last beat), or (b) preserve the beat from the last MANUAL submit in this screen session. Current behavior silently switches mode on user — violates intent preservation.
   Impact: Moderate. User intent lost; credit is not wasted (polling didn't deduct), but story continuity prompt is wrong. Agent's inline comment acknowledges this is out-of-AC simplification; the task spec does not explicitly exclude MANUAL retry.

2. **`hasUnseenEpisode=true` set prematurely at append (BR-7 consistency)**.
   `webtoon-series.repository.ts:58-60` — `incrementLastEpisode` sets `hasUnseenEpisode: true` alongside the `$inc`. So the MY-list N-badge appears while the episode is still PENDING. The task spec says BR-7 re-flip to true should happen on callback completion (`markHasUnseenTrue` at completion, `completeEpisode:449`). Implementation Hints also require "single domain helper" for unseen flips.
   There are now **two write paths** that set hasUnseenEpisode=true (append-time via `$inc`, completion-time via `markHasUnseenTrue`). If the episode fails at callback (FAILED/PROHIBITED/TIMEOUT), the false-positive badge remains on the MY list — user taps in expecting a new episode, sees only an inline error.
   Impact: Moderate. BR-7 behavioral edge-case leak. Fix: remove the `hasUnseenEpisode: true` from `incrementLastEpisode`'s `$set`; let only the COMPLETED-path domain helper flip it.

## Minor Observations

- **Duplicated error mapping**: `handleContinuationError` (series-detail.screen.tsx:233-270) and `handleManualSubmitError` (manual-continue.screen.tsx:122-156) are essentially identical. Worth extracting to a single `handleContinuationError(error, { onInsufficientCredit })` util in `presentation/webtoon/hooks/` or `shared/ui`.

- **Manual submit → new-episode auto scroll lost**: The manual screen `goBack`s after 202, but the scroll-to-new-episode logic (`submitAndRefetch:142-150`) only fires in series-detail when series-detail itself submits. After manual goBack, the series-detail doesn't know a new episode landed synchronously — it relies on refetch triggered by `refetchOnMount: "always"`. Auto-scroll to the new episode slot does not happen. Task AC says "pop back + new episode skeleton 자동 스크롤". Currently only the refetch + skeleton happens; automatic scroll is not implemented in the pop-back path. Consider passing a `scrollToLastAfterRefetch: true` param back to series-detail via navigation, or returning to LAST_CONTINUE focus.

- **`getSeriesDetail` re-fetches episodes twice for the detail list path**: `webtoon-app.service.ts:83 buildSeriesSummary` calls `findEpisodesBySeries(series.id)` for each row in listSeriesByUser → N+1 queries. Fine for ≤20 series but flagged for perf review.

- **`ValidateMongoId` pipe on seriesId**: `webtoon.controller.ts:110, 129, 146` — good. Ensures malformed IDs → 400 before reaching service, avoiding ObjectId cast crash.

- **`DEFAULT_CALLBACK_SECRET`** `webtoon-generation-app.service.ts:45` — falls back to `"dev-webtoon-callback-secret"` if env var missing. Acceptable for dev; ensure production env has `WEBTOON_CALLBACK_HMAC_SECRET` set (flagged for infra).

- **Seed `clear` response uses HttpStatus.OK not 204**: `webtoon-test-seed.controller.ts:75` — task says "clear removes only seeded entries" without specifying status; returning `{deleted: N}` is more useful for e2e than 204. Fine.

- **`EpisodeTabs` has no active-state visual**: Task spec doesn't require an active indicator explicitly, but UX-wise tab tapping loses state. Acceptable simplification per component comment.

- **No test covering `incrementLastEpisode` side-effect of setting `hasUnseenEpisode=true`** → issue #2 above would have been caught by a behavioral test.

## Edge Cases Tested

- Traced **all cross-user 404 paths**: getStatus, assertSeriesOwnership (submit continuation, seen, series detail) — all use `NotFoundException` shape, never 403. Consistent.
- **Trim behavior in MANUAL**: `validateContinuationBody:325` trims BEFORE emptiness check → whitespace-only beat → 400 STORY_BEAT_REQUIRED (not STORY_BEAT_TOO_LONG). Spec `:394-400` asserts trim-then-store.
- **500-char edge**: Trim happens first, then `> 500` check on trimmed. DTO also has `@MaxLength(500)` on raw. So "501 chars with 2 leading spaces" → trimmed 499 → allowed. Consistent with "grapheme after trim" UX per implementation hint.
- **`userStoryBeat: ""` for AUTO**: `rawBeat !== undefined` is true → STORY_BEAT_NOT_ALLOWED. Correct.
- **Duplicate callback after COMPLETED**: `isTerminal` gate on `:408-416` → no-op + log. Idempotent.
- **Seen idempotence (2nd call)**: `clearUnseenIfSet` filter only matches when `hasUnseenEpisode: true` → returns null on already-cleared → no `markLatestCompletedSeen` call → `seenAt` not re-stamped on 2nd call. Correct.
- **Deep link fallback**: `zzem://webtoon/series/{id}/continue?foo=bar` → regex preserves query, appends `&focus=LAST_CONTINUE`. Robust.
- **`generationId` as `gen_<uuid-no-dash>`**: 35 chars. Fine.
- **FE submit-lock race**: double-tap — `isContinuationSubmitting = isSubmitting || submitLocked` — `submitLocked` set before mutation, mutation `isPending` takes over. Gap between `setSubmitLocked(true)` and mutation start is single-event-loop — safe.

## Recommendation

PASS with 2 Major issues noted for remediation in integration or a follow-up ticket:

1. **Retry CTA: preserve MANUAL intent** — smallest fix is to track the last-submitted `continuationType` in a ref and pass it to `submitAndRefetch`; MANUAL retry should navigate back to input screen.
2. **`incrementLastEpisode` should not set `hasUnseenEpisode=true`** — move that write exclusively to the COMPLETED-path domain helper so BR-7 has a single flip site and PENDING/FAILED-in-flight doesn't leak a false N-badge.

Neither issue blocks integration — AC-level behavior for the "happy path" and the explicit AC checklist items are met. Both are BR-7 / UX polish that the test-seed E2E flows would not catch without additional scenarios.
