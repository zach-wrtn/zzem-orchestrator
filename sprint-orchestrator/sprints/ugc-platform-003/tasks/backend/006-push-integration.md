# be-006 · Push 발송 통합 (new-noti + UserDevice.fcmToken)

- **Group**: 003
- **Owner**: be-engineer
- **Depends on**: be-004 (Notification persist + listener), be-007 (notification settings read)

## Target

`backend/apps/meme-api/src/` 내:
- 신규 `application/notification/push-notification.service.ts`
- 기존 `infrastructure/noti/noti.service.ts` — NotiService.sendPush() 경유 (기존 API 재사용, 필요 시 interface 소폭 확장)
- 기존 `common/interface/notification-payload.interface.ts` (PushNotificationPayload) — deeplink + 3 type 지원 확인
- be-004 의 listener 들에 PushNotificationService 주입 (Notification persist 직후 push dispatch)
- 관련 Nx unit test

## Context

AC 5.4: 기존 new-noti 서버 + UserDevice.fcmToken 인프라를 통해 발송. 3 템플릿 (LIKE 실시간, FOLLOW 실시간, PAYBACK 배치 10시 KST). Fallback 딥링크: 파싱 실패 시 홈 화면.

UserDevice.fcmToken + NotiService (external NOTI_API_URL) 인프라는 이미 존재. 본 태스크는 3 type 에 대한 payload 생성 + send dispatch + persona/settings 최종 gate.

## Objective

Notification persist 직후 (or listener 내부) push 발송 경로 완결. BE-side persona + settings 이중 gate (race 방지).

## Specification

### PushNotificationService.dispatch(notification: Notification): Promise<void>

- Input: be-004 가 저장한 Notification document.
- Step 1 — **shouldPush(ownerId, type)** helper (단일 helper, cross-path cleanup integration-002):
  - ownerProfile.type === INTERNAL → return false (persona 제외, AC 5.1).
  - notificationSettings.pushAll === false → return false.
  - type 별:
    - LIKE → notificationSettings.like === false → false.
    - FOLLOW → notificationSettings.follow === false → false.
    - PAYBACK → 토글 없음 (항상 ON, AC 5.5).
  - 모두 통과 → true.
- Step 2 — false 면 조기 반환 (Notification 은 이미 persist 됨; push 만 skip).
- Step 3 — UserDevice 조회: `UserDeviceDomainService.findAll(ownerUserId)` (기존 메서드). pushEnabled=true + fcmToken 존재하는 device 들만.
- Step 4 — 각 device 에 대해 PushNotificationPayload 생성:
  - `title`: Notification.title (be-004 가 생성 시점 템플릿 적용해 저장).
  - `body`: Notification.body (PAYBACK only).
  - `deeplink` (또는 기존 payload 의 appLink 필드): Notification.deeplink.
  - `data`: `{ notificationId, type, wrtn?: {...extra} }` — app-008 측 push handler 가 파싱.
- Step 5 — `NotiService.sendPush(device, payload)` 호출. 실패 시 log + UserDevice 소프트 무효화 (기존 delete/hardDelete 경로 재사용 — fcm token invalid 판정 시). Retry 없음 (new-noti 측 책임).
- Step 6 — 모든 device 에 send 완료.

### be-004 listener 와 연결

- LikeNotificationListener, FollowNotificationListener, PaybackBatchSchedulerService 각각:
  - Notification persist 성공 직후 `pushNotificationService.dispatch(notification)` 호출 (비동기 fire-and-forget — 에러가 listener 트랜잭션 rollback 을 유발하지 않도록 try/catch).
- 대안: Notification persist 후 `NotificationPersistedEvent` emit + 본 서비스가 `@OnEvent` 으로 consume — 설계 선택. 현 contract 는 **직접 호출** 로 결정 (단일 callsite per listener, 명시적).

### Payload 규칙

- LIKE:
  - title: `"{nickname}님이 회원님의 콘텐츠를 좋아합니다"` (be-004 가 저장 시점 생성)
  - deeplink: `zzem://contents/{contentId}`
- FOLLOW:
  - title: `"{nickname}님이 회원님을 팔로우했습니다"`
  - deeplink: `zzem://profile/{actorUserId}`
- PAYBACK:
  - title: `"어제 {N}크레딧이 페이백되었어요!"`
  - body: `"회원님의 콘텐츠가 {M}회 재생성되었습니다"`
  - deeplink: `zzem://credit-history`
- Fallback deeplink: BE 는 항상 유효한 deeplink 를 채움. FE 파싱 실패 시 `zzem://home` fallback 은 app-008 담당.

### Out of Scope

- 소식 알림 (기 구현).
- 알림 예약 발송 (배치는 be-004 scheduler 가 담당).
- 개별 notification push resend.
- Push 발송 실패 retry 로직 (new-noti 책임).

## Acceptance Criteria

- [ ] `PushNotificationService.dispatch` 가 persona owner → 조기 반환, settings.pushAll=false → 조기 반환, type 별 토글 false → 조기 반환 (unit test 4 케이스).
- [ ] shouldPush helper 가 단일 정의 (cross-path cleanup): `rg 'shouldPush\(' backend/apps/meme-api/src → 1 정의 + ≥ 1 callsite` (integration-002).
- [ ] UserDevice 다중 device 전부 발송 (unit test: 2 device seed).
- [ ] fcmToken 없음 / pushEnabled=false device 는 skip.
- [ ] NotiService.sendPush 실패 시 throw 가 listener 트랜잭션을 rollback 하지 않음 (fire-and-forget semantics 검증).
- [ ] 3 type 각각의 title/body/deeplink 가 api-contract NotificationItem 과 일치 (mapper snapshot).
- [ ] Notification persist 후 push dispatch 가 반드시 호출 (be-004 listener 3개 각각 callsite ≥ 1 grep): `rg 'pushNotificationService\.dispatch\(' backend/apps/meme-api/src → ≥ 3 hit` (completeness-009).
- [ ] Mapper fallback 금지 grep: `rg '\?\?\s*""|\?\?\s*0|\?\?\s*false' backend/apps/meme-api/src/application/notification → 0 hit`.
- [ ] Cross-component 전수: push 발송 진입점 3개 (Like/Follow/Payback listener). 외 emit 경로 금지.
- [ ] Nx unit test 커버.
- [ ] lint / typecheck 신규 에러 0.

## Implementation Hints

- 기존 Phase 2 payback listener `payback-event.listener.ts` 에서 에러 swallow 패턴 (try/catch + log only) 참조 — listener 트랜잭션 안전성.
- NotiService.sendPush signature 확인 후 interface 필요 시 확장 (deeplink 필드 지원 여부). 기존 field 가 `appLink` 라면 그대로 사용.
- UserDevice 조회는 기존 `UserDeviceDomainService.findAll(userId)` 재사용. 각 device iterate.
- fcm token invalid 판정: NotiService 응답 code 또는 기존 handle 패턴 grep.

## Regression Guard

- 기존 meme-gen-complete push (Phase 2 이전부터 존재) 회귀 없음 — send 경로 분리 (application/notification/ 신규).
- PaybackEventListener (Phase 2 be-003) 동작 회귀 없음 — 본 태스크는 push 만 추가, 적립 로직 미변경.
- NotiService.sendPush signature 변경 시 기존 callsite (grep 으로 전수) 회귀 검증.
- Cross-component 영향 전수: application/notification/ 신규 디렉토리 + be-004 listener 3개 (주입 추가만). Persistence / domain / controller / 타 application 미변경.
