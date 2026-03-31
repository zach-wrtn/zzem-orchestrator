# BE-006: Block & Report API

## Target
- **User Story**: US7 (타 유저 프로필 및 사회적 기능)
- **Acceptance Criteria**: AC 7.1, 7.2, 7.3, 7.4, 7.5
- **API Contract**: `api-contract.yaml` — Block, Report, Opinion sections

## Context
차단/차단해제, 신고, 의견 보내기. 차단 시 편방향 팔로우 해제 + 콘텐츠 노출 차단. 신고 시 추천 패널티 시그널 전달. 의견은 DB 적재만.

## Objective
- `POST /blocks` — 차단
- `GET /blocks` — 차단 목록
- `DELETE /blocks/:targetUserId` — 차단 해제
- `POST /reports` — 신고
- `POST /opinions` — 의견 보내기

## Specification

### Data Model — Block
- **Block** collection (MongoDB)
  - `blockerId` (string, indexed) — 차단한 유저
  - `blockedId` (string, indexed) — 차단당한 유저
  - `createdAt` (Date)
  - Compound unique index: `{blockerId, blockedId}`

### Data Model — Report
- **Report** collection (MongoDB)
  - `reporterUserId` (string, indexed)
  - `targetUserId` (string)
  - `contentId` (string, nullable)
  - `reason` (enum: spam/inappropriate/harassment/other)
  - `description` (string, max 100자, 필수)
  - `createdAt` (Date)

### Data Model — Opinion
- **Opinion** collection (MongoDB)
  - `fromUserId` (string, indexed)
  - `targetUserId` (string)
  - `contentId` (string, nullable)
  - `content` (string, max 300자)
  - `createdAt` (Date)

### Block Logic
1. 차단 생성: Block 문서 생성
2. 편방향 팔로우 해제: `Follow.deleteOne({followerId: blockerId, followingId: blockedId})`
3. 역방향 팔로우(B→A)는 유지
4. 차단 사실 미통지
5. 좋아요 데이터: DB 유지, 조회 시 필터링으로 노출 차단
6. 차단 해제: Block 문서 삭제 → 좋아요/콘텐츠 다시 노출

### Report Logic
1. Report 문서 저장
2. 추천 시스템에 신고 시그널 전달 (노출 대비 신고 비율 → 추천 패널티)
3. 신고한 유저에게 해당 콘텐츠 미노출 (개인화 필터링, ~1시간 지연)
4. 상대방 미통지

### Persona Handling (AC 7.5)
- 페르소나 계정 식별: UserProfile.isPersona 플래그
- 알림 수신 불가 (알림 발송 시 페르소나 체크)
- 페이백 적립 대상 제외
- 팔로우 가능 (UX 구분 없음), 팔로우 알림 미발송

### Implementation Hints
- `@Transactional()` for block + follow unlink
- soft delete 패턴 불필요 (차단 해제 = 문서 삭제)
- Report의 추천 패널티: 이벤트 발행으로 PA팀 시스템에 전달

## Acceptance Criteria

### AC 7.1: 타 유저 프로필
- `GET /profiles/:userId` 응답에 followStatus, isBlocked 포함
- 게시물(public) 콘텐츠만 반환

### AC 7.2: 차단
- 차단 시 편방향 팔로우 해제 (A→B만)
- 차단된 유저 콘텐츠 피드/프로필에서 미노출
- 좋아요 DB 유지, 노출만 차단
- 차단 해제 시 콘텐츠/좋아요 다시 노출
- 차단 사실 미통지

### AC 7.3: 신고
- 사유 선택 + 자유입력 (100자, 필수) 저장
- 추천 시스템에 신고 시그널 전달
- 신고한 유저에게 해당 콘텐츠 미노출 (~1시간 지연)
- 상대방 미통지

### AC 7.4: 의견 보내기
- 300자 텍스트 + contentId 저장
- DB 적재만 (어드민 조회 후순위)

### AC 7.5: 페르소나 계정
- isPersona 플래그로 식별
- 알림/페이백 제외, 팔로우 가능
