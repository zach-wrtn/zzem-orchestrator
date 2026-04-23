# Evaluation: group-003 — Notification Backend

- Round: 1
- Verdict: PASS
- Date: 2026-04-23

## Summary

be-004 / be-005 / be-006 / be-007 모두 Contract Done Criteria 충족. 3 listener (Like/Follow/PaybackBatch) 의 persona gate + block-pair skip + settings-aware push gate 가 일원화된 helper 경유로 수렴하고, Notification entity / cursor paging / shouldNotify/shouldPush 역할 분리 / persona lock / 레거시 mapper 회귀 없음 전수 확인. PAYBACK idempotency (`partialFilterExpression: { type: PAYBACK }` unique + existsPaybackBucket precheck + 11000 race absorb) 도 KB integration-002 패턴 그대로. Cross-group wiring (LIKE_CREATED emit 사이트, FOLLOW_CREATED payload compat, BlockRelationPort useExisting alias) 도 정합. Critical / Major 0. Minor 3건 기록.

## Critical

(none)

## Major

(none)

## Minor (deferred)

| # | Task | Issue | File:Line | Recommendation |
|---|------|-------|-----------|----------------|
| m1 | be-006 | `push-notification.service.ts::shouldPush` 가 `notificationSettingDomainService.readSetting` 의 응답을 `as unknown as { pushAll?: boolean; ... }` 로 optional-typed cast 하여 inline 분기. be-007 이 실제 landing 하여 `NotificationSetting` interface 의 4 필드가 non-optional 이 된 현재, TODO 주석(line 103-108)은 유효하지 않고 helper 위임(`notificationSettingDomainService.shouldNotify`)이 아니라 직접 field read. 동작은 정합 (pushAll=false 분기 + type-specific toggle 모두 커버) 이나 단일 SOT 원칙에 더 맞게 be-007 helper 확장 후 위임으로 리팩터 권장. | `application/notification/push-notification.service.ts:103-135` | 후속: `NotificationSettingDomainService.shouldPush(ownerId, type)` helper 신설 → be-006 dispatch 에서 단일 호출. persona + settings 판정 SOT 를 domain layer 로 일원화. |
| m2 | be-004 | `LikeNotificationListener` 가 `BLOCK_RELATION_PORT` 를 `@domain/user-follow/block-relation.port` 경로로 import (Group 002 lesson: `@domain/user-block/user-block-domain.module` 의 useExisting alias 활용). 현재 구조상 token identity 는 동일 (Symbol) + `UserBlockDomainModule` 이 `useExisting: UserBlockDomainService` 를 export 하므로 listener module 이 `UserBlockDomainModule` 을 import 하면 alias 를 그대로 주입받음. 즉 결과 동치. 다만 Group 002 lesson #5 의 "UserFollowDomainModule inline factory 는 고립 사용" 문구와 entry 경로가 반대 — 향후 token 이전 시 양쪽 모듈 재검토 필요. | `application/notification/like-notification.listener.ts:14-16` + `application/notification/notification-app.module.ts:47` | 후속: token 정의 파일을 `@domain/user-block/block-relation.port` 로 이관 (user-follow 의존 끊기). |
| m3 | be-005 | `notification.repository.ts::findListWithCursor` compound cursor 가 outer `$lt` (createdAt) + inner `$lte` (tie-break _id) — 이는 canonical form (Group 001/002 동일). 다만 정책 문서상 "`$lte` on compound cursor" 표현과 grep 게이트 `_id: $lt` 를 혼동할 여지. 현 구현은 `_id: $lt` 0 hit 로 gate 통과. | `persistence/notification/notification.repository.ts:108-111` | 후속: Contract 표현을 "compound cursor: outer `$lt` on sort key + inner `$lte` on tie-break" 로 명문화. |

## Regression Check

| Target | Result | Notes |
|--------|--------|-------|
| Phase 2 LikeDomainService 동작 | PASS | `like/like-domain.service.ts:56-92` — existing toggle 로직 불변. 신규 LIKE_CREATED event emit 만 추가 (ownerUserId 미해결 경로는 legacy `like.created` raw emit 로 fallback → 추천 subscriber 회귀 없음). |
| Phase 2 PaybackEventListener | PASS | 본 그룹은 별도 `@Cron` batch 추가. CreditHistory PAYBACK 행 생성 경로 미수정 (aggregate read-only). |
| 기존 NotificationSetting 레거시 consumers | PASS | `memeNotification / memeGenCompletePush` 필드 schema/domain interface 유지. `updateSetting(v1)` 경로 + `NotificationSettingAppController` (v1 `/notification-setting`) 미변경. v2 `/v2/me/notification-settings` 컨트롤러 추가만. |
| Group 001 FollowCreatedEvent consumer | PASS | FollowNotificationListener 가 `shouldNotify === false` → early skip. payload shape (`actorUserId, targetUserId, followId, shouldNotify, createdAt`) 일치. |
| Group 002 BlockRelationPort useExisting alias | PASS | `UserBlockDomainModule.providers: [{ provide: BLOCK_RELATION_PORT, useExisting: UserBlockDomainService }]` — NotificationAppModule 이 이 모듈을 import 함으로써 LikeNotificationListener 가 실제 UserBlockDomainService 구현체 주입. |
| 기존 `gen-meme.service.ts` push flow | PASS | `KafkaProduceService.produceNotification` 동일 infra 재사용. 신규 requestType 3종 (`zzem \| notification \| {like,follow,payback}`) 추가만. body null 처리는 "" 로 contract 준수 (Why 주석 명시). |

## KB Pattern Gates

| Pattern | Result | Notes |
|---------|--------|-------|
| completeness-008 (mapper fallback 금지) | PASS | BE notification 디렉토리 `?? 0 / ?? false / ?? ""` 0 hit. `modifiedCount ?? 0` (Group 001 precedent, driver typing 보호 주석) 과 mapper `memeGenCompletePush ?? null` (레거시 도메인 null 승격) 2건은 mapper fallback 이 아닌 typed coalesce — 의도 주석 명시. NotificationSetting 4 신규 필드 mapper 는 write-through default 로 fallback 불필요 (주석 명시). NotificationItem mapper 는 skip-on-missing 전략 (6 required field 전수 검증). |
| completeness-009 (dead hook/method) | PASS | `shouldNotify(` 정의 2 (notification-domain.service + notification-setting-domain.service) + callsite ≥ 3 (LikeListener / FollowListener / PaybackBatchScheduler). `shouldPush(` 정의 1 (PushNotificationService) + callsite 1 (dispatch 내부) — Contract 해석상 3 listener 는 dispatch 경유만 호출 (listener 가 shouldPush 직접 호출 금지 주석 포함) ≥ 최소 1 callsite + unit test 참조. `pushNotificationService.dispatch(` ≥ 3 hit (Like/Follow/Payback listener 각 1). `EVENT_TYPE.FOLLOW_CREATED` 2 hit (emit in user-follow-domain + consume in follow-listener). |
| completeness-010 (cross-component 전수) | PASS | settings read consumer 전수 — LikeListener (persist), FollowListener (persist), PushNotificationService (push), GET/PATCH controller (be-007). 기존 `notificationSettingDomainService.*` 콜러 (gen-meme.service / user-device 등) 는 v1 필드 사용 — 신규 4 필드 영향 없음 (schema backward-compat). |
| correctness-004 (cursor $lte) | PASS | `_id: { $lt:` 0 hit in `persistence/notification/`. `findListWithCursor` 는 outer `$lt` (createdAt, strict less) + inner `$lte` (_id tie-break) canonical form. |
| integration-002 (cross-path cleanup 단일 helper) | PASS | `shouldNotify` 단일 정의 (be-007 domain service) + be-004 persist gate helper (`NotificationDomainService.shouldNotify`) 가 be-007 helper 를 위임 호출. listener 3 개가 persona/settings 로직 복제 없음 (gate 1회 호출). |
| e2e / BE cursor 규약 | PASS | `rg '_id:\s*\{\s*\$lt\s*:' apps/meme-api/src/persistence/notification` 0 hit. |
| Nx test 등록 | PASS | `domain/notification/unit-test/notification-domain.service.spec.ts`, `application/notification/unit-test/*.spec.ts` (4개 spec: like/follow/payback-batch/push), `controller/notification/notification.controller.spec.ts`, `domain/notification-setting/unit-test/*.spec.ts`, `application/notification-setting/unit-test/*.spec.ts` 신규 등록. |

## Cross-group Integration

- **LIKE_CREATED emit & consume**: `domain/like/like-domain.service.ts:56-92` — 신규 Like 생성 성공 시 (existing=false) `ownerUserId` resolve 경로에서만 enriched `LikeCreatedEvent` emit. custom-prompt 경로 (ownerUserId 없음) 는 legacy raw string 만 emit → listener 자동 skip. `handleLikeCreated` 가 `ownerUserId` 누락을 가정하지 않는 (event.ownerUserId required) typed payload. unique race 11000 absorb 시 emit 없음 — idempotent.
- **FOLLOW_CREATED consume (Group 001 → Group 003)**: FollowNotificationListener 가 `@OnEvent(EVENT_TYPE.FOLLOW_CREATED)` + `event.shouldNotify === false` early return. payload contract compat 확인 (`actorUserId, targetUserId, followId, shouldNotify, createdAt`).
- **BlockRelationPort useExisting alias**: NotificationAppModule → UserBlockDomainModule import → `{ provide: BLOCK_RELATION_PORT, useExisting: UserBlockDomainService }`. LikeNotificationListener 가 실제 UserBlockDomainService 구현체 (양방향 `isBlockedEither`) 주입받음. FollowListener 는 Group 001 시점에서 이미 block 차단된 follow 는 403 이므로 block-pair 체크 불필요 — 주석 명시.
- **shouldNotify vs shouldPush 역할 분리**: (1) `NotificationSettingDomainService.shouldNotify(ownerId, _type)` — persona only gate, persist layer. be-004 listener 3 개가 `NotificationDomainService.shouldNotify` (persona 위임) 경유 호출. (2) `PushNotificationService.shouldPush(ownerId, type)` — persona + pushAll + type-toggle gate, push layer. dispatch 내부 1회 호출. Role separation 주석 명시 + TypeScript 로 구분.
- **Notification placeholder removal (be-006)**: `push-notification.service.ts:11` — `NotificationDomain as Notification` alias 를 `@persistence/notification/notification.repository` 에서 직접 import (Sprint Lead reconciliation 반영). 임시 local interface 제거 확인. `NOTIFICATION_TYPE` 도 `@common/constant/notification.constant` SOT.

## Lessons for Next Group (Group 004 — Notification App)

1. **shouldPush helper 단일 위임 패턴 정착 필요**: 현재 be-006 이 `notificationSettingDomainService.readSetting` + inline pushAll/type 분기로 구성. 차기 리팩터 시 `NotificationSettingDomainService.shouldPush(ownerId, type)` 로 일원화 → Group 004 app-008 (push handler) 가 서버 응답만 신뢰하는 패턴이 "BE 단일 gate 정의" 로 대칭 강화됨. Contract 레벨에서 "settings gate 단일 helper 위임" 을 permanent KB 승격 후보.
2. **NotificationItem 응답 DTO 6 required 필드 contract**: `notificationId / type / title / unread / deeplink / createdAt` required. app-006/007 Zod schema 가 동일 6 필드 required + body/actorUserId/thumbnailUrl nullable 로 1:1 매칭. app-006 useNotifications hook 에서 fallback 금지 (BE 가 skip-on-missing 으로 malformed item 송출 차단 — FE 는 수신 item 신뢰).
3. **deeplink 3 패턴 + FE fallback**: `zzem://contents/{id}`, `zzem://profile/{id}`, `zzem://credit-history`. app-008 fallback-to-home 은 parse 실패 경로만. BE 는 builder 에서 throw (조용한 잘못된 URL 생성 방지).
4. **pushAll=false 응답 override 로직**: GET 응답 시 like/news/follow 강제 false (저장값 유지). app-007 Switch value 는 BE 응답만 신뢰 (FE 로컬 재계산 금지). PATCH 는 partial update 저장값 기준.
5. **PAYBACK 토글 미노출**: app-007 Settings 화면 에 credit payback 토글 렌더 금지 (AC 5.5). BE 는 schema/DTO 에서 아예 필드 없음 — FE 는 3 토글 + pushAll 렌더.
6. **PushPermissionBanner 조건부 (app-006)**: OS 권한 denied + pushAll=false 조합은 banner 노출. BE shouldPush 는 설정 false 시 skip — FE 배너 prompt 로 복구 유도. BE 는 persist 항상 수행 (AC 5.5 내역만 유지) — FE 배너 없을 때도 알림 list 는 렌더.
