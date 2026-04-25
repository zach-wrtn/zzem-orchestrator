# Phase 2 Checkpoint — Group 002 Spec Fix

> Sprint: `ugc-platform-be-reconciliation`
> Date: 2026-04-25
> Phase: 2 (Group 002 — spec correction, fix-only)
> Branch: `chore/be-spec-reconciliation`

---

## Outcome

| Metric | Count |
|---|---|
| Endpoints corrected from Mock | 7 |
| Endpoints newly added (missing from Mock) | 2 |
| **Total endpoints in corrected spec** | **9** |
| BE gaps documented for follow-up | 1 |
| App data layer changes | **0** (verified already aligned) |
| BE changes | **0** (per sprint NEVER DO) |

---

## Deliverables

1. `sprints/ugc-platform-be-reconciliation/contracts/api-contract-corrected.yaml`
   — Single source corrected OpenAPI 3.0 spec (9 endpoints).
2. `sprints/ugc-platform-be-reconciliation/contracts/avatar-presigned-url-gap.md`
   — Follow-up doc describing the missing dedicated avatar presigned-url endpoint and recommendations (A/B/C).
3. `sprints/ugc-platform-be-reconciliation/checkpoints/phase-2-summary.md`
   — This file.

Pre-existing input (Group 001 output, not modified here):
- `sprints/ugc-platform-be-reconciliation/contracts/be-vs-spec-diff.md`

---

## 9 endpoints in corrected spec

| # | Method + Path | Type | Notes |
|---|---|---|---|
| 1 | `POST /v1/utils/put-presigned-url` | corrected | was `POST /v2/me/avatar/presigned-url`; request `{feature, fileExtension, contentLength, metadata?}`; response `signedHeaders` is array of `{name,value}` |
| 2 | `POST /v2/users/{userId}/blocks` | corrected | was `/block` (singular); response `200 BlockStateResponse` (not `204`) |
| 3 | `DELETE /v2/users/{userId}/blocks` | corrected | was `/block` (singular); response `200 BlockStateResponse` (not `204`) |
| 4 | `GET /v2/me/blocks` | corrected | was `/v2/me/blocked-users`; response container `list` (not `items`); `limit` max 100 |
| 5 | `GET /v2/me/notifications` | corrected | schema-only: `items`→`list`, `id`→`notificationId`, `read`→`unread`, `actorNickname`/`actorAvatarUrl`→`actorUserId`, type enum→`[LIKE, FOLLOW, PAYBACK]`; top-level `unreadCount` removed |
| 6 | `GET /v2/me/notifications/unread-count` | newly added | red-dot count; missing in Mock |
| 7 | `POST /v2/me/notifications/read-all` | newly added | idempotent mark-all-read; missing in Mock |
| 8 | `GET /v2/me/notification-settings` | newly added | implied-only in Mock; field `pushAll` (not `push`); BE override doc'd |
| 9 | `PATCH /v2/me/notification-settings` | corrected | request/response field `push`→`pushAll`; partial update (`minProperties: 1`); `403 PERSONA_NOTIFICATION_LOCKED` |

---

## BE gap — avatar presigned-url

- **Gap**: no dedicated `/v2/me/avatar/presigned-url`. `FILE_FEATURE` enum has no `USER_AVATAR` value.
- **Current workaround**: `POST /v1/utils/put-presigned-url` with `feature: PERSONA_PROFILE` (semantic mismatch).
- **Recommendation chosen**: **Option C** (document semantic reuse + add validation) for the current scope.
- **Recommended follow-up**: **Option A** (add `FILE_FEATURE.USER_AVATAR` + migrate the app), queued for a separate BE sprint.
- **Detail**: see `avatar-presigned-url-gap.md`.

---

## App data layer — no changes

App data layer was audited in Group 001 (see `be-vs-spec-diff.md` "App data layer audit" table). All 9 affected URLs already match production BE:

- `apps/MemeApp/src/data/user-block/user-block.repository-impl.ts` (`/blocks` plural, `/me/blocks`)
- `apps/MemeApp/src/data/notification/notification.repository-impl.ts` (`list`, `notificationId`, `unread`, `unread-count`, `read-all`)
- `apps/MemeApp/src/data/notification-setting/notification-setting.repository-impl.ts` (`pushAll`)
- `apps/MemeApp/src/data/utils/utils.repository-impl.ts` (`/v1/utils/put-presigned-url`)

**Sprint Lead pre-confirmed no app fix needed.** This checkpoint formalises that decision.

---

## Constraints honoured

- ✅ qa-2 sprint files (`sprint-orchestrator/sprints/ugc-platform-integration-qa-2/`) **not** modified — corrected spec lives in the be-reconciliation sprint.
- ✅ App data layer **not** changed (audit confirmed correct).
- ✅ BE **not** changed.

---

## Next

- PR `chore(sprints): be-reconciliation Group 002 spec fix` against `main`, squash-merge.
- Group 003 (audit) effectively closed by Group 001's audit table — no further work required for this sprint.
- File BE follow-up ticket per Option A (`FILE_FEATURE.USER_AVATAR`) — out of scope for this sprint.
