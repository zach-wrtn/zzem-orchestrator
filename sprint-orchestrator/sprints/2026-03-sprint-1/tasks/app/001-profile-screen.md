# Task: 001 - 프로필 화면 (3탭 구조)

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/presentation/profile/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US2 (프로필), AC 2.1~2.2, AC 2.5
- API Contract Reference: GET /profiles/me, GET /profiles/{userId}, GET /profiles/{userId}/contents
- Dependencies: backend/002 (프로필 API)
- Parallel With: backend/002

## Objective
프로필 화면을 구현한다. 프로필 이미지, 닉네임, 팔로워/팔로잉/재생성 카운트를 표시하고,
3개 탭(게시물/비공개/좋아요)으로 콘텐츠를 그리드로 노출한다.
탭 콘텐츠 탭 시 세로 스와이프 피드로 진입한다.

## Specification

### Input
- 내 프로필: MY 탭에서 진입
- 타인 프로필: 피드/검색에서 유저 프로필 탭

### Output
- 프로필 헤더: 이미지 + 닉네임 + 카운트 3개
- 3탭 그리드: 게시물(공개) / 비공개(본인만) / 좋아요
- 그리드 아이템 탭 → 세로 스와이프 진입

### Business Rules
1. 내 프로필: 3탭 모두 노출
2. 타인 프로필: 게시물 탭만 노출
3. 디폴트 랜딩 탭 = 최근 만든 콘텐츠 기준
4. 각 탭 콘텐츠 무한 스크롤 (커서 페이지네이션)
5. 콘텐츠 탭 → 세로 스와이프 진입 시 해당 탭 콘텐츠만 노출

## Implementation Hints
- 기존 패턴 참조: `src/presentation/swipe-feed/swipe-feed.screen.tsx` (화면 구조)
- 기존 패턴 참조: `src/domain/meme/meme.usecase.ts` (useQuery 패턴)
- 기존 패턴 참조: `src/data/meme/meme.query-key.ts` (쿼리 키 팩토리)
- 그리드: 기존 피드 그리드 컴포넌트 재사용 가능
- 탭: React Native TabView 또는 @react-navigation/material-top-tabs

### 클린 아키텍처 구현 순서
1. Domain: `domain/profile/` — ProfileEntity (Zod 스키마), IProfileRepository, usecase 훅
2. Data: `data/profile/` — ProfileMapper, ProfileRepositoryImpl, profileQueryKey
3. Presentation: `presentation/profile/` — ProfileScreen, ProfileHeader, ProfileContentGrid, ProfileTabBar
4. Navigation: RootStackParamList에 Profile 화면 추가

## Acceptance Criteria
- [ ] MY 탭에서 내 프로필 화면 진입 가능
- [ ] 프로필 헤더에 이미지, 닉네임, 팔로워/팔로잉/재생성 카운트 표시
- [ ] 3탭 전환 가능 (게시물/비공개/좋아요)
- [ ] 각 탭 그리드 콘텐츠 무한 스크롤
- [ ] 그리드 아이템 탭 → 세로 스와이프 피드 진입
- [ ] 타인 프로필은 게시물 탭만 노출

## QA Checklist
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
