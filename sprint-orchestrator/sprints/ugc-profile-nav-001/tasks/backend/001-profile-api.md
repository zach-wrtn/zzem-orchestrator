# Task 001: 프로필 조회 · 수정 API

- **Group**: 1
- **AC**: 2.1, 2.2, 2.4, 7.1, 7.5

## Target

프로필 조회(내 프로필, 타 유저 프로필) 및 프로필 편집 API를 구현한다.

## Context

- 기존 `UserProfile` 스키마: `name`, `profileImageUrl`, `iconTagUrl`, `type` 필드 존재
- 기존 `UserProfileDomainService`: CRUD 메서드 존재
- 기존 `UserAppController`: `GET /api/v1/user` (SSO 기반 유저 정보 조회)만 존재
- 팔로워/팔로잉 카운트: PRD 1 단계에서는 항상 0 반환
- 재생성 횟수: Content 기반 집계 필요 (Task 002의 `isPublished` 필드 추가 후 가능)

## Objective

1. `GET /api/v1/user-profile/me` — 내 프로필 조회 (프로필 정보 + 카운트 + 디폴트 탭 결정용 hasPublicContent/hasPrivateContent)
2. `PATCH /api/v1/user-profile/me` — 프로필 편집 (닉네임 2~20자 검증, 프로필 이미지 URL)
3. `GET /api/v1/user-profile/:profileId` — 타 유저 프로필 조회
4. `GET /api/v1/user-profile/share/:profileId` — 프로필 공유 딥링크 생성

## Specification

### 내 프로필 응답 (`MyProfileResponse`)
- `id`, `name`, `profileImageUrl`
- `followerCount`: 0 (고정, PRD 3에서 구현)
- `followingCount`: 0 (고정, PRD 3에서 구현)
- `regeneratedCount`: 내 공개 콘텐츠의 재생성 총 횟수 (동일 유저 복수 재생성 각각 카운트)
- `isPersona`: `type === PERSONA` 여부
- `hasPublicContent`: 공개 콘텐츠 1건 이상 존재 여부
- `hasPrivateContent`: 비공개 콘텐츠 1건 이상 존재 여부

### 닉네임 검증
- 최소 2자, 최대 20자
- 빈 문자열, 공백만으로 구성된 문자열 거부

### 타 유저 프로필 응답 (`UserProfileResponse`)
- 내 프로필과 동일 구조, `hasPublicContent`/`hasPrivateContent` 미포함
- 프로필 미존재 시 404

### 프로필 공유
- profileId 기반 딥링크 URL 생성 (OG Image 미포함)

### 페르소나
- UserProfile 스키마에 페르소나 식별 가능한 `type` 필드 이미 존재 (`USER_PROFILE_TYPE`)
- `isPersona` 플래그로 응답에 노출

## Acceptance Criteria

1. `GET /api/v1/user-profile/me` 호출 시 인증된 유저의 프로필 정보가 `MyProfileResponse` 스키마로 반환된다
2. `followerCount`와 `followingCount`는 0을 반환한다
3. `regeneratedCount`는 해당 유저의 공개 콘텐츠 재생성 총 횟수를 반환한다
4. `hasPublicContent`는 `isPublished=true`인 완료 콘텐츠가 1건 이상이면 true를 반환한다
5. `hasPrivateContent`는 `isPublished=false`(또는 미설정)인 완료 콘텐츠가 1건 이상이면 true를 반환한다
6. `PATCH /api/v1/user-profile/me`로 닉네임 변경 시 2자 미만 또는 20자 초과이면 400을 반환한다
7. `GET /api/v1/user-profile/:profileId` 호출 시 해당 유저의 프로필을 `UserProfileResponse`로 반환한다
8. 존재하지 않는 profileId 조회 시 404를 반환한다
9. `isPersona`는 UserProfile의 type이 PERSONA일 때 true를 반환한다
10. `GET /api/v1/user-profile/share/:profileId` 호출 시 딥링크 URL을 반환한다

### Implementation Hints

- 기존 `UserProfileDomainService` 패턴 참조 (`wrtn-backend/apps/meme-api/src/domain/user-profile/`)
- 기존 `UserAppController` 패턴 참조 (`wrtn-backend/apps/meme-api/src/controller/user/`)
- `ApiVersion({ path: "user-profile" })` 패턴 사용
- `@ApiLibUserAuth()` + `LibUserGuard` 적용
