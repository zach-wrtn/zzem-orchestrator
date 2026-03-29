# Task: 003-likes-api

## Target
wrtn-backend/apps/meme-api

## Context
- PRD US3: 좋아요 (AC 3.1~3.3)
- 기존 Favorite 모듈 존재 (toggle favorite, target type: filter/content/custom-prompt-content)
- 좋아요 카운트 표시 + 좋아요 탭 목록 조회 필요
- API Contract: PUT /likes, GET /likes/me

## Objective
콘텐츠 좋아요 토글 API와 좋아요한 콘텐츠 목록 조회 API를 구현한다. 기존 Favorite 시스템을 확장하거나 별도 Like 도메인을 구현한다.

## Specification

### Endpoints (api-contract.yaml 참조)
- `PUT /likes` — 좋아요 토글 (LibUserGuard)
- `GET /likes/me` — 좋아요한 콘텐츠 목록, 좋아요 시점 내림차순 (LibUserGuard)

### Data Model
- Like 엔티티: userId, contentId, createdAt
- ContentItem 응답에 likeCount, isLiked 필드 포함
- 기존 Favorite와의 관계: 기존 Favorite(filter 대상)과 Like(content 대상)는 별도 도메인이 될 수 있음

### Business Rules
- 셀프 좋아요 허용
- 좋아요 수: 실제 숫자 그대로 노출 (축약 없음), 0일 때도 표시
- 좋아요 데이터: 추천 시스템에 시그널로 전달
- 페르소나 콘텐츠 좋아요: 가능
- 차단 유저 좋아요: DB에 유지, 노출만 차단 (Group 006에서 필터링)

### Implementation Hints
- 기존 Favorite 도메인의 toggle + statistic 패턴 참조
- ContentStatistic 또는 별도 카운터로 likeCount 관리
- 추천 시그널 전달: EventEmitter 또는 Kafka (transport는 구현 세부사항)

## Acceptance Criteria
- [ ] `PUT /likes` 에 contentId 전송 시 좋아요 토글되고 isLiked + likeCount 반환
- [ ] 좋아요 → 취소 → 좋아요 반복 시 likeCount가 정확하게 증감한다
- [ ] 셀프 좋아요 (본인 콘텐츠)가 정상 동작한다
- [ ] `GET /likes/me` 호출 시 좋아요 시점 내림차순으로 ContentItem 목록 반환
- [ ] `GET /likes/me` 가 cursor pagination을 지원한다
- [ ] 존재하지 않는 contentId로 좋아요 시도 시 적절한 에러 응답
- [ ] 좋아요 발생 시 추천 시스템에 전달할 이벤트/시그널이 발행된다
- [ ] 인증 없이 좋아요 시도 시 401 응답
