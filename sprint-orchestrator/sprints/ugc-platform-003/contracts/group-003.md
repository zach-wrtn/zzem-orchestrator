# Sprint Contract: Group 003 — Notification Backend (DRAFT — pending Group 001 PASS)

> Sprint Lead 선행 초안. be-004 의 LIKE/FOLLOW listener 가 Group 001/Phase 2 event emit 을 전제.

## Scope

- **Sprint**: ugc-platform-003
- **Tasks**:
  - `be-004`: Notification entity + 3 listener (LIKE/FOLLOW/PAYBACK batch) + persist + dispatch trigger
  - `be-005`: Notification center endpoints (list / unread-count / read-all)
  - `be-006`: Push integration (new-noti + UserDevice.fcmToken, shouldPush gate)
  - `be-007`: NotificationSetting 확장 (4 토글 + persona lock) + shouldNotify helper
- **API Endpoints**:
  - GET `/v2/me/notifications`, `/v2/me/notifications/unread-count`
  - POST `/v2/me/notifications/read-all`
  - GET / PATCH `/v2/me/notification-settings`

## Cross-group Integration

- **Group 001 종속**: be-004 LikeNotificationListener 는 Phase 2 `EVENT_TYPE.LIKE_CREATED` event 를 consume. FollowNotificationListener 는 Group 001 be-001 의 `EVENT_TYPE.FOLLOW_CREATED` + shouldNotify=false payload 를 consume.
- **Phase 2 종속**: PaybackBatchSchedulerService 는 CreditHistory transactionType=PAYBACK row 를 daily bucket 합산 (Phase 2 be-003).

## Done Criteria

### be-004 (Backend — Notification entity + listeners)

- [ ] Notification mongoose schema: `{ownerUserId, type (enum LIKE|FOLLOW|PAYBACK), title, body (nullable), actorUserId (nullable), refId (nullable — LIKE=contentId), deeplink, thumbnailUrl (nullable), unread (default true), createdAt}`. TTL index on createdAt `expireAfterSeconds=2592000` (30일). Indexes: `{ownerUserId, createdAt, _id}`, `{ownerUserId, unread}`.
- [ ] LikeNotificationListener `@OnEvent(EVENT_TYPE.LIKE_CREATED)`: owner=content.userId 매핑. Self-like skip. Owner persona skip. Owner settings.like OR pushAll=false → DB persist 는 유지 but push skip (settings gate at push layer, not persist).
  - **정책 (Contract 에서 확정)**: settings 는 push 에만 적용. DB persist 는 항상 수행 (페르소나 는 persist 도 skip).
- [ ] FollowNotificationListener `@OnEvent(EVENT_TYPE.FOLLOW_CREATED)`: event.shouldNotify=false → skip entirely (persist + push 둘 다).
- [ ] PaybackBatchSchedulerService `@Cron("0 10 * * *", {timeZone: "Asia/Seoul"})`: 전일 (KST 00:00 ~ 23:59:59.999) CreditHistory transactionType=PAYBACK 을 owner 별 합산. 각 owner 에 Notification 1건. Persona owner skip. 크레딧 페이백 토글 없음 (AC 5.5 항상 ON).
- [ ] Idempotency: (ownerUserId, bucket=YYYY-MM-DD, type=PAYBACK) 조합 unique. 재실행 시 기존 row 있으면 skip.
- [ ] Deeplink 생성 규칙:
  - LIKE: `zzem://contents/{contentId}`
  - FOLLOW: `zzem://profile/{actorUserId}`
  - PAYBACK: `zzem://credit-history`
- [ ] Notification persist 직후 `pushNotificationService.dispatch(notification)` 호출 (be-006 의 service — 주입). try/catch 로 push 실패가 listener 트랜잭션 rollback 유발 금지.
- [ ] Nx unit + integration test: self-like skip, persona skip, settings gate (push only), batch idempotent.

### be-005 (Backend — Notification center endpoints)

- [ ] GET /v2/me/notifications: cursor `{createdAt, _id}` DESC, `_id: $lte` (KB correctness-004). Limit 1-100 default 20. 30일 초과 레코드 응답 제외 (TTL + read-path filter 병행).
- [ ] GET /v2/me/notifications/unread-count: countDocuments `{ownerUserId, unread:true, createdAt >= now-30d}`.
- [ ] POST /v2/me/notifications/read-all: updateMany `{ownerUserId, unread:true}` → `{unread:false}`. Idempotent. 응답 `{updatedCount}`.
- [ ] NotificationMapper: 필수 필드 (notificationId, type, title, unread, deeplink, createdAt) parse 실패 시 item skip (log). `?? "" / ?? false / ?? 0` 금지.
- [ ] Cross-owner 보안: 다른 유저의 Notification 접근 불가 — guard + where clause.

### be-006 (Backend — Push integration)

- [ ] `PushNotificationService.dispatch(notification)` 생성.
- [ ] `shouldPush(ownerId, type)` helper — 단일 정의:
  - Persona → false
  - settings.pushAll=false → false
  - LIKE → settings.like=false → false
  - FOLLOW → settings.follow=false → false
  - PAYBACK → 토글 없음 (persona 체크 외 항상 true)
- [ ] UserDevice 전체 fcmToken + pushEnabled=true device iterate → NotiService.sendPush.
- [ ] fcm token invalid 응답 시 UserDevice 소프트 무효화 (기존 delete path 재사용).
- [ ] Retry 없음 (new-noti 책임).
- [ ] try/catch — send 실패가 listener transaction rollback 유발 금지.

### be-007 (Backend — NotificationSetting extension)

- [ ] Schema 에 `pushAll`, `like`, `news`, `follow` (4 boolean) 추가. 기존 필드 불변.
- [ ] Default 정책:
  - 일반 유저: 4 필드 true.
  - 페르소나: 4 필드 false (init 시점).
- [ ] Write-through lazy default: GET 호출 시 document 없으면 `findOneAndUpdate({userId}, {$setOnInsert: defaults}, {upsert:true, new:true})`. Mapper fallback 금지.
- [ ] PATCH /v2/me/notification-settings: partial update. 페르소나 → 403 `PERSONA_NOTIFICATION_LOCKED`. minProperties=1.
- [ ] GET 응답 매핑: pushAll=false → like/news/follow 강제 false 반환 (저장값은 유지).
- [ ] `shouldNotify(ownerId, type)` helper — be-004 listener 가 호출 (persona + settings 판정).
- [ ] Nx integration test: default creation, persona lock, pushAll=false 응답 강제, write-through 동작.

## Verification Method

| Criterion | 검증 방법 |
|-----------|----------|
| 3 listener 각 emit event → Notification persist | EventEmitter2 mock으로 emit → repository count 증가 확인 |
| Persona skip | Seed persona owner → emit → Notification 없음 |
| Settings gate (push only, persist 유지) | settings.like=false + emit → Notification persist ✓, push skip ✓ |
| Payback batch idempotent | @Cron mock 으로 2회 실행 → 동일 bucket 에 단일 row |
| Cursor paging $lte | Integration: seed 3 → limit=2 → page 2 length=1 |
| read-all idempotent | 2회 호출 → updatedCount=0 on second |
| shouldNotify / shouldPush 일원화 | grep 결과 정의 1개 + ≥ 2 callsite 각 |
| PATCH persona lock | Integration: persona user → PATCH → 403 |
| GET pushAll=false 강제 false | Integration: pushAll=false 저장 + like=true 저장 → GET 응답 like=false |

### Default Verification Gates

- [ ] **Mapper fallback 금지** (KB: completeness-008):
  - `rg '\?\?\s*false|\?\?\s*""|\?\?\s*0|\?\?\s*true' backend/apps/meme-api/src/{domain,persistence,common/dto,application}/notification backend/apps/meme-api/src/{domain,persistence,common/dto}/notification-setting → 0 hit`.
  - Zod schema 필수 필드 강제: NotificationItem 의 notificationId, type, title, unread, deeplink, createdAt required.
- [ ] **Dead hook/method 금지** (KB: completeness-009):
  - `rg 'shouldNotify\(|shouldPush\(' backend/apps/meme-api/src` → 각 1 정의 + ≥ 2 callsite (be-004 listener 3개 → shouldNotify 3 callsite, be-006 → shouldPush 1 callsite from dispatch + caller 1).
  - `rg 'pushNotificationService\.dispatch\(' backend/apps/meme-api/src` → ≥ 3 hit (Like/Follow/Payback listener 각 1).
  - `rg 'EVENT_TYPE\.FOLLOW_CREATED' backend/apps/meme-api/src` → ≥ 2 hit (emit + listener).
- [ ] **Cross-component 전수** (KB: completeness-010):
  - settings read consumer 전수: be-004 LikeNotificationListener, be-004 FollowNotificationListener, be-006 PushNotificationService, be-007 GET controller, be-007 PATCH controller.
  - NotificationSetting 의 기존 memeNotification 등 필드 호출자 전수 — grep `notificationSettingDomainService` callsite 나열 → 각각 신규 필드에 영향 없음 검증.
- [ ] **BE cursor 규약**: `rg '_id:\s*\{\s*\$lt\s*:' backend/apps/meme-api/src/persistence/notification → 0 hit`.
- [ ] **Cross-path cleanup** (KB: integration-002): shouldNotify helper 단일 정의 (be-007). listener 3개가 직접 persona/settings 로직 복제 금지 — helper 만 호출.
- [ ] **Nx test 검증**: `nx test meme-api --listTests | grep -i notification` → 신규 spec 포함.

## Edge Cases to Test

- Self-like → Notification persist 없음.
- Persona owner + like event → persist 없음 + push 없음.
- 일반 owner + settings.pushAll=false → persist ✓, push 없음.
- 일반 owner + settings.like=false + settings.pushAll=true → persist ✓, push 없음 (like 토글 false).
- Payback batch 동일 날짜 재실행 → 중복 row 없음.
- Payback batch persona owner → 해당 owner 의 Notification 없음.
- Notification 31일 경과 → unread-count / list 응답에서 제외 (TTL 지연 safe).
- read-all 2회 호출 → 2번째 updatedCount=0.
- PATCH persona → 403.
- PATCH partial body (only `pushAll: false`) → 다른 3 필드 저장값 유지, 응답은 강제 false.

## Business Rules to Validate

- AC 5.1: 4 카테고리 (좋아요/크레딧/소식/팔로우) 토글 + 페르소나 제외 + 좋아요 빈도 제한 없음 + 팔로우 건별 발송 + 페이백 매일 10시 KST 배치.
- AC 5.2: 팔로우 알림 즉시 + "활동 알림" 카테고리.
- AC 5.3: 알림센터 진입 시 일괄 읽음 (read-all).
- AC 5.4: 3 타입 push 템플릿 + fallback deeplink (홈).
- AC 5.5: 4 토글 + 페이백 토글 없음 + pushAll OFF 시 하위 비활성화.

## Regression Guard

- [ ] 기존 NotificationSetting `memeNotification / memeGenCompletePush` 호출자 회귀 없음 — grep 으로 전수 확인.
- [ ] Phase 2 meme-gen-complete push flow 회귀 없음 (별도 send 경로 분리).
- [ ] Phase 2 PaybackEventListener 크레딧 적립 동작 회귀 없음 — 본 그룹은 batch reporter 만 추가.
- [ ] Phase 2 Like 엔드포인트 성능 회귀 없음 (listener emit 만 추가, sync 로직 미변경).

## Group 002 Lessons Applied (선제 반영)

1. **Event emit-only on new creation** (Group 002 be-003 패턴): be-004 PaybackBatchScheduler 의 `(ownerUserId, bucket=YYYY-MM-DD)` unique 제약 위반 시 emit + persist 둘 다 skip (기존 row 있으면 early return). 11000 race case 도 동일.
2. **Set union hidden-users 확장**: be-004 listener persist 직전 `UserBlockDomainService.getBlockedPairs(ownerId)` 체크 — actor 가 owner 를 block (또는 owner 가 actor 를 block) 한 경우 Notification persist skip. 이는 AC 7.2 "차단 시 알림 미통지" 정신을 Notification 레이어까지 확장. BlockRelationPort dual-provider caveat 인지 — `BLOCK_RELATION_PORT` 주입 시 UserBlockDomainModule exports 경유 권장 (단일 SOT).
3. **Mapper fallback 의도 분류 주석화**: settings 값 fallback 시 `// Why: persona default OFF` 또는 `// Why: write-through lazy default` 주석 의무. `?? false / ?? true` 패턴 사용 시 반드시 주석.
4. **Contract field-level 파일 경로 명시**: NotificationItem 응답 DTO 경로 확정 — `backend/apps/meme-api/src/application/notification/dto/notification-item.dto.ts` (또는 실제 경로 grep 확인). 필드 name list: `notificationId, type, title, body, unread, deeplink, thumbnailUrl, actorUserId, createdAt`.
5. **BlockRelationPort dual-provider caveat**: be-004 listener 가 BlockRelationPort 를 주입받을 때, UserBlockDomainModule 의 `useExisting` alias 를 통해 접근 (UserFollowDomainModule inline factory 는 고립 사용). 신규 import source `@domain/user-block/user-block-domain.module`.
6. **Cursor extra-item pattern** 재확인: be-005 `/v2/me/notifications` list 도 `page[limit]` 인코딩 (reference: `user-follow-app.service.buildListResponse`, `user-block-app.service.buildListResponse`).

## Sign-off

- Sprint Lead draft: 2026-04-23
- Group 002 ACCEPTED (Round 1 first-try PASS) — Group 002 Lessons 반영
- Group 001 `EVENT_TYPE.FOLLOW_CREATED` payload 확정 (shouldNotify=false for persona target)
- Phase 2 `EVENT_TYPE.LIKE_CREATED` + `EVENT_TYPE.CONTENT_GENERATION_COMPLETED` (payback batch source) 확인됨
- Sprint Lead sign-off: 2026-04-23 (self-reviewed with Group 001 + Group 002 Lessons 선제 반영)
- Evaluator review: R1 in §4.4 (후행)
