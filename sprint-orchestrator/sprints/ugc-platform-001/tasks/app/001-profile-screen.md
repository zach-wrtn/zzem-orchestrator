# Task: 001-profile-screen

## Target
app-core-packages/apps/MemeApp

## Context
- PRD US2: 프로필 (AC 2.1~2.6)
- 기존 MemeCollection 화면이 "내 콘텐츠" 역할 → 프로필 화면으로 교체/확장
- 기존 Home 헤더의 MY 버튼이 MemeCollection으로 이동 → Profile로 변경
- API Contract: GET /profiles/me, PATCH /profiles/me, GET /profiles/me/share-url

## Objective
프로필 화면을 구현한다. 3탭 구조 (게시물/비공개/좋아요), 프로필 편집, 프로필 공유 기능을 포함한다.

## Specification

### Screens / Components
- **ProfileScreen**: 프로필 메인 화면
  - 헤더: 프로필 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트
  - 3탭: 게시물(공개) | 비공개 | 좋아요
  - 각 탭은 그리드 레이아웃 (기존 MemeCollection 그리드 패턴 재사용)
  - 프로필 편집 버튼, 프로필 공유 버튼
- **ProfileEditSheet**: 프로필 편집 (닉네임, 이미지 변경)
- **Navigation 변경**: MY 버튼 → ProfileScreen으로 라우팅

### Data Flow
- Domain: `useGetMyProfileUseCase()`, `useUpdateProfileUseCase()`
- Data: ProfileRepository, profileQueryKey
- 프로필 탭 콘텐츠: `GET /contents/me?tab={published|private|liked}` (Group 002에서 구현)
  - Group 001에서는 프로필 헤더 + 탭 구조만 구현
  - 탭 콘텐츠는 기존 MemeCollection 데이터를 임시 연결하거나 빈 상태로 둠

### Business Rules
- 게시물 탭: 공개 콘텐츠만 (최신순)
- 비공개 탭: 비공개 콘텐츠 (최신순), 본인만 보임
- 좋아요 탭: 좋아요 누른 시점 최신순
- 프로필 공유: OS 기본 공유 시트 호출, 딥링크 포함
- 프로필에서 콘텐츠 탭 시 세로 스와이프 진입 (해당 탭 콘텐츠만)

### Implementation Hints
- 기존 `Tabs<T>` 컴포넌트 재사용 (presentation/meme/meme-collection)
- Clean Architecture: domain/ → data/ → presentation/ 경계 준수
- 기존 `useAuthGuardUseCase()` 활용

## Acceptance Criteria
- [ ] MY 버튼 탭 시 ProfileScreen으로 이동한다
- [ ] ProfileScreen 진입 시 프로필 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트가 표시된다
- [ ] 3개 탭(게시물/비공개/좋아요)이 표시되며 탭 전환이 동작한다
- [ ] 프로필 편집 버튼 탭 시 닉네임/이미지 수정 UI가 표시된다
- [ ] 닉네임 변경 후 저장 시 프로필에 즉시 반영된다
- [ ] 프로필 공유 버튼 탭 시 OS 공유 시트가 딥링크 URL과 함께 표시된다
- [ ] 비로그인 유저가 MY 버튼 탭 시 로그인 화면으로 이동한다
- [ ] ProfileScreen이 RootStackParamList에 등록되어 네비게이션이 동작한다
