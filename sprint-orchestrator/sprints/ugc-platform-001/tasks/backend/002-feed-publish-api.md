# Task: 002-feed-publish-api

## Target
wrtn-backend/apps/meme-api

## Context
- PRD US1: 피드 공개 (AC 1.1~1.6)
- 기존 GenMeme/Content 엔티티에 공개/비공개 상태 추가 필요
- 기존 Feed 모듈의 grid/swipe API 확장
- API Contract: PATCH /contents/{contentId}/visibility, GET /contents/me, GET /contents/{userId}/published

## Objective
콘텐츠 공개/비공개 전환 API, 내 콘텐츠 탭별 조회 API, 타유저 공개 콘텐츠 조회 API를 구현한다.

## Specification

### Endpoints (api-contract.yaml 참조)
- `PATCH /contents/{contentId}/visibility` — 공개/비공개 전환 (LibUserGuard)
- `GET /contents/me?tab={published|private|liked}` — 내 콘텐츠 목록 (LibUserGuard)
- `GET /contents/{userId}/published` — 타유저 공개 콘텐츠 (OptionalUserGuard)

### Data Model
- Content/GenMeme 엔티티 확장: isPublished (boolean), publishedAt (Date), isCustomPrompt (boolean)
- 기능 업데이트 이전 콘텐츠: isPublished = false (마이그레이션)
- 업데이트 이후 생성 콘텐츠: isPublished = true (기본값, 커스텀 프롬프트 제외)

### Business Rules
- 커스텀 프롬프트 결과물: isPublished = false 고정, 공개 전환 시도 시 400
- 본인 콘텐츠만 전환 가능 (소유자 검증), 아니면 403
- 공개 전환(ON): 즉시 처리, 확인 불필요
- 비공개 전환(OFF): API는 즉시 처리 (확인 UI는 FE 담당)
- 콘텐츠 정렬: 생성일 내림차순 (좋아요 탭은 좋아요 시점 내림차순)
- Cursor pagination (기존 CursorRequestDto/CursorResponseDto 패턴)

### Implementation Hints
- 기존 Content/GenMeme persistence 패턴 참조
- 기존 FeedRecommendation과의 연동 고려 (공개 콘텐츠만 피드 노출)

## Acceptance Criteria
- [ ] `PATCH /contents/{contentId}/visibility` 에 `{isPublished: true}` 전송 시 콘텐츠가 공개로 전환되고 200 반환
- [ ] 커스텀 프롬프트 콘텐츠에 공개 전환 시도 시 400 응답 + 에러 메시지
- [ ] 타인 콘텐츠에 전환 시도 시 403 응답
- [ ] 최초 공개 시 paybackInfo 필드가 응답에 포함된다 (paybackRate + 안내 메시지)
- [ ] `GET /contents/me?tab=published` 호출 시 공개 콘텐츠만 생성일 내림차순으로 반환
- [ ] `GET /contents/me?tab=private` 호출 시 비공개 콘텐츠만 생성일 내림차순으로 반환
- [ ] `GET /contents/me?tab=liked` 호출 시 좋아요한 콘텐츠가 좋아요 시점 내림차순으로 반환
- [ ] `GET /contents/{userId}/published` 호출 시 해당 유저의 공개 콘텐츠만 반환
- [ ] 각 목록 API는 cursor pagination을 지원하며 nextCursor, hasMore가 정확하다
- [ ] 기존 콘텐츠는 isPublished=false 상태를 유지한다 (마이그레이션 스크립트 또는 default 처리)
