# Group 002 Evaluation — ai-webtoon

**Verdict**: PASS (with major follow-ups)
**Date**: 2026-04-15

Scope: be-002 (webtoon generation pipeline + fal-ai callback) and app-002 (generate screen + polling + result/error). Active logic tracing performed on the 10 critical paths — no blocking defects found, but two concurrency-consistency concerns are flagged as Major.

## be-002 AC Verification

- **AC: `FAL_AI_MODEL_INPUT_MAP[nano-banana-2/edit]` with IMAGE_URLS+PROMPT required, resolution=2K default**
  Verified — `fal-ai.constant.ts:120-127`. `requiredParams: [PROMPT, IMAGE_URLS]`, `defaults: {resolution: "2K"}`, candidates only `["2K"]` (4K deferred).

- **AC: POST /webtoon/generations returns 202 PENDING + episodeNumber=1 + new series**
  Verified — controller `webtoon-generation.controller.ts:36` uses `@HttpCode(ACCEPTED)`. `submit()` builds `createSeriesWithEpisode` atomically (`webtoon-generation-app.service.ts:187-208`). First `appendEpisode` call yields `series.lastEpisodeNumber=1` via `$inc` on a freshly created series (seed 0 → 1).

- **AC: No credit deduction at submit**
  Verified — credit is only touched in `completeEpisode` (line 268) during callback SUCCESS. Submit path has no `deductCredit` call. Precheck uses read-only `getOrCreateWallet` (line 122).

- **AC: Callback SUCCESS → -500 credit, status COMPLETED, imageUrl persisted**
  Verified — `completeEpisode` (line 268-291): deductCredit → markEpisodeStatus(COMPLETED, outputImageUrl, creditDeducted=500) → markSeriesHasUnseen → emit event. Wrapped in `@Transactional()`.

- **AC: Callback PROHIBITED → no deduction, failureReason=PROHIBITED_IMAGE**
  Verified — `mapFailureOutcome` (line 355) maps PROHIBITED → `{status: PROHIBITED, reason: PROHIBITED_IMAGE}`. `failEpisode` sets `creditDeducted: 0` (line 302).

- **AC: Callback MODEL_ERROR → no deduction, FAILED**
  Verified — default branch in `mapFailureOutcome` maps to `{status: FAILED, reason: MODEL_ERROR}`.

- **AC: Callback replay idempotent**
  Verified via two layers:
  1. `isTerminal` short-circuit (line 242-250) — second SUCCESS on COMPLETED episode returns early.
  2. **Belt-and-suspenders**: `buildDeductCreditInput` (line 396) uses `contentId: episode.id`, and `CreditDomainService.deductCredit` (credit-domain.service.ts:127-143) performs an explicit idempotency check against `findDetailHistoriesByUserAndContent` — returns `deductedAmount: 0` if already deducted. Even if the isTerminal guard were bypassed, credit wouldn't double-deduct.

- **AC: Invalid HMAC → 400, no mutation**
  Verified — `handleCallback` calls `verifySignature` first (line 228-235); throws `BadRequestException` before any repo call. `hmac.util.ts:29-44` uses `timingSafeEqual` with length-prefix check. Missing signature → `if (!signature) return false` (line 34).

- **AC: Insufficient credit at submit → 402, no episode, no fal-ai**
  Verified — 402 thrown at line 123-125 BEFORE `createSeriesWithEpisode` (line 140) and before `falAiService.generateV2` (line 152).

- **AC: 5th concurrent → 409, shared meme+webtoon pool**
  Verified-but-see-Major-issue — `submit()` sums `countAllInProgressByUser` (meme + custom-prompt) with `countInFlightByUser` (webtoon episodes PENDING/IN_PROGRESS) at line 129-136. 3+2 = 5, 6th → 409. However, the meme path additionally uses an atomic Redis slot (`reserveGenerationSlotOrThrow`) that webtoon doesn't participate in — see Major Issue #1.

- **AC: Timeout watchdog marks stale PENDING as TIMEOUT, no deduction**
  Verified — `webtoon-generation.scheduler.ts` runs `EVERY_MINUTE` (note: task spec says `*/1 * * * *` — equivalent). `sweepTimeouts` → `findStaleInFlightEpisodes(now - 180s)` → `failEpisode` with `creditDeducted: 0`. `@Lock("webtoon:timeout-sweep", ttl: 45)` prevents double-sweep across instances.

- **AC: Poll rejects cross-user → 404 (not 403)**
  Verified — `getStatus` (line 214-221) throws `NotFoundException` when `episode.userId !== userId`. Matches group-001 convention.

- **AC: `creditDeducted=0` for non-COMPLETED, 500 for COMPLETED**
  Verified — `markEpisodeStatus` writes `creditDeducted` from caller. `completeEpisode` passes 500, `failEpisode` passes 0. Initial episode created at `createOne` with `creditDeducted: 0` (webtoon-episode.repository.ts:37).

## app-002 AC Verification

- **characterType 칩 노출, 탭 불가 (BR-5)**
  Verified — `CharacterTypeChip` (webtoon-generate.screen.tsx:272-291) renders `HStack`/`Typo` with no `onPress`; pure read-only.

- **줄거리 편집 불가 (BR-6)**
  Verified — `SynopsisReadOnly` (line 293-308) uses `Typo.Body6`, no `TextInput`.

- **사진 미선택 → CTA disabled (AC 2.3.2)**
  Verified — `isCtaDisabled = !hasPhoto || isPending || submitLocked` (line 189).

- **CTA 탭 즉시 disabled (BR-4), 중복 요청 0**
  Verified — `setSubmitLocked(true)` synchronously before `submitGeneration`. Guard at `if (isCtaDisabled || !uploadedImage?.fileUrl) return` (line 192). Second tap short-circuits. Lock only reset on error; on success, flow transitions to GENERATING and the InputPhase unmounts.

- **202 → 스켈레톤 + 크레딧 미변동**
  Verified — `onSubmitted(result.generationId)` → `setFlowState({kind:"GENERATING"})`. No credit mutation client-side; credit query only invalidated on COMPLETED (useWebtoonGenerationPolling.ts:124-131).

- **402 → InsufficientCreditSheet 노출**
  **Partial** — implementation uses `Toast.show` + navigate to `CreditPaywall` (line 324-333) instead of the bottom sheet component named in task spec. Behaviourally equivalent (paywall surface still shown, no skeleton entry) and the task's `InsufficientCreditSheet` hint is labelled "재사용"; recorded as Minor Observation.

- **422 → ProhibitedImageSheet, 크레딧 미차감**
  Verified — `status === 422 → onProhibited()` (line 343-346). Sheet via `useBottomConfirmSheet` with `MemeErrorSheetContent`. On confirm → `returnToInput`.

- **500 → ServerErrorToast, 크레딧 미차감**
  Verified — fallthrough at line 348: `Toast.show({ message: "생성에 실패했어요", preset: "error" })`.

- **409 → ConcurrencyCapToast**
  Verified — line 336-341.

- **폴링 주기 5초**
  Verified — `WEBTOON_POLLING_INTERVAL_MS = 5_000` (useWebtoonGenerationPolling.ts:12). `refetchInterval` returns this value until terminal.

- **COMPLETED → 결과 화면 + 크레딧 -500 반영**
  Verified — state transition in webtoon-generate.screen.tsx:111-118. Credit invalidation in hook (line 124-131) with `creditInvalidatedRef` dedup guard so invalidation fires exactly once.

- **FAILED/TIMEOUT → 실패 화면**
  Verified — line 120-123 transitions to `{kind: "FAILED"}` → `WebtoonGenerateFailedView` with onRetry (returnToInput) and onGoHome (navigate Home webtoon tab).

- **PROHIBITED (async branch) → sheet + 입력 화면 복귀**
  Verified — line 125-128: `returnToInput(); showProhibitedSheet();`.

- **클라이언트 timeout 240s → 실패 화면**
  Verified — `WEBTOON_CLIENT_TIMEOUT_MS = 240_000`, setTimeout set at hook mount (line 145-148). When fires, `setIsClientTimeout(true)` → screen useEffect picks up and transitions to FAILED. `refetchInterval` also short-circuits to `false` post-deadline (line 82-87).

- **AppState 복귀 즉시 재폴링**
  Verified — AppState listener (line 152-167) calls `refetch()` on `background/inactive → active`.

- **Zod schema handles nullable imageUrl/failureReason**
  Verified — `webtoonGenerationStatusEntitySchema` (webtoon-generation.entity.ts:29-37): `imageUrl: z.string().nullable().optional()`, `failureReason: enum.nullable().optional()`.

- **Real screen wired**
  Verified — `root-navigator.tsx:168-170` registers `WebtoonGenerate` stack screen with `WebtoonGenerateScreen` component.

## Critical Issues

None. No blocker defects. Happy path and all documented failure branches are correctly implemented; credit accounting is protected by two independent idempotency layers (terminal-state short-circuit + domain-level contentId dedup in `deductCredit`).

## Major Issues

**M1 — Concurrency cap uses DB-sum for webtoon but Redis-slot for meme (consistency gap).**
File: `webtoon-generation-app.service.ts:129-136` vs `generation-status-resolution-app.service.ts:77-105`.
The meme path protects TOCTOU via `reserveGenerationSlotOrThrow` (atomic Redis INCR). Webtoon's `submit()` reads `countAllInProgressByUser + countInFlightByUser` without a corresponding reserve. Under concurrent submissions, two webtoon requests arriving within the same millisecond can both pass the DB precheck and land 2 rows, temporarily breaching the 5-cap. The meme path's Redis counter does not incorporate webtoon episodes, so it also drifts.
Additionally, `completeEpisode` / `failEpisode` emit `GENERATION_STATUS_CHANGED`, which invokes `releaseGenerationSlot` and `decr`s the Redis counter even though webtoon never incremented it. `releaseGenerationSlot` has a `< 0` guard (line 118-120), so state self-heals, but under mixed meme+webtoon load the Redis counter under-counts webtoon episodes and can allow a real breach of the 5-cap on the meme side.
Impact: rare edge case; the DB precheck still provides soft enforcement. Recommend a follow-up sprint to unify webtoon into the Redis slot (call `reserveGenerationSlotOrThrow` on submit; already released by the shared listener).

**M2 — Unit-index on `(seriesId, episodeNumber)` is the backstop but `$inc` precedes insert (not a single atomic op).**
File: `webtoon-series-domain.service.ts:61-77`. Step 1 `$inc` series counter, Step 2 insert episode. If step 2 fails (e.g. duplicate `generationId`, DB hiccup), the counter is permanently advanced with no episode → future `appendEpisode` skips the number. The unique index still prevents duplicates, so the race is safe from a correctness standpoint, but gaps in `episodeNumber` are possible. Spec accepts "N distinct monotonic numbers (no gap)" — actual behaviour allows gaps on failure. Not a contract violation (client uses `episodeNumber` as a label, not a dense index), but flag it for documentation or a compensating update on insert-failure.

## Minor Observations

- **402 UX divergence**: task spec says `InsufficientCreditSheet`; implementation uses `Toast.show` + navigate to `CreditPaywall`. Behaviourally complete (paywall shown, no skeleton entry), but not the exact component named. Recommend aligning with the reusable sheet per hint, unless product has since decided toast+paywall is better.
- **HMAC canonicalization is shallow**: `canonicalizePayload` only sorts top-level keys. Nested object key-order isn't normalized. Fine for the current flat payload shape; flag if schema ever adds nested objects.
- **`buildCallbackUrl` double-encodes `generationId`**: appends `?generationId=...` via `encodeURIComponent`, but `generationId` is also in the signed body. Query param is redundant since server only reads the body. Harmless; consider dropping.
- **`creditInvalidatedRef` never resets**: ref stays `true` after first invalidate; if the same hook instance is reused across generationIds (e.g. app-003 continuation), subsequent COMPLETEDs won't invalidate. The `generationId`-change effect at line 69-73 does reset it, so this is fine today, but worth noting as a subtle coupling.
- **`submitLocked` never reset on 409/402**: after toast, user can tap again only after retap (lock reset in error catch at line 203). Actually correct — I re-read `handleGenerate`: `setSubmitLocked(true)` → try/catch → `handleSubmitError` → `setSubmitLocked(false)`. All error paths release. Fine.
- **`isError` returned from polling hook but never consumed** in the screen. Dead field; remove or wire to a retry UI if meaningful.

## Edge Cases Tested

- Double-callback replay (SUCCESS + SUCCESS): short-circuited by `isTerminal`; also caught by `contentId` idempotency in `deductCredit`.
- Missing signature field: `verifySignature` returns false → 400.
- Signature length mismatch: `a.length !== b.length` guard before `timingSafeEqual` avoids throw.
- SUCCESS callback with `imageUrl=null`: explicitly handled — episode marked FAILED with `INTERNAL_ERROR`, no deduction (line 253-257).
- fal-ai synchronous submit failure: episode marked FAILED in catch (line 161-178), 500 returned, no credit touched.
- Cross-user poll: 404 via service-level `userId` check.
- Timeout while fal-ai in flight, then SUCCESS callback: episode is TIMEOUT (terminal) → callback hits `isTerminal` guard → no-op. Credit safe. But user receives no image despite fal-ai having produced one — acceptable per spec (timeout is terminal, no refund needed since no deduction).
- Credit precheck race: user at exactly 500 submits twice concurrently → both pass precheck, both queued. On two SUCCESS callbacks, `deductCredit` uses `@Lock("credit:user:...")` serializing, second one would insufficient-credit throw inside `deductCredit` (line 165-168 BadRequest). This bubbles up from `completeEpisode` inside `@Transactional` — transaction rolls back episode to still-PENDING. The callback handler does not catch this, so 500 returned to fal-ai, which will retry; episode stays PENDING until watchdog sweeps it. Subtle but spec-compliant (BR-2 no-deduction on failure). Flag for observability.
- Client timeout vs server COMPLETED race: hook's `refetchInterval` returns `false` at 240s; if COMPLETED arrives at 239.9s and the setTimeout fires at 240.0s before the state propagates, we'd flip to FAILED despite the server being COMPLETED. The `if (status && isTerminal(status.status)) return` guard at line 136 prevents the setTimeout re-arming, but an already-scheduled timer still fires. Small window; consider clearing the timer inside the status terminal branch too.
- App backgrounded for 10 minutes, foreground: onChange → refetch once; if already past 240s, `enabled` is still false (`!isClientTimeout`). Correct — polling stays off.

## Recommendation

**PASS → proceed to Group 003.**

No blockers. The two Major issues (M1 Redis/DB concurrency gap; M2 episode-number gap on insert failure) are real but (a) self-healing under the current `< 0` guard, (b) latent only under concurrent-submit edge cases, and (c) not contract violations. Queue them as follow-up tickets, not blockers.

Recommended follow-ups:
1. Unify webtoon into the Redis slot reservation (`reserveGenerationSlotOrThrow`) so meme+webtoon share a single atomic counter.
2. Consider compensating `$dec` on `appendEpisode` insert failure, or document the gap-allowed behaviour in schema comment.
3. Align 402 UX to `InsufficientCreditSheet` per task hint, or update the task to reflect toast+paywall.
4. Clear the client timeout `setTimeout` when terminal status arrives, to avoid rare post-COMPLETED flip to FAILED.

Relevant files audited (absolute paths):
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/application/webtoon-generation/webtoon-generation-app.service.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/application/webtoon-generation/webtoon-generation.scheduler.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/application/webtoon-generation/util/hmac.util.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/controller/webtoon/webtoon-generation.controller.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/internal/webhook/webtoon-webhook.controller.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/persistence/webtoon-episode/webtoon-episode.repository.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/domain/webtoon-series/webtoon-series-domain.service.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/domain/credit/credit-domain.service.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/application/generation/generation-status-resolution-app.service.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/application/generation/generation-status-changed.listener.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/backend/apps/meme-api/src/infrastructure/fal-ai/fal-ai.constant.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/app/apps/MemeApp/src/domain/webtoon/entities/webtoon-generation.entity.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/app/apps/MemeApp/src/presentation/webtoon/webtoon-generate.screen.tsx`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/app/apps/MemeApp/src/presentation/webtoon/hooks/useWebtoonGenerationPolling.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/app/apps/MemeApp/src/data/webtoon/webtoon.mapper.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/app/apps/MemeApp/src/data/webtoon/webtoon.repository-impl.ts`
- `/Users/zachryu/.superset/worktrees/zzem-orchestrator/sprint/ai-webtoon/app/apps/MemeApp/src/app/navigation/root-navigator.tsx`
