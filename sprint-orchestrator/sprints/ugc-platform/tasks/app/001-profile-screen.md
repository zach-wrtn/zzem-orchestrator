# APP-001: Profile Screen

## Target
- **User Story**: US2 (프로필)
- **Acceptance Criteria**: AC 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
- **API Dependency**: BE-001 (User Profile API)

## Context
MY 탭에서 진입하는 프로필 화면. 3탭 구조(게시물/비공개/좋아요), 프로필 편집, 팔로워/팔로잉 리스트. 타 유저 프로필은 APP-006에서 구현.

## Objective
프로필 화면 및 관련 서브 화면 구현.

## Specification

### Screens / Components

#### ProfileScreen
- 프로필 헤더: 프로필 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트
- 팔로워/팔로잉 카운트 탭 → 각 리스트 화면 이동
- "프로필 편집" 버튼 → ProfileEditScreen
- "프로필 공유" 버튼 → OS 공유 시트 (딥링크 URL)
- 3탭 구조:
  - **게시물 탭**: 공개 콘텐츠 그리드 (최신순)
  - **비공개 탭**: 비공개 콘텐츠 그리드 (최신순, 본인만)
  - **좋아요 탭**: 좋아요한 콘텐츠 그리드 (좋아요 시점 최신순)
- 디폴트 탭: 최근 콘텐츠 기준 결정
- 그리드 아이템 탭 → 세로 스와이프 피드 진입 (해당 탭 콘텐츠만)

#### ProfileEditScreen
- 프로필 이미지 변경 (이미지 피커)
- 닉네임 수정 (제한 없음)
- "닉네임 랜덤 생성" 버튼 → `POST /profiles/me/nickname/generate`
- 저장 → `PATCH /profiles/me`

#### FollowerListScreen
- 팔로워 리스트 (가나다순)
- 각 유저: 프로필 이미지, 닉네임, 팔로우 상태 버튼
- cursor pagination (무한 스크롤)

#### FollowingListScreen
- 팔로잉 리스트 (가나다순)
- 각 유저: 프로필 이미지, 닉네임, 팔로우 상태 버튼
- cursor pagination (무한 스크롤)

### Data Flow
- `GET /profiles/me` → React Query `useQuery`
- `GET /profiles/me/contents?visibility=public|private` → React Query infinite query
- `GET /profiles/me/favorites` → React Query infinite query
- `PATCH /profiles/me` → React Query `useMutation` + invalidate profile
- 프로필 공유: `POST /profiles/me/share` → OS Share API

### Implementation Hints
- Clean Architecture: domain entity → data repository → presentation ViewModel
- React Query for server state
- React Navigation tab navigator for 3-tab
- `@wrtn/app-design-guide` 컴포넌트 활용
- Zod entity validation

## Acceptance Criteria

### AC 2.1: 프로필 진입점
- MY 탭 → ProfileScreen 이동
- 최근 콘텐츠 기준 디폴트 탭 결정

### AC 2.2: 프로필 구조 및 탭
- 프로필 이미지, 닉네임, 3개 카운트 노출
- 3탭 구조 올바르게 표시
- 각 탭 콘텐츠 그리드 정렬 올바름

### AC 2.3: 프로필 공유
- "프로필 공유" → OS 공유 시트 호출
- 딥링크 URL 포함

### AC 2.4: 프로필 설정
- ProfileEditScreen에서 이미지/닉네임 수정 가능
- 저장 후 ProfileScreen 즉시 반영

### AC 2.5: 세로 스와이프 진입
- 그리드 콘텐츠 탭 → 세로 스와이프 피드 진입
- 해당 탭 콘텐츠만 노출

### AC 2.6: 닉네임 자동 생성
- "랜덤 생성" 버튼 → 닉네임 자동 채움
- 최초 앱 진입 시 자동 생성된 닉네임 표시
