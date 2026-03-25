# Task: 001-profile-screen

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US2 프로필 (AC 2.1, AC 2.2, AC 2.3, AC 2.5), US7 타 유저 프로필 (AC 7.1)
- API Contract Reference:
  - GET /profiles/me (getMyProfile)
  - GET /profiles/{userId} (getUserProfile)
  - GET /profiles/{userId}/contents (getUserContents)
  - GET /profiles/me/share-url (getProfileShareUrl)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 없음
- Parallel With: backend/001-profile-api, backend/001-nickname-auto-generation, app/001-feed-publish-toggle-cta, app/001-profile-edit-screen

## Objective
MY 탭에 프로필 화면을 구축한다. 내 프로필은 게시물/비공개/좋아요 3개 탭으로 구성되며, 타 유저 프로필은 게시물 탭만 노출한다. 프로필 공유, 콘텐츠 탭 → 세로 스와이프 진입 기능을 포함한다.

## Specification

### Design Tokens
- **ProfileHeader**: profileImage 80×80 circle, gap 8
- **카운트 영역**: Typo.Body2 (#8E8E8E 라벨) + Typo.Title3 (#262626 숫자), gap 24
- **ContentGrid**: 3열, gap 2, aspectRatio 1:1 (정사각형 썸네일)
- **ContentGridItem 좋아요 수**: Typo.Caption (#FFFFFF, 그림자), position absolute bottom-left
- **탭 active indicator**: height 2, bg #262626
- **스켈레톤 placeholder**: bg #F5F5F5, shimmer animation

### Screens / Components
- `ProfileScreen` — 프로필 메인 화면 (MY 탭 또는 타 유저 프로필)
- `ProfileHeader` — 프로필 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트 영역
- `ProfileContentTabs` — 탭 전환 컴포넌트 (게시물, 비공개, 좋아요)
- `ContentGrid` — 콘텐츠 그리드 레이아웃 (썸네일 목록)
- `ContentGridItem` — 개별 그리드 아이템 (썸네일, 좋아요 수)
- `ProfileShareButton` — 프로필 공유 버튼
- `ProfileEditButton` — 프로필 편집 진입 버튼

### User Interactions
1. 하단 MY 탭 → ProfileScreen 진입 (내 프로필, GET /profiles/me)
2. 피드/검색에서 유저 프로필 이미지 탭 → ProfileScreen 진입 (타 유저, GET /profiles/{userId})
3. 내 프로필: 게시물(공개)/비공개/좋아요 3개 탭 전환 → GET /profiles/{userId}/contents?tab={tab} 호출
4. 타 유저 프로필: 게시물(공개) 탭만 노출, 비공개/좋아요 탭 미노출
5. 그리드 콘텐츠 탭 → 해당 탭 스코프의 세로 스와이프 피드 진입
6. 프로필 공유 버튼 → GET /profiles/me/share-url → OS 공유 시트 호출 (딥링크 URL)
7. 프로필 편집 버튼 → 프로필 편집 화면 navigate

### Business Rules
1. 프로필 헤더: 프로필 이미지, 닉네임, 팔로워 수, 팔로잉 수, 재생성된 횟수 표시
2. "재생성된" = 내 공개 콘텐츠가 타 유저에 의해 재생성된 횟수 (regeneratedCount)
3. 내 프로필 3개 탭: 게시물(공개), 비공개, 좋아요
4. 타 유저 프로필: 게시물 탭만 노출
5. 콘텐츠 정렬: 게시물/비공개 탭은 생성일 내림차순, 좋아요 탭은 좋아요 누른 시점 최신순
6. 좋아요 수 표시: 그리드에서 실제 숫자 그대로 노출 (축약 없음, 0일 때도 노출)
7. 프로필 공유 시 OG Image 미포함, 단순 딥링크로만 동작
8. 커서 기반 페이지네이션으로 콘텐츠 목록 로드

## Interaction States

### ProfileScreen
- **Loading**: 스켈레톤 UI (프로필 이미지 원형 + 카운트 3개 placeholder + 그리드 3열 placeholder)
- **Error**: 풀스크린 에러 뷰 + "다시 시도" 버튼
- **Partial**: 헤더 로드 완료 + 그리드 영역 로딩 스피너 (탭 전환 시)
- **404 (타 유저)**: "존재하지 않는 프로필입니다" + 뒤로가기 버튼

### ContentGrid Empty States
- **게시물 탭 (empty)**: 일러스트 + "아직 공개한 콘텐츠가 없어요" + [콘텐츠 만들기] primary CTA
- **비공개 탭 (empty)**: 일러스트 + "비공개 콘텐츠가 없어요" + "콘텐츠를 만들면 여기에 나타나요" (CTA 없음)
- **좋아요 탭 (empty)**: 일러스트 + "아직 좋아요한 콘텐츠가 없어요" + [피드 탐색하기] primary CTA
- **타 유저 게시물 탭 (empty)**: "아직 공개한 콘텐츠가 없어요" (CTA 없음)

### ContentGrid Loading
- **그리드 스켈레톤**: 3열 × 3행 placeholder (탭 전환 시)
- **무한 스크롤 로딩**: 하단 스피너
- **이미지 로드 실패**: 개별 그리드 아이템 placeholder 이미지 유지

## Implementation Hints
- 기존 패턴 참조: swipe-feed의 FlatList/FlashList 패턴, credit 화면의 탭 구조
- Domain: Profile 엔티티 (Zod), useGetMyProfile / useGetUserProfile / useGetUserContents 훅, ProfileRepository 인터페이스
- Data: ProfileDto namespace, ProfileMapper static class, profileRepositoryImpl, profileQueryKeys
- Presentation: ProfileScreen, ProfileViewModel (useProfileViewModel)
- Navigation: MY 탭 → ProfileScreen, 콘텐츠 탭 시 SwipeFeedScreen에 scoped params 전달
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] MY 탭에서 내 프로필 화면이 정상 로드된다
- [ ] 프로필 헤더에 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트가 표시된다
- [ ] 내 프로필에서 게시물/비공개/좋아요 3개 탭이 노출된다
- [ ] 타 유저 프로필에서 게시물 탭만 노출된다
- [ ] 각 탭의 콘텐츠가 올바른 정렬 순서로 그리드에 표시된다
- [ ] 그리드 콘텐츠 탭 시 해당 탭 스코프의 세로 스와이프 피드로 진입한다
- [ ] 프로필 공유 버튼이 OS 공유 시트를 호출한다
- [ ] 프로필 편집 버튼이 편집 화면으로 navigate한다
- [ ] 커서 기반 페이지네이션이 정상 동작한다 (무한 스크롤)

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
