# Task: 004-follow-api

## Target
wrtn-backend/apps/meme-api

## Context
- PRD US6: 팔로우 (AC 6.1~6.3)
- 팔로우 관계: 팔로우/팔로잉/맞팔로우 3상태
- 프로필 카운터 연동: followerCount, followingCount
- API Contract: POST /follows, DELETE /follows, GET /follows/me/followers, GET /follows/me/followings, GET /follows/status/{targetUserId}

## Objective
유저 팔로우/언팔로우 API, 팔로워/팔로잉 목록 조회, 팔로우 상태 조회 API를 구현한다.

## Specification

### Endpoints (api-contract.yaml 참조)
- `POST /follows` — 팔로우 (LibUserGuard)
- `DELETE /follows` — 언팔로우 (LibUserGuard)
- `GET /follows/me/followers` — 내 팔로워 목록, 가나다순 (LibUserGuard)
- `GET /follows/me/followings` — 내 팔로잉 목록, 가나다순 (LibUserGuard)
- `GET /follows/status/{targetUserId}` — 특정 유저 팔로우 상태 (LibUserGuard)

### Data Model
- Follow 엔티티: followerId, followeeId, createdAt
- 인덱스: (followerId, followeeId) unique, followerId, followeeId
- UserProfile 카운터 동기화: followerCount, followingCount

### Business Rules
- 자기 자신 팔로우 불가 → 400
- 중복 팔로우 시도 → 멱등 처리 (기존 상태 반환)
- 팔로우 상태: none / following / follower / mutual
- 팔로워/팔로잉 목록: 가나다순 (닉네임 기준)
- 타유저 프로필: 팔로워/팔로잉 숫자만 노출 (리스트 조회 불가, 본인만)
- 페르소나 계정: 팔로우 가능 (UX 상 구분 없음)
- 팔로우 시 추천 시스템에 부스트 시그널 전달

### Implementation Hints
- 기존 5-layer 패턴: Controller → AppService → DomainService → Repository → Mongoose
- 카운터 동기화: Follow 생성/삭제 시 UserProfile의 카운터 업데이트 (트랜잭션 or 이벤트)
- 추천 시그널: EventEmitter 패턴 참조

## Acceptance Criteria
- [ ] `POST /follows` 에 targetUserId 전송 시 팔로우 생성되고 followStatus + 카운터 반환
- [ ] 자기 자신 팔로우 시도 시 400 응답
- [ ] 이미 팔로우 중인 유저에 재팔로우 시도 시 멱등하게 현재 상태 반환
- [ ] `DELETE /follows` 에 targetUserId 전송 시 팔로우 해제되고 업데이트된 상태 반환
- [ ] `GET /follows/me/followers` 호출 시 닉네임 가나다순으로 팔로워 목록 반환
- [ ] `GET /follows/me/followings` 호출 시 닉네임 가나다순으로 팔로잉 목록 반환
- [ ] 각 팔로워/팔로잉 항목에 followStatus가 포함된다 (mutual 여부 판단 가능)
- [ ] 팔로워/팔로잉 목록이 cursor pagination을 지원한다
- [ ] `GET /follows/status/{targetUserId}` 호출 시 정확한 followStatus 반환
- [ ] 팔로우/언팔로우 시 UserProfile의 followerCount/followingCount가 정확히 업데이트된다
- [ ] 팔로우 발생 시 추천 시스템에 전달할 시그널이 발행된다
