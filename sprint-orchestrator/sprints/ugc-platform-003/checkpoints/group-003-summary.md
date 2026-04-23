# Group 003 Summary: ugc-platform-003

**Date**: 2026-04-23
**Result**: PASS / ACCEPTED (Round 1 — first-try PASS)
**Fix loops**: 0

## Scope
- Tasks: be-004 (Notification entity + 3 listeners), be-005 (center endpoints), be-006 (push integration), be-007 (NotificationSetting 4-toggle + persona lock + shouldNotify helper)
- Endpoints: GET `/v2/me/notifications`, GET `/v2/me/notifications/unread-count`, POST `/v2/me/notifications/read-all`, GET/PATCH `/v2/me/notification-settings`

## Key Artifacts (Group 004 consumption)

| Artifact | Location | Group 004 consumption |
|----------|----------|----------------------|
| NotificationItem DTO | `application/notification/dto/notification-item.dto.ts` | app-006 list mapper |
| 3 endpoint paths | `api-contract.yaml#notifications` | app-006 useInfiniteQuery / useUnreadCount / useMarkAllRead |
| Push payload shape | `data.appLink` (NOT `deeplink`) + `data.type` + `data.notificationId` | app-008 push handler parse |
| Settings 4 fields | `pushAll / like / news / follow` | app-007 toggle screen |
| 403 PERSONA_NOTIFICATION_LOCKED | `me-notification-settings.controller PATCH` | app-007 error Toast |

## Implementation patterns for Group 004

- **data.appLink SSOT**: be-006 uses `KafkaProduceService.produceNotification` with `data.appLink` (matching existing meme-gen-complete). app-008 MUST read `data.appLink` (not `data.deeplink`).
- **Bucket YYYY-MM-DD**: PAYBACK batch uses `paybackBucket: YYYY-MM-DD KST`. FE doesn't surface this field (internal idempotency).
- **pushAll=false override at GET**: BE mapper forces sub-toggles to false when pushAll=false. FE trusts response value as-is — no client-side recomputation.

## Issues Found & Resolved

Critical 0, Major 0 — first Round PASS.

## Minor Deferred

1. **m1 — shouldPush inline vs shouldNotify helper**: be-006 `shouldPush` uses `readSetting` + inline 분기 대신 be-007 helper 위임. 동작 정합이나 settings gate 단일 SOT 미달. **KB 승격 후보** (integration-002 확장 — notification-domain 단일 gate). Group 004 app-007 에서도 동일 원칙 권장: 4 토글 mutation 은 단일 hook (`useUpdateNotificationSettings`) 으로 일원화, 4 토글 row 에서 각자 쿼리 클라이언트 호출 금지.
2. **m2 — Payback batch integration test**: @Cron + bucket idempotency unit 커버 but 실제 MongoDB transaction + race 는 infra 대기. ugc-platform-002 m1 (transaction rollback) 과 동류 — meme-api integration harness 에 위임.
3. **m3 — Notification.paybackBucket field optional**: 응답 DTO 에 미노출 (internal only). FE 는 `createdAt` 만 사용. 향후 admin/debug 엔드포인트에 노출 검토.

## Cross-group Integration Confirmations

- Group 001 `EVENT_TYPE.FOLLOW_CREATED` → be-004 FollowNotificationListener 이 consume. `event.shouldNotify=false` (persona target) → full skip (persist + dispatch 둘 다).
- Group 002 `BlockRelationPort` useExisting alias → be-004 LikeNotificationListener 가 주입받아 block-pair persist skip 수행 (AC 7.2 정신 확장).
- be-004 내부 `shouldNotify` 는 be-007 `NotificationSettingDomainService.shouldNotify` 로 위임 (persist gate, persona-only).
- be-006 `shouldPush` 는 인라인 settings 판정 (Minor m1).
- be-005 는 be-004 repository/domain 을 consume — interface 안정.
- be-006 temporary `Notification` placeholder 제거 완료 → `@persistence/notification/notification.repository::NotificationDomain` 직접 사용.
- Feed-app.spec.ts 업데이트: Phase 2 LikeDomainService + Group 002 ContentReportDomainService + UserBlockDomainService 의 12-dep constructor 반영.

## Lessons for Next Group (Group 004 — Notification App)

1. **data.appLink SSOT (not deeplink)**: app-008 push handler 는 `message.data.appLink` 필드로 deeplink 파싱. 기존 meme-gen-complete 와 동일 infra. 기존 handler 에 신규 type (LIKE/FOLLOW/PAYBACK) 분기 확장만 수행 — 필드 name 변경 금지.
2. **pushAll override at mapper level**: app-007 는 BE GET 응답 그대로 렌더 — 클라이언트에서 `pushAll=false → 하위 false 강제` 로직 추가 금지 (BE 가 이미 강제). Zod 필수 4 boolean 필드.
3. **Settings mutation 단일 hook** (Minor m1 확장): app-007 의 4 토글 각 onPress → 동일 `useUpdateNotificationSettings` hook 호출. 개별 hook 생성 금지 (dead hook 경계 + settings gate 단일 SOT).
4. **PushPermissionBanner FCM check**: `@react-native-firebase/messaging::messaging().hasPermission()` 반환 `AuthorizationStatus` 확인. app-006 에서 screen mount 시 + focus 시 재확인.
5. **Red dot logic**: bell tap → `markAllRead.mutate()` + invalidate `['notifications-unread-count']`. Optimistic 0 가능 (이미 구현에 담긴 패턴).
6. **Category dot color**: Phase 3 프로토타입 확정치 (임시 LIKE=primary-pink, FOLLOW=primary-blue, PAYBACK=primary-yellow). app-006 구현 시 design-tokens/semantic color 재확인.
7. **NotificationItem parse skip**: BE 가 이미 skip-on-missing-required 수행 (be-005). FE 는 Zod schema required 필드 강제 — 수신된 list 에 대해서는 모든 필드 존재 전제 가능. 단, network layer 오류 대응을 위해 Zod catch 여전히 필수.

## Files Changed

### backend (sprint/ugc-platform-003)
- `persistence/notification/` (schema + TTL index + partial unique paybackBucket + repository)
- `persistence/notification-setting/` (schema 4 fields 추가 + base-repository getOrCreateWithDefaults + updateByUserId + mapper 4 fields)
- `domain/notification/` (domain service + module + types + push port + persisted event + spec)
- `domain/notification-setting/` (interface 확장 + domain service shouldNotify + module imports UserProfileDomainModule)
- `application/notification/` (app service + 3 listeners + payback scheduler + push service + DTOs + listener specs)
- `application/notification-setting/` (app service readV2 + updateV2 + 2 DTOs + spec)
- `controller/notification/` (controller + module + spec)
- `controller/notification-setting/me-notification-settings.controller.ts` + module update
- `common/constant/notification.constant.ts` (NEW — enum + 3 builders + TTL)
- `common/constant/event-constant.ts` (+ LIKE_CREATED, NOTIFICATION_PERSISTED)
- `common/constant/index.ts` (re-export)
- `controller/controller.module.ts` (register)
- `domain/like/like-domain.service.ts` + `like-created.event.ts` (emit LIKE_CREATED)
- `application/feed/unit-test/feed-app.service.spec.ts` (12-dep constructor reconciliation)
- E2E spec: `test/me-notification-settings.e2e-spec.ts`

## Pressure Reset
Group 003 PASS → Group 004 pressure = 🟢 Normal.
