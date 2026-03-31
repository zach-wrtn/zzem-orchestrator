# UGC Platform Evaluation Criteria

## Evaluator Calibration Guide

### Evaluation Protocol
1. 각 그룹의 Done Criteria를 순서대로 검증
2. PASS: 모든 AC 충족 + 엣지 케이스 처리 확인
3. FAIL: 하나라도 미충족 시 구체적 실패 사유 + 수정 가이드 제공
4. API Contract 준수 여부 반드시 확인 (`api-contract.yaml` 대조)
5. 코드 패턴 준수: BE는 4-layer, App은 Clean Architecture

### Scoring
- 각 그룹 PASS/FAIL 판정
- 전체 7/7 PASS 시 스프린트 완료

---

## Group 1: Profile (US2 — BE-001, APP-001)

### Done Criteria
- [ ] `GET /profiles/me` — 프로필 전체 필드 + 3개 카운트 반환
- [ ] `PATCH /profiles/me` — 닉네임/이미지 수정, 변경 제한 없음
- [ ] `POST /profiles/me/nickname/generate` — 랜덤 닉네임 생성
- [ ] `POST /profiles/me/share` — 딥링크 URL 반환
- [ ] `GET /profiles/:userId` — 타 유저 프로필 + followStatus + isBlocked
- [ ] ProfileScreen 3탭 구조 올바르게 렌더링
- [ ] ProfileEditScreen 수정 → 즉시 반영
- [ ] 팔로워/팔로잉 리스트 가나다순 정렬 + 무한 스크롤

### Edge Cases
- 닉네임 빈 문자열/공백만 입력 시 validation 에러
- 프로필 이미지 null 허용 (기본 이미지 폴백)
- 존재하지 않는 userId 조회 시 404
- 최초 진입 시 닉네임 자동 생성 확인

---

## Group 2: Content Publishing (US1 — BE-002, APP-002)

### Done Criteria
- [ ] `PATCH /contents/:contentId/visibility` — 공개/비공개 전환
- [ ] 커스텀 프롬프트 콘텐츠 공개 시도 → 400 에러
- [ ] `GET /profiles/me/contents` — visibility 필터 + cursor pagination
- [ ] `GET /profiles/:userId/contents` — public만 반환
- [ ] `GET /contents/:contentId/cta` — 소유자 분기 (use_template/regenerate)
- [ ] `GET /payback/info` + `POST /payback/info/seen` — 1회성 모달
- [ ] PublishToggle OFF → 확인 바텀시트 → 비공개 전환
- [ ] FeedCta 올바른 화면 이동
- [ ] FullscreenMedia cover 크롭 + AI 라벨 노출

### Edge Cases
- 타인 콘텐츠 visibility 변경 시도 → 403
- 이미 비공개인 콘텐츠 비공개 전환 → idempotent
- 삭제된 콘텐츠 CTA 조회 → 404
- 비공개→공개 재전환 시 페이백 재지급 트리거 확인

---

## Group 3: Like (US3 — BE-003, APP-003)

### Done Criteria
- [ ] `POST /favorites/content/toggle` — 좋아요 토글 동작
- [ ] 셀프 좋아요 허용
- [ ] likeCount 정확한 증감
- [ ] `GET /profiles/me/favorites` — 좋아요 시점 최신순 + cursor pagination
- [ ] LikeButton optimistic update + 롤백
- [ ] 좋아요 수: 실제 숫자 노출 (0 포함, 축약 없음)

### Edge Cases
- 동시 다중 좋아요 토글 (race condition) → @Lock 처리
- 삭제된 콘텐츠 좋아요 시도 → 404
- 차단된 유저 콘텐츠 좋아요 탭에서 미노출
- 페르소나 콘텐츠 좋아요 → 성공

---

## Group 4: Follow (US6 — BE-004, APP-004)

### Done Criteria
- [ ] `POST /follows` — 팔로우
- [ ] `DELETE /follows/:targetUserId` — 언팔로우
- [ ] followStatus 3가지 (none/following/mutual) 정확
- [ ] `GET /follows/me/followers` — 가나다순 + cursor pagination
- [ ] `GET /follows/me/following` — 가나다순 + cursor pagination
- [ ] FollowButton 상태별 올바른 스타일
- [ ] 팔로워/팔로잉 리스트 → 유저 프로필 이동

### Edge Cases
- 셀프 팔로우 시도 → 400
- 중복 팔로우 → idempotent
- 타 유저 프로필에서 팔로워/팔로잉 리스트 접근 → 403 또는 숫자만 표시
- 페르소나 계정 팔로우 → 성공, 알림 미발송

---

## Group 5: Credit Payback (US4 — BE-005, APP-005)

### Done Criteria
- [ ] `POST /payback/process` — 페이백 처리 + 크레딧 적립
- [ ] 마진 체크 로직 동작
- [ ] 페르소나 콘텐츠 재생성 → 페이백 미적립 (reason 기록)
- [ ] 소수점 올림 처리 (1.2 → 2)
- [ ] 크레딧 타입 = promotion
- [ ] PaybackInfoModal 1회 노출 + hasSeen 마킹
- [ ] CreditHistoryPaybackItem 올바른 표시

### Edge Cases
- 마진 체크 실패 시 → processed: false, reason: margin_check_failed
- 페이백 비율 Config 변경 → 새 비율 즉시 적용
- 공개→비공개 전환 후 기존 페이백 유지 (회수 안 함)
- 비공개→공개 재전환 → 페이백 재지급
- 최저 0.1% 하한 적용 확인

---

## Group 6: Block & Report (US7 — BE-006, APP-006)

### Done Criteria
- [ ] `POST /blocks` — 차단 + 편방향 팔로우 해제
- [ ] `GET /blocks` — 차단 목록 조회
- [ ] `DELETE /blocks/:targetUserId` — 차단 해제
- [ ] `POST /reports` — 신고 저장 + 추천 시그널
- [ ] `POST /opinions` — 의견 저장
- [ ] OtherUserProfileScreen — 게시물 탭만, 더보기 메뉴
- [ ] BlockConfirmSheet → 차단 → BlockedProfileView
- [ ] 차단 해제 → 정상 프로필 전환
- [ ] ReportSheet — 사유 선택 + 자유입력(100자 필수)
- [ ] OpinionScreen — 300자 텍스트 + contentId

### Edge Cases
- 이미 차단한 유저 재차단 → idempotent
- 차단 해제 후 좋아요/콘텐츠 다시 노출 확인
- 차단 시 좋아요 DB 유지 확인 (직접 조회)
- 신고 description 빈 문자열 → validation 에러
- 역방향 팔로우(B→A) 유지 확인

---

## Group 7: Notification (US5 — BE-007, APP-007)

### Done Criteria
- [ ] `GET /notifications` — 카테고리 필터 + cursor pagination
- [ ] `POST /notifications/read` — 읽음 처리
- [ ] `GET /notifications/unread-count` — 미읽은 수
- [ ] `GET /notifications/settings` — 설정 조회
- [ ] `PATCH /notifications/settings` — 설정 변경
- [ ] TTL 30일 자동 삭제
- [ ] 페르소나 계정 알림 미발송
- [ ] NotificationCenterScreen — 카테고리 필터 + 알림 탭 이동
- [ ] UnreadBadge — 빨간점 노출/갱신
- [ ] NotificationSettingsScreen — 카테고리별 ON/OFF

### Edge Cases
- 카테고리 OFF 후 해당 알림 미생성 확인
- 좋아요 알림: 빈도 제한 없음 확인
- 크레딧 알림: 배치 발송 확인
- 팔로우 알림: "OOO님이 회원님을 팔로우했습니다" 문구
- 맞팔로우 시 별도 알림 없음 확인
- 30일 초과 알림 자동 삭제 확인
