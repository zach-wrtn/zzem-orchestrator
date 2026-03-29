# Task: 002-feed-publish-ui

## Target
app-core-packages/apps/MemeApp

## Context
- PRD US1: 피드 공개 (AC 1.1~1.6)
- Group 001에서 프로필 3탭 구조가 구현됨 → 탭별 콘텐츠 연동
- 기존 SwipeFeed 화면에 공개/비공개 토글 UI 추가
- API Contract: PATCH /contents/{contentId}/visibility, GET /contents/me

## Objective
프로필 탭별 콘텐츠 조회 연동, 세로 스와이프에서 공개/비공개 토글 UI, CTA 버튼 분기를 구현한다.

## Specification

### Screens / Components
- **ProfileScreen 탭 콘텐츠 연동**: Group 001의 빈 탭에 실제 API 연결
  - 게시물 탭: GET /contents/me?tab=published
  - 비공개 탭: GET /contents/me?tab=private
  - 좋아요 탭: GET /contents/me?tab=liked (Group 003 likes API 필요, 일단 빈 상태 유지 가능)
- **PublishToggle**: 세로 스와이프 내 게시 토글 컴포넌트
  - 내 콘텐츠일 때만 표시
  - OFF → ON: 즉시 전환
  - ON → OFF: 확인 바텀시트 노출 후 전환
- **UnpublishConfirmSheet**: 비공개 전환 확인 바텀시트
- **CTA 버튼 분기**: 세로 스와이프 하단
  - 타인 콘텐츠: "템플릿 사용하기" → 필터 생성 화면
  - 내 콘텐츠: "다시 생성하기" → 동일 필터 재생성
- **커스텀 프롬프트 안내**: 게시 버튼 탭 시 "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다" 토스트

### Data Flow
- Domain: `useToggleContentVisibilityUseCase()`, `useGetMyContentsUseCase(tab)`
- API: contentRepository.toggleVisibility(), contentRepository.getMyContents()
- Optimistic update: 토글 시 즉시 UI 반영, 실패 시 롤백

### Implementation Hints
- 기존 SwipeFeedActions 컴포넌트 확장
- 기존 `useToggleFavoriteUseCase()` 패턴 참고 (optimistic update)
- 프로필 탭 콘텐츠 → `useInfiniteQuery` + `flatMapInfiniteData` 패턴

## Acceptance Criteria
- [ ] 프로필 게시물 탭에 공개 콘텐츠가 그리드로 표시된다
- [ ] 프로필 비공개 탭에 비공개 콘텐츠가 그리드로 표시된다
- [ ] 프로필 탭에서 콘텐츠 탭 시 해당 탭 콘텐츠만으로 세로 스와이프 진입한다
- [ ] 세로 스와이프에서 내 콘텐츠일 때 게시 토글이 표시된다
- [ ] 게시 토글 OFF→ON 전환 시 즉시 공개 처리된다
- [ ] 게시 토글 ON→OFF 전환 시 확인 바텀시트가 노출되고, 확인 후 비공개 전환된다
- [ ] 커스텀 프롬프트 콘텐츠에서 게시 버튼 탭 시 안내 메시지가 표시된다
- [ ] 타인 콘텐츠에서 CTA = "템플릿 사용하기", 내 콘텐츠에서 CTA = "다시 생성하기"
- [ ] 각 탭의 콘텐츠 목록이 무한 스크롤로 동작한다
