# APP-006: Block, Report & Social UI

## Target
- **User Story**: US7 (타 유저 프로필 및 사회적 기능)
- **Acceptance Criteria**: AC 7.1, 7.2, 7.3, 7.4, 7.5
- **API Dependency**: BE-006 (Block & Report API), BE-001 (Profile API)

## Context
타 유저 프로필 화면, 차단/차단해제, 신고, 의견 보내기. 더보기 메뉴에서 차단/신고 진입. 차단된 프로필 진입 시 차단 상태 뷰. 페르소나 계정도 동일 UX.

## Objective
타 유저 프로필 및 사회적 기능 UI 구현.

## Specification

### Screens / Components

#### OtherUserProfileScreen
- 타 유저 프로필 화면
- 프로필 헤더: 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트
- 팔로워/팔로잉 숫자만 표시 (리스트 조회 불가)
- FollowButton (APP-004)
- 의견 보내기 아이콘 버튼 (말풍선) → OpinionScreen
- 게시물 탭만 노출 (비공개/좋아요 탭 없음)
- 더보기 메뉴 (점 3개):
  - 프로필 URL 복사
  - 차단하기 → BlockConfirmSheet
  - 신고하기 → ReportSheet
- 콘텐츠 그리드 탭 → 세로 스와이프 진입
- API: `GET /profiles/:userId`, `GET /profiles/:userId/contents`

#### BlockConfirmSheet
- 차단 확인 바텀시트
- "이 유저를 차단하시겠습니까?"
- "차단하면 상대방의 콘텐츠를 볼 수 없습니다"
- [취소] [차단]
- API: `POST /blocks`

#### BlockedProfileView
- 차단된 유저 프로필 진입 시 표시
- "이 계정을 차단했어요"
- [차단 해제] 버튼
- 차단 해제 시 → 정상 프로필로 전환
- API: `DELETE /blocks/:targetUserId`

#### ReportSheet
- 신고 바텀시트/화면
- 신고 사유 선택 (spam/inappropriate/harassment/other)
- 자유 텍스트 입력 (100자, 필수)
- [신고하기] 버튼
- 완료 시 확인 토스트
- API: `POST /reports`

#### OpinionScreen
- 의견 보내기 화면
- 자유 텍스트 입력 (300자)
- 관련 콘텐츠 ID 자동 첨부 (진입 경로에 따라)
- [보내기] 버튼
- 완료 시 확인 토스트
- API: `POST /opinions`

### Data Flow
- OtherUserProfileScreen: `useQuery` → `GET /profiles/:userId` (followStatus, isBlocked 포함)
- isBlocked = true → BlockedProfileView 렌더링
- 콘텐츠: `useInfiniteQuery` → `GET /profiles/:userId/contents`
- 차단/신고/의견: `useMutation` → invalidate profile query

### Implementation Hints
- 바텀시트: `@wrtn/app-design-guide` BottomSheet
- 더보기 메뉴: ActionSheet 또는 BottomSheet
- React Navigation param으로 userId 전달
- 페르소나 계정: 동일 UX (구분 없음)

## Acceptance Criteria

### AC 7.1: 타 유저 프로필
- 프로필 정보 + 게시물 탭만 노출
- 더보기 메뉴: URL 복사, 차단, 신고
- 팔로워/팔로잉 숫자만 (리스트 미진입)

### AC 7.2: 차단
- BlockConfirmSheet 노출 후 차단 처리
- 차단 후 BlockedProfileView 표시
- 차단 해제 → 정상 프로필 전환
- 피드에서 차단 유저 콘텐츠 미노출

### AC 7.3: 신고
- 사유 선택 + 자유입력(100자) 필수
- 완료 토스트 표시

### AC 7.4: 의견 보내기
- 말풍선 아이콘 → OpinionScreen 이동
- 300자 텍스트 + contentId 전송

### AC 7.5: 페르소나 계정 처리
- 페르소나 프로필도 동일 UX
- 팔로우 가능
