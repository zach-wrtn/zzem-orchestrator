# Sprint Contract: Group 007 — Notifications

## Scope
- Tasks: 007-notifications-api (BE), 007-notifications-ui (FE)
- Endpoints: GET /notifications, POST /notifications/read, GET /notifications/unread-count, GET/PATCH /notification-settings
- PRD: US5 (AC 5.1~5.3)
- Depends on: Group 003 (Like events), Group 004 (Follow events), Group 005 (Credit Payback events)

## Done Criteria

### BE — Notification CRUD
- [ ] DC-1: GET /notifications (LibUserGuard) → 알림 목록 최신순, cursor pagination. 항목: id, category, title, body, thumbnailUrl, deepLink, isRead, createdAt
- [ ] DC-2: POST /notifications/read (LibUserGuard) → notificationIds 배열로 알림 읽음 처리
- [ ] DC-3: GET /notifications/unread-count (LibUserGuard) → 미읽은 알림 수 반환
- [ ] DC-4: 알림 TTL: expiresAt = createdAt + 30일. 조회 시 `expiresAt > now` 필터링. MongoDB TTL index 추가는 선택 (구현 세부사항)

### BE — Notification Settings
- [ ] DC-5: GET /notification-settings (LibUserGuard) → 카테고리별 ON/OFF 설정 반환 (like, follow, credit, news). 디폴트 전부 ON. 미존재 시 자동 생성
- [ ] DC-6: PATCH /notification-settings (LibUserGuard) → 카테고리별 ON/OFF 변경

### BE — Notification Triggers (Event Listeners)
- [ ] DC-7: 좋아요 발생 시 (`content.liked` 이벤트) → 콘텐츠 소유자에게 like 카테고리 알림 생성. title="좋아요", body="{닉네임}님이 회원님의 콘텐츠를 좋아합니다", thumbnailUrl=해당 콘텐츠 썸네일, deepLink=해당 콘텐츠 딥링크. 셀프 좋아요 시에도 알림 생성 (별도 필터링 없음). 개별 발송, 빈도 제한 없음
- [ ] DC-8: 팔로우 발생 시 (`user.followed` 이벤트) → 대상 유저에게 follow 카테고리 알림 즉시 생성. title="팔로우", body="{닉네임}님이 회원님을 팔로우했습니다", thumbnailUrl=팔로워의 프로필 이미지, deepLink=팔로워의 프로필 딥링크. 맞팔로우 시 별도 알림 없음
- [ ] DC-9: 크레딧 페이백 발생 시 (`credit.payback` 이벤트) → 원작자에게 credit 카테고리 알림 즉시 생성 (이벤트 기반 개별 발송, 배치 발송은 추후 최적화). title="크레딧 페이백", body="회원님의 콘텐츠가 재생성되어 {amount}크레딧이 적립되었습니다", thumbnailUrl=해당 콘텐츠 썸네일, deepLink=크레딧 히스토리 딥링크
- [ ] DC-10: 알림 생성 전 해당 카테고리 설정 확인 → OFF면 알림 미생성 (DB 저장 안 함, 푸시 미발송)
- [ ] DC-11: 페르소나 계정(isPersona=true)은 모든 알림 수신 대상에서 제외. 페르소나에게 알림 생성 시도 시 스킵

### BE — Push
- [ ] DC-12: 알림 생성 시 기존 Noti 인프라 모듈(`NotiModule` / `NotiService`)을 통해 푸시 발송. 해당 모듈이 없거나 접근 불가 시, 최소 push adapter stub을 생성하여 알림 생성 로직과 연결점만 구현
- [ ] DC-13: 페르소나 계정에는 푸시 미발송

### FE
- [ ] DC-14: FE NotificationScreen: 알림 목록 최신순, 무한 스크롤. 각 항목에 카테고리 아이콘, 제목, 내용, 썸네일, 시간
- [ ] DC-15: FE 미확인 알림 시각적 구분 (배경색 등)
- [ ] DC-16: FE 알림 탭 시 읽음 처리 + deepLink 이동
- [ ] DC-17: FE 미확인 알림 존재 시 빨간점 뱃지 표시 (Home 헤더 또는 적절한 위치)
- [ ] DC-18: FE 알림 읽음 후 뱃지 갱신 (unread count 재조회 via invalidateQueries)
- [ ] DC-19: FE Settings 화면에 알림 카테고리별 ON/OFF 토글 (좋아요, 팔로우, 크레딧, 소식)
- [ ] DC-20: FE NotificationScreen이 RootStackParamList에 등록되어 네비게이션 동작
- [ ] DC-21: FE 푸시 알림 수신 시 알림 목록 쿼리 무효화 (invalidateQueries)로 알림센터 반영

## Verification Method
- DC-1~4: Notification 조회 쿼리 + 정렬 + cursor + expiresAt > now 필터 확인
- DC-5~6: NotificationSetting getOrCreate(default all ON) + partial update 확인
- DC-7~9: 각 이벤트 리스너에서 Notification 생성 로직 추적. title/body/thumbnail/deepLink 값 확인
- DC-10: 알림 생성 전 `getSettings(userId)` → 해당 카테고리 OFF면 early return
- DC-11: 알림 대상 유저 프로필에서 isPersona 체크 → true면 early return
- DC-12: 알림 생성 후 NotiService 호출 또는 push adapter stub 존재 확인
- DC-14~16: FE NotificationScreen 렌더링 + 읽음 mutation + deepLink navigation
- DC-17~18: unread count 쿼리 + 뱃지 컴포넌트 + invalidateQueries 갱신
- DC-19: Settings 내 NotificationSettings 토글 + PATCH mutation
- DC-21: pushNotificationHandler에서 notification 쿼리 무효화 확인

### Edge Cases to Test
- 셀프 좋아요 → 본인에게 알림 발송 (DC-7에 명시)
- 좋아요/팔로우 취소 시 이미 생성된 알림은 삭제하지 않는다
- 차단한 유저의 좋아요/팔로우 → 알림 발송 (차단은 노출만 차단, 알림은 별도)
- 동시 다수 좋아요 → 각각 개별 알림 (DC-7 빈도 제한 없음)
- 알림 0개 → 빈 목록 + hasMore=false
- Settings에서 카테고리 OFF → 기존 알림 유지, 새 알림만 미생성 (DC-10)

## Sign-off
- 2026-03-29: Evaluator reviewed (6 objections), Sprint Lead revised (A-1~A-3, E-1~E-2, T-1 all addressed)
- 2026-03-29: Evaluator approved — all 21 DCs specific, testable, aligned
