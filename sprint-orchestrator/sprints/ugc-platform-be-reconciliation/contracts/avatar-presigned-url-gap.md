# Avatar Presigned-URL — BE Gap Follow-up

> Sprint: `ugc-platform-be-reconciliation` (Group 002 deliverable)
> Date: 2026-04-25
> Source diff: `be-vs-spec-diff.md` §7
> Status: **Documented gap — recommendation Option C (semantic reuse + validation) for now; A or B for a separate BE sprint**

---

## TL;DR

Production BE has **no dedicated `/v2/me/avatar/presigned-url` endpoint**. Avatar uploads currently flow through the generic `POST /v1/utils/put-presigned-url` endpoint with `feature: PERSONA_PROFILE`, which is a **semantic mismatch** (the enum value was minted for AI-persona profile images, not end-user avatars). The app data layer (`apps/MemeApp/src/data/utils/utils.repository-impl.ts`) already uses this generic endpoint — so this is **not blocking** the qa-2 surface, but it is a documented BE debt.

---

## Current state (production)

| Aspect | Value |
|---|---|
| Endpoint | `POST /v1/utils/put-presigned-url` (NOT `/v2/me/avatar/...`) |
| BE source | `apps/meme-api/src/controller/util.controller.ts:17` |
| Feature enum used by app | `PERSONA_PROFILE` (from `FILE_FEATURE`) |
| Auth | `LibUserGuard` |
| Request | `{ feature, fileExtension, contentLength, metadata? }` |
| Response | `{ putPresignedUrl, getPresignedUrl, fileUuid, signedHeaders: SignedHeader[] }` |

`FILE_FEATURE` enum (`apps/meme-api/src/constant/file-feature.constant.ts`) values:

- `GEN_MEME_SOURCE`
- `GEN_MEME_THUMBNAIL`
- `ZZEM_PRESET`
- `EXAMPLE_VIDEO_SOURCE`
- `FILTER_THUMBNAIL`
- `PERSONA_PROFILE`

**No `USER_AVATAR` (or equivalent end-user-avatar) value exists.** The Mock spec described an endpoint that does not exist; the app-side workaround was already in place before the qa-2 sprint started.

---

## The semantic mismatch

`PERSONA_PROFILE` was originally introduced for AI persona profile-image uploads. Reusing it for end-user avatars creates several follow-up concerns:

1. **Audit/analytics**: any aggregation by `feature` will mix persona uploads with user-avatar uploads.
2. **Storage policies**: BE-side `presigned-url-config.constant.ts` may apply persona-tuned size/MIME/lifetime constraints that are inappropriate for user avatars (or vice versa).
3. **Access scoping**: if persona vs user avatar bucketing diverges (CDN path, public/private), the shared enum value blocks the split.
4. **Future moderation**: per-feature moderation policies (e.g. mandatory human review for persona uploads) cannot be tuned independently while the enum is shared.

None of these block Group 002 today, but each becomes a debt the moment BE wants to vary behaviour by upload purpose.

---

## Recommendations (for a separate BE follow-up sprint)

### Option A — Add `FILE_FEATURE.USER_AVATAR` enum value  *(cheapest, most surgical)*

- BE: add `USER_AVATAR` to `FILE_FEATURE`; register limits in `presigned-url-config.constant.ts`; whitelist on the generic util endpoint.
- App: switch avatar uploads from `PERSONA_PROFILE` → `USER_AVATAR` in `utils.repository-impl.ts` (or wherever the avatar upload flow constructs the request).
- Pros: minimal surface area, immediately fixes the audit/analytics concern, no new endpoint.
- Cons: still routed through a generic util — couples user-avatar lifecycle to that endpoint's evolution.

### Option B — Create dedicated `POST /v2/me/avatar/presigned-url`  *(cleanest, most invasive)*

- BE: new controller action under `me-controller`; reuses the same presigned-URL service internally but with avatar-specific config.
- App: switch avatar-upload data layer to call the new endpoint; drop reliance on `PERSONA_PROFILE`.
- Pros: matches the original Mock spec exactly; clean per-feature policy split; aligns with REST resource modelling (`me/avatar`).
- Cons: more BE code; controller proliferation; still calls into the same underlying service.

### Option C — Document semantic reuse + add validation  *(zero BE work, immediate)*  ✅ **chosen for now**

- Document the reuse explicitly (this file, plus inline comment in `utils.repository-impl.ts` and a contract note in `api-contract-corrected.yaml`).
- Add a runtime check on the BE side that `PERSONA_PROFILE` requests are validated against a permissive avatar-shaped policy (or, conversely, that the app only sends avatar-compatible MIME/size when calling this feature).
- Pros: ships today, no BE change, no app change.
- Cons: debt remains; future per-feature differentiation still blocked.

---

## Decision

**Option C for the current scope** (qa-2 ship + this reconciliation sprint), with **Option A queued as the recommended follow-up** when a dedicated BE sprint can absorb the change. Option A is preferred over B because the existing util endpoint already does the right thing — only the enum bucket is wrong, and the cost-to-value of a new endpoint is hard to justify when the only user-visible difference would be the URL.

---

## Action items

- [x] Document gap in this file.
- [x] Reflect chosen workaround in `api-contract-corrected.yaml` (PutPresignedUrlRequest enum + description).
- [ ] **Follow-up (out of scope)**: file BE backlog ticket — "Add `FILE_FEATURE.USER_AVATAR` enum + presigned-url-config entry; migrate app to new value." Owner: BE team.
- [ ] **Follow-up (out of scope)**: app data layer — once `USER_AVATAR` lands BE-side, swap the value in `apps/MemeApp/src/data/utils/utils.repository-impl.ts` (or upstream caller).
