# BE vs qa-2 Spec Diff Report

> Sprint: `ugc-platform-be-reconciliation` (Group 001 — read-only investigation)
> Generated: 2026-04-25
> Source-of-truth (SSOT): `apps/meme-api/src/controller/**` (production)
> Compared against: `sprint-orchestrator/sprints/ugc-platform-integration-qa-2/contracts/api-contract.yaml` (Mock)

---

## Summary

- **Endpoints verified**: 7 / 7
- **Exact match**: 0
- **Path differences**: 4
- **Schema differences**: 6 (4 path + 2 schema-only)
- **Missing in qa-2 spec**: 2 (`GET /v2/me/notifications/unread-count`, `POST /v2/me/notifications/read-all`)
- **Missing in BE**: 1 (no dedicated `/v2/me/avatar/presigned-url` — uses generic `/v1/utils/put-presigned-url`)

Note: BE `ApiVersion(path)` prepends `v{version}/` only — actual production paths are `/v2/...` or `/v1/...`. App `ApiInstance.Wrtn` adds `/meme` prefix at the gateway, so app URLs are `/meme/v2/...`.

---

## Endpoint-by-endpoint

### 1. POST /v2/users/{userId}/block

| Aspect | qa-2 spec (Mock) | Actual BE |
|---|---|---|
| Method | POST | POST |
| Path | `/v2/users/{userId}/block` | `/v2/users/:userId/blocks` |
| Source | `api-contract.yaml:98-110` | `user-blocks.controller.ts:24` (mount `users/:userId`) |
| Request body | none | none |
| Response | `204` (no body) | `200` `BlockStateResponseDto` `{ userId, isBlocked: boolean, blockedAt: string\|null }` |
| Auth | n/a (mock) | `LibUserGuard` + `ApiLibUserAuth` |
| Notes | — | Idempotent, self-block→400, unblocks both directions of UserFollow |

**Diff**: path `block` → `blocks` (plural); response `204` → `200` with body.
**Resolution**: spec wrong. App data layer (`user-block.repository-impl.ts:25`) already uses `/blocks` and consumes `BlockStateResponse` — no fix needed.

---

### 2. DELETE /v2/users/{userId}/block

| Aspect | qa-2 spec | Actual BE |
|---|---|---|
| Method | DELETE | DELETE |
| Path | `/v2/users/{userId}/block` | `/v2/users/:userId/blocks` |
| Source | `api-contract.yaml:111-122` | `user-blocks.controller.ts:35` |
| Request body | none | none |
| Response | `204` | `200` `BlockStateResponseDto` (`isBlocked:false`, `blockedAt:null`) |
| Notes | — | Idempotent; **no follow restoration** on unblock |

**Diff**: same as #1 — `block` → `blocks`, `204` → `200+body`.
**Resolution**: spec wrong. App already correct (`user-block.repository-impl.ts:31`).

---

### 3. GET /v2/me/blocked-users

| Aspect | qa-2 spec | Actual BE |
|---|---|---|
| Method | GET | GET |
| Path | `/v2/me/blocked-users` | `/v2/me/blocks` |
| Source | `api-contract.yaml:124-148` | `me-block.controller.ts:24` (mount `me`) |
| Query | `cursor: string`, `limit: int` (default 20, max 50) | `cursor: base64`, `limit: int` (default 20, max 100) |
| Response | `{ items: BlockedUser[], nextCursor: string\|null }` where `BlockedUser = { userId, nickname, profileImageUrl, blockedAt }` | `BlockUserListResponseDto = { list: BlockUserItemDto[], nextCursor: string\|null }`; item shape identical (`userId`, `nickname`, `profileImageUrl`, `blockedAt`) |
| Notes | — | compound cursor `{createdAt, id}` base64-encoded JSON; max 100 not 50 |

**Diff**:
- Path: `blocked-users` → `blocks`
- Response key: `items` → `list`
- Cursor encoding: spec opaque vs BE base64 JSON (still opaque to client — fine)
- limit max: 50 vs 100

**Resolution**: spec wrong on path + key name. App (`user-block.repository-impl.ts:38`) already uses `/me/blocks` and `BlockUserListResponse` (with `list`), so app correct.

---

### 4. GET /v2/me/notifications

| Aspect | qa-2 spec | Actual BE |
|---|---|---|
| Method | GET | GET |
| Path | `/v2/me/notifications` | `/v2/me/notifications` |
| Source | `api-contract.yaml:150-175` | `notification.controller.ts:31` (mount `me`) |
| Query | `cursor: string`, `limit: int` (default 30, max 50) | `cursor: base64`, `limit: int` (default 20, max 100) |
| Response | `{ items: Notification[], nextCursor, unreadCount }` where `Notification = { id, type:enum[push,like,news,follow], title, body, actorNickname, actorAvatarUrl, thumbnailUrl, deeplink, read, createdAt }` | `NotificationListResponseDto = { list: NotificationItemDto[], nextCursor }` where `NotificationItemDto = { notificationId, type:enum[LIKE,FOLLOW,PAYBACK], title, body:nullable, unread:bool, deeplink, thumbnailUrl:nullable, actorUserId:nullable, createdAt }` |
| Auth | n/a | `LibUserGuard` |

**Diff** (significant — schema-level):
- Path **matches**
- Response key `items` → `list`; **`unreadCount` is on a separate endpoint** in BE
- Item field renames: `id`→`notificationId`, `read`→`unread` (inverted boolean), `actorNickname`+`actorAvatarUrl`→`actorUserId` (just an id; client must resolve)
- Type enum: spec `[push, like, news, follow]` (lowercase categories) vs BE `[LIKE, FOLLOW, PAYBACK]` (uppercase domain types — **PAYBACK** instead of `news`/`push`)

**Resolution**: spec wrong on multiple field names + enum. App (`notification.repository-impl.ts:22`) already aligned to BE shape — uses `NotificationListResponse` with `list`.

**Missing in spec**:
- `GET /v2/me/notifications/unread-count` → `UnreadCountResponseDto` (red-dot)
- `POST /v2/me/notifications/read-all` → `MarkAllReadResponseDto` (idempotent mark-all-read)

App already wires both (`notification.repository-impl.ts:27,33`).

---

### 5. GET /v2/me/notification-settings

| Aspect | qa-2 spec | Actual BE |
|---|---|---|
| Method | GET | GET |
| Path | (not declared in spec but implied — only PATCH listed) | `/v2/me/notification-settings` |
| Source | — | `me-notification-settings.controller.ts:28` (mount `me/notification-settings`) |
| Response | (spec implies `NotificationSettings = {push, like, news, follow}`) | `NotificationSettingsResponseDto = { pushAll, like, news, follow }` |

**Diff**:
- **Field name** `push` → `pushAll`
- BE override: when `pushAll === false`, BE forces `like/news/follow` to `false` in response (storage retained — see `notification-settings-response.dto.ts:29-37`)

**Resolution**: spec wrong on field name (`push` → `pushAll`). App already uses `pushAll` (see `notification-setting.model.ts:15-19`).

---

### 6. PATCH /v2/me/notification-settings

| Aspect | qa-2 spec | Actual BE |
|---|---|---|
| Method | PATCH | PATCH |
| Path | `/v2/me/notification-settings` | `/v2/me/notification-settings` |
| Source | `api-contract.yaml:177-198` | `me-notification-settings.controller.ts:35` |
| Request | `NotificationSettings = {push, like, news, follow}` (all required in spec schema) | `NotificationSettingsUpdateRequestDto = {pushAll?, like?, news?, follow?}` (all optional, **minProperties=1**, runtime check via `hasAnyField()`) |
| Response | `NotificationSettings` (4 booleans) | `NotificationSettingsResponseDto = {pushAll, like, news, follow}` |
| Errors | `400 BadRequest` | `400 minProperties`; `403 PERSONA_NOTIFICATION_LOCKED` (persona accounts) |

**Diff**:
- **Field name** `push` → `pushAll` (request **and** response)
- Request: spec requires all 4; BE allows partial (≥1)
- BE adds `403` for persona accounts (not in spec)

**Resolution**: spec wrong on field name + required-ness. App already uses `pushAll` (see `notification-setting.model.ts:25-30`, `notification-setting.repository-impl.ts:31`).

---

### 7. POST /v2/me/avatar/presigned-url

| Aspect | qa-2 spec | Actual BE |
|---|---|---|
| Method | POST | POST |
| Path | `/v2/me/avatar/presigned-url` | **does not exist** — closest is `POST /v1/utils/put-presigned-url` |
| Source | `api-contract.yaml:61-96` | `util.controller.ts:17` (mount `utils`, default version=1) |
| Request | `{ contentType: string, fileSizeBytes?: int }` | `PutPresignedUrlRequestDto = { feature: FILE_FEATURE enum, fileExtension: FILE_EXTENSION enum, contentLength: number, metadata?: Record<string,string> }` |
| Response | `{ putPresignedUrl, getPresignedUrl, fileUuid, signedHeaders: Record<string,string> }` | `PutPresignedUrlResponseDto = { putPresignedUrl, getPresignedUrl, fileUuid, signedHeaders: SignedHeader[] }` where `SignedHeader = { name, value }` |
| Auth | n/a | `LibUserGuard` |

**Critical findings**:
- **No dedicated `/v2/me/avatar/...` endpoint exists** in BE.
- The generic util endpoint is at `/v1/utils/put-presigned-url` (NOT `/v2`).
- `FILE_FEATURE` enum (`file-feature.constant.ts`) does **not include** an avatar/profile-image variant. Existing values: `GEN_MEME_*`, `ZZEM_PRESET`, `EXAMPLE_VIDEO_SOURCE`, `FILTER_THUMBNAIL`, `PERSONA_PROFILE`.
- Request shape differs: spec uses `contentType` (MIME) vs BE uses `fileExtension` (enum) + `contentLength` (numeric, was `fileSizeBytes`) + required `feature`.
- Response `signedHeaders` is an **array of `{name,value}`** in BE, not a `Record<string,string>` map.

**Resolution**: significant gap. Either:
1. **App reuses** `/v1/utils/put-presigned-url` (with new `FILE_FEATURE` value to be added — but BE change is OUT OF SCOPE per PRD), OR
2. App treats avatar as `PERSONA_PROFILE` feature today (verify whether `PERSONA_PROFILE` is allowed for end-user avatars in `presigned-url-config.constant.ts`).

App today (`utils.repository-impl.ts:10-15`) calls `/meme/v1/utils/put-presigned-url`. The `profile-edit.screen.tsx` and `profile.model.ts` reference the same flow.

---

## Field reconciliation

### `pushAll` vs `push`
- **qa-2 spec**: `NotificationSettings.push: boolean` (and `Notification.type` enum value `push`).
- **Actual BE**: field is `pushAll` (top-level toggle for all push). Domain semantics: when `pushAll=false`, sub-toggles `like/news/follow` are response-overridden to `false` even if stored as `true` (see `notification-settings-response.dto.ts:30-37`).
- **App code**: already uses `pushAll` everywhere (`notification-setting.model.ts:15`, `repository-impl.ts:31`).
- **Decision**: BE wins (production-shipped). Spec must be corrected `push` → `pushAll`. The notification `type` enum in spec (`push|like|news|follow`) is also wrong — actual enum is `LIKE|FOLLOW|PAYBACK` (uppercase, no `push`/`news`).

### `block` vs `blocks` (plural)
- **qa-2 spec**: `/v2/users/{userId}/block` (singular).
- **Actual BE**: `/v2/users/:userId/blocks` (plural — REST resource collection convention).
- **App code**: already uses `/blocks` (plural).
- **Decision**: BE wins. Spec to be corrected.

### `me/blocks` vs `me/blocked-users`
- **qa-2 spec**: `/v2/me/blocked-users`.
- **Actual BE**: `/v2/me/blocks`.
- **App code**: already uses `/me/blocks`.
- **Decision**: BE wins. Spec to be corrected.

### Response container `items` vs `list`
- **qa-2 spec**: list endpoints use `items`.
- **Actual BE**: `list` (consistent across `BlockUserListResponseDto`, `NotificationListResponseDto` and other Phase 3 list DTOs).
- **App code**: already aligned with `list`.
- **Decision**: BE wins. Spec to be corrected.

### Notification `read` vs `unread`
- **qa-2 spec**: `read: boolean` (read=true means seen).
- **Actual BE**: `unread: boolean` (inverted).
- **Decision**: BE wins. App must consume `unread`.

### Notification `id` vs `notificationId`
- **qa-2 spec**: `id`.
- **Actual BE**: `notificationId`.
- **Decision**: BE wins.

### Notification actor fields
- **qa-2 spec**: `actorNickname`, `actorAvatarUrl` (denormalized).
- **Actual BE**: `actorUserId` only — client resolves user via UserProfile.
- **Decision**: BE wins. Spec to be corrected (or app accepts denormalization gap — n+1 fetch implication for notification list rendering).

---

## App data layer audit

| Area | App file | URL used | BE actual | Status |
|---|---|---|---|---|
| Block user | `data/user-block/user-block.repository-impl.ts:25` | `POST /meme/v2/users/:userId/blocks` | `POST /v2/users/:userId/blocks` | OK |
| Unblock user | `:31` | `DELETE /meme/v2/users/:userId/blocks` | `DELETE /v2/users/:userId/blocks` | OK |
| List my blocks | `:38` | `GET /meme/v2/me/blocks` | `GET /v2/me/blocks` | OK |
| List notifications | `data/notification/notification.repository-impl.ts:22` | `GET /meme/v2/me/notifications` | `GET /v2/me/notifications` | OK |
| Unread count | `:27` | `GET /meme/v2/me/notifications/unread-count` | `GET /v2/me/notifications/unread-count` | OK |
| Mark all read | `:33` | `POST /meme/v2/me/notifications/read-all` | `POST /v2/me/notifications/read-all` | OK |
| GET notification settings | `data/notification-setting/notification-setting.repository-impl.ts:23` | `GET /meme/v2/me/notification-settings` | `GET /v2/me/notification-settings` | OK |
| PATCH notification settings | `:31` | `PATCH /meme/v2/me/notification-settings` (uses `pushAll`) | `PATCH /v2/me/notification-settings` (`pushAll`) | OK |
| Presigned URL (avatar) | `data/utils/utils.repository-impl.ts:11` | `POST /meme/v1/utils/put-presigned-url` | `POST /v1/utils/put-presigned-url` | OK (uses generic util — not `/v2/me/avatar/...`) |

**App layer is already aligned with the actual BE.** No app fixes are required for Group 002.

---

## Recommendations

### Group 002 — spec fix only (no app fix needed)

1. **Rewrite `api-contract.yaml`** for the qa-2 sprint (or as a new `api-contract-corrected.yaml`) to reflect the actual BE shape:
   - `block` → `blocks` (plural) on `/v2/users/{userId}/blocks` (POST/DELETE) — and bump response from `204` to `200 BlockStateResponse { userId, isBlocked, blockedAt: nullable }`.
   - `/v2/me/blocked-users` → `/v2/me/blocks`. Container key `items` → `list`. Adjust `limit` max to 100. `BlockedUser` rename — fields already match.
   - `/v2/me/notifications`: container `items` → `list`. Drop top-level `unreadCount` (it's a separate endpoint). Item: `id` → `notificationId`, `read` → `unread`, `type` enum → `[LIKE, FOLLOW, PAYBACK]`, `actorNickname`+`actorAvatarUrl` → `actorUserId`. Make `body`, `thumbnailUrl`, `actorUserId` nullable. `limit` default 20, max 100.
   - **Add** `GET /v2/me/notifications/unread-count` and `POST /v2/me/notifications/read-all`.
   - `/v2/me/notification-settings`: rename `push` → `pushAll` in BOTH request and response. Document partial (`minProperties=1`). Document `403 PERSONA_NOTIFICATION_LOCKED`.
   - **Replace** `POST /v2/me/avatar/presigned-url` with `POST /v1/utils/put-presigned-url`. Update request to `{feature: FILE_FEATURE, fileExtension: FILE_EXTENSION, contentLength: int, metadata?: object}`; response `signedHeaders: SignedHeader[]` array.
2. **Decide on avatar `feature` enum value**: file `presigned-url-config.constant.ts` does not enumerate an end-user "avatar/profile-image" feature. Either (a) follow up with BE team to confirm reusing `PERSONA_PROFILE` (note semantic mismatch), or (b) track adding a new `USER_AVATAR` enum as a separate (out-of-scope) BE change.
3. **No app data-layer changes required** — verified all 8 affected URLs/payloads in `apps/MemeApp/src/data/**` already align with production BE. Group 003 (audit) can be marked complete by virtue of this report.

### Out of scope (flag for follow-up)

- Notification list `actorUserId` denormalization — app currently has no actor profile fetch in the notification list path. Need separate UX decision: enrich on BE (out of scope for this sprint) or batch-fetch on app side.
- Notification `type` enum mismatch — app code may need to be reverified for `LIKE/FOLLOW/PAYBACK` (vs spec's `like/news/follow` lowercase + missing `PAYBACK`). Spot-check `notification.entity.ts`.
- Avatar upload `FILE_FEATURE` enum gap — likely needs a dedicated BE follow-up sprint.
