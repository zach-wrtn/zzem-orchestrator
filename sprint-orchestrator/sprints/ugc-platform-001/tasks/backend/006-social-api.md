# Task: 006-social-api

## Target
wrtn-backend/apps/meme-api

## Context
- PRD US7: 타유저 프로필 및 사회적 기능 (AC 7.1~7.5)
- 기존 UserReport 모듈 존재 (신고 사유, 상태 관리)
- 차단: 편방향 팔로우 해제, 콘텐츠 필터링
- API Contract: POST/DELETE /blocks, GET /blocks/me, POST /reports, POST /feedbacks

## Objective
유저 차단/해제, 신고 (추천 패널티 연동), 의견 보내기 API를 구현한다. 차단 시 피드/좋아요 노출 필터링을 포함한다.

## Specification

### Endpoints (api-contract.yaml 참조)
- `POST /blocks` — 유저 차단 (LibUserGuard)
- `DELETE /blocks` — 차단 해제 (LibUserGuard)
- `GET /blocks/me` — 차단 목록 (LibUserGuard)
- `POST /reports` — 신고 (LibUserGuard)
- `POST /feedbacks` — 의견 보내기 (LibUserGuard)

### Data Model
- Block 엔티티: blockerId, blockedUserId, createdAt
- Report 확장: targetUserId, contentId(optional), reason(enum), description(100자), 추천 패널티 시그널
- Feedback 엔티티: senderId, targetUserId, contentId(optional), message(300자), createdAt

### Business Rules — Block
- 차단 시: A→B 팔로우만 해제, B→A 팔로우 유지 (편방향)
- 차단 유저의 콘텐츠: 피드에서 미노출, 좋아요 DB 유지/노출만 차단
- 차단된 프로필 진입 시: isBlocked=true 반환 (FE에서 "이 계정을 차단했어요" 표시)
- 차단 해제 시: 좋아요 등 다시 보임
- 차단/해제 사실 상대방 미통지

### Business Rules — Report
- 신고 사유: HARMFUL, SPAM, INAPPROPRIATE, OTHER
- 자유 입력: 100자 이내, 필수
- 신고 사실 상대방 미통지
- 노출 대비 신고 비율 높은 콘텐츠 → 추천 패널티 시그널 전달
- 신고한 유저에게 해당 콘텐츠 미노출 (개인화 필터링, ~1시간 지연)

### Business Rules — Feedback
- 자유 텍스트 300자 이내
- contentId 자동 첨부
- DB 적재만, 운영 어드민 조회는 후순위

### Implementation Hints
- 기존 UserReport 도메인 확장 또는 별도 Report 도메인
- Block 필터링: 피드/좋아요 조회 쿼리에 blocked userId 제외 조건 추가
- 추천 패널티: EventEmitter로 시그널 전달

## Acceptance Criteria
- [ ] `POST /blocks` 호출 시 유저 차단되고 A→B 팔로우가 해제된다
- [ ] 차단 후 B→A 팔로우는 유지된다
- [ ] 차단된 유저의 콘텐츠가 피드 조회 시 필터링된다
- [ ] 차단된 유저의 좋아요가 좋아요 목록에서 필터링된다 (DB 유지)
- [ ] `DELETE /blocks` 호출 시 차단 해제되고 필터링이 해제된다
- [ ] `GET /blocks/me` 호출 시 차단 목록이 반환된다
- [ ] `GET /profiles/{userId}` 응답에 isBlocked=true가 정확히 반환된다
- [ ] `POST /reports` 호출 시 신고가 생성되고 추천 패널티 시그널이 발행된다
- [ ] 신고 description이 100자를 초과하면 400 응답
- [ ] `POST /feedbacks` 호출 시 의견이 DB에 저장된다
- [ ] feedback message가 300자를 초과하면 400 응답
