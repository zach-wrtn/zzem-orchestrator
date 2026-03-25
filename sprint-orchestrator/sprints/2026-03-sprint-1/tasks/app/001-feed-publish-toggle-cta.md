# Task: 001-feed-publish-toggle-cta

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US1 피드 공개 (AC 1.1, AC 1.3, AC 1.4, AC 1.5, AC 1.6), 비즈니스 룰 - 콘텐츠 공개 규칙
- API Contract Reference:
  - PUT /contents/{contentId}/publish (toggleContentPublish)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 없음
- Parallel With: backend/001-content-publish-status, app/001-profile-screen, app/001-profile-edit-screen

## Objective
기존 세로 스와이프 피드에 공개/비공개 토글 버튼과 CTA 분기 로직을 추가한다. 본인 콘텐츠에는 게시 토글과 "다시 생성하기" CTA를, 타인 콘텐츠에는 "템플릿 사용하기" CTA를 노출하며, 커스텀 프롬프트 콘텐츠의 공개 시도 시 토스트 안내를 제공한다.

## Specification

### Screens / Components
- `PublishToggleButton` — 세로 스와이프 피드 내 본인 콘텐츠용 공개/비공개 토글 버튼
- `UnpublishConfirmBottomSheet` — 비공개 전환 확인 바텀시트 ("비공개로 전환하시겠습니까?")
- `FeedCtaButton` — CTA 버튼 컴포넌트 (분기 로직 포함)
- `AiContentLabel` — "AI가 만드는 컨텐츠예요" 상단 라벨
- 기존 swipe-feed 화면 수정

### User Interactions
1. 세로 스와이프 피드 진입 시 콘텐츠 상단에 "AI가 만드는 컨텐츠예요" 라벨이 항상 노출된다
2. 본인 콘텐츠인 경우 게시 토글 버튼이 노출된다
3. 토글 ON→OFF 클릭 시 `UnpublishConfirmBottomSheet`가 노출되고, 확인 시 PUT /contents/{contentId}/publish (isPublished: false) 호출
4. 토글 OFF→ON 클릭 시 즉시 PUT /contents/{contentId}/publish (isPublished: true) 호출
5. 커스텀 프롬프트 콘텐츠에서 토글 ON 시도 시 "공개할 수 없습니다" 토스트 노출 (API 400 응답 핸들링)
6. 타인 콘텐츠 하단 CTA: "템플릿 사용하기" → 해당 필터/프리셋으로 생성 화면 진입
7. 본인 콘텐츠 하단 CTA: "다시 생성하기" → 동일 필터/프리셋으로 재생성

### Business Rules
1. 콘텐츠 소유자 ID와 현재 유저 ID를 비교하여 토글 노출 여부 및 CTA 유형을 분기한다
2. 커스텀 프롬프트(generationType: "custom-prompt") 콘텐츠는 공개 전환 불가
3. 비공개 전환 시 반드시 확인 바텀시트를 거친다
4. 세로 스와이프 상단 "AI가 만드는 컨텐츠예요" 라벨은 투명성 정책으로 제거 불가 — 항상 노출
5. 풀스크린 비율 정책: cover (크롭) 방식으로 4:5, 9:16 세로형 비율 지원

## Interaction States

### PublishToggle
- **Loading (API 호출 중)**: 토글 버튼 disabled + 스피너 (낙관적 업데이트 적용, 실패 시 롤백)
- **Error (토글 실패)**: 토스트 "변경에 실패했어요. 다시 시도해 주세요" + 토글 원래 상태 복원
- **커스텀 프롬프트 공개 시도**: 토스트 "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다"

### UnpublishConfirmBottomSheet
- **확인 중**: "비공개로 전환" 버튼 로딩 상태

## Implementation Hints
- 기존 패턴 참조: swipe-feed 도메인의 기존 like/favorite 토글 패턴, meme-viewer 컴포넌트
- ContentItem 스키마의 `isPublished`, `generationType`, `userProfile.userId` 필드 활용
- React Query mutation으로 publish toggle API 호출, 낙관적 업데이트 적용
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] 본인 콘텐츠에 게시 토글 버튼이 노출된다
- [ ] 타인 콘텐츠에는 게시 토글 버튼이 노출되지 않는다
- [ ] 비공개 전환 시 확인 바텀시트가 노출되고 확인 후 API가 호출된다
- [ ] 커스텀 프롬프트 콘텐츠 공개 시도 시 "공개할 수 없습니다" 토스트가 노출된다
- [ ] 타인 콘텐츠 CTA = "템플릿 사용하기", 본인 콘텐츠 CTA = "다시 생성하기"
- [ ] CTA 탭 시 올바른 필터/프리셋 정보가 생성 화면에 전달된다
- [ ] "AI가 만드는 컨텐츠예요" 라벨이 세로 스와이프 피드에 항상 노출된다
- [ ] 풀스크린 콘텐츠가 cover 방식으로 렌더링된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
