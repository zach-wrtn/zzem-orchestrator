# APP-007: Notification UI

## Target
- **User Story**: US5 (알림 & 푸시)
- **Acceptance Criteria**: AC 5.1, 5.2, 5.3
- **API Dependency**: BE-007 (Notification API)

## Context
알림센터 화면, 미읽은 알림 뱃지, 알림 설정. 카테고리별 필터링 및 ON/OFF. 알림 탭 시 관련 화면 이동.

## Objective
알림 관련 UI 구현.

## Specification

### Screens / Components

#### NotificationCenterScreen
- 알림 리스트 화면
- 카테고리 필터 탭: 전체 / 좋아요 / 크레딧 / 소식 / 팔로우
- 각 알림 아이템:
  - 카테고리 아이콘
  - 제목 + 본문
  - 시간 (상대 시간 표시)
  - 읽음/미읽은 시각 구분 (미읽은 = 배경색 강조)
- 알림 탭 시:
  - 좋아요 알림 → 해당 콘텐츠 세로 스와이프
  - 팔로우 알림 → 해당 유저 프로필
  - 크레딧 알림 → 크레딧 히스토리
- 읽음 처리: 알림 탭 시 자동 read 마킹
- cursor pagination (무한 스크롤)
- API: `GET /notifications`, `POST /notifications/read`

#### UnreadBadge
- MY 탭/알림 아이콘에 빨간점 표시
- 미확인 알림 존재 시 노출
- 폴링 또는 앱 포그라운드 시 갱신
- API: `GET /notifications/unread-count`

#### NotificationSettingsScreen
- MY 탭 설정(톱니바퀴)에서 진입
- 카테고리별 ON/OFF 토글:
  - 좋아요 알림
  - 크레딧 알림
  - 소식 알림
  - 팔로우 알림
- 변경 시 즉시 저장
- API: `GET /notifications/settings`, `PATCH /notifications/settings`

### Data Flow
- NotificationCenterScreen: `useInfiniteQuery` → `GET /notifications?category=...`
- 읽음 처리: `useMutation` → `POST /notifications/read` → invalidate unread count
- UnreadBadge: `useQuery` → `GET /notifications/unread-count` (refetchInterval 또는 앱 포그라운드)
- NotificationSettingsScreen: `useQuery` + `useMutation` → settings API

### Implementation Hints
- 상대 시간: `date-fns` formatDistanceToNow
- 알림 탭 → 화면 이동: React Navigation deeplink 패턴
- UnreadBadge: Zustand store로 전역 상태 관리 (빈번 조회 최적화)
- `@wrtn/app-design-guide` 컴포넌트 활용

## Acceptance Criteria

### AC 5.1: 알림 카테고리
- 4개 카테고리 필터 동작
- 카테고리별 올바른 알림 표시
- 알림 탭 시 올바른 화면 이동

### AC 5.2: 팔로우 알림
- "OOO님이 회원님을 팔로우했습니다" 표시
- 탭 시 해당 유저 프로필 이동

### AC 5.3: 알림센터 공통
- 미확인 알림 빨간점 노출
- 카테고리별 ON/OFF 설정 동작
- 읽음 처리 후 빨간점 갱신
