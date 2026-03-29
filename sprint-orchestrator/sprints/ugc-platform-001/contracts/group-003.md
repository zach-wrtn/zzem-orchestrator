# Sprint Contract: Group 003 — Likes

## Scope
- Tasks: 003-likes-api (BE), 003-likes-ui (FE)
- Endpoints: PUT /likes, GET /likes/me
- PRD: US3 (AC 3.1~3.3)
- Depends on: Group 002 (Feed Publish — ContentItem에 likeCount, isLiked 필드)

## Done Criteria
- [ ] DC-1: PUT /likes에 contentId 전송 시 좋아요 토글 (좋아요 추가/제거) 되고 isLiked + likeCount 반환
- [ ] DC-2: 같은 contentId로 연속 PUT 시 좋아요 → 취소 → 좋아요 순환. likeCount는 atomic increment/decrement ($inc/$dec)로 관리하며, 동시 요청 시에도 최종 카운트가 정확해야 한다
- [ ] DC-3: 셀프 좋아요 (본인 콘텐츠) 허용 — 에러 없이 정상 동작
- [ ] DC-4: 존재하지 않는 contentId로 PUT /likes 시 404 응답
- [ ] DC-5: GET /likes/me → 좋아요한 콘텐츠 목록, 좋아요 시점 내림차순, cursor pagination. ContentItem에 owner 필드 포함. 좋아요한 콘텐츠가 삭제(soft delete)된 경우 해당 항목은 제외된다
- [ ] DC-6: 좋아요 수: 실제 숫자 그대로 반환 (축약 없음), 0일 때도 likeCount=0 반환
- [ ] DC-7: 좋아요 추가 시 `content.liked` 이벤트 발행 (payload: `{ userId, contentId, timestamp }`). 좋아요 취소 시 `content.unliked` 이벤트 발행 (동일 payload). Transport: EventEmitter (Kafka 연동은 추후)
- [ ] DC-8: 인증 없이 PUT /likes → 401
- [ ] DC-9: GET /contents/me?tab=liked는 내부적으로 Like 도메인의 findLikedByUser를 호출하여 ContentItem 목록을 반환한다. GET /likes/me와 동일한 쿼리 로직 + ContentListResponse 형식
- [ ] DC-10: FE 세로 스와이프에서 heart 아이콘 탭 시 Like API 호출 + 아이콘 상태 토글 (filled/outline)
- [ ] DC-11: FE 더블탭은 좋아요 추가 전용이다. 이미 좋아요 상태인 경우 애니메이션만 재생하고 API 호출하지 않는다. 미좋아요 상태에서 더블탭 시 DoubleTapLikeOverlay 애니메이션 + 좋아요 추가
- [ ] DC-12: FE 좋아요 수가 세로 스와이프에서 실제 숫자로 표시 (0 포함, 축약 없음)
- [ ] DC-13: FE 그리드 카드에 좋아요 수 표시
- [ ] DC-14: FE 프로필 좋아요 탭에 좋아요한 콘텐츠가 좋아요 시점 최신순으로 표시
- [ ] DC-15: FE 좋아요 탭에서 콘텐츠 탭 시 해당 탭 콘텐츠만으로 세로 스와이프 진입
- [ ] DC-16: FE 좋아요 토글 시 현재 SwipeFeed 아이템의 isLiked/likeCount를 즉시 반영 (optimistic). 실패 시 롤백 + 에러 토스트. 관련 쿼리 캐시 무효화(invalidateQueries)는 mutation onSuccess에서 수행
- [ ] DC-17: FE 비로그인 유저가 좋아요 시도 시 로그인 화면으로 이동
- [ ] DC-18: 비공개 콘텐츠 좋아요: 본인의 비공개 콘텐츠에 셀프 좋아요 허용. 타인의 비공개 콘텐츠는 접근 경로가 없으므로 PUT /likes 시 404 반환 (존재 노출 방지)

## Verification Method
- DC-1~4: Controller → DomainService 토글 로직 추적. Like 엔티티 생성/삭제 + atomic $inc/$dec 확인
- DC-5: Like 테이블 → Content JOIN → Profile JOIN 쿼리. deletedAt 필터링 확인. 정렬: Like.createdAt DESC
- DC-6: likeCount 반환 시 변환/축약 로직 없음 확인
- DC-7: Like 생성 후 `this.eventEmitter.emit('content.liked', { userId, contentId, timestamp })` 호출 확인. 취소 시 `content.unliked` 확인
- DC-9: GET /contents/me?tab=liked 핸들러에서 Like 도메인 서비스 호출 추적. 응답 형식이 ContentListResponse와 일치하는지 확인
- DC-10~11: SwipeFeedActions에서 heart 탭 → Like API 호출. DoubleTapLikeOverlay에서 isLiked 체크 → 미좋아요 시에만 API 호출
- DC-12~13: likeCount 렌더링 시 `{likeCount}` 직접 표시 (formatting 없음)
- DC-14~15: Profile 좋아요 탭 → useInfiniteQuery → 그리드 → SwipeFeed 진입
- DC-16: useMutation onMutate에서 현재 아이템 isLiked/likeCount 즉시 변경. onError에서 context 복원. onSuccess에서 invalidateQueries
- DC-17: auth guard 체크 → navigation.navigate("Login")
- DC-18: DomainService에서 content 조회 시 isPublished=false && ownerId != userId → NotFoundException

### Edge Cases to Test
- 동시에 같은 콘텐츠에 좋아요 요청 (race condition) → atomic $inc/$dec로 정확성 보장 (DC-2)
- 좋아요 후 콘텐츠가 삭제된 경우 → GET /likes/me에서 필터링 (DC-5)
- 차단 유저 콘텐츠 좋아요 필터링은 Group 006 범위 (Group 003에서 미적용 허용)
- 이미 좋아요 상태에서 더블탭 → 애니메이션만, API 미호출 (DC-11)

## Sign-off
- 2026-03-29: Evaluator reviewed (8 objections), Sprint Lead revised (A-1, A-2, E-1~E-4, U-1, S-1 all addressed)
- 2026-03-29: Evaluator approved — all 18 DCs specific, testable, aligned
