# Task: 007-notifications-ui

## Target
app-core-packages/apps/MemeApp

## Context
- PRD US5: 알림 & 푸시 (AC 5.1~5.3)
- 기존 push notification handler 존재 (usePushNotificationHandler)
- 기존 unread badge 존재 (HomeHeaderMyButton)
- API Contract: GET /notifications, POST /notifications/read, GET /notifications/unread-count, GET/PATCH /notification-settings

## Objective
알림센터 화면, 알림 뱃지, 알림 카테고리별 설정 UI를 구현한다.

## Specification

### Screens / Components
- **NotificationScreen**: 알림센터
  - 알림 목록 (최신순, 무한 스크롤)
  - 각 항목: 카테고리 아이콘, 제목, 내용, 썸네일, 시간
  - 미확인 알림 시각적 구분 (배경색 등)
  - 알림 탭 시 읽음 처리 + deepLink 이동
- **NotificationBadge**: 미확인 알림 빨간점
  - 기존 Home 헤더 또는 MY 버튼 영역에 표시
  - unread-count > 0 시 빨간점
- **NotificationSettingsSection**: Settings 화면 내 알림 설정
  - 카테고리별 ON/OFF 토글 (좋아요, 팔로우, 크레딧, 소식)

### Data Flow
- Domain: `useGetNotificationsUseCase()`, `useMarkNotificationReadUseCase()`, `useGetUnreadCountUseCase()`, `useNotificationSettingsUseCase()`
- Data: NotificationRepository, notificationQueryKey
- 푸시 알림 수신: 기존 usePushNotificationHandler 확장

### Implementation Hints
- 기존 unread badge 패턴 참조 (memeQueryKey.getUnreadBadge)
- Settings 화면의 기존 구조에 알림 설정 섹션 추가
- NotificationScreen → RootStackParamList에 추가

## Acceptance Criteria
- [ ] 알림센터에 알림 목록이 최신순으로 표시된다
- [ ] 각 알림에 카테고리, 제목, 내용, 시간이 표시된다
- [ ] 미확인 알림이 시각적으로 구분된다
- [ ] 알림 탭 시 읽음 처리되고 해당 화면(deepLink)으로 이동한다
- [ ] 미확인 알림 존재 시 빨간점 뱃지가 표시된다
- [ ] 알림 읽음 후 뱃지가 갱신된다
- [ ] Settings에서 알림 카테고리별 ON/OFF 토글이 동작한다
- [ ] 알림 목록이 무한 스크롤로 동작한다
- [ ] 푸시 알림 수신 시 알림센터에 반영된다
