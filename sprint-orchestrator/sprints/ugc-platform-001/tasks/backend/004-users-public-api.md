# be-004 · /v2/users/:userId/* — 타 유저 공개 프로필 & 콘텐츠

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: be-001 (스키마), be-002 (UserProfile 구조)

## Target

`backend/apps/meme-api/src/controller/users/` (신규) 및 관련 application/domain.

## Context

AC 7.1은 세로 스와이프 피드의 프로필 영역이나 향후 팔로워/팔로잉 리스트에서 타 유저 프로필로 이동하는 동선을 요구한다. 타 유저의 프로필은 공개 투영(public projection)만 노출하며, 비공개 탭·좋아요 탭·persona 플래그는 응답에 포함하지 않는다.

## Objective

타 유저의 공개 프로필 정보와 공개 콘텐츠 목록을 제공한다.

## Specification

### Endpoints (api-contract.yaml SSOT)
- `GET /v2/users/:userId/profile` → `PublicProfileResponse`
- `GET /v2/users/:userId/contents?cursor&limit` → `ContentListResponse`

### Behavior
- Profile 응답은 `PublicProfileResponse` 스키마. `isPersona` 필드 부재. bio/link는 본인 응답과 동일하게 노출.
- 존재하지 않는 `userId`에 대해 `GET profile`은 404.
- Contents 응답은 해당 유저의 `isPublished=true` + 미삭제 콘텐츠만. 정렬 `createdAt desc`. 커서는 be-003과 동일 convention.
- 인증은 필요(LibUserGuard). 비회원은 로그인 랜딩 → FE 레이어에서 처리되며 BE는 여전히 401 반환.

### KB Contract Clauses
- correctness-001 (critical): Controller passthrough.
- correctness-002 (critical): getter 금지.
- integration-001 (critical): 필드명 api-contract.yaml 준수.

### Tests
- 단위: public projection 매핑이 `isPersona`를 drop하는지 검증.
- E2E: A가 B의 프로필 조회 → `isPersona` 필드 부재 + bio/link 노출. A가 B의 contents 조회 → B의 비공개 콘텐츠가 노출되지 않음.

## Acceptance Criteria

- [ ] `GET /v2/users/:userId/profile`이 해당 유저 UserProfile을 공개 투영으로 반환. `isPersona` 필드가 응답에 존재하지 않음.
- [ ] 존재하지 않는 userId → 404.
- [ ] `GET /v2/users/:userId/contents`가 해당 유저의 `isPublished=true`만 반환하며 비공개 미노출.
- [ ] 커서 페이지네이션 동작 (limit/nextCursor 검증).
- [ ] Controller에 CursorResponseDto 재래핑 없음.
- [ ] E2E + 단위 테스트 통과.

## Implementation Hints

- 참조: be-002의 UserProfile 구조 및 DTO. public projection 전용 DTO 분리 권장(응답 명세 단순화 목적).
- 참조: be-003의 list 엔드포인트 패턴. 필터 조건만 달라짐.
- LibUserGuard는 path param `userId`와 무관하게 호출자(wrtn-user-id)로만 인증. 본인=호출자 여부는 본 엔드포인트에서 판단 불요.
