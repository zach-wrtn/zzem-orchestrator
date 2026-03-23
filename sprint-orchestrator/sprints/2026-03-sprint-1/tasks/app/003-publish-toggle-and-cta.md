# Task: 003 - 공개/비공개 토글 + 피드 CTA 분기

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/presentation/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US1 AC 1.3, AC 1.6
- API Contract Reference: PUT /contents/{contentId}/publish-status
- Dependencies: app/001 (프로필 화면), backend/001
- Parallel With: backend/004

## Objective
세로 스와이프 피드에서 공개/비공개 토글 기능과 CTA 버튼 분기(내 콘텐츠 vs 타인 콘텐츠)를 구현한다.

## Specification

### Input
- 세로 스와이프 피드에서 게시 토글 버튼 탭
- 세로 스와이프 피드 하단 CTA 버튼

### Output
- 토글: 비공개 확인 바텀시트 → 상태 변경
- CTA: 타인 콘텐츠 = "템플릿 사용하기", 내 콘텐츠 = "다시 생성하기"

### Business Rules
1. 비공개 전환 시 확인 바텀시트 노출 (확인/취소)
2. 공개 전환 시 바텀시트 없이 즉시 전환
3. 커스텀 프롬프트 콘텐츠에서 게시 버튼 탭 시 안내 토스트: "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다"
4. CTA 분기: 콘텐츠 소유자 ID vs 현재 유저 ID 비교
5. "템플릿 사용하기" → 해당 필터/프리셋으로 새 콘텐츠 생성 화면 진입
6. "다시 생성하기" → 동일 필터/프리셋으로 재생성

## Implementation Hints
- 기존 패턴 참조: `src/presentation/swipe-feed/swipe-feed.screen.tsx` (피드 화면)
- 기존 SwipeFeedFooter에 CTA 분기 로직 추가
- 바텀시트: 기존 BottomSheet 컴포넌트 활용
- useMutation으로 PUT /contents/{contentId}/publish-status 호출
- 성공 시 피드 + 프로필 캐시 무효화

### 클린 아키텍처 구현 순서
1. Domain: useUpdatePublishStatusUseCase (useMutation)
2. Data: contentRepository.updatePublishStatus()
3. Presentation: PublishToggleButton, UnpublishConfirmSheet, SwipeFeedCTA 수정
4. 기존 SwipeFeedScreen에 통합

## Acceptance Criteria
- [ ] 세로 스와이프에서 공개↔비공개 토글 가능
- [ ] 비공개 전환 시 확인 바텀시트 노출
- [ ] 커스텀 프롬프트에서 공개 시도 시 안내 토스트
- [ ] 타인 콘텐츠: "템플릿 사용하기" CTA 표시
- [ ] 내 콘텐츠: "다시 생성하기" CTA 표시
- [ ] CTA 탭 시 올바른 화면으로 네비게이션

## QA Checklist
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
