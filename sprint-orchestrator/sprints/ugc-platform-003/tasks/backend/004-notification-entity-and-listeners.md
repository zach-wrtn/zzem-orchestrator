# be-004 · Notification 엔티티 + LIKE/FOLLOW/PAYBACK 리스너 (persistence-only)

- **Group**: 003
- **Owner**: be-engineer
- **Depends on**: be-001 (FollowCreatedEvent), Phase 2 like-created + payback 이벤트 파이프라인
- **Task ID**: be-004

## Target

`backend/apps/meme-api/src/` 내 신규 생성:
- `persistence/notification/` — `notification.schema.ts`, `notification.repository.ts`
- `domain/notification/` — `notification-domain.service.ts`, `notification.module.ts`
- `application/notification/` — `like-notification.listener.ts`, `follow-notification.listener.ts`, `payback-batch-scheduler.service.ts`, `notification-persisted.event.ts` (payload DTO)
- `common/constant/event-constant.ts` — `EVENT_TYPE.NOTIFICATION_PERSISTED` 추가
- `common/constant/notification.constant.ts` — `NOTIFICATION_TYPE` enum (`LIKE`, `FOLLOW`, `PAYBACK`), deeplink 생성 헬퍼
- 관련 e2e / unit spec

**변경 대상 (emit site 확인용)**:
- `domain/like/like-domain.service.ts` / `controller/like/like.controller.ts` — `EVENT_TYPE.LIKE_CREATED` emit 여부 선점검. 미존재 시 성공적 `POST /v2/me/contents/:contentId/likes` 경로에 emit 추가 (payload: `actorUserId`, `ownerUserId`, `contentId`, `likeId`, `createdAt`). 이미 emit 중이면 건드리지 않음.
- `application/payback/payback-event.listener.ts` / `CreditHistory` write path — PAYBACK 배치 입력 소스로 사용 (읽기 전용, 변경 없음).

## Context

PRD US5 (AC 5.1, 5.2, 5.4, 5.5) — 좋아요/팔로우 실시간 알림 + 크레딧 페이백 매일 10시 KST 배치 알림. 페르소나 계정 전체 제외. 1개월 보관.

본 태스크는 **persistence + scheduling** 만 담당한다. Push 발송은 be-006 의 `PushNotificationService` 가 `NotificationPersistedEvent` 를 consume 하여 수행한다 (persist ↔ push 이원 분리).

**API Contract SSOT**: `sprint-orchestrator/sprints/ugc-platform-003/contracts/api-contract.yaml` — `NotificationItem`, `NotificationType`, `NotificationListResponse`.

**Backend reference**:
- `apps/meme-api/src/application/payback/payback-event.listener.ts` — listener 패턴 원본.
- `apps/meme-api/src/common/constant/event-constant.ts` — EVENT_TYPE 상수.
- `apps/meme-api/src/domain/user-profile/user-profile-domain.service.ts` — `USER_PROFILE_TYPE.INTERNAL` 페르소나 판정.
- `apps/meme-api/src/persistence/like/like.repository.ts` — cursor pattern (be-005 가 재사용).

## Objective

`Notification` 컬렉션을 생성하고 3종 이벤트 소스에서 알림 레코드를 persist 한다. Persona + notificationSettings 체크를 **일원화된 `shouldNotify(ownerId, type)` helper** 로 처리한다. Push 발송은 be-006 으로 위임.

## Specification

### 스키마 — `Notification`

- `ownerUserId: string` (수신자, indexed).
- `type: NOTIFICATION_TYPE` (enum `LIKE` | `FOLLOW` | `PAYBACK`, indexed).
- `title: string` (AC 5.4 템플릿 렌더 결과 저장).
- `body: string | null` (PAYBACK 만 사용).
- `actorUserId: string | null` (LIKE/FOLLOW 만. PAYBACK 은 null).
- `refId: string | null` (LIKE → contentId, FOLLOW → null (actorUserId 로 충분), PAYBACK → null).
- `deeplink: string` (PRD AC 5.3 탭 동작. 아래 규칙).
- `thumbnailUrl: string | null` (LIKE → Content.thumbnailUrl, FOLLOW → actor UserProfile.profileImageUrl, PAYBACK → null).
- `unread: boolean` (default true).
- `BaseSchema` (`createdAt`, `updatedAt`, `deletedAt`) 상속.

**인덱스**:
- `{ ownerUserId: 1, createdAt: -1, _id: -1 }` — 알림센터 리스트 조회 (be-005).
- `{ ownerUserId: 1, unread: 1 }` — unread count (be-005).
- `{ createdAt: 1 }` **TTL 인덱스** `expireAfterSeconds: 2592000` (30일) — PRD 규칙 "알림센터 보관: 1개월".
- (idempotency) PAYBACK: `{ ownerUserId: 1, type: 1, paybackBucket: 1 }` unique partial — PAYBACK 레코드에 한해 `paybackBucket: string` (YYYY-MM-DD KST) 필드 추가 필수. LIKE/FOLLOW 에는 `paybackBucket` 누락 허용 (partialFilterExpression: `{ type: 'PAYBACK' }`).

### Deeplink 생성 규칙 (be-006 와 공유 — `common/constant/notification.constant.ts::buildDeeplink(type, params)`)

- `LIKE` → `zzem://contents/{contentId}`
- `FOLLOW` → `zzem://profile/{actorUserId}`
- `PAYBACK` → `zzem://credit-history`
- Fallback: FE 가 parse 실패 시 `zzem://home` (app-008). BE 는 위 3종만 생성.

### 이벤트 리스너

#### 1. `LikeNotificationListener` `@OnEvent(EVENT_TYPE.LIKE_CREATED)`

Payload 에서 `actorUserId`, `ownerUserId` (content.userId), `contentId`, `likeId` 수신.

Flow:
1. **Self-like skip** — `actorUserId === ownerUserId` → return.
2. **Persona skip** — `ownerUserId` 의 UserProfile.type === INTERNAL → return (AC 5.1 "페르소나 계정은 푸시/알림센터 발송 대상에서 제외").
3. **Notification persist** — `shouldPersist` 는 항상 true (persona 아니면). 즉 notificationSettings.like=false 여도 **persist 는 수행** (알림센터 이력은 남김). Push 전송 여부만 settings 에 영향. AC 5.5 설계 합의.
4. **Content lookup** — thumbnailUrl, actor nickname resolve.
5. **Notification 레코드 생성**:
   - `title = "{actor.nickname}님이 회원님의 콘텐츠를 좋아합니다"`
   - `body = null`, `refId = contentId`, `thumbnailUrl = content.thumbnailUrl`, `actorUserId`, `deeplink = buildDeeplink('LIKE', { contentId })`, `unread = true`.
6. **Emit `NotificationPersistedEvent`** — payload `{ notificationId, ownerUserId, type: 'LIKE', actorUserId, refId: contentId }`.

#### 2. `FollowNotificationListener` `@OnEvent(EVENT_TYPE.FOLLOW_CREATED)`

Payload 에서 `actorUserId`, `targetUserId` (owner), `followId`, `shouldNotify` 수신.

Flow:
1. **`shouldNotify === false` skip** — be-001 이 target persona 일 때 false 로 세팅. 바로 return.
2. **Self-follow skip** — be-001 이 이미 차단하지만 double-check (`actorUserId === targetUserId` → return).
3. **(Double-check) Persona skip** — `targetUserId` UserProfile.type === INTERNAL → return (defense in depth).
4. **Actor lookup** — nickname, profileImageUrl.
5. **Notification 레코드 생성**:
   - `ownerUserId = targetUserId`, `actorUserId`, `type = FOLLOW`.
   - `title = "{actor.nickname}님이 회원님을 팔로우했습니다"`
   - `body = null`, `refId = null`, `thumbnailUrl = actor.profileImageUrl`, `deeplink = buildDeeplink('FOLLOW', { actorUserId })`, `unread = true`.
6. **Emit `NotificationPersistedEvent`**.

#### 3. `PaybackBatchSchedulerService` `@Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })`

전일 (KST 00:00 ~ 23:59:59.999) `CreditHistory.transactionType === PAYBACK` 레코드를 owner 별 합산.

Flow:
1. **Distributed lock 획득** — key `notification:payback-batch:{YYYY-MM-DD-KST}`. 이미 lock 되어 있으면 return (재실행 방지). Redis 기반 (기존 infra 있으면 재사용, 없으면 Mongo `ScheduledJobLock` 컬렉션으로 대체 — codebase 선례 조사 후 선택. **구현 선택 시 재량 허용, 단 idempotency 반드시 보장**).
2. **집계 쿼리** — `CreditHistory.aggregate([{ $match: { transactionType: 'PAYBACK', createdAt: { $gte: kstStart, $lte: kstEndInclusive } } }, { $group: { _id: '$userId', totalCredits: { $sum: '$amount' }, count: { $sum: 1 } } }])`.
3. **각 owner 별**:
   - Persona skip (UserProfile.type INTERNAL) → continue.
   - Unique constraint 기반 idempotency — `Notification.findOne({ ownerUserId, type: 'PAYBACK', paybackBucket })` → 존재 시 skip.
   - Notification 레코드 생성:
     - `title = "어제 {totalCredits}크레딧이 페이백되었어요!"`
     - `body = "회원님의 콘텐츠가 {count}회 재생성되었습니다"`
     - `refId = null`, `thumbnailUrl = null`, `actorUserId = null`, `deeplink = buildDeeplink('PAYBACK')`, `unread = true`, `paybackBucket = YYYY-MM-DD (KST)`.
   - Unique index duplicate key error → skip (race 대비).
4. **Emit `NotificationPersistedEvent`** (per owner).
5. **Lock 해제** (try/finally).

**페이백 토글 없음** (AC 5.5 — 항상 ON). `shouldNotify` helper 에서 type=PAYBACK 은 pushAll/persona 만 본다. like/news/follow 토글 무시.

### `shouldNotify(ownerUserId, type) → { persist: boolean, push: boolean }` helper (`domain/notification/notification-domain.service.ts`)

단일 진입점 — 3 listener 전원이 이 함수 경유.
- **persist** — persona 면 false, 아니면 true (settings 와 무관).
- **push** — persona 면 false, `pushAll === false` 면 false. 그 외:
  - `LIKE`: `settings.like`
  - `FOLLOW`: `settings.follow`
  - `PAYBACK`: 항상 true (토글 없음).
- 반환 값 중 `push` 는 be-006 의 `shouldPush` 에서 **재확인** (race 방지). 본 helper 는 persist 시점 판정용.

### `NotificationPersistedEvent` payload

```
{
  notificationId: string;
  ownerUserId: string;
  type: 'LIKE' | 'FOLLOW' | 'PAYBACK';
  actorUserId: string | null;
  refId: string | null;
  deeplink: string;
  // push 렌더용 추가 필드 (be-006 에서 NotiService payload 조립)
  title: string;
  body: string | null;
}
```

### Cross-path cleanup (integration-002)

- 1개월 보관 정책 → **TTL 인덱스 (mongoose `expireAfterSeconds: 2592000`) 단독** 채택. be-005 의 read-path 는 추가 `createdAt >= now - 1mo` 필터를 safety-net 으로 부여 (TTL lag 대비).
- **ContractDone Criteria**: TTL 인덱스가 실 운영에서 동작함을 확인 (unit test 에서는 mongodb-memory-server 로 TTL 시뮬레이션 대신 index spec 만 검증). Periodic hard-delete job 은 도입하지 **않음** — TTL + read-path 필터 조합으로 커버.

## Acceptance Criteria

- [ ] `Notification` schema + repository + module 생성. `nx run meme-api:typecheck` green.
- [ ] LIKE 이벤트 수신 → self-like/persona skip 검증. 일반 케이스 Notification 1건 생성. `NotificationPersistedEvent` 1회 emit.
- [ ] FOLLOW 이벤트 수신 (be-001 emit) → `shouldNotify=false` skip. 일반 케이스 1건 생성 + event 1회 emit.
- [ ] PAYBACK 배치 크론 `0 10 * * * Asia/Seoul` 등록. Manual trigger (테스트용 public method `runPaybackBatch(targetBucket)`) 존재.
- [ ] PAYBACK 배치 동일 날짜 2회 실행 시 2번째 실행에서 Notification 생성 0건 (unique constraint + findOne idempotency). `NotificationPersistedEvent` 도 2회차에서 emit 0회.
- [ ] PAYBACK 배치: persona owner skip 검증. 전일 페이백 0건인 owner 는 레코드 미생성.
- [ ] Title/body/deeplink 포맷이 AC 5.4 와 정확히 일치 (e2e assertion).
- [ ] TTL 인덱스 스펙 검증 — `db.notifications.getIndexes()` 에 `createdAt_1` 인덱스 + `expireAfterSeconds: 2592000`.
- [ ] PAYBACK 전용 unique partial index (`ownerUserId + type + paybackBucket`, partialFilterExpression `{ type: 'PAYBACK' }`) 생성 확인.
- [ ] **shouldNotify helper 단일 진입점** — 3 listener 각각 `shouldNotify(` 호출. `rg 'notificationSetting' apps/meme-api/src/application/notification` → `shouldNotify` 경유 외 직접 호출 0 hit.
- [ ] **grep 게이트 (Mapper fallback 금지, C08)**: `rg '\?\?\s*0|\?\?\s*false|\|\|\s*""' apps/meme-api/src/domain/notification apps/meme-api/src/persistence/notification apps/meme-api/src/application/notification` → 0 hit.
- [ ] **grep 게이트 (Dead hook/method, C09)**: 신규 method (`persistLikeNotification`, `persistFollowNotification`, `runPaybackBatch`, `shouldNotify`, `buildDeeplink`) 각각 `rg '<name>\(' apps/meme-api/src` → ≥ 2 hit.
- [ ] **Cross-component 전수 (C10)**: `NotificationPersistedEvent` 소비자 = be-006 `PushNotificationService` 단일. 본 태스크는 emit site 3 (LikeListener, FollowListener, PaybackBatchScheduler) + payload DTO 정의 1 = 총 4 곳 참조. 기타 참조 금지.
- [ ] **Cursor $lte (C10)**: 본 태스크 자체는 cursor 사용 없음 (be-005 범위). 해당 없음.
- [ ] **Concurrency / idempotency**:
  - PAYBACK 배치 → distributed lock + unique index 이중 방어 증명.
  - LIKE → `(actorUserId, ownerUserId, refId=contentId)` 조합 중복 방지 — 동일 유저가 동일 콘텐츠에 like/unlike/like 반복 시 Notification 2건 이상 생성될 수 있음 (각 LIKE_CREATED 이벤트가 별도 알림으로 간주). **정책**: 본 스프린트에서는 **허용** (PRD AC 5.1 "좋아요 알림 빈도 제한 없음"). idempotency 는 "동일 event-id 재전달 시" 에만 적용 (event bus 가 at-least-once 일 때) — 단순화: Notification.repository 에 `(actorUserId, ownerUserId, refId, createdAt second-truncated)` seen-cache 는 도입하지 않음. 재시도는 Nest EventEmitter2 기본 동작 (in-process) 에 의존.
  - FOLLOW → be-001 이 "신규 생성 시에만 emit" (idempotent re-follow 시 미emit) 로 보장. 본 listener 는 추가 방어 불필요.
- [ ] e2e: LIKE 이벤트 flow + FOLLOW 이벤트 flow + PAYBACK 배치 flow + persona skip. `nx run meme-api:test` / `nx run meme-api:e2e` green.
- [ ] **Regression**: 기존 payback event flow (be-phase2 `payback-event.listener.ts`) 정상 동작 유지. Like 기존 toggle 동작 (POST/DELETE) 회귀 없음. FOLLOW emit 지점 (be-001) 계약 변경 없음.

## Implementation Hints

- **TTL index**: `@Schema({ timestamps: true })` + `NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 })`.
- **Cron**: `@nestjs/schedule` 의 `@Cron` decorator. Timezone 지정은 `CronExpression` 대신 옵션 객체 `{ timeZone: 'Asia/Seoul' }`. KST 시각 계산은 `date-fns-tz` (codebase 에 이미 있는지 확인 후 재사용).
- **Distributed lock**: codebase 내 Redis lock util (`common/util/distributed-lock.ts` 류) 존재 여부 확인. 없으면 Mongo 기반 fallback — `ScheduledJobLock` 컬렉션 + TTL. 구현 난이도 ↓ 위해 Mongo 기반 권장.
- **LIKE_CREATED 이벤트 emit 선점검**: `rg 'LIKE_CREATED' apps/meme-api/src` 후 emit 호출 지점 확인. 없으면 `domain/like/like-domain.service.ts::toggleLike` 내 create path 에 삽입.
- **페르소나 판정**: `UserProfileDomainService.isPersona(userId): Promise<boolean>` 재사용 (be-001 과 동일).
- **Mapper fallback 금지 (C08)**: Zod 로 listener payload parse. `??` / `|| ""` 금지.
- **N+1 방지**: PAYBACK 배치 owner list → UserProfile bulk lookup (single `$in` query) → map.

## Out of Scope

- Push 발송 (be-006).
- 알림센터 read API (be-005).
- 알림 설정 toggle CRUD (be-007).
- 블록 유저 필터 (cross-feed 차단은 Group 002 be-002 범위). 단, **본 listener 는 블록 필터 불필요** — 이유: 블록 시점에 기존 like/follow 관계는 해제되므로 이벤트 자체가 발생하지 않음.
- Notification 삭제 API (TTL 로 커버).
- i18n / 다국어.

## Regression Guard

- `common/constant/event-constant.ts` — enum **값 추가만** (`LIKE_CREATED` 부재 시 추가 + `NOTIFICATION_PERSISTED`). 기존 enum 값 보존.
- `application/payback/payback-event.listener.ts` — 읽기만, 변경 금지.
- `persistence/credit/credit-history.schema.ts` / `domain/credit/*` — 변경 금지.
- `domain/like/like-domain.service.ts` — LIKE_CREATED emit 추가가 필요한 경우에 한해 최소 변경. toggleLike 시그니처/반환 계약 보존.
- Regression AC: Phase 1 profile + Phase 2 like/payback/credit e2e 전원 green. `nx affected:test` CI 통과.
