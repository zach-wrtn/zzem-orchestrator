# be-002 · /v2/me/profile (조회·수정·자동 닉네임·persona)

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: —

## Target

`backend/apps/meme-api/src/` — controller/application/domain/persistence 네 레이어 전반.

## Context

Phase 1의 핵심 엔드포인트. MY 탭 진입 시 최초 호출되며 없던 유저의 `UserProfile` 문서를 지연 생성(lazy bootstrap)해야 한다. 기존 `domain/user-profile/` 코드가 존재하고 admin 경로로 CRUD가 구현되어 있으나 일반 유저 경로(controller)는 비어 있다. `USER_PROFILE_TYPE.INTERNAL` 값이 이미 존재하므로 AC 7.5의 persona 플래그는 해당 type으로 매핑할 수 있다.

레포 CLAUDE.md 필수 스킬 준수: `nestjs-architecture`, `backend-ground-rule`, `mongodb-mongoose`, `testing-patterns`.

## Objective

유저가 본인 프로필을 조회·수정하는 엔드포인트를 제공하고, 신규 유저 최초 진입 시 자동으로 닉네임이 생성되어 프로필이 만들어지도록 한다.

## Specification

### Endpoints (api-contract.yaml SSOT)
- `GET /v2/me/profile` → `MyProfileResponse` (`api-contract.yaml#/components/schemas/MyProfileResponse`)
- `PATCH /v2/me/profile` with `UpdateProfileRequest` → `MyProfileResponse`

### Behavior
- `GET` 진입 시 해당 `userId`의 `UserProfile` 문서가 없으면 서버가 생성:
  - `nickname`: adjective(형용사) + animal(동물) + 4자리 숫자. 사전 검수된 단어 목록에서 무작위 선택 (PRD AC 2.6).
  - `profileImageUrl`: 서버가 제공하는 기본 회색 아바타 URL (PRD 비즈니스 룰 §2).
  - `type`: `USER_PROFILE_TYPE.USER` (기본값).
  - 생성 과정은 동일 `userId`에 대해 **멱등** 해야 한다(경쟁 요청 시 unique index로 2중 생성 방지).
- `PATCH` 규칙:
  - `nickname`: 2~20자 validator, 글자수 검증 실패 시 400.
  - `profileImageFileUuid`: 이미 업로드된 파일 uuid. `FileAppService` 기존 presigned URL 흐름을 통과한 값만 허용(존재성 검증). 검증 실패 400.
  - `bio`, `link`: 선택 필드. 500자 제한.
  - 모든 필드는 선택. 빈 바디 요청 시 200 + 현재 프로필 반환(no-op).
- `MyProfileResponse.isPersona`: 해당 `UserProfile.type === INTERNAL` 인 경우 `true`.
- `followerCount`, `followingCount`: Phase 1에서는 **항상 0** 반환 (팔로우는 Phase 3). 응답 스키마에 필드는 존재.
- `regeneratedCount`: 본인의 `isPublished=true` 콘텐츠가 타 유저에 의해 재생성된 횟수 합산. 재생성 추적 인프라가 없으면 0 반환하되 TODO 주석으로 후속 Phase 연결 지점 명시.

### KB Contract Clauses
- correctness-002 (critical): 응답 DTO의 모든 필드는 일반 property + `@ApiProperty()`. getter 금지.
- integration-001 (critical): 응답 필드명이 api-contract.yaml과 **정확히** 일치. 특히 `profileImageUrl`, `isPersona`, `regeneratedCount` camelCase 유지.

### Unit/E2E Tests
- Domain Service 행위 테스트: 닉네임 생성 포맷 검증 (형용사+동물+4숫자 정규식), `type=INTERNAL` 시 `isPersona=true`.
- E2E 테스트: `@testcontainers/mongodb` 기반. GET-then-PATCH 시나리오 1개, nickname 길이 오류 400 시나리오 1개.

## Acceptance Criteria

- [ ] `GET /v2/me/profile`가 존재하지 않는 유저 최초 호출 시 UserProfile을 생성하고 200을 반환.
- [ ] 자동 닉네임이 `/^[가-힣]+[가-힣]+\d{4}$/` 포맷에 부합 (길이·구성 regex 테스트).
- [ ] `PATCH`로 `nickname="a"` (1자) 전송 시 400.
- [ ] `PATCH`로 `nickname="가".repeat(21)` 전송 시 400.
- [ ] 응답 DTO의 필드명이 api-contract.yaml과 1:1 일치.
- [ ] 응답 DTO에 `get` 키워드 getter 부재 (코드 정적 검사).
- [ ] Domain Service 단위 테스트 통과. E2E 테스트 통과.
- [ ] `type=INTERNAL`인 유저의 응답에서 `isPersona=true`, `type=USER`에서 `isPersona=false`.

## Implementation Hints

- 참조 패턴: `backend/apps/meme-api/src/controller/user/user.controller.ts` (guard/decorator), `content.controller.ts` (DTO 스타일).
- 기존 도메인: `backend/apps/meme-api/src/domain/user-profile/user-profile-domain.service.ts` 재사용/확장 가능.
- 파일 업로드: `backend/apps/meme-api/src/application/file/file-app.service.ts` — fileUuid 존재 확인.
- 단어 목록(형용사/동물)은 in-source 상수로 두되 200개 이상 권장. 불쾌 단어 필터는 리뷰어 판단.
