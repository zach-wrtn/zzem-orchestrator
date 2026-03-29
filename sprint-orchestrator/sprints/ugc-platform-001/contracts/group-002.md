# Sprint Contract: Group 002 — Feed Publish

## Scope
- Tasks: 002-feed-publish-api (BE), 002-feed-publish-ui (FE)
- Endpoints: PATCH /contents/{contentId}/visibility, GET /contents/me, GET /contents/{userId}/published
- PRD: US1 (AC 1.1~1.6)
- Depends on: Group 001 (Profile)

## Done Criteria
- [ ] DC-1: PATCH /contents/{contentId}/visibility에 {isPublished: true} 전송 시 콘텐츠가 공개로 전환되고 200 반환
- [ ] DC-2: 커스텀 프롬프트 콘텐츠에 isPublished: true 전송 시 400 응답 + "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다" 에러 메시지
- [ ] DC-3: 본인이 아닌 콘텐츠에 전환 시도 시 403 응답
- [ ] DC-4: 최초 공개 판단: publishedAt이 null → 최초 공개 → paybackInfo 반환 (paybackRate + 안내 메시지). publishedAt이 이미 존재 → 재공개 → paybackInfo=null. 비공개 전환 시 publishedAt은 유지됨. paybackRate 값은 하드코딩(0.01) 또는 config에서 가져오기 (Group 005에서 완전한 payback 로직 연동)
- [ ] DC-5: GET /contents/me?tab=published → 공개 콘텐츠만, 생성일 내림차순, cursor pagination. ContentItem 응답에 owner 필드(userId, nickname, profileImageUrl, isPersona)가 프로필 데이터와 함께 올바르게 반환됨
- [ ] DC-6: GET /contents/me?tab=private → 비공개 콘텐츠만, 생성일 내림차순, cursor pagination
- [ ] DC-7: GET /contents/me?tab=liked → liked 탭 쿼리 인프라 구현 (정렬 로직 포함). 좋아요 데이터가 Group 003 범위이므로 빈 목록 반환 허용. 정렬 정확성 검증은 Group 003 이후
- [ ] DC-8: GET /contents/{userId}/published → 해당 유저의 공개 콘텐츠만 반환, cursor pagination. 비인증 호출 시 ContentItem.isLiked=false로 반환. owner 필드 올바르게 반환됨
- [ ] DC-9: 스키마 default를 isPublished=false로 설정하여 기존 콘텐츠의 비공개 상태 보장. 필요 시 마이그레이션으로 기존 데이터 보정
- [ ] DC-10: 새 콘텐츠 생성 시 isPublished=true가 기본값. 커스텀 프롬프트 콘텐츠 생성 시에만 isPublished=false로 명시 설정
- [ ] DC-11: 인증 없이 PATCH /contents/{contentId}/visibility → 401
- [ ] DC-12: FE 프로필 게시물 탭에 공개 콘텐츠가 그리드로 표시됨
- [ ] DC-13: FE 프로필 비공개 탭에 비공개 콘텐츠가 그리드로 표시됨
- [ ] DC-14: FE 프로필 탭에서 콘텐츠 탭 시 해당 탭 콘텐츠만으로 세로 스와이프 진입. 검증: 탭 아이템 onPress → SwipeFeed navigation params에 탭 구분 전달 → SwipeFeed에서 해당 탭 API만 호출
- [ ] DC-15: FE 세로 스와이프에서 내 콘텐츠일 때 게시 토글 표시됨
- [ ] DC-16: FE 게시 토글 OFF→ON: 즉시 공개 처리 (확인 없음). API 실패 시 이전 상태로 롤백 + 에러 토스트
- [ ] DC-17: FE 게시 토글 ON→OFF: 확인 바텀시트 노출 → 확인 후 비공개 전환. API 실패 시 이전 상태로 롤백 + 에러 토스트
- [ ] DC-18: FE 커스텀 프롬프트 콘텐츠에서 게시 버튼 탭 시 안내 메시지 표시
- [ ] DC-19: FE 타인 콘텐츠 CTA = "템플릿 사용하기", 내 콘텐츠 CTA = "다시 생성하기" (소유자 ID 비교)
- [ ] DC-20: FE 각 탭 콘텐츠 목록이 무한 스크롤 동작
- [ ] DC-21: 삭제된 또는 존재하지 않는 contentId로 PATCH /visibility 시 404

## Verification Method
- DC-1~3: Controller에서 auth guard + 소유자 검증 + isCustomPrompt 체크 로직 추적
- DC-4: publishedAt null 체크 → paybackInfo 구조 반환 분기 확인. publishedAt이 비공개 전환 시 유지되는지 확인
- DC-5~8: 쿼리 필터 + 정렬 + cursor pagination + owner JOIN + isLiked 기본값 추적
- DC-9~10: 스키마 default 값 + 콘텐츠 생성 로직에서 isPublished 설정 확인
- DC-12~13: ProfileScreen의 탭별 useInfiniteQuery → API 호출 → 그리드 렌더링
- DC-14: 탭 아이템 onPress → SwipeFeed navigation params에 탭 구분 전달 → SwipeFeed에서 해당 탭 API만 호출
- DC-15~17: SwipeFeedActions에서 소유자 체크 → PublishToggle 표시 → toggle mutation + optimistic update + rollback on error
- DC-18: isCustomPrompt 체크 → 토스트/안내 표시
- DC-19: contentOwner.userId vs currentUserId 비교 → CTA 텍스트 분기
- DC-20: useInfiniteQuery + onEndReached → fetchNextPage
- DC-21: Controller/Service에서 contentId 존재 체크 → NotFoundException

### Edge Cases to Test
- 이미 공개인 콘텐츠에 isPublished: true 재전송 시 멱등 처리
- 이미 비공개인 콘텐츠에 isPublished: false 재전송 시 멱등 처리
- 삭제된 콘텐츠에 전환 시도 시 404 (DC-21)
- 콘텐츠가 0개인 탭 조회 시 빈 배열 + hasMore=false
- cursor가 만료/유효하지 않을 때 처리
- 차단 유저 콘텐츠 필터링은 Group 006 범위. Group 002에서는 block 필터링 미적용 허용
- 비인증 유저의 GET /contents/{userId}/published 호출 시 isLiked=false (DC-8)

## Sign-off
- 2026-03-29: Evaluator reviewed, Sprint Lead revised (A-1~A-3, E-1~E-4, U-1, S-1~S-2 addressed)
- 2026-03-29: Evaluator approved — all 21 DCs specific, testable, aligned
