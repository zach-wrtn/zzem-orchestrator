# Task: 003-notification-center

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US5 알림 & 푸시 (AC 5.1, AC 5.2, AC 5.3), 비즈니스 룰 - 알림 규칙
- API Contract Reference:
  - GET /notifications (getNotifications)
  - PUT /notifications/{notificationId}/read (markNotificationRead)
  - GET /notifications/unread-count (getUnreadNotificationCount)
  - GET /notifications/settings (getNotificationSettings)
  - PUT /notifications/settings (updateNotificationSettings)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: app/001-profile-screen (MY 탭에 알림 배지 표시)
- Parallel With: backend/003-notification-api, app/003-block-report-ui

## Objective
알림센터 화면을 구축하여 좋아요/크레딧/소식/팔로우 카테고리별 알림 목록을 제공하고, 미확인 알림 배지(빨간점)를 MY 탭에 표시한다. 설정 화면에서 카테고리별 ON/OFF를 지원한다.

## Specification

### Design Tokens
- **UnreadBadge**: bg #D33717, size 8×8 circle, position absolute top-right of 🔔 icon
- **NotificationItem (미읽음)**: bg #F5F5F5, paddingV 12, paddingH 16
- **NotificationItem (읽음)**: bg #FFFFFF
- **토스트 (에러)**: bg #D33717, text white, borderRadius 8
- **토스트 (성공)**: bg #262626, text white, borderRadius 8

### Screens / Components
- `NotificationListScreen` — 알림 목록 화면 (커서 페이지네이션)
- `NotificationItem` — 알림 항목 컴포넌트 (title, body, thumbnail, timestamp, 읽음 상태)
- `UnreadBadge` — 미확인 알림 빨간점 배지 (MY 탭 아이콘에 적용)
- `NotificationSettingsScreen` — 알림 카테고리별 ON/OFF 설정 화면
- `NotificationSettingToggle` — 카테고리별 토글 컴포넌트

### Navigation
- 진입점: MY 탭 ProfileScreen 헤더 우측 🔔 벨 아이콘 탭 → NotificationListScreen
- 알림 설정: NotificationListScreen 헤더 우측 ⚙️ 기어 아이콘 탭 → NotificationSettingsScreen
- 미확인 알림 배지: 🔔 아이콘 위 빨간점 (UnreadBadge)

### User Interactions
1. MY 탭 ProfileScreen 헤더의 🔔 아이콘에 미확인 알림 시 빨간점 배지 노출 (GET /notifications/unread-count)
2. 🔔 아이콘 탭 → NotificationListScreen 진입, GET /notifications로 알림 목록 로드 (커서 페이지네이션)
3. 알림 항목 표시: title, body, thumbnailUrl (nullable), createdAt, 읽음/미읽음 상태
4. 알림 항목 탭 → PUT /notifications/{notificationId}/read + deepLink 네비게이션
5. 무한 스크롤로 추가 알림 로드
6. NotificationListScreen 헤더 ⚙️ 아이콘 탭 → NotificationSettingsScreen 진입, GET /notifications/settings로 현재 설정 로드
7. 카테고리별 토글 ON/OFF → PUT /notifications/settings로 변경 저장

### Business Rules
1. 알림 카테고리: like(좋아요), credit(크레딧), news(소식), follow(팔로우)
2. 모든 카테고리 디폴트 ON
3. 좋아요 알림: 빈도 제한 없음 (개별 알림)
4. 팔로우 알림: 건별 발송, 맞팔로우 시 별도 알림 없음
5. 크레딧 페이백 알림: 배치 발송
6. 알림센터 보관: 1개월 (서버 측 관리, 클라이언트는 받은 데이터 그대로 표시)
7. 미확인 알림 존재 시 MY 탭에 빨간점 노출
8. 딥링크를 통해 관련 화면(콘텐츠, 프로필 등)으로 네비게이션

## Interaction States

### NotificationListScreen
- **Loading**: 리스트 스켈레톤 (아이콘 원형 + 텍스트 2줄 placeholder × 6행)
- **Empty**: "아직 알림이 없어요" + "활동이 생기면 여기에서 알려드릴게요" (CTA 없음)
- **Error**: 풀스크린 에러 뷰 + "다시 시도" 버튼
- **읽음/미읽음 구분**: 미읽음 항목 배경 #F5F5F5, 읽음 항목 배경 #FFFFFF

### NotificationSettingsScreen
- **Loading**: 토글 리스트 스켈레톤
- **설정 저장 실패**: 토스트 "설정 변경에 실패했어요" + 토글 원래 상태 복원

### UnreadBadge
- **Polling 주기**: 앱 포그라운드 진입 시 + 60초 refetchInterval
- **카운트 0**: 배지 숨김 (빨간점 미노출)

## Implementation Hints
- 기존 패턴 참조: swipe-feed의 커서 페이지네이션 패턴, credit 도메인의 히스토리 목록 패턴
- Domain: Notification 엔티티 (Zod), NotificationSettings 엔티티, useGetNotifications / useMarkNotificationRead / useGetUnreadCount / useGetNotificationSettings / useUpdateNotificationSettings 훅, NotificationRepository 인터페이스
- Data: NotificationDto namespace, NotificationMapper, notificationRepositoryImpl, notificationQueryKeys
- Presentation: NotificationListScreen, NotificationSettingsScreen, useNotificationViewModel
- UnreadBadge: 앱 전역에서 polling 또는 앱 포그라운드 진입 시 unread-count 쿼리 (refetchInterval 또는 AppState 리스너)
- 딥링크 네비게이션: React Navigation의 navigate/push를 deepLink 문자열 파싱하여 호출
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] 알림 목록 화면이 커서 페이지네이션으로 정상 로드된다
- [ ] 알림 항목에 title, body, thumbnail, timestamp이 올바르게 표시된다
- [ ] 읽음/미읽음 상태가 시각적으로 구분된다
- [ ] 알림 탭 시 읽음 처리 API가 호출되고 딥링크로 네비게이션된다
- [ ] MY 탭에 미확인 알림 빨간점 배지가 노출된다
- [ ] 미확인 알림이 없으면 배지가 사라진다
- [ ] 설정 화면에서 카테고리별 ON/OFF 토글이 동작한다
- [ ] 설정 변경 시 PUT API가 호출되고 상태가 반영된다
- [ ] 무한 스크롤이 정상 동작한다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
