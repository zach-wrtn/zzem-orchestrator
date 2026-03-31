# APP-002: Feed Publish UI

## Target
- **User Story**: US1 (피드 공개)
- **Acceptance Criteria**: AC 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
- **API Dependency**: BE-002 (Content Publish API)

## Context
콘텐츠 공개/비공개 토글, 피드 CTA 버튼 분기, 페이백 안내 모달, 풀스크린 미디어 비율 처리. 세로 스와이프 피드에서의 콘텐츠 공개 관련 UI.

## Objective
피드 공개 관련 UI 컴포넌트 구현.

## Specification

### Screens / Components

#### PublishToggle
- 세로 스와이프에서 내 콘텐츠 조회 시 노출
- 토글 ON = 공개, OFF = 비공개
- OFF 전환 시 확인 바텀시트:
  - "비공개로 전환하시겠습니까?"
  - "비공개 전환 시 피드에서 제거됩니다"
  - [취소] [확인]
- 커스텀 프롬프트 콘텐츠에서 ON 시도 시:
  - "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다" 토스트
- API: `PATCH /contents/:contentId/visibility`

#### FeedCta
- 세로 스와이프 하단 CTA 버튼
- 타인 콘텐츠: "템플릿 사용하기" → 필터/프리셋 생성 화면 진입
- 내 콘텐츠: "다시 생성하기" → 동일 필터 재생성
- API: `GET /contents/:contentId/cta` → ctaType + filterId 기반 분기
- 아이콘/스타일 분기

#### PaybackInfoModal
- 최초 콘텐츠 공개 시 1회성 모달
- "콘텐츠가 재생성될 때마다 생성 비용의 1%가 페이백됩니다"
- [확인] → 피드 전환 CTA
- API: `GET /payback/info` (hasSeen 체크), `POST /payback/info/seen`

#### FullscreenMedia
- 세로 스와이프 미디어 렌더링
- 지원 비율: 4:5, 9:16
- 표시 방식: cover (크롭)
- 16:9 디바이스에서 9:16 콘텐츠 → 좌우 크롭
- AI 콘텐츠 라벨: 상단 "AI가 만드는 컨텐츠예요" 항상 노출

### Data Flow
- PublishToggle: `useMutation` → `PATCH /contents/:contentId/visibility` → invalidate content queries
- FeedCta: `useQuery` → `GET /contents/:contentId/cta`
- PaybackInfoModal: `useQuery` → `GET /payback/info`, `useMutation` → `POST /payback/info/seen`

### Implementation Hints
- 바텀시트: `@wrtn/app-design-guide` BottomSheet 컴포넌트
- 토스트: 기존 토스트 시스템 활용
- CTA 내비게이션: React Navigation으로 생성 화면 진입
- 풀스크린: `resizeMode="cover"` + aspectRatio 계산

## Acceptance Criteria

### AC 1.1: 공개 기본 정책
- 새 필터 콘텐츠 → 공개 상태로 표시
- 기존 콘텐츠 → 비공개 상태

### AC 1.2: 페이백 바텀시트
- 최초 공개 시 PaybackInfoModal 1회 노출
- hasSeen 후 미노출

### AC 1.3: 비공개 전환
- 토글 OFF → 확인 바텀시트 → 확인 시 비공개
- 취소 시 토글 원복

### AC 1.4: 커스텀 프롬프트 결과물
- 커스텀 프롬프트 콘텐츠 공개 시도 → 토스트 에러 메시지

### AC 1.5: 풀스크린 비율 정책
- 세로형 비율 cover 크롭 렌더링
- AI 콘텐츠 라벨 항상 노출

### AC 1.6: 피드 CTA 버튼 분기
- 타인 콘텐츠: "템플릿 사용하기" 표시 + 올바른 화면 이동
- 내 콘텐츠: "다시 생성하기" 표시 + 올바른 화면 이동
