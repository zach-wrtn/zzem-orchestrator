# Sprint Contract: Group 001 — Navigation + Profile Core

## Scope
- **Tasks**: backend/001-profile-api, backend/002-content-visibility, app/001-tab-navigation, app/002-profile-screen
- **Endpoints**: 
  - `GET /api/v1/user-profile/me`
  - `PATCH /api/v1/user-profile/me`
  - `GET /api/v1/user-profile/:profileId`
  - `GET /api/v1/user-profile/share/:profileId`
  - `GET /api/v1/content/user/:profileId`
  - `PATCH /api/v1/content/:contentId/publish`

## Done Criteria

### Backend
- [ ] `GET /api/v1/user-profile/me` 호출 시 `MyProfileResponse` 스키마(id, name, profileImageUrl, followerCount, followingCount, regeneratedCount, isPersona, hasPublicContent, hasPrivateContent) 반환
- [ ] `followerCount`와 `followingCount`는 항상 0 반환
- [ ] `regeneratedCount`는 해당 유저의 공개 콘텐츠 재생성 총 횟수 반환
- [ ] `PATCH /api/v1/user-profile/me`로 닉네임 변경 시 1자 → 400, 21자 → 400, 2자/20자 → 200
- [ ] `GET /api/v1/user-profile/:profileId` 미존재 ID → 404
- [ ] Content 스키마에 `isPublished` 필드 `default: false` 추가
- [ ] 기존 콘텐츠(`isPublished` 필드 미존재)는 `visibility=private` 조회 시 포함
- [ ] `GET /api/v1/content/user/:profileId?visibility=public` → `isPublished=true` && `status=COMPLETED` 콘텐츠만 반환
- [ ] `GET /api/v1/content/user/:profileId?visibility=private` + 타 유저 → 빈 목록 반환 (403 아님)
- [ ] 커서 페이지네이션 `nextCursor` + `hasNext` 정확성
- [ ] `PATCH /api/v1/content/:contentId/publish` 타인 콘텐츠 → 403
- [ ] 모든 인증 필요 API에 `LibUserGuard` 적용

### App
- [ ] 하단 3탭(홈/탐색/MY) 탭바 렌더링 + 탭 간 이동
- [ ] 탭 간 이동 시 각 탭의 스크롤 상태 유지
- [ ] 비회원 MY 탭 탭 시 로그인 화면 이동
- [ ] 프로필 헤더: 프로필 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트 노출
- [ ] 프로필 이미지 미설정 시 디폴트 아바타 노출
- [ ] 3개 탭(게시물/비공개/좋아요) 렌더링 + 탭 전환
- [ ] 디폴트 탭: hasPublicContent=true → 게시물, false && hasPrivateContent=true → 비공개, 둘 다 false → 게시물
- [ ] 좋아요 탭 빈 껍데기 ("준비 중" 또는 빈 상태)
- [ ] 콘텐츠 그리드에서 아이템 탭 → SwipeFeedScreen 진입 (해당 탭 콘텐츠 파라미터 전달)
- [ ] 숫자 포맷: 999→"999", 8600→"8.6천", 12500→"1.2만"

## Verification Method
- **Backend**: Evaluator가 각 endpoint를 코드에서 logic tracing하여 request→service→repository 흐름 검증. 특히 `isPublished` 쿼리 조건(`{ $ne: true }` vs `{ isPublished: true }`)의 정확성 검증.
- **App**: Evaluator가 Clean Architecture 레이어 경계(domain에서 React/axios import 금지), Zod entity parse, 네비게이션 파라미터 전달을 코드 추적으로 검증.
- **Edge Cases**: 콘텐츠 0건 프로필, 닉네임 경계값(2자/20자), 타 유저 private 조회
