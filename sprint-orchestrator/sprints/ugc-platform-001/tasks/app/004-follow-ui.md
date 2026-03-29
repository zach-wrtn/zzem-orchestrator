# Task: 004-follow-ui

## Target
app-core-packages/apps/MemeApp

## Context
- PRD US6: 팔로우 (AC 6.1~6.3)
- 팔로우 버튼: 프로필, 팔로워/팔로잉 리스트에서 노출
- 팔로워/팔로잉 리스트: 내 프로필에서만 조회 가능
- API Contract: POST /follows, DELETE /follows, GET /follows/me/followers, GET /follows/me/followings

## Objective
팔로우/언팔로우 버튼, 팔로워/팔로잉 목록 화면, 프로필 카운터 연동을 구현한다.

## Specification

### Screens / Components
- **FollowButton**: 팔로우 상태별 버튼
  - none → "팔로우" (primary)
  - following → "팔로잉" (secondary)
  - mutual → "맞팔로우" (secondary)
- **FollowerListScreen**: 팔로워 목록 (가나다순)
  - 각 항목: 프로필 이미지, 닉네임, FollowButton
  - 프로필 탭 시 해당 유저 프로필로 ���동
- **FollowingListScreen**: 팔로잉 목록 (가나다순)
  - 동일 구조
- **ProfileScreen 연동**: 팔로워/팔로잉 카운트 탭 시 각 목록 화면으로 이동
- **타유저 프로필**: 팔로워/팔로잉 숫자만 표시 (탭 비활성)

### Data Flow
- Domain: `useFollowUserUseCase()`, `useUnfollowUserUseCase()`, `useGetFollowersUseCase()`, `useGetFollowingsUseCase()`
- Data: FollowRepository, followQueryKey
- Optimistic update: 팔로우 토글 시 즉시 UI 반영

### Implementation Hints
- FollowButton을 재사용 가능한 컴포넌트로 설계 (프로필, 리스트, 타유저 프로필 등에서 사용)
- 팔로워/팔로잉 리스트는 새 화면 (RootStackParamList에 추가)

## Acceptance Criteria
- [ ] 타유저 프로필에서 FollowButton이 현재 팔로우 상태에 맞게 표시된다
- [ ] FollowButton 탭 시 팔로우/언팔로우가 즉시 반영된다 (optimistic)
- [ ] 프로필의 팔로워 카운트 탭 시 FollowerListScreen으로 이동한다
- [ ] 프로필의 팔로잉 카운트 탭 시 FollowingListScreen으로 이동한다
- [ ] 팔로워/팔로잉 목록이 가나다순으로 표시되며 각 항목에 FollowButton이 있다
- [ ] 팔로워/팔로잉 목록에서 유저 탭 시 해당 유저 프로필로 이동한다
- [ ] 타유저 프로필에서는 팔로워/팔로잉 숫자만 보이고 리스트 진입 불가
- [ ] 팔로우/언팔로우 후 프로필 카운터가 갱신된다
- [ ] 맞팔로우 상태가 정확하게 표시된다 (mutual)
