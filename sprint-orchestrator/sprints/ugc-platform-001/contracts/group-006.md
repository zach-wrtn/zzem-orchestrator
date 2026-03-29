# Sprint Contract: Group 006 — Social (Block/Report)

## Scope
- Tasks: 006-social-api (BE), 006-social-ui (FE)
- Endpoints: POST/DELETE /blocks, GET /blocks/me, POST /reports, POST /feedbacks
- PRD: US7 (AC 7.1~7.5)
- Depends on: Group 001 (Profile), Group 004 (Follow — 차단 시 편방향 팔로우 해제)
- FE: Group 004에서 구현된 OtherProfileScreen 확장

## Done Criteria

### Block
- [ ] DC-1: POST /blocks에 targetUserId 전송 시 유저 차단되고 blocked=true 반환
- [ ] DC-2: 자기 자신 차단 시도 시 400 응답
- [ ] DC-3: 차단 시 A→B 팔로우만 해제된다. B→A 팔로우는 유지 (편방향 해제). A의 followingCount -1, B의 followerCount -1
- [ ] DC-4: 차단된 유저의 콘텐츠가 다음 endpoint에서 필터링된다: GET /contents/me?tab=liked, GET /contents/{userId}/published, GET /likes/me. (GET /contents/me?tab=published, tab=private는 본인 콘텐츠만이므로 필터링 불필요)
- [ ] DC-5: 차단된 유저의 좋아요가 GET /likes/me에서 필터링된다 (DB 유지, 노출만 차단)
- [ ] DC-6: DELETE /blocks에 targetUserId 전송 시 차단 해제되고 blocked=false 반환. 해제 후 필터링 해제
- [ ] DC-7: GET /blocks/me → 차단 목록 (userId, nickname, profileImageUrl, blockedAt), cursor pagination
- [ ] DC-8: GET /profiles/{userId} 응답의 isBlocked 필드가 Block 컬렉션 조회와 연동되어 실제 차단 상태를 반환한다 (Group 001에서 필드 추가, Group 006에서 실제 데이터 연동)
- [ ] DC-9: 차단/해제 사실은 상대방에게 알림 미발송
- [ ] DC-10: 이미 차단된 유저 재차단 시 멱등 처리. 이미 해제된 유저 재해제 시 멱등 처리
- [ ] DC-11: 차단된 유저(B)가 차단자(A)의 프로필 조회 시 → 정상 PublicProfileResponse 반환 (PRD "접근 불가"는 A 측에서 B 콘텐츠를 보지 못하는 것. B→A 방향은 차단하지 않음. 양방향 차단은 스코프 외)

### Report
- [ ] DC-12: POST /reports에 targetUserId + reason + description 전송 시 신고 생성 (201)
- [ ] DC-13: reason은 enum(HARMFUL, SPAM, INAPPROPRIATE, OTHER), description 최대 100자. 초과 시 400
- [ ] DC-14: 신고 사실 상대방 미통지
- [ ] DC-15: 신고 발생 시 contentId가 존재하면 `content.reported` 이벤트 발행 (payload: { reporterId, targetUserId, contentId, reason, timestamp }). contentId 미존재(유저 레벨 신고)면 이벤트 미발행
- [ ] DC-16: 신고 시 DB에 reporterId + targetUserId + contentId(nullable) 기록. contentId가 있는 경우에만 추천 개인화 필터링 대상으로 기록됨
- [ ] DC-17: 동일 유저가 동일 대상을 재신고 시 중복 허용 (별도 신고 건으로 생성). 추천 패널티는 신고 건수 비례

### Feedback
- [ ] DC-18: POST /feedbacks에 targetUserId + message 전송 시 의견 저장 (201)
- [ ] DC-19: message 최대 300자, 초과 시 400. contentId 선택적 첨부
- [ ] DC-20: 의견은 DB 적재만 (운영 어드민 조회는 후순위)

### FE
- [ ] DC-21: FE OtherProfileScreen 더보기 메뉴에 "프로필 URL 복사", "차단하기", "신고하기" 포함
- [ ] DC-22: FE "차단하기" 탭 시 BlockConfirmSheet 표시 → 확인 후 차단 처리 → BlockedProfileView로 전환
- [ ] DC-23: FE BlockedProfileView: "이 계정을 차단했어요" + 차단 해제 버튼. 해제 시 정상 프로필로 복귀
- [ ] DC-24: FE "신고하기" 탭 시 ReportSheet 표시 (사유 선택 + 자유 입력 100자)
- [ ] DC-25: FE 의견 보내기 버튼 (말풍선 아이콘) 탭 시 FeedbackScreen 이동 (300자 텍스트 + contentId)
- [ ] DC-26: FE "프로필 URL 복사" 탭 시 클립보드에 딥링크 URL 복사

## Verification Method
- DC-1~3: Block 생성 → Follow 도메인에서 A→B 팔로우 삭제 + 카운터 감소 확인. B→A 유지 확인
- DC-4~5: 해당 endpoint 쿼리에 blocked userId 제외 조건 추가 확인
- DC-6: Block 삭제 후 필터링 조건 해제 확인
- DC-7: Block 조회 + Profile JOIN + cursor pagination
- DC-8: GET /profiles/{userId} 서비스에서 Block 조회 로직 연동 확인
- DC-11: 차단된 유저의 프로필 조회 시 일반 응답 확인
- DC-12~13: Report 생성 + validation 확인
- DC-15: contentId 존재 시 EventEmitter.emit('content.reported', payload) 확인. 미존재 시 emit 미호출
- DC-16: Report 스키마에 reporterId, targetUserId, contentId(nullable) 저장 확인
- DC-17: 동일 유저 재신고 시 새 문서 생성 확인
- DC-21~26: FE 컴포넌트/시트 렌더링 + API 호출 + 상태 전환 확인

### Edge Cases to Test
- 자기 자신 차단 시도 → 400 (DC-2)
- 차단 후 팔로워 카운터 정확성 (DC-3)
- 차단 해제 후 차단 전 좋아요 데이터 다시 보이는지 확인 (DC-5~6)
- 존재하지 않는 targetUserId 차단/신고 시 → 404
- 신고와 차단 동시 수행 시 각각 독립 처리

## Sign-off
- 2026-03-29: Evaluator reviewed (7 objections), Sprint Lead revised (A-1~A-3, E-1~E-3, S-1 all addressed)
- 2026-03-29: Evaluator approved — all 26 DCs specific, testable, aligned
