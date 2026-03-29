# Task: 001-profile-api

## Target
wrtn-backend/apps/meme-api

## Context
- PRD US2: 프로필 관리 (AC 2.1~2.6)
- PRD US7 AC 7.5: 페르소나 계정 식별 플래그
- 기존 UserProfile 도메인 존재, 확장 필요
- 닉네임 자동 생성 규칙 신규

## Objective
유저 프로필 CRUD API를 구현한다. 내 프로필 조회/편집, 타유저 프로필 조회, 프로필 공유 URL 생성, 닉네임 자동 생성을 포함한다.

## Specification

### Endpoints (api-contract.yaml 참조)
- `GET /profiles/me` — 내 프로필 조회 (LibUserGuard)
- `PATCH /profiles/me` — 프로필 편집 (LibUserGuard)
- `GET /profiles/{userId}` — 타유저 프로필 조회 (OptionalUserGuard)
- `GET /profiles/me/share-url` — 프로필 공유 딥링크 URL (LibUserGuard)

### Data Model
- UserProfile 엔티티 확장: nickname, profileImageUrl, followerCount, followingCount, regeneratedCount, isPersona
- 닉네임 자동 생성: 최초 프로필 생성 시 시스템이 고유 닉네임 부여

### Business Rules
- 닉네임: min 1자 (trim 후), max 20자, 변경 제한 없음
- 빈 닉네임 → 400 Bad Request
- isPersona 필드: 계정 레벨 페르소나 여부 식별
- 타유저 프로필: 공개 게시물 카운트만 포함, followStatus/isBlocked 포함
- 프로필 공유 URL: OG Image 미포함, 단순 딥링크

### Implementation Hints
- 기존 UserProfile 도메인/persistence 패턴 참조
- 기존 `ApiVersion({ path: "profiles" })` 패턴 사용
- `@DUser("userId")` 데코레이터로 유저 식별

## Acceptance Criteria
- [ ] `GET /profiles/me` 호출 시 nickname, profileImageUrl, followerCount, followingCount, regeneratedCount, isPersona 필드가 반환된다
- [ ] 프로필이 없는 유저가 `GET /profiles/me` 최초 호출 시 자동 닉네임이 생성되어 반환된다
- [ ] 자동 생성된 닉네임은 고유하며 빈 문자열이 아니다
- [ ] `PATCH /profiles/me`에 nickname="" (trim 후 빈 문자열) 전송 시 400 응답
- [ ] `PATCH /profiles/me`에 nickname 21자 전송 시 400 응답
- [ ] `PATCH /profiles/me`에 유효한 nickname 전송 시 200 + 변경된 프로필 반환
- [ ] `GET /profiles/{userId}` 호출 시 followStatus, isBlocked 필드가 포함된다
- [ ] `GET /profiles/{userId}`에 존재하지 않는 userId 전송 시 404 응답
- [ ] `GET /profiles/me/share-url` 호출 시 딥링크 형태의 shareUrl이 반환된다
- [ ] 인증 없이 `GET /profiles/me` 호출 시 401 응답
