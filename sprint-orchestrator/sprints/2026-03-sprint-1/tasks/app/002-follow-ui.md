# Task: 002-follow-ui

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US6 팔로우 (AC 6.1, AC 6.2), 비즈니스 룰 - 팔로우 규칙
- API Contract Reference:
  - POST /follows/{targetUserId} (followUser)
  - DELETE /follows/{targetUserId} (unfollowUser)
  - GET /profiles/{userId}/followers (getFollowers)
  - GET /profiles/{userId}/followings (getFollowings)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: app/001-profile-screen (프로필 화면 필요)
- Parallel With: backend/002-follow-api, app/002-payback-bottomsheet

## Objective
타 유저 프로필에서 팔로우/언팔로우 기능을 제공하고, 내 프로필에서 팔로워/팔로잉 리스트를 조회할 수 있도록 한다. 팔로우 상태는 팔로우/팔로잉/맞팔로우 3가지로 구분하여 표시한다.

## Specification

### Design Tokens
- **FollowButton (none/팔로우)**: bg #8752FA, text white, height 32, borderRadius 16, paddingH 16
- **FollowButton (following/팔로잉)**: bg transparent, border 1px #E0E0E0, text #262626
- **FollowButton (mutual/맞팔로우)**: bg transparent, border 1px #8752FA, text #8752FA
- **FollowUserItem**: height 56, profileImage 40×40 circle, gap 12

### Screens / Components
- `FollowButton` — 팔로우/언팔로우 토글 버튼 (상태: 팔로우/팔로잉/맞팔로우)
- `FollowerListScreen` — 팔로워 목록 화면 (본인 프로필에서만 접근)
- `FollowingListScreen` — 팔로잉 목록 화면 (본인 프로필에서만 접근)
- `FollowUserItem` — 팔로워/팔로잉 리스트 내 유저 항목 (프로필 이미지, 닉네임, 팔로우 상태 버튼)

### User Interactions
1. 타 유저 프로필에서 FollowButton 노출 (followStatus에 따라 텍스트 분기)
   - none → "팔로우" 표시, 탭 시 POST /follows/{targetUserId}
   - following → "팔로잉" 표시, 탭 시 DELETE /follows/{targetUserId}
   - mutual → "맞팔로우" 표시, 탭 시 DELETE /follows/{targetUserId}
2. 내 프로필 헤더에서 팔로워 카운트 탭 → FollowerListScreen 진입
3. 내 프로필 헤더에서 팔로잉 카운트 탭 → FollowingListScreen 진입
4. 타 유저 프로필에서 팔로워/팔로잉 카운트는 숫자만 노출 (탭 불가, 리스트 조회 불가)
5. 팔로워/팔로잉 리스트에서 각 유저의 FollowButton으로 팔로우/언팔로우 가능
6. 리스트 내 유저 프로필 이미지/닉네임 탭 → 해당 유저 프로필 화면 진입

### Business Rules
1. 팔로우 상태 3가지: none(미팔로우), following(팔로잉), mutual(맞팔로우)
2. 팔로워/팔로잉 리스트는 본인 프로필에서만 조회 가능 (403 핸들링)
3. 리스트는 가나다순(알파벳순) 정렬
4. 팔로우한 사람의 콘텐츠는 피드 추천에 부스트 반영 (서버 측 로직, 클라이언트 처리 없음)
5. 커서 기반 페이지네이션으로 리스트 로드
6. 프로필 스택 정책: push 허용 (인스타그램 패턴). 리스트 내 유저 프로필 → 팔로워 리스트 → 또 다른 프로필 무한 push 가능. React Navigation 기본 동작 유지.

## Interaction States

### FollowButton
- **Loading**: 낙관적 업데이트 적용 (즉시 상태 전환, 실패 시 롤백)
- **Error**: 토스트 "팔로우 변경에 실패했어요" + 이전 상태 복원

### FollowerListScreen / FollowingListScreen
- **Loading**: 리스트 스켈레톤 (프로필 이미지 원형 + 닉네임 placeholder × 6행)
- **Empty (팔로워)**: "아직 팔로워가 없어요" + "콘텐츠를 공개하면 팔로워가 늘어나요"
- **Empty (팔로잉)**: "아직 팔로잉한 유저가 없어요" + [피드 탐색하기] primary CTA
- **Error**: 풀스크린 에러 뷰 + "다시 시도" 버튼
- **403 (타 유저 리스트 접근)**: 발생 불가 (UI에서 진입점 미노출)

## Implementation Hints
- 기존 패턴 참조: swipe-feed의 유저 인터랙션 패턴, like/favorite 토글의 낙관적 업데이트 패턴
- Domain: Follow 엔티티, useFollowUser / useUnfollowUser mutation 훅, useGetFollowers / useGetFollowings 쿼리 훅, FollowRepository 인터페이스
- Data: FollowDto namespace, FollowMapper, followRepositoryImpl, followQueryKeys
- Presentation: FollowButton, FollowerListScreen, FollowingListScreen, useFollowViewModel
- FollowButton은 ProfileScreen, FollowerListScreen, FollowingListScreen에서 재사용
- 낙관적 업데이트: 팔로우/언팔로우 시 즉시 UI 반영 후 서버 응답으로 보정
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] 타 유저 프로필에 팔로우 버튼이 올바른 상태로 표시된다
- [ ] 팔로우 탭 시 POST API 호출 후 상태가 갱신된다
- [ ] 언팔로우 탭 시 DELETE API 호출 후 상태가 갱신된다
- [ ] 맞팔로우 상태가 올바르게 표시된다
- [ ] 내 프로필에서 팔로워/팔로잉 카운트 탭 시 리스트 화면으로 이동한다
- [ ] 타 유저 프로필에서 팔로워/팔로잉 카운트 탭이 불가능하다
- [ ] 팔로워/팔로잉 리스트가 가나다순으로 정렬된다
- [ ] 리스트 내 각 유저에 팔로우 상태 버튼이 동작한다
- [ ] 커서 기반 페이지네이션이 정상 동작한다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
