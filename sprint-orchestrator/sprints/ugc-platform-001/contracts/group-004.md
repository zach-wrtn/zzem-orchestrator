# Sprint Contract: Group 004 — Follow

## Scope
- Tasks: 004-follow-api (BE), 004-follow-ui (FE)
- Endpoints: POST/DELETE /follows, GET /follows/me/followers, GET /follows/me/followings, GET /follows/status/{targetUserId}
- PRD: US6 (AC 6.1~6.3)
- Depends on: Group 001 (Profile — followerCount, followingCount)
- FE 범위 확장: OtherProfileScreen 최소 구현 포함 (프로필 헤더 + FollowButton + 카운터). 차단/신고/의견 보내기는 Group 006/007

## Done Criteria
- [ ] DC-1: POST /follows에 targetUserId 전송 시 팔로우 생성되고 followStatus + targetUserId의 followerCount/followingCount 반환. 요청자의 카운터는 별도 프로필 캐시 무효화로 갱신
- [ ] DC-2: 자기 자신 팔로우 시도 시 400 응답
- [ ] DC-3: 이미 팔로우 중인 유저에 재팔로우 시도 시 멱등하게 현재 상태 반환 (에러 없이)
- [ ] DC-4: DELETE /follows에 targetUserId 전송 시 팔로우 해제되고 업데이트된 상태 반환. 이미 언팔로우 상태인 경우 멱등하게 현재 상태 반환 (에러 없이)
- [ ] DC-5: GET /follows/me/followers → 닉네임 가나다순 정렬 (MongoDB collation locale:'ko' 사용), offset pagination 허용 (cursor 기반은 추후 최적화). 각 항목에 followStatus 포함
- [ ] DC-6: GET /follows/me/followings → 닉네임 가나다순 정렬 (동일 방식), offset pagination 허용. 각 항목에 followStatus 포함
- [ ] DC-7: 팔로워/팔로잉 목록 각 항목에 userId, nickname, profileImageUrl, followStatus 포함
- [ ] DC-8: GET /follows/status/{targetUserId} → 정확한 followStatus(none/following/follower/mutual) 반환
- [ ] DC-9: 팔로우/언팔로우 시 양쪽 UserProfile의 followerCount/followingCount가 atomic $inc/$dec로 업데이트됨
- [ ] DC-10: 팔로우 발생 시 `user.followed` 이벤트 발행 (payload: { followerId, followeeId, timestamp }). 언팔로우 시 `user.unfollowed` 이벤트 발행. Transport: EventEmitter
- [ ] DC-11: 페르소나 계정 팔로우 허용 (UX 상 구분 없음)
- [ ] DC-12: 인증 없이 POST /follows → 401
- [ ] DC-13: 존재하지 않는 targetUserId로 POST/DELETE /follows 시 404 응답
- [ ] DC-14: FE FollowButton 컴포넌트: followStatus에 따라 none→"팔로우"(primary), following→"팔로잉"(secondary), mutual→"맞팔로우"(secondary)
- [ ] DC-15: FE FollowButton 탭 시 followStatus를 즉시 반영 (optimistic: none↔following, follower↔mutual). 실패 시 롤백 + 에러 토스트. 프로필 카운터는 mutation onSuccess에서 invalidateQueries로 갱신
- [ ] DC-16: FE 내 프로필 팔로워 카운트 탭 시 FollowerListScreen으로 이동
- [ ] DC-17: FE 내 프로필 팔로잉 카운트 탭 시 FollowingListScreen으로 이동
- [ ] DC-18: FE 팔로워/팔로잉 목록이 가나다순, 각 항목에 FollowButton 포함
- [ ] DC-19: FE 목록에서 유저 탭 시 OtherProfileScreen으로 이동
- [ ] DC-20: FE OtherProfileScreen 최소 구현: 프로필 헤더(이미지, 닉네임, 팔로워/팔로잉/재생성 카운트) + FollowButton + 게시물 그리드(GET /contents/{userId}/published). 팔로워/팔로잉 카운트는 숫자만 표시 (리스트 진입 불가, 탭 비활성)
- [ ] DC-21: FE 팔로우/언팔로우 후 프로필 카운터가 invalidateQueries로 갱신됨

## Verification Method
- DC-1~4: Controller → DomainService follow/unfollow 로직 추적. 멱등성: 기존 Follow 존재 체크 후 분기
- DC-5~7: Follow → Profile JOIN, MongoDB collation locale:'ko' 정렬, offset pagination
- DC-8: followerId/followeeId 양방향 조회 → 4가지 status 계산
- DC-9: Profile의 followerCount/followingCount atomic $inc/$dec 확인 (양쪽 프로필)
- DC-10: EventEmitter.emit 호출 확인
- DC-13: DomainService에서 targetUser 존재 체크 → NotFoundException
- DC-14: FE FollowButton에서 followStatus → 텍스트/스타일 매핑
- DC-15: useMutation onMutate → optimistic followStatus 전환, onError → rollback
- DC-16~17: ProfileScreen 카운터 onPress → navigation.navigate
- DC-19: 목록 항목 onPress → navigation.navigate('OtherProfile', { userId })
- DC-20: OtherProfileScreen에 GET /profiles/{userId} + GET /contents/{userId}/published 연동 확인. 카운터 onPress disabled

### Edge Cases to Test
- 존재하지 않는 targetUserId → 404 (DC-13)
- 언팔로우 상태에서 재언팔로우 시도 → 멱등 (DC-4)
- 팔로워/팔로잉 0명 → 빈 목록 + hasMore=false
- 맞팔로우 → 한쪽 언팔로우 → followStatus 정확 전환 (mutual → follower or following)
- 차단 유저 팔로우 처리는 Group 006 범위 (Group 004에서 미적용 허용)

## Sign-off
- 2026-03-29: Evaluator reviewed (7 objections), Sprint Lead revised (A-1, A-2, E-1~E-4, S-1 all addressed)
- 2026-03-29: Evaluator approved — all 21 DCs specific, testable, aligned
