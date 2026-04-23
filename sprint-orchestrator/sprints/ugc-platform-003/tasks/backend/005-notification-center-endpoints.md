# be-005 · 알림센터 endpoints (list, unread-count, read-all)

- **Group**: 003
- **Owner**: be-engineer
- **Depends on**: be-004 (Notification 엔티티 + listener)

## Target

`backend/apps/meme-api/src/` 내:
- 신규 `controller/notification/notification.controller.ts`
- 신규 `domain/notification/notification-domain.service.ts` (or 확장 — be-004 의 것 재사용)
- 신규 또는 확장 `persistence/notification/notification.repository.ts` — cursor paging, unread count, read-all batch
- 신규 `common/dto/notification.dto.ts` (NotificationItem response mapping)
- 관련 Nx integration test

## Context

AC 5.3: 알림센터 진입 시 시간 역순 단일 리스트 + red dot + 진입 시 일괄 읽음. `/v2/me/notifications` (list, cursor), `/v2/me/notifications/unread-count` (red dot), `/v2/me/notifications/read-all` (진입 시 mark-read).

be-004 가 Notification 엔티티 + 3종 listener 를 구현. 본 태스크는 **read path + batch update** 만 담당.

## Objective

알림센터 3 엔드포인트 구현. BE mapper 는 api-contract NotificationItem 필드를 엄격히 준수 (fallback 금지).

## Specification

### GET /v2/me/notifications

- Compound cursor: `{createdAt: Date, _id: ObjectId}` DESC.
- Repository 쿼리: `_id: { $lte: cursorId }` (correctness-004 — `$lt` 금지). extra fetch (limit+1) → `list[limit]` 을 nextCursor 로 인코딩.
- Base query: `{ ownerUserId: caller, createdAt: { $gte: now - 30days } }`.
  - 1개월 초과 Notification 은 응답 제외 (TTL 인덱스가 있어도 지연 삭제 가능성 방어).
- Sort: `{createdAt: -1, _id: -1}`. Index `{ownerUserId: 1, createdAt: -1, _id: -1}` 전용 (be-004 에서 생성).
- Limit: 1~100, default 20.
- Mapper: Notification document → NotificationItem DTO (api-contract):
  - 필수 필드 누락 시 Zod 또는 수동 검증 → parse 실패 → 해당 item skip (log warning). 응답 결과에서 제외. (completeness-008 — fallback 금지).
  - `actorUserId`, `thumbnailUrl`, `body`, `refId` 는 nullable (DTO schema 대로).
  - deeplink 는 schema 에 저장된 값 그대로 반환 (be-004 가 생성 시점 기록).

### GET /v2/me/notifications/unread-count

- Query: `Notification.countDocuments({ownerUserId: caller, unread: true, createdAt: {$gte: now - 30days}})`.
- Response: `{ unreadCount: number }`.

### POST /v2/me/notifications/read-all

- `Notification.updateMany({ownerUserId: caller, unread: true}, {$set: {unread: false}})`.
- Response: `{ updatedCount: number }`. Idempotent (두 번째 호출 시 updatedCount=0).
- Transaction 불필요 (단일 컬렉션 batch).
- createdAt 제한 없음 (만료된 레코드도 함께 update 되지만 응답에서 빠지므로 무해).

### Persistence API

- `NotificationRepository.findListWithCursor(ownerUserId, cursor, limit)` — base64 cursor decode → `$lte` 쿼리 → extra fetch.
- `NotificationRepository.countUnread(ownerUserId)`.
- `NotificationRepository.markAllRead(ownerUserId)`.

각 메서드 cross-component callsite ≥ 1 grep 게이트 (completeness-009).

### Out of Scope

- 개별 item mark-read (요구 없음, read-all 만).
- 알림 삭제 endpoint (TTL + mongoose 1mo 만료).
- 카테고리 탭 필터 (AC 5.3 명시 — 탭 필터 없이 단일 리스트).
- 소식 알림 (기 구현 완료, Phase 3 범위 밖).

## Acceptance Criteria

- [ ] GET /v2/me/notifications: cursor 페이지네이션 동작 (limit=5, seed 10 → page 2 list.length ≥ 1).
- [ ] Repository cursor 쿼리가 `$lte` 사용: `rg '_id:\s*\{\s*\$lt\s*:' backend/apps/meme-api/src/persistence/notification → 0 hit` (correctness-004).
- [ ] 1개월 초과 레코드 응답 제외 (integration test: 31일 전 seed → 응답 list 에 없음).
- [ ] NotificationItem 필수 필드 (notificationId, type, title, unread, deeplink, createdAt) 모두 포함 — `rg '\?\?\s*false|\?\?\s*""|\?\?\s*0' backend/apps/meme-api/src/common/dto/notification → 0 hit` (completeness-008).
- [ ] Mapper 가 필수 필드 누락 시 item skip (unit test: 의도적 malformed document seed → skip 동작).
- [ ] GET unread-count: unread=true 개수 정확. 30일 초과 레코드 제외.
- [ ] POST read-all: updatedCount 반환, 재호출 시 0. 다른 유저의 Notification 미수정 (cross-owner 보안).
- [ ] 영향 엔드포인트 전수 나열 (cross-component, completeness-010): /v2/me/notifications, /v2/me/notifications/unread-count, /v2/me/notifications/read-all. 외 엔드포인트 미변경.
- [ ] Nx integration test: `notification.controller.spec.ts` 3 endpoint 커버.
- [ ] Regression: NotificationSetting 도메인 (be-007) 호출 경로 회귀 없음. 기존 push 발송 (be-006) 회귀 없음.
- [ ] lint / typecheck / tsc --noEmit 신규 에러 0. Nx build 성공.

## Implementation Hints

- Cursor encoding: Phase 2 `like.repository.ts` findMyLikesWithCursor 패턴 참조.
- Base64 cursor decode util: `common/util/cursor.ts` (있다면 재사용).
- Controller: `@UseGuards(LibUserAuth)` + `@GetUser()` decorator 패턴 (기존 me-contents controller 참조).
- Nestjs test: `Test.createTestingModule` + in-memory MongoDB (mongodb-memory-server — 기존 test-utils 확인).

## Regression Guard

- 기존 notification-setting 도메인 (memeNotification 등) 호출 경로 회귀 없음.
- Phase 2 payback event listener 동작 회귀 없음 (같은 event bus 공유).
- Cross-component 영향 전수: `controller/notification/`, `domain/notification/`, `persistence/notification/`, `common/dto/notification.dto.ts`. 외 파일 수정 금지.
