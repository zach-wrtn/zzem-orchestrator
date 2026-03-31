# BE-007: Notification API

## Target
- **User Story**: US5 (알림 & 푸시)
- **Acceptance Criteria**: AC 5.1, 5.2, 5.3
- **API Contract**: `api-contract.yaml` — Notification section

## Context
좋아요/크레딧/소식/팔로우 알림. 푸시 + 인앱 알림센터. 카테고리별 ON/OFF 설정. 페르소나 계정은 알림 대상에서 제외. 크레딧 페이백 알림은 배치 발송.

## Objective
- `GET /notifications` — 알림 목록 조회 (카테고리 필터)
- `POST /notifications/read` — 알림 읽음 처리
- `GET /notifications/unread-count` — 미읽은 알림 수
- `GET /notifications/settings` — 알림 설정 조회
- `PATCH /notifications/settings` — 알림 설정 변경

## Specification

### Data Model — Notification
- **Notification** collection (MongoDB)
  - `userId` (string, indexed) — 수신자
  - `category` (enum: like/credit/news/follow)
  - `title` (string)
  - `body` (string)
  - `isRead` (boolean, default false)
  - `contentId` (string, nullable) — 관련 콘텐츠
  - `fromUserId` (string, nullable) — 발신자
  - `createdAt` (Date, indexed)
  - TTL index: 30일 후 자동 삭제 (1개월 보관)

### Data Model — NotificationSettings
- **NotificationSettings** collection (MongoDB)
  - `userId` (string, unique indexed)
  - `like` (boolean, default true)
  - `credit` (boolean, default true)
  - `news` (boolean, default true)
  - `follow` (boolean, default true)

### Notification Creation Logic
- 알림 생성 전 체크:
  1. 수신자가 페르소나 계정 → skip
  2. 수신자의 해당 카테고리 설정이 OFF → skip
- 카테고리별 발송 정책:
  - **like**: 개별 즉시 발송. 빈도 제한 없음
  - **follow**: 건별 즉시 발송. 맞팔로우 시 별도 알림 없음. 빈도 제한 없음
  - **credit**: 배치 발송 (페이백 집계 후 일괄)
  - **news**: 운영 발송

### Push Integration
- 알림 생성 시 푸시 발송 연동 (기존 푸시 시스템 활용)
- 페르소나 계정 푸시 미발송

### Unread Count
- 미확인 알림 존재 시 빨간점 노출용 카운트
- 효율적 조회: `count({userId, isRead: false})`

### Implementation Hints
- TTL index: `createdAt` 필드에 30일 expireAfterSeconds
- 배치 발송: 크레딧 페이백은 별도 배치 잡/스케줄러
- 푸시 연동: 기존 푸시 서비스 호출

## Acceptance Criteria

### AC 5.1: 알림 카테고리
- 좋아요/크레딧/소식/팔로우 4개 카테고리 지원
- 디폴트 전부 ON
- 좋아요: 개별 즉시, 빈도 제한 없음
- 팔로우: 건별 즉시, 맞팔로우 별도 알림 없음
- 크레딧 페이백: 배치 발송
- 페르소나 계정 알림 제외

### AC 5.2: 팔로우 알림
- 팔로우 시 즉시 푸시 + 인앱 알림
- 활동 알림 카테고리
- 알림 내용: "OOO님이 회원님을 팔로우했습니다"
- 페르소나가 팔로우 당해도 알림 미발송

### AC 5.3: 알림센터 공통
- 1개월 보관 (TTL 30일)
- 미확인 알림 빨간점: `GET /notifications/unread-count`
- 카테고리별 ON/OFF: `GET/PATCH /notifications/settings`
