# Task: 007-notifications-api

## Target
wrtn-backend/apps/meme-api

## Context
- PRD US5: 알림 & 푸시 (AC 5.1~5.3)
- 기존 NotificationSetting 모듈 존재
- 기존 Noti 인프라 모듈 (푸시 발송)
- API Contract: GET /notifications, POST /notifications/read, GET /notifications/unread-count, GET/PATCH /notification-settings

## Objective
알림센터 API (목록, 읽음, 미확인 수), 알림 카테고리별 설정, 각 이벤트별 알림 생성 로직을 구현한다.

## Specification

### Endpoints (api-contract.yaml 참조)
- `GET /notifications` — 알림 목록, 최신순 (LibUserGuard)
- `POST /notifications/read` — 알림 읽음 처리 (LibUserGuard)
- `GET /notifications/unread-count` — 미확인 알림 수 (LibUserGuard)
- `GET /notification-settings` — 알림 설정 조회 (LibUserGuard)
- `PATCH /notification-settings` — 알림 설정 변경 (LibUserGuard)

### Data Model
- Notification 엔티티: userId, category(enum), title, body, thumbnailUrl, deepLink, isRead, createdAt, expiresAt
- NotificationSetting: userId, like(bool), follow(bool), credit(bool), news(bool), 디폴트 전부 ON
- TTL: 1개월 (expiresAt = createdAt + 30일)

### Notification Triggers
- **좋아요 알림** (category: like): 개별 발송, 빈도 제한 없음
  - 트리거: Like 생성 이벤트 → 콘텐츠 소유자에게 알림
- **팔로우 알림** (category: follow): 건별 즉시 발송, 맞팔로우 시 별도 알림 없음
  - 트리거: Follow 생성 이벤트 → 대상 유저에게 알림
  - 내용: "{닉네임}님이 회원님을 팔로우했습니다"
- **크레딧 페이백 알림** (category: credit): 배치 발송
  - 트리거: Payback 적립 이벤트 → 원작자에게 알림
- **페르소나 계정**: 모든 알림 수신 대상에서 제외

### Business Rules
- 알림 발송 전 해당 카테고리 설정 확인 (OFF면 미발송)
- 미확인 알림 존재 시 unread-count > 0 (FE에서 빨간점)
- 알림센터 보관: 1개월

### Implementation Hints
- 기존 NotificationSetting 도메인 확장
- 기존 Noti 인프라 모듈 활용 (푸시 발송)
- 이벤트 기반: Like/Follow/Payback 이벤트를 Notification 생성으로 연결
- 배치 발송 (크레딧): Scheduler 또는 큐 기반

## Acceptance Criteria
- [ ] `GET /notifications` 호출 시 알림 목록이 최신순으로 반환된다
- [ ] 알림 항목에 category, title, body, thumbnailUrl, deepLink, isRead, createdAt 포함
- [ ] `POST /notifications/read` 호출 시 해당 알림이 읽음 처리된다
- [ ] `GET /notifications/unread-count` 호출 시 미읽은 알림 수가 반환된다
- [ ] 좋아요 발생 시 콘텐츠 소유자에게 like 카테고리 알림이 생성된다
- [ ] 팔로우 발생 시 대상 유저에게 follow 카테고리 알림이 즉시 생성된다
- [ ] 팔로우 알림 내용이 "{닉네임}님이 회원님을 팔로우했습니다" 형태이다
- [ ] 크레딧 페이백 발생 시 credit 카테고리 알림이 생성된다
- [ ] 페르소나 계정에는 알림이 발송되지 않는다
- [ ] 알림 카테고리 OFF 설정 시 해당 카테고리 알림이 발송되지 않는다
- [ ] `PATCH /notification-settings` 로 카테고리별 ON/OFF 변경이 가능하다
- [ ] 1개월 이상 된 알림은 조회되지 않는다
