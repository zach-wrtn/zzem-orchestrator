# app-006 · 타 유저 프로필 화면

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: app-001 (딥링크 `zzem://profile/:userId`), be-004 (/users/:userId/*)

## Target

`app/apps/MemeApp/src/presentation/profile/other/` (신규).

## Context

AC 7.1: 세로 스와이프 피드 프로필 영역 또는 팔로워/팔로잉 리스트에서 유저 탭 → 타유저 프로필 진입. 타유저 프로필에는 **게시물(공개) 탭만** 노출(비공개/좋아요 탭 미노출). 더보기 메뉴는 "프로필 URL 복사"만 (차단/신고는 PRD 3).

## Objective

타 유저의 공개 프로필 정보와 공개 콘텐츠 그리드를 렌더링하는 화면을 제공한다.

## Specification

### Screens / Components
- **OtherUserProfileScreen** (신규):
  - 헤더: 좌측 back + 우측 더보기(…). 더보기 ActionSheet: "프로필 URL 복사".
  - 프로필 정보: 이미지/닉네임/팔로워·팔로잉·재생성된 카운트.
  - 탭: **게시물(공개) 단일 탭**. (구조는 app-003의 TabBar 재사용하되 항목 1개.)
  - 탭 콘텐츠: 공개 콘텐츠 그리드. 탭 시 app-008의 타유저 피드 진입.

### Behavior
- 딥링크 `zzem://profile/:userId`로 진입. 내부 네비 `navigation.navigate('OtherUserProfile', { userId })`.
- 데이터 소스: `GET /v2/users/{userId}/profile`, `GET /v2/users/{userId}/contents`.
- 프로필 URL 복사: `zzem://profile/{userId}` 문자열을 Clipboard에 복사. 기존 Clipboard 유틸 재사용.
- 존재하지 않는 userId(404) → 에러 상태 컴포넌트.

### KB Contract Clauses
- completeness-001 (critical): 진입점은 app-008/app-007 및 향후 팔로워 리스트가 담당. 본 태스크의 책임은 딥링크 경로 + 스크린 자체 존재.
- completeness-003 (major, freq 1): `userId` route param이 딥링크/navigate 호출 모두에서 동일하게 전달되는지.
- integration-001 (critical): `PublicProfileResponse` 필드를 FE 타입에서 동일 이름으로 사용.

### Tests
- Maestro flow 신규: `other-user-profile.yaml`
  - e2e seed로 받은 공개 콘텐츠 보유 userId를 deeplink에 전달.
  - 프로필 정보 + 공개 탭 + 그리드 아이템 `assertVisible`.

## Acceptance Criteria

- [ ] `zzem://profile/{userId}` 딥링크가 OtherUserProfileScreen으로 랜딩.
- [ ] 게시물 탭만 노출(비공개/좋아요 미노출).
- [ ] 더보기 메뉴 "프로필 URL 복사"가 Clipboard에 `zzem://profile/{userId}` 저장.
- [ ] 공개 콘텐츠 그리드가 cursor 페이지네이션으로 로드.
- [ ] 존재하지 않는 userId → 에러 화면.
- [ ] Maestro `other-user-profile.yaml` 통과.

## Implementation Hints

- 참조: app-003의 프로필 헤더/카운트 컴포넌트 — 공통 `ProfileHeader` sub-component로 분리 고려(본인/타인 양쪽에서 재사용).
- 차단/신고 menu 항목은 본 Phase 금지 (PRD 3 소관).
