# BE-001: User Profile API

## Target
- **User Story**: US2 (프로필)
- **Acceptance Criteria**: AC 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
- **API Contract**: `api-contract.yaml` — Profile section

## Context
유저 프로필 CRUD. 기존 인증 시스템의 유저 정보 위에 프로필 레이어(닉네임, 프로필 이미지, 카운트)를 구축한다. 최초 진입 시 닉네임 자동 생성, 프로필 공유 딥링크 생성 포함.

## Objective
- `GET /profiles/me` — 내 프로필 조회 (팔로워/팔로잉/재생성 카운트 포함)
- `PATCH /profiles/me` — 닉네임/프로필 이미지 수정 (변경 제한 없음)
- `GET /profiles/:userId` — 타 유저 프로필 조회 (followStatus, isBlocked 포함)
- `POST /profiles/me/nickname/generate` — 랜덤 닉네임 생성
- `POST /profiles/me/share` — 프로필 딥링크 URL 생성

## Specification

### Data Model
- **UserProfile** collection (MongoDB)
  - `userId` (string, indexed, unique) — 인증 시스템 userId 참조
  - `nickname` (string, max 20자)
  - `profileImageUrl` (string, nullable)
  - `isPersona` (boolean, default false) — 페르소나 계정 식별 플래그
  - `paybackInfoSeen` (boolean, default false) — 페이백 안내 모달 확인 여부
  - `createdAt`, `updatedAt` (Date)

### Nickname Auto-Generation
- 최초 프로필 생성 시 `형용사 + 명사 + 4자리 랜덤숫자` 포맷으로 자동 생성
- 중복 체크 후 유니크 보장

### Profile Counts
- `followerCount`: Follow collection aggregation
- `followingCount`: Follow collection aggregation
- `regeneratedCount`: 내 공개 콘텐츠가 타 유저에 의해 재생성된 횟수 (Content regeneration 기록에서 집계)

### Implementation Hints
- NestJS 4-layer: Controller → Application → Domain → Persistence
- `LibUserGuard` for authentication
- Mongoose schema with `@Schema()` decorator
- 프로필 공유: 딥링크 URL 생성 (OG Image 미포함)

## Acceptance Criteria

### AC 2.1: 프로필 진입점
- `GET /profiles/me` 응답에 모든 프로필 필드 + 카운트 포함
- 인증되지 않은 요청 시 401

### AC 2.2: 프로필 구조 및 탭
- 프로필 응답에 `followerCount`, `followingCount`, `regeneratedCount` 포함
- 각 카운트는 실시간 정확도 (캐시 허용하되 1분 이내 갱신)

### AC 2.3: 프로필 공유
- `POST /profiles/me/share` → 딥링크 URL 반환
- URL 포맷: 기존 딥링크 시스템 활용

### AC 2.4: 프로필 설정
- `PATCH /profiles/me` — nickname, profileImageUrl 수정
- 닉네임 변경 제한 없음 (7일 제한 삭제됨)
- 닉네임 빈 문자열/공백만 불가

### AC 2.5: 세로 스와이프 진입
- 콘텐츠 조회 API가 visibility 필터 지원 (BE-002에서 구현)

### AC 2.6: 닉네임 자동 생성
- `POST /profiles/me/nickname/generate` → 랜덤 닉네임 반환
- 최초 프로필 생성 시 자동 호출되어 닉네임 설정
